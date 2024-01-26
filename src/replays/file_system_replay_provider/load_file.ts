import { exists } from "@common/exists";
import type { GameStartType, MetadataType } from "@slippi/slippi-js";
import { SlippiGame } from "@slippi/slippi-js";
import { parse } from "date-fns";
import * as fs from "fs-extra";
import path from "path";

import type { FileResult, PlayerInfo } from "../types";
import { extractPlayerNames } from "./extract_player_names";

export async function loadFile(fullPath: string): Promise<FileResult> {
  const filename = path.basename(fullPath);
  const game = new SlippiGame(fullPath);
  // Load settings
  const settings: GameStartType | null = game.getSettings();
  if (!settings || settings.players.length === 0) {
    throw new Error("Game settings could not be properly loaded.");
  }

  const metadata: MetadataType | null = game.getMetadata();
  const winnerIndices = game.getWinners().map((winner) => winner.playerIndex);

  const players = settings.players.map((p) => {
    const names = extractPlayerNames(p.playerIndex, settings, metadata);
    const info: PlayerInfo = {
      playerIndex: p.playerIndex,
      port: p.port,
      type: p.type,
      characterId: p.characterId,
      characterColor: p.characterColor,
      teamId: p.teamId,
      isWinner: winnerIndices.includes(p.playerIndex),
      connectCode: names.code,
      displayName: names.name,
      tag: names.tag,
      startStocks: p.startStocks,
    };
    return info;
  });

  const startAtTime = await fileToDateAndTime(metadata ? metadata.startAt : null, filename, fullPath);

  const result: FileResult = {
    id: fullPath,
    fileName: filename,
    fullPath,
    game: {
      players,
      isTeams: settings.isTeams ?? false,
      stageId: settings.stageId,
      startTime: startAtTime?.toISOString() ?? null,
      platform: metadata?.playedOn ?? null,
      consoleNickname: metadata?.consoleNick ?? null,
      mode: settings.gameMode ?? null,
      lastFrame: metadata?.lastFrame ?? null,
      timerType: settings.timerType ?? null,
      startingTimerSeconds: settings.startingTimerSeconds ?? null,
    },
  };

  return result;
}

function convertToDateAndTime(dateTimeString: string | undefined | null): Date | null {
  if (!exists(dateTimeString)) {
    return null;
  }

  return new Date(dateTimeString);
}

async function fileToDateAndTime(
  dateTimeString: string | undefined | null,
  fileName: string,
  fullPath: string,
): Promise<Date | null> {
  let startAt = convertToDateAndTime(dateTimeString);
  if (startAt) {
    return startAt;
  }

  startAt = filenameToDateAndTime(fileName);
  if (startAt) {
    return startAt;
  }

  const { birthtime } = await fs.stat(fullPath);
  return birthtime;
}

function filenameToDateAndTime(fileName: string): Date | null {
  const timeReg = /\d{8}T\d{6}/g;
  const filenameTime = fileName.match(timeReg);

  if (filenameTime === null) {
    return null;
  }

  const time = parse(filenameTime[0], "yyyyMMdd'T'HHmmss", new Date());
  return time;
}
