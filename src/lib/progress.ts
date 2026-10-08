import { PRAYERS, dateKey } from "./prayer";
import type { CompanionRequest, PrayerLog } from "./types";

export interface LadderStep {
  id: string;
  title: string;
  hint: string;
  /** Steps marked automatically from what the user has done in the app. */
  auto: boolean;
}

export const LADDER: LadderStep[] = [
  { id: "learn-wudu", title: "Learn how to make wudu", hint: "Finish the wudu guide in Learn.", auto: true },
  { id: "first-prayer", title: "Pray one prayer at home", hint: "Log any prayer on this page.", auto: true },
  { id: "full-day", title: "Pray all five in one day", hint: "Log all five prayers on the same day.", auto: true },
  { id: "companion-visit", title: "Visit a mosque with a companion", hint: "Complete a meet-up from the Companion tab.", auto: true },
  { id: "jummah-companion", title: "Pray Jummah with a companion", hint: "Request a companion for a Friday.", auto: true },
  { id: "solo-visit", title: "Go to the mosque on your own", hint: "Tick this yourself when you're ready. It's the goal.", auto: false },
];

export function ladderProgress(
  log: PrayerLog,
  requests: CompanionRequest[],
  manual: Record<string, boolean>,
  guidesDone: string[],
): Record<string, boolean> {
  const days = Object.values(log);
  const completed = requests.filter((r) => r.status === "completed");
  return {
    "learn-wudu": guidesDone.includes("wudu") || !!manual["learn-wudu"],
    "first-prayer": days.some((d) => Object.keys(d).length > 0),
    "full-day": days.some((d) => PRAYERS.every((p) => d[p.key])),
    "companion-visit": completed.length > 0,
    "jummah-companion": completed.some((r) => r.prayer === "jummah"),
    "solo-visit": !!manual["solo-visit"],
  };
}

export function lastNDays(now: Date, timeZone: string, n = 7): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) keys.push(dateKey(new Date(now.getTime() - i * 86_400_000), timeZone));
  return keys;
}

export function weekSummary(log: PrayerLog, now: Date, timeZone: string) {
  const days = lastNDays(now, timeZone);
  const counts = days.map((k) => Object.keys(log[k] ?? {}).length);
  const total = counts.reduce((a, b) => a + b, 0);
  const anyEarlier = Object.keys(log).some((k) => k < days[0] && Object.keys(log[k]).length > 0);
  const recentGap = counts.slice(-3).every((x) => x === 0);
  let message: string;
  if (total === 0 && anyEarlier) message = "Welcome back. The best time to return is the next prayer — no catching up needed to start again.";
  else if (total === 0) message = "Start small: pick one prayer to log today. One is more than none.";
  else if (recentGap) message = "It's been a few quiet days. That's okay — just start with the next prayer.";
  else if (total >= 30) message = "MashaAllah, a strong week. Keep it gentle and steady.";
  else message = `You prayed ${total} ${total === 1 ? "time" : "times"} this week. Every single one counts.`;
  return { days, counts, total, message };
}
