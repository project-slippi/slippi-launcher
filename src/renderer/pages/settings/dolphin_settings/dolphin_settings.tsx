import { DolphinLaunchType } from "@dolphin/types";
import { css } from "@emotion/react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Typography from "@mui/material/Typography";
import React from "react";

import { ConfirmationModal } from "@/components/confirmation_modal";
import { useDolphinActions } from "@/lib/dolphin/use_dolphin_actions";
import { DolphinStatus, useDolphinStore } from "@/lib/dolphin/use_dolphin_store";
import { useDolphinBeta } from "@/lib/hooks/use_settings";
import { useToasts } from "@/lib/hooks/use_toasts";
import { useServices } from "@/services";

import { SettingItem } from "../setting_item_section";
import { DolphinSettingsMessages as Messages } from "./dolphin_settings.messages";
import { GeckoCodes } from "./gecko_codes/gecko_codes";

enum ResetType {
  SOFT,
  HARD,
}

const getDolphinTypeName = (dolphinType: DolphinLaunchType) => {
  switch (dolphinType) {
    case DolphinLaunchType.NETPLAY:
      return Messages.netplayDolphin();
    case DolphinLaunchType.PLAYBACK:
      return Messages.playbackDolphin();
  }
};

const getDolphinSettingsName = (dolphinType: DolphinLaunchType) => {
  switch (dolphinType) {
    case DolphinLaunchType.NETPLAY:
      return Messages.netplayDolphinSettings();
    case DolphinLaunchType.PLAYBACK:
      return Messages.playbackDolphinSettings();
  }
};

const getGeckoCodesName = (dolphinType: DolphinLaunchType) => {
  switch (dolphinType) {
    case DolphinLaunchType.NETPLAY:
      return Messages.netplayGeckoCodes();
    case DolphinLaunchType.PLAYBACK:
      return Messages.playbackGeckoCodes();
  }
};

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
    dolphinStatus === DolphinStatus.UNKNOWN
      ? Messages.notFound()
      : !dolphinVersion
      ? Messages.unknown()
      : dolphinVersion;

  const onDolphinBetaChange = async (value: string) => {
    setResetType(ResetType.SOFT);
    const useBeta = value === "true";
    if (useBeta) {
      showWarning(Messages.mainlineDolphinHasUpdatedOsRequirements());
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

  const dolphinTypeName = getDolphinTypeName(dolphinType);
  return (
    <div>
      <Typography variant="h5">{getDolphinSettingsName(dolphinType)}</Typography>
      <Typography variant="caption">{Messages.version(versionString)}</Typography>

      <SettingItem name={Messages.configureDolphin(dolphinTypeName)}>
        <div
          css={css`
            display: flex;
            & > button {
              margin-right: 10px;
            }
          `}
        >
          <Button variant="contained" color="primary" onClick={configureDolphinHandler} disabled={!dolphinIsReady}>
            {Messages.configureDolphinButton()}
          </Button>
          <Button variant="outlined" color="primary" onClick={openDolphinDirectoryHandler}>
            {Messages.openSettingsFolderButton()}
          </Button>
        </div>
      </SettingItem>
      <SettingItem name={getGeckoCodesName(dolphinType)}>
        <GeckoCodes dolphinType={dolphinType} disabled={!dolphinIsReady} />
      </SettingItem>
      <SettingItem name={Messages.resetDolphin(dolphinTypeName)}>
        <ConfirmationModal
          open={resetModalOpen}
          onClose={() => setResetModalOpen(false)}
          onSubmit={hardResetDolphinHandler}
          title={Messages.areYouSure()}
        >
          {Messages.thisWillRemoveAllYourDolphinSettings(dolphinTypeName)}
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
            {Messages.softReset()}
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
            {Messages.hardReset()}
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
          name={Messages.netplayDolphinReleaseChannel()}
          description={Messages.netplayDolphinReleaseChannelDescription()}
        >
          <RadioGroup value={dolphinBeta} onChange={(_event, value) => onDolphinBetaChange(value)}>
            <FormControlLabel value={false} label={Messages.stable()} control={<Radio disabled={!dolphinIsReady} />} />
            <FormControlLabel value={true} label={Messages.beta()} control={<Radio disabled={!dolphinIsReady} />} />
          </RadioGroup>
        </SettingItem>
      )}
    </div>
  );
};
