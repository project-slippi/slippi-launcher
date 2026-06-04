import type { StatsType } from "@slippi/slippi-js";
import { animations as animationUtils, moves as moveUtils } from "@slippi/slippi-js";
import { groupBy } from "common/group_by";

import type { KillEvent } from "../types";

export function buildKillEvents(stats: StatsType, oppPlayerIndex: number): KillEvent[] {
  const stocks = stats?.stocks ?? [];
  const opponentStocks = stocks.filter((s) => s.playerIndex === oppPlayerIndex);

  return opponentStocks.map((stock) => {
    const endFrame = stock.endFrame ?? null;
    let killMoveName: string | null = null;
    let killDirection: KillEvent["killDirection"] = null;

    if (endFrame != null) {
      killMoveName = findKillMove(stats, oppPlayerIndex, endFrame);
      killDirection = getDeathDirection(stock.deathAnimation);
    }

    return {
      startFrame: stock.startFrame,
      endFrame,
      killMoveName,
      killDirection,
      percent: Math.trunc(stock.currentPercent),
    };
  });
}

function findKillMove(stats: StatsType, oppPlayerIndex: number, endFrame: number): string | null {
  // Here we are going to grab the opponent's punishes and see if one of them was
  // responsible for ending this stock, if so show the kill move, otherwise assume SD
  const punishes = stats?.conversions ?? [];
  const punishesByPlayer = groupBy(punishes, (p) => p.playerIndex);
  const punishesOnOpponent = punishesByPlayer[oppPlayerIndex] || [];

  // Only get punishes that killed
  const killingPunishes = punishesOnOpponent.filter((punish) => punish.didKill);
  const punishThatEndedStock = killingPunishes.find((p) => p.endFrame === endFrame);

  if (!punishThatEndedStock) {
    return null;
  }

  const lastMove = punishThatEndedStock.moves.at(-1);
  if (!lastMove) {
    return "Grab Release";
  }

  return moveUtils.getMoveName(lastMove.moveId);
}

function getDeathDirection(deathAnimation: number | undefined): KillEvent["killDirection"] {
  if (deathAnimation == null) {
    return null;
  }

  const direction = animationUtils.getDeathDirection(deathAnimation);
  if (direction === "up" || direction === "down" || direction === "left" || direction === "right") {
    return direction;
  }

  return null;
}
