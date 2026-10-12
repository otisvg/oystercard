import { RangeSetBuilder, StateField, type EditorState, type Extension } from '@codemirror/state';
import { Decoration, EditorView, type DecorationSet } from '@codemirror/view';
import type { FocusMode } from '../settings';
import { paragraphAt, sentenceInDoc } from '../text/sentences';

const dimmed = Decoration.mark({ class: 'cm-dimmed' });

function focusDecorations(state: EditorState, mode: FocusMode): DecorationSet {
  const rangeAt = mode === 'sentence' ? sentenceInDoc : paragraphAt;
  const { main } = state.selection;
  const start = rangeAt(state.doc, main.from);
  const end = main.empty ? start : rangeAt(state.doc, main.to);
  const from = Math.min(start.from, end.from);
  const to = Math.max(start.to, end.to);

  const builder = new RangeSetBuilder<Decoration>();
  if (from > 0) builder.add(0, from, dimmed);
  if (to < state.doc.length) builder.add(to, state.doc.length, dimmed);
  return builder.finish();
}

/** Dims everything except the sentence or paragraph being written. */
export function focusMode(mode: FocusMode): Extension {
  return [
    StateField.define<DecorationSet>({
      create: (state) => focusDecorations(state, mode),
      update: (value, tr) => (tr.docChanged || tr.selection ? focusDecorations(tr.state, mode) : value),
      provide: (field) => EditorView.decorations.from(field),
    }),
    EditorView.editorAttributes.of({ class: 'cm-focus-mode' }),
  ];
}
