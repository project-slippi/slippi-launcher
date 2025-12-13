import stylex from "@stylexjs/stylex";
import React from "react";

const styles = stylex.create({
  draggable: {
    color: "inherit",
    cursor: "grab",
    userSelect: "auto",
  },
});

// Vendor-specific styles that aren't supported by stylex
const webkitStyles = {
  WebkitUserDrag: "element",
  WebkitAppRegion: "no-drag",
} as React.CSSProperties;

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
  const isDraggable = !!onDragStart;
  const combinedStyles = isDraggable ? { ...webkitStyles, ...style } : style;

  return (
    <div
      {...stylex.props(isDraggable && styles.draggable)}
      className={className}
      style={combinedStyles}
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onClick={(event) => event.preventDefault()}
    >
      {children}
    </div>
  );
};
