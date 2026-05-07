import Newspaper from "@mui/icons-material/Newspaper";
import CircularProgress from "@mui/material/CircularProgress";
import React from "react";

import { useNewsFeedQuery } from "@/lib/hooks/use_data_fetch_query";

import { NewsArticleContainer as NewsArticle } from "../../news_feed/news_article/news_article.container";
import { NewsPreviewMessages as Messages } from "./news_preview.messages";
import styles from "./news_preview.module.css";

export const NewsPreview = React.memo(function NewsPreview() {
  const { isLoading, error, data: allPosts = [] } = useNewsFeedQuery();

  if (isLoading) {
    return (
      <Outer>
        <CircularProgress color="inherit" />
      </Outer>
    );
  }

  if (error instanceof Error) {
    return (
      <Outer>
        <Newspaper style={{ fontSize: 64 }} />
        <h3>{Messages.failedToFetchNews()}</h3>
      </Outer>
    );
  }

  if (allPosts.length === 0) {
    return (
      <Outer>
        <Newspaper style={{ fontSize: 64 }} />
        <h3>{Messages.noNews()}</h3>
      </Outer>
    );
  }

  return (
    <Outer>
      <div style={{ margin: 15, boxShadow: "4px 4px 8px rgba(0, 0, 0, 0.8)", overflow: "auto" }}>
        <NewsArticle item={allPosts[0]} />
      </div>
    </Outer>
  );
});

const Outer = ({ children }: { children: React.ReactNode }) => {
  return <div className={styles.container}>{children}</div>;
};
