import { NewsItem } from "common/types";
import _ from "lodash";

import React from "react";

import { Modal } from "@material-ui/core";

import { NewsArticle } from "./NewsArticle";
//body of the Modal is a NewsArticle

export interface NewsItemsProps {
  posts: NewsItem[];
}

export const PatchNote: React.FC<NewsItemsProps> = (props) => {
  var [open, setOpen] = React.useState(false);

  const handleClose = () => setOpen(false);

  const prevVer = localStorage.getItem("ver") || null;
  const recentPostInd = _.findIndex(props.posts, (post) => {
    return /(gh-)(.*-)(.*)/.test(post.id);
  });
  const currVer = props.posts[recentPostInd].id;

  if (prevVer == null) {
  } else {
    if (prevVer === currVer) {
      open = true;
    } else {
      open = true;
    }
  }
  const body = (
    <div>
      <NewsArticle key={props.posts[recentPostInd].id} item={props.posts[recentPostInd]} />
    </div>
  );

  React.useEffect(() => {
    localStorage.setItem("ver", currVer);
  });

  console.log("Stored ver: " + prevVer + ", new ver: " + currVer);
  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        onBackdropClick={handleClose}
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
      >
        {body}
      </Modal>
    </>
  );
};
