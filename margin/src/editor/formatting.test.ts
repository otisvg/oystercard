import { EditorSelection, EditorState, type StateCommand } from '@codemirror/state';
import { describe, expect, it } from 'vitest';
import { insertLink, toggleWrap } from './formatting';

function run(command: StateCommand, doc: string, from: number, to = from) {
  let state = EditorState.create({ doc, selection: EditorSelection.single(from, to) });
  command({ state, dispatch: (tr) => (state = tr.state) });
  const { main } = state.selection;
  return { doc: state.doc.toString(), from: main.from, to: main.to };
}

describe('toggleWrap', () => {
  it('wraps the selection and keeps it selected', () => {
    expect(run(toggleWrap('**'), 'a word here', 2, 6)).toEqual({ doc: 'a **word** here', from: 4, to: 8 });
  });

  it('unwraps an already wrapped selection', () => {
    expect(run(toggleWrap('**'), 'a **word** here', 4, 8)).toEqual({ doc: 'a word here', from: 2, to: 6 });
  });

  it('inserts an empty pair with the caret inside when nothing is selected', () => {
    expect(run(toggleWrap('*'), 'ab', 1)).toEqual({ doc: 'a**b', from: 2, to: 2 });
  });
});

describe('insertLink', () => {
  it('uses the selection as link text and puts the caret in the URL', () => {
    expect(run(insertLink, 'see docs', 4, 8)).toEqual({ doc: 'see [docs]()', from: 11, to: 11 });
  });

  it('puts the caret in the brackets when nothing is selected', () => {
    expect(run(insertLink, '', 0)).toEqual({ doc: '[]()', from: 1, to: 1 });
  });
});
