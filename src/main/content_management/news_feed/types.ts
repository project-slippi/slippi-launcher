export type SourceId = "medium" | "github" | "bluesky";

export type BaseNewsItem = {
  id: string;
  title: string;
  permalink: string;
  publishedAt: Date;
  subtitle?: string;
  imageUrl?: string;
  body?: string;
};

export interface NewsSource {
  readonly id: SourceId;
  fetch(): Promise<readonly BaseNewsItem[]>;
}
