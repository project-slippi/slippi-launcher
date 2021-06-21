import { createMuiTheme, Theme } from "@material-ui/core/styles";
import { colors } from "common/colors";

import { withFont } from "./withFont";

const rubikFont = withFont("Rubik");
const mavenProFont = withFont("Maven Pro");

const theme = createMuiTheme({
  palette: {
    type: "dark",
    text: {
      primary: "#E9EAEA",
      secondary: "#B4B4B4",
    },
    primary: {
      main: colors.greenPrimary,
    },
    secondary: {
      main: colors.purplePrimary,
    },
    divider: "rgba(255,255,255)",
    background: {
      paper: colors.purpleDark,
      default: colors.purple,
    },
  },
  typography: {
    fontFamily: rubikFont,
    fontSize: 16,
    h1: {
      fontFamily: mavenProFont,
    },
    h2: {
      fontFamily: mavenProFont,
    },
    h3: {
      fontFamily: mavenProFont,
    },
    h4: {
      fontFamily: mavenProFont,
    },
    h5: {
      fontFamily: mavenProFont,
    },
    h6: {
      fontFamily: mavenProFont,
    },
  },
});

const addOverrides = (theme: Theme) => {
  return createMuiTheme({
    ...theme,
    props: {
      MuiTooltip: {
        arrow: true,
      },
      MuiTextField: {
        variant: "filled",
        fullWidth: true,
        size: "small",
      },
    },
    overrides: {
      MuiPaper: {
        root: {
          borderStyle: "solid",
          borderWidth: "1px",
          borderColor: "transparent",
        },
        rounded: {
          borderRadius: "10px",
          overflow: "hidden",
        },
      },
      MuiCheckbox: {
        root: {
          color: colors.purplePrimary,
        },
      },
      MuiTableCell: {
        root: {
          borderBottomColor: "#1E1F25",
        },
      },
      MuiListItemIcon: {
        root: {
          minWidth: "initial",
        },
      },
      MuiTooltip: {
        arrow: {
          color: colors.offWhite,
        },
        tooltip: {
          backgroundColor: colors.offWhite,
          color: colors.purpleDarker,
          boxShadow: theme.shadows[1],
          fontSize: 13,
        },
      },
      MuiButtonBase: {
        root: {
          fontFamily: rubikFont,
        },
      },
      MuiButton: {
        root: {
          borderRadius: "10px",
        },
        contained: {
          fontWeight: 700,
          textTransform: "initial",
          borderRadius: "10px",
        },
        outlined: {
          textTransform: "initial",
          borderRadius: "10px",
        },
      },
    },
  });
};

export const slippiTheme = addOverrides(theme);
