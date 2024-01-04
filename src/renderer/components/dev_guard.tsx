import React from "react";

import { useAdvancedUser } from "@/lib/useAdvancedUser";

export const DevGuard = ({ children, show }: React.PropsWithChildren<{ show?: boolean }>) => {
  const isAdvancedUser = useAdvancedUser((store) => store.isAdvancedUser);

  if (!isAdvancedUser && !show) {
    return null;
  }
  return <React.Fragment>{children}</React.Fragment>;
};
