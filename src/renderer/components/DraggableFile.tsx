import styled from "@emotion/styled";
import React from "react";

import { useHandleDragStart } from "@/lib/hooks/useHandleDragStart";

const Outer = styled.div`
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
  const handleDragStart = useHandleDragStart();

  return (
    <Outer
      className={className}
      style={style}
      onDragStart={(e) => handleDragStart(e, filePaths)}
      onClick={(e) => e.preventDefault()}
    >
      {children}
    </Outer>
  );
};
