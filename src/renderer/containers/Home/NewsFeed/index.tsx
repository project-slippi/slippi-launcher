import Typography from "@material-ui/core/Typography";
import { NewsItem } from "common/types";
import { ipcRenderer as ipc } from "electron-better-ipc";
import _ from "lodash";
import React from "react";
import { useQuery } from "react-query";
import styled from "styled-components";

import { NewsArticle } from "./NewsArticle";
import { PatchNote } from "./PatchNote";

const Outer = styled.div`
  flex: 1;
  padding: 20px;
`;

export const NewsFeed: React.FC = () => {
  //const [open, setOpen] = React.useState(true);
  const openState = React.useState(false);
  let open = openState[0];
  const setOpen = openState[1];
  const newsFeedQuery = useQuery(["news-articles"], () => ipc.callMain<never, NewsItem[]>("fetchNewsFeed"));
  if (newsFeedQuery.isLoading) {
    return <div>Loading...</div>;
  }

  const posts = newsFeedQuery.data ?? [];

  //find most recent newsFeedItem that is a github release (a PatchNote)
  const recentPostInd = _.findIndex(posts, (post) => {
    return /(gh-)(.*-)(.*)/.test(post.id);
  });
  const currVer = posts[recentPostInd];
  const prevVer = localStorage.getItem("ver");
  //check if prevVer exists - if it does, check if prevVer differs from current version
  open = prevVer == null ? true : prevVer === currVer.id ? true : false;
  return (
    <Outer>
      <PatchNote currVer={currVer} open={open} setOpen={setOpen} />
      <Typography variant="h4" style={{ marginBottom: 20 }}>
        Latest News
      </Typography>
      {posts.map((post) => (
        <NewsArticle key={post.id} item={post} />
      ))}
    </Outer>
  );
};
