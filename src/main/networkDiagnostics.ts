import type { PortMapping } from "@common/types";
import { NatType, Presence } from "@common/types";
import { createPmpClient, createUpnpClient } from "@xmcl/nat-api";
import { gateway4async } from "default-gateway";
import Tracer from "nodejs-traceroute";
import { createServer, request } from "stun";

const STUN_SERVER_URL1 = "stun1.l.google.com:19302";
const STUN_SERVER_URL2 = "stun2.l.google.com:19302";

export async function getNetworkDiagnostics(): Promise<{
  address: string;
  cgnat: Presence;
  natType: NatType;
  portMapping: PortMapping;
}> {
  let address = "";
  let natType = NatType.FAILED;
  let portMapping = { upnp: Presence.FAILED, natpmp: Presence.FAILED };
  let cgnat = Presence.FAILED;
  try {
    ({ address, natType } = await getNatType());
    portMapping = await getPortMappingPresence();
    cgnat = await getCgnatPresence(address);
  } catch (err) {
    // just return what we have
  }
  return { address, cgnat, natType, portMapping };
}

async function getNatType(): Promise<{ address: string; natType: NatType }> {
  const stunServer = createServer({ type: "udp4" });
  const stunResponse1 = await request(STUN_SERVER_URL1, { server: stunServer });
  const stunResponse2 = await request(STUN_SERVER_URL2, { server: stunServer });
  const address1 = stunResponse1.getXorAddress();
  const address2 = stunResponse2.getXorAddress();
  stunServer.close();
  return { address: address1.address, natType: address1.port === address2.port ? NatType.NORMAL : NatType.SYMMETRIC };
}

async function getPortMappingPresence(): Promise<PortMapping> {
  let upnpPresence = Presence.UNKNOWN;
  const upnpClient = await createUpnpClient();
  const upnpPromise = upnpClient
    .externalIp()
    .then(() => {
      upnpPresence = Presence.PRESENT;
    })
    .catch(() => {
      upnpPresence = Presence.ABSENT;
    })
    .finally(() => {
      upnpClient.destroy();
    });

  let natpmpPresence = Presence.UNKNOWN;
  const pmpClient = await createPmpClient((await gateway4async()).gateway);
  const pmpPromise = new Promise((resolve, reject) => {
    // library does not use a timeout for NAT-PMP, so we do it ourselves.
    const timeout = setTimeout(() => {
      reject("NAT-PMP timeout");
    }, 1800); // same as library UPnP timeout
    pmpClient
      .externalIp()
      .then(resolve)
      .catch(reject)
      .finally(() => {
        clearTimeout(timeout);
      });
  })
    .then(() => {
      natpmpPresence = Presence.PRESENT;
    })
    .catch(() => {
      natpmpPresence = Presence.ABSENT;
    })
    .finally(() => {
      pmpClient.close();
    });

  await Promise.all([upnpPromise, pmpPromise]);
  return { upnp: upnpPresence, natpmp: natpmpPresence } as PortMapping;
}

async function getCgnatPresence(address: string): Promise<Presence> {
  return new Promise((resolve, reject) => {
    let hops = 0;
    const tracer = new Tracer();
    tracer.on("hop", () => {
      hops++;
    });
    const timeout = setTimeout(() => {
      if (hops > 1) {
        resolve(Presence.PRESENT);
      } else {
        reject("CGNAT timeout");
      }
    }, 9000);
    tracer.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0 && hops > 0) {
        resolve(hops === 1 ? Presence.ABSENT : Presence.PRESENT);
      } else {
        reject(code);
      }
    });
    tracer.trace(address);
  });
}
