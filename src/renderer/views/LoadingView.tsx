import { colors } from "common/colors";
import React from "react";

import { LoadingScreen } from "@/components/LoadingScreen";
import { useApp } from "@/store/app";

export const LoadingView: React.FC = () => {
  const installStatus = useApp((store) => store.logMessage);
  return (
    <LoadingScreen
      style={{ backgroundColor: colors.offGray }}
      message={installStatus ? installStatus : "Just a sec..."}
    />
  );
};
