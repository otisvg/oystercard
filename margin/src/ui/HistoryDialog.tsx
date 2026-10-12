import { diffLines, diffWords, type Change } from 'diff';
import { useEffect, useMemo, useState } from 'react';
import * as actions from '../actions';
import type { VersionRecord } from '../storage/db';
import { listVersions } from '../storage/repository';
import { useApp } from '../store';
import { Dialog } from './Dialog';
import { formatDateTime, formatNumber, plural, timeAgo } from './format';

// Word diffs get slow on very long documents; fall back to whole lines.
const WORD_DIFF_LIMIT = 120_000;

const KIND_LABELS = { auto: 'Auto', manual: 'Saved', restore: 'Before restore' } as const;

function DiffView({ from, to }: { from: string; to: string }) {
  const changes = useMemo<Change[]>(
    () => (from.length + to.length > WORD_DIFF_LIMIT ? diffLines(from, to) : diffWords(from, to)),
    [from, to],
  );
  const changed = changes.some((c) => c.added || c.removed);

  if (!changed) return <p className="diff-empty">This version is the same as your current text.</p>;

  return (
    <div className="diff" aria-label="Changes from this version to your current text">
      {changes.map((change, index) =>
        change.added ? (
          <ins key={index}>{change.value}</ins>
        ) : change.removed ? (
          <del key={index}>{change.value}</del>
        ) : (
          <span key={index}>{change.value}</span>
        ),
      )}
    </div>
  );
}

function wordDelta(version: VersionRecord, previous: VersionRecord | undefined) {
  if (!previous) return null;
  const delta = version.words - previous.words;
  if (delta === 0) return null;
  return <span className={delta > 0 ? 'delta-up' : 'delta-down'}>{delta > 0 ? '+' : '−'}{formatNumber(Math.abs(delta))}</span>;
}

export default function HistoryDialog() {
  const currentId = useApp((s) => s.currentId);
  const content = useApp((s) => s.content);
  const [versions, setVersions] = useState<VersionRecord[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const reload = async () => {
    if (!currentId) return;
    await actions.flushSave();
    const list = await listVersions(currentId);
    setVersions(list);
    setSelectedId((id) => (list.some((v) => v.id === id) ? id : list[0]?.id ?? null));
  };

  useEffect(() => {
    void reload();
    // Reload only when switching documents; saving a version reloads explicitly.
  }, [currentId]);

  const selected = versions?.find((v) => v.id === selectedId);

  return (
    <Dialog open title="Version history" onClose={actions.closeDialog} className="history-dialog">
      {versions === null ? (
        <p className="hint">Loading…</p>
      ) : versions.length === 0 ? (
        <div className="history-empty">
          <p>No versions yet. Margin saves one every ten minutes while you write, and when you switch documents.</p>
          <button type="button" className="button primary" onClick={() => void actions.saveVersion().then(reload)}>
            Save a version now
          </button>
        </div>
      ) : (
        <div className="history-layout">
          <ol className="version-list" aria-label="Versions, newest first">
            {versions.map((version, index) => (
              <li key={version.id}>
                <button
                  type="button"
                  className={`version-item ${version.id === selectedId ? 'is-selected' : ''}`}
                  aria-pressed={version.id === selectedId}
                  onClick={() => setSelectedId(version.id)}
                >
                  <span className="version-time" title={formatDateTime(version.createdAt)}>
                    {timeAgo(version.createdAt)}
                  </span>
                  <span className="version-meta">
                    <span className={`badge kind-${version.kind}`}>{KIND_LABELS[version.kind]}</span>
                    {plural(version.words, 'word')} {wordDelta(version, versions[index + 1])}
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <div className="version-detail">
            {selected && (
              <>
                <div className="version-toolbar">
                  <p className="hint">
                    {formatDateTime(selected.createdAt)}. <ins>Added</ins> and <del>removed</del> text shows what has
                    changed since this version.
                  </p>
                  <div className="button-row">
                    <button type="button" className="button" onClick={() => void actions.saveVersion().then(reload)}>
                      Save current as version
                    </button>
                    <button
                      type="button"
                      className="button primary"
                      disabled={selected.content === content}
                      onClick={() => void actions.restoreVersion(selected)}
                    >
                      Restore this version
                    </button>
                  </div>
                </div>
                <DiffView from={selected.content} to={content} />
              </>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
}
