import React from "react";

import { useAdvancedUser } from "@/lib/hooks/use_advanced_user";

export const DevGuard = ({ render, show }: { show?: boolean; render: () => React.ReactNode }) => {
  const isAdvancedUser = useAdvancedUser((store) => store.isAdvancedUser);

  if (!isAdvancedUser && !show) {
    return null;
  }
  return <React.Fragment>{render()}</React.Fragment>;
};
