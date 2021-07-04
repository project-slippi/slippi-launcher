import styled from "@emotion/styled";
import { ipcRenderer } from "electron";
import React from "react";

const DraggableLink = styled.a`
  text-decoration: none;
  color: inherit;
  cursor: grab;
  user-select: auto;
  -webkit-user-drag: element;
  -webkit-app-region: drag;
`;

export interface DraggableFileProps {
  filePaths: string[];
  className?: string;
  style?: React.CSSProperties;
}

/**
 * DraggableFile accepts the `filePaths` prop and allows those files to be dragged into other contexts
 * such as copied to a different folder or dragged into web-sites etc.
 */
export const DraggableFile: React.FC<DraggableFileProps> = ({ children, filePaths, className, style }) => {
  const handleDragStart = (e: React.DragEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (filePaths.length > 0) {
      ipcRenderer.send("onDragStart", filePaths);
    }
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
