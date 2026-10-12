import { useMemo } from 'react';
import * as actions from '../actions';
import { jumpTo } from '../editor/bridge';
import { useApp, type SidebarPanel } from '../store';
import { activeHeadingIndex, extractOutline } from '../text/outline';
import { plural, timeAgo } from './format';
import { useDebounced } from './hooks';
import { Icon } from './Icon';

// On narrow screens the sidebar covers the editor, so it closes after you pick something.
const closeIfOverlay = () => {
  if (window.matchMedia('(max-width: 760px)').matches) useApp.setState({ sidebar: 'none' });
};

function DocList() {
  const docs = useApp((s) => s.docs);
  const currentId = useApp((s) => s.currentId);

  return (
    <div className="doc-list">
      <button type="button" className="new-doc" onClick={() => { closeIfOverlay(); void actions.newDoc(); }}>
        <Icon name="plus" size={16} /> New document
      </button>
      <ul>
        {docs.map((doc) => (
          <li key={doc.id} className={doc.id === currentId ? 'is-current' : ''}>
            <button
              type="button"
              className="doc-item"
              aria-current={doc.id === currentId ? 'page' : undefined}
              onClick={() => {
                closeIfOverlay();
                void actions.openDoc(doc.id);
              }}
            >
              <span className="doc-title">{doc.title}</span>
              <span className="doc-meta">
                {timeAgo(doc.updatedAt)} · {plural(doc.words, 'word')}
              </span>
            </button>
            <button
              type="button"
              className="icon-button doc-delete"
              aria-label={`Delete “${doc.title}”`}
              title="Delete"
              onClick={() => void actions.deleteDocument(doc.id)}
            >
              <Icon name="trash" size={16} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Outline() {
  const content = useApp((s) => s.content);
  const caret = useApp((s) => s.caret);
  const debounced = useDebounced(content, 250);
  const headings = useMemo(() => extractOutline(debounced), [debounced]);
  const active = activeHeadingIndex(headings, caret);

  if (headings.length === 0) {
    return <p className="sidebar-empty">Start a line with # to add a heading. Headings show up here.</p>;
  }

  return (
    <nav aria-label="Outline">
      <ul className="outline">
        {headings.map((heading, index) => (
          <li key={`${heading.from}-${heading.text}`} style={{ paddingLeft: `${(heading.level - 1) * 0.9}rem` }}>
            <button
              type="button"
              className={`outline-item ${index === active ? 'is-active' : ''}`}
              aria-current={index === active ? 'location' : undefined}
              onClick={() => {
                closeIfOverlay();
                jumpTo(heading.from);
              }}
            >
              {heading.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Sidebar({ panel }: { panel: Exclude<SidebarPanel, 'none'> }) {
  return (
    <>
      <aside className="sidebar chrome" aria-label="Sidebar">
        <div className="sidebar-tabs" role="group" aria-label="Sidebar view">
          <button type="button" aria-pressed={panel === 'docs'} onClick={() => useApp.setState({ sidebar: 'docs' })}>
            Library
          </button>
          <button type="button" aria-pressed={panel === 'outline'} onClick={() => useApp.setState({ sidebar: 'outline' })}>
            Outline
          </button>
        </div>
        <div className="sidebar-content">
          {panel === 'docs' ? <DocList /> : <Outline />}
        </div>
      </aside>
      <div className="sidebar-backdrop" aria-hidden="true" onClick={() => useApp.setState({ sidebar: 'none' })} />
    </>
  );
}
