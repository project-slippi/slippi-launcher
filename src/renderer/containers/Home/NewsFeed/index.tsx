import { Modal } from "@material-ui/core";
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

export interface MyModalProps {
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  currVer: NewsItem;
}

export const NewsFeed: React.FC = () => {
  const [showModal, setShowModal] = React.useState(true);
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

  return (
    <Outer>
      <PatchNote currVer={currVer} showModal={showModal} setShowModal={setShowModal} />
      <MyModal showModal={showModal} setShowModal={setShowModal} currVer={posts[0]} />
      <Typography variant="h4" style={{ marginBottom: 20 }}>
        Latest News
      </Typography>
      {posts.map((post) => (
        <NewsArticle key={post.id} item={post} />
      ))}
    </Outer>
  );
};

const MyModal: React.FC<MyModalProps> = (props) => {
  //const recVer = localStorage.getItem("ver");
  //props.setShowModal(true);

  return (
    <div>
      <Modal open={props.showModal} onClose={() => props.setShowModal(false)}>
        <Outer>
          <NewsArticle key={props.currVer.id} item={props.currVer} />
        </Outer>
      </Modal>
    </div>
  );
};
