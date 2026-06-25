import type { NewsItem } from "@common/types";
import Typography from "@mui/material/Typography";
import React from "react";

import { ExternalLink as A } from "@/components/external_link";
import { MarkdownContent } from "@/components/markdown_content/markdown_content";

import styles from "./news_article.module.css";

export const BlueskyPost = React.memo(function BlueskyPost({ item }: { item: NewsItem }) {
  const { imageUrl, title, subtitle, body } = item;
  return (
    <div>
      <div className={styles.titleHeader}>
        {imageUrl && <img src={imageUrl} style={{ width: 45, height: 45, borderRadius: "50%" }} />}
        <div>
          <Typography variant="h5" component="h2" fontSize={22}>
            {title}
          </Typography>
          {subtitle && (
            <A href={`https://bsky.app/profile/${subtitle}`} className={styles.link}>
              <Typography variant="body2" color="textSecondary" component="p">
                @{subtitle}
              </Typography>
            </A>
          )}
        </div>
      </div>
      {body && <MarkdownContent content={body} className={styles.markdownContainer} />}
    </div>
  );
});
