import { css } from "@emotion/react";
import Button from "@mui/material/Button";
import React from "react";
import { useQuery } from "react-query";

import { LoadingScreen } from "@/components/loading_screen";

import { AdBanner } from "./ad_banner";
import { NewsArticle } from "./news_article/news_article";
import { NewsFeedMessages as Messages } from "./news_feed.messages";

const ITEMS_TO_SHOW = 7;
const BATCH_SIZE = 5;

const NewsFeedContent = React.memo(function NewsFeedContent() {
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
    return <LoadingScreen message={Messages.loading()} />;
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
          {Messages.failedToFetch()}
        </div>
        <Button color="primary" variant="text" size="small" onClick={() => refetch()}>
          {Messages.tryAgain()}
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
            {Messages.showMore()}
          </Button>
        </div>
      )}
      <AdBanner />
    </div>
  );
});

export const NewsFeed = React.memo(function NewsFeed() {
  return (
    <>
      <h1>{Messages.latestNews()}</h1>
      <NewsFeedContent />
    </>
  );
});
