import styled from "styled-components";
import React from "react";

import { ipcRenderer } from "electron";

const DraggableLink = styled.a`
  text-decoration: none;
  color: inherit;
  cursor: grab;
  user-select: auto;
  -webkit-user-drag: element;
  -webkit-app-region: drag;
`;

export const DraggableFile: React.FC<{
  fullPath: string;
  className?: string;
  style?: React.CSSProperties;
}> = ({ fullPath, children, className, style }) => {
  const handleDragStart = (e: React.DragEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    ipcRenderer.send("ondragstart", fullPath);
  };
  return (
    <DraggableLink
      className={className}
      style={style}
      href="#"
      onDragStart={(e) => handleDragStart(e)}
      onClick={(e) => e.preventDefault()}
    >
      {children}
    </DraggableLink>
  );
};
