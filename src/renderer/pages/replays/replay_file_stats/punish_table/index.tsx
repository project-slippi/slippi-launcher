import React from "react";

import { PlayerDisplay } from "../common/player_display";
import * as T from "../table_components";
import type { PlayerDisplayInfo, TimelineItem } from "../types";
import { EmptyStateRow } from "./empty_state_row";
import { PunishRow } from "./punish_row";
import { StockLossRow } from "./stock_loss_row";

type Props = {
  player: PlayerDisplayInfo;
  timeline: TimelineItem[];
  filePath: string;
  onPlay: (options: { path: string; startFrame: number }) => void;
};

export const PunishTable = ({ player, timeline, filePath, onPlay }: Props) => (
  <T.Table>
    <thead>
      <T.TableRow>
        <T.TableHeaderCell colSpan={6}>
          <PlayerDisplay info={player} />
        </T.TableHeaderCell>
      </T.TableRow>
      <T.TableRow>
        <T.TableSubHeaderCell>Start</T.TableSubHeaderCell>
        <T.TableSubHeaderCell>End</T.TableSubHeaderCell>
        <T.TableSubHeaderCell colSpan={2}>Damage</T.TableSubHeaderCell>
        <T.TableSubHeaderCell>Moves</T.TableSubHeaderCell>
        <T.TableSubHeaderCell>Opening</T.TableSubHeaderCell>
      </T.TableRow>
    </thead>
    <tbody>
      {timeline.map((item, i) => {
        if (item.kind === "punish") {
          return <PunishRow key={i} punish={item.punish} filePath={filePath} onPlay={onPlay} />;
        }
        if (item.kind === "stock-loss") {
          return item.stockLoss.hasPunishesBeforeDeath ? (
            <StockLossRow key={i} loss={item.stockLoss} />
          ) : (
            <React.Fragment key={i}>
              <EmptyStateRow stockCount={item.stockLoss.stockCount} />
              <StockLossRow loss={item.stockLoss} />
            </React.Fragment>
          );
        }
        return null;
      })}
    </tbody>
  </T.Table>
);
