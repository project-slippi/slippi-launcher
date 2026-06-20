import type { BaseNewsItem, SourceId } from "main/content_management/news_feed/types";

export type NewsItem = BaseNewsItem & {
  source: SourceId;
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
