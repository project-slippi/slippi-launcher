import Button from "@material-ui/core/Button";
import React from "react";
import { useToasts } from "react-toast-notifications";

import { Toggle } from "@/components/FormInputs/Toggle";
import { useAutoUpdateLauncher } from "@/lib/hooks/useSettings";

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
  const { addToast } = useToasts();
  const onClear = React.useCallback(() => {
    window.electron.common
      .clearTempFolder()
      .then(() => {
        addToast("Successfully cleared temporary files.", { autoDismiss: true });
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : JSON.stringify(err);
        addToast(message, { appearance: "error" });
      });
  }, []);
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
