import React from "react";

import { useAccount } from "@/lib/hooks/use_account";

import { LoginNotice } from "./login_notice/login_notice";

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const user = useAccount((store) => store.user);
  const isLoggedIn = user !== null;
  if (!isLoggedIn) {
    return <LoginNotice />;
  }
  return <>{children}</>;
};
