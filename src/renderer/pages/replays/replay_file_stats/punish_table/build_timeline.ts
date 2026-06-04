import type { ConversionType, StatsType, StockType } from "@slippi/slippi-js";
import { groupBy } from "common/group_by";

import type { PunishEvent, StockLossEvent, TimelineItem } from "../types";

export function buildTimeline(
  stats: StatsType,
  _playerIndex: number,
  oppPlayerIndex: number,
  oppCharacterIconUrl: string,
  oppStartStocks?: number,
): TimelineItem[] {
  const punishes = stats?.conversions ?? [];
  const stocks = stats?.stocks ?? [];

  // ConversionType.playerIndex is the victim (player being comboed).
  // So punishesByPlayer[oppPlayerIndex] = punishes landed ON the opponent = the current player's punishes.
  const punishesByPlayer = groupBy(punishes, (p) => p.playerIndex);
  const punishesOnOpponent: ConversionType[] = punishesByPlayer[oppPlayerIndex] || [];

  const stocksByPlayer = groupBy(stocks, (s) => s.playerIndex);
  const opponentStocks: StockType[] = stocksByPlayer[oppPlayerIndex] || [];

  const totalStocks = oppStartStocks ?? opponentStocks.reduce((max, s) => Math.max(max, s.count), 0);
  const sortedStocks = [...opponentStocks].sort((a, b) => a.startFrame - b.startFrame);
  const sortedPunishes = [...punishesOnOpponent].sort((a, b) => a.startFrame - b.startFrame);

  const result: TimelineItem[] = [];
  let stockIdx = 0;

  // Tracks whether a punish was landed between the last stock loss and now.
  // Used to determine whether to show an empty-state row for a stock:
  //   - false = no punish on this stock → show empty state (opponent SD'd)
  //   - true  = there was a punish on this stock → no empty state
  let hadPunishSinceLastStockLoss = false;

  for (const punish of sortedPunishes) {
    // Process any stocks that were lost before this punish starts
    while (stockIdx < sortedStocks.length) {
      const stock = sortedStocks[stockIdx];
      if (stock.endFrame == null || punish.startFrame <= stock.endFrame) {
        break;
      }

      const loss = toStockLossEvent(stock, totalStocks, oppCharacterIconUrl, !hadPunishSinceLastStockLoss);
      result.push({ kind: "stock-loss", stockLoss: loss });
      stockIdx++;
      hadPunishSinceLastStockLoss = false;
    }

    result.push({ kind: "punish", punish: toPunishEvent(punish) });
    hadPunishSinceLastStockLoss = true;
  }

  // Process remaining stocks that were lost after the last punish (or with no punishes at all)
  let processedStockInAfterLoop = false;
  while (stockIdx < sortedStocks.length) {
    const stock = sortedStocks[stockIdx];
    if (stock.endFrame == null) {
      // Special case: the opponent's stock was still ongoing when the game ended
      // (e.g. time out, or player SD'd on their own last stock). If we processed at least
      // one stock in this after-loop, the ongoing stock needs an empty-state row to
      // indicate no punishes were landed on it.
      if (processedStockInAfterLoop) {
        result.push({
          kind: "empty-state",
          stockOrdinal: totalStocks - stock.count + 1,
        });
      }
      break;
    }

    const loss = toStockLossEvent(stock, totalStocks, oppCharacterIconUrl, !hadPunishSinceLastStockLoss);
    result.push({ kind: "stock-loss", stockLoss: loss });
    stockIdx++;
    hadPunishSinceLastStockLoss = false;
    processedStockInAfterLoop = true;
  }

  return result;
}

function toPunishEvent(punish: ConversionType): PunishEvent {
  const damage = punish.currentPercent - punish.startPercent;
  return {
    startFrame: punish.startFrame,
    endFrame: punish.endFrame ?? null,
    damage,
    damageRange: `(${Math.trunc(punish.startPercent)}% - ${Math.trunc(punish.currentPercent)}%)`,
    movesCount: punish.moves.length,
    openingType: punish.openingType,
  };
}

function toStockLossEvent(
  stock: StockType,
  totalStocks: number,
  characterIconUrl: string,
  isEmpty: boolean,
): StockLossEvent {
  return {
    stockCount: stock.count - 1,
    stockOrdinal: totalStocks - stock.count + 1,
    totalStocks,
    characterIconUrl,
    hasPunishesBeforeDeath: !isEmpty,
  };
}
