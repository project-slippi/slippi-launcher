import firebase from "firebase";
import React from "react";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import styled from "styled-components";
import { colors } from "common/colors";
import { UserInfo } from "./UserInfo";

const OuterBox = styled(Box)`
  background-color: ${colors.purpleDark};
`;

export const Header: React.FC<{
  onPlay: () => void;
  onLogin: () => void;
  onLogout: () => void;
  currentUser?: firebase.User | null;
}> = ({ onPlay, onLogin, onLogout, currentUser }) => {
  const onClick = () => {
    if (currentUser) {
      onPlay();
    } else {
      onLogin();
    }
  };
  return (
    <OuterBox display="flex" flexDirection="row" justifyContent="space-between">
      <Button onClick={onClick}>{currentUser ? "Play now" : "Log in"}</Button>
      {currentUser && <UserInfo user={currentUser} onLogout={onLogout} />}
    </OuterBox>
  );
};
