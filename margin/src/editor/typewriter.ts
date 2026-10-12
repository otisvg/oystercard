import { EditorState, type Extension, type Transaction } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

// Pointer selections are left alone so the text doesn't jump away from the mouse.
function movesCaretByKeyboard(tr: Transaction): boolean {
  return (
    tr.isUserEvent('input') ||
    tr.isUserEvent('delete') ||
    tr.isUserEvent('undo') ||
    tr.isUserEvent('redo') ||
    (tr.isUserEvent('select') && !tr.isUserEvent('select.pointer'))
  );
}

/** Keeps the line being written vertically centred, like a typewriter. */
export function typewriterScrolling(): Extension {
  return [
    EditorView.editorAttributes.of({ class: 'cm-typewriter' }),
    EditorState.transactionExtender.of((tr) =>
      movesCaretByKeyboard(tr)
        ? { effects: EditorView.scrollIntoView(tr.newSelection.main.head, { y: 'center' }) }
        : null,
    ),
  ];
}
