import React from "react";
import { gte } from "semver";

import { Toggle } from "@/components/form/toggle";
import { useDolphinStore } from "@/lib/dolphin/use_dolphin_store";
import { useEnableJukebox } from "@/lib/hooks/use_settings";

import { SettingItem } from "../../setting_item_section";
import { GameMusicToggleMessages as Messages } from "./game_music_toggle.messages";

const MIN_DOLPHIN_VERSION_FOR_JUKEBOX = "3.2.0";

const isWindows = window.electron.bootstrap.isWindows;

export const GameMusicToggle = () => {
  const [enableJukebox, setEnableJukebox] = useEnableJukebox();
  const netplayDolphinOpen = useDolphinStore((store) => store.netplayOpened);
  const dolphinVersion = useDolphinStore((store) => store.netplayDolphinVersion);

  const isJukeboxCompatible = dolphinVersion != null && gte(dolphinVersion, MIN_DOLPHIN_VERSION_FOR_JUKEBOX);
  const disabled = netplayDolphinOpen || !isJukeboxCompatible || !dolphinVersion;

  const jukeboxDescription = React.useMemo(() => {
    const descriptions = [Messages.enableMusicDescription()];
    if (isWindows) {
      descriptions.push(Messages.incompatibleWithWasapi());
    }
    if (dolphinVersion && !isJukeboxCompatible) {
      descriptions.push(Messages.requiresDolphinVersion(MIN_DOLPHIN_VERSION_FOR_JUKEBOX));
    }
    return descriptions.join(" ");
  }, [dolphinVersion, isJukeboxCompatible]);

  return (
    <SettingItem name="">
      <Toggle
        value={isJukeboxCompatible && enableJukebox}
        onChange={(checked) => setEnableJukebox(checked)}
        label={Messages.enableMusic()}
        description={jukeboxDescription}
        disabled={disabled}
      />
    </SettingItem>
  );
};
