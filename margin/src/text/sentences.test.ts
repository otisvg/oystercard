import { Text } from '@codemirror/state';
import { describe, expect, it } from 'vitest';
import { paragraphAt, sentenceAt, sentenceInDoc, sentenceRanges } from './sentences';

const doc = (s: string) => Text.of(s.split('\n'));
const slice = (s: string, r: { from: number; to: number }) => s.slice(r.from, r.to);

describe('paragraphAt', () => {
  const source = 'First line\nsecond line\n\nNext para\n# Heading\nAfter heading\n- item one\n- item two\nwrapped';

  it('spans consecutive non-blank lines', () => {
    expect(slice(source, paragraphAt(doc(source), 3))).toBe('First line\nsecond line');
  });

  it('treats headings as their own block', () => {
    const pos = source.indexOf('Heading');
    expect(slice(source, paragraphAt(doc(source), pos))).toBe('# Heading');
    expect(slice(source, paragraphAt(doc(source), source.indexOf('After')))).toBe('After heading');
    expect(slice(source, paragraphAt(doc(source), source.indexOf('Next')))).toBe('Next para');
  });

  it('treats each list item as its own block, including wrapped lines', () => {
    expect(slice(source, paragraphAt(doc(source), source.indexOf('one')))).toBe('- item one');
    expect(slice(source, paragraphAt(doc(source), source.indexOf('wrapped')))).toBe('- item two\nwrapped');
  });

  it('returns the line itself on a blank line', () => {
    const r = paragraphAt(doc(source), source.indexOf('\n\n') + 1);
    expect(r.from).toBe(r.to);
  });
});

describe('sentenceRanges', () => {
  it('splits on terminal punctuation', () => {
    const text = 'One fish. Two fish! Red fish? Blue fish';
    expect(sentenceRanges(text).map((r) => slice(text, r))).toEqual([
      'One fish.', 'Two fish!', 'Red fish?', 'Blue fish',
    ]);
  });

  it('keeps closing quotes and emphasis with the sentence', () => {
    const text = '“Stop.” She *left.* Then (quietly.) gone';
    expect(sentenceRanges(text).map((r) => slice(text, r))).toEqual([
      '“Stop.”', 'She *left.*', 'Then (quietly.)', 'gone',
    ]);
  });

  it('does not split after abbreviations or initials', () => {
    const text = 'Mr. Smith met J. R. R. Tolkien, e.g. at noon. Then left.';
    expect(sentenceRanges(text).map((r) => slice(text, r))).toEqual([
      'Mr. Smith met J. R. R. Tolkien, e.g. at noon.', 'Then left.',
    ]);
  });

  it('splits after the pronoun I', () => {
    const text = 'It was I. Then';
    expect(sentenceRanges(text)).toHaveLength(2);
  });

  it('does not split decimals or ellipses mid-word', () => {
    const text = 'Pi is 3.14 roughly… and so on.';
    expect(sentenceRanges(text).map((r) => slice(text, r))).toEqual(['Pi is 3.14 roughly…', 'and so on.']);
  });
});

describe('sentenceAt', () => {
  const text = 'Hello there. General Kenobi.';

  it('finds the sentence around the caret', () => {
    expect(slice(text, sentenceAt(text, 3))).toBe('Hello there.');
    expect(slice(text, sentenceAt(text, 20))).toBe('General Kenobi.');
  });

  it('keeps the sentence just finished when the caret is right after it', () => {
    expect(slice(text, sentenceAt(text, 12))).toBe('Hello there.');
  });

  it('moves to the next sentence once past the space', () => {
    expect(slice(text, sentenceAt(text, 13))).toBe('General Kenobi.');
  });

  it('stays on the last sentence when typing trailing whitespace', () => {
    expect(slice('Done. ', sentenceAt('Done. ', 6))).toBe('Done.');
  });
});

describe('sentenceInDoc', () => {
  it('maps sentence offsets into document positions', () => {
    const source = 'Intro.\n\nFirst one. Second one.';
    const r = sentenceInDoc(doc(source), source.indexOf('Second') + 2);
    expect(slice(source, r)).toBe('Second one.');
  });
});
