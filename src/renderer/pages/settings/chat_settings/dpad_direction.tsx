import { css } from "@emotion/react";

import { ReactComponent as DpadDirIcon } from "@/styles/images/dpad_dir.svg";

export const DpadDirection = ({
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
    <DpadDirIcon
      width={size}
      height={size}
      css={css`
        transform: rotate(${rotations[direction]}deg);
      `}
    />
  );
};
