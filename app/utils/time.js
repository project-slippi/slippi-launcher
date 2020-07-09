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
  const filenameArray = filename.split("_")
  const underscoreCount = (filenameArray.length - 1);
  const filenameTime = (underscoreCount === 1) ? filenameArray[1] : filenameArray[2]
  const timeReg = /\d{8}T\d{6}/g;

  if (!(underscoreCount === 1 || underscoreCount === 2) || filenameArray[0] !== "Game" || !timeReg.test(filenameTime)) {
    return null;
  }

  const time = moment(filenameTime).local();
  return time.format('ll · LT');
}
