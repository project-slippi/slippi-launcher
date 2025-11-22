import type { NewsItem } from "@common/types";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import stylex from "@stylexjs/stylex";
import React from "react";

import { MarkdownContent } from "@/components/markdown_content/markdown_content";

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

export const GithubPost = React.memo(function GithubPost({ item }: { item: NewsItem }) {
  const { imageUrl, title, subtitle, body = "" } = item;

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
        {body && <MarkdownContent content={body} {...stylex.props(styles.markdownContainer)} />}
      </CardContent>
    </div>
  );
});
