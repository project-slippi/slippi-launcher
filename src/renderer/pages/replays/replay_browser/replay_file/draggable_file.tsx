import { clsx } from "clsx";
import React from "react";

import styles from "./draggable_file.module.css";

type DraggableFileProps = {
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
  className?: string;
};

/**
 * DraggableFile is a presentational component that makes its children draggable.
 * Pass an onDragStart handler to control what happens when dragging begins.
 */
export const DraggableFile = ({ children, onDragStart, className }: React.PropsWithChildren<DraggableFileProps>) => {
  const isDraggable = !!onDragStart;
  return (
    <div
      className={clsx(styles.draggable, className, {
        [styles.isDraggable]: isDraggable,
      })}
      draggable={isDraggable}
      onDragStart={onDragStart}
      onClick={(event) => event.preventDefault()}
    >
      {children}
    </div>
  );
};
