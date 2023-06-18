import type { GameStartType, MetadataType } from "@slippi/slippi-js";
import { SlippiGame } from "@slippi/slippi-js";
import getDataSource from "data-source";
import { Replay } from "entity/Replay";
import { ReplayGameStart } from "entity/ReplayGameStart";
import { ReplayMetadata } from "entity/ReplayMetadata";
import { ReplayPlayer } from "entity/ReplayPlayer";
import * as fs from "fs-extra";
import _ from "lodash";
import moment from "moment";
import path from "path";

import type { FileResult } from "./types";

export async function loadFile(fullPath: string, dbName: string): Promise<FileResult> {
  const AppDataSource = await getDataSource(dbName);
  const replay = await AppDataSource.createQueryBuilder("replay", "r")
    .leftJoinAndSelect("r.metadata", "replayMetadata")
    .leftJoinAndSelect("r.settings", "replayGameStart")
    .where("r.fullPath = :filePath", { filePath: fullPath })
    .getOne();
  if (replay && replay.settings) {
    replay.settings.players = await AppDataSource.createQueryBuilder("replayPlayer", "p")
      .where("p.settingsId = :id", { id: replay.settings.id })
      .getMany();
  }
  if (replay) {
    console.log(replay);
    return replay as FileResult;
  }

  const filename = path.basename(fullPath);
  const game = new SlippiGame(fullPath);
  // Load settings
  const settings: GameStartType | null = game.getSettings();
  if (!settings || _.isEmpty(settings.players)) {
    throw new Error("Game settings could not be properly loaded.");
  }

  const result: FileResult = {
    name: filename,
    fullPath,
    settings,
    startTime: null,
    lastFrame: null,
    metadata: null,
    winnerIndices: [],
  };

  result.winnerIndices = game.getWinners().map((winner) => winner.playerIndex);

  // Load metadata
  const metadata: MetadataType | null = game.getMetadata();
  if (metadata) {
    result.metadata = metadata;

    if (metadata.lastFrame !== undefined) {
      result.lastFrame = metadata.lastFrame;
    }
  }

  const startAtTime = await fileToDateAndTime(metadata ? metadata.startAt : null, filename, result.fullPath);

  if (startAtTime) {
    result.startTime = startAtTime.toISOString();
  }

  console.log(result);

  // Insert replay in db
  console.log("got to create");
  const newReplay = AppDataSource.manager.create(Replay, result);
  await AppDataSource.getRepository("replay").insert(newReplay);
  console.log(newReplay.winnerIndices);

  const replaySettings = AppDataSource.manager.create(ReplayGameStart, result.settings);
  replaySettings.replayId = newReplay.id;
  await AppDataSource.getRepository("replayGameStart").insert(replaySettings);

  result.settings.players.map(async (player) => {
    console.log(replaySettings.id);
    const replayPlayer = AppDataSource.manager.create(ReplayPlayer, player);
    replayPlayer.settingsId = replaySettings.id;
    await AppDataSource.getRepository("replayPlayer").insert(replayPlayer);
  });

  if (result.metadata) {
    const replayMetadata = AppDataSource.manager.create(ReplayMetadata, result.metadata);
    replayMetadata.replayId = newReplay.id;
    await AppDataSource.getRepository("replayMetadata").insert(replayMetadata);
  }

  //replayPlayers.map((player) => AppDataSource.manager.save(player));
  //await AppDataSource.createQueryBuilder().insert().into("replay").values(result).execute();
  //await AppDataSource.getRepository("replay").insert(result);

  return result;
}

function convertToDateAndTime(dateTimeString: moment.MomentInput): moment.Moment | null {
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
