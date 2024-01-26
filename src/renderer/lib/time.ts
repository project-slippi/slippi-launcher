import { format } from "date-fns";
import moment from "moment";

export function convertFrameCountToDurationString(frameCount: number, format = "m:ss"): string {
  const duration = moment.duration((frameCount + 123) / 60, "seconds");
  return moment.utc(duration.as("milliseconds")).format(format);
}

export function monthDayHourFormat(moment: moment.Moment): string | null;
export function monthDayHourFormat(date: Date): string | null;
export function monthDayHourFormat(momentOrDate: moment.Moment | Date): string | null {
  if (moment.isMoment(momentOrDate)) {
    return monthDayHourFormatFromMoment(momentOrDate);
  }

  return monthDayHourFormatFromDate(momentOrDate);
}

function monthDayHourFormatFromDate(time: Date): string | null {
  return format(time, "PP · p");
}

function monthDayHourFormatFromMoment(time: moment.Moment): string | null {
  if (!moment.isMoment(time)) {
    return null;
  }

  return time.format("ll · LT");
}
