/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import Avatar from "@material-ui/core/Avatar";
import { colors } from "common/colors";
import firebase from "firebase";
import React from "react";

export const UserInfo: React.FC<{
  user: firebase.User;
}> = ({ user }) => {
  const imageUrl = `https://www.gravatar.com/avatar/${user.uid}?d=identicon`;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Avatar
        src={imageUrl}
        css={css`
          border: solid 3px ${colors.purpleLight};
          height: 30px;
          width: 30px;
        `}
      />
      <div style={{ marginLeft: 10, fontSize: 18 }}>{user.displayName}</div>
    </div>
  );
};
