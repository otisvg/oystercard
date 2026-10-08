import { CalculationMethod, Coordinates, Madhab, PrayerTimes, Qibla } from "adhan";
import type { CompanionPrayer, Place, PrayerName } from "./types";

export const PRAYERS: { key: PrayerName; label: string; arabic: string; rakats: number }[] = [
  { key: "fajr", label: "Fajr", arabic: "الفجر", rakats: 2 },
  { key: "dhuhr", label: "Dhuhr", arabic: "الظهر", rakats: 4 },
  { key: "asr", label: "Asr", arabic: "العصر", rakats: 4 },
  { key: "maghrib", label: "Maghrib", arabic: "المغرب", rakats: 3 },
  { key: "isha", label: "Isha", arabic: "العشاء", rakats: 4 },
];

export function prayerLabel(p: CompanionPrayer): string {
  if (p === "jummah") return "Jummah";
  return PRAYERS.find((x) => x.key === p)!.label;
}

/** Friday prayer in the UAE has been held at 1:15 pm since January 2022. */
export const UAE_JUMMAH = { hour: 13, minute: 15 };

interface DayParts {
  y: number;
  m: number;
  d: number;
  weekday: number; // 0 = Sunday
}

export function dayParts(instant: Date, timeZone: string): DayParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).formatToParts(instant);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return { y: Number(get("year")), m: Number(get("month")), d: Number(get("day")), weekday: weekdays.indexOf(get("weekday")) };
}

/** YYYY-MM-DD for the calendar day of `instant` in `timeZone`. */
export function dateKey(instant: Date, timeZone: string): string {
  const { y, m, d } = dayParts(instant, timeZone);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function tzOffsetMs(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(new Date(instant));
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(instant / 1000) * 1000;
}

/** The instant of a wall-clock time in a time zone. */
export function zonedInstant(y: number, m: number, d: number, hour: number, minute: number, timeZone: string): Date {
  const guess = Date.UTC(y, m - 1, d, hour, minute);
  return new Date(guess - tzOffsetMs(guess, timeZone));
}

export type DayTimes = Record<PrayerName | "sunrise", Date>;

/**
 * Prayer times using the UAE (Dubai) method: Fajr and Isha at 18.2°, Shafi'i Asr.
 * Check against the official GAIAEZ timetable before launch; it may differ by a minute or two.
 */
export function prayerTimesFor(place: Pick<Place, "lat" | "lng" | "timeZone">, instant: Date, dayOffset = 0): DayTimes {
  const { y, m, d } = dayParts(instant, place.timeZone);
  // adhan reads the calendar date from the Date's local fields.
  const date = new Date(y, m - 1, d + dayOffset);
  const params = CalculationMethod.Dubai();
  params.madhab = Madhab.Shafi;
  const t = new PrayerTimes(new Coordinates(place.lat, place.lng), date, params);
  return { fajr: t.fajr, sunrise: t.sunrise, dhuhr: t.dhuhr, asr: t.asr, maghrib: t.maghrib, isha: t.isha };
}

export function nextPrayer(place: Pick<Place, "lat" | "lng" | "timeZone">, now: Date): { prayer: PrayerName; at: Date } {
  const today = prayerTimesFor(place, now);
  for (const p of PRAYERS) {
    if (today[p.key].getTime() > now.getTime()) return { prayer: p.key, at: today[p.key] };
  }
  return { prayer: "fajr", at: prayerTimesFor(place, now, 1).fajr };
}

export interface PrayerSlot {
  prayer: CompanionPrayer;
  at: Date;
}

/**
 * Prayers someone could ask a companion for, starting at least `leadMinutes` from now.
 * On Fridays Dhuhr becomes Jummah at the fixed UAE time.
 */
export function upcomingSlots(place: Pick<Place, "lat" | "lng" | "timeZone">, now: Date, days = 7, leadMinutes = 30): PrayerSlot[] {
  const slots: PrayerSlot[] = [];
  const cutoff = now.getTime() + leadMinutes * 60_000;
  for (let offset = 0; offset < days; offset++) {
    const times = prayerTimesFor(place, now, offset);
    const { y, m, d, weekday } = dayParts(times.dhuhr, place.timeZone);
    for (const p of PRAYERS) {
      let slot: PrayerSlot = { prayer: p.key, at: times[p.key] };
      if (p.key === "dhuhr" && weekday === 5) {
        slot = { prayer: "jummah", at: zonedInstant(y, m, d, UAE_JUMMAH.hour, UAE_JUMMAH.minute, place.timeZone) };
      }
      if (slot.at.getTime() >= cutoff) slots.push(slot);
    }
  }
  return slots;
}

export function formatTime(instant: Date | number, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone, hour: "numeric", minute: "2-digit", hour12: true }).format(instant);
}

export function formatDay(instant: Date | number, timeZone: string, now: Date): string {
  const key = dateKey(new Date(instant), timeZone);
  if (key === dateKey(now, timeZone)) return "Today";
  if (key === dateKey(new Date(now.getTime() + 86_400_000), timeZone)) return "Tomorrow";
  return new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "long", day: "numeric", month: "short" }).format(instant);
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return "now";
  const totalMin = Math.floor(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  if (h === 0) return totalMin === 0 ? "under a minute" : `${min} min`;
  return `${h} h ${min} min`;
}

export function qiblaBearing(place: Pick<Place, "lat" | "lng">): number {
  return Qibla(new Coordinates(place.lat, place.lng));
}

export function compassPoint(bearing: number): string {
  const points = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];
  return points[Math.round((((bearing % 360) + 360) % 360) / 45) % 8];
}

export function hijriDate(instant: Date, timeZone: string): { text: string; month: number } {
  const text = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
    timeZone,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(instant);
  const monthPart = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", { timeZone, month: "numeric" }).format(instant);
  return { text, month: Number(monthPart) };
}
