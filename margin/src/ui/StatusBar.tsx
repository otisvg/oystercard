import { useMemo } from 'react';
import { selectedText } from '../editor/bridge';
import { useApp } from '../store';
import { countWords, textStats } from '../text/stats';
import { formatNumber, plural } from './format';
import { useDebounced } from './hooks';

const SAVE_LABELS = { saved: 'Saved', saving: 'Saving…', error: 'Not saved' } as const;

export function StatusBar() {
  const content = useApp((s) => s.content);
  const caret = useApp((s) => s.caret);
  const saveStatus = useApp((s) => s.saveStatus);
  const debounced = useDebounced(content, 200);
  const stats = useMemo(() => textStats(debounced), [debounced]);
  // Recount the selection whenever the caret moves or the text changes.
  const selectedWords = useMemo(() => countWords(selectedText()), [caret, content]);

  return (
    <footer className="statusbar chrome">
      <span className="stat">
        {selectedWords > 0 ? `${formatNumber(selectedWords)} of ${plural(stats.words, 'word')}` : plural(stats.words, 'word')}
      </span>
      <span className="stat hide-narrow">{stats.readingMinutes} min read</span>
      <span className="stat hide-narrow">{plural(stats.characters, 'character')}</span>
      <span className={`save-status is-${saveStatus}`} role={saveStatus === 'error' ? 'alert' : undefined}>
        {SAVE_LABELS[saveStatus]}
      </span>
    </footer>
  );
}
