import { useHistory } from "react-router-dom";
import { AppContext } from "@/store";
import React from "react";

export const HomeView: React.FC = () => {
  const history = useHistory();
  const { state } = React.useContext(AppContext);
  const isLogged = state.initialized && state.user;
  return (
    <div>
      <h3>here is some latest slippi news</h3>

      {isLogged ? (
        <button>Play</button>
      ) : (
        <button onClick={() => history.push("/login")}>Log in</button>
      )}
    </div>
  );
};
