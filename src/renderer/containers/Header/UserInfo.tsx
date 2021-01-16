import Avatar from "@material-ui/core/Avatar";
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
      <Avatar src={imageUrl} />
      <div style={{ marginLeft: 10, fontSize: 18 }}>{user.displayName}</div>
    </div>
  );
};
