import Button from "@mui/material/Button";
import React from "react";

import { Toggle } from "@/components/FormInputs/Toggle";
import { useAutoUpdateLauncher } from "@/lib/hooks/useSettings";
import { useToasts } from "@/lib/hooks/useToasts";

import { SettingItem } from "./SettingItem";

export const AdvancedAppSettings = React.memo(() => {
  const [autoUpdateLauncher, setAutoUpdateLauncher] = useAutoUpdateLauncher();

  return (
    <div>
      <SettingItem name="">
        <Toggle
          value={autoUpdateLauncher}
          onChange={(checked) => setAutoUpdateLauncher(checked)}
          label="Enable Auto Updates"
          description="Automatically install Slippi Launcher updates when they become available."
        />
      </SettingItem>
      <ClearTempFilesForm />
    </div>
  );
});

const ClearTempFilesForm = React.memo(() => {
  const { showSuccess, showError } = useToasts();
  const onClear = React.useCallback(() => {
    window.electron.common
      .clearTempFolder()
      .then(() => {
        showSuccess("Successfully cleared temporary files.");
      })
      .catch(showError);
  }, [showSuccess, showError]);
  return (
    <SettingItem
      name="Clear Temporary Files"
      description="Removes temporary downloads, files used for Dolphin communication, and files streamed from Slippi.gg."
    >
      <Button variant="contained" color="secondary" onClick={onClear}>
        Clear files
      </Button>
    </SettingItem>
  );
});
