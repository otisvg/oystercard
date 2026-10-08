"use client";

import { ArrowLeft, HeartHandshake, Lock, ShieldCheck, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lattice } from "@/components/ornament";
import { PlacePicker } from "@/components/shared";
import { Button, Card, LoadingPage, cx } from "@/components/ui";
import { saveProfile, useAppState } from "@/lib/store";
import type { Gender } from "@/lib/types";

const LANGUAGES = ["English", "Arabic", "Urdu", "Hindi", "Tagalog", "Russian", "French", "Bengali", "Malayalam"];

export function WelcomeView() {
  const state = useAppState();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [adult, setAdult] = useState(false);
  const [wantsCompanion, setWantsCompanion] = useState(true);
  const [isCompanion, setIsCompanion] = useState(false);
  const [languages, setLanguages] = useState<string[]>(["English"]);

  if (!state) return <LoadingPage />;

  const steps = ["Welcome", "About you", "How you'll use Suhba", "Your area"];
  const canContinue = step !== 1 || (name.trim().length > 0 && gender && adult);

  function finish() {
    saveProfile({
      name: name.trim(),
      gender: gender!,
      confirmedAdult: adult,
      wantsCompanion,
      isCompanion,
      languages,
      createdAt: Date.now(),
    });
    router.push("/");
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6 flex items-center gap-3">
        {step > 0 && (
          <button type="button" onClick={() => setStep(step - 1)} aria-label="Back" className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface-2">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="flex flex-1 gap-1.5" aria-label={`Step ${step + 1} of ${steps.length}: ${steps[step]}`}>
          {steps.map((s, i) => (
            <span key={s} className={cx("h-1.5 flex-1 rounded-full", i <= step ? "bg-brand" : "bg-surface-2")} />
          ))}
        </div>
      </div>

      {step === 0 && (
        <div>
          <div className="arch relative mx-auto mb-7 grid h-56 w-44 place-items-center overflow-hidden bg-niche text-niche-ink">
            <Lattice className="text-gold opacity-[0.18]" />
            <div aria-hidden className="arch pointer-events-none absolute inset-2 border border-gold/45" />
            <p lang="ar" className="font-arabic relative pt-6 text-6xl text-gold">
              صحبة
            </p>
          </div>
          <h1 className="font-display text-center text-[2.4rem] font-semibold leading-tight">Welcome to Suhba</h1>
          <p className="mt-2 text-center text-muted">
            Suhba means companionship. For reverts, and for anyone who finds it hard to practise or feels anxious about going to the mosque.
          </p>
          <ul className="mt-6 space-y-4">
            {[
              { icon: HeartHandshake, title: "Learn at your own pace", text: "Prayer times, step-by-step guides and a gentle tracker. No shame, no streak pressure." },
              { icon: Users, title: "Never walk in alone", text: "Ask a friendly local Muslim, who's going anyway, to meet you at the mosque." },
              { icon: Lock, title: "Private by default", text: "Your faith journey is yours. Nothing about being a revert is ever shown publicly." },
            ].map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <span className="arch-sm grid h-11 w-10 shrink-0 place-items-center bg-brand-soft pt-1 text-brand">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <h1 className="font-display text-3xl font-semibold">About you</h1>
          <label className="block">
            <span className="text-sm font-medium">First name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="given-name"
              maxLength={30}
              className="mt-1 min-h-11 w-full rounded-xl border border-line bg-surface px-3"
              placeholder="e.g. Adam"
            />
            <span className="mt-1 block text-xs text-muted">Companions only ever see your first name.</span>
          </label>
          <fieldset>
            <legend className="text-sm font-medium">I am a…</legend>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {(["brother", "sister"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  aria-pressed={gender === g}
                  className={cx("min-h-12 rounded-xl border font-medium capitalize", gender === g ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface")}
                >
                  {g}
                </button>
              ))}
            </div>
            <span className="mt-1 block text-xs text-muted">Brothers are matched with brothers and sisters with sisters.</span>
          </fieldset>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} className="mt-0.5 h-5 w-5 accent-[var(--brand)]" />
            I&apos;m 18 or older. Suhba is for adults only for now.
          </label>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <h1 className="font-display text-3xl font-semibold">How will you use Suhba?</h1>
          <p className="text-sm text-muted">Pick one or both. You can change this later.</p>
          {[
            { on: wantsCompanion, set: setWantsCompanion, title: "I'd like a companion", text: "Someone to meet me at the mosque and go in with me." },
            { on: isCompanion, set: setIsCompanion, title: "I'd like to be a companion", text: "I go to the mosque anyway and I'm happy to welcome someone." },
          ].map((o) => (
            <button
              key={o.title}
              type="button"
              onClick={() => o.set(!o.on)}
              aria-pressed={o.on}
              className={cx("block w-full rounded-2xl border p-4 text-left", o.on ? "border-brand bg-brand-soft" : "border-line bg-surface")}
            >
              <span className="font-semibold">{o.title}</span>
              <span className="mt-0.5 block text-sm text-muted">{o.text}</span>
            </button>
          ))}
          <fieldset>
            <legend className="text-sm font-medium">Languages you speak</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {LANGUAGES.map((l) => {
                const on = languages.includes(l);
                return (
                  <button
                    key={l}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setLanguages(on ? languages.filter((x) => x !== l) : [...languages, l])}
                    className={cx("min-h-9 rounded-full border px-3 text-sm", on ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface")}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h1 className="font-display text-3xl font-semibold">Where are you?</h1>
          <p className="text-sm text-muted">Used for prayer times and nearby mosques. Other people only ever see a rough distance, never your location.</p>
          <PlacePicker place={state.place} compact />
          <Card className="flex gap-3">
            <ShieldCheck className="h-5 w-5 shrink-0 text-brand" />
            <p className="text-sm text-muted">
              In the full app you&apos;ll verify your identity with UAE Pass before meeting anyone. In this demo, companions are sample profiles.
            </p>
          </Card>
        </div>
      )}

      <div className="mt-8">
        {step < steps.length - 1 ? (
          <Button className="w-full" disabled={!canContinue} onClick={() => setStep(step + 1)}>
            {step === 0 ? "Let's begin" : "Continue"}
          </Button>
        ) : (
          <Button className="w-full" onClick={finish}>
            Finish
          </Button>
        )}
      </div>
    </div>
  );
}
