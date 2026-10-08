"use client";

import { Check, ChevronLeft, ChevronRight, List } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge, Button, ButtonLink, Card, LoadingPage, Notice, PageHeader, cx } from "@/components/ui";
import { GUIDES, type Guide, type GuideStep } from "@/lib/guides";
import { markGuideDone, useAppState } from "@/lib/store";

function ReviewNotice() {
  return <Notice>Draft guide — being reviewed by a qualified scholar before launch. For questions of religious rulings, please ask a licensed teacher or the official fatwa service.</Notice>;
}

export function LearnView() {
  const state = useAppState();
  if (!state) return <LoadingPage />;
  return (
    <div>
      <PageHeader title="Learn" subtitle="Short, step-by-step guides. Go at your own pace — there's no test." />
      <ul className="space-y-2">
        {GUIDES.map((g) => {
          const done = state.guidesDone.includes(g.slug);
          return (
            <li key={g.slug}>
              <Link href={`/learn/${g.slug}`} className="block">
                <Card className="flex items-center justify-between gap-3 hover:bg-surface-2">
                  <div>
                    <p className="font-display text-xl font-semibold">{g.title}</p>
                    <p className="mt-0.5 text-sm text-muted">{g.summary}</p>
                    <p className="mt-1.5 text-xs text-muted">
                      {g.steps.length} steps · {g.minutes} min
                    </p>
                  </div>
                  {done ? (
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-brand-ink" aria-label="Completed">
                      <Check className="h-4 w-4" />
                    </span>
                  ) : (
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
                  )}
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-sm text-muted">
        Want to learn Arabic or Quran with a teacher? In the UAE, classes must be run by licensed centres — Suhba will link to them rather than run its own.
      </p>
    </div>
  );
}

function StepBody({ step }: { step: GuideStep }) {
  return (
    <div>
      <p className="leading-relaxed">{step.body}</p>
      {step.arabic && (
        <div className="mt-4 rounded-2xl border border-gold/25 bg-gold-soft/60 p-5">
          <p lang="ar" dir="rtl" className="font-arabic text-right text-[1.7rem] leading-[2.4]">
            {step.arabic}
          </p>
          {step.transliteration && <p className="mt-3 text-sm italic">{step.transliteration}</p>}
          {step.meaning && <p className="mt-2 text-sm text-muted">&ldquo;{step.meaning}&rdquo;</p>}
        </div>
      )}
    </div>
  );
}

export function GuideView({ guide }: { guide: Guide }) {
  const state = useAppState();
  const [i, setI] = useState(0);
  const [all, setAll] = useState(false);
  if (!state) return <LoadingPage />;
  const done = state.guidesDone.includes(guide.slug);
  const last = i === guide.steps.length - 1;
  const nextGuide = GUIDES[GUIDES.findIndex((g) => g.slug === guide.slug) + 1];

  return (
    <div>
      <Link href="/learn" className="text-sm font-medium text-brand">
        ← All guides
      </Link>
      <div className="mt-3">
        <PageHeader
          title={guide.title}
          subtitle={guide.summary}
          action={
            <button
              type="button"
              onClick={() => setAll(!all)}
              aria-pressed={all}
              className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border border-line px-3 text-sm font-medium"
            >
              <List className="h-4 w-4" /> {all ? "One at a time" : "All steps"}
            </button>
          }
        />
      </div>
      <ReviewNotice />

      {all ? (
        <ol className="mt-5 space-y-3">
          {guide.steps.map((s) => (
            <li key={s.title}>
              <Card>
                <h2 className="mb-2 font-semibold">{s.title}</h2>
                <StepBody step={s} />
              </Card>
            </li>
          ))}
        </ol>
      ) : (
        <div className="mt-5">
          <div className="mb-3 flex gap-1" aria-hidden>
            {guide.steps.map((s, n) => (
              <span key={s.title} className={cx("h-1.5 flex-1 rounded-full", n <= i ? "bg-brand" : "bg-surface-2")} />
            ))}
          </div>
          <Card aria-live="polite">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Step {i + 1} of {guide.steps.length}
            </p>
            <h2 className="font-display mb-3 mt-1 text-2xl font-semibold">{guide.steps[i].title}</h2>
            <StepBody step={guide.steps[i]} />
          </Card>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" onClick={() => setI(i - 1)} disabled={i === 0} aria-label="Previous step">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {!last ? (
              <Button className="flex-1" onClick={() => setI(i + 1)}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button className="flex-1" onClick={() => markGuideDone(guide.slug)} disabled={done}>
                {done ? (
                  <>
                    <Check className="h-4 w-4" /> Completed
                  </>
                ) : (
                  "I've finished this guide"
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {all && !done && (
        <Button className="mt-4 w-full" onClick={() => markGuideDone(guide.slug)}>
          I&apos;ve finished this guide
        </Button>
      )}
      {done && (
        <Card className="mt-5 flex items-center justify-between gap-3 bg-brand-soft">
          <p className="text-sm">
            <Badge tone="brand">Done</Badge> <span className="ml-1">Nicely done. Revisit any time.</span>
          </p>
          {nextGuide && (
            <ButtonLink href={`/learn/${nextGuide.slug}`} variant="secondary" className="shrink-0">
              Next guide
            </ButtonLink>
          )}
        </Card>
      )}
    </div>
  );
}
