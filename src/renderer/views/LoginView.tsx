import React from "react";

import { LoginForm } from "@/containers/LoginForm";
import { AppContext } from "@/store";
import { Redirect, useHistory } from "react-router-dom";

export const LoginView: React.FC = () => {
  const history = useHistory();
  const { state } = React.useContext(AppContext);

  // If we already have a user just navigate to home
  if (state.user) {
    return <Redirect to="/home" />;
  }

  return (
    <div>
      <LoginForm />
      <button onClick={() => history.push("/home")}>skip for now</button>
    </div>
  );
};
