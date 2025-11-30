import CastOutlinedIcon from "@mui/icons-material/CastOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import LiveTvOutlinedIcon from "@mui/icons-material/LiveTvOutlined";
import SlowMotionVideoIcon from "@mui/icons-material/SlowMotionVideo";
import React from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { HashRouter as Router, Navigate, Route, Routes } from "react-router-dom";

import { useAppStore } from "@/lib/hooks/use_app_store";
import { usePageRequestListeners } from "@/lib/hooks/use_page_request_listeners";
import { usePageNavigationShortcuts } from "@/lib/hooks/use_shortcuts";
import { lazyLoadConsoleMirrorPage } from "@/pages/console_mirror/load";
import { HomePage } from "@/pages/home/home_page";
import { NotFoundPage } from "@/pages/not_found/not_found_page";
import { lazyLoadQuickStartPage } from "@/pages/quick_start/load";
import { QuickStartStep, useQuickStartStore } from "@/pages/quick_start/use_quick_start";
import { lazyLoadReplaysPage } from "@/pages/replays/load";
import { lazyLoadSettingsPage } from "@/pages/settings/load";
import { lazyLoadSpectatePage } from "@/pages/spectate/load";
import { createServiceProvider } from "@/services";
import type { Services } from "@/services/types";

import type { MainMenuItem } from "./app";
import { App as AppImpl } from "./app";
import { CreateAppMessages as Messages } from "./create.messages";

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
      title: () => Messages.home(),
      Component: HomePage,
      Icon: HomeOutlinedIcon,
      default: true,
    },
    {
      subpath: "replays",
      title: () => Messages.replays(),
      Component: ReplaysPage,
      Icon: SlowMotionVideoIcon,
    },
    {
      subpath: "spectate",
      title: () => Messages.spectate(),
      Component: SpectatePage,
      Icon: LiveTvOutlinedIcon,
      private: true,
    },
    {
      subpath: "console",
      title: () => Messages.console(),
      Component: ConsoleMirrorPage,
      Icon: CastOutlinedIcon,
    },
  ];

  const navigationPaths = menuItems.map((item) => item.subpath);

  const MainAppPage = React.memo(() => {
    usePageNavigationShortcuts(navigationPaths);

    return <AppImpl menuItems={menuItems} />;
  });

  // Smart root redirect that checks if quick start is needed
  const RootRedirect = () => {
    const steps = useQuickStartStore((store) => store.steps);

    // If we have quick start steps and the first step is not the complete step, show the landing (quick start) page
    if (steps.length > 0 && steps[0] !== QuickStartStep.COMPLETE) {
      return <Navigate to="/landing" replace={true} />;
    }

    // Otherwise, go to the main page
    return <Navigate to="/main" replace={true} />;
  };

  const AppRoutes = () => {
    const currentLanguage = useAppStore((state) => state.currentLanguage);

    // Then add the page request listeners
    usePageRequestListeners();

    return (
      <Routes key={currentLanguage}>
        <Route path="/main/*" element={<MainAppPage />} />
        <Route path="/landing" element={<QuickStartPage />} />
        <Route path="/settings/*" element={<SettingsPage />} />
        <Route path="/" element={<RootRedirect />} />
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
      <QueryClientProvider client={queryClient}>
        <ServiceProvider>
          <Router
            future={{
              v7_startTransition: true,
            }}
          >
            <Component />
          </Router>
        </ServiceProvider>
      </QueryClientProvider>
    );
  };

  return { App: withProviders(AppRoutes) };
}
