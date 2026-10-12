import { EditorSelection, type EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import type { Settings } from '../settings';
import { createEditorState, reconfigure, type EditorCallbacks } from './setup';

// The editor lives outside React: React tells it which document to show and
// listens for changes through these callbacks.

let view: EditorView | null = null;
let currentId: string | null = null;
let callbacks: EditorCallbacks = { onChange: () => {}, onSelection: () => {} };

// Keeps undo history and caret position per document while switching between them.
const stateCache = new Map<string, EditorState>();
const MAX_CACHED = 20;

const forwarding: EditorCallbacks = {
  onChange: (content) => callbacks.onChange(content),
  onSelection: (head) => callbacks.onSelection(head),
};

export function setCallbacks(handlers: EditorCallbacks): void {
  callbacks = handlers;
}

export function mountEditor(parent: HTMLElement): EditorView {
  view?.destroy();
  view = new EditorView({ parent });
  return view;
}

export function unmountEditor(): void {
  if (view && currentId) stateCache.set(currentId, view.state);
  view?.destroy();
  view = null;
  currentId = null;
}

export function getView(): EditorView | null {
  return view;
}

/** Show a document. Reuses the cached editor state (and undo history) if the content still matches. */
export function showDocument(id: string, content: string, settings: Settings): void {
  if (!view) return;
  if (currentId) {
    // Re-insert so the map's order tracks recency and the oldest entry is evicted first.
    stateCache.delete(currentId);
    stateCache.set(currentId, view.state);
  }

  const cached = stateCache.get(id);
  const state =
    cached && cached.doc.toString() === content
      ? cached.update({ effects: reconfigure(settings) }).state
      : createEditorState(content, settings, forwarding);

  view.setState(state);
  currentId = id;
  stateCache.delete(id);
  if (stateCache.size > MAX_CACHED) stateCache.delete(stateCache.keys().next().value!);
  callbacks.onSelection(state.selection.main.head);
  view.dispatch({ effects: EditorView.scrollIntoView(state.selection.main.head, { y: 'center' }) });
}

export function forgetDocument(id: string): void {
  stateCache.delete(id);
}

export function applySettings(settings: Settings): void {
  if (!view) return;
  const typewriterTurnedOn = settings.typewriter && !view.dom.classList.contains('cm-typewriter');
  view.dispatch({ effects: reconfigure(settings) });
  if (typewriterTurnedOn) {
    view.dispatch({ effects: EditorView.scrollIntoView(view.state.selection.main.head, { y: 'center' }) });
  }
}

/** Replace the whole document as one undoable change, keeping the caret near where it was. */
export function replaceContent(content: string, userEvent = 'input.replace'): void {
  if (!view) return;
  const head = Math.min(view.state.selection.main.head, content.length);
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: content },
    selection: EditorSelection.cursor(head),
    userEvent,
  });
}

export function focusEditor(): void {
  view?.focus();
}

export function jumpTo(pos: number): void {
  if (!view) return;
  const anchor = Math.min(pos, view.state.doc.length);
  view.dispatch({
    selection: EditorSelection.cursor(anchor),
    effects: EditorView.scrollIntoView(anchor, { y: 'start', yMargin: 80 }),
  });
  view.focus();
}

export function selectedText(): string {
  if (!view) return '';
  const { state } = view;
  return state.selection.ranges.map((r) => state.sliceDoc(r.from, r.to)).join(' ');
}
