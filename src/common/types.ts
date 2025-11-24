export type NewsItem = {
  id: string;
  source: "bluesky" | "medium" | "github";
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
  FAILED = "FAILED",
}

export enum Presence {
  UNKNOWN = "UNKNOWN",
  ABSENT = "ABSENT",
  PRESENT = "PRESENT",
  FAILED = "FAILED",
}

export type PortMapping = {
  upnp: Presence;
  natpmp: Presence;
};
