import { css } from "@emotion/react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import Tooltip from "@mui/material/Tooltip";
import type { FileResult } from "@replays/types";
import type { PlayerType, StatsType, StockType } from "@slippi/slippi-js";
import { animations as animationUtils, Frames, moves as moveUtils } from "@slippi/slippi-js";
import _ from "lodash";
import React from "react";

import { extractPlayerNames } from "@/lib/matchNames";
import { convertFrameCountToDurationString } from "@/lib/time";
import { getCharacterIcon } from "@/lib/utils";

import * as T from "./TableStyles";

const columnCount = 5;
export interface KillTableProps {
  file: FileResult;
  stats: StatsType;
  player: PlayerType;
  opp: PlayerType;
  onPlay: (options: { path: string; startFrame: number }) => void;
}

export const KillTable: React.FC<KillTableProps> = ({ file, stats, player, opp, onPlay }) => {
  const names = extractPlayerNames(player.playerIndex, file.settings, file.metadata);
  const playerDisplay = (
    <div style={{ display: "flex", alignItems: "center" }}>
      <img
        src={getCharacterIcon(player.characterId, player.characterColor)}
        height={24}
        width={24}
        style={{
          marginRight: 10,
        }}
      />
      <div style={{ fontWeight: 500 }}>{names.name || names.tag || `Player ${player.playerIndex + 1}`}</div>
    </div>
  );
  const generateStockRow = (stock: StockType) => {
    let start = convertFrameCountToDurationString(stock.startFrame);
    let end = "–";

    let killedBy = <span>–</span>;
    let killedDirection = <span>–</span>;

    const percent = `${Math.trunc(stock.currentPercent)}%`;

    const isFirstFrame = stock.startFrame === Frames.FIRST;
    if (isFirstFrame) {
      // start = <span className={styles['secondary-text']}>–</span>;
      start = "–";
    }

    if (stock.endFrame !== null && stock.endFrame !== undefined) {
      end = convertFrameCountToDurationString(stock.endFrame);

      killedBy = renderKilledBy(stock);
      killedDirection = <span style={{ color: "#2ECC40", fontSize: 24 }}>{renderKilledDirection(stock)}</span>;
    }

    const playPunish = () => {
      onPlay({ path: file.fullPath, startFrame: stock.startFrame });
    };

    return (
      <T.TableRow key={`${stock.playerIndex}-stock-${stock.startFrame}`}>
        <T.TableCell>
          {start === "–" ? (
            start
          ) : (
            <Tooltip title="Play from here">
              <span
                onClick={playPunish}
                css={css`
                  &:hover {
                    cursor: pointer;
                    text-decoration: underline;
                  }
                `}
              >
                {start}
              </span>
            </Tooltip>
          )}
        </T.TableCell>
        <T.TableCell>{end}</T.TableCell>
        <T.TableCell>{killedBy}</T.TableCell>
        <T.TableCell>{killedDirection}</T.TableCell>
        <T.TableCell>{percent}</T.TableCell>
      </T.TableRow>
    );
  };

  const renderKilledBy = (stock: StockType) => {
    // Here we are going to grab the opponent's punishes and see if one of them was
    // responsible for ending this stock, if so show the kill move, otherwise assume SD
    const punishes = _.get(stats, "conversions") || [];
    const punishesByPlayer = _.groupBy(punishes, "playerIndex");
    const playerPunishes = punishesByPlayer[opp.playerIndex] || [];

    // Only get punishes that killed
    const killingPunishes = _.filter(playerPunishes, "didKill");
    const killingPunishesByEndFrame = _.keyBy(killingPunishes, "endFrame");
    const punishThatEndedStock =
      stock.endFrame !== null && stock.endFrame !== undefined ? killingPunishesByEndFrame[stock.endFrame] : null;

    if (!punishThatEndedStock) {
      // return <span className={styles['secondary-text']}>Self Destruct</span>;
      return <span>Self Destruct</span>;
    }

    const lastMove = _.last(punishThatEndedStock.moves);
    if (!lastMove) {
      return <span>Grab Release</span>;
    }
    return <span>{moveUtils.getMoveName(lastMove.moveId)}</span>;
  };

  const renderKilledDirection = (stock: StockType) => {
    if (stock.deathAnimation === null || stock.deathAnimation === undefined) {
      return undefined;
    }

    const killedDirection = animationUtils.getDeathDirection(stock.deathAnimation);
    switch (killedDirection) {
      case "up":
        return <ArrowUpwardIcon fontSize="inherit" />;
      case "down":
        return <ArrowDownwardIcon fontSize="inherit" />;
      case "left":
        return <ArrowBackIcon fontSize="inherit" />;
      case "right":
        return <ArrowForwardIcon fontSize="inherit" />;
      default:
        return undefined;
    }
  };

  const renderHeaderPlayer = () => {
    return (
      <T.TableRow>
        <T.TableHeaderCell colSpan={columnCount}>{playerDisplay}</T.TableHeaderCell>
      </T.TableRow>
    );
  };

  const renderHeaderColumns = () => {
    return (
      <T.TableRow>
        <T.TableSubHeaderCell>Start</T.TableSubHeaderCell>
        <T.TableSubHeaderCell>End</T.TableSubHeaderCell>
        <T.TableSubHeaderCell>Kill Move</T.TableSubHeaderCell>
        <T.TableSubHeaderCell>Direction</T.TableSubHeaderCell>
        <T.TableSubHeaderCell>Percent</T.TableSubHeaderCell>
      </T.TableRow>
    );
  };

  const renderStocksRows = () => {
    const stocks = _.get(stats, "stocks") || [];
    const stocksByOpponent = _.groupBy(stocks, "playerIndex");
    const opponentStocks = stocksByOpponent[opp.playerIndex] || [];

    return opponentStocks.map(generateStockRow);
  };

  return (
    <T.Table>
      <thead>
        {renderHeaderPlayer()}
        {renderHeaderColumns()}
      </thead>
      <tbody>{renderStocksRows()}</tbody>
    </T.Table>
  );
};
