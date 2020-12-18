import firebase from "firebase";
import React from "react";
import Box from "@material-ui/core/Box";
import Paper from "@material-ui/core/Paper";
import Modal from "@material-ui/core/Modal";
import Button from "@material-ui/core/Button";
import styled from "styled-components";
import { colors } from "common/colors";
import { UserInfo } from "../components/UserInfo";
import { useApp } from "@/store/app";
import { LoginForm } from "./LoginForm";
import { startGame } from "@/lib/startGame";

const OuterBox = styled(Box)`
  background-color: ${colors.purpleDark};
`;

const LoginModal = styled(Paper)`
  max-width: 800px;
  outline: 0;
  width: 100%;
  padding: 50px;
`;

const LoginHeading = styled.h2`
  font-weight: normal;
  margin: 0;
  margin-bottom: 15px;
`;

export const Header: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const currentUser = useApp((store) => store.user);
  const handleError = useApp((state) => state.handleError);
  const onPlay = () => {
    startGame(console.log).catch(handleError);
  };
  const onLogout = () => {
    firebase
      .auth()
      .signOut()
      .then(() => {
        // Sign-out successful.
      })
      .catch((err) => {
        handleError(err);
      });
  };
  return (
    <div>
      <OuterBox
        display="flex"
        flexDirection="row"
        justifyContent="space-between"
      >
        {currentUser ? (
          <Button onClick={onPlay}>Play now</Button>
        ) : (
          <Button onClick={() => setOpen(true)}>Log in</Button>
        )}
        {currentUser && <UserInfo user={currentUser} onLogout={onLogout} />}
      </OuterBox>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <LoginModal>
          <LoginHeading>Login</LoginHeading>
          <LoginForm onSuccess={() => setOpen(false)} />
        </LoginModal>
      </Modal>
    </div>
  );
};
