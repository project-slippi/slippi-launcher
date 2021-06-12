/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import Avatar from "@material-ui/core/Avatar";
import { colors } from "common/colors";
import crypto from "crypto";

export interface UserIconProps {
  userId: string;
  size?: string;
  className?: string;
}
export const UserIcon: React.FC<UserIconProps> = ({ userId, className, size = "45px" }) => {
  const hexString = crypto.createHash("md5").update(userId).digest("hex");
  const imageUrl = `https://www.gravatar.com/avatar/${hexString}?d=identicon`;
  return (
    <Avatar
      className={className}
      src={imageUrl}
      css={css`
        border: solid 3px ${colors.purpleLight};
        height: ${size};
        width: ${size};
      `}
    />
  );
};
