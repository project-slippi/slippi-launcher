import CastOutlinedIcon from "@material-ui/icons/CastOutlined";
import HomeOutlinedIcon from "@material-ui/icons/HomeOutlined";
import LiveTvOutlinedIcon from "@material-ui/icons/LiveTvOutlined";
import SlowMotionVideoIcon from "@material-ui/icons/SlowMotionVideo";
import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AuthGuard } from "@/components/AuthGuard";
import { PersistentNotification } from "@/components/PersistentNotification";
import { Console } from "@/containers/Console";
import { Header } from "@/containers/Header";
import { LoginDialog } from "@/containers/Header/LoginDialog";
import type { MenuItem } from "@/containers/Header/MainMenu";
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
  const defaultRoute = menuItems.find((item) => item.default);
  usePageNavigationShortcuts(menuItems.map((item) => `${item.subpath}`));

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
        <Header menuItems={menuItems} />
      </div>
      <div style={{ flex: 1, overflow: "auto", display: "flex" }}>
        <Routes>
          {menuItems.map((item) => {
            const element = item.private ? <AuthGuard>{item.component}</AuthGuard> : item.component;
            return <Route key={item.subpath} path={`${item.subpath}/*`} element={element} />;
          })}
          {defaultRoute && <Route path="*" element={<Navigate replace to={`${defaultRoute.subpath}`} />} />}
        </Routes>
      </div>
      <LoginDialog />
      <PersistentNotification />
    </div>
  );
};
