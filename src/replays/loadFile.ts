import type { GameStartType, MetadataType } from "@slippi/slippi-js";
import { SlippiGame } from "@slippi/slippi-js";
import * as fs from "fs-extra";
import _ from "lodash";
import moment from "moment";
import path from "path";

import type { FileDetails, FileHeader, FileLoadComplete, FileLoadError } from "./types";

export async function loadFiles(
  fileHeaders: FileHeader[],
  batcherId: number,
  completeCallback: (_: FileLoadComplete) => void,
  errorCallback: (_: FileLoadError) => void,
  shouldCancel: () => boolean,
): Promise<void> {
  for (const header of fileHeaders) {
    if (shouldCancel()) {
      break;
    }
    try {
      const details = loadFile(header);
      completeCallback({
        path: header.fullPath,
        details: details,
        batcherId: batcherId,
      });
    } catch (err) {
      errorCallback({
        path: header.fullPath,
        error: err,
        batcherId: batcherId,
      });
    }
    // Yield control before the next loop. This gives the worker a chance to do
    // other work.
    await setImmediatePromise();
  }
}

function setImmediatePromise(): Promise<void> {
  return new Promise((resolve) => {
    setImmediate(() => resolve());
  });
}

export function loadFile(fileHeader: FileHeader): FileDetails {
  const game = new SlippiGame(fileHeader.fullPath);
  // Load settings
  const settings: GameStartType | null = game.getSettings();
  if (!settings || _.isEmpty(settings.players)) {
    throw new Error("Game settings could not be properly loaded.");
  }

  const details: FileDetails = {
    settings,
    startTime: null,
    lastFrame: null,
    metadata: null,
  };

  // Load metadata
  const metadata: MetadataType | null = game.getMetadata();
  if (metadata) {
    details.metadata = metadata;

    if (metadata.lastFrame !== undefined) {
      details.lastFrame = metadata.lastFrame;
    }
  }

  const startAtTime = fileToDateAndTime(metadata ? metadata.startAt : null, fileHeader);

  if (startAtTime) {
    details.startTime = startAtTime.toISOString();
  }

  return details;
}

function convertToDateAndTime(dateTimeString: moment.MomentInput): moment.Moment | null {
  const asMoment = moment(dateTimeString);
  if (asMoment.isValid()) {
    return asMoment.local();
  }

  return null;
}

function fileToDateAndTime(
  dateTimeString: string | undefined | null,
  fileHeader: FileHeader,
): Promise<moment.Moment | null> {
  let startAt = convertToDateAndTime(dateTimeString);
  if (startAt) {
    return startAt;
  }

  startAt = filenameToDateAndTime(fileHeader.name);
  if (startAt) {
    return startAt;
  }

  startAt = convertToDateAndTime(fileHeader.birthtimeMs);

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
