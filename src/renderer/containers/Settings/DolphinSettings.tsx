import { configureDolphin, reinstallDolphin } from "@dolphin/ipc";
import { DolphinLaunchType } from "@dolphin/types";
import CircularProgress from "@material-ui/core/CircularProgress";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import ErrorIcon from "@material-ui/icons/Error";
import React from "react";

import { PathInput } from "@/components/PathInput";
import { useSettings } from "@/lib/hooks/useSettings";

import { SettingItem } from "./SettingItem";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    validation: {
      display: "flex",
      alignItems: "center",
      marginRight: 10,
    },
    invalid: {
      color: theme.palette.error.main,
    },
    valid: {
      color: theme.palette.success.main,
    },
    validationText: {
      marginRight: 5,
      fontWeight: 500,
    },
    title: {
      textTransform: "capitalize",
    },
  }),
);

export const DolphinSettings: React.FC<{ dolphinType: DolphinLaunchType }> = ({ dolphinType }) => {
  const netplayDolphinPath = useSettings((state) => state.settings.netplayDolphinPath);
  const playbackDolphinPath = useSettings((state) => state.settings.playbackDolphinPath);
  // const verifyAndSetDolphinPath = useSettings((state) => state.verifyAndSetDolphinPath);
  const dolphinPath = dolphinType === DolphinLaunchType.NETPLAY ? netplayDolphinPath : playbackDolphinPath;
  const verifying = false;
  // const isValidDolphinPath = useSettings((state) => state.validDolphinPath);
  // const verifyAndSetDolphinPath = useSettings((state) => state.verifyAndSetDolphinPath);
  // const setDolphinFolderPath = useSettings((state) => state.setDolphinFolderPath);
  const classes = useStyles();
  const onDolphinFolderSelect = React.useCallback((dolphinPath: string) => {
    console.log(dolphinPath);
    // setDolphinFolderPath(dolphinType, dolphinPath);
    // verifyAndSetDolphinPath(dolphinType, dolphinPath);
  }, []);
  const isValidDolphinPath = true;
  const configureDolphinHandler = async () => {
    console.log("configure dolphin pressesd");
    await configureDolphin.renderer!.trigger({ dolphinType });
  };
  const reinstallDolphinHandler = async () => {
    console.log("reinstall button clicked");
    await reinstallDolphin.renderer!.trigger({ dolphinType });
  };
  return (
    <div>
      <Typography variant="h5" className={classes.title}>
        {dolphinType} Dolphin Options
      </Typography>
      <SettingItem name="Dolphin Directory" description="The path to Dolphin.">
        <PathInput
          value={dolphinPath !== null ? dolphinPath : ""}
          onSelect={onDolphinFolderSelect}
          placeholder="No folder set"
          disabled={verifying}
          options={{ properties: ["openDirectory"] }}
          endAdornment={
            <div
              className={`${classes.validation} ${verifying ? "" : classes[isValidDolphinPath ? "valid" : "invalid"]}`}
            >
              <span className={classes.validationText}>
                {verifying ? "Verifying..." : isValidDolphinPath ? "Valid" : "Invalid"}
              </span>
              {verifying ? (
                <CircularProgress size={25} color="inherit" />
              ) : isValidDolphinPath ? (
                <CheckCircleIcon />
              ) : (
                <ErrorIcon />
              )}
            </div>
          }
        />
      </SettingItem>
      <SettingItem name="Configure Dolphin" description="Open Dolphin to modify settings.">
        <button onClick={configureDolphinHandler}>Configure Dolphin</button>
      </SettingItem>
      <SettingItem name="Reinstall Dolphin" description="Delete and reinstall dolphin">
        <button onClick={reinstallDolphinHandler}>Reset Dolphin</button>
      </SettingItem>
    </div>
  );
};
