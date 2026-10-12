import { syntaxTree } from '@codemirror/language';
import type { EditorState } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { paragraphAt, type Range } from '../text/sentences';

// Syntax nodes whose text isn't prose, so highlighting and style checks skip them.
const NON_PROSE = new Set([
  'FencedCode', 'CodeBlock', 'InlineCode', 'URL', 'Autolink', 'HTMLBlock', 'HTMLTag',
  'CommentBlock', 'Comment', 'LinkReference', 'Image',
]);

export interface ProseParagraph {
  from: number;
  text: string;
}

/** Paragraphs overlapping the visible part of the editor, in document order. */
export function visibleParagraphs(view: EditorView): ProseParagraph[] {
  const { doc } = view.state;
  const paragraphs: ProseParagraph[] = [];
  let next = 0;
  for (const { from, to } of view.visibleRanges) {
    let pos = Math.max(from, next);
    while (pos <= to) {
      const paragraph = paragraphAt(doc, pos);
      if (paragraph.to > paragraph.from) {
        paragraphs.push({ from: paragraph.from, text: doc.sliceString(paragraph.from, paragraph.to) });
      }
      next = paragraph.to + 1;
      if (next > doc.length) return paragraphs;
      pos = next;
    }
  }
  return paragraphs;
}

/** Ranges of non-prose syntax (code, URLs, HTML) between `from` and `to`, in order. */
export function nonProseRanges(state: EditorState, from: number, to: number): Range[] {
  const ranges: Range[] = [];
  syntaxTree(state).iterate({
    from,
    to,
    enter(node) {
      if (!NON_PROSE.has(node.name)) return;
      ranges.push({ from: node.from, to: node.to });
      return false;
    },
  });
  return ranges;
}

/** Returns a predicate that tells whether a range overlaps any of `excluded` (sorted). */
export function overlapChecker(excluded: Range[]) {
  let index = 0;
  // Callers query in increasing order, so a moving cursor keeps this linear.
  return (from: number, to: number) => {
    while (index < excluded.length && excluded[index].to <= from) index++;
    return index < excluded.length && excluded[index].from < to;
  };
}
