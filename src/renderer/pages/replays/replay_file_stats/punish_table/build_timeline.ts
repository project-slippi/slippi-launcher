import type { ConversionType, StatsType, StockType } from "@slippi/slippi-js";

import { groupBy } from "../table_utils";
import type { PunishEvent, StockLossEvent, TimelineItem } from "../types";

export function buildTimeline(
  stats: StatsType,
  playerIndex: number,
  oppPlayerIndex: number,
  oppCharacterIconUrl: string,
): TimelineItem[] {
  const punishes = stats?.conversions ?? [];
  const stocks = stats?.stocks ?? [];

  const punishesByPlayer = groupBy(punishes, (p) => p.playerIndex);
  const playerPunishes: ConversionType[] = punishesByPlayer[playerIndex] || [];

  const stocksByPlayer = groupBy(stocks, (s) => s.playerIndex);
  const opponentStocks: StockType[] = stocksByPlayer[oppPlayerIndex] || [];

  const totalStocks = opponentStocks.length;
  const sortedStocks = [...opponentStocks].sort((a, b) => a.startFrame - b.startFrame);
  const sortedPunishes = [...playerPunishes].sort((a, b) => a.startFrame - b.startFrame);

  const result: TimelineItem[] = [];
  let stockIdx = 0;
  let hadPunishSinceLastStockLoss = false;

  for (const punish of sortedPunishes) {
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

  while (stockIdx < sortedStocks.length) {
    const stock = sortedStocks[stockIdx];
    const loss = toStockLossEvent(stock, totalStocks, oppCharacterIconUrl, !hadPunishSinceLastStockLoss);
    result.push({ kind: "stock-loss", stockLoss: loss });
    stockIdx++;
    hadPunishSinceLastStockLoss = false;
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
    totalStocks,
    characterIconUrl,
    hasPunishesBeforeDeath: !isEmpty,
  };
}
