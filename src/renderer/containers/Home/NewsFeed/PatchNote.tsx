import { Modal } from "@material-ui/core";
import { NewsItem } from "common/types";
import React from "react";
import styled from "styled-components";

import { NewsArticle } from "./NewsArticle";

const Outer = styled.div`
  width: 75%;
  margin-top: 25%;
  margin-left: 10%;
  position: absolute;
`;

export interface PatchNoteProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  currVer: NewsItem;
}

export const PatchNote: React.FC<PatchNoteProps> = (props) => {
  //get most recent stored version ID
  const prevVer = localStorage.getItem("ver");
  React.useEffect(() => {
    // check if previous version exists - if it does and it differs from current version,
    // we display the current version as a PatchNote
    props.setOpen(prevVer == null ? true : prevVer === props.currVer.id ? false : true);
    //store the current version
    localStorage.setItem("ver", props.currVer.id);
  }, []);
  return (
    <Modal open={props.open} onClose={() => props.setOpen(false)}>
      <Outer>
        <NewsArticle key={props.currVer.id} item={props.currVer} />
      </Outer>
    </Modal>
  );
};
