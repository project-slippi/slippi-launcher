import { ipcRenderer } from "electron";
import React from "react";
import styled from "styled-components";

const DraggableLink = styled.a`
  text-decoration: none;
  color: inherit;
  cursor: grab;
  user-select: auto;
  -webkit-user-drag: element;
  -webkit-app-region: drag;
`;

export interface DraggableFileProps {
  fullPath: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * DraggableFile accepts the `fullPath` prop and allows that file to be dragged into other contexts
 * such as copied to a different folder or dragged into web-sites etc.
 */
export const DraggableFile: React.FC<DraggableFileProps> = ({ fullPath, children, className, style }) => {
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
