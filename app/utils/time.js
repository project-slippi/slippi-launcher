import moment from 'moment';

const fs = require('fs');

export function convertFrameCountToDurationString(frameCount) {
  const duration = moment.duration(frameCount / 60, 'seconds');
  return moment.utc(duration.as('milliseconds')).format('m:ss');
}

export function convertToDateAndTime(dateTimeString) {
  if (!dateTimeString) {
    return null;
  }

  const time = moment(dateTimeString).local();
  return time;
}

export function fileToDateAndTime(game, fileName, fullPath) {
  const metadata = game.getMetadata() || {};
  const startAt = convertToDateAndTime(metadata.startAt);
  const getTimeFromFileName = () => filenameToDateAndTime(fileName);
  const getTimeFromBirthTime = () => convertToDateAndTime(fs.statSync(fullPath).birthtime);

  return startAt || getTimeFromFileName() || getTimeFromBirthTime() || null;
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

export function monthDayHourFormat(time) {
  if (!moment.isMoment(time)) {
    return null;
  }

  return time.format('ll · LT');
}
