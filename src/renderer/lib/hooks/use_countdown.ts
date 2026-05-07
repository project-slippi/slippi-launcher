import type { Duration, Locale } from "date-fns";
import { formatDuration, intervalToDuration } from "date-fns";
import * as React from "react";

import type { SupportedLanguage } from "@/services/i18n/util";

import { getLocale, shortEnLocale } from "../time";
import { useAppStore } from "./use_app_store";

type UseCountdownOptions = {
  format?: (keyof Duration)[];
  autoFormat?: boolean;
};

type CountdownResult = {
  duration: Duration;
  formatted: string;
  isFinished: boolean;
};

export function useCountdown(targetDate: Date, options: UseCountdownOptions = {}): CountdownResult {
  const currentLanguage = useAppStore((store) => store.currentLanguage);

  const { format, autoFormat = true } = options;

  const locale = getLocale((currentLanguage as SupportedLanguage) ?? shortEnLocale);

  const [state, setState] = React.useState<CountdownResult>(() => compute(targetDate, locale, format, autoFormat));

  React.useEffect(() => {
    let timeout: number;

    const tick = () => {
      const next = compute(targetDate, locale, format, autoFormat);

      setState((prev) => {
        // avoid unnecessary re-renders
        if (prev.formatted === next.formatted && prev.isFinished === next.isFinished) {
          return prev;
        }
        return next;
      });

      if (!next.isFinished) {
        const delay = getNextDelay(next.duration);
        timeout = window.setTimeout(tick, delay);
      }
    };

    tick();
    return () => window.clearTimeout(timeout);
  }, [targetDate, locale, format, autoFormat]);

  return state;
}

function compute(
  targetDate: Date,
  locale?: Locale,
  format?: (keyof Duration)[],
  autoFormat: boolean = true,
): CountdownResult {
  const now = new Date();
  const duration = intervalToDuration({ start: now, end: targetDate });

  const adjustedDuration = normalizeDuration(duration);

  const isShort = (adjustedDuration.days ?? 0) === 0 && (adjustedDuration.hours ?? 0) === 0;

  const finalFormat =
    format ??
    (autoFormat
      ? isShort
        ? ["minutes", "seconds"]
        : ["days", "hours", "minutes"]
      : ["days", "hours", "minutes", "seconds"]);

  return {
    duration: adjustedDuration,
    formatted: formatDuration(adjustedDuration, {
      format: finalFormat,
      locale,
    }),
    isFinished: now >= targetDate,
  };
}

function normalizeDuration(duration: Duration): Duration {
  const years = duration.years ?? 0;
  const months = duration.months ?? 0;
  const days = duration.days ?? 0;
  const hours = duration.hours ?? 0;
  const minutes = duration.minutes ?? 0;
  const seconds = duration.seconds ?? 0;

  const avgDaysPerMonth = 30.4375;
  const totalDays = days + months * avgDaysPerMonth;

  return {
    years,
    months,
    days: Math.floor(totalDays) % 30,
    hours,
    minutes,
    seconds,
  };
}

export function computeCountdownOnce(targetDate: Date, locale: Pick<Locale, "formatDistance">): string {
  const duration = intervalToDuration({ start: new Date(), end: targetDate });

  const totalDays = (duration.years ?? 0) * 365 + (duration.months ?? 0) * 30.4375 + (duration.days ?? 0);

  let format: (keyof Duration)[];
  let adjustedDuration: Duration;

  if (totalDays >= 365) {
    format = ["years"];
    const years = Math.round(totalDays / 365);
    adjustedDuration = { years };
  } else if (totalDays >= 30) {
    format = ["months"];
    const months = Math.round(totalDays / 30.4375);
    adjustedDuration = { months };
  } else if (totalDays >= 7) {
    format = ["weeks"];
    const weeks = Math.round(totalDays / 7);
    adjustedDuration = { weeks };
  } else if (totalDays >= 1) {
    format = ["days"];
    adjustedDuration = { days: Math.round(totalDays) };
  } else if ((duration.hours ?? 0) >= 1) {
    format = ["hours"];
    adjustedDuration = { hours: duration.hours };
  } else {
    format = ["minutes", "seconds"];
    adjustedDuration = { minutes: duration.minutes, seconds: duration.seconds };
  }

  return formatDuration(adjustedDuration, { format, locale });
}

function getNextDelay(duration: Duration) {
  const isShort = (duration.days ?? 0) === 0 && (duration.hours ?? 0) === 0;

  const now = Date.now();

  return isShort
    ? 1000 - (now % 1000) // align to next second
    : 60000 - (now % 60000); // align to next minute
}
