import { css } from "@emotion/react";
import styled from "@emotion/styled";
import React from "react";

import { Checkbox } from "@/components/form/checkbox";
import { MultiPathInput } from "@/components/multi_path_input";
import { PathInput } from "@/components/path_input/path_input";
import { useDolphinStore } from "@/lib/dolphin/use_dolphin_store";
import { useExtraSlpPaths, useMonthlySubfolders, useRootSlpPath, useSpectateSlpPath } from "@/lib/hooks/use_settings";

import { SettingItem } from "../setting_item_section";
import { ReplaySettingsMessages as Messages } from "./replay_settings.messages";

export const ReplaySettings = React.memo(() => {
  const [localReplayDir, setLocalReplayDir] = useRootSlpPath();
  const [replayDirs, setReplayDirs] = useExtraSlpPaths();
  const [spectateDir, setSpectateDir] = useSpectateSlpPath();
  const [enableMonthlySubfolders, setUseMonthlySubfolders] = useMonthlySubfolders();
  const netplayDolphinOpen = useDolphinStore((store) => store.netplayOpened);

  const onUseMonthlySubfoldersToggle = async () => {
    await setUseMonthlySubfolders(!enableMonthlySubfolders);
  };

  return (
    <div>
      <SettingItem name={Messages.rootSlpDirectory()} description={Messages.rootSlpDirectoryDescription()}>
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
        <Checkbox
          css={css`
            margin-top: 5px;
          `}
          onChange={() => onUseMonthlySubfoldersToggle()}
          checked={enableMonthlySubfolders}
          disabled={netplayDolphinOpen}
          hoverText={netplayDolphinOpen ? Messages.closeDolphinToChangeSetting() : ""}
          label={<CheckboxDescription>Save replays to monthly subfolders</CheckboxDescription>}
        />
      </SettingItem>
      <SettingItem name={Messages.spectatorSlpDirectory()} description={Messages.spectatorSlpDirectoryDescription()}>
        <PathInput
          value={spectateDir}
          onSelect={setSpectateDir}
          options={{
            properties: ["openDirectory"],
          }}
          placeholder={Messages.noFolderSet()}
        />
      </SettingItem>
      <SettingItem
        name={Messages.additionalSlpDirectories()}
        description={Messages.additionalSlpDirectoriesDescription()}
      >
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

const CheckboxDescription = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.palette.text.disabled};
`;
