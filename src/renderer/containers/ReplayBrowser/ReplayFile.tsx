import _ from "lodash";

import React from "react";
import { FileResult } from "common/replayBrowser";
import Box from "@material-ui/core/Box";
import Tooltip from "@material-ui/core/Tooltip";
import { DraggableFile } from "@/components/DraggableFile";
import EqualizerIcon from "@material-ui/icons/Equalizer";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import { TeamElements } from "./TeamElements";

export interface ReplayFileProps extends FileResult {
  index: number;
  style?: React.CSSProperties;
  onSelect: () => void;
  onOpenMenu: (index: number, element: HTMLElement) => void;
}

export const ReplayFile: React.FC<ReplayFileProps> = (props) => {
  const {
    index,
    onOpenMenu,
    style,
    onSelect,
    startTime,
    settings,
    metadata,
    fullPath,
  } = props;
  const date = new Date(startTime ? Date.parse(startTime) : 0);

  // If this is a teams game, group by teamId, otherwise group players individually
  const teams = _.chain(settings.players)
    .groupBy((player) => (settings.isTeams ? player.teamId : player.port))
    .toArray()
    .value();

  return (
    <Box
      display="flex"
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      style={style}
    >
      <Box display="flex" flexDirection="column">
        <TeamElements teams={teams} settings={settings} metadata={metadata} />
        <div>{props.name}</div>{" "}
      </Box>
      <div>{date.toLocaleString()}</div>
      <div>
        <DraggableFile fullPath={fullPath} />
        <Tooltip title="View stats">
          <EqualizerIcon onClick={onSelect} style={{ cursor: "pointer" }} />
        </Tooltip>
        <Tooltip title="More options">
          <MoreVertIcon
            style={{ cursor: "pointer" }}
            onClick={(e) => {
              onOpenMenu(index, e.currentTarget as any);
            }}
          />
        </Tooltip>
      </div>
    </Box>
  );
};
