import { configureDolphin, reinstallDolphin } from "@dolphin/ipc";
import { DolphinLaunchType } from "@dolphin/types";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import React from "react";

import { PathInput } from "@/components/PathInput";
import { useDolphinPath } from "@/lib/hooks/useSettings";

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
  const [dolphinPath, setDolphinPath] = useDolphinPath(dolphinType);
  const classes = useStyles();
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
          value={dolphinPath ?? ""}
          onSelect={setDolphinPath}
          placeholder="No folder set"
          options={{ properties: ["openDirectory"] }}
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
