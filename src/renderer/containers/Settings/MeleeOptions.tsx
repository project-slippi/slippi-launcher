import CircularProgress from "@material-ui/core/CircularProgress";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import ErrorIcon from "@material-ui/icons/Error";
import React from "react";

import { PathInput } from "@/components/PathInput";
import { useSettings } from "@/store/settings";

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
  }),
);

export const MeleeOptions: React.FC = () => {
  const isoPath = useSettings((state) => state.settings.isoPath);
  const verifying = useSettings((state) => state.verifyingIso);
  const isValidIso = useSettings((state) => state.validIsoPath);
  const verifyIsoPath = useSettings((state) => state.verifyIsoPath);
  const setIsoPath = useSettings((state) => state.setIsoPath);
  const setReplayDir = useSettings((state) => state.setReplayDirectory);
  const replayDir = useSettings((state) => state.settings.rootSlpPath);
  const classes = useStyles();
  const onIsoSelect = React.useCallback(
    (isoPath: string) => {
      setIsoPath(isoPath);
      verifyIsoPath(isoPath);
    },
    [setIsoPath],
  );
  return (
    <div>
      <Typography variant="h5">Melee Options</Typography>
      <SettingItem name="Melee ISO File" description="The path to an NTSC Melee 1.02 ISO.">
        <PathInput
          value={isoPath !== null ? isoPath : ""}
          onSelect={onIsoSelect}
          placeholder="No file set"
          disabled={verifying}
          endAdornment={
            <div className={`${classes.validation} ${verifying ? "" : classes[isValidIso ? "valid" : "invalid"]}`}>
              <span className={classes.validationText}>
                {verifying ? "Verifying..." : isValidIso ? "Valid" : "Invalid"}
              </span>
              {verifying ? (
                <CircularProgress size={25} color="inherit" />
              ) : isValidIso ? (
                <CheckCircleIcon />
              ) : (
                <ErrorIcon />
              )}
            </div>
          }
        />
      </SettingItem>
      <SettingItem name="Replay Root Directory" description="The folder where your SLP files are stored.">
        <PathInput
          value={replayDir}
          onSelect={setReplayDir}
          options={{
            properties: ["openDirectory"],
          }}
          placeholder="No folder set"
        />
      </SettingItem>
    </div>
  );
};
