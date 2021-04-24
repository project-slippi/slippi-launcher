import Button from "@material-ui/core/ButtonBase";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import { useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import React from "react";
import { Link, Redirect, Route, Switch, useHistory, useRouteMatch } from "react-router-dom";
import styled from "styled-components";

import { PrivateRoute } from "@/components/PrivateRoute";
import { Broadcast } from "@/containers/Broadcast";
import { Header } from "@/containers/Header";
import { Home } from "@/containers/Home";
import { LoginForm } from "@/containers/LoginForm";
import { ReplayBrowser } from "@/containers/ReplayBrowser";
import { SpectatePage } from "@/containers/SpectatePage";
import { useLoginModal } from "@/lib/hooks/useLoginModal";

const MenuButton = styled.div<{
  selected?: boolean;
}>`
  padding: 5px 10px;
  ${(props) => (props.selected ? "text-decoration: underline;" : "opacity: 0.5;")}
`;

export const HomeView: React.FC = () => {
  const history = useHistory();
  const isActive = (name: string): boolean => {
    return history.location.pathname === `${path}/${name}`;
  };
  const { path } = useRouteMatch();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("xs"));
  const closeModal = useLoginModal((store) => store.closeModal);
  const loginModalOpen = useLoginModal((store) => store.open);
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
          <Button component={Link} to={`${path}/broadcast`}>
            <MenuButton selected={isActive("broadcast")}>Broadcast</MenuButton>
          </Button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", display: "flex" }}>
        <Switch>
          <Route path={`${path}/home`}>
            <Home />
          </Route>
          <Route path={`${path}/replays`}>
            <ReplayBrowser />
          </Route>
          <PrivateRoute path={`${path}/spectate`}>
            <SpectatePage />
          </PrivateRoute>
          <PrivateRoute path={`${path}/broadcast`}>
            <Broadcast />
          </PrivateRoute>
          <Redirect exact from={path} to={`${path}/home`} />
        </Switch>
      </div>
      <Dialog open={loginModalOpen} onClose={closeModal} fullWidth={true} fullScreen={fullScreen}>
        <DialogTitle>Slippi Login</DialogTitle>
        <DialogContent>
          <LoginForm onSuccess={closeModal} />
        </DialogContent>
      </Dialog>
    </div>
  );
};
