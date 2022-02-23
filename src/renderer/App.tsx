import "./styles/styles.scss";

import { ThemeProvider } from "@emotion/react";
import { MuiThemeProvider, StylesProvider } from "@material-ui/core/styles";
import React from "react";
import { hot } from "react-hot-loader/root";
import { QueryClient, QueryClientProvider } from "react-query";
import { HashRouter as Router, Redirect, Route, Switch } from "react-router-dom";
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
    <Switch>
      <Route path="/main" component={MainView} />
      <Route path="/landing" component={LandingView} />
      <Route path="/settings" component={SettingsView} />
      <Route exact path="/" component={() => <Redirect to="/landing" />} />
      <Route component={NotFoundView} />
    </Switch>
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
export default hot(AppWithProviders);
