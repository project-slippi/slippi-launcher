import type { NewsItem } from "@common/types";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import React from "react";

import { MarkdownContent } from "@/components/markdown_content/markdown_content";

import styles from "./item_preview.module.css";

export const BlueskyPreview = React.memo(function BlueskyPreview({ item }: { item: NewsItem }) {
  const { imageUrl, title, subtitle, body } = item;
  return (
    <div>
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
    </div>
  );
});
