import type { PortMapping } from "@common/types";
import { CgnatPresence, NatpmpPresence, NatType, UpnpPresence } from "@common/types";

export async function natType(): Promise<{ address: string; natType: NatType }> {
  return { address: "127.0.0.1", natType: NatType.NORMAL };
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
