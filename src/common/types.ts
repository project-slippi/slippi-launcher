export type NewsItem = {
  id: string;
  source: "bluesky" | "medium" | "github";
  title: string;
  permalink: string;
  publishedAt: Date;
  subtitle?: string;
  imageUrl?: string;
  body?: string;
};

export const enum IsoValidity {
  VALID = "VALID",
  UNKNOWN = "UNKNOWN",
  INVALID = "INVALID",
  UNVALIDATED = "UNVALIDATED",
}

export const enum NatType {
  UNKNOWN = "UNKNOWN",
  NORMAL = "NORMAL",
  SYMMETRIC = "SYMMETRIC",
  FAILED = "FAILED",
}

export const enum Presence {
  UNKNOWN = "UNKNOWN",
  ABSENT = "ABSENT",
  PRESENT = "PRESENT",
  FAILED = "FAILED",
}

export type PortMapping = {
  upnp: Presence;
  natpmp: Presence;
};
