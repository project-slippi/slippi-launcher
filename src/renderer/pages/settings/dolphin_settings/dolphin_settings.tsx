import { DolphinLaunchType } from "@dolphin/types";
import { css } from "@emotion/react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Typography from "@mui/material/Typography";
import capitalize from "lodash/capitalize";
import React from "react";

import { ConfirmationModal } from "@/components/confirmation_modal";
import { useDolphinActions } from "@/lib/dolphin/use_dolphin_actions";
import { DolphinStatus, useDolphinStore } from "@/lib/dolphin/use_dolphin_store";
import { useDolphinBeta } from "@/lib/hooks/use_settings";
import { useToasts } from "@/lib/hooks/use_toasts";
import { useServices } from "@/services";

import { SettingItem } from "../setting_item_section";
import { GeckoCodes } from "./gecko_codes/gecko_codes";

enum ResetType {
  SOFT,
  HARD,
}

export const DolphinSettings = ({ dolphinType }: { dolphinType: DolphinLaunchType }) => {
  const dolphinStatus = useDolphinStore((store) =>
    dolphinType === DolphinLaunchType.PLAYBACK ? store.playbackStatus : store.netplayStatus,
  );
  const dolphinIsOpen = useDolphinStore((store) =>
    dolphinType === DolphinLaunchType.NETPLAY ? store.netplayOpened : store.playbackOpened,
  );
  const dolphinVersion = useDolphinStore((store) =>
    dolphinType === DolphinLaunchType.NETPLAY ? store.netplayDolphinVersion : store.playbackDolphinVersion,
  );
  const [dolphinBeta, setDolphinBeta] = useDolphinBeta(dolphinType);
  const [resetModalOpen, setResetModalOpen] = React.useState(false);
  const [isResetType, setResetType] = React.useState<ResetType | null>(null);
  const { dolphinService } = useServices();
  const { openConfigureDolphin, hardResetDolphin, softResetDolphin } = useDolphinActions(dolphinService);
  const { showWarning } = useToasts();
  const dolphinIsReady = dolphinStatus === DolphinStatus.READY && !dolphinIsOpen && isResetType === null;
  const versionString: string =
    dolphinStatus === DolphinStatus.UNKNOWN ? "Not found" : !dolphinVersion ? "Unknown" : dolphinVersion;

  const onDolphinBetaChange = async (value: string) => {
    setResetType(ResetType.SOFT);
    const useBeta = value === "true";
    if (useBeta) {
      showWarning("Mainline Slippi Dolphin has updated OS requirements, check the Help Section for more info");
    }
    await setDolphinBeta(useBeta);
    await softResetDolphin(dolphinType);
    setResetType(null);
  };

  const openDolphinDirectoryHandler = React.useCallback(async () => {
    await dolphinService.openDolphinSettingsFolder(dolphinType);
  }, [dolphinService, dolphinType]);

  const configureDolphinHandler = async () => {
    openConfigureDolphin(dolphinType);
  };

  const softResetDolphinHandler = async () => {
    setResetType(ResetType.SOFT);
    await softResetDolphin(dolphinType);
    setResetType(null);
  };

  const hardResetDolphinHandler = async () => {
    setResetType(ResetType.HARD);
    await hardResetDolphin(dolphinType);
    setResetType(null);
  };

  const dolphinTypeName = capitalize(dolphinType);
  return (
    <div>
      <Typography variant="h5">{dolphinTypeName} Dolphin Settings</Typography>
      <Typography variant="caption">Version: {versionString}</Typography>

      <SettingItem name={`Configure ${dolphinType} Dolphin`}>
        <div
          css={css`
            display: flex;
            & > button {
              margin-right: 10px;
            }
          `}
        >
          <Button variant="contained" color="primary" onClick={configureDolphinHandler} disabled={!dolphinIsReady}>
            Configure Dolphin
          </Button>
          <Button variant="outlined" color="primary" onClick={openDolphinDirectoryHandler}>
            Open settings folder
          </Button>
        </div>
      </SettingItem>
      <SettingItem name={`${dolphinTypeName} Gecko Codes`}>
        <GeckoCodes dolphinType={dolphinType} disabled={!dolphinIsReady} />
      </SettingItem>
      <SettingItem name={`Reset ${dolphinTypeName} Dolphin`}>
        <ConfirmationModal
          open={resetModalOpen}
          onClose={() => setResetModalOpen(false)}
          onSubmit={hardResetDolphinHandler}
          title="Are you sure?"
        >
          This will remove all your {dolphinTypeName} Dolphin settings.
        </ConfirmationModal>
        <div
          css={css`
            display: flex;
            & > button {
              margin-right: 10px;
            }
          `}
        >
          <Button
            variant="contained"
            color="secondary"
            onClick={softResetDolphinHandler}
            disabled={!dolphinIsReady}
            css={css`
              min-width: 145px;
            `}
          >
            Soft Reset
            {isResetType === ResetType.SOFT && (
              <CircularProgress
                css={css`
                  margin-left: 10px;
                `}
                size={16}
                thickness={6}
                color="inherit"
              />
            )}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => setResetModalOpen(true)}
            disabled={!dolphinIsReady}
            css={css`
              min-width: 145px;
            `}
          >
            Hard Reset
            {isResetType === ResetType.HARD && (
              <CircularProgress
                css={css`
                  margin-left: 10px;
                `}
                size={16}
                thickness={6}
                color="inherit"
              />
            )}
          </Button>
        </div>
      </SettingItem>
      {dolphinType === DolphinLaunchType.NETPLAY && (
        <SettingItem
          name={`${dolphinTypeName} Dolphin Release Channel`}
          description="Choose which Slippi Dolphin release to install"
        >
          <RadioGroup value={dolphinBeta} onChange={(_event, value) => onDolphinBetaChange(value)}>
            <FormControlLabel value={false} label="Stable (Ishiiruka)" control={<Radio disabled={!dolphinIsReady} />} />
            <FormControlLabel value={true} label="Beta (Mainline)" control={<Radio disabled={!dolphinIsReady} />} />
          </RadioGroup>
        </SettingItem>
      )}
    </div>
  );
};
