import { css } from "@emotion/react";

import { BuildInfo } from "@/components/build_info/build_info";
import { LoadingScreen } from "@/components/loading_screen";
import { withSlippiBackground } from "@/styles/with_slippi_background";

import { LoadingPageMessages as Messages } from "./loading_page.messages";

export const LoadingPage = () => {
  return (
    <div
      css={css`
        height: 100%;
        width: 100%;
      `}
    >
      <LoadingScreen css={withSlippiBackground} message={Messages.justASec()} />
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
