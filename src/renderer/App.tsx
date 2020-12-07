import firebase from "firebase";
import React from "react";
import { LoginForm } from "./containers/LoginForm";
import { PlayKey } from "./containers/PlayKey";
import { initializeFirebase } from "./lib/firebase";
import { AppContext, Action } from "./store";
import { CheckDolphinUpdates } from "./components/CheckDolphinUpdates";

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
    });

    // Unsubscribe on unmount
    return unsubscribe;
  }, []);

  return (
    <div>
      Hello world!
      <LoginForm />
      <PlayKey />
      <CheckDolphinUpdates />
      <pre>{JSON.stringify(state, null, 2)}</pre>
    </div>
  );
};
