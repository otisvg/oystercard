import { describe, expect, it } from 'vitest';
import { findStyleIssues, type StyleKinds } from './styleRules';

const ALL: StyleKinds = { filler: true, cliche: true, redundancy: true, repetition: true };
const flagged = (text: string, kinds = ALL) =>
  findStyleIssues(text, kinds).map((i) => [i.kind, text.slice(i.from, i.to)]);

describe('findStyleIssues', () => {
  it('flags filler words as whole words only', () => {
    expect(flagged('It was very good, just justified.')).toEqual([
      ['filler', 'very'],
      ['filler', 'just'],
    ]);
  });

  it('flags multi-word phrases across line wraps and in any case', () => {
    expect(flagged('At the end of\nthe day, it works.')).toEqual([['cliche', 'At the end of\nthe day']]);
  });

  it('matches hyphenated phrases written with spaces', () => {
    expect(flagged('Grab the low hanging fruit')).toEqual([['cliche', 'low hanging fruit']]);
  });

  it('matches curly apostrophes', () => {
    expect(flagged('It’s not rocket science.')).toEqual([['cliche', 'It’s not rocket science']]);
  });

  it('suggests a fix for redundancies', () => {
    const [issue] = findStyleIssues('The end result was fine.', ALL);
    expect(issue.kind).toBe('redundancy');
    expect(issue.message).toContain('“result”');
  });

  it('prefers the longer phrase when matches overlap', () => {
    expect(flagged('We did this in order to win.')).toEqual([['redundancy', 'in order to']]);
    expect(flagged('It was very unique.')).toEqual([['redundancy', 'very unique']]);
  });

  it('flags doubled words but not common legitimate doubles', () => {
    expect(flagged('I saw the the cat. He had had enough.')).toEqual([['repetition', 'the the']]);
    expect(flagged('There there')).toEqual([['repetition', 'There there']]);
  });

  it('respects disabled kinds', () => {
    expect(flagged('It was very very good', { ...ALL, repetition: false })).toEqual([
      ['filler', 'very'],
      ['filler', 'very'],
    ]);
    expect(flagged('very', { filler: false, cliche: false, redundancy: false, repetition: false })).toEqual([]);
  });
});
