/** @jsx jsx */
import { jsx } from "@emotion/react";
import React from "react";

import { LoadingScreen } from "@/components/LoadingScreen";
import { useAppStore } from "@/lib/hooks/useApp";
import { withSlippiBackground } from "@/styles/withSlippiBackground";

export const LoadingView: React.FC = () => {
  const installStatus = useAppStore((store) => store.logMessage);
  return <LoadingScreen css={withSlippiBackground} message={installStatus ? installStatus : "Just a sec..."} />;
};
