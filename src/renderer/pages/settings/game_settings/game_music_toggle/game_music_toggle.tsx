import React from "react";

import { Toggle } from "@/components/form/toggle";
import { useDolphinStore } from "@/lib/dolphin/use_dolphin_store";
import { useEnableJukebox } from "@/lib/hooks/use_settings";

import { SettingItem } from "../../setting_item_section";
import { GameMusicToggleMessages as Messages } from "./game_music_toggle.messages";

const isWindows = window.electron.bootstrap.isWindows;

export const GameMusicToggle = () => {
  const [enableJukebox, setEnableJukebox] = useEnableJukebox();
  const netplayDolphinOpen = useDolphinStore((store) => store.netplayOpened);
  const dolphinVersion = useDolphinStore((store) => store.netplayDolphinVersion);

  const disabled = netplayDolphinOpen || !dolphinVersion;

  const jukeboxDescription = React.useMemo(() => {
    const descriptions = [Messages.enableMusicDescription()];
    if (isWindows) {
      descriptions.push(Messages.incompatibleWithWasapi());
    }
    return descriptions.join(" ");
  }, []);

  return (
    <SettingItem name="">
      <Toggle
        value={enableJukebox}
        onChange={(checked) => setEnableJukebox(checked)}
        label={Messages.enableMusic()}
        description={jukeboxDescription}
        disabled={disabled}
      />
    </SettingItem>
  );
};
