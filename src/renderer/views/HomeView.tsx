import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import { useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import HomeOutlinedIcon from "@material-ui/icons/HomeOutlined";
import LiveTvOutlinedIcon from "@material-ui/icons/LiveTvOutlined";
import ReplayOutlinedIcon from "@material-ui/icons/ReplayOutlined";
import WifiTetheringOutlinedIcon from "@material-ui/icons/WifiTetheringOutlined";
import React from "react";
import { Redirect, Route, Switch, useRouteMatch } from "react-router-dom";

import { PrivateRoute } from "@/components/PrivateRoute";
import { Broadcast } from "@/containers/Broadcast";
import { Header } from "@/containers/Header";
import { MenuItem } from "@/containers/Header/MainMenu";
import { Home } from "@/containers/Home";
import { LoginForm } from "@/containers/LoginForm";
import { ReplayBrowser } from "@/containers/ReplayBrowser";
import { SpectatePage } from "@/containers/SpectatePage";
import { useLoginModal } from "@/lib/hooks/useLoginModal";

interface MainMenuItem extends MenuItem {
  component: React.ReactNode;
  default?: boolean;
  private?: boolean;
}

const menuItems: MainMenuItem[] = [
  {
    subpath: "home",
    title: "Home",
    component: <Home />,
    icon: <HomeOutlinedIcon />,
    default: true,
  },
  {
    subpath: "replays",
    title: "Replays",
    component: <ReplayBrowser />,
    icon: <ReplayOutlinedIcon />,
  },

  {
    subpath: "spectate",
    title: "Spectate",
    component: <SpectatePage />,
    icon: <LiveTvOutlinedIcon />,
    private: true,
  },
  {
    subpath: "broadcast",
    title: "Broadcast",
    component: <Broadcast />,
    icon: <WifiTetheringOutlinedIcon />,
    private: true,
  },
];

export const HomeView: React.FC = () => {
  const { path } = useRouteMatch();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("xs"));
  const closeModal = useLoginModal((store) => store.closeModal);
  const loginModalOpen = useLoginModal((store) => store.open);
  const defaultRoute = menuItems.find((item) => item.default);
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
        <Header path={path} menuItems={menuItems} />
      </div>
      <div style={{ flex: 1, overflow: "auto", display: "flex" }}>
        <Switch>
          {menuItems.map((item) => {
            const RouteToUse = item.private ? PrivateRoute : Route;
            return (
              <RouteToUse key={item.subpath} path={`${path}/${item.subpath}`}>
                {item.component}
              </RouteToUse>
            );
          })}
          {defaultRoute && <Redirect exact from={path} to={`${path}/${defaultRoute.subpath}`} />}
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
