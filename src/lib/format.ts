import type { PositionGroup } from "@/types/player";

const LOCALE = "pt-BR";
const TIME_ZONE = "America/Sao_Paulo";
const EMPTY = "—";

const integerFormat = new Intl.NumberFormat(LOCALE);
const ratingFormat = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const decimalFormat = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 });
const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const relativeFormat = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
const weekdayDateFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
});
const timeFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});

export function formatInteger(value: number | null): string {
  return value === null ? EMPTY : integerFormat.format(value);
}

export function formatDecimal(value: number | null): string {
  return value === null ? EMPTY : decimalFormat.format(value);
}

export function formatRating(value: number | null): string {
  return value === null ? EMPTY : ratingFormat.format(value);
}

/** Recebe porcentagem em 0–100. */
export function formatPercent(value: number | null, fractionDigits = 0): string {
  if (value === null) return EMPTY;
  return `${value.toLocaleString(LOCALE, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}%`;
}

export function formatSigned(value: number): string {
  return value > 0 ? `+${integerFormat.format(value)}` : integerFormat.format(value);
}

export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso));
}

/** Ex.: "sábado, 04/10". */
export function formatWeekdayDate(iso: string): string {
  return weekdayDateFormat.format(new Date(iso));
}

/** Ex.: "20:47". */
export function formatTime(iso: string): string {
  return timeFormat.format(new Date(iso));
}

const RELATIVE_STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

export function formatRelativeTime(iso: string, now = Date.now()): string {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  for (const [unit, unitSeconds] of RELATIVE_STEPS) {
    if (Math.abs(seconds) >= unitSeconds) {
      return relativeFormat.format(Math.round(seconds / unitSeconds), unit);
    }
  }
  return "agora mesmo";
}

const POSITION_GROUP_SHORT: Record<PositionGroup, string> = {
  goalkeeper: "GOL",
  defender: "DEF",
  midfielder: "MEI",
  forward: "ATA",
};

export function formatPositionGroupShort(group: PositionGroup | null): string {
  return group ? POSITION_GROUP_SHORT[group] : EMPTY;
}

export function formatSecondsAsMinutes(seconds: number | null): string {
  return seconds === null ? EMPTY : `${Math.round(seconds / 60)}'`;
}
