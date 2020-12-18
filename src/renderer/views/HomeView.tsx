import { Link, Redirect, Route, Switch, useRouteMatch } from "react-router-dom";
import React from "react";
import { Header } from "@/containers/Header";
import Button from "@material-ui/core/Button";
import { useModal } from "@/lib/hooks/useModal";

export const HomeView: React.FC = () => {
  const { open } = useModal("/settings");
  const { path } = useRouteMatch();
  return (
    <div>
      <Header />
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
