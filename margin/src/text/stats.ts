// Ideographic scripts don't separate words with spaces, so each character counts as a word.
const IDEOGRAPH = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu;
const WORD = /[\p{L}\p{N}][\p{L}\p{N}\p{M}'’_-]*/gu;
// Link and image targets aren't prose: `[text](https://…)` should count as "text".
const LINK_TARGET = /\]\([^)\s]*(?:\s+"[^"]*")?\)/g;
const AUTOLINK = /<[a-z][a-z0-9+.-]*:[^>\s]*>/gi;

export const WORDS_PER_MINUTE = 238;

export interface TextStats {
  words: number;
  characters: number;
  paragraphs: number;
  readingMinutes: number;
}

export function countWords(text: string): number {
  const prose = text.replace(LINK_TARGET, ']').replace(AUTOLINK, ' ');
  const ideographs = prose.match(IDEOGRAPH)?.length ?? 0;
  const words = prose.replace(IDEOGRAPH, ' ').match(WORD)?.length ?? 0;
  return words + ideographs;
}

export function readingMinutes(words: number): number {
  return words === 0 ? 0 : Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export function textStats(text: string): TextStats {
  const words = countWords(text);
  return {
    words,
    characters: [...text].length,
    paragraphs: text.split(/\n\s*\n/).filter((p) => p.trim() !== '').length,
    readingMinutes: readingMinutes(words),
  };
}
