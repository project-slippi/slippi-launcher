import firebase from "firebase";
import React from "react";

export const UserInfo: React.FC<{
  user: firebase.User;
  onLogout: () => void;
}> = ({ user, onLogout }) => {
  return (
    <div>
      <div>{user.displayName}</div>
      <button onClick={onLogout}>Log out</button>
    </div>
  );
};
