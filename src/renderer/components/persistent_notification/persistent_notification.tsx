import { css } from "@emotion/react";
import styled from "@emotion/styled";
import ButtonBase from "@mui/material/ButtonBase";
import log from "electron-log";
import React, { useCallback, useState } from "react";

import { useAppStore } from "@/lib/hooks/use_app_store";
import { useAppUpdate } from "@/lib/hooks/use_app_update";

import { PersistentNotificationMessages as Messages } from "./persistent_notification.messages";

export const PersistentNotification = React.memo(() => {
  const updateVersion = useAppStore((store) => store.updateVersion);
  const updateReady = useAppStore((store) => store.updateReady);
  const updateDownloadProgress = useAppStore((store) => store.updateDownloadProgress);

  const { installAppUpdate } = useAppUpdate();
  const [isInstalling, setIsInstalling] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);

  const handleInstall = useCallback(async () => {
    setIsInstalling(true);
    setInstallError(null);

    const result = await installAppUpdate();

    if (!result.success) {
      setIsInstalling(false);
      setInstallError(result.error || "Unknown error");
    }
  }, [installAppUpdate]);

  const handleManualDownload = useCallback(() => {
    window.electron.shell.openExternal("https://slippi.gg/downloads").catch(log.error);
  }, []);

  // The handleInstall callback should provide immediate feedback i.e. it should immediately restart the
  // launcher so I don't think it's worth showing an 'Installing...' message that would need to be localised.
  // Instead we'll just show nothing as the feedback.
  if (isInstalling) {
    return null;
  }

  if (installError) {
    return (
      <Outer>
        <span>{Messages.installFailed()}</span>
        <RestartButton onClick={handleManualDownload}>{Messages.downloadManually()}</RestartButton>
      </Outer>
    );
  }

  if (!updateReady && updateDownloadProgress) {
    return (
      <Outer>
        <div
          css={css`
            display: flex;
            justify-content: center;
          `}
        >
          {Messages.downloadingVersion(updateVersion)}
        </div>
      </Outer>
    );
  }

  if (!updateVersion || !updateReady) {
    return null;
  }

  return (
    <Outer>
      <div
        css={css`
          display: flex;
          justify-content: center;
        `}
      >
        <span
          css={css`
            margin-right: 10px;
          `}
        >
          {Messages.versionIsNowAvailable(updateVersion)}
        </span>
        <RestartButton disabled={isInstalling} onClick={handleInstall}>
          {Messages.installUpdate()}
        </RestartButton>
      </div>
    </Outer>
  );
});

const Outer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 10px;
  position: relative;
  height: 30px;
  background-color: var(--purple-light);
  text-align: center;
  font-size: 14px;
`;

const RestartButton = styled(ButtonBase)`
  font-weight: 500;
  padding: 0 5px;
  &:hover {
    opacity: 0.8;
  }
`;
