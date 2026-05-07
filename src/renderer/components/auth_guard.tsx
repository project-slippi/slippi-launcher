import React from "react";

import { useAccount } from "@/lib/hooks/use_account";
import type { AuthUser } from "@/services/auth/types";

export const AuthGuard = ({
  fallback,
  render,
}: {
  fallback?: React.ReactNode;
  render: (user: AuthUser) => React.ReactNode;
}) => {
  const user = useAccount((store) => store.user);
  if (!user) {
    return fallback ?? null;
  }
  return <>{render(user)}</>;
};
