import { createMuiTheme, Theme } from "@material-ui/core/styles";
import { colors } from "common/colors";

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
    fontFamily: ["Rubik", "Helvetica", "Arial", "sans-serif"].join(", "),
    fontSize: 16,
  },
});

const addOverrides = (theme: Theme) => {
  return createMuiTheme({
    ...theme,
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
      MuiSnackbarContent: {
        root: {
          backgroundColor: colors.purpleDark,
          color: "inherit",
        },
      },
      MuiTooltip: {
        tooltip: {
          backgroundColor: theme.palette.common.white,
          color: "rgba(0, 0, 0, 0.87)",
          boxShadow: theme.shadows[1],
          fontSize: 11,
        },
      },
      MuiButton: {
        contained: {
          fontWeight: 700,
        },
      },
    },
  });
};

export const slippiTheme = addOverrides(theme);
