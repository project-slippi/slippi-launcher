import type { PortMapping } from "@common/types";
import { CgnatPresence, NatpmpPresence, NatType, UpnpPresence } from "@common/types";
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
  return { upnp: UpnpPresence.ABSENT, natpmp: NatpmpPresence.ABSENT } as PortMapping;
}

export async function cgnat(address: string): Promise<{ cgnat: CgnatPresence }> {
  if (!address) {
    return { cgnat: CgnatPresence.UNKNOWN };
  }

  return { cgnat: CgnatPresence.ABSENT };
}
