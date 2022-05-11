import { colors } from "@common/colors";
import styled from "@emotion/styled";
import { debounce } from "lodash";
import React from "react";

const Outer = styled.div`
  position: relative;
  display: grid;
  flex: 1;
`;

const Column = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  position: relative;
  overflow: auto;
`;

const ResizeHandle = styled.div`
  position: absolute;
  cursor: e-resize;
  background-color: ${colors.offWhite};
  top: 0;
  height: 100%;
  opacity: 0;
  &:hover {
    opacity: 0.7;
  }
`;

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

export const DualPane: React.FC<{
  id: string;
  style?: React.CSSProperties;
  className?: string;
  resizable?: boolean;
  leftSide: React.ReactNode;
  rightSide: React.ReactNode;
  leftStyle?: React.CSSProperties;
  rightStyle?: React.CSSProperties;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  resizeHandleWidth?: number;
}> = ({
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
  className,
  style,
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
    <Outer
      className={className}
      style={{
        gridTemplateColumns,
        ...style,
      }}
    >
      <Column style={leftStyle}>{leftSide}</Column>
      <Column style={rightStyle}>{rightSide}</Column>
      {resizable && (
        <ResizeHandle
          style={{
            left: panelWidth - Math.floor(resizeHandleWidth / 2),
            width: resizeHandleWidth,
          }}
          onMouseDown={initResize}
        />
      )}
    </Outer>
  );
};
