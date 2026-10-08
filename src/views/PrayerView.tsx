"use client";

import { Compass, MapPin, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { MosqueRow, PlacePicker, PrayerTimesCard, allMosques } from "@/components/shared";
import { ButtonLink, Card, LoadingPage, Notice, PageHeader, SectionTitle } from "@/components/ui";
import { useNow } from "@/lib/hooks";
import { nearestMosques } from "@/lib/places";
import { compassPoint, formatCountdown, formatTime, nextPrayer, prayerLabel, prayerTimesFor, qiblaBearing } from "@/lib/prayer";
import { useAppState } from "@/lib/store";

type OrientationEventIOS = DeviceOrientationEvent & { webkitCompassHeading?: number };
type OrientationCtor = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<"granted" | "denied"> };

function useHeading() {
  const [heading, setHeading] = useState<number | null>(null);
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    const onOrient = (e: Event) => {
      const ev = e as OrientationEventIOS;
      if (typeof ev.webkitCompassHeading === "number") setHeading(ev.webkitCompassHeading);
      else if (ev.absolute && ev.alpha != null) setHeading(360 - ev.alpha);
    };
    window.addEventListener("deviceorientationabsolute", onOrient);
    window.addEventListener("deviceorientation", onOrient);
    return () => {
      window.removeEventListener("deviceorientationabsolute", onOrient);
      window.removeEventListener("deviceorientation", onOrient);
    };
  }, [enabled]);

  async function enable() {
    const ctor = (typeof DeviceOrientationEvent !== "undefined" ? DeviceOrientationEvent : undefined) as OrientationCtor | undefined;
    if (ctor?.requestPermission) {
      const res = await ctor.requestPermission().catch(() => "denied" as const);
      if (res !== "granted") return;
    }
    setEnabled(true);
  }
  return { heading, enabled, enable, supported: typeof window !== "undefined" && "DeviceOrientationEvent" in window };
}

function QiblaCompass({ bearing }: { bearing: number }) {
  const { heading, enabled, enable, supported } = useHeading();
  const rotation = heading == null ? bearing : bearing - heading;
  return (
    <Card className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <svg viewBox="0 0 120 120" className="h-36 w-36 shrink-0" role="img" aria-label={`Qibla is ${Math.round(bearing)} degrees from north`}>
        <circle cx="60" cy="60" r="54" fill="none" stroke="var(--line)" strokeWidth="2" />
        <g transform={heading == null ? undefined : `rotate(${-heading} 60 60)`}>
          <text x="60" y="18" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--danger)">N</text>
          <text x="104" y="64" textAnchor="middle" fontSize="10" fill="var(--muted)">E</text>
          <text x="60" y="110" textAnchor="middle" fontSize="10" fill="var(--muted)">S</text>
          <text x="16" y="64" textAnchor="middle" fontSize="10" fill="var(--muted)">W</text>
        </g>
        <g transform={`rotate(${rotation} 60 60)`}>
          <path d="M60 22 L68 62 L60 56 L52 62 Z" fill="var(--brand)" />
          <rect x="54" y="14" width="12" height="10" rx="1.5" fill="var(--ink)" />
        </g>
        <circle cx="60" cy="60" r="4" fill="var(--ink)" />
      </svg>
      <div className="text-center sm:text-left">
        <p className="text-2xl font-bold tabular-nums">{Math.round(bearing)}°</p>
        <p className="text-sm text-muted">
          from north, roughly {compassPoint(bearing)}. {heading == null ? "Hold your phone flat and turn until north points north." : "Turn until the arrow points straight up."}
        </p>
        {supported && !enabled && (
          <button type="button" onClick={enable} className="mt-2 text-sm font-semibold text-brand">
            Use my phone&apos;s compass
          </button>
        )}
      </div>
    </Card>
  );
}

export function PrayerView() {
  const state = useAppState();
  const now = useNow(15_000);
  if (!state || !now) return <LoadingPage />;

  const { place } = state;
  const next = nextPrayer(place, now);
  const times = prayerTimesFor(place, now);
  const nearby = nearestMosques(place, allMosques(state), 3);

  return (
    <div>
      <PageHeader title="Prayer" subtitle={`${prayerLabel(next.prayer)} in ${formatCountdown(next.at.getTime() - now.getTime())}`} />
      <div className="mb-3">
        <PlacePicker place={place} />
      </div>
      <PrayerTimesCard place={place} now={now} />
      <p className="mt-2 text-xs text-muted">
        Calculated with the UAE method (Fajr and Isha at 18.2°). Friday prayer is at 1:15 pm across the UAE. Times can differ from your mosque by a minute or two.
      </p>

      <SectionTitle>
        <span className="inline-flex items-center gap-1.5">
          <Compass className="h-4 w-4" /> Qibla
        </span>
      </SectionTitle>
      <QiblaCompass bearing={qiblaBearing(place)} />

      <SectionTitle>
        <span className="inline-flex items-center gap-1.5">
          <Moon className="h-4 w-4" /> If you&apos;re fasting today
        </span>
      </SectionTitle>
      <Card className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted">Stop eating (Fajr)</p>
          <p className="text-xl font-semibold tabular-nums">{formatTime(times.fajr, place.timeZone)}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Break your fast (Maghrib)</p>
          <p className="text-xl font-semibold tabular-nums">{formatTime(times.maghrib, place.timeZone)}</p>
        </div>
      </Card>

      <SectionTitle action={<ButtonLink href="/mosques" variant="ghost" className="min-h-9 px-2">All mosques</ButtonLink>}>
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-4 w-4" /> Nearest mosques
        </span>
      </SectionTitle>
      <Card className="space-y-2">
        {nearby.map(({ mosque }) => (
          <MosqueRow key={mosque.id} mosque={mosque} from={place} href={`/mosques/${mosque.id}`} />
        ))}
      </Card>
      {place.source === "gps" && nearby.every(({ mosque }) => mosque.source === "sample") && (
        <div className="mt-3">
          <Notice>You&apos;re using your real location. Open All mosques to load real mosques near you from OpenStreetMap.</Notice>
        </div>
      )}
    </div>
  );
}
