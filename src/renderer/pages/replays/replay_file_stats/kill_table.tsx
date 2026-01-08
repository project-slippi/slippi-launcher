import { css } from "@emotion/react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import Tooltip from "@mui/material/Tooltip";
import type { FileResult, PlayerInfo } from "@replays/types";
import type { StatsType, StockType } from "@slippi/slippi-js";
import { animations as animationUtils, Frames, moves as moveUtils } from "@slippi/slippi-js";
import get from "lodash/get";
import groupBy from "lodash/groupBy";
import keyBy from "lodash/keyBy";
import last from "lodash/last";

import { convertFrameCountToDurationString } from "@/lib/time";
import { getCharacterIcon } from "@/lib/utils";

import * as T from "./table_styles";

type PlayerInfoType = Pick<PlayerInfo, "playerIndex" | "characterId" | "characterColor" | "displayName" | "tag">;

const columnCount = 5;
type KillTableProps = {
  file: FileResult;
  stats: StatsType;
  player: PlayerInfoType;
  opp: PlayerInfoType;
  onPlay: (options: { path: string; startFrame: number }) => void;
};

export const KillTable = ({ file, stats, player, opp, onPlay }: KillTableProps) => {
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
      <div style={{ fontWeight: 500 }}>{player.displayName || player.tag || `Player ${player.playerIndex + 1}`}</div>
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

    if (stock.endFrame != null && stock.endFrame) {
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
    const punishes = get(stats, "conversions") || [];
    const punishesByPlayer = groupBy(punishes, "playerIndex");
    const playerPunishes = punishesByPlayer[opp.playerIndex] || [];

    // Only get punishes that killed
    const killingPunishes = playerPunishes.filter((punish) => punish.didKill);
    const killingPunishesByEndFrame = keyBy(killingPunishes, "endFrame");
    const punishThatEndedStock = stock.endFrame != null ? killingPunishesByEndFrame[stock.endFrame] : undefined;

    if (!punishThatEndedStock) {
      // return <span className={styles['secondary-text']}>Self Destruct</span>;
      return <span>Self Destruct</span>;
    }

    const lastMove = last(punishThatEndedStock.moves);
    if (!lastMove) {
      return <span>Grab Release</span>;
    }
    return <span>{moveUtils.getMoveName(lastMove.moveId)}</span>;
  };

  const renderKilledDirection = (stock: StockType) => {
    if (stock.deathAnimation == null) {
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
    const stocks = get(stats, "stocks") || [];
    const stocksByOpponent = groupBy(stocks, "playerIndex");
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
