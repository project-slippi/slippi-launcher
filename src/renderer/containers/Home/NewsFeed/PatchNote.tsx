import { Modal } from "@material-ui/core";
import { NewsItem } from "common/types";
import React from "react";

import { NewsArticle } from "./NewsArticle";

export interface PatchNoteProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  currVer: NewsItem;
}

export const PatchNote: React.FC<PatchNoteProps> = (props) => {
  const prevVer = localStorage.getItem("ver");
  React.useEffect(() => {
    // check if previous version exists - if it does and it differs from current version,
    // we display the current version as a PatchNote
    props.setOpen(prevVer == null ? true : prevVer === props.currVer.id ? false : true);
    localStorage.setItem("ver", props.currVer.id);
  }, []);
  return (
    <div>
      <Modal open={props.open} onClose={() => props.setOpen(false)}>
        <div>
          <NewsArticle key={props.currVer.id} item={props.currVer} />
        </div>
      </Modal>
    </div>
  );
};
