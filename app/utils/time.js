import moment from 'moment';

export const frames = {
  START_FRAME: -123,
};

export function convertFrameCountToDurationString(frameCount) {
  const duration = moment.duration(frameCount / 60, 'seconds');
  return moment.utc(duration.as('milliseconds')).format('m:ss');
}

export function convertToDateAndTime(dateTimeString) {
  if (!dateTimeString) {
    return null;
  }

  const time = moment(dateTimeString).local();
  return time.format('ll · LT');
}

export function filenameToDateAndTime(filename) {
  const timeReg = /\d{8}T\d{6}/g;
  const filenameTime = filename.match(timeReg)

  if (filenameTime === null) {
    return null;
  }

  const time = moment(filenameTime[0]).local();
  return time.format('ll · LT');
}
