import type { FormatOptions } from "date-fns";
import { format, intervalToDuration } from "date-fns";
import type { Locale } from "date-fns/locale";
import { es, ja, ptBR, ru } from "date-fns/locale";

import type { SupportedLanguage } from "@/services/i18n/util";

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

export function monthDayHourFormat(date: Date, options?: FormatOptions): string {
  return format(date, "PP · p", options);
}

const formatDistanceLocale: Record<string, string> = {
  xYears: "{{count}} yrs",
  xYear: "{{count}} yr",
  xMonths: "{{count}} months",
  xMonth: "{{count}} month",
  xWeeks: "{{count}} weeks",
  xWeek: "{{count}} week",
  xDays: "{{count}} days",
  xDay: "{{count}} day",
  xHours: "{{count}} hrs",
  xHour: "{{count}} hr",
  xMinutes: "{{count}} mins",
  xMinute: "{{count}} min",
  xSeconds: "{{count}} secs",
  xSecond: "{{count}} sec",
};

export const shortEnLocale = {
  formatDistance: (token: string, count: number) => {
    const singularToken = token.replace("s", "");
    const key = count === 1 ? singularToken : token;
    const replacement = formatDistanceLocale[key];
    if (replacement) {
      return replacement.replace("{{count}}", count.toString());
    }
    return "";
  },
};

export function getLocale(language: SupportedLanguage): Locale | undefined {
  switch (language) {
    case "es":
      return es;
    case "ja":
      return ja;
    case "ru":
      return ru;
    case "pt":
      return ptBR;
    case "en":
      return undefined;
    // Intentionally do not use a default case here catch errors when a new language is supported
  }
}

export function formatDateRange(startDate: Date, endDate: Date, timezone: string, locale: SupportedLanguage): string {
  const startFormatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    timeZone: timezone,
  });
  const endFormatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    timeZone: timezone,
  });
  const yearFormatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    timeZone: timezone,
  });

  const startStr = startFormatter.format(startDate);
  const endStr = endFormatter.format(endDate);
  const startYear = yearFormatter.format(startDate);
  const endYear = yearFormatter.format(endDate);

  if (startStr === endStr && startYear === endYear) {
    return startStr;
  }
  if (startYear === endYear) {
    return `${startStr} - ${endStr}`;
  }
  return `${startStr} ${startYear} - ${endStr} ${endYear}`;
}

export function formatRelativeDate(targetDate: Date, locale = "en-US"): string {
  if (!(targetDate instanceof Date) || isNaN(targetDate.getTime())) {
    throw new Error("Invalid targetDate");
  }

  const nowDate = new Date();
  const now = nowDate.getTime();
  const diffMs = targetDate.getTime() - now;

  const absMs = Math.abs(diffMs);

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (absMs < hour) {
    const value = Math.round(diffMs / minute);
    return rtf.format(value, "minute");
  }

  if (absMs < day) {
    const value = Math.round(diffMs / hour);
    return rtf.format(value, "hour");
  }

  const diffDays = Math.round(diffMs / day);

  if (Math.abs(diffDays) < 7) {
    return rtf.format(diffDays, "day");
  }

  if (Math.abs(diffDays) < 30) {
    return rtf.format(Math.round(diffDays / 7), "week");
  }

  const monthDiff =
    (targetDate.getFullYear() - nowDate.getFullYear()) * 12 + (targetDate.getMonth() - nowDate.getMonth());

  // Only use "month" when it's truly next/last calendar month
  if (Math.abs(monthDiff) === 1) {
    return rtf.format(monthDiff, "month"); // "next month", "last month"
  }

  // For 2 months, avoid vague "in 2 months" → use weeks instead
  if (Math.abs(monthDiff) <= 2) {
    return rtf.format(Math.round(diffDays / 7), "week");
  }

  if (Math.abs(diffDays) < 365) {
    return rtf.format(Math.round(diffDays / 30), "month");
  }

  return rtf.format(Math.round(diffDays / 365), "year");
}
