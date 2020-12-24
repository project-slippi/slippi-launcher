import styled from "styled-components";
import React from "react";

import { ipcRenderer } from "electron";
import InsertDriveFileIcon from "@material-ui/icons/InsertDriveFile";

const DraggableLink = styled.a`
  text-decoration: none;
  color: inherit;
  cursor: grab;
  user-select: auto;
  -webkit-user-drag: element;
  -webkit-app-region: drag;
`;

export const DraggableFile: React.FC<{ fullPath: string }> = ({ fullPath }) => {
  const handleDragStart = (e: React.DragEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    ipcRenderer.send("ondragstart", fullPath);
  };
  return (
    <DraggableLink
      href="#"
      onDragStart={(e) => handleDragStart(e)}
      onClick={(e) => e.preventDefault()}
    >
      <InsertDriveFileIcon />
    </DraggableLink>
  );
};
