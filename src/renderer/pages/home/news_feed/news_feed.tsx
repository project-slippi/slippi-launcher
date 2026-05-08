import Button from "@mui/material/Button";
import React from "react";

import { LoadingScreen } from "@/components/loading_screen/loading_screen";
import { useNewsFeedQuery } from "@/lib/hooks/use_data_fetch_query";

import { NewsDualPane } from "./news_dual_pane/news_dual_pane";
import { NewsFeedMessages as Messages } from "./news_feed.messages";

const NewsFeedContent = React.memo(function NewsFeedContent({
  newsId,
  onNewsIdChange,
}: {
  newsId: string | null;
  onNewsIdChange: (id: string | null) => void;
}) {
  const { isLoading, error, data: allPosts = [], refetch } = useNewsFeedQuery();

  if (isLoading) {
    return <LoadingScreen message={Messages.loading()} />;
  }

  if (error) {
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ marginRight: 10 }}>{Messages.failedToFetch()}</div>
        <Button color="primary" variant="text" size="small" onClick={() => refetch()}>
          {Messages.tryAgain()}
        </Button>
      </div>
    );
  }

  return <NewsDualPane posts={allPosts} selectedNewsId={newsId} onSelectedNewsIdChange={onNewsIdChange} />;
});

export const NewsFeed = React.memo(function NewsFeed({
  newsId,
  onNewsIdChange,
}: {
  newsId: string | null;
  onNewsIdChange: (id: string | null) => void;
}) {
  return (
    <div style={{ height: "100%" }}>
      <NewsFeedContent newsId={newsId} onNewsIdChange={onNewsIdChange} />
    </div>
  );
});
