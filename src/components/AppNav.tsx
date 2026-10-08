"use client";

import { BookOpen, CircleUser, Clock, Home, Sprout, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mark, Star } from "./ornament";
import { cx } from "./ui";

const TABS = [
  { href: "/", label: "Today", icon: Home },
  { href: "/prayer", label: "Prayer", icon: Clock },
  { href: "/companion", label: "Companion", icon: Users },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/progress", label: "Progress", icon: Sprout },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`) || (href === "/prayer" && pathname.startsWith("/mosques"));
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-brand">
      <Mark className="h-7 w-7" />
      <span className="font-display text-2xl font-semibold text-ink">Suhba</span>
      <span lang="ar" className="font-arabic text-lg text-gold">
        صحبة
      </span>
    </Link>
  );
}

export function NavFallback() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-2xl items-center px-4">
        <Logo />
      </div>
    </header>
  );
}

export function AppNav() {
  const pathname = usePathname();
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-4 px-4">
          <Logo />
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {TABS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                aria-current={isActive(pathname, t.href) ? "page" : undefined}
                className={cx(
                  "rounded-full px-3.5 py-1.5 text-sm font-medium",
                  isActive(pathname, t.href) ? "bg-brand-soft text-brand" : "text-muted hover:text-ink",
                )}
              >
                {t.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/profile"
            aria-label="Profile and safety"
            aria-current={pathname === "/profile" ? "page" : undefined}
            className={cx("grid h-10 w-10 place-items-center rounded-full", pathname === "/profile" ? "bg-brand-soft text-brand" : "text-muted hover:text-ink")}
          >
            <CircleUser className="h-6 w-6" />
          </Link>
        </div>
      </header>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="mx-auto flex max-w-2xl">
          {TABS.map((t) => {
            const active = isActive(pathname, t.href);
            const Icon = t.icon;
            return (
              <li key={t.href} className="flex-1">
                <Link
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={cx("relative flex flex-col items-center gap-0.5 pb-2 pt-2.5 text-[11px] font-medium", active ? "text-brand" : "text-muted")}
                >
                  {active && <Star className="absolute top-0.5 h-2 w-2 text-gold" />}
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
