import firebase from "firebase";
import React from "react";
import { LoginForm } from "./containers/LoginForm";
import { initializeFirebase } from "./lib/firebase";
import { AppContext, Action } from "./store";

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
      <pre>{JSON.stringify(state, null, 2)}</pre>
    </div>
  );
};
