"use client";

import { BadgeCheck, CalendarClock, ChevronRight, HandHeart, Languages, MapPin, ShieldCheck, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { MosqueRow, NeedsProfile, allMosques, findMosque } from "@/components/shared";
import { Badge, Button, Card, LoadingPage, Notice, PageHeader, SectionTitle, cx } from "@/components/ui";
import { matchCompanions } from "@/lib/companions";
import { useNow } from "@/lib/hooks";
import { nearestMosques } from "@/lib/places";
import { dateKey, formatDay, formatTime, prayerLabel, upcomingSlots, type PrayerSlot } from "@/lib/prayer";
import { addAvailability, effectiveStatus, removeAvailability, requestCompanion, useAppState } from "@/lib/store";
import type { Mosque } from "@/lib/types";

export function CompanionView() {
  const state = useAppState();
  const now = useNow(5_000);
  const params = useSearchParams();
  const [tab, setTab] = useState<"find" | "give">("find");
  if (!state || !now) return <LoadingPage />;
  if (!state.profile) {
    return (
      <div>
        <PageHeader title="Companion" subtitle="Go to the masjid with someone who's going anyway." />
        <NeedsProfile what="find or be a companion" />
      </div>
    );
  }

  const active = state.requests.filter((r) => ["pending", "accepted"].includes(effectiveStatus(r, now.getTime())));
  const past = state.requests.filter((r) => !["pending", "accepted"].includes(effectiveStatus(r, now.getTime()))).slice(0, 5);

  return (
    <div>
      <PageHeader title="Companion" subtitle="Go to the masjid with someone who's going anyway." />

      {active.length > 0 && (
        <div className="mb-5 space-y-2">
          {active.map((r) => (
            <Link key={r.id} href={`/companion/${r.id}`} className="block">
              <Card className="flex items-center justify-between gap-3 hover:bg-surface-2">
                <div>
                  <p className="font-semibold">
                    {prayerLabel(r.prayer)} at {r.mosqueName}
                  </p>
                  <p className="text-sm text-muted">
                    {formatDay(r.prayerAt, state.place.timeZone, now)} · {formatTime(r.prayerAt, state.place.timeZone)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {effectiveStatus(r, now.getTime()) === "accepted" ? <Badge tone="brand">Confirmed</Badge> : <Badge tone="gold">Waiting</Badge>}
                  <ChevronRight className="h-5 w-5 text-muted" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {state.profile.isCompanion && (
        <div role="tablist" aria-label="Companion mode" className="mb-5 grid grid-cols-2 rounded-xl bg-surface-2 p-1">
          {(
            [
              ["find", "Find a companion"],
              ["give", "Be a companion"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              role="tab"
              type="button"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cx("min-h-10 rounded-lg text-sm font-semibold", tab === key ? "bg-surface text-ink shadow-sm" : "text-muted")}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {tab === "find" || !state.profile.isCompanion ? (
        <FindCompanion initialMosqueId={params.get("mosque")} now={now} />
      ) : (
        <BeACompanion now={now} />
      )}

      {past.length > 0 && (
        <>
          <SectionTitle>Past meet-ups</SectionTitle>
          <Card className="divide-y divide-line py-1 sm:py-1">
            {past.map((r) => (
              <Link key={r.id} href={`/companion/${r.id}`} className="flex items-center justify-between py-2.5 text-sm">
                <span>
                  {prayerLabel(r.prayer)} at {r.mosqueName}
                </span>
                <Badge tone={r.status === "completed" ? "brand" : "neutral"}>{r.status === "completed" ? "Done" : "Cancelled"}</Badge>
              </Link>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}

function SlotPicker({ slots, value, onChange, timeZone, now }: { slots: PrayerSlot[]; value: PrayerSlot | null; onChange: (s: PrayerSlot) => void; timeZone: string; now: Date }) {
  const byDay = new Map<string, PrayerSlot[]>();
  slots.forEach((s) => {
    const label = formatDay(s.at, timeZone, now);
    byDay.set(label, [...(byDay.get(label) ?? []), s]);
  });
  return (
    <div className="space-y-3">
      {[...byDay.entries()].map(([day, daySlots]) => (
        <div key={day}>
          <p className="mb-1.5 text-sm font-medium text-muted">{day}</p>
          <div className="flex flex-wrap gap-2">
            {daySlots.map((s) => {
              const on = value?.at.getTime() === s.at.getTime();
              return (
                <button
                  key={s.at.getTime()}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onChange(s)}
                  className={cx(
                    "min-h-11 rounded-xl border px-3 text-sm",
                    on ? "border-brand bg-brand text-brand-ink" : s.prayer === "jummah" ? "border-gold/50 bg-gold-soft" : "border-line bg-surface",
                  )}
                >
                  <span className="font-semibold">{prayerLabel(s.prayer)}</span> <span className="tabular-nums opacity-80">{formatTime(s.at, timeZone)}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function MosquePicker({ value, onChange }: { value: Mosque | null; onChange: (m: Mosque) => void }) {
  const state = useAppState()!;
  const list = nearestMosques(state.place, allMosques(state), 6);
  return (
    <div className="space-y-2">
      {list.map(({ mosque }) => (
        <button
          key={mosque.id}
          type="button"
          aria-pressed={value?.id === mosque.id}
          onClick={() => onChange(mosque)}
          className={cx("block w-full rounded-xl border p-3 text-left", value?.id === mosque.id ? "border-brand bg-brand-soft" : "border-line bg-surface hover:bg-surface-2")}
        >
          <MosqueRow mosque={mosque} from={state.place} />
        </button>
      ))}
      <Link href="/mosques" className="inline-block pt-1 text-sm font-medium text-brand">
        Not listed? Find real mosques near you
      </Link>
    </div>
  );
}

function Step({ n, title, done, children }: { n: number; title: string; done: boolean; children: React.ReactNode }) {
  return (
    <section className="relative pl-10">
      <span
        className={cx(
          "absolute left-0 top-0 grid h-7 w-7 place-items-center rounded-full text-sm font-bold",
          done ? "bg-brand text-brand-ink" : "border border-line bg-surface text-muted",
        )}
        aria-hidden
      >
        {n}
      </span>
      <h2 className="mb-3 pt-0.5 font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function FindCompanion({ initialMosqueId, now }: { initialMosqueId: string | null; now: Date }) {
  const state = useAppState()!;
  const router = useRouter();
  const profile = state.profile!;
  const tz = state.place.timeZone;
  const slots = upcomingSlots(state.place, now, 3);
  const [slot, setSlot] = useState<PrayerSlot | null>(null);
  const [mosque, setMosque] = useState<Mosque | null>(() => (initialMosqueId ? (findMosque(state, initialMosqueId) ?? null) : null));

  const matches =
    slot && mosque
      ? matchCompanions({ mosqueId: mosque.id, prayer: slot.prayer, dayKey: dateKey(slot.at, tz), gender: profile.gender, blocked: state.blocked, languages: profile.languages })
      : [];

  function request(companionId: string) {
    if (!slot || !mosque) return;
    const id = requestCompanion({ mosque, companionId, prayer: slot.prayer, prayerAt: slot.at.getTime() });
    router.push(`/companion/${id}`);
  }

  return (
    <div className="space-y-7">
      <Step n={1} title="Which prayer?" done={!!slot}>
        <SlotPicker slots={slots} value={slot} onChange={setSlot} timeZone={tz} now={now} />
      </Step>
      <Step n={2} title="Which mosque?" done={!!mosque}>
        <MosquePicker value={mosque} onChange={setMosque} />
      </Step>
      <Step n={3} title={`Who's going${mosque ? ` to ${mosque.name}` : ""}?`} done={false}>
        {!slot || !mosque ? (
          <p className="text-sm text-muted">Pick a prayer and a mosque to see {profile.gender === "sister" ? "sisters" : "brothers"} who are already going.</p>
        ) : matches.length === 0 ? (
          <Notice>Nobody is listed for this prayer yet. Try another prayer, or a nearby mosque.</Notice>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              {matches.length} {profile.gender === "sister" ? (matches.length === 1 ? "sister" : "sisters") : matches.length === 1 ? "brother" : "brothers"} going to{" "}
              {prayerLabel(slot.prayer)} on {formatDay(slot.at, tz, now).toLowerCase()}. They&apos;ll only see your first name.
            </p>
            {matches.map((c) => (
              <Card key={c.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="arch-sm grid h-12 w-10 shrink-0 place-items-center bg-brand-soft pt-1 font-display text-xl font-semibold text-brand" aria-hidden>
                      {c.name[0]}
                    </span>
                    <div>
                      <p className="flex items-center gap-1.5 font-semibold">
                        {c.name}
                        <BadgeCheck className="h-4 w-4 text-brand" aria-label="Verified" />
                      </p>
                      <p className="text-xs text-muted">Accompanied {c.timesAccompanied} people</p>
                    </div>
                  </div>
                  {c.sharesRevertStory && <Badge tone="gold">Revert too</Badge>}
                </div>
                <p className="mt-3 text-sm">{c.bio}</p>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                  <Languages className="h-3.5 w-3.5" /> {c.languages.join(", ")}
                </p>
                <Button className="mt-3 w-full" onClick={() => request(c.id)}>
                  Ask {c.name} to meet me
                </Button>
              </Card>
            ))}
          </div>
        )}
      </Step>

      <Card className="flex gap-3 bg-surface-2">
        <ShieldCheck className="h-5 w-5 shrink-0 text-brand" />
        <p className="text-sm text-muted">
          You always meet at the mosque entrance, chat stays in the app, and no phone numbers or addresses are shared. Companions are identity-verified and trained.
          <span className="block pt-1 text-xs">Demo: companions are sample profiles and accept automatically.</span>
        </p>
      </Card>
    </div>
  );
}

function BeACompanion({ now }: { now: Date }) {
  const state = useAppState()!;
  const tz = state.place.timeZone;
  const slots = upcomingSlots(state.place, now, 7);
  const [slot, setSlot] = useState<PrayerSlot | null>(null);
  const [mosque, setMosque] = useState<Mosque | null>(null);
  const upcoming = state.availability.filter((a) => a.prayerAt > now.getTime());

  return (
    <div className="space-y-6">
      <Card className="bg-brand-soft">
        <p className="flex items-center gap-2 font-semibold">
          <HandHeart className="h-5 w-5 text-brand" /> Thank you for welcoming people
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
          <li>You accompany — you don&apos;t teach. No lectures, no religious rulings; point questions to licensed teachers.</li>
          <li>Meet only at the mosque entrance, and only people of the same gender.</li>
          <li>Be patient. Walking in can be a huge step for someone.</li>
        </ul>
      </Card>

      {upcoming.length > 0 && (
        <div>
          <SectionTitle>You&apos;re going to</SectionTitle>
          <Card className="divide-y divide-line py-1 sm:py-1">
            {upcoming.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="text-sm">
                  <p className="font-semibold">
                    {prayerLabel(a.prayer)} at {a.mosqueName}
                  </p>
                  <p className="text-muted">
                    {formatDay(a.prayerAt, tz, now)} · {formatTime(a.prayerAt, tz)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAvailability(a.id)}
                  aria-label={`Remove ${prayerLabel(a.prayer)} at ${a.mosqueName}`}
                  className="grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </Card>
          <p className="mt-2 text-xs text-muted">Demo: nobody else can see this yet. In the full app, people nearby who want company would see you here.</p>
        </div>
      )}

      <div>
        <SectionTitle>
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock className="h-4 w-4" /> When are you going anyway?
          </span>
        </SectionTitle>
        <SlotPicker slots={slots.slice(0, 15)} value={slot} onChange={setSlot} timeZone={tz} now={now} />
      </div>
      <div>
        <SectionTitle>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4" /> Where?
          </span>
        </SectionTitle>
        <MosquePicker value={mosque} onChange={setMosque} />
      </div>
      <Button
        className="w-full"
        disabled={!slot || !mosque}
        onClick={() => {
          if (!slot || !mosque) return;
          addAvailability({ mosqueId: mosque.id, mosqueName: mosque.name, prayer: slot.prayer, prayerAt: slot.at.getTime() });
          setSlot(null);
        }}
      >
        <Users className="h-4 w-4" /> I&apos;m happy to accompany someone
      </Button>
    </div>
  );
}
