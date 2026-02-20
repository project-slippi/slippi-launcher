import React from "react";

import { MultiPathInput } from "@/components/multi_path_input/multi_path_input";
import { PathInput } from "@/components/path_input/path_input";
import { useDolphinStore } from "@/lib/dolphin/use_dolphin_store";
import { useExtraSlpPaths, useRootSlpPath, useSpectateSlpPath } from "@/lib/hooks/use_settings";

import { SettingItem } from "../setting_item_section";
import { NetplayReplayToggles } from "./netplay_replay_toggle";
import { ReplaySettingsMessages as Messages } from "./replay_settings.messages";

export const ReplaySettings = React.memo(() => {
  const [localReplayDir, setLocalReplayDir] = useRootSlpPath();
  const [replayDirs, setReplayDirs] = useExtraSlpPaths();
  const [spectateDir, setSpectateDir] = useSpectateSlpPath();
  const netplayDolphinOpen = useDolphinStore((store) => store.netplayOpened);

  return (
    <div>
      <NetplayReplayToggles />
      <SettingItem name={Messages.rootSlpFolder()} description={Messages.rootSlpFolderDescription()}>
        <PathInput
          disabled={netplayDolphinOpen}
          tooltipText={netplayDolphinOpen ? Messages.closeDolphinToChangeSetting() : ""}
          value={localReplayDir}
          onSelect={setLocalReplayDir}
          options={{
            properties: ["openDirectory"],
          }}
          placeholder={Messages.noFolderSet()}
        />
      </SettingItem>
      <SettingItem name={Messages.spectatorSlpFolder()} description={Messages.spectatorSlpFolderDescription()}>
        <PathInput
          value={spectateDir}
          onSelect={setSpectateDir}
          options={{
            properties: ["openDirectory"],
          }}
          placeholder={Messages.noFolderSet()}
        />
      </SettingItem>
      <SettingItem name={Messages.additionalSlpFolders()} description={Messages.additionalSlpFoldersDescription()}>
        <MultiPathInput
          paths={replayDirs}
          updatePaths={setReplayDirs}
          options={{
            properties: ["openDirectory"],
          }}
        />
      </SettingItem>
    </div>
  );
});
