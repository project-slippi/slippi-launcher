import parse from "date-fns/parse";

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

function convertToDateAndTime(dateTimeString: string | null | undefined): Date | null {
  if (dateTimeString == null) {
    return null;
  }

  return new Date(dateTimeString);
}

function inferDateFromFilename(fileName: string): Date | null {
  const timeReg = /\d{8}T\d{6}/g;
  const filenameTime = fileName.match(timeReg);

  if (filenameTime === null) {
    return null;
  }

  const time = parse(filenameTime[0], "yyyyMMdd'T'HHmmss", new Date());
  return time;
}
