import { DolphinLaunchType } from "@dolphin/types";
import { css } from "@emotion/react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import capitalize from "lodash/capitalize";
import React from "react";

import { ConfirmationModal } from "@/components/ConfirmationModal";
import { DevGuard } from "@/components/DevGuard";
import { PathInput } from "@/components/PathInput";
import { useDolphinActions } from "@/lib/dolphin/useDolphinActions";
import { DolphinStatus, useDolphinStore } from "@/lib/dolphin/useDolphinStore";
import { useDolphinPath } from "@/lib/hooks/useSettings";
import { useServices } from "@/services";

import { SettingItem } from "./SettingItem";

const { isLinux, isMac } = window.electron.common;
const log = window.electron.log;

export const DolphinSettings: React.FC<{ dolphinType: DolphinLaunchType }> = ({ dolphinType }) => {
  const dolphinStatus = useDolphinStore((store) =>
    dolphinType === DolphinLaunchType.PLAYBACK ? store.playbackStatus : store.netplayStatus,
  );
  const dolphinIsOpen = useDolphinStore((store) =>
    dolphinType === DolphinLaunchType.NETPLAY ? store.netplayOpened : store.playbackOpened,
  );
  const [dolphinPath, setDolphinPath] = useDolphinPath(dolphinType);
  const [resetModalOpen, setResetModalOpen] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);
  const { dolphinService } = useServices();
  const { openConfigureDolphin, reinstallDolphin, clearDolphinCache, importDolphin } =
    useDolphinActions(dolphinService);

  const dolphinIsReady = dolphinStatus === DolphinStatus.READY && !dolphinIsOpen && !isResetting;

  const openDolphinDirectoryHandler = async () => {
    await window.electron.shell.openPath(dolphinPath);
  };

  const configureDolphinHandler = async () => {
    openConfigureDolphin(dolphinType);
  };

  const reinstallDolphinHandler = async () => {
    setIsResetting(true);
    await reinstallDolphin(dolphinType);
    setIsResetting(false);
  };

  const clearDolphinCacheHandler = async () => {
    clearDolphinCache(dolphinType);
  };

  const importDolphinHandler = (importPath: string) => {
    log.info(`importing dolphin from ${importPath}`);
    importDolphin(importPath, dolphinType);
  };

  const dolphinTypeName = capitalize(dolphinType);
  return (
    <div>
      <Typography variant="h5">{dolphinTypeName} Dolphin Settings</Typography>
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
          <Button variant="outlined" color="primary" onClick={openDolphinDirectoryHandler} disabled={isResetting}>
            Open containing folder
          </Button>
        </div>
      </SettingItem>
      <DevGuard show={isLinux}>
        <SettingItem
          name={`${dolphinType} Dolphin Directory`}
          description={`The path to the folder containing the ${dolphinTypeName} Dolphin executable.`}
        >
          <PathInput
            value={dolphinPath ?? ""}
            onSelect={setDolphinPath}
            placeholder="No folder set"
            options={{ properties: ["openDirectory"] }}
          />
        </SettingItem>
      </DevGuard>
      {!isLinux && (
        <ImportDolphinConfigForm
          dolphinType={dolphinType}
          disabled={!dolphinIsReady}
          onImportDolphin={importDolphinHandler}
        />
      )}
      <SettingItem name={`Reset ${dolphinTypeName} Dolphin`}>
        <ConfirmationModal
          open={resetModalOpen}
          onClose={() => setResetModalOpen(false)}
          onSubmit={reinstallDolphinHandler}
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
            onClick={clearDolphinCacheHandler}
            disabled={isResetting || dolphinIsOpen}
          >
            Clear cache
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => setResetModalOpen(true)}
            disabled={isResetting || dolphinIsOpen}
          >
            Reset everything
            {isResetting && (
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
    </div>
  );
};

const ImportDolphinConfigForm: React.FC<{
  dolphinType: DolphinLaunchType;
  disabled?: boolean;
  onImportDolphin: (importPath: string) => void;
}> = ({ dolphinType, disabled, onImportDolphin }) => {
  const dolphinTypeName = capitalize(dolphinType);
  const extension = isMac ? "app" : "exe";

  const onImportClick = async () => {
    const result = await window.electron.common.showOpenDialog({
      filters: [{ name: "Slippi Dolphin", extensions: [isMac ? "app" : "exe"] }],
    });
    const res = result.filePaths;
    if (result.canceled || res.length === 0) {
      return;
    }
    onImportDolphin(res[0]);
  };

  return (
    <SettingItem
      name={`Import ${dolphinTypeName} Dolphin Settings`}
      description={`Replace the ${dolphinTypeName} Dolphin settings with those from a different Dolphin application. To do this, select the Dolphin.${extension} with the desired ${dolphinType} settings.`}
    >
      <Button variant="contained" color="secondary" onClick={onImportClick} disabled={disabled}>
        Import Dolphin settings
      </Button>
    </SettingItem>
  );
};
