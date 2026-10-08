"use client";

import { ArrowRight, BookOpen, Check, Moon, Users } from "lucide-react";
import Link from "next/link";
import { PlacePicker, PrayerTimesCard } from "@/components/shared";
import { Divider, Lattice } from "@/components/ornament";
import { Badge, ButtonLink, Card, LoadingPage, SectionTitle, cx } from "@/components/ui";
import { GUIDES } from "@/lib/guides";
import { useNow } from "@/lib/hooks";
import { PRAYERS, dateKey, formatCountdown, formatDay, formatTime, hijriDate, nextPrayer, prayerLabel, prayerTimesFor } from "@/lib/prayer";
import { LADDER, ladderProgress } from "@/lib/progress";
import { effectiveStatus, togglePrayer, useAppState } from "@/lib/store";

export function HomeView() {
  const state = useAppState();
  const now = useNow(15_000);
  if (!state || !now) return <LoadingPage />;

  const { place, profile } = state;
  const next = nextPrayer(place, now);
  const hijri = hijriDate(now, place.timeZone);
  const today = dateKey(now, place.timeZone);
  const todayLog = state.prayerLog[today] ?? {};
  const times = prayerTimesFor(place, now);
  const upcoming = state.requests
    .filter((r) => ["pending", "accepted"].includes(effectiveStatus(r, now.getTime())) && r.prayerAt > now.getTime() - 3 * 3600_000)
    .sort((a, b) => a.prayerAt - b.prayerAt);
  const nextGuide = GUIDES.find((g) => !state.guidesDone.includes(g.slug));
  const ladder = ladderProgress(state.prayerLog, state.requests, state.ladderManual, state.guidesDone);
  const ladderDone = LADDER.filter((s) => ladder[s.id]).length;

  return (
    <div>
      <div className="mb-6 text-center">
        <p className="text-sm text-gold">{hijri.text}</p>
        <h1 className="font-display mt-1 text-[2.1rem] font-semibold leading-tight">{profile ? `Assalamu alaikum, ${profile.name}` : "Assalamu alaikum"}</h1>
      </div>

      {!profile && (
        <Card className="mb-6 border-brand/20 bg-brand-soft text-center">
          <h2 className="font-display text-2xl font-semibold">Practise with confidence — and never walk in alone</h2>
          <p className="mt-1 text-sm text-muted">
            Suhba means companionship. Learn the basics at your own pace, and when you&apos;re ready, a friendly local Muslim can meet you at the mosque and go in with you.
          </p>
          <ButtonLink href="/welcome" className="mt-4">
            Get started <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </Card>
      )}

      <section aria-label="Next prayer" className="arch relative mx-auto max-w-sm overflow-hidden bg-niche px-6 pb-7 pt-14 text-center text-niche-ink">
        <Lattice className="text-gold opacity-[0.16]" />
        <div aria-hidden className="arch pointer-events-none absolute inset-2.5 border border-gold/45" />
        <div className="relative">
          <p className="text-xs font-medium uppercase tracking-[0.18em] opacity-75">Next prayer · {place.label}</p>
          <p lang="ar" className="font-arabic mt-5 text-3xl text-gold">
            {PRAYERS.find((p) => p.key === next.prayer)?.arabic}
          </p>
          <p className="font-display text-5xl font-semibold leading-tight">{prayerLabel(next.prayer)}</p>
          <p className="mt-1 text-sm opacity-85">
            {formatDay(next.at, place.timeZone, now)} at {formatTime(next.at, place.timeZone)}
          </p>
          <Divider className="mx-auto my-5 max-w-[10rem]" />
          <p className="text-sm opacity-80">begins in</p>
          <p className="text-2xl font-semibold tabular-nums">{formatCountdown(next.at.getTime() - now.getTime())}</p>
          <Link
            href="/companion"
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-gold/50 px-5 text-sm font-semibold hover:bg-niche-ink/10"
          >
            <Users className="h-4 w-4" /> Go with a companion
          </Link>
        </div>
      </section>

      {hijri.month === 9 && (
        <Card className="mx-auto mt-4 max-w-sm border-gold/40 bg-gold-soft text-center">
          <div className="flex items-center justify-center gap-2 font-semibold">
            <Moon className="h-4 w-4 text-gold" /> Ramadan Mubarak
          </div>
          <p className="mt-1 text-sm">
            Suhoor ends at <strong>{formatTime(times.fajr, place.timeZone)}</strong> · Iftar at <strong>{formatTime(times.maghrib, place.timeZone)}</strong>
          </p>
        </Card>
      )}

      {upcoming.length > 0 && (
        <>
          <SectionTitle>Your meet-ups</SectionTitle>
          <div className="space-y-2">
            {upcoming.map((r) => (
              <Link key={r.id} href={`/companion/${r.id}`} className="block">
                <Card className="flex items-center justify-between gap-3 hover:bg-surface-2">
                  <div>
                    <p className="font-semibold">
                      {prayerLabel(r.prayer)} at {r.mosqueName}
                    </p>
                    <p className="text-sm text-muted">
                      {formatDay(r.prayerAt, place.timeZone, now)} · {formatTime(r.prayerAt, place.timeZone)}
                    </p>
                  </div>
                  {effectiveStatus(r, now.getTime()) === "accepted" ? <Badge tone="brand">Confirmed</Badge> : <Badge tone="gold">Waiting</Badge>}
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}

      <SectionTitle action={<Link href="/progress" className="text-sm font-medium text-brand">See week</Link>}>Today&apos;s prayers</SectionTitle>
      <Card>
        <p className="mb-3 text-sm text-muted">Tap a prayer once you&apos;ve prayed it. Just for you — nobody else sees this.</p>
        <div className="grid grid-cols-5 gap-2">
          {PRAYERS.map((p) => {
            const mark = todayLog[p.key];
            const due = times[p.key].getTime() <= now.getTime();
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => togglePrayer(today, p.key)}
                aria-pressed={!!mark}
                aria-label={`${p.label}: ${mark === "on-time" ? "prayed" : mark === "late" ? "prayed late" : "not logged"}`}
                className={cx(
                  "flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border text-xs font-medium",
                  mark ? "border-brand bg-brand-soft text-brand" : due ? "border-line bg-surface" : "border-dashed border-line text-muted",
                )}
              >
                <span className={cx("grid h-6 w-6 place-items-center rounded-full", mark ? "bg-brand text-brand-ink" : "border border-line")}>
                  {mark && <Check className="h-4 w-4" />}
                </span>
                {p.label}
              </button>
            );
          })}
        </div>
      </Card>

      <SectionTitle>Prayer times</SectionTitle>
      <div className="mb-3">
        <PlacePicker place={place} />
      </div>
      <PrayerTimesCard place={place} now={now} />

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        {nextGuide && (
          <Link href={`/learn/${nextGuide.slug}`}>
            <Card className="h-full hover:bg-surface-2">
              <BookOpen className="h-5 w-5 text-brand" />
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted">Continue learning</p>
              <p className="font-semibold">{nextGuide.title}</p>
              <p className="text-sm text-muted">{nextGuide.minutes} min read</p>
            </Card>
          </Link>
        )}
        <Link href="/progress">
          <Card className="h-full hover:bg-surface-2">
            <div className="flex gap-1" aria-hidden>
              {LADDER.map((s) => (
                <span key={s.id} className={cx("h-1.5 flex-1 rounded-full", ladder[s.id] ? "bg-brand" : "bg-surface-2")} />
              ))}
            </div>
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted">Confidence ladder</p>
            <p className="font-semibold">
              {ladderDone} of {LADDER.length} steps
            </p>
            <p className="text-sm text-muted">{LADDER.find((s) => !ladder[s.id])?.title ?? "You made it. MashaAllah!"}</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
