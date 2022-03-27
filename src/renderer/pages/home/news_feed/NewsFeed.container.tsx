import React from "react";
import { useQuery } from "react-query";

import { LoadingScreen } from "@/components/LoadingScreen";
import { usePageScrollingShortcuts } from "@/lib/hooks/useShortcuts";

import { NewsFeed } from "./NewsFeed";

const ITEMS_TO_SHOW = 7;
const BATCH_SIZE = 5;

export const NewsFeedContainer = React.memo(function NewsFeedContainer() {
  const mainRef = React.createRef<HTMLDivElement>();
  const [numItemsToShow, setNumItemsToShow] = React.useState(ITEMS_TO_SHOW);
  const newsFeedQuery = useQuery(["newsFeedQuery"], window.electron.common.fetchNewsFeed);
  const onShowMore = React.useCallback(() => {
    setNumItemsToShow(numItemsToShow + BATCH_SIZE);
  }, [setNumItemsToShow, numItemsToShow]);
  const { isLoading, error, data } = newsFeedQuery;
  const allPosts = data ?? [];
  const postsToShow = numItemsToShow <= 0 ? allPosts : allPosts.slice(0, numItemsToShow);
  usePageScrollingShortcuts(mainRef);

  if (isLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  if (error) {
    return <div>Failed to fetch news articles.</div>;
  }

  return <NewsFeed ref={mainRef} posts={postsToShow.slice(0, numItemsToShow)} total={0} onShowMore={onShowMore} />;
});
