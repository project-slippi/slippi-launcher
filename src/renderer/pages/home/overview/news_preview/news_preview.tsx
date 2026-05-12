import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Newspaper from "@mui/icons-material/Newspaper";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { clsx } from "clsx";
import React from "react";

import { useNewsFeedQuery } from "@/lib/hooks/use_data_fetch_query";

import { ItemPreview } from "./item_preview/item_preview";
import { NewsPreviewMessages as Messages } from "./news_preview.messages";
import styles from "./news_preview.module.css";

export const NewsPreview = React.memo(function NewsPreview() {
  const { isLoading, error, data: allPosts = [] } = useNewsFeedQuery();

  if (isLoading) {
    return (
      <Outer centered={true}>
        <CircularProgress color="inherit" />
      </Outer>
    );
  }

  if (error instanceof Error) {
    return (
      <Outer centered={true}>
        <Newspaper style={{ fontSize: 64 }} />
        <h3>{Messages.failedToFetchNews()}</h3>
      </Outer>
    );
  }

  if (allPosts.length === 0) {
    return (
      <Outer centered={true}>
        <Newspaper style={{ fontSize: 64 }} />
        <h3>{Messages.noNews()}</h3>
      </Outer>
    );
  }

  return (
    <Outer>
      <div className={styles.previewContainer}>
        <ItemPreview item={allPosts.find((post) => post.source === "bluesky") || allPosts[0]} />
      </div>
      <Button color="secondary" sx={{ width: "100%" }} size="medium" variant="outlined" endIcon={<ChevronRightIcon />}>
        Read post
      </Button>
    </Outer>
  );
});

const Outer = ({ children, centered }: { children: React.ReactNode; centered?: boolean }) => {
  return <div className={clsx(styles.container, centered && styles.centered)}>{children}</div>;
};
