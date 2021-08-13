import { css } from "@emotion/react";

import { isMac } from "../../common/constants";

// Some platforms, like macOS, need to account for extra padding at the top of the window for
// the proper OS styling.
export const platformTitleBarStyles = isMac
  ? css`
      padding-top: 32px;
      -webkit-user-select: none;
      -webkit-app-region: drag;
    `
  : "";
