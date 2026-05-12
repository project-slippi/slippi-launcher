import type { NewsItem } from "@common/types";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import React from "react";

import { MarkdownContent } from "@/components/markdown_content/markdown_content";

import styles from "./item_preview.module.css";

export const MediumPreview = React.memo(function MediumPreview({ item }: { item: NewsItem }) {
  const { imageUrl, title, subtitle, body = "" } = item;

  return (
    <div>
      {imageUrl && <CardMedia className={styles.fixedCardHeight} image={imageUrl} title={title} />}
      <div>
        <div className={styles.titleHeader}>
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
        {body && <MarkdownContent content={body} className={styles.markdownContainer} />}
      </div>
    </div>
  );
});
