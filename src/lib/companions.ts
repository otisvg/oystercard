import type { Companion, CompanionPrayer, Gender } from "./types";

/**
 * Demo companions. In production these are verified volunteers who have said
 * they are going to a given mosque at a given prayer.
 */
export const COMPANIONS: Companion[] = [
  c("yusuf", "Yusuf", "brother", ["English", "Arabic"], "Pray most Maghribs here. Happy to show you where everything is, then grab a karak after.", false, 14),
  c("daniel", "Daniel", "brother", ["English"], "Took my shahada in 2021 and remember how nervous I was. No question is a silly question.", true, 9),
  c("omar", "Omar", "brother", ["English", "Arabic", "French"], "Software engineer, regular at Fajr and Isha. Quiet and easy-going.", false, 22),
  c("bilal", "Bilal", "brother", ["English", "Urdu", "Hindi"], "Been going to this masjid for ten years. I'll introduce you to the imam if you like.", false, 31),
  c("ibrahim", "Ibrahim", "brother", ["English", "Tagalog"], "Reverted in Dubai five years ago. Jummah is my favourite part of the week.", true, 6),
  c("hamza", "Hamza", "brother", ["English", "Russian"], "Gym after Fajr crew. Let's go together and keep each other consistent.", false, 11),
  c("aisha", "Aisha", "sister", ["English", "Arabic"], "I know the sisters' entrance and the quiet corner to sit. Come as you are.", false, 18),
  c("maryam", "Maryam", "sister", ["English"], "Reverted in 2019. I'll walk you through wudu if you'd like, at your pace.", true, 12),
  c("fatima", "Fatima", "sister", ["English", "Urdu"], "Mum of two, usually at Asr and Maghrib. Very relaxed, no pressure.", false, 25),
  c("zainab", "Zainab", "sister", ["English", "French", "Arabic"], "Teacher, regular at Jummah. Happy to sit with you afterwards for tea.", false, 8),
  c("hana", "Hana", "sister", ["English", "Tagalog"], "New-ish Muslim too. We can be nervous together and it'll be fine.", true, 4),
  c("sara", "Sara", "sister", ["English", "Russian"], "Moved to the UAE last year and found my community at the masjid.", false, 7),
];

function c(
  id: string,
  name: string,
  gender: Gender,
  languages: string[],
  bio: string,
  sharesRevertStory: boolean,
  timesAccompanied: number,
): Companion {
  return { id, name, gender, languages, bio, sharesRevertStory, timesAccompanied };
}

export function getCompanion(id: string): Companion | undefined {
  return COMPANIONS.find((x) => x.id === id);
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface MatchInput {
  mosqueId: string;
  prayer: CompanionPrayer;
  /** Day key so the same prayer on a different day gets different volunteers. */
  dayKey: string;
  gender: Gender;
  blocked: string[];
  languages?: string[];
}

/**
 * Companions already going to this mosque for this prayer. Always same gender;
 * blocked people never appear. Demo data is chosen deterministically from the pool.
 */
export function matchCompanions({ mosqueId, prayer, dayKey, gender, blocked, languages = [] }: MatchInput): Companion[] {
  const pool = COMPANIONS.filter((x) => x.gender === gender && !blocked.includes(x.id));
  const seed = hash(`${mosqueId}|${prayer}|${dayKey}`);
  // Fajr is quieter; Jummah is busiest.
  const wanted = prayer === "fajr" ? 1 + (seed % 2) : prayer === "jummah" ? 4 : 2 + (seed % 2);
  const ranked = [...pool].sort((a, b) => hash(`${seed}${a.id}`) - hash(`${seed}${b.id}`)).slice(0, wanted);
  const speaksMine = (x: Companion) => x.languages.some((l) => languages.includes(l));
  return ranked.sort((a, b) => Number(speaksMine(b)) - Number(speaksMine(a)));
}

export function greeting(companion: Companion, mosqueName: string, meetingPoint: string): string {
  return `Assalamu alaikum! I'm ${companion.name} and I'll be at ${mosqueName}. Let's meet ${meetingPoint.charAt(0).toLowerCase()}${meetingPoint.slice(1)} about 10 minutes before. Message me here if anything changes.`;
}

const REPLIES = [
  "Sounds good, see you there insha'Allah.",
  "No worries at all. Just follow what everyone else does and I'll be right next to you.",
  "Totally fine to be nervous. I'll wait by the entrance so you don't have to walk in alone.",
  "Great question! Don't worry, I'll show you when we get there.",
];

export function autoReply(seed: string): string {
  return REPLIES[hash(seed) % REPLIES.length];
}
