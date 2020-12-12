import firebase from "firebase";
import { useHistory } from "react-router-dom";
import { AppContext } from "@/store";
import React from "react";
import { Header } from "@/components/Header";
import { startGame } from "@/lib/startGame";

export const HomeView: React.FC = () => {
  const history = useHistory();
  const { state } = React.useContext(AppContext);
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
        currentUser={state.user}
      />
      <h3>here is some latest slippi news</h3>
    </div>
  );
};
