import type { Duration, Locale } from "date-fns";
import { formatDuration, intervalToDuration } from "date-fns";
import * as React from "react";

import type { SupportedLanguage } from "@/services/i18n/util";

import { getLocale, shortEnLocale } from "../time";
import { useAppStore } from "./use_app_store";

type UseCountdownOptions = {
  format?: (keyof Duration)[];
  autoFormat?: boolean; // switch format based on remaining time
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

  const isShort = (duration.days ?? 0) === 0 && (duration.hours ?? 0) === 0;

  const finalFormat =
    format ??
    (autoFormat
      ? isShort
        ? ["minutes", "seconds"]
        : ["days", "hours", "minutes"]
      : ["days", "hours", "minutes", "seconds"]);

  return {
    duration,
    formatted: formatDuration(duration, {
      format: finalFormat,
      locale,
    }),
    isFinished: now >= targetDate,
  };
}

function getNextDelay(duration: Duration) {
  const isShort = (duration.days ?? 0) === 0 && (duration.hours ?? 0) === 0;

  const now = Date.now();

  return isShort
    ? 1000 - (now % 1000) // align to next second
    : 60000 - (now % 60000); // align to next minute
}
