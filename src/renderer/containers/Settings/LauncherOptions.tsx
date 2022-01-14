/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import Button from "@material-ui/core/Button";
import { ipc_clearTempFolder } from "common/ipc";
import React from "react";

import { Toggle } from "@/components/FormInputs/Toggle";
import { useAutoUpdateLauncher } from "@/lib/hooks/useSettings";

import { SettingItem } from "./SettingItem";

export const LauncherOptions: React.FC = () => {
  const [autoUpdateLauncher, setAutoUpdateLauncher] = useAutoUpdateLauncher();

  return (
    <div>
      <SettingItem name="">
        <Toggle
          value={autoUpdateLauncher}
          onChange={(checked) => setAutoUpdateLauncher(checked)}
          label="Launcher Auto Updates"
          description="Toggle updating the Launcher automatically when an update is available."
        />
        <Button
          css={css`
            margin-top: 20px;
          `}
          variant="contained"
          color="secondary"
          onClick={() => ipc_clearTempFolder.renderer!.trigger({})}
        >
          Clear temp files
        </Button>
      </SettingItem>
    </div>
  );
};
