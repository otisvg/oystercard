import { describe, expect, it } from "vitest";
import { COMPANIONS, matchCompanions } from "./companions";
import { parseOverpass } from "./osm";
import { AREAS, SAMPLE_MOSQUES, distanceBand, nearestMosques } from "./places";
import { dateKey, formatCountdown, formatTime, hijriDate, nextPrayer, prayerTimesFor, qiblaBearing, upcomingSlots, zonedInstant } from "./prayer";
import { ladderProgress, weekSummary } from "./progress";
import type { CompanionRequest } from "./types";

const marina = AREAS[0];
const TZ = "Asia/Dubai";

describe("prayer times", () => {
  it("gives Dubai Marina times in the expected order and ranges", () => {
    const t = prayerTimesFor(marina, new Date("2026-10-08T06:00:00Z"));
    const hhmm = (d: Date) => formatTime(d, TZ);
    expect(t.fajr < t.sunrise && t.sunrise < t.dhuhr && t.dhuhr < t.asr && t.asr < t.maghrib && t.maghrib < t.isha).toBe(true);
    expect(dateKey(t.fajr, TZ)).toBe("2026-10-08");
    // Early October in Dubai: Fajr ~4:55am, Maghrib ~6:05pm.
    expect(t.fajr.getUTCHours()).toBe(0);
    expect(t.maghrib.getUTCHours()).toBe(14);
    expect(hhmm(t.dhuhr)).toMatch(/^12:\d\d pm$/);
  });

  it("uses the time zone's calendar day, not the browser's", () => {
    expect(dateKey(new Date("2026-10-08T21:00:00Z"), TZ)).toBe("2026-10-09");
    const late = prayerTimesFor(marina, new Date("2026-10-08T21:00:00Z"));
    expect(dateKey(late.dhuhr, TZ)).toBe("2026-10-09");
  });

  it("rolls over to tomorrow's Fajr after Isha", () => {
    const afterIsha = new Date("2026-10-08T19:30:00Z"); // 11:30 pm in Dubai
    const next = nextPrayer(marina, afterIsha);
    expect(next.prayer).toBe("fajr");
    expect(dateKey(next.at, TZ)).toBe("2026-10-09");
  });

  it("replaces Dhuhr with Jummah at 1:15 pm on Fridays", () => {
    expect(zonedInstant(2026, 10, 9, 13, 15, TZ).toISOString()).toBe("2026-10-09T09:15:00.000Z");
    const slots = upcomingSlots(marina, new Date("2026-10-08T06:00:00Z"), 3);
    const friday = slots.filter((s) => dateKey(s.at, TZ) === "2026-10-09");
    expect(friday.map((s) => s.prayer)).toEqual(["fajr", "jummah", "asr", "maghrib", "isha"]);
    expect(friday[1].at.toISOString()).toBe("2026-10-09T09:15:00.000Z");
  });

  it("skips prayers that start too soon to arrange a companion", () => {
    const now = new Date("2026-10-08T06:00:00Z"); // 10 am Dubai
    const slots = upcomingSlots(marina, now, 1, 30);
    expect(slots[0].prayer).toBe("dhuhr");
    expect(slots.every((s) => s.at.getTime() >= now.getTime() + 30 * 60_000)).toBe(true);
  });

  it("points the Qibla west-south-west from the UAE", () => {
    const b = qiblaBearing(marina);
    expect(b).toBeGreaterThan(250);
    expect(b).toBeLessThan(265);
  });

  it("knows when it is Ramadan", () => {
    expect(hijriDate(new Date("2026-03-01T08:00:00Z"), TZ).month).toBe(9);
    expect(hijriDate(new Date("2026-10-08T08:00:00Z"), TZ).month).not.toBe(9);
  });

  it("formats countdowns", () => {
    expect(formatCountdown(0)).toBe("now");
    expect(formatCountdown(42 * 60_000)).toBe("42 min");
    expect(formatCountdown(125 * 60_000)).toBe("2 h 5 min");
  });
});

describe("places", () => {
  it("never shows exact distances", () => {
    expect(distanceBand(0.2)).toBe("under 500 m");
    expect(distanceBand(1.4)).toBe("1–2 km");
    expect(distanceBand(42)).toBe("10+ km");
  });

  it("sorts mosques nearest first", () => {
    const near = nearestMosques(marina, SAMPLE_MOSQUES, 3);
    expect(near[0].mosque.area).toBe("Dubai Marina");
    expect(near[0].km).toBeLessThanOrEqual(near[1].km);
  });

  it("parses OpenStreetMap results and skips elements without a location", () => {
    const parsed = parseOverpass(
      [
        { type: "node", id: 1, lat: 25.1, lon: 55.1, tags: { name: "مسجد", "name:en": "Test Mosque", female: "yes" } },
        { type: "way", id: 2, center: { lat: 25.2, lon: 55.2 }, tags: {} },
        { type: "relation", id: 3 },
      ],
      "Dubai Marina",
    );
    expect(parsed.map((m) => m.name)).toEqual(["Test Mosque", "Unnamed masjid"]);
    expect(parsed[0].sistersSection).toBe(true);
    expect(parsed[1].sistersSection).toBeNull();
  });
});

describe("companion matching", () => {
  const base = { mosqueId: "sample-marina-1", prayer: "maghrib" as const, dayKey: "2026-10-08", blocked: [] as string[] };

  it("only matches the same gender", () => {
    for (const gender of ["brother", "sister"] as const) {
      const matches = matchCompanions({ ...base, gender });
      expect(matches.length).toBeGreaterThan(0);
      expect(matches.every((m) => m.gender === gender)).toBe(true);
    }
  });

  it("is stable for the same mosque, prayer and day", () => {
    const a = matchCompanions({ ...base, gender: "sister" }).map((m) => m.id);
    const b = matchCompanions({ ...base, gender: "sister" }).map((m) => m.id);
    expect(a).toEqual(b);
  });

  it("never shows blocked people", () => {
    const blocked = COMPANIONS.filter((c) => c.gender === "brother").map((c) => c.id).slice(0, 5);
    const matches = matchCompanions({ ...base, prayer: "jummah", gender: "brother", blocked });
    expect(matches.every((m) => !blocked.includes(m.id))).toBe(true);
    expect(matches).toHaveLength(1);
  });

  it("puts companions who share a language first", () => {
    const matches = matchCompanions({ ...base, prayer: "jummah", gender: "brother", languages: ["Tagalog"] });
    expect(matches[0].languages).toContain("Tagalog");
  });
});

describe("progress", () => {
  const request = (over: Partial<CompanionRequest>): CompanionRequest => ({
    id: "r1",
    mosqueId: "m",
    mosqueName: "M",
    companionId: "yusuf",
    prayer: "maghrib",
    prayerAt: 0,
    createdAt: 0,
    acceptAt: 0,
    status: "completed",
    messages: [],
    checkInContact: null,
    feedback: null,
    ...over,
  });

  it("marks ladder steps from what the user has done", () => {
    const log = { "2026-10-07": { fajr: "on-time" as const, dhuhr: "on-time" as const, asr: "late" as const, maghrib: "on-time" as const, isha: "on-time" as const } };
    const p = ladderProgress(log, [request({ prayer: "jummah" })], {}, ["wudu"]);
    expect(p).toEqual({
      "learn-wudu": true,
      "first-prayer": true,
      "full-day": true,
      "companion-visit": true,
      "jummah-companion": true,
      "solo-visit": false,
    });
    expect(ladderProgress({}, [request({ status: "cancelled" })], { "solo-visit": true }, [])["companion-visit"]).toBe(false);
  });

  it("welcomes people back instead of shaming a gap", () => {
    const now = new Date("2026-10-08T08:00:00Z");
    expect(weekSummary({ "2026-09-01": { fajr: "on-time" } }, now, TZ).message).toMatch(/^Welcome back/);
    const week = weekSummary({ "2026-10-08": { fajr: "on-time", dhuhr: "late" } }, now, TZ);
    expect(week.total).toBe(2);
    expect(week.days.at(-1)).toBe("2026-10-08");
    expect(week.counts.at(-1)).toBe(2);
  });
});
