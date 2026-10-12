import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
// Use the Markdown language directly: `markdown()` also bundles HTML, CSS and JavaScript support.
import { markdownKeymap, markdownLanguage } from '@codemirror/lang-markdown';
import { LanguageSupport } from '@codemirror/language';
import { search, searchKeymap } from '@codemirror/search';
import { Compartment, EditorState, Prec, type Extension, type StateEffect } from '@codemirror/state';
import { drawSelection, dropCursor, EditorView, keymap, placeholder } from '@codemirror/view';
import type { Settings } from '../settings';
import { focusMode } from './focus';
import { insertLink, toggleWrap } from './formatting';
import { markdownStyle } from './markdownStyle';
import { partsOfSpeech } from './partsOfSpeech';
import { styleCheck } from './styleCheck';
import { typewriterScrolling } from './typewriter';

/** Parts of the editor that change with settings, keyed so they can be reconfigured live. */
const configurable = {
  focus: (s: Settings) => (s.focusEnabled ? focusMode(s.focusMode) : []),
  typewriter: (s: Settings) => (s.typewriter ? typewriterScrolling() : []),
  syntax: (s: Settings) => (s.syntaxEnabled ? partsOfSpeech(s.syntax) : []),
  style: (s: Settings) => (s.styleEnabled ? styleCheck(s.style) : []),
  spellcheck: (s: Settings) =>
    EditorView.contentAttributes.of({
      spellcheck: String(s.spellcheck),
      autocorrect: s.spellcheck ? 'on' : 'off',
      autocapitalize: 'sentences',
    }),
};

type Key = keyof typeof configurable;
const compartments = Object.fromEntries(
  Object.keys(configurable).map((key) => [key, new Compartment()]),
) as Record<Key, Compartment>;

function configuredExtensions(settings: Settings): Extension[] {
  return (Object.keys(configurable) as Key[]).map((key) => compartments[key].of(configurable[key](settings)));
}

export function reconfigure(settings: Settings): StateEffect<unknown>[] {
  return (Object.keys(configurable) as Key[]).map((key) => compartments[key].reconfigure(configurable[key](settings)));
}

// Selection and caret colours have to beat CodeMirror's base theme, so they live in an editor theme.
const editorTheme = EditorView.theme({
  '.cm-cursor, .cm-dropCursor': { borderLeft: '2px solid var(--accent)' },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, ::selection':
    { background: 'var(--selection)' },
  '.cm-selectionBackground': { background: 'var(--selection-blur)' },
  '.cm-placeholder': { color: 'var(--syntax)' },
});

const formattingKeymap = keymap.of([
  { key: 'Mod-b', run: toggleWrap('**') },
  { key: 'Mod-i', run: toggleWrap('*') },
  { key: 'Mod-k', run: insertLink },
]);

export interface EditorCallbacks {
  onChange: (content: string) => void;
  onSelection: (head: number) => void;
}

export function createEditorState(content: string, settings: Settings, callbacks: EditorCallbacks): EditorState {
  return EditorState.create({
    doc: content,
    extensions: [
      history(),
      drawSelection(),
      dropCursor(),
      EditorView.lineWrapping,
      new LanguageSupport(markdownLanguage),
      markdownStyle(),
      editorTheme,
      search({ top: true }),
      placeholder('Start writing…'),
      Prec.high(formattingKeymap),
      keymap.of([...markdownKeymap, ...defaultKeymap, ...historyKeymap, ...searchKeymap, indentWithTab]),
      EditorView.contentAttributes.of({ 'aria-label': 'Document text' }),
      configuredExtensions(settings),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) callbacks.onChange(update.state.doc.toString());
        if (update.selectionSet) callbacks.onSelection(update.state.selection.main.head);
      }),
    ],
  });
}
