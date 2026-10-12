import { describe, expect, it } from 'vitest';
import { countWords, readingMinutes, textStats } from './stats';

describe('countWords', () => {
  it('counts plain words', () => {
    expect(countWords('The quick brown fox.')).toBe(4);
  });

  it('treats contractions and hyphenated words as one word', () => {
    expect(countWords("It isn't a well-known fact.")).toBe(5);
  });

  it('ignores Markdown syntax and link targets', () => {
    expect(countWords('# Title\n\n- **bold** and [a link](https://example.com/a-b-c "t")')).toBe(5);
  });

  it('ignores autolinks', () => {
    expect(countWords('See <https://example.com> now')).toBe(2);
  });

  it('counts each ideograph as a word', () => {
    expect(countWords('我爱写作 and English')).toBe(6);
  });

  it('returns 0 for empty or whitespace-only text', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('  \n\n ')).toBe(0);
  });
});

describe('readingMinutes', () => {
  it('rounds to the nearest minute, with a minimum of one', () => {
    expect(readingMinutes(0)).toBe(0);
    expect(readingMinutes(10)).toBe(1);
    expect(readingMinutes(238 * 3)).toBe(3);
  });
});

describe('textStats', () => {
  it('counts paragraphs separated by blank lines', () => {
    expect(textStats('One.\n\nTwo\nstill two.\n\n\nThree.').paragraphs).toBe(3);
  });

  it('counts characters as code points', () => {
    expect(textStats('a😀b').characters).toBe(3);
  });
});
