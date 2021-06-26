/** @jsx jsx */
import { clearDolphinCache, configureDolphin, reinstallDolphin } from "@dolphin/ipc";
import { DolphinLaunchType } from "@dolphin/types";
import { css, jsx } from "@emotion/react";
import Button from "@material-ui/core/Button";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import { isLinux } from "common/constants";
import { shell } from "electron";
import React from "react";
import { useToasts } from "react-toast-notifications";

import { ConfirmationModal } from "@/components/ConfirmationModal";
import { DevGuard } from "@/components/DevGuard";
import { PathInput } from "@/components/PathInput";
import { useDolphinPath, useLaunchMeleeOnPlay } from "@/lib/hooks/useSettings";

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
  const [launchMeleeOnPlay, setLaunchMelee] = useLaunchMeleeOnPlay();
  const [modalOpen, setModalOpen] = React.useState(false);
  const classes = useStyles();
  const { addToast } = useToasts();

  const onLaunchMeleeChange = async (event: any) => {
    const value = event.target.value === "true" ? true : false;
    await setLaunchMelee(value);
  };

  const openDolphinDirectoryHandler = async () => {
    shell.openItem(dolphinPath);
  };

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

  const clearDolphinCacheHandler = async () => {
    await clearDolphinCache.renderer!.trigger({ dolphinType });
  };

  return (
    <div>
      <Typography variant="h5" className={classes.title}>
        {dolphinType} Dolphin Settings
      </Typography>
      <DevGuard show={isLinux}>
        <SettingItem name={`${dolphinType} Dolphin Directory`} description="The path to Dolphin.">
          <PathInput
            value={dolphinPath ?? ""}
            onSelect={setDolphinPath}
            placeholder="No folder set"
            options={{ properties: ["openDirectory"] }}
          />
        </SettingItem>
      </DevGuard>
      {dolphinType === DolphinLaunchType.NETPLAY && (
        <SettingItem name="Play Button Functionality">
          <RadioGroup value={launchMeleeOnPlay} onChange={(event) => onLaunchMeleeChange(event)}>
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
      )}
      <SettingItem name={`Configure ${dolphinType} Dolphin`}>
        <div
          css={css`
            display: flex;
            & > button {
              margin-right: 10px;
            }
          `}
        >
          <Button variant="contained" color="primary" onClick={configureDolphinHandler}>
            Configure Dolphin
          </Button>
          <Button variant="outlined" color="secondary" onClick={openDolphinDirectoryHandler}>
            Open containing folder
          </Button>
        </div>
      </SettingItem>
      <SettingItem name={`Reset ${dolphinType} Dolphin`}>
        <ConfirmationModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={reinstallDolphinHandler}
          title="Are you sure?"
        >
          This will remove all your {dolphinType} dolphin settings.
        </ConfirmationModal>
        <div
          css={css`
            display: flex;
            & > button {
              margin-right: 10px;
            }
          `}
        >
          <Button variant="contained" color="secondary" onClick={clearDolphinCacheHandler}>
            Clear cache
          </Button>
          <Button variant="outlined" color="secondary" onClick={() => setModalOpen(true)}>
            Reset everything
          </Button>
        </div>
      </SettingItem>
    </div>
  );
};
