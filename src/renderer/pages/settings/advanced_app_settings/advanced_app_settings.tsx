import Button from "@mui/material/Button";
import React from "react";

import { Toggle } from "@/components/form/toggle";
import { useAutoUpdateLauncher } from "@/lib/hooks/use_settings";
import { useToasts } from "@/lib/hooks/use_toasts";

import { SettingItem } from "../setting_item_section";
import { LanguageSelector } from "./language_selector/language_selector";

export const AdvancedAppSettings = React.memo(() => {
  const [autoUpdateLauncher, setAutoUpdateLauncher] = useAutoUpdateLauncher();

  return (
    <div>
      <LanguageSelector />
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
