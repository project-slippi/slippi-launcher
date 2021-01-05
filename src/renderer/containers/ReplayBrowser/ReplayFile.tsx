import _ from "lodash";
import React from "react";
import moment from "moment";
import { FileResult } from "common/replayBrowser";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import IconButton from "@material-ui/core/IconButton";
import CardMedia from "@material-ui/core/CardMedia";
import Tooltip from "@material-ui/core/Tooltip";
import { DraggableFile } from "@/components/DraggableFile";
import EqualizerIcon from "@material-ui/icons/Equalizer";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import { TeamElements } from "./TeamElements";
import { getStageImage } from "@/lib/utils";
import { stages as stageUtils } from "@slippi/slippi-js";
import { createStyles, makeStyles } from "@material-ui/core/styles";
import {
  convertFrameCountToDurationString,
  monthDayHourFormat,
} from "common/time";

const useStyles = makeStyles(() =>
  createStyles({
    root: {
      display: "flex",
      height: 75,
      margin: 10,
    },
    details: {
      display: "flex",
      flex: 1,
      flexDirection: "column",
      paddingLeft: 15,
      paddingRight: 15,
    },
    content: {
      flex: "1 0 auto",
      padding: 0,
    },
    cover: {
      width: 75,
      position: "relative",
    },
    controls: {
      display: "flex",
      alignItems: "center",
    },
    footer: {
      fontSize: 13,
      paddingBottom: 6,
      display: "flex",
      justifyContent: "space-between",
    },
    filename: {
      "&:hover": {
        textDecoration: "underline",
      },
    },
    duration: {
      position: "absolute",
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      top: 0,
      right: 0,
      padding: 3,
      fontSize: 12,
    },
  })
);

export interface ReplayFileProps extends FileResult {
  index: number;
  style?: React.CSSProperties;
  onSelect: () => void;
  onOpenMenu: (index: number, element: HTMLElement) => void;
}

export const ReplayFile: React.FC<ReplayFileProps> = ({
  index,
  onOpenMenu,
  style,
  onSelect,
  startTime,
  settings,
  name,
  metadata,
  lastFrame,
  fullPath,
}) => {
  const date = new Date(startTime ? Date.parse(startTime) : 0);
  const classes = useStyles();

  // If this is a teams game, group by teamId, otherwise group players individually
  const teams = _.chain(settings.players)
    .groupBy((player) => (settings.isTeams ? player.teamId : player.port))
    .toArray()
    .value();

  let stageName = "Unknown";
  try {
    if (settings.stageId) {
      stageName = stageUtils.getStageName(settings.stageId);
    }
  } catch (err) {
    console.error(err);
  }

  return (
    <div style={style}>
      <Card className={classes.root}>
        {settings.stageId !== null && (
          <CardMedia
            className={classes.cover}
            image={getStageImage(settings.stageId)}
            title={stageName}
          >
            {lastFrame !== null && (
              <div className={classes.duration}>
                {convertFrameCountToDurationString(lastFrame)}
              </div>
            )}
          </CardMedia>
        )}
        <div className={classes.details}>
          <div style={{ display: "flex", flexDirection: "row", flex: 1 }}>
            <CardContent className={classes.content}>
              <TeamElements settings={settings} metadata={metadata} />
            </CardContent>
            <div className={classes.controls}>
              <Tooltip title="View replay">
                <IconButton>
                  <PlayArrowIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Show stats">
                <IconButton onClick={onSelect}>
                  <EqualizerIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="More options">
                <IconButton
                  onClick={(e) => {
                    onOpenMenu(index, e.currentTarget as any);
                  }}
                >
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
            </div>
          </div>
          <div className={classes.footer}>
            <div>{monthDayHourFormat(moment(date))}</div>
            <div>
              <DraggableFile fullPath={fullPath} className={classes.filename}>
                {name}
              </DraggableFile>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
