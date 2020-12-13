import React from "react";
import { AppContext } from "@/store";
import { QuickStart } from "@/containers/QuickStart/QuickStart";
import Box from "@material-ui/core/Box";
import { ThemeProvider } from "@material-ui/core/styles";
import { createMuiTheme } from "@material-ui/core/styles";

const theme = createMuiTheme({
  palette: {
    primary: {
      main: "#ffffff",
    },
  },
});

export const LandingView: React.FC = () => {
  const { state } = React.useContext(AppContext);

  return (
    <Box display="flex" style={{ height: "100%", width: "100%" }}>
      <ThemeProvider theme={theme}>
        <QuickStart user={state.user} />
      </ThemeProvider>
    </Box>
  );
};
