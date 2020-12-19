import "typeface-roboto/index.css";
import "overlayscrollbars/css/OverlayScrollbars.css";
import "./styles/styles.scss";

import { hot } from "react-hot-loader/root";
import firebase from "firebase";
import React from "react";
import {
  HashRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";

import { HomeView } from "./views/HomeView";
import { LoadingView } from "./views/LoadingView";
import { MuiThemeProvider, StylesProvider } from "@material-ui/core/styles";
import { slippiTheme } from "./styles/theme";
import { LandingView } from "./views/LandingView";
import { NotFoundView } from "./views/NotFoundView";
import { SettingsView } from "./views/SettingsView";

import { useApp } from "@/store/app";
import { initializeFirebase } from "./lib/firebase";
import Snackbar from "@material-ui/core/Snackbar";

const App: React.FC = () => {
  const initialized = useApp((state) => state.initialized);
  const snackbarOpen = useApp((state) => state.snackbarOpen);
  const snackbarContent = useApp((state) => state.snackbarContent);
  const dismissSnackbar = useApp((state) => state.dismissSnackbar);
  const init = useApp((state) => state.initialize);
  const setUser = useApp((state) => state.setUser);

  React.useEffect(() => {
    // Initialize the Firebase app if we haven't already
    initializeFirebase();

    // Subscribe to user auth changes
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      // Set the user
      setUser(user);

      // Initialize the rest if we haven't already
      if (!initialized) {
        init();
      }
    });

    // Unsubscribe on unmount
    return unsubscribe;
  }, [initialized]);

  if (!initialized) {
    return <LoadingView />;
  }

  return (
    <Router>
      <Switch>
        <Route path="/home" component={HomeView} />
        <Route path="/landing" component={LandingView} />
        <Route path="/settings" component={SettingsView} />
        <Redirect exact from="/" to="/landing" />
        <Route component={NotFoundView} />
      </Switch>
      <Snackbar open={snackbarOpen} onClose={dismissSnackbar}>
        {snackbarContent}
      </Snackbar>
    </Router>
  );
};

// Providers need to be initialized before the rest of the app can use them
const AppWithProviders: React.FC = () => {
  return (
    <StylesProvider injectFirst>
      <MuiThemeProvider theme={slippiTheme}>
        <App />
      </MuiThemeProvider>
    </StylesProvider>
  );
};

// eslint-disable-next-line import/no-default-export
export default hot(AppWithProviders);
