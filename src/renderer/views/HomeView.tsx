import styled from "styled-components";
import {
  Link,
  Redirect,
  Route,
  Switch,
  useHistory,
  useRouteMatch,
} from "react-router-dom";
import React from "react";
import { Header } from "@/containers/Header";
import Button from "@material-ui/core/ButtonBase";
import { ReplayBrowser } from "@/containers/ReplayBrowser";

const MenuButton = styled.div<{
  selected?: boolean;
}>`
  padding: 5px 10px;
  ${(props) =>
    props.selected
      ? `
text-decoration: underline;
  `
      : `
  opacity: 0.5;
  `}
`;

export const HomeView: React.FC = () => {
  const history = useHistory();
  const isActive = (name: string): boolean => {
    return history.location.pathname === `${path}/${name}`;
  };
  const { path } = useRouteMatch();
  return (
    <div
      style={{
        display: "flex",
        flexFlow: "column",
        height: "100%",
        width: "100%",
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <Header />
        <div>
          <Button component={Link} to={`${path}/home`}>
            <MenuButton selected={isActive("home")}>Home</MenuButton>
          </Button>
          <Button component={Link} to={`${path}/replays`}>
            <MenuButton selected={isActive("replays")}>Replays</MenuButton>
          </Button>
          <Button component={Link} to={`${path}/spectate`}>
            <MenuButton selected={isActive("spectate")}>Spectate</MenuButton>
          </Button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
        <Switch>
          <Route path={`${path}/home`}>
            <h1>Home</h1>
          </Route>
          <Route path={`${path}/replays`}>
            <ReplayBrowser />
          </Route>
          <Route path={`${path}/spectate`}>
            <h1>Spectate</h1>
          </Route>
          <Redirect exact from={path} to={`${path}/home`} />
        </Switch>
      </div>
    </div>
  );
};
