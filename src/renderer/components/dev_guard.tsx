import React from "react";

import { useAdvancedUser } from "@/lib/hooks/use_advanced_user";

export const DevGuard = ({ children, show }: React.PropsWithChildren<{ show?: boolean }>) => {
  const isAdvancedUser = useAdvancedUser((store) => store.isAdvancedUser);

  if (!isAdvancedUser && !show) {
    return null;
  }
  return <React.Fragment>{children}</React.Fragment>;
};
