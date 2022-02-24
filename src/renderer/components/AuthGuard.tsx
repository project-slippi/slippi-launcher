import React from "react";

import { useAccount } from "@/lib/hooks/useAccount";

import { LoginNotice } from "./LoginNotice";

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const user = useAccount((store) => store.user);
  const isLoggedIn = user !== null;
  if (!isLoggedIn) {
    return <LoginNotice />;
  }
  return <>{children}</>;
};
