import styled from "@emotion/styled";
import React from "react";

const Outer = styled.div`
  color: inherit;
  cursor: grab;
  user-select: auto;
  -webkit-user-drag: element;
  -webkit-app-region: no-drag;
`;

type DraggableFileProps = {
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * DraggableFile is a presentational component that makes its children draggable.
 * Pass an onDragStart handler to control what happens when dragging begins.
 */
export const DraggableFile = ({
  children,
  onDragStart,
  className,
  style,
}: React.PropsWithChildren<DraggableFileProps>) => {
  return (
    <Outer
      className={className}
      style={style}
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onClick={(event) => event.preventDefault()}
    >
      {children}
    </Outer>
  );
};
