import CircularProgress from "@material-ui/core/CircularProgress";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import ErrorIcon from "@material-ui/icons/Error";
import React from "react";

import { PathInput } from "@/components/PathInput";
import { useIsoVerification } from "@/lib/hooks/useIsoVerification";
import { useIsoPath, useLaunchMeleeOnPlay, useRootSlpPath, useSpectateSlpPath } from "@/lib/hooks/useSettings";

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
  const verifying = useIsoVerification((state) => state.isValidating);
  const isValidIso = useIsoVerification((state) => state.isValid);
  const [isoPath, setIsoPath] = useIsoPath();
  const [launchMeleeOnPlay, setLaunchMelee] = useLaunchMeleeOnPlay();
  const [replayDir, setReplayDir] = useRootSlpPath();
  const [spectateDir, setSpectateDir] = useSpectateSlpPath();
  const classes = useStyles();

  const onLaunchMeleeChange = async (value: string) => {
    const launchMelee = value === "true";
    await setLaunchMelee(launchMelee);
  };

  return (
    <div>
      <SettingItem name="Melee ISO File" description="The path to an NTSC Melee 1.02 ISO.">
        <PathInput
          value={isoPath !== null ? isoPath : ""}
          onSelect={setIsoPath}
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
      <SettingItem name="Play Button Functionality">
        <RadioGroup value={launchMeleeOnPlay} onChange={(_event, value) => onLaunchMeleeChange(value)}>
          <FormControlLabel
            value={true}
            label="Launch Melee when clicking play on the home screen"
            control={<Radio />}
          />
          <FormControlLabel
            value={false}
            label="Launch Dolphin when clicking play on the home screen"
            control={<Radio />}
          />
        </RadioGroup>
      </SettingItem>
      <SettingItem name="Replay Root Directory" description="The folder where your SLP replays are stored.">
        <PathInput
          value={replayDir}
          onSelect={setReplayDir}
          options={{
            properties: ["openDirectory"],
          }}
          placeholder="No folder set"
        />
      </SettingItem>
      <SettingItem name="Spectator SLP Directory" description="The folder where spectated games should be saved.">
        <PathInput
          value={spectateDir}
          onSelect={setSpectateDir}
          options={{
            properties: ["openDirectory"],
          }}
          placeholder="No folder set"
        />
      </SettingItem>
    </div>
  );
};
