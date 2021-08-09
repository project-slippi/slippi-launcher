import React from "react";

import { PathInput } from "@/components/PathInput";
import { PathInputMultiple } from "@/components/PathInputMultiple";
import { useExtraSlpPaths, useRootSlpPath, useSpectateSlpPath } from "@/lib/hooks/useSettings";

import { SettingItem } from "./SettingItem";

export const ReplayOptions: React.FC = () => {
  const [localReplayDir, setLocalReplayDir] = useRootSlpPath();
  const [replayDirs, setReplayDirs] = useExtraSlpPaths();
  const [spectateDir, setSpectateDir] = useSpectateSlpPath();

  return (
    <div>
      <SettingItem name="Local SLP Directory" description="The folder where your SLP replays should be saved.">
        <PathInput
          value={localReplayDir}
          onSelect={setLocalReplayDir}
          options={{
            properties: ["openDirectory"],
          }}
          placeholder="No folder set"
        />
      </SettingItem>
      <SettingItem name="Spectator SLP Directory" description="The folder where spectated games should be saved.">
        <PathInput
          value={spectateDir}
          onSelect={setSpectateDir}
          options={{
            properties: ["openDirectory"],
          }}
          placeholder="No folder set"
        />
      </SettingItem>
      <SettingItem name="Extra SLP Directories" description="The folders where any other SLP replays are stored.">
        <PathInputMultiple
          paths={replayDirs}
          updatePaths={setReplayDirs}
          options={{
            properties: ["openDirectory"],
          }}
          placeholder="No folder set"
        />
      </SettingItem>
    </div>
  );
};
