import type { NewsItem } from "@common/types";
import Button from "@mui/material/Button";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import stylex from "@stylexjs/stylex";
import React from "react";

import { MarkdownContent } from "@/components/markdown_content/markdown_content";

import { NewsArticleMessages as Messages } from "./news_article.messages";

const MAX_BODY_LENGTH = 750;

const styles = stylex.create({
  titleHeader: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  fixedCardHeight: {
    height: 200,
  },
  markdownContainer: {
    color: "#ccc",
    maxWidth: 700,
  },
});

export const MediumPost = React.memo(function MediumPost({ item }: { item: NewsItem }) {
  const { imageUrl, title, subtitle, body = "" } = item;
  const nextPageBreak = body?.indexOf("\n\n", MAX_BODY_LENGTH) ?? -1;
  const [truncateBody, setTruncatedBody] = React.useState(nextPageBreak > 0);

  const bodyContent = truncateBody ? truncateString(body, nextPageBreak) : body;

  return (
    <div>
      {imageUrl && <CardMedia {...stylex.props(styles.fixedCardHeight)} image={imageUrl} title={title} />}
      <CardContent>
        <div {...stylex.props(styles.titleHeader)}>
          <div>
            <Typography variant="h5" component="h2">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary" component="p">
                {subtitle}
              </Typography>
            )}
          </div>
        </div>
        {body && <MarkdownContent content={bodyContent} {...stylex.props(styles.markdownContainer)} />}
        {truncateBody && (
          <Button size="small" color="secondary" onClick={() => setTruncatedBody(false)}>
            {Messages.readMore()}
          </Button>
        )}
      </CardContent>
    </div>
  );
});

function truncateString(text: string, atPosition: number): string {
  return text.length > atPosition ? text.substring(0, atPosition) + "..." : text;
}
