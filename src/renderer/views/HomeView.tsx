import firebase from "firebase";
import { Link, useHistory } from "react-router-dom";
import React from "react";
import { Header } from "@/components/Header";
import { startGame } from "@/lib/startGame";
import Button from "@material-ui/core/Button";
import { useApp } from "@/store/app";

export const HomeView: React.FC = () => {
  const user = useApp((state) => state.user);
  const history = useHistory();
  const onLogin = () => {
    history.push("/login");
  };

  const onLogout = () => {
    firebase
      .auth()
      .signOut()
      .then(() => {
        // Sign-out successful.
      })
      .catch((err) => {
        console.error(err);
      });
  };

  return (
    <div>
      <Header
        onPlay={() => startGame(console.log)}
        onLogin={onLogin}
        onLogout={onLogout}
        currentUser={user}
      />
      <h3>here is some latest slippi news</h3>
      <Button
        color="primary"
        variant="contained"
        component={Link}
        to="/settings"
        style={{ textTransform: "none" }}
      >
        Settings
      </Button>
    </div>
  );
};
