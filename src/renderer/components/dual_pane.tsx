import * as stylex from "@stylexjs/stylex";
import { debounce } from "lodash";
import React from "react";

import { colors } from "@/styles/tokens.stylex";

const styles = stylex.create({
  container: {
    position: "relative",
    display: "grid",
    flex: "1",
  },
  column: {
    display: "flex",
    height: "100%",
    width: "100%",
    position: "relative",
    overflow: "auto",
  },
  resizeHandle: {
    position: "absolute",
    cursor: "ew-resize",
    backgroundColor: colors.offWhite,
    top: 0,
    height: "100%",
    transition: "opacity 0.1s ease-in-out",
    opacity: {
      default: 0,
      ":hover": 0.7,
    },
  },
});

const getStoreKey = (paneId = "default"): string => {
  return `dual-pane-width-${paneId}`;
};

const restoreWidth = (paneId: string, defaultWidth: number): number => {
  const restored = localStorage.getItem(getStoreKey(paneId));
  if (restored) {
    return parseInt(restored);
  }
  return defaultWidth;
};

const saveWidth = debounce((paneId: string, width: number) => {
  localStorage.setItem(getStoreKey(paneId), width.toString());
}, 100);

export const DualPane = ({
  id,
  resizable,
  leftStyle,
  rightStyle,
  leftSide,
  rightSide,
  minWidth,
  maxWidth,
  width = 250,
  resizeHandleWidth = 6,
  style,
}: {
  id: string;
  style?: React.CSSProperties;
  resizable?: boolean;
  leftSide: React.ReactNode;
  rightSide: React.ReactNode;
  leftStyle?: React.CSSProperties;
  rightStyle?: React.CSSProperties;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  resizeHandleWidth?: number;
}) => {
  const [panelWidth, setPanelWidth] = React.useState<number>(restoreWidth(id, width));

  // Clean up event listeners, classes, etc.
  const onMouseUp = () => {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  // Where the magic happens. i.e. when they're actually resizing
  const onMouseMove = (e: any) => {
    const maxPaneWidth = maxWidth ?? window.innerWidth;
    const minPaneWidth = minWidth ?? 0;
    let value = Math.min(maxPaneWidth - resizeHandleWidth, e.clientX);
    value = Math.max(minPaneWidth, value);
    setPanelWidth(value);
    saveWidth(id, value);
  };

  const initResize = () => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const gridTemplateColumns = `${resizable ? panelWidth : width}px auto`;

  return (
    <div
      {...stylex.props(styles.container)}
      style={{
        gridTemplateColumns,
        ...style,
      }}
    >
      <div {...stylex.props(styles.column)} style={leftStyle}>
        {leftSide}
      </div>
      <div {...stylex.props(styles.column)} style={rightStyle}>
        {rightSide}
      </div>
      {resizable && (
        <div
          {...stylex.props(styles.resizeHandle)}
          style={{
            left: panelWidth - Math.floor(resizeHandleWidth / 2),
            width: resizeHandleWidth,
          }}
          onMouseDown={initResize}
        />
      )}
    </div>
  );
};
