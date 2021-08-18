/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import React from "react";

import { LoadingScreen } from "@/components/LoadingScreen";
import { BuildInfo } from "@/containers/Settings/BuildInfo";
import { useAppStore } from "@/lib/hooks/useApp";
import { withSlippiBackground } from "@/styles/withSlippiBackground";

export const LoadingView: React.FC = () => {
  const installStatus = useAppStore((store) => store.logMessage);
  return (
    <div
      css={css`
        height: 100%;
        width: 100%;
      `}
    >
      <LoadingScreen css={withSlippiBackground} message={installStatus ? installStatus : "Just a sec..."} />
      <div
        css={css`
          position: fixed;
          bottom: 0;
          left: 0;
        `}
      >
        <BuildInfo />
      </div>
    </div>
  );
};
