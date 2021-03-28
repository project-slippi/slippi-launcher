import { Button, Dialog, DialogActions, DialogContent } from "@material-ui/core";
import { NewsItem } from "common/types";
import _ from "lodash";
import React from "react";

import { NewsArticle } from "./NewsFeed/NewsArticle";

export interface NewsItemsProps {
  posts: NewsItem[];
}

export const PatchNote: React.FC<NewsItemsProps> = (props) => {
  let [open, setOpen] = React.useState(false);

  const handleClose = () => setOpen(false);

  const prevVer = localStorage.getItem("ver") || null;
  const recentPostInd = _.findIndex(props.posts, (post) => {
    return /(gh-)(.*-)(.*)/.test(post.id);
  });
  const currVer = props.posts[recentPostInd].id;

  if (prevVer == null) {
    open = true;
    localStorage.setItem(currVer, "ver");
  } else {
    if (prevVer === currVer) {
      open = false;
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

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        onBackdropClick={handleClose}
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
      >
        <DialogContent>{body}</DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary" autoFocus>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
