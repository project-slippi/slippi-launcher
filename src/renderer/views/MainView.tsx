import CastOutlinedIcon from "@material-ui/icons/CastOutlined";
import HomeOutlinedIcon from "@material-ui/icons/HomeOutlined";
import LiveTvOutlinedIcon from "@material-ui/icons/LiveTvOutlined";
import SlowMotionVideoIcon from "@material-ui/icons/SlowMotionVideo";
import React from "react";
import { Redirect, Route, Switch, useRouteMatch } from "react-router-dom";

import { PersistentNotification } from "@/components/PersistentNotification";
import { PrivateRoute } from "@/components/PrivateRoute";
import { Console } from "@/containers/Console";
import { Header } from "@/containers/Header";
import { LoginDialog } from "@/containers/Header/LoginDialog";
import { MenuItem } from "@/containers/Header/MainMenu";
import { Home } from "@/containers/Home";
import { ReplayBrowserPage } from "@/containers/ReplayBrowser/ReplayBrowserPage";
import { SpectatePage } from "@/containers/SpectatePage";
import { usePageNavigationShortcuts } from "@/lib/hooks/useShortcuts";

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
    component: <ReplayBrowserPage />,
    icon: <SlowMotionVideoIcon />,
  },

  {
    subpath: "spectate",
    title: "Spectate",
    component: <SpectatePage />,
    icon: <LiveTvOutlinedIcon />,
    private: true,
  },
  {
    subpath: "console",
    title: "Console Mirror",
    component: <Console />,
    icon: <CastOutlinedIcon />,
  },
];

export const MainView: React.FC = () => {
  const { path } = useRouteMatch();
  const defaultRoute = menuItems.find((item) => item.default);

  usePageNavigationShortcuts(menuItems.map((item) => `${path}/${item.subpath}`));

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
      <LoginDialog />
      <PersistentNotification />
    </div>
  );
};
