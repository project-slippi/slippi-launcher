import moment from "moment";

export function convertFrameCountToDurationString(frameCount: number, format = "m:ss"): string {
  const duration = moment.duration((frameCount + 123) / 60, "seconds");
  return moment.utc(duration.as("milliseconds")).format(format);
}

export function monthDayHourFormat(time: moment.Moment): string | null {
  if (!moment.isMoment(time)) {
    return null;
  }

  return time.format("ll · LT");
}
