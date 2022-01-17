/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import Tooltip from "@material-ui/core/Tooltip";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import ArrowDownwardIcon from "@material-ui/icons/ArrowDownward";
import ArrowForwardIcon from "@material-ui/icons/ArrowForward";
import ArrowUpwardIcon from "@material-ui/icons/ArrowUpward";
import { FileResult } from "@replays/types";
import {
  animations as animationUtils,
  Frames,
  moves as moveUtils,
  PlayerType,
  StatsType,
  StockType,
} from "@slippi/slippi-js";
import { extractPlayerNames } from "common/matchNames";
import { convertFrameCountToDurationString } from "common/time";
import _ from "lodash";
import React, { useCallback } from "react";

import { useDolphin } from "@/lib/hooks/useDolphin";
import { getCharacterIcon } from "@/lib/utils";

import * as T from "./TableStyles";

const columnCount = 5;
export interface KillTableProps {
  file: FileResult;
  stats: StatsType;
  player: PlayerType;
  opp: PlayerType;
}

export const KillTable: React.FC<KillTableProps> = ({ file, stats, player, opp }) => {
  const { viewReplays } = useDolphin();
  const names = extractPlayerNames(player.playerIndex, file.settings, file.metadata);

  const renderKilledBy = useCallback(
    (stock: StockType) => {
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
    },
    [opp.playerIndex, stats],
  );

  const renderKilledDirection = useCallback((stock: StockType) => {
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
  }, []);

  const renderHeaderPlayer = useCallback(() => {
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

    return (
      <T.TableRow>
        <T.TableHeaderCell colSpan={columnCount}>{playerDisplay}</T.TableHeaderCell>
      </T.TableRow>
    );
  }, [names.name, names.tag, player.characterColor, player.characterId, player.playerIndex]);

  const renderHeaderColumns = useCallback(() => {
    return (
      <T.TableRow>
        <T.TableSubHeaderCell>Start</T.TableSubHeaderCell>
        <T.TableSubHeaderCell>End</T.TableSubHeaderCell>
        <T.TableSubHeaderCell>Kill Move</T.TableSubHeaderCell>
        <T.TableSubHeaderCell>Direction</T.TableSubHeaderCell>
        <T.TableSubHeaderCell>Percent</T.TableSubHeaderCell>
      </T.TableRow>
    );
  }, []);

  const generateStockRow = useCallback(
    (stock: StockType) => {
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
        viewReplays([{ path: file.fullPath, startFrame: stock.startFrame }]);
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
    },
    [file.fullPath, renderKilledBy, renderKilledDirection, viewReplays],
  );

  const renderStocksRows = useCallback(() => {
    const stocks = _.get(stats, "stocks") || [];
    const stocksByOpponent = _.groupBy(stocks, "playerIndex");
    const opponentStocks = stocksByOpponent[opp.playerIndex] || [];

    return opponentStocks.map(generateStockRow);
  }, [generateStockRow, opp.playerIndex, stats]);

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
