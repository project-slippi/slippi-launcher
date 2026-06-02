import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import Tooltip from "@mui/material/Tooltip";
import { Frames } from "@slippi/slippi-js";

import { convertFrameCountToDurationString } from "@/lib/time";

import * as T from "../table_components";
import type { KillEvent } from "../types";

type Props = {
  event: KillEvent;
  filePath: string;
  onPlay: (options: { path: string; startFrame: number }) => void;
};

export const KillStockRow = ({ event, filePath, onPlay }: Props) => {
  const isFirstFrame = event.startFrame === Frames.FIRST;
  const start = isFirstFrame ? "–" : convertFrameCountToDurationString(event.startFrame);
  const end = event.endFrame != null ? convertFrameCountToDurationString(event.endFrame) : "–";

  const playFromHere = () => {
    onPlay({ path: filePath, startFrame: event.startFrame });
  };

  return (
    <T.TableRow>
      <T.TableCell>
        {start === "–" ? (
          start
        ) : (
          <Tooltip title="Play from here">
            <span onClick={playFromHere} style={{ cursor: "pointer", textDecoration: "underline" }}>
              {start}
            </span>
          </Tooltip>
        )}
      </T.TableCell>
      <T.TableCell>{end}</T.TableCell>
      <T.TableCell>{event.endFrame == null ? "–" : event.killMoveName ?? "Self Destruct"}</T.TableCell>
      <T.TableCell>
        {event.endFrame == null ? (
          <span>–</span>
        ) : event.killDirection ? (
          <span style={{ color: "#2ECC40", fontSize: 24 }}>
            <DirectionIcon direction={event.killDirection} />
          </span>
        ) : undefined}
      </T.TableCell>
      <T.TableCell>{event.percent}%</T.TableCell>
    </T.TableRow>
  );
};

const DirectionIcon = ({ direction }: { direction: NonNullable<KillEvent["killDirection"]> }) => {
  switch (direction) {
    case "up":
      return <ArrowUpwardIcon fontSize="inherit" />;
    case "down":
      return <ArrowDownwardIcon fontSize="inherit" />;
    case "left":
      return <ArrowBackIcon fontSize="inherit" />;
    case "right":
      return <ArrowForwardIcon fontSize="inherit" />;
  }
};
