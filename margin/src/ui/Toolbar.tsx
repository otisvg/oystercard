import * as actions from '../actions';
import { formatShortcut, SHORTCUTS } from '../shortcuts';
import { useApp } from '../store';
import { deriveTitle } from '../text/title';
import { DataActions } from './DataActions';
import { HighlightOptions } from './HighlightOptions';
import { IconButton } from './IconButton';
import { Menu } from './Menu';

const keys = (label: string) => {
  const shortcut = SHORTCUTS.find((s) => s.label === label);
  return shortcut && formatShortcut(shortcut);
};

type Exporter = typeof import('../export/files');

/** Export the open document. The export code (and Markdown renderer) loads on first use. */
function exportCurrent(run: (files: Exporter, title: string, content: string) => void) {
  // Derive the title from the live text: the saved title lags behind typing.
  const { content } = useApp.getState();
  void import('../export/files').then((files) => run(files, deriveTitle(content), content));
}

export function Toolbar() {
  const sidebar = useApp((s) => s.sidebar);
  const preview = useApp((s) => s.preview);
  const settings = useApp((s) => s.settings);
  const title = useApp((s) => s.docs.find((d) => d.id === s.currentId)?.title ?? '');

  return (
    <header className="toolbar chrome">
      <div className="toolbar-group">
        <IconButton
          icon="sidebar"
          label="Library"
          shortcut={keys('Library')}
          pressed={sidebar === 'docs'}
          onClick={() => actions.toggleSidebar('docs')}
        />
        <IconButton
          icon="outline"
          label="Outline"
          shortcut={keys('Outline')}
          pressed={sidebar === 'outline'}
          onClick={() => actions.toggleSidebar('outline')}
        />
        <IconButton icon="plus" label="New document" shortcut={keys('New document')} onClick={() => void actions.newDoc()} />
      </div>

      <div className="toolbar-title">{title}</div>

      <div className="toolbar-group">
        <IconButton
          icon="focus"
          label="Focus mode"
          shortcut={keys('Focus mode')}
          pressed={settings.focusEnabled}
          onClick={actions.toggleFocusMode}
        />
        <IconButton
          icon="typewriter"
          label="Typewriter scrolling"
          shortcut={keys('Typewriter scrolling')}
          pressed={settings.typewriter}
          onClick={actions.toggleTypewriter}
          className="hide-narrow"
        />
        <Menu icon="highlight" label="Highlighting" active={settings.syntaxEnabled || settings.styleEnabled}>
          {() => <HighlightOptions />}
        </Menu>
        <IconButton
          icon="split"
          label="Preview"
          shortcut={keys('Preview beside editor')}
          pressed={preview === 'split'}
          onClick={() => actions.togglePreview('split')}
          className="hide-narrow"
        />
        <IconButton
          icon="read"
          label="Reading view"
          shortcut={keys('Reading view')}
          pressed={preview === 'full'}
          onClick={() => actions.togglePreview('full')}
        />
        <IconButton
          icon="history"
          label="Version history"
          shortcut={keys('Version history')}
          onClick={() => actions.openDialog('history')}
        />
        <Menu icon="export" label="Export" className="menu">
          {(close) => (
            <div className="menu-list">
              <p className="menu-heading">This document</p>
              <button
                type="button"
                className="menu-item"
                onClick={() => {
                  close();
                  exportCurrent((files, title, content) => files.exportMarkdown(title, content));
                }}
              >
                Markdown (.md)
              </button>
              <button
                type="button"
                className="menu-item"
                onClick={() => {
                  close();
                  exportCurrent((files, title, content) => files.exportHtml(title, content));
                }}
              >
                Web page (.html)
              </button>
              <button
                type="button"
                className="menu-item"
                onClick={() => {
                  close();
                  exportCurrent((files, title, content) => files.printDocument(title, content));
                }}
              >
                Print or save as PDF…
              </button>
              <p className="menu-heading">Library</p>
              <DataActions asMenu onDone={close} />
            </div>
          )}
        </Menu>
        <IconButton
          icon="settings"
          label="Settings"
          shortcut={keys('Settings')}
          onClick={() => actions.openDialog('settings')}
        />
      </div>
    </header>
  );
}
