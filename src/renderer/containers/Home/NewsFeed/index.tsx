import Typography from "@material-ui/core/Typography";
import { fetchNewsFeed } from "common/ipc";
import log from "electron-log";
import React from "react";
import { useQuery } from "react-query";
import styled from "styled-components";

import { NewsArticle } from "./NewsArticle";

const Outer = styled.div`
  flex: 1;
  padding: 20px;
`;

export const NewsFeed: React.FC = () => {
  const newsFeedQuery = useQuery(["news-articles"], async () => {
    const articlesResult = await fetchNewsFeed.renderer!.trigger({});
    if (!articlesResult.result) {
      log.error("NewsFeed: error fetching news articles", articlesResult.errors);
      throw new Error("Error fetching news articles");
    }
    return articlesResult.result;
  });

  if (newsFeedQuery.isLoading) {
    return <div>Loading...</div>;
  }

  const posts = newsFeedQuery.data ?? [];
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
