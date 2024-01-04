import type { NewsItem } from "@common/types";

export function generateFakeNewsItem(news: Partial<NewsItem>): NewsItem {
  return {
    id: "fake-news",
    title: "Lorem Ipsum",
    permalink: "https://youtu.be/dQw4w9WgXcQ",
    publishedAt: new Date(2009, 10, 25, 6, 57, 33, 42).toISOString(),
    subtitle: "Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur.",
    body: `
## Sub-heading

We *should* be able to render [markdown](https://google.com/search?q=markdown). Like this ordered list:

1. Hello
2. World!

And here's an unordered list:

* Foo
* Bar
* Baz

Here's a blockquote:

> "If only, if only," the woodpecker sighs. "The bark on the tree was as soft as the skies."

> While the wolf waits below, hungry and lonely, crying to the moo-oo-oon.

> "If only, If only."

<script>alert('If this executes we dun goofed.')</script>
`,
    ...news,
  };
}
