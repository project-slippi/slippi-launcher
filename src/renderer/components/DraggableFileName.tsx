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

export interface DraggableFileNameProps {
  filePath: string;
  selected: boolean;
  selectedFiles: string[];
  className?: string;
  style?: React.CSSProperties;
}

/**
 * DraggableFileName accepts the `fullPath` prop and allows that file to be dragged into other contexts
 * such as copied to a different folder or dragged into web-sites etc.
 */
export const DraggableFileName: React.FC<DraggableFileNameProps> = ({
  children,
  filePath,
  selected,
  selectedFiles,
  className,
  style,
}) => {
  const handleDragStart = (e: React.DragEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    // Send onDragStart if this filename is in the selected files or if no files are selected
    selected
      ? ipcRenderer.send("onDragStart", selectedFiles)
      : selectedFiles.length == 0
      ? ipcRenderer.send("onDragStart", [filePath])
      : null;
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
