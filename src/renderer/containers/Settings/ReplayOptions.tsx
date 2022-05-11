import { css } from "@emotion/react";
import styled from "@emotion/styled";
import React from "react";

import { Checkbox } from "@/components/FormInputs/Checkbox";
import { MultiPathInput } from "@/components/MultiPathInput";
import { PathInput } from "@/components/PathInput";
import { useDolphinStore } from "@/lib/dolphin/useDolphinStore";
import { useExtraSlpPaths, useMonthlySubfolders, useRootSlpPath, useSpectateSlpPath } from "@/lib/hooks/useSettings";

import { SettingItem } from "./SettingItem";

export const ReplayOptions: React.FC = () => {
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
      <SettingItem name="Root SLP Directory" description="The folder where your SLP replays should be saved.">
        <PathInput
          disabled={netplayDolphinOpen}
          tooltipText={netplayDolphinOpen ? "Close Dolphin to change this setting" : ""}
          value={localReplayDir}
          onSelect={setLocalReplayDir}
          options={{
            properties: ["openDirectory"],
          }}
          placeholder="No folder set"
        />
        <Checkbox
          css={css`
            margin-top: 5px;
          `}
          onChange={() => onUseMonthlySubfoldersToggle()}
          checked={enableMonthlySubfolders}
          disabled={netplayDolphinOpen}
          hoverText={netplayDolphinOpen ? "Close Dolphin to change this setting" : ""}
          label={<CheckboxDescription>Save replays to monthly subfolders</CheckboxDescription>}
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
      <SettingItem
        name="Additional SLP Directories"
        description="Choose any additional SLP directories that should show up in the replay browser."
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
};

const CheckboxDescription = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.palette.text.disabled};
`;
