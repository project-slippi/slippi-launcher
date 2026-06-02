import { PlayerDisplay } from "../common/player_display";
import * as T from "../table_components";
import type { KillEvent, PlayerDisplayInfo } from "../types";
import { KillStockRow } from "./kill_stock_row";

type Props = {
  player: PlayerDisplayInfo;
  events: KillEvent[];
  filePath: string;
  onPlay: (options: { path: string; startFrame: number }) => void;
};

export const KillTable = ({ player, events, filePath, onPlay }: Props) => (
  <T.Table>
    <thead>
      <T.TableRow>
        <T.TableHeaderCell colSpan={5}>
          <PlayerDisplay info={player} />
        </T.TableHeaderCell>
      </T.TableRow>
      <T.TableRow>
        <T.TableSubHeaderCell>Start</T.TableSubHeaderCell>
        <T.TableSubHeaderCell>End</T.TableSubHeaderCell>
        <T.TableSubHeaderCell>Kill Move</T.TableSubHeaderCell>
        <T.TableSubHeaderCell>Direction</T.TableSubHeaderCell>
        <T.TableSubHeaderCell>Percent</T.TableSubHeaderCell>
      </T.TableRow>
    </thead>
    <tbody>
      {events.map((event, i) => (
        <KillStockRow key={i} event={event} filePath={filePath} onPlay={onPlay} />
      ))}
    </tbody>
  </T.Table>
);
