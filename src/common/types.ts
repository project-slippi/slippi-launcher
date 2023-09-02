export type NewsItem = {
  id: string;
  title: string;
  permalink: string;
  publishedAt: string; // ISO string
  subtitle?: string;
  imageUrl?: string;
  body?: string;
};

export enum IsoValidity {
  VALID = "VALID",
  UNKNOWN = "UNKNOWN",
  INVALID = "INVALID",
  UNVALIDATED = "UNVALIDATED",
}

export enum NatType {
  UNKNOWN = "UNKNOWN",
  NORMAL = "NORMAL",
  SYMMETRIC = "SYMMETRIC",
}

export enum UpnpPresence {
  UNKNOWN = "UNKNOWN",
  ABSENT = "ABSENT",
  PRESENT = "PRESENT",
}

export enum NatpmpPresence {
  UNKNOWN = "UNKNOWN",
  ABSENT = "ABSENT",
  PRESENT = "PRESENT",
}

export type PortMapping = {
  upnp: UpnpPresence;
  natpmp: NatpmpPresence;
};

export enum CgnatPresence {
  UNKNOWN = "UNKNOWN",
  ABSENT = "ABSENT",
  PRESENT = "PRESENT",
}
