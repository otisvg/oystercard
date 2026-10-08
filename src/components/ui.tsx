import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Star } from "./ornament";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function Card({ className, children, ...rest }: ComponentProps<"div">) {
  return (
    <div className={cx("rounded-[1.25rem] border border-line/80 bg-surface p-4 sm:p-5", className)} {...rest}>
      {children}
    </div>
  );
}

const buttonBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const variants = {
  primary: "bg-brand text-brand-ink hover:opacity-90",
  secondary: "border border-line bg-surface text-ink hover:bg-surface-2",
  ghost: "text-brand hover:bg-brand-soft",
  danger: "border border-danger/40 text-danger hover:bg-danger-soft",
};
type Variant = keyof typeof variants;

export function Button({ variant = "primary", className, ...rest }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button type="button" className={cx(buttonBase, variants[variant], className)} {...rest} />;
}

export function ButtonLink({ variant = "primary", className, ...rest }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cx(buttonBase, variants[variant], className)} {...rest} />;
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "brand" | "gold" | "danger"; children: ReactNode }) {
  const tones = {
    neutral: "bg-surface-2 text-muted",
    brand: "bg-brand-soft text-brand",
    gold: "bg-gold-soft text-gold",
    danger: "bg-danger-soft text-danger",
  };
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone])}>{children}</span>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-[2.1rem] font-semibold leading-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 mt-9 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        <Star className="h-2.5 w-2.5 text-gold" />
        {children}
      </h2>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-[1.25rem] bg-surface-2", className)} aria-hidden />;
}

export function LoadingPage() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-9 w-44" />
      <Skeleton className="arch mx-auto h-72 w-full max-w-sm" />
      <Skeleton className="h-24" />
    </div>
  );
}

export function Notice({ tone = "gold", children }: { tone?: "gold" | "brand"; children: ReactNode }) {
  return (
    <div
      className={cx(
        "rounded-2xl border px-4 py-3 text-sm",
        tone === "gold" ? "border-gold/25 bg-gold-soft text-ink" : "border-brand/20 bg-brand-soft text-ink",
      )}
    >
      {children}
    </div>
  );
}
