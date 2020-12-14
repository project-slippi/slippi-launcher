import firebase from "firebase";
import { Link, useHistory } from "react-router-dom";
import { AppContext } from "@/store";
import React from "react";
import { Header } from "@/components/Header";
import { startGame } from "@/lib/startGame";
import { Setting, useSetting } from "@/lib/hooks/useSetting";
import Button from "@material-ui/core/Button";

export const HomeView: React.FC = () => {
  const history = useHistory();
  const { state } = React.useContext(AppContext);
  const [_isoPath, setIsoPath] = useSetting<string>(Setting.ISO_PATH);
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
      <button onClick={() => setIsoPath(null)}>clear iso</button>
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
