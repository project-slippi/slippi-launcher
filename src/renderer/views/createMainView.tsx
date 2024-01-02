import type { BroadcastService } from "@broadcast/types";
import CastOutlinedIcon from "@mui/icons-material/CastOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import LiveTvOutlinedIcon from "@mui/icons-material/LiveTvOutlined";
import SlowMotionVideoIcon from "@mui/icons-material/SlowMotionVideo";
import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AuthGuard } from "@/components/AuthGuard";
import { PersistentNotification } from "@/components/PersistentNotification";
import { Header } from "@/containers/Header";
import { LoginDialog } from "@/containers/Header/LoginDialog";
import type { MenuItem } from "@/containers/Header/MainMenu";
import { ReplayBrowserPage } from "@/containers/ReplayBrowser/ReplayBrowserPage";
import { usePageNavigationShortcuts } from "@/lib/hooks/useShortcuts";
import { lazyLoadConsoleMirrorPage } from "@/pages/console_mirror/load";
import { HomePage } from "@/pages/home/HomePage";
import { lazyLoadSpectatePage } from "@/pages/spectate/load";

type MainMenuItem = MenuItem & {
  component: React.ReactNode;
  default?: boolean;
  private?: boolean;
};

export function createMainView({ broadcastService }: { broadcastService: BroadcastService }): {
  MainView: React.ComponentType;
} {
  const { Page: SpectatePage } = lazyLoadSpectatePage({ broadcastService });
  const { Page: ConsoleMirrorPage } = lazyLoadConsoleMirrorPage();

  const menuItems: MainMenuItem[] = [
    {
      subpath: "home",
      title: "Home",
      component: <HomePage />,
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
      component: <ConsoleMirrorPage />,
      icon: <CastOutlinedIcon />,
    },
  ];

  const navigationPaths = menuItems.map((item) => `${item.subpath}`);
  const defaultRoute = menuItems.find((item) => item.default);

  const MainView = React.memo(() => {
    usePageNavigationShortcuts(navigationPaths);

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
            {defaultRoute && <Route path="*" element={<Navigate replace={true} to={`${defaultRoute.subpath}`} />} />}
          </Routes>
        </div>
        <LoginDialog />
        <PersistentNotification />
      </div>
    );
  });

  return { MainView };
}
