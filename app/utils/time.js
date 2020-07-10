import moment from 'moment';

const fs = require('fs');

export const frames = {
  START_FRAME: -123,
};

export function convertFrameCountToDurationString(frameCount) {
  const duration = moment.duration(frameCount / 60, 'seconds');
  return moment.utc(duration.as('milliseconds')).format('m:ss');
}

export function convertToDateAndTime(dateTimeString, format=true) {
  if (!dateTimeString) {
    return null;
  }

  const time = moment(dateTimeString).local();
  if (format) {
    return time.format('ll · LT');
  }
  return time;
}

export function fileToDateAndTime(game, fileName, fullPath, format=true) {
  const metadata = game.getMetadata() || {};
  const startAt = convertToDateAndTime(metadata.startAt, false);
  const getTimeFromFileName = () => filenameToDateAndTime(fileName);
  const getTimeFromBirthTime = () => convertToDateAndTime(fs.statSync(fullPath).birthtime, false);

  const startAtDisplay = startAt || getTimeFromFileName() || getTimeFromBirthTime()

  if (format && startAtDisplay){
    return startAtDisplay.format('ll · LT');
  }
  return startAtDisplay || null;
}

function filenameToDateAndTime(fileName) {
  const timeReg = /\d{8}T\d{6}/g;
  const filenameTime = fileName.match(timeReg)

  if (filenameTime === null) {
    return null;
  }

  const time = moment(filenameTime[0]).local();
  return time;
}
