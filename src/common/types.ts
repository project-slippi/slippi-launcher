export interface NewsItem {
  id: string;
  title: string;
  permalink: string;
  publishedAt: string; // ISO string
  subtitle?: string;
  imageUrl?: string;
  body?: string;
}
