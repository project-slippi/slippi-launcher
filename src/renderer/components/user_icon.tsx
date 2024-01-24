import { css } from "@emotion/react";

import { colors } from "@/styles/colors";

export const UserIcon = ({ imageUrl, size = 45 }: { imageUrl: string; size?: number }) => {
  return (
    <div
      css={css`
        border: solid 3px ${colors.purpleLight};
        background-color: white;
        border-radius: 50%;
        overflow: hidden;
        height: ${size}px;
        width: ${size}px;
      `}
    >
      <img src={imageUrl} height={size} width={size} />
    </div>
  );
};
