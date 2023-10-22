import { exists } from "@common/exists";
import type { GameStartType, MetadataType } from "@slippi/slippi-js";
import { SlippiGame } from "@slippi/slippi-js";
import * as fs from "fs-extra";
import moment from "moment";
import path from "path";

import type { FileResult, PlayerInfo } from "../types";
import { extractPlayerNames } from "./matchNames";

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
      type: p.type ?? undefined,
      characterId: p.characterId ?? undefined,
      characterColor: p.characterColor ?? undefined,
      teamId: p.teamId ?? undefined,
      isWinner: winnerIndices.includes(p.playerIndex),
      connectCode: names.code,
      displayName: names.name,
      tag: names.tag,
      startStocks: p.startStocks ?? undefined,
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
      stageId: settings.stageId ?? undefined,
      startTime: startAtTime?.toISOString(),
      platform: metadata?.playedOn ?? undefined,
      consoleNickname: metadata?.consoleNick ?? undefined,
      mode: settings.gameMode ?? undefined,
      lastFrame: metadata?.lastFrame ?? undefined,
      timerType: settings.timerType ?? undefined,
    },
  };

  return result;
}

function convertToDateAndTime(dateTimeString: moment.MomentInput): moment.Moment | null {
  if (!exists(dateTimeString)) {
    return null;
  }

  const asMoment = moment(dateTimeString);
  if (asMoment.isValid()) {
    return asMoment.local();
  }

  return null;
}

async function fileToDateAndTime(
  dateTimeString: string | undefined | null,
  fileName: string,
  fullPath: string,
): Promise<moment.Moment | null> {
  let startAt = convertToDateAndTime(dateTimeString);
  if (startAt) {
    return startAt;
  }

  startAt = filenameToDateAndTime(fileName);
  if (startAt) {
    return startAt;
  }

  const { birthtime } = await fs.stat(fullPath);
  startAt = convertToDateAndTime(birthtime);

  return startAt;
}

function filenameToDateAndTime(fileName: string): moment.Moment | null {
  const timeReg = /\d{8}T\d{6}/g;
  const filenameTime = fileName.match(timeReg);

  if (filenameTime === null) {
    return null;
  }

  const time = moment(filenameTime[0]).local();
  return time;
}
