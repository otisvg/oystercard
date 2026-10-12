import { EditorSelection, type StateCommand } from '@codemirror/state';

/** Wrap each selection in `marker`, or unwrap it if it's already wrapped. */
export function toggleWrap(marker: string): StateCommand {
  return ({ state, dispatch }) => {
    const size = marker.length;
    const changes = state.changeByRange((range) => {
      const before = state.sliceDoc(range.from - size, range.from);
      const after = state.sliceDoc(range.to, range.to + size);
      if (before === marker && after === marker) {
        return {
          changes: [
            { from: range.from - size, to: range.from },
            { from: range.to, to: range.to + size },
          ],
          range: EditorSelection.range(range.from - size, range.to - size),
        };
      }
      return {
        changes: [
          { from: range.from, insert: marker },
          { from: range.to, insert: marker },
        ],
        range: EditorSelection.range(range.from + size, range.to + size),
      };
    });
    dispatch(state.update(changes, { scrollIntoView: true, userEvent: 'input.format' }));
    return true;
  };
}

/** Turn the selection into a Markdown link and put the caret where the URL goes. */
export const insertLink: StateCommand = ({ state, dispatch }) => {
  const changes = state.changeByRange((range) => {
    const text = state.sliceDoc(range.from, range.to);
    const insert = `[${text}]()`;
    // With no text selected, the caret goes between the brackets; otherwise between the parentheses.
    const caret = range.from + (text ? insert.length - 1 : 1);
    return { changes: { from: range.from, to: range.to, insert }, range: EditorSelection.cursor(caret) };
  });
  dispatch(state.update(changes, { scrollIntoView: true, userEvent: 'input.format' }));
  return true;
};
