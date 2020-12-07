import firebase from "firebase";
import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";

import { initializeFirebase } from "./lib/firebase";
import { AppContext, Action } from "./store";
import { HomeView } from "./views/HomeView";
import { LoadingView } from "./views/LoadingView";
import { LoginView } from "./views/LoginView";

initializeFirebase();

export const App: React.FC = () => {
  const { state, dispatch } = React.useContext(AppContext);
  React.useEffect(() => {
    // Subscribe to user auth changes
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      dispatch({
        type: Action.SET_USER,
        payload: {
          user,
        },
      });

      if (!state.initialized) {
        dispatch({
          type: Action.SET_INITIALIZED,
        });
      }
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
