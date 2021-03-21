import Typography from "@material-ui/core/Typography";
import { NewsItem } from "common/types";
import { ipcRenderer as ipc } from "electron-better-ipc";
import React from "react";
import { useQuery } from "react-query";
import styled from "styled-components";
import { PatchNote } from "./PatchNote";
import { NewsArticle } from "./NewsArticle";

const Outer = styled.div`
  flex: 1;
  padding: 20px;
`;

export const NewsFeed: React.FC = () => {
  const newsFeedQuery = useQuery(["news-articles"], () => ipc.callMain<never, NewsItem[]>("fetchNewsFeed"));
  if (newsFeedQuery.isLoading) {
    return <div>Loading...</div>;
  }

  const posts = newsFeedQuery.data ?? [];
  return (
    <Outer>
      <PatchNote posts={posts} />
      <Typography variant="h4" style={{ marginBottom: 20 }}>
        Latest News
      </Typography>
      {posts.map((post) => (
        <NewsArticle key={post.id} item={post} />
      ))}
    </Outer>
  );
};
