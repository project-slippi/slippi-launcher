import Typography from "@material-ui/core/Typography";
import React from "react";

import { LoadingScreen } from "@/components/LoadingScreen";
import { useNewsFeed } from "@/lib/hooks/useNewsFeed";

import { NewsArticle } from "./NewsArticle";

const Outer = styled.div`
  flex: 1;
  padding: 20px;
`;

export const NewsFeed: React.FC = () => {
  const didError = useNewsFeed((store) => store.error);
  const posts = useNewsFeed((store) => store.newsItems);
  const isLoading = useNewsFeed((store) => store.fetching);

  if (isLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  if (didError) {
    return <div>Failed to fetch news articles.</div>;
  }

  return (
    <Outer>
      <Typography variant="h4" style={{ marginBottom: 20 }}>
        Latest News
      </Typography>
      {posts.map((post) => (
        <NewsArticle key={post.id} item={post} />
      ))}
    </Outer>
  );
};
