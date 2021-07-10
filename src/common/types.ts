export interface NewsItem {
  id: string;
  title: string;
  permalink: string;
  publishedAt: string; // ISO string
  subtitle?: string;
  imageUrl?: string;
  body?: string;
}

export enum IsoValidity {
  VALID = "VALID",
  UNKNOWN = "UNKNOWN",
  INVALID = "INVALID",
}

export interface Progress {
  current: number;
  total: number;
}
