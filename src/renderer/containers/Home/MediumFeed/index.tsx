import Typography from "@material-ui/core/Typography";
import { NewsItem } from "common/types";
import { ipcRenderer as ipc } from "electron-better-ipc";
import React from "react";
import { useQuery } from "react-query";
import styled from "styled-components";

import { MediumArticle } from "./MediumArticle";

const Outer = styled.div`
  flex: 1;
  padding: 20px;
`;

export const MediumFeed: React.FC = () => {
  const mediumFeedQuery = useQuery(["news-articles"], () => ipc.callMain<never, NewsItem[]>("fetchNewsFeed"));
  if (mediumFeedQuery.isLoading) {
    return <div>Loading...</div>;
  }

  const posts = mediumFeedQuery.data ?? [];
  return (
    <Outer>
      <Typography variant="h4" style={{ marginBottom: 20 }}>
        Latest News
      </Typography>
      {posts.map((post) => (
        <MediumArticle key={post.id} item={post} />
      ))}
    </Outer>
  );
};
