import { css } from "@emotion/react";

import { ReactComponent as DPadDirIcon } from "@/styles/images/dpad-dir.svg";

export const DPadDirection = ({
  direction,
  size = 32,
}: {
  direction: "up" | "left" | "right" | "down";
  size?: number;
}) => {
  const rotations = {
    up: 0,
    right: 90,
    down: 180,
    left: 270,
  };

  return (
    <DPadDirIcon
      width={size}
      height={size}
      css={css`
        transform: rotate(${rotations[direction]}deg);
      `}
    />
  );
};
