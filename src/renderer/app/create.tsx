import "@/styles/styles.scss";

import { ThemeProvider } from "@emotion/react";
import CastOutlinedIcon from "@mui/icons-material/CastOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import LiveTvOutlinedIcon from "@mui/icons-material/LiveTvOutlined";
import SlowMotionVideoIcon from "@mui/icons-material/SlowMotionVideo";
import { StyledEngineProvider, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import React from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { HashRouter as Router, Navigate, Route, Routes } from "react-router-dom";

import { ToastProvider } from "@/components/toast_provider";
import { useAppStore } from "@/lib/hooks/use_app";
import { useAppListeners } from "@/lib/hooks/use_app_listeners";
import { usePageNavigationShortcuts } from "@/lib/hooks/use_shortcuts";
import { lazyLoadConsoleMirrorPage } from "@/pages/console_mirror/load";
import { HomePage } from "@/pages/home/home_page";
import { LoadingPage } from "@/pages/loading/loading_page";
import { NotFoundPage } from "@/pages/not_found/not_found_page";
import { lazyLoadQuickStartPage } from "@/pages/quick_start/load";
import { lazyLoadReplaysPage } from "@/pages/replays/load";
import { lazyLoadSettingsPage } from "@/pages/settings/load";
import { lazyLoadSpectatePage } from "@/pages/spectate/load";
import { createServiceProvider } from "@/services";
import type { Services } from "@/services/types";
import { slippiTheme } from "@/styles/theme";

import type { MainMenuItem } from "./app";
import { App as AppImpl } from "./app";

export function createApp({ services }: { services: Services }): {
  App: React.ComponentType;
} {
  const { Page: SettingsPage } = lazyLoadSettingsPage();
  const { Page: QuickStartPage } = lazyLoadQuickStartPage();
  const { Page: ReplaysPage } = lazyLoadReplaysPage();
  const { Page: SpectatePage } = lazyLoadSpectatePage({ broadcastService: services.broadcastService });
  const { Page: ConsoleMirrorPage } = lazyLoadConsoleMirrorPage();

  const menuItems: MainMenuItem[] = [
    {
      subpath: "home",
      title: "Home",
      Component: HomePage,
      Icon: HomeOutlinedIcon,
      default: true,
    },
    {
      subpath: "replays",
      title: "Replays",
      Component: ReplaysPage,
      Icon: SlowMotionVideoIcon,
    },
    {
      subpath: "spectate",
      title: "Spectate",
      Component: SpectatePage,
      Icon: LiveTvOutlinedIcon,
      private: true,
    },
    {
      subpath: "console",
      title: "Console Mirror",
      Component: ConsoleMirrorPage,
      Icon: CastOutlinedIcon,
    },
  ];

  const navigationPaths = menuItems.map((item) => item.subpath);

  const MainAppPage = React.memo(() => {
    usePageNavigationShortcuts(navigationPaths);

    return <AppImpl menuItems={menuItems} />;
  });

  const AppRoutes = () => {
    const initialized = useAppStore((state) => state.initialized);

    // Then add the rest of the app listeners
    useAppListeners();

    if (!initialized) {
      return <LoadingPage />;
    }

    return (
      <Routes>
        <Route path="/main/*" element={<MainAppPage />} />
        <Route path="/landing" element={<QuickStartPage />} />
        <Route path="/settings/*" element={<SettingsPage />} />
        <Route path="/" element={<Navigate replace={true} to="/landing" />} />
        <Route element={<NotFoundPage />} />
      </Routes>
    );
  };

  const { ServiceProvider } = createServiceProvider({ services });

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchIntervalInBackground: false,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchInterval: false,
        retry: false,
      },
    },
  });

  // Providers need to be initialized before the rest of the app can use them
  const withProviders = (Component: React.ComponentType) => {
    return () => (
      <StyledEngineProvider injectFirst={true}>
        <MuiThemeProvider theme={slippiTheme}>
          <ThemeProvider theme={slippiTheme as any}>
            <QueryClientProvider client={queryClient}>
              <ToastProvider>
                <ServiceProvider>
                  <Router>
                    <Component />
                  </Router>
                </ServiceProvider>
              </ToastProvider>
            </QueryClientProvider>
          </ThemeProvider>
        </MuiThemeProvider>
      </StyledEngineProvider>
    );
  };

  return { App: withProviders(AppRoutes) };
}
