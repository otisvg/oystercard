import { describe, expect, it } from 'vitest';
import { AUTO_SNAPSHOT_INTERVAL, shouldAutoSnapshot, versionsToPrune, type VersionStamp } from './policy';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const NOW = 1_000 * DAY;

describe('shouldAutoSnapshot', () => {
  it('snapshots when there is no history yet', () => {
    expect(shouldAutoSnapshot(undefined, 'x', NOW)).toBe(true);
  });

  it('waits for the interval and for the content to change', () => {
    const latest = { createdAt: NOW - AUTO_SNAPSHOT_INTERVAL, content: 'a' };
    expect(shouldAutoSnapshot(latest, 'b', NOW)).toBe(true);
    expect(shouldAutoSnapshot(latest, 'a', NOW)).toBe(false);
    expect(shouldAutoSnapshot({ ...latest, createdAt: NOW - 1000 }, 'b', NOW)).toBe(false);
  });
});

describe('versionsToPrune', () => {
  const v = (id: string, age: number, kind: VersionStamp['kind'] = 'auto'): VersionStamp => ({
    id, createdAt: NOW - age, kind,
  });

  it('keeps everything from the last day', () => {
    expect(versionsToPrune([v('a', 1000), v('b', 2000), v('c', 23 * HOUR)], NOW)).toEqual([]);
  });

  it('thins to one per hour within a month, keeping the newest in each hour', () => {
    const base = Math.floor((NOW - 2 * DAY) / HOUR) * HOUR;
    const versions = [
      { id: 'late', createdAt: base + 50 * 60_000, kind: 'auto' as const },
      { id: 'early', createdAt: base + 10 * 60_000, kind: 'auto' as const },
      v('recent', 1000),
    ];
    expect(versionsToPrune(versions, NOW)).toEqual(['early']);
  });

  it('thins to one per day after a month', () => {
    const base = Math.floor((NOW - 40 * DAY) / DAY) * DAY;
    const versions = [
      { id: 'evening', createdAt: base + 20 * HOUR, kind: 'auto' as const },
      { id: 'morning', createdAt: base + 8 * HOUR, kind: 'auto' as const },
      v('recent', 1000),
    ];
    expect(versionsToPrune(versions, NOW)).toEqual(['morning']);
  });

  it('never prunes manual saves or the newest version for thinning', () => {
    const base = Math.floor((NOW - 2 * DAY) / HOUR) * HOUR;
    const versions = [
      { id: 'm1', createdAt: base + 50 * 60_000, kind: 'manual' as const },
      { id: 'm2', createdAt: base + 10 * 60_000, kind: 'manual' as const },
    ];
    expect(versionsToPrune(versions, NOW)).toEqual([]);
  });

  it('enforces the cap by dropping the oldest automatic versions first', () => {
    const versions = [v('new', 1), v('manual-old', 5000, 'manual'), v('auto-old', 4000), v('auto-mid', 3000)];
    expect(versionsToPrune(versions, NOW, 2)).toEqual(['auto-old', 'auto-mid']);
  });
});
