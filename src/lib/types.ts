export type Gender = "brother" | "sister";

export type PrayerName = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

/** A prayer someone can be accompanied to. Jummah replaces Dhuhr on Fridays. */
export type CompanionPrayer = PrayerName | "jummah";

export interface Place {
  label: string;
  lat: number;
  lng: number;
  timeZone: string;
  source: "area" | "gps";
}

export interface Profile {
  name: string;
  gender: Gender;
  wantsCompanion: boolean;
  isCompanion: boolean;
  languages: string[];
  confirmedAdult: boolean;
  createdAt: number;
}

export interface Mosque {
  id: string;
  name: string;
  area: string;
  lat: number;
  lng: number;
  /** Facility notes are unverified until a mosque partner or user confirms them. */
  sistersSection: boolean | null;
  wuduArea: boolean | null;
  parking: boolean | null;
  meetingPoint: string;
  source: "sample" | "openstreetmap";
}

export interface Companion {
  id: string;
  name: string;
  gender: Gender;
  languages: string[];
  bio: string;
  /** Companions choose whether to share this; it is never inferred. */
  sharesRevertStory: boolean;
  timesAccompanied: number;
}

export type RequestStatus = "pending" | "accepted" | "completed" | "cancelled";

export interface ChatMessage {
  id: string;
  from: "me" | "companion";
  text: string;
  /** Messages with a future timestamp are simulated replies not yet "delivered". */
  at: number;
}

export interface CompanionRequest {
  id: string;
  mosqueId: string;
  mosqueName: string;
  companionId: string;
  prayer: CompanionPrayer;
  /** Epoch ms of the prayer being attended. */
  prayerAt: number;
  createdAt: number;
  /** Demo only: when the simulated companion accepts. */
  acceptAt: number;
  status: RequestStatus;
  messages: ChatMessage[];
  checkInContact: string | null;
  feedback: { rating: "good" | "okay" | "uncomfortable"; note: string } | null;
}

export interface Availability {
  id: string;
  mosqueId: string;
  mosqueName: string;
  prayer: CompanionPrayer;
  prayerAt: number;
}

export type PrayerMark = "on-time" | "late";

/** dateKey (YYYY-MM-DD in the user's time zone) -> prayer -> mark */
export type PrayerLog = Record<string, Partial<Record<PrayerName, PrayerMark>>>;
