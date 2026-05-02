import type { NewsItem } from "@common/types";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import React from "react";

import { MarkdownContent } from "@/components/markdown_content/markdown_content";

import styles from "./news_article.module.css";

export const BlueskyPost = React.memo(function BlueskyPost({ item }: { item: NewsItem }) {
  const { imageUrl, title, subtitle, body } = item;
  return (
    <div>
      <CardContent>
        <div className={styles.titleHeader}>
          {imageUrl && (
            <CardMedia
              className={styles.fixedCardHeight}
              image={imageUrl}
              style={{ width: 45, height: 45, borderRadius: "50%" }}
            />
          )}
          <div>
            <Typography variant="h5" component="h2" fontSize={22}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary" component="p">
                {subtitle}
              </Typography>
            )}
          </div>
        </div>
        {body && <MarkdownContent content={body} className={styles.markdownContainer} />}
      </CardContent>
    </div>
  );
});
