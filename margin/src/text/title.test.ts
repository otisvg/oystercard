import { describe, expect, it } from 'vitest';
import { deriveTitle, fileNameFor, uniqueName } from './title';

describe('deriveTitle', () => {
  it('uses the first non-empty line without Markdown', () => {
    expect(deriveTitle('\n\n# My *Great* Essay\n\nBody')).toBe('My Great Essay');
    expect(deriveTitle('> [Quoted](http://x) line')).toBe('Quoted line');
  });

  it('falls back to Untitled', () => {
    expect(deriveTitle('')).toBe('Untitled');
    expect(deriveTitle('#\n')).toBe('Untitled');
  });

  it('truncates long titles', () => {
    const title = deriveTitle('word '.repeat(40));
    expect(title.length).toBeLessThanOrEqual(80);
    expect(title.endsWith('…')).toBe(true);
  });
});

describe('fileNameFor', () => {
  it('removes characters that are invalid in file names', () => {
    expect(fileNameFor('What? A/B: "test"')).toBe('What A B test');
    expect(fileNameFor('...')).toBe('Untitled');
  });
});

describe('uniqueName', () => {
  it('appends a number to duplicate names, case-insensitively', () => {
    const taken = new Set<string>();
    expect(uniqueName('Notes', taken)).toBe('Notes');
    expect(uniqueName('notes', taken)).toBe('notes 2');
    expect(uniqueName('Notes', taken)).toBe('Notes 3');
  });
});
