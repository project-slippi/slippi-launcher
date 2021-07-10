/** @jsx jsx */
import { jsx } from "@emotion/react";
import Button from "@material-ui/core/Button";
import {
  ipc_installUpdate,
  ipc_launcherUpdateDownloadCompleteEvent,
  ipc_launcherUpdateDownloadingEvent,
} from "common/ipc";
import React from "react";

import { BasicFooter } from "@/components/Footer";

export const Footer: React.FC = () => {
  const [showUpdateDownloadNotif, setShowUpdateDownloadNotif] = React.useState(false);
  const [showUpdateNotif, setShowUpdateNotif] = React.useState(false);
  const [downloadProgress, setDownloadProgress] = React.useState("");
  const [version, setVersion] = React.useState("");

  ipc_launcherUpdateDownloadingEvent.renderer!.useEvent(
    async ({ progress }) => {
      setShowUpdateDownloadNotif(true);
      setDownloadProgress(progress);
    },
    [showUpdateDownloadNotif, downloadProgress],
  );

  ipc_launcherUpdateDownloadCompleteEvent.renderer!.useEvent(
    async ({ version }) => {
      setShowUpdateDownloadNotif(false);
      setShowUpdateNotif(true);
      setVersion(version);
    },
    [showUpdateNotif, showUpdateDownloadNotif, version],
  );

  const updateHandler = async () => {
    await ipc_installUpdate.renderer!.trigger({});
  };

  return (
    <BasicFooter>
      {showUpdateDownloadNotif && `Launcher update is downloading: ${downloadProgress}% downloaded`}
      {showUpdateNotif && (
        <div>
          Update available ({version}) <Button onClick={updateHandler}>Click to Update</Button>
        </div>
      )}
    </BasicFooter>
  );
};
