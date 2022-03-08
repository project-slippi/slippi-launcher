import { colors } from "@common/colors";
import { css } from "@emotion/react";
import Identicon from "react-identicons";

export interface UserIconProps {
  userId: string;
  size?: number;
  className?: string;
}
export const UserIcon: React.FC<UserIconProps> = ({ userId, className, size = 45 }) => {
  return (
    <div
      className={className}
      css={css`
        border: solid 3px ${colors.purpleLight};
        background-color: white;
        border-radius: 50%;
        overflow: hidden;
        height: ${size}px;
        width: ${size}px;
      `}
    >
      <Identicon string={userId} size={size} />
    </div>
  );
};
