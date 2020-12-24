import { debounce } from "lodash";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import React from "react";
import styled from "styled-components";

interface OuterProps {
  panelWidth: number;
}

const Outer = styled.div.attrs<OuterProps>((props) => ({
  style: {
    gridTemplateColumns: `${props.panelWidth}px auto`,
  },
}))<OuterProps>`
  position: relative;
  display: grid;
  height: 100%;
  width: 100%;
`;

const Column = styled(OverlayScrollbarsComponent)`
  display: flex;
  position: relative;
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
  resizable?: boolean;
  leftSide: React.ReactNode;
  rightSide: React.ReactNode;
  leftStyle?: React.CSSProperties;
  rightStyle?: React.CSSProperties;
  width?: number;
  resizeHandleWidth?: number;
}> = ({
  id,
  resizable,
  leftStyle,
  rightStyle,
  leftSide,
  rightSide,
  width = 250,
  resizeHandleWidth = 8,
}) => {
  const [panelWidth, setPanelWidth] = React.useState<number>(
    restoreWidth(id, width)
  );

  // Clean up event listeners, classes, etc.
  const onMouseUp = () => {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  // Where the magic happens. i.e. when they're actually resizing
  const onMouseMove = (e: any) => {
    let value = Math.min(window.innerWidth - resizeHandleWidth, e.clientX);
    value = Math.max(0, value);
    setPanelWidth(value);
    saveWidth(id, value);
  };

  const initResize = () => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <Outer panelWidth={resizable ? panelWidth : width}>
      <Column style={leftStyle}>{leftSide}</Column>
      <Column style={rightStyle}>{rightSide}</Column>
      <ResizeHandle
        style={{
          display: resizable ? "block" : "none",
          left: panelWidth - Math.floor(resizeHandleWidth / 2),
          width: resizeHandleWidth,
        }}
        onMouseDown={initResize}
      />
    </Outer>
  );
};

const ResizeHandle = styled.div`
  position: absolute;
  cursor: e-resize;
  background-color: black;
  top: 0;
  height: 100%;
  opacity: 0;
  &:hover {
    opacity: 0.9;
  }
`;
