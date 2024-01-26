import { format, intervalToDuration } from "date-fns";

export function convertFrameCountToDurationString(frameCount: number, format: "short" | "long" = "short"): string {
  const duration = intervalToDuration({ start: 0, end: ((frameCount + 123) / 60) * 1000 });

  const minutes = String(duration.minutes ?? 0);
  const seconds = String(duration.seconds ?? 0).padStart(2, "0");
  switch (format) {
    case "short":
      // m:ss
      return `${minutes}:${seconds}`;
    case "long":
      // m'm' ss's'
      return `${minutes}m ${seconds}s`;
  }
}

export function monthDayHourFormat(date: Date): string {
  return format(date, "PP · p");
}
