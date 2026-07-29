import { css } from "@emotion/react";

export const UserIcon = ({
  imageUrl,
  size = 45,
  borderColor = "var(--purple-light)",
}: {
  imageUrl: string;
  size?: number;
  borderColor?: string;
}) => {
  return (
    <div
      css={css`
        border: solid 3px ${borderColor};
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
