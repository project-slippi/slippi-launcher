import { css } from "@emotion/react";

// Some platforms, like macOS, need to account for extra padding at the top of the window for
// the proper OS styling.
const platformTitleBarStyles =
  process.platform === "darwin"
    ? css`
        padding-top: 32px;
        -webkit-user-select: none;
        -webkit-app-region: drag;
      `
    : "";

export default platformTitleBarStyles;
