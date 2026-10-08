"use client";

import { ChevronRight, LocateFixed, MapPin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AREAS, SAMPLE_MOSQUES, distanceBand, distanceKm, walkingMinutes } from "@/lib/places";
import { PRAYERS, formatTime, nextPrayer, prayerTimesFor } from "@/lib/prayer";
import { setPlace, type AppState } from "@/lib/store";
import type { Mosque, Place } from "@/lib/types";
import { Badge, ButtonLink, Card, cx } from "./ui";

export function allMosques(state: AppState): Mosque[] {
  const byId = new Map<string, Mosque>();
  [...state.mosqueCache, ...SAMPLE_MOSQUES].forEach((m) => {
    if (!byId.has(m.id)) byId.set(m.id, m);
  });
  return [...byId.values()];
}

export function findMosque(state: AppState, id: string): Mosque | undefined {
  return allMosques(state).find((m) => m.id === id);
}

export function PlacePicker({ place, compact = false }: { place: Place; compact?: boolean }) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function useGps() {
    if (!navigator.geolocation) {
      setError("Location isn't available in this browser. Pick your area instead.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPlace({
          label: "Near you",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          source: "gps",
        });
        setLocating(false);
      },
      () => {
        setError("We couldn't get your location. Pick your area instead.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    );
  }

  const selected = place.source === "area" ? place.label : "";
  return (
    <div className={cx("flex flex-col gap-2", !compact && "sm:flex-row sm:items-center")}>
      <label className="relative flex-1">
        <span className="sr-only">Your area</span>
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
        <select
          value={selected}
          onChange={(e) => {
            const area = AREAS.find((a) => a.label === e.target.value);
            if (area) setPlace(area);
          }}
          className="min-h-11 w-full appearance-none rounded-xl border border-line bg-surface pl-9 pr-8 text-sm"
        >
          {place.source === "gps" && <option value="">Near you (GPS)</option>}
          {AREAS.map((a) => (
            <option key={a.label} value={a.label}>
              {a.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={useGps}
        disabled={locating}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm font-medium text-brand hover:bg-brand-soft disabled:opacity-60"
      >
        <LocateFixed className="h-4 w-4" aria-hidden />
        {locating ? "Finding you…" : "Use my location"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function PrayerTimesCard({ place, now }: { place: Place; now: Date }) {
  const times = prayerTimesFor(place, now);
  const next = nextPrayer(place, now);
  const nextIsToday = PRAYERS.some((p) => times[p.key].getTime() === next.at.getTime());
  return (
    <Card className="p-0 sm:p-0">
      <ul className="divide-y divide-line">
        {PRAYERS.map((p) => {
          const isNext = nextIsToday && p.key === next.prayer;
          const past = times[p.key].getTime() <= now.getTime();
          return (
            <li key={p.key} className={cx("flex items-center justify-between px-4 py-3 sm:px-5", isNext && "bg-brand-soft")}>
              <div className="flex items-baseline gap-3">
                <span className={cx("font-semibold", past && !isNext && "text-muted")}>{p.label}</span>
                <span className="font-arabic text-sm text-muted" lang="ar">
                  {p.arabic}
                </span>
                {isNext && <Badge tone="brand">Next</Badge>}
              </div>
              <span className={cx("tabular-nums", isNext ? "font-semibold text-brand" : past ? "text-muted" : "")}>
                {formatTime(times[p.key], place.timeZone)}
              </span>
            </li>
          );
        })}
        <li className="flex items-center justify-between px-4 py-2.5 text-sm text-muted sm:px-5">
          <span>Sunrise (Fajr ends)</span>
          <span className="tabular-nums">{formatTime(times.sunrise, place.timeZone)}</span>
        </li>
      </ul>
    </Card>
  );
}

export function MosqueRow({ mosque, from, href }: { mosque: Mosque; from: { lat: number; lng: number }; href?: string }) {
  const km = distanceKm(from, mosque);
  const body = (
    <>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-semibold">{mosque.name}</span>
          {mosque.source === "sample" && <Badge>Sample</Badge>}
        </div>
        <p className="mt-0.5 text-sm text-muted">
          {mosque.area} · {distanceBand(km)}
          {km < 3 && ` · ~${walkingMinutes(km)} min walk`}
          {mosque.sistersSection && " · Sisters' section"}
        </p>
      </div>
      {href && <ChevronRight className="h-5 w-5 shrink-0 text-muted" aria-hidden />}
    </>
  );
  if (!href) return <div className="flex items-center justify-between gap-3">{body}</div>;
  return (
    <Link href={href} className="flex items-center justify-between gap-3 rounded-xl px-1 py-1 hover:bg-surface-2">
      {body}
    </Link>
  );
}

export function NeedsProfile({ what }: { what: string }) {
  return (
    <Card className="text-center">
      <h2 className="text-lg font-semibold">Set up your profile first</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
        To {what}, we need your first name and whether you&apos;re a brother or sister, so we only ever match you with people of the same gender.
      </p>
      <ButtonLink href="/welcome" className="mt-4">
        Get started
      </ButtonLink>
    </Card>
  );
}
