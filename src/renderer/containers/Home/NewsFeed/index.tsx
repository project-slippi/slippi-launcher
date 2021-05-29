import Typography from "@material-ui/core/Typography";
import { fetchNewsFeed } from "common/ipc";
import React from "react";
import styled from "styled-components";

import { NewsArticle } from "./NewsArticle";

const Outer = styled.div`
  flex: 1;
  padding: 20px;
`;

export const NewsFeed: React.FC = () => {
  const articlesList = fetchNewsFeed.renderer!.useValue({}, []);

  if (articlesList.isUpdating) {
    return <div>Loading...</div>;
  }

  return (
    <Outer>
      <Typography variant="h4" style={{ marginBottom: 20 }}>
        Latest News
      </Typography>
      {articlesList.value.map((post) => (
        <NewsArticle key={post.id} item={post} />
      ))}
    </Outer>
  );
};
