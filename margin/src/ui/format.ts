const relative = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const number = new Intl.NumberFormat();

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 86_400_000],
  ['month', 30 * 86_400_000],
  ['week', 7 * 86_400_000],
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
];

export function timeAgo(time: number, now = Date.now()): string {
  const elapsed = time - now;
  for (const [unit, ms] of UNITS) {
    if (Math.abs(elapsed) >= ms) return relative.format(Math.round(elapsed / ms), unit);
  }
  return 'just now';
}

export const formatDateTime = (time: number) => dateTime.format(time);
export const formatNumber = (n: number) => number.format(n);
export const plural = (n: number, word: string) => `${formatNumber(n)} ${word}${n === 1 ? '' : 's'}`;
