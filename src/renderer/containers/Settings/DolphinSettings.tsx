/** @jsx jsx */
import { configureDolphin, reinstallDolphin } from "@dolphin/ipc";
import { DolphinLaunchType } from "@dolphin/types";
import { css, jsx } from "@emotion/react";
import Button from "@material-ui/core/Button";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import React from "react";
import { useToasts } from "react-toast-notifications";

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
  const { addToast } = useToasts();
  const configureDolphinHandler = async () => {
    console.log("configure dolphin pressed");
    if (process.platform === "darwin") {
      addToast("Dolphin may open in the background, please check the app bar", {
        appearance: "info",
        autoDismiss: true,
      });
    }
    await configureDolphin.renderer!.trigger({ dolphinType });
  };
  const reinstallDolphinHandler = async () => {
    console.log("reinstall button clicked");
    await reinstallDolphin.renderer!.trigger({ dolphinType });
  };
  return (
    <div>
      <Typography variant="h5" className={classes.title}>
        {dolphinType} Dolphin Settings
      </Typography>
      <SettingItem name={`${dolphinType} Dolphin Directory`} description="The path to Dolphin.">
        <PathInput
          value={dolphinPath ?? ""}
          onSelect={setDolphinPath}
          placeholder="No folder set"
          options={{ properties: ["openDirectory"] }}
        />
      </SettingItem>
      <SettingItem name="Configure Dolphin" description="Open Dolphin to modify settings.">
        <Button
          variant="contained"
          color="primary"
          onClick={configureDolphinHandler}
          css={css`
            text-transform: capitalize;
          `}
        >
          Configure {dolphinType} Dolphin
        </Button>
      </SettingItem>
      <SettingItem name="Reset Dolphin" description="Delete and reinstall dolphin">
        <Button
          variant="outlined"
          color="secondary"
          onClick={reinstallDolphinHandler}
          css={css`
            text-transform: capitalize;
          `}
        >
          Reset {dolphinType} Dolphin
        </Button>
      </SettingItem>
    </div>
  );
};
