import { css } from "@emotion/react";

import { LoadingScreen } from "@/components/loading_screen";
import { BuildInfo } from "@/containers/build_info";
import { withSlippiBackground } from "@/styles/with_slippi_background";

export const LoadingPage = () => {
  return (
    <div
      css={css`
        height: 100%;
        width: 100%;
      `}
    >
      <LoadingScreen css={withSlippiBackground} message="Just a sec..." />
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
