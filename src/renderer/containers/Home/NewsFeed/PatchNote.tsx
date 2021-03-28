import { Modal } from "@material-ui/core";
import { NewsItem } from "common/types";
import React from "react";

import { NewsArticle } from "./NewsArticle";

export interface PatchNoteProps {
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  currVer: NewsItem;
}

export const PatchNote: React.FC<PatchNoteProps> = (props) => {
  React.useEffect(() => {
    localStorage.setItem("ver", props.currVer.id);
  });

  return (
    <div>
      <Modal open={props.showModal} onClose={() => props.setShowModal(false)}>
        <div>
          <NewsArticle key={props.currVer.id} item={props.currVer} />
        </div>
      </Modal>
    </div>
  );
};
