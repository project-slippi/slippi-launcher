import moment from "moment";

export function inferStartTime(
  gameStartAt: string | null,
  fileName: string,
  fileBirthTime: string | null,
): string | null {
  let startAt = convertToDateAndTime(gameStartAt);
  if (startAt) {
    return startAt.toISOString();
  }

  startAt = inferDateFromFilename(fileName);
  if (startAt) {
    return startAt.toISOString();
  }

  startAt = convertToDateAndTime(fileBirthTime);
  return startAt?.toISOString() ?? null;
}

function convertToDateAndTime(dateTimeString: moment.MomentInput): moment.Moment | null {
  if (dateTimeString == null) {
    return null;
  }

  const asMoment = moment(dateTimeString);
  if (asMoment.isValid()) {
    return asMoment.local();
  }

  return null;
}

function inferDateFromFilename(fileName: string): moment.Moment | null {
  const timeReg = /\d{8}T\d{6}/g;
  const filenameTime = fileName.match(timeReg);

  if (filenameTime == null) {
    return null;
  }

  const time = moment(filenameTime[0]).local();
  return time;
}
