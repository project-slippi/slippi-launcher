import _ from "lodash";

import React from "react";
import { FileResult } from "common/replayBrowser";
import { getCharacterIcon } from "@/lib/utils";
import Box from "@material-ui/core/Box";
import Tooltip from "@material-ui/core/Tooltip";
import { DraggableFile } from "@/components/DraggableFile";
import FolderIcon from "@material-ui/icons/Folder";
import { shell } from "electron";

export const ReplayFile: React.FC<FileResult> = (props) => {
  const { startTime, settings, fullPath } = props;
  const date = new Date(startTime ? Date.parse(startTime) : 0);
  if (!settings) {
    return <div>Error rendering {fullPath}. Settings is null.</div>;
  }

  // If this is a teams game, group by teamId, otherwise group players individually
  const teams = _.chain(settings.players)
    .groupBy((player) => (settings.isTeams ? player.teamId : player.port))
    .toArray()
    .value();

  const onRevealLocation = () => shell.showItemInFolder(fullPath);

  return (
    <Box
      display="flex"
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
    >
      <Box display="flex" flexDirection="column">
        <div>{props.name}</div>{" "}
        <div style={{ display: "flex" }}>
          {teams.flatMap((team, i) =>
            team.map((player, j) => (
              <div
                key={`team-${i}-player-${j}-char${player.characterId}-${player.characterColor}`}
              >
                <img
                  style={{ width: 20 }}
                  src={getCharacterIcon(
                    player.characterId ?? 0,
                    player.characterColor ?? 0
                  )}
                />
              </div>
            ))
          )}
        </div>
      </Box>
      <div>{date.toLocaleString()}</div>
      <div>
        <DraggableFile fullPath={fullPath} />
        <Tooltip title="Reveal location">
          <FolderIcon
            onClick={onRevealLocation}
            style={{ cursor: "pointer" }}
          />
        </Tooltip>
      </div>
    </Box>
  );
};
