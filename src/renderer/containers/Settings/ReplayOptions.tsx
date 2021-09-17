import React from "react";
import Checkbox from "@material-ui/core/Checkbox";
import Tooltip from "@material-ui/core/Tooltip";
import styled from "@emotion/styled";

import { MultiPathInput } from "@/components/MultiPathInput";
import { PathInput } from "@/components/PathInput";
import { useExtraSlpPaths, useRootSlpPath, useSpectateSlpPath, useMonthlySubfolders } from "@/lib/hooks/useSettings";
import { useDolphinStore } from "@/lib/hooks/useDolphin";

import { SettingItem } from "./SettingItem";

export const ReplayOptions: React.FC = () => {
  const [localReplayDir, setLocalReplayDir] = useRootSlpPath();
  const [replayDirs, setReplayDirs] = useExtraSlpPaths();
  const [spectateDir, setSpectateDir] = useSpectateSlpPath();
  const [enableMonthlySubfolders, setUseMonthlySubfolders] = useMonthlySubfolders();
  const netplayDolphinOpen = useDolphinStore((store) => store.netplayDolphinOpen);

  const onUseMonthlySubfoldersToggle = async () => {
    await setUseMonthlySubfolders(!enableMonthlySubfolders);
  };

  return (
    <div>
      <SettingItem name="Root SLP Directory" description="The folder where your SLP replays should be saved.">
        <PathInput
          disabled={netplayDolphinOpen}
          value={localReplayDir}
          onSelect={setLocalReplayDir}
          options={{
            properties: ["openDirectory"],
          }}
          placeholder="No folder set"
        />
      </SettingItem>
      <MonthlySubfolders>
        Save replays to monthly subfolders
        <Tooltip title={netplayDolphinOpen ? "Can't change this setting while Dolphin is open." : ""}>
          <CheckboxDiv>
            <Checkbox
              onChange={() => onUseMonthlySubfoldersToggle()}
              checked={enableMonthlySubfolders}
              disabled={netplayDolphinOpen}
            />
          </CheckboxDiv>
        </Tooltip>
      </MonthlySubfolders>
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

const MonthlySubfolders = styled.div`
  margin-top: 4px;
  font-size: 14px;
  color: ${({ theme }) => theme.palette.text.disabled};
`;

const CheckboxDiv = styled.div`
  padding-left: 5px;
  align-items: right;
  display: inline-block;
  height: 50%;
`;
