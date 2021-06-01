import React from "react";

import { LoadingScreen } from "@/components/LoadingScreen";
import { useApp } from "@/store/app";

export const LoadingView: React.FC = () => {
  const installStatus = useApp((store) => store.logMessage);
  return <LoadingScreen message={installStatus ? installStatus : "Just a sec..."} />;
};
