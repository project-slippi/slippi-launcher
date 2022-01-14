/** @jsx jsx */
import { jsx } from "@emotion/react";
import React from "react";

import { Toggle } from "@/components/FormInputs/Toggle";
import { useAutoUpdateLauncher } from "@/lib/hooks/useSettings";

import { SettingItem } from "./SettingItem";

export const LauncherOptions: React.FC = () => {
  const [autoUpdateLauncher, setAutoUpdateLauncher] = useAutoUpdateLauncher();

  return (
    <div>
      <SettingItem name="Launcher Options">
        <Toggle
          value={autoUpdateLauncher}
          onChange={(checked) => setAutoUpdateLauncher(checked)}
          label="Launcher Auto Updates"
          description="Toggle updating the Launcher automatically when an update is available."
        />
      </SettingItem>
    </div>
  );
};
