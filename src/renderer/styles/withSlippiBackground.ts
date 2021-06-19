import { css } from "@emotion/react";

import slippiLogo from "@/styles/images/slippi-logo.svg";

export const withSlippiBackground = css`
  &::before {
    content: "";
    background-image: url("${slippiLogo}");
    background-size: 50%;
    background-position: 110% 120%;
    background-repeat: no-repeat;
    position: fixed;
    top: 0;
    height: 100%;
    width: 100%;
    opacity: 0.1;
    z-index: -1;
  }
`;
