export type VersionKind = 'auto' | 'manual' | 'restore';

export interface VersionStamp {
  id: string;
  createdAt: number;
  kind: VersionKind;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** How often an automatic snapshot is taken while you keep writing. */
export const AUTO_SNAPSHOT_INTERVAL = 10 * MINUTE;
export const MAX_VERSIONS_PER_DOC = 300;

export function shouldAutoSnapshot(
  latest: { createdAt: number; content: string } | undefined,
  content: string,
  now: number,
): boolean {
  if (!latest) return true;
  return latest.content !== content && now - latest.createdAt >= AUTO_SNAPSHOT_INTERVAL;
}

/**
 * Which versions to delete so history stays useful without growing forever:
 * manual saves are always kept; automatic ones are kept in full for a day,
 * then thinned to one per hour for a month, then one per day.
 */
export function versionsToPrune(
  versions: VersionStamp[],
  now: number,
  max = MAX_VERSIONS_PER_DOC,
): string[] {
  const newestFirst = [...versions].sort((a, b) => b.createdAt - a.createdAt);
  const keep: VersionStamp[] = [];
  const prune: string[] = [];
  const seenBuckets = new Set<string>();

  newestFirst.forEach((version, index) => {
    const age = now - version.createdAt;
    if (index === 0 || version.kind === 'manual' || age < DAY) {
      keep.push(version);
      return;
    }
    const bucket = age < 30 * DAY
      ? `h${Math.floor(version.createdAt / HOUR)}`
      : `d${Math.floor(version.createdAt / DAY)}`;
    if (seenBuckets.has(bucket)) {
      prune.push(version.id);
    } else {
      seenBuckets.add(bucket);
      keep.push(version);
    }
  });

  // Over the cap: drop the oldest automatic versions first, then the oldest of anything.
  let excess = keep.length - max;
  for (const kind of ['auto', 'restore', 'manual'] as const) {
    for (let i = keep.length - 1; i > 0 && excess > 0; i--) {
      if (keep[i].kind !== kind) continue;
      prune.push(keep[i].id);
      keep.splice(i, 1);
      excess--;
    }
  }
  return prune;
}
