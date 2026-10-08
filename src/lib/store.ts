"use client";

import { useSyncExternalStore } from "react";
import { autoReply, getCompanion, greeting } from "./companions";
import { DEFAULT_PLACE } from "./places";
import type {
  Availability,
  CompanionPrayer,
  CompanionRequest,
  Mosque,
  Place,
  PrayerLog,
  PrayerMark,
  PrayerName,
  Profile,
} from "./types";

/**
 * Local demo store. Everything lives in this browser's localStorage.
 *
 * To move to Supabase, keep the exported action names and swap their bodies
 * for database calls; components only use `useAppState` and these actions.
 */
export interface AppState {
  version: 1;
  profile: Profile | null;
  place: Place;
  requests: CompanionRequest[];
  availability: Availability[];
  prayerLog: PrayerLog;
  ladderManual: Record<string, boolean>;
  guidesDone: string[];
  blocked: string[];
  mosqueCache: Mosque[];
}

const KEY = "suhba:v1";

export function initialState(): AppState {
  return {
    version: 1,
    profile: null,
    place: DEFAULT_PLACE,
    requests: [],
    availability: [],
    prayerLog: {},
    ladderManual: {},
    guidesDone: [],
    blocked: [],
    mosqueCache: [],
  };
}

let state: AppState | null = null;
const listeners = new Set<() => void>();

function load(): AppState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed.version === 1) return { ...initialState(), ...parsed };
    }
  } catch {
    // Private mode or corrupted data: start fresh.
  }
  return initialState();
}

function getSnapshot(): AppState {
  if (!state) state = load();
  return state;
}

function getServerSnapshot(): AppState | null {
  return null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      state = load();
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function update(fn: (s: AppState) => AppState) {
  state = fn(getSnapshot());
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked; keep the in-memory state.
  }
  listeners.forEach((l) => l());
}

/** `null` during server rendering and hydration; the app state afterwards. */
export function useAppState(): AppState | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

const uid = () => Math.random().toString(36).slice(2, 10);

// ---- Profile and place ----

export function saveProfile(profile: Profile) {
  update((s) => ({ ...s, profile }));
}

export function setPlace(place: Place) {
  update((s) => ({ ...s, place }));
}

export function resetAll() {
  update(() => initialState());
}

// ---- Mosques ----

export function cacheMosques(mosques: Mosque[]) {
  update((s) => {
    const byId = new Map(s.mosqueCache.map((m) => [m.id, m]));
    mosques.forEach((m) => byId.set(m.id, m));
    return { ...s, mosqueCache: [...byId.values()].slice(-200) };
  });
}

// ---- Companion requests ----

export function requestCompanion(input: {
  mosque: Mosque;
  companionId: string;
  prayer: CompanionPrayer;
  prayerAt: number;
}): string {
  const now = Date.now();
  const companion = getCompanion(input.companionId);
  const acceptAt = now + 4000;
  const request: CompanionRequest = {
    id: uid(),
    mosqueId: input.mosque.id,
    mosqueName: input.mosque.name,
    companionId: input.companionId,
    prayer: input.prayer,
    prayerAt: input.prayerAt,
    createdAt: now,
    acceptAt,
    status: "pending",
    messages: companion
      ? [{ id: uid(), from: "companion", text: greeting(companion, input.mosque.name, input.mosque.meetingPoint), at: acceptAt + 1500 }]
      : [],
    checkInContact: null,
    feedback: null,
  };
  update((s) => ({ ...s, requests: [request, ...s.requests] }));
  return request.id;
}

/** Demo: a pending request counts as accepted once its simulated accept time passes. */
export function effectiveStatus(r: CompanionRequest, now: number): CompanionRequest["status"] {
  if (r.status === "pending" && now >= r.acceptAt) return "accepted";
  return r.status;
}

export function visibleMessages(r: CompanionRequest, now: number) {
  return r.messages.filter((m) => m.at <= now).sort((a, b) => a.at - b.at);
}

function updateRequest(id: string, fn: (r: CompanionRequest) => CompanionRequest) {
  update((s) => ({ ...s, requests: s.requests.map((r) => (r.id === id ? fn(r) : r)) }));
}

export function sendMessage(id: string, text: string) {
  const now = Date.now();
  updateRequest(id, (r) => ({
    ...r,
    messages: [
      ...r.messages,
      { id: uid(), from: "me", text, at: now },
      { id: uid(), from: "companion", text: autoReply(text + r.id), at: now + 2500 },
    ],
  }));
}

export function setCheckIn(id: string, contact: string | null) {
  updateRequest(id, (r) => ({ ...r, checkInContact: contact }));
}

export function cancelRequest(id: string) {
  updateRequest(id, (r) => ({ ...r, status: "cancelled" }));
}

export function completeRequest(id: string, feedback: NonNullable<CompanionRequest["feedback"]>) {
  updateRequest(id, (r) => ({ ...r, status: "completed", feedback }));
}

export function blockCompanion(companionId: string) {
  update((s) => ({
    ...s,
    blocked: s.blocked.includes(companionId) ? s.blocked : [...s.blocked, companionId],
    requests: s.requests.map((r) =>
      r.companionId === companionId && (r.status === "pending" || r.status === "accepted") ? { ...r, status: "cancelled" } : r,
    ),
  }));
}

// ---- Being a companion ----

export function addAvailability(a: Omit<Availability, "id">) {
  update((s) => ({ ...s, availability: [...s.availability, { ...a, id: uid() }].sort((x, y) => x.prayerAt - y.prayerAt) }));
}

export function removeAvailability(id: string) {
  update((s) => ({ ...s, availability: s.availability.filter((a) => a.id !== id) }));
}

// ---- Progress ----

export function togglePrayer(day: string, prayer: PrayerName) {
  update((s) => {
    const dayLog = { ...(s.prayerLog[day] ?? {}) };
    // Cycle: not logged -> on time -> late (made up) -> not logged
    const next: Record<string, PrayerMark | undefined> = { undefined: "on-time", "on-time": "late", late: undefined };
    const value = next[String(dayLog[prayer])];
    if (value) dayLog[prayer] = value;
    else delete dayLog[prayer];
    return { ...s, prayerLog: { ...s.prayerLog, [day]: dayLog } };
  });
}

export function setLadderStep(id: string, done: boolean) {
  update((s) => ({ ...s, ladderManual: { ...s.ladderManual, [id]: done } }));
}

export function markGuideDone(slug: string) {
  update((s) => (s.guidesDone.includes(slug) ? s : { ...s, guidesDone: [...s.guidesDone, slug] }));
}
