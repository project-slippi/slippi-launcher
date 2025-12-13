import "../src/renderer/styles/styles.scss"

import { slippiTheme } from "../src/renderer/styles/theme";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import React from 'react';
import type { Preview } from "@storybook/react";

const preview: Preview = {
  decorators: [
    (Story) => (
      <MuiThemeProvider theme={slippiTheme}>
        <Story />
      </MuiThemeProvider>
    ),
  ],
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;
