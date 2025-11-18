import React from "react";

import { Toggle } from "@/components/form/toggle";
import { useEnableSpectateRemoteControl, useSpectateRemoteControlPort } from "@/lib/hooks/use_settings";

import { SettingItem } from "../setting_item_section";
import { SpectatePortForm } from "./spectate_port_form/spectate_port_form";
import { SpectateSettingsMessages as Messages } from "./spectate_settings.messages";

export const SpectateSettings = React.memo(() => {
  const [enableSpectateRemoteControl, setEnableSpectateRemoteControl] = useEnableSpectateRemoteControl();
  const [spectateRemoteControlPort, setSpectateRemoteControlPort] = useSpectateRemoteControlPort();
  return (
    <div>
      <SettingItem name="">
        <Toggle
          value={enableSpectateRemoteControl}
          onChange={(checked) => setEnableSpectateRemoteControl(checked)}
          label={Messages.enableSpectateRemoteControl()}
          description={Messages.enableSpectateRemoteControlDescription()}
        />
      </SettingItem>
      {enableSpectateRemoteControl && (
        <SettingItem
          name={Messages.spectateRemoteControlPort()}
          description={Messages.spectateRemoteControlPortDescription()}
        >
          <SpectatePortForm port={spectateRemoteControlPort} onChange={setSpectateRemoteControlPort} />
        </SettingItem>
      )}
    </div>
  );
});
