import type { Text } from '@codemirror/state';

export interface Range {
  from: number;
  to: number;
}

// Lines that always start a new block, even without a blank line before them.
const BLOCK_START = /^\s{0,3}(?:#{1,6}(?:\s|$)|[-*+]\s|\d{1,9}[.)]\s|```|~~~)/;
const HEADING = /^\s{0,3}#{1,6}(?:\s|$)/;

const isBlank = (text: string) => text.trim() === '';

/**
 * The block of text around `pos`: consecutive non-blank lines, split at headings
 * and list items so each one is its own paragraph.
 */
export function paragraphAt(doc: Text, pos: number): Range {
  const line = doc.lineAt(pos);
  if (isBlank(line.text)) return { from: line.from, to: line.to };

  let first = line;
  while (first.number > 1 && !BLOCK_START.test(first.text)) {
    const prev = doc.line(first.number - 1);
    if (isBlank(prev.text) || HEADING.test(prev.text)) break;
    first = prev;
  }

  let last = line;
  while (last.number < doc.lines && !HEADING.test(last.text)) {
    const next = doc.line(last.number + 1);
    if (isBlank(next.text) || BLOCK_START.test(next.text)) break;
    last = next;
  }

  return { from: first.from, to: last.to };
}

// Words that end in a full stop without ending a sentence. Compared lowercase, dots removed.
const ABBREVIATIONS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'st', 'mt', 'vs', 'etc', 'eg', 'ie', 'cf',
  'al', 'approx', 'no', 'vol', 'fig', 'inc', 'ltd', 'co', 'jan', 'feb', 'mar', 'apr', 'jun',
  'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec',
]);

// Terminal punctuation, any closing quotes/brackets/emphasis, then whitespace or the end.
const TERMINATOR = /[.!?…]+["'”’)\]*_]*(?=\s|$)/g;

function isAbbreviation(text: string, dotIndex: number): boolean {
  if (text[dotIndex] !== '.') return false;
  const before = text.slice(0, dotIndex).match(/[\p{L}.]+$/u)?.[0] ?? '';
  const word = before.replace(/\./g, '').toLowerCase();
  // Single letters are initials ("J. R. R. Tolkien"), except the pronoun "I".
  return (word.length === 1 && word !== 'i') || ABBREVIATIONS.has(word);
}

/** Sentence ranges within a single paragraph of text, as offsets into it. */
export function sentenceRanges(text: string): Range[] {
  const ranges: Range[] = [];
  let start = text.search(/\S/);
  if (start === -1) return ranges;

  for (const match of text.matchAll(TERMINATOR)) {
    const end = match.index + match[0].length;
    if (match[0].length === 1 && isAbbreviation(text, match.index)) continue;
    if (end <= start) continue;
    ranges.push({ from: start, to: end });
    const next = text.slice(end).search(/\S/);
    if (next === -1) return ranges;
    start = end + next;
  }

  const end = text.trimEnd().length;
  if (end > start) ranges.push({ from: start, to: end });
  return ranges;
}

/**
 * The sentence containing `offset`. Between sentences, the caret belongs to the
 * sentence after it, or to the one before it if nothing follows yet.
 */
export function sentenceAt(text: string, offset: number): Range {
  const ranges = sentenceRanges(text);
  for (const range of ranges) {
    if (offset <= range.to) return range;
  }
  return ranges.at(-1) ?? { from: offset, to: offset };
}

/** The sentence around `pos` in the document, as document positions. */
export function sentenceInDoc(doc: Text, pos: number): Range {
  const paragraph = paragraphAt(doc, pos);
  const text = doc.sliceString(paragraph.from, paragraph.to);
  const sentence = sentenceAt(text, pos - paragraph.from);
  return { from: paragraph.from + sentence.from, to: paragraph.from + sentence.to };
}
