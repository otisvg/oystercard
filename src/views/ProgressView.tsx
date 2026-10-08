"use client";

import { Check } from "lucide-react";
import { Card, LoadingPage, PageHeader, SectionTitle, cx } from "@/components/ui";
import { useNow } from "@/lib/hooks";
import { PRAYERS } from "@/lib/prayer";
import { LADDER, ladderProgress, weekSummary } from "@/lib/progress";
import { setLadderStep, togglePrayer, useAppState } from "@/lib/store";

function dayLabel(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return {
    short: new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" }).format(date),
    long: new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(date),
    day: d,
  };
}

export function ProgressView() {
  const state = useAppState();
  const now = useNow(60_000);
  if (!state || !now) return <LoadingPage />;

  const week = weekSummary(state.prayerLog, now, state.place.timeZone);
  const ladder = ladderProgress(state.prayerLog, state.requests, state.ladderManual, state.guidesDone);

  return (
    <div>
      <PageHeader title="Progress" subtitle="Private to you. Built to encourage, never to judge." />
      <Card className="bg-brand-soft">
        <p className="font-medium">{week.message}</p>
      </Card>

      <SectionTitle>This week</SectionTitle>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[22rem] border-separate border-spacing-1 text-center text-sm">
          <caption className="sr-only">Prayers logged over the last seven days</caption>
          <thead>
            <tr>
              <th scope="col" className="sr-only">
                Prayer
              </th>
              {week.days.map((k, n) => (
                <th key={k} scope="col" className={cx("font-medium", n === 6 ? "text-brand" : "text-muted")}>
                  <span className="block text-xs">{dayLabel(k).short}</span>
                  <span className="block">{dayLabel(k).day}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PRAYERS.map((p) => (
              <tr key={p.key}>
                <th scope="row" className="pr-2 text-left font-medium">
                  {p.label}
                </th>
                {week.days.map((k) => {
                  const mark = state.prayerLog[k]?.[p.key];
                  const label = `${p.label}, ${dayLabel(k).long}: ${mark === "on-time" ? "prayed" : mark === "late" ? "made up later" : "not logged"}`;
                  return (
                    <td key={k}>
                      <button
                        type="button"
                        onClick={() => togglePrayer(k, p.key)}
                        aria-label={label}
                        title={label}
                        className={cx(
                          "mx-auto grid h-9 w-9 place-items-center rounded-lg border",
                          mark === "on-time" && "border-brand bg-brand text-brand-ink",
                          mark === "late" && "border-gold bg-gold-soft text-gold",
                          !mark && "border-line bg-surface",
                        )}
                      >
                        {mark === "on-time" && <Check className="h-4 w-4" />}
                        {mark === "late" && <span className="text-xs font-bold">L</span>}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-brand" /> Prayed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-gold bg-gold-soft" /> Made up later
          </span>
          <span>Tap again to change.</span>
        </p>
      </Card>

      <SectionTitle>Confidence ladder</SectionTitle>
      <Card>
        <p className="mb-3 text-sm text-muted">Small steps towards walking into the masjid on your own. Most steps tick themselves as you use the app.</p>
        <ol className="space-y-1">
          {LADDER.map((s, n) => {
            const done = ladder[s.id];
            const manual = !s.auto || s.id === "learn-wudu";
            return (
              <li key={s.id} className="flex items-start gap-3 rounded-xl p-2">
                {manual ? (
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={(e) => setLadderStep(s.id, e.target.checked)}
                    aria-label={s.title}
                    className="mt-0.5 h-6 w-6 shrink-0 accent-[var(--brand)]"
                  />
                ) : (
                  <span
                    className={cx("grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold", done ? "bg-brand text-brand-ink" : "border border-line text-muted")}
                    aria-label={done ? "Done" : "Not yet"}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : n + 1}
                  </span>
                )}
                <div>
                  <p className={cx("font-medium", done && "text-brand")}>{s.title}</p>
                  <p className="text-sm text-muted">{done ? "Done — alhamdulillah." : s.hint}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </Card>
    </div>
  );
}
