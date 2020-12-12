import "typeface-roboto/index.css";
import "./styles/styles.scss";

import { hot } from "react-hot-loader/root";
import firebase from "firebase";
import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";

import { init } from "./lib/init";
import { AppContext, Action, AppProvider } from "./store";
import { HomeView } from "./views/HomeView";
import { LoadingView } from "./views/LoadingView";
import { LoginView } from "./views/LoginView";
import { MuiThemeProvider } from "@material-ui/core";
import { slippiTheme } from "./styles/theme";

const App: React.FC = () => {
  const { state, dispatch } = React.useContext(AppContext);
  React.useEffect(() => {
    // Initialize firebase
    const startup = init((message) => {
      dispatch({
        type: Action.SET_INSTALL_STATUS,
        payload: message,
      });
    });

    // Subscribe to user auth changes
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      dispatch({
        type: Action.SET_USER,
        payload: {
          user,
        },
      });

      startup
        .then(() => {
          // Clear the installation status when finished
          dispatch({
            type: Action.SET_INSTALL_STATUS,
            payload: "",
          });
        })
        .catch((err) => {
          // Set the install status as the error message
          dispatch({
            type: Action.SET_INSTALL_STATUS,
            payload: err.message,
          });
        })
        .finally(() => {
          // Tell the rest of the app we're done loading
          if (!state.initialized) {
            dispatch({
              type: Action.SET_INITIALIZED,
            });
          }
        });
    });

    // Unsubscribe on unmount
    return unsubscribe;
  }, []);

  if (!state.initialized) {
    return <LoadingView />;
  }

  return (
    <Router>
      <Switch>
        <Route path="/home" component={HomeView} />
        <Route path="/login" component={LoginView} />
        <Redirect from="/" to="/login" />
      </Switch>
    </Router>
  );
};

// Providers need to be initialized before the rest of the app can use them
const AppWithProviders: React.FC = () => {
  return (
    <AppProvider>
      <MuiThemeProvider theme={slippiTheme}>
        <App />
      </MuiThemeProvider>
    </AppProvider>
  );
};

// eslint-disable-next-line import/no-default-export
export default hot(AppWithProviders);
