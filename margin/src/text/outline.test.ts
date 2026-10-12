import { describe, expect, it } from 'vitest';
import { activeHeadingIndex, extractOutline } from './outline';

describe('extractOutline', () => {
  it('lists ATX and setext headings with levels and positions', () => {
    const text = '# Title\n\nIntro\n\nPart *one*\n---\n\n### [Linked](https://x.y) bit ###\n';
    expect(extractOutline(text)).toEqual([
      { level: 1, text: 'Title', from: 0 },
      { level: 2, text: 'Part one', from: text.indexOf('Part') },
      { level: 3, text: 'Linked bit', from: text.indexOf('###') },
    ]);
  });

  it('ignores headings inside code blocks', () => {
    expect(extractOutline('```\n# not a heading\n```\n\n## Real')).toEqual([
      { level: 2, text: 'Real', from: 25 },
    ]);
  });

  it('skips empty headings', () => {
    expect(extractOutline('#\n\n## \n')).toEqual([]);
  });
});

describe('activeHeadingIndex', () => {
  const headings = [
    { level: 1, text: 'A', from: 0 },
    { level: 2, text: 'B', from: 10 },
  ];

  it('returns the last heading at or before the position', () => {
    expect(activeHeadingIndex(headings, 5)).toBe(0);
    expect(activeHeadingIndex(headings, 10)).toBe(1);
    expect(activeHeadingIndex([{ level: 1, text: 'A', from: 5 }], 2)).toBe(-1);
  });
});
