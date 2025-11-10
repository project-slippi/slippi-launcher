import { css } from "@emotion/react";

import slippiLogo from "@/styles/images/slippi_logo.svg";

export const withSlippiBackground = css`
  &::before {
    content: "";
    background-image: url("${slippiLogo}");
    background-size: 50%;
    background-position: 110% 140%;
    background-repeat: no-repeat;
    position: fixed;
    top: 0;
    height: 100%;
    width: 100%;
    opacity: 0.02;
    z-index: -1;
  }
`;
