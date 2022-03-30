import "./styles/styles.scss";

import { ThemeProvider } from "@emotion/react";
import { StyledEngineProvider, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import React from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { HashRouter as Router, Navigate, Route, Routes } from "react-router-dom";

import { useAppStore } from "@/lib/hooks/useApp";

import { ToastProvider } from "./components/ToastProvider";
import { useAppListeners } from "./lib/hooks/useAppListeners";
import { ServiceProvider } from "./services";
import { slippiTheme } from "./styles/theme";
import { LandingView } from "./views/LandingView";
import { LoadingView } from "./views/LoadingView";
import { MainView } from "./views/MainView";
import { NotFoundView } from "./views/NotFoundView";
import { SettingsView } from "./views/SettingsView";

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
      <Route path="/settings/*" element={<SettingsView />} />
      <Route path="/" element={<Navigate replace to="/landing" />} />
      <Route element={<NotFoundView />} />
    </Routes>
  );
};

// Providers need to be initialized before the rest of the app can use them
const withProviders = (Component: React.ComponentType) => {
  return () => (
    <StyledEngineProvider injectFirst>
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

export default withProviders(App);
