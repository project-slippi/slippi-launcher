/** @jsx jsx */
import { jsx } from "@emotion/react";
import Button from "@material-ui/core/Button";
import { ipc_installUpdate } from "common/ipc";
import React from "react";

import { BasicFooter } from "@/components/Footer";
import { useAppStore } from "@/lib/hooks/useApp";

export const Footer: React.FC = () => {
  const updateVersion = useAppStore((store) => store.updateVersion);
  const updateProgress = useAppStore((store) => store.updateDownloadProgress);
  const showUpdateNotif = useAppStore((store) => store.updateReady);

  const updateHandler = async () => {
    await ipc_installUpdate.renderer!.trigger({});
  };

  return (
    <BasicFooter>
      {updateVersion !== "" &&
        !showUpdateNotif &&
        `Launcher update (${__VERSION__} -> ${updateVersion}) is downloading: ${updateProgress.toFixed(0)}% downloaded`}
      {showUpdateNotif && (
        <div>
          Update available ({__VERSION__} {"->"} {updateVersion}){" "}
          <Button onClick={updateHandler}>Click to Update</Button>
        </div>
      )}
    </BasicFooter>
  );
};
