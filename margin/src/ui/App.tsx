import { lazy, Suspense, useEffect } from 'react';
import * as actions from '../actions';
import { matchShortcut } from '../shortcuts';
import { useApp } from '../store';
import { EditorPane } from './EditorPane';
import { SettingsDialog } from './SettingsDialog';
import { ShortcutsDialog } from './ShortcutsDialog';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';
import { Toasts } from './Toasts';
import { Toolbar } from './Toolbar';

// Loaded on demand to keep startup fast: the preview pulls in the Markdown renderer.
const HistoryDialog = lazy(() => import('./HistoryDialog'));
const PreviewPane = lazy(() => import('./PreviewPane'));

function useAppearance() {
  const { theme, font, fontSize, lineWidth } = useApp((s) => s.settings);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.font = font;
    root.dataset.width = lineWidth;
    root.style.setProperty('--editor-size', `${fontSize}px`);

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      root.dataset.scheme = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
      // Match the browser/OS window chrome to the page background.
      const background = getComputedStyle(root).getPropertyValue('--bg').trim();
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', background);
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme, font, fontSize, lineWidth]);
}

function useKeyboardShortcuts() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const shortcut = matchShortcut(event);
      if (!shortcut) return;
      event.preventDefault();
      event.stopPropagation();
      // Whatever the shortcut opens should be visible, even mid-sentence.
      actions.setTyping(false);
      shortcut.run();
    };
    // Capture phase, so app shortcuts win over the editor's own key bindings.
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, []);
}

/** Fade the interface out while typing in the editor; bring it back when the mouse moves. */
function useTypingFade() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const inEditor = (event.target as Element | null)?.closest?.('.cm-editor');
      const typed = event.key.length === 1 || event.key === 'Enter' || event.key === 'Backspace';
      if (inEditor && typed && !event.metaKey && !event.ctrlKey && !event.altKey) actions.setTyping(true);
    };
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || Math.abs(event.movementX) + Math.abs(event.movementY) > 3) {
        actions.setTyping(false);
      }
    };
    const onFocusIn = (event: FocusEvent) => {
      if (!(event.target as Element).closest?.('.cm-editor')) actions.setTyping(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointermove', onPointer);
    window.addEventListener('pointerdown', onPointer);
    window.addEventListener('focusin', onFocusIn);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('focusin', onFocusIn);
    };
  }, []);
}

export function App() {
  const sidebar = useApp((s) => s.sidebar);
  const preview = useApp((s) => s.preview);
  const dialog = useApp((s) => s.dialog);
  const typing = useApp((s) => s.typing);

  useAppearance();
  useKeyboardShortcuts();
  useTypingFade();

  useEffect(() => {
    void actions.init();
  }, []);

  return (
    <div className={`app ${typing ? 'is-typing' : ''}`} data-sidebar={sidebar} data-preview={preview}>
      {sidebar !== 'none' && <Sidebar panel={sidebar} />}
      <main className="main">
        <Toolbar />
        <div className="workspace">
          <EditorPane hidden={preview === 'full'} />
          {preview !== 'off' && (
            <Suspense fallback={null}>
              <PreviewPane mode={preview} />
            </Suspense>
          )}
        </div>
        <StatusBar />
      </main>
      <SettingsDialog open={dialog === 'settings'} />
      <ShortcutsDialog open={dialog === 'shortcuts'} />
      {dialog === 'history' && (
        <Suspense fallback={null}>
          <HistoryDialog />
        </Suspense>
      )}
      <Toasts />
    </div>
  );
}
