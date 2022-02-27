import "./styles/styles.scss";

import { ThemeProvider } from "@emotion/react";
import { MuiThemeProvider, StylesProvider } from "@material-ui/core/styles";
import React from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { HashRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import { ToastProvider } from "react-toast-notifications";

import { useAppStore } from "@/lib/hooks/useApp";

import { CustomToast } from "./components/CustomToast";
import { useAppListeners } from "./lib/hooks/useAppListeners";
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

const App: React.FC = () => {
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
const AppWithProviders: React.FC = () => {
  return (
    <StylesProvider injectFirst>
      <MuiThemeProvider theme={slippiTheme}>
        <ThemeProvider theme={slippiTheme}>
          <QueryClientProvider client={queryClient}>
            <ToastProvider components={{ Toast: CustomToast }} placement="bottom-right">
              <Router>
                <App />
              </Router>
            </ToastProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </MuiThemeProvider>
    </StylesProvider>
  );
};

// eslint-disable-next-line import/no-default-export
export default AppWithProviders;
