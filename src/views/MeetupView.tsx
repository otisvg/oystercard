"use client";

import { BadgeCheck, Clock, Flag, MapPin, Send, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { findMosque } from "@/components/shared";
import { Badge, Button, ButtonLink, Card, LoadingPage, Notice, SectionTitle, cx } from "@/components/ui";
import { getCompanion } from "@/lib/companions";
import { useNow } from "@/lib/hooks";
import { formatDay, formatTime, prayerLabel } from "@/lib/prayer";
import { blockCompanion, cancelRequest, completeRequest, effectiveStatus, sendMessage, setCheckIn, useAppState, visibleMessages } from "@/lib/store";
import type { CompanionRequest } from "@/lib/types";

const STAGES = ["Requested", "Confirmed", "Meet & pray", "Done"];

export function MeetupView() {
  const { id } = useParams<{ id: string }>();
  const state = useAppState();
  const now = useNow(1_000);
  if (!state || !now) return <LoadingPage />;

  const request = state.requests.find((r) => r.id === id);
  if (!request) {
    return (
      <Card className="text-center">
        <p className="font-semibold">This meet-up isn&apos;t on this device.</p>
        <ButtonLink href="/companion" variant="secondary" className="mt-3">
          Back to Companion
        </ButtonLink>
      </Card>
    );
  }

  const companion = getCompanion(request.companionId);
  const mosque = findMosque(state, request.mosqueId);
  const status = effectiveStatus(request, now.getTime());
  const tz = state.place.timeZone;
  const stage = status === "pending" ? 0 : status === "accepted" ? (now.getTime() >= request.prayerAt - 3600_000 ? 2 : 1) : status === "completed" ? 3 : -1;
  const open = status === "pending" || status === "accepted";

  return (
    <div>
      <Link href="/companion" className="text-sm font-medium text-brand">
        ← Companion
      </Link>
      <h1 className="font-display mt-3 text-[2rem] font-semibold leading-tight">
        {prayerLabel(request.prayer)} with {companion?.name ?? "your companion"}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {formatDay(request.prayerAt, tz, now)} at {formatTime(request.prayerAt, tz)} · {request.mosqueName}
      </p>

      {status === "cancelled" ? (
        <div className="mt-4">
          <Notice>This meet-up was cancelled.</Notice>
        </div>
      ) : (
        <ol className="mt-5 grid grid-cols-4 gap-1.5" aria-label="Meet-up progress">
          {STAGES.map((s, i) => (
            <li key={s} aria-current={i === stage ? "step" : undefined}>
              <span className={cx("block h-1.5 rounded-full", i <= stage ? "bg-brand" : "bg-surface-2")} />
              <span className={cx("mt-1.5 block text-xs", i === stage ? "font-semibold text-ink" : "text-muted")}>{s}</span>
            </li>
          ))}
        </ol>
      )}

      {status === "pending" && (
        <Card className="mt-5" role="status">
          <p className="font-semibold">Waiting for {companion?.name} to confirm…</p>
          <p className="mt-1 text-sm text-muted">You&apos;ll be able to message each other once they accept.</p>
        </Card>
      )}

      {status !== "pending" && status !== "cancelled" && (
        <>
          <SectionTitle>Where to meet</SectionTitle>
          <Card className="space-y-2.5">
            <p className="flex items-start gap-2 text-sm">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span>
                <strong>{mosque?.meetingPoint ?? "Main entrance"}</strong>, {request.mosqueName}
              </span>
            </p>
            <p className="flex items-start gap-2 text-sm">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span>
                About 10 minutes before {prayerLabel(request.prayer)}, at {formatTime(request.prayerAt - 10 * 60_000, tz)}
              </span>
            </p>
            {mosque && (
              <Link href={`/mosques/${mosque.id}`} className="inline-block text-sm font-semibold text-brand">
                Mosque details and directions
              </Link>
            )}
          </Card>
        </>
      )}

      {status !== "pending" && status !== "cancelled" && <Chat request={request} now={now.getTime()} name={companion?.name ?? "Companion"} readOnly={!open} />}

      {open && status === "accepted" && <Feedback request={request} />}

      {status === "completed" && request.feedback && (
        <Card className="mt-5 bg-brand-soft">
          <p className="font-semibold">You went to the masjid. MashaAllah.</p>
          <p className="mt-1 text-sm text-muted">That counts on your confidence ladder. When you feel ready, try going on your own — or book {companion?.name} again.</p>
          <ButtonLink href="/progress" variant="secondary" className="mt-3">
            See your progress
          </ButtonLink>
        </Card>
      )}

      {open && companion && <Safety request={request} companionName={companion.name} />}
    </div>
  );
}

function Chat({ request, now, name, readOnly }: { request: CompanionRequest; now: number; name: string; readOnly: boolean }) {
  const [text, setText] = useState("");
  const messages = visibleMessages(request, now);
  const typing = request.messages.some((m) => m.from === "companion" && m.at > now && m.at - now < 4000);
  return (
    <>
      <SectionTitle>Messages</SectionTitle>
      <Card>
        <ul className="space-y-2" aria-live="polite">
          {messages.map((m) => (
            <li key={m.id} className={cx("flex", m.from === "me" ? "justify-end" : "justify-start")}>
              <span
                className={cx(
                  "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm",
                  m.from === "me" ? "rounded-br-md bg-brand text-brand-ink" : "rounded-bl-md bg-surface-2",
                )}
              >
                {m.text}
              </span>
            </li>
          ))}
          {typing && <li className="text-xs text-muted">{name} is typing…</li>}
          {messages.length === 0 && !typing && <li className="text-sm text-muted">No messages yet.</li>}
        </ul>
        {!readOnly && (
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!text.trim()) return;
              sendMessage(request.id, text.trim());
              setText("");
            }}
          >
            <label className="flex-1">
              <span className="sr-only">Message {name}</span>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={500}
                placeholder={`Message ${name}`}
                className="min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm"
              />
            </label>
            <Button type="submit" aria-label="Send" className="px-3">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        )}
        <p className="mt-2 text-xs text-muted">Keep chat in the app. Never share your phone number or address.</p>
      </Card>
    </>
  );
}

function Feedback({ request }: { request: CompanionRequest }) {
  const [rating, setRating] = useState<"good" | "okay" | "uncomfortable" | null>(null);
  const [note, setNote] = useState("");
  return (
    <>
      <SectionTitle>After the prayer</SectionTitle>
      <Card>
        <p className="font-semibold">How did it go?</p>
        <p className="mt-0.5 text-sm text-muted">Private — only the Suhba safety team sees this.</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(
            [
              ["good", "Really good"],
              ["okay", "It was okay"],
              ["uncomfortable", "Uncomfortable"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={rating === key}
              onClick={() => setRating(key)}
              className={cx(
                "min-h-11 rounded-xl border px-1 text-[13px]",
                rating === key ? (key === "uncomfortable" ? "border-danger bg-danger-soft text-danger" : "border-brand bg-brand-soft text-brand") : "border-line bg-surface",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {rating === "uncomfortable" && (
          <p className="mt-3 text-sm text-danger">We&apos;re sorry. Tell us what happened below; you can also block this person under Safety.</p>
        )}
        <label className="mt-3 block">
          <span className="sr-only">Anything to add?</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="Anything to add? (optional)"
            className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm"
          />
        </label>
        <Button className="mt-3 w-full" disabled={!rating} onClick={() => rating && completeRequest(request.id, { rating, note })}>
          We met — finish
        </Button>
      </Card>
    </>
  );
}

function Safety({ request, companionName }: { request: CompanionRequest; companionName: string }) {
  const router = useRouter();
  const [contact, setContact] = useState(request.checkInContact ?? "");
  const [confirmBlock, setConfirmBlock] = useState(false);
  return (
    <>
      <SectionTitle>
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4" /> Safety
        </span>
      </SectionTitle>
      <Card className="space-y-4">
        <div className="flex items-start gap-2 text-sm text-muted">
          <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          {companionName} is identity-verified and has completed companion training. You only ever meet at the mosque.
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setCheckIn(request.id, contact.trim() || null);
          }}
        >
          <label className="block text-sm font-medium" htmlFor="checkin">
            Trusted contact for check-in
          </label>
          <p className="text-xs text-muted">We&apos;ll ask you to check in after the prayer. If you don&apos;t, we&apos;ll let them know.</p>
          <div className="mt-2 flex gap-2">
            <input
              id="checkin"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Name or number"
              className="min-h-11 flex-1 rounded-xl border border-line bg-surface px-3 text-sm"
            />
            <Button type="submit" variant="secondary">
              Save
            </Button>
          </div>
          {request.checkInContact && (
            <p className="mt-1.5 text-xs text-brand" role="status">
              Check-in set with {request.checkInContact}.
            </p>
          )}
        </form>
        <div className="flex flex-wrap gap-2 border-t border-line pt-4">
          <Button variant="secondary" onClick={() => cancelRequest(request.id)}>
            Cancel meet-up
          </Button>
          {!confirmBlock ? (
            <Button variant="danger" onClick={() => setConfirmBlock(true)}>
              <Flag className="h-4 w-4" /> Report or block
            </Button>
          ) : (
            <div className="w-full rounded-xl bg-danger-soft p-3 text-sm">
              <p>Block {companionName}? They won&apos;t be shown to you again and this meet-up will be cancelled. Our safety team will review the report.</p>
              <div className="mt-2 flex gap-2">
                <Button
                  variant="danger"
                  onClick={() => {
                    blockCompanion(request.companionId);
                    router.push("/companion");
                  }}
                >
                  Block and report
                </Button>
                <Button variant="secondary" onClick={() => setConfirmBlock(false)}>
                  Keep
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
      <p className="mt-3 text-xs text-muted">
        <Badge>Demo</Badge> Check-ins and reports aren&apos;t sent anywhere yet.
      </p>
    </>
  );
}
