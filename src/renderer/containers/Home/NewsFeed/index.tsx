/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import React from "react";

import { LoadingScreen } from "@/components/LoadingScreen";
import { useNewsFeed } from "@/lib/hooks/useNewsFeed";

import { NewsArticle } from "./NewsArticle";

const Outer = styled.div`
  flex: 1;
  padding: 20px;
`;

export interface NewsFeedProps {
  numItemsToShow?: number;
  batchSize?: number;
}

export const NewsFeed: React.FC<NewsFeedProps> = ({ numItemsToShow = 7, batchSize = 5 }) => {
  // The number of items to show
  const [numItems, setNumItems] = React.useState(numItemsToShow);
  const didError = useNewsFeed((store) => store.error);
  const allPosts = useNewsFeed((store) => store.newsItems);
  const isLoading = useNewsFeed((store) => store.fetching);

  if (isLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  if (didError) {
    return <div>Failed to fetch news articles.</div>;
  }

  const onShowMore = () => {
    setNumItems(numItems + batchSize);
  };

  const postsToShow = numItems <= 0 ? allPosts : allPosts.slice(0, numItems);

  return (
    <Outer>
      <Typography variant="h4" style={{ marginBottom: 20 }}>
        Latest News
      </Typography>
      {postsToShow.slice(0, numItems).map((post) => (
        <NewsArticle key={post.id} item={post} />
      ))}
      {allPosts.length > numItems && (
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
    </Outer>
  );
};
