import type { PortMapping } from "@common/types";
import { CgnatPresence, NatpmpPresence, NatType, UpnpPresence } from "@common/types";
import { createPmpClient, createUpnpClient } from "@xmcl/nat-api";
import { gateway4async } from "default-gateway";
import { createServer, request } from "stun";

export async function natType(): Promise<{ address: string; natType: NatType }> {
  const stunServer = createServer({ type: "udp4" });
  const stunResponse1 = await request("stun1.l.google.com:19302", { server: stunServer });
  const stunResponse2 = await request("stun2.l.google.com:19302", { server: stunServer });
  const address1 = stunResponse1.getXorAddress();
  const address2 = stunResponse2.getXorAddress();
  stunServer.close();
  return { address: address1.address, natType: address1.port === address2.port ? NatType.NORMAL : NatType.SYMMETRIC };
}

export async function portMapping(): Promise<PortMapping> {
  let upnpPresence = UpnpPresence.UNKNOWN;
  const upnpClient = await createUpnpClient();
  const upnpPromise = upnpClient
    .externalIp()
    .then(() => {
      upnpPresence = UpnpPresence.PRESENT;
    })
    .catch(() => {
      upnpPresence = UpnpPresence.ABSENT;
    })
    .finally(() => {
      upnpClient.destroy();
    });

  let natpmpPresence = NatpmpPresence.UNKNOWN;
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
      natpmpPresence = NatpmpPresence.PRESENT;
    })
    .catch(() => {
      natpmpPresence = NatpmpPresence.ABSENT;
    })
    .finally(() => {
      pmpClient.close();
    });

  await Promise.all([upnpPromise, pmpPromise]);
  return { upnp: upnpPresence, natpmp: natpmpPresence } as PortMapping;
}

export async function cgnat(address: string): Promise<{ cgnat: CgnatPresence }> {
  if (!address) {
    return { cgnat: CgnatPresence.UNKNOWN };
  }

  return { cgnat: CgnatPresence.ABSENT };
}
