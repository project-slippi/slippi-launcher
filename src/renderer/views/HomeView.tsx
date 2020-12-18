import firebase from "firebase";
import {
  Link,
  Redirect,
  Route,
  Switch,
  useHistory,
  useRouteMatch,
} from "react-router-dom";
import React from "react";
import { Header } from "@/components/Header";
import { startGame } from "@/lib/startGame";
import Button from "@material-ui/core/Button";
import { useApp } from "@/store/app";
import { useModal } from "@/lib/hooks/useModal";

export const HomeView: React.FC = () => {
  const { open } = useModal("/settings");
  const user = useApp((state) => state.user);
  const history = useHistory();
  const { path } = useRouteMatch();
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
        onClick={open}
        style={{ textTransform: "none" }}
      >
        Settings
      </Button>
      <Link to={`${path}/foo`}>foo</Link>
      <Link to={`${path}/bar`}>bar</Link>
      <Link to={`${path}/baz`}>baz</Link>
      <Switch>
        <Route path={`${path}/foo`}>
          <h1>foo</h1>
        </Route>
        <Route path={`${path}/bar`}>
          <h1>bar</h1>
        </Route>
        <Route path={`${path}/baz`}>
          <h1>baz</h1>
        </Route>
        <Redirect exact from="/" to={`${path}/foo`} />
      </Switch>
    </div>
  );
};
