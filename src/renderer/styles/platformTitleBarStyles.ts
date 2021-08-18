import { css } from "@emotion/react";

import { isMac } from "../../common/constants";

// Some platforms, like macOS, need to account for extra padding at the top of the window for
// the proper OS styling.
export const platformTitleBarStyles = (height = 15) =>
  isMac
    ? css`
        ${height > 0 ? `padding-top: ${height}px;` : ""}
        user-select: none;
        -webkit-app-region: drag;
      `
    : css``;
