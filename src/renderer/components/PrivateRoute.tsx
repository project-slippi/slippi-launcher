import React from "react";
import { Route, RouteProps } from "react-router-dom";

import { useAccount } from "@/lib/hooks/useAccount";

import { LoginNotice } from "./LoginNotice";

export const PrivateRoute: React.FC<RouteProps> = ({ children, component: Component, ...rest }) => {
  const user = useAccount((store) => store.user);
  const isLoggedIn = user !== null;

  return (
    <Route
      {...rest}
      render={(props) => {
        if (!isLoggedIn) {
          return <LoginNotice />;
        }

        if (!Component && children) {
          return children;
        }

        if (Component) {
          return <Component {...props} />;
        }

        return null;
      }}
    />
  );
};
