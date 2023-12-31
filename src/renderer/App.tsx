import "./styles/styles.scss";

import { ThemeProvider } from "@emotion/react";
import { StyledEngineProvider, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import React from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { HashRouter as Router, Navigate, Route, Routes } from "react-router-dom";

import { useAppStore } from "@/lib/hooks/useApp";

import { ToastProvider } from "./components/ToastProvider";
import { useAppListeners } from "./lib/hooks/useAppListeners";
import { lazyLoadSettingsPage } from "./pages/settings/load";
import { createServiceProvider } from "./services";
import type { Services } from "./services/types";
import { slippiTheme } from "./styles/theme";
import { LandingView } from "./views/LandingView";
import { LoadingView } from "./views/LoadingView";
import { MainView } from "./views/MainView";
import { NotFoundView } from "./views/NotFoundView";

export function createApp({ services }: { services: Services }): React.ComponentType {
  const { Page: SettingsPage } = lazyLoadSettingsPage();

  const App = () => {
    const initialized = useAppStore((state) => state.initialized);

    // Then add the rest of the app listeners
    useAppListeners();

    if (!initialized) {
      return <LoadingView />;
    }

    return (
      <Routes>
        <Route path="/main/*" element={<MainView />} />
        <Route path="/landing" element={<LandingView />} />
        <Route path="/settings/*" element={<SettingsPage />} />
        <Route path="/" element={<Navigate replace={true} to="/landing" />} />
        <Route element={<NotFoundView />} />
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

  return withProviders(App);
}
