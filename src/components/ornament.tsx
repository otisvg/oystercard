const cx = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(" ");

/** Eight-point star (two overlapping squares), the khatam of Islamic geometry. */
export function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cx("h-3 w-3", className)} aria-hidden>
      <path d="M7 7h10v10H7z M12 4.9 19.1 12 12 19.1 4.9 12z" fill="currentColor" fillRule="nonzero" />
    </svg>
  );
}

/** A faint geometric lattice laid over a surface. Purely decorative. */
export function Lattice({ className }: { className?: string }) {
  return <div aria-hidden className={cx("pattern-khatam pointer-events-none absolute inset-0", className)} />;
}

/** A gold hairline with a star at its centre, like an inlaid border. */
export function Divider({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cx("flex items-center gap-3 text-gold", className)}>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/50" />
      <Star />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/50" />
    </div>
  );
}

/** The mark: a pointed arch with a star inside it. */
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cx("h-8 w-8", className)} aria-hidden>
      <path d="M6 29V15.5C6 9.5 11 5.6 16 3c5 2.6 10 6.5 10 12.5V29Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M13.2 14.2h5.6v5.6h-5.6z M16 12.2 19.8 17 16 21.8 12.2 17z" fill="currentColor" />
    </svg>
  );
}
