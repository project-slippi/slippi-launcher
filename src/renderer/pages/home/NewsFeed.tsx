import { css } from "@emotion/react";
import Button from "@mui/material/Button";
import React from "react";
import { useQuery } from "react-query";

import { LoadingScreen } from "@/components/LoadingScreen";

import { NewsArticle } from "./news_article/NewsArticle";

const ITEMS_TO_SHOW = 7;
const BATCH_SIZE = 5;

export const NewsFeed = React.memo(function NewsFeedContainer() {
  const [numItemsToShow, setNumItemsToShow] = React.useState(ITEMS_TO_SHOW);
  const newsFeedQuery = useQuery(["newsFeedQuery"], window.electron.common.fetchNewsFeed);
  const { isLoading, error, data: allPosts = [], refetch } = newsFeedQuery;

  const onShowMore = React.useCallback(() => {
    setNumItemsToShow(numItemsToShow + BATCH_SIZE);
  }, [setNumItemsToShow, numItemsToShow]);

  const posts = React.useMemo(() => {
    return numItemsToShow <= 0 ? allPosts : allPosts.slice(0, numItemsToShow);
  }, [allPosts, numItemsToShow]);

  if (isLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  if (error) {
    return (
      <div
        css={css`
          display: flex;
          align-items: center;
        `}
      >
        <div
          css={css`
            margin-right: 10px;
          `}
        >
          Failed to fetch news articles.
        </div>
        <Button color="primary" variant="text" size="small" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div>
      {posts.map((post) => (
        <NewsArticle key={post.id} item={post} />
      ))}
      {allPosts.length > posts.length && (
        <div
          css={css`
            text-align: center;
          `}
        >
          <Button color="primary" variant="contained" size="small" onClick={onShowMore}>
            Show more
          </Button>
        </div>
      )}
    </div>
  );
});
