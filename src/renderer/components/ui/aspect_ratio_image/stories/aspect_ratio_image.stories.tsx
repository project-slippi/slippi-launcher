import { useRef, useState } from "react";

import { AspectRatioImage } from "../aspect_ratio_image";
import demoImage from "./400x600.jpg";

export default {
  title: "components/ui/AspectRatioImage",
};

const ResizableBox = ({
  initialWidth = 500,
  initialHeight = 300,
  minWidth = 100,
  minHeight = 100,
  maxWidth = 800,
  maxHeight = 600,
  children,
}: {
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  children: React.ReactNode;
}) => {
  const [size, setSize] = useState({
    width: initialWidth,
    height: initialHeight,
  });
  const initialSizeRef = useRef({ width: initialWidth, height: initialHeight });
  const startPosRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startPosRef.current = { x: e.clientX, y: e.clientY };
    initialSizeRef.current = { ...size };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    const deltaX = e.clientX - startPosRef.current.x;
    const deltaY = e.clientY - startPosRef.current.y;
    const newSize = {
      width: Math.min(maxWidth, Math.max(minWidth, initialSizeRef.current.width + deltaX)),
      height: Math.min(maxHeight, Math.max(minHeight, initialSizeRef.current.height + deltaY)),
    };
    setSize(newSize);
  };

  const onMouseUp = () => {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  return (
    <div style={{ position: "relative", display: "inline-block", padding: 10 }}>
      <div
        style={{
          width: size.width,
          height: size.height,
          position: "relative",
          overflow: "hidden",
          border: "5px dashed #999",
          cursor: "se-resize",
        }}
        onMouseDown={handleMouseDown}
      >
        {children}
      </div>
    </div>
  );
};

export const ResizableContainer = () => (
  <ResizableBox>
    <AspectRatioImage src={demoImage} />
  </ResizableBox>
);
