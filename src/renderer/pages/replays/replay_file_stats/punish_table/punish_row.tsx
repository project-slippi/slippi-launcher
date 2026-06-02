import Tooltip from "@mui/material/Tooltip";

import { convertFrameCountToDurationString } from "@/lib/time";

import * as T from "../table_components";
import type { PunishEvent } from "../types";
import { DamageCell } from "./damage_cell";
import { OpeningTypeCell } from "./opening_type_cell";

type Props = {
  punish: PunishEvent;
  filePath: string;
  onPlay: (options: { path: string; startFrame: number }) => void;
};

export const PunishRow = ({ punish, filePath, onPlay }: Props) => {
  const start = convertFrameCountToDurationString(punish.startFrame);
  const end = punish.endFrame != null ? convertFrameCountToDurationString(punish.endFrame) : "–";
  const playFromHere = () => onPlay({ path: filePath, startFrame: punish.startFrame });

  return (
    <T.TableRow>
      <T.TableCell>
        <Tooltip title="Play from here">
          <span onClick={playFromHere} style={{ cursor: "pointer", textDecoration: "underline" }}>
            {start}
          </span>
        </Tooltip>
      </T.TableCell>
      <T.TableCell>{end}</T.TableCell>
      <T.TableCell>
        <DamageCell damage={punish.damage} />
      </T.TableCell>
      <T.TableCell>{punish.damageRange}</T.TableCell>
      <T.TableCell>{punish.movesCount}</T.TableCell>
      <T.TableCell>
        <OpeningTypeCell openingType={punish.openingType} />
      </T.TableCell>
    </T.TableRow>
  );
};
