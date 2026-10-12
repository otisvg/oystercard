// Loaded on demand: compromise is the largest dependency and only needed for syntax highlighting.
import nlp from 'compromise';
import type { PosKind } from '../settings';

export interface PosToken {
  from: number;
  to: number;
  pos: PosKind;
}

interface Term {
  tags: string[];
  offset: { start: number; length: number };
}

const CACHE_SIZE = 400;
const cache = new Map<string, PosToken[]>();

function classify(tags: string[]): PosKind | null {
  if (tags.includes('Conjunction')) return 'conjunction';
  if (tags.includes('Adverb')) return 'adverb';
  if (tags.includes('Adjective')) return 'adjective';
  if (tags.includes('Verb')) return 'verb';
  if (tags.includes('Noun') && !tags.includes('Pronoun')) return 'noun';
  return null;
}

/** Part-of-speech tokens for a paragraph, as offsets into it. */
export function tagParagraph(text: string): PosToken[] {
  const cached = cache.get(text);
  if (cached) {
    // Refresh its position so the cache evicts least recently used paragraphs.
    cache.delete(text);
    cache.set(text, cached);
    return cached;
  }

  const tokens: PosToken[] = [];
  const sentences = nlp(text).json({ offset: true, terms: { offset: true } }) as { terms: Term[] }[];
  for (const sentence of sentences) {
    for (const term of sentence.terms) {
      const pos = classify(term.tags);
      if (pos && term.offset.length > 0) {
        tokens.push({ from: term.offset.start, to: term.offset.start + term.offset.length, pos });
      }
    }
  }

  cache.set(text, tokens);
  if (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value!);
  return tokens;
}
