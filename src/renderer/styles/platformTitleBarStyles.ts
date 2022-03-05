import { css } from "@emotion/react";

const isMac = window.electron.common.isMac;

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
