import { markdownLanguage } from '@codemirror/lang-markdown';

export interface Heading {
  level: number;
  text: string;
  from: number;
}

const HEADING_NODE = /^(?:ATXHeading|SetextHeading)(\d)$/;

/** Strip inline Markdown so a heading reads as plain text. */
export function plainHeadingText(source: string): string {
  return source
    .replace(/^\s{0,3}#{1,6}\s*/, '')
    .replace(/\s+#+\s*$/, '')
    .replace(/\n[=-]+\s*$/, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`~]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Headings in a Markdown document, in order. Headings inside code blocks are ignored. */
export function extractOutline(text: string): Heading[] {
  const headings: Heading[] = [];
  const tree = markdownLanguage.parser.parse(text);
  tree.iterate({
    enter(node) {
      const match = HEADING_NODE.exec(node.name);
      if (!match) return;
      const title = plainHeadingText(text.slice(node.from, node.to));
      if (title) headings.push({ level: Number(match[1]), text: title, from: node.from });
      return false;
    },
  });
  return headings;
}

/** Index of the heading whose section contains `pos`, or -1 if it's before the first heading. */
export function activeHeadingIndex(headings: Heading[], pos: number): number {
  let active = -1;
  for (let i = 0; i < headings.length && headings[i].from <= pos; i++) active = i;
  return active;
}
