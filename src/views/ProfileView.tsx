"use client";

import { BadgeCheck, Lock, RotateCcw, ShieldCheck, UserX } from "lucide-react";
import { useState } from "react";
import { NeedsProfile } from "@/components/shared";
import { Badge, Button, ButtonLink, Card, LoadingPage, PageHeader, SectionTitle } from "@/components/ui";
import { getCompanion } from "@/lib/companions";
import { resetAll, saveProfile, useAppState } from "@/lib/store";

export function ProfileView() {
  const state = useAppState();
  const [confirmReset, setConfirmReset] = useState(false);
  if (!state) return <LoadingPage />;
  const { profile } = state;

  return (
    <div>
      <PageHeader title="Profile & safety" />
      {!profile ? (
        <NeedsProfile what="use companions" />
      ) : (
        <Card>
          <div className="flex items-center gap-3">
            <span className="arch-sm grid h-14 w-12 place-items-center bg-brand-soft pt-1 font-display text-2xl font-semibold text-brand" aria-hidden>
              {profile.name[0]?.toUpperCase()}
            </span>
            <div>
              <p className="text-lg font-semibold">{profile.name}</p>
              <p className="text-sm capitalize text-muted">
                {profile.gender} · {state.place.label}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-3 border-t border-line pt-4">
            {[
              { key: "wantsCompanion" as const, label: "I'd like a companion" },
              { key: "isCompanion" as const, label: "I'm happy to be a companion" },
            ].map((o) => (
              <label key={o.key} className="flex items-center justify-between gap-3 text-sm">
                {o.label}
                <input
                  type="checkbox"
                  checked={profile[o.key]}
                  onChange={(e) => saveProfile({ ...profile, [o.key]: e.target.checked })}
                  className="h-6 w-6 accent-[var(--brand)]"
                />
              </label>
            ))}
            <p className="text-sm text-muted">Languages: {profile.languages.join(", ") || "none set"}</p>
          </div>
        </Card>
      )}

      <SectionTitle>Verification</SectionTitle>
      <Card className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <BadgeCheck className="h-5 w-5 shrink-0 text-brand" />
          <div>
            <p className="font-semibold">Verify with UAE Pass</p>
            <p className="text-sm text-muted">Everyone who meets in person will be identity-verified with the UAE&apos;s national digital ID.</p>
          </div>
        </div>
        <Badge>Coming soon</Badge>
      </Card>

      <SectionTitle>How we keep you safe</SectionTitle>
      <Card>
        <ul className="space-y-3 text-sm">
          {[
            "Brothers meet brothers, sisters meet sisters.",
            "You only ever meet at the mosque entrance — never at home.",
            "Distances are shown roughly; nobody sees where you live.",
            "Chat stays in the app. No phone numbers are shared.",
            "Companions are trained to accompany, not to teach or give rulings.",
            "Report or block anyone, any time. Our team reviews every report.",
          ].map((t) => (
            <li key={t} className="flex gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> {t}
            </li>
          ))}
        </ul>
      </Card>

      {state.blocked.length > 0 && (
        <>
          <SectionTitle>Blocked</SectionTitle>
          <Card className="space-y-2 text-sm">
            {state.blocked.map((id) => (
              <p key={id} className="flex items-center gap-2">
                <UserX className="h-4 w-4 text-danger" /> {getCompanion(id)?.name ?? id}
              </p>
            ))}
          </Card>
        </>
      )}

      <SectionTitle>Your data</SectionTitle>
      <Card className="space-y-3">
        <p className="flex gap-2 text-sm text-muted">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          In this demo everything — your profile, prayer log and messages — is stored only in this browser. Being a revert is never shown on your profile.
        </p>
        {!confirmReset ? (
          <Button variant="secondary" onClick={() => setConfirmReset(true)}>
            <RotateCcw className="h-4 w-4" /> Reset demo data
          </Button>
        ) : (
          <div className="rounded-xl bg-danger-soft p-3 text-sm">
            <p>This deletes your profile, prayer log and meet-ups from this browser.</p>
            <div className="mt-2 flex gap-2">
              <Button
                variant="danger"
                onClick={() => {
                  resetAll();
                  setConfirmReset(false);
                }}
              >
                Delete everything
              </Button>
              <Button variant="secondary" onClick={() => setConfirmReset(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>

      {!profile && (
        <ButtonLink href="/welcome" className="mt-6 w-full">
          Set up your profile
        </ButtonLink>
      )}
      <p className="mt-8 text-xs text-muted">
        Suhba is an early prototype. Religious guides are drafts awaiting scholar review. Companions shown are sample profiles.
      </p>
    </div>
  );
}
