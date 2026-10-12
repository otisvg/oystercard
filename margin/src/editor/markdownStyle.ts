import { HighlightStyle, syntaxHighlighting, syntaxTree } from '@codemirror/language';
import { RangeSetBuilder, type Extension } from '@codemirror/state';
import { Decoration, EditorView, ViewPlugin, type DecorationSet, type ViewUpdate } from '@codemirror/view';
import { tags } from '@lezer/highlight';

// Headings stay the same size as body text, as in iA Writer; Markdown syntax is shown but quiet.
const markdownHighlight = HighlightStyle.define([
  { tag: tags.heading, fontWeight: '700' },
  { tag: tags.strong, fontWeight: '700' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },
  { tag: [tags.processingInstruction, tags.contentSeparator, tags.labelName], color: 'var(--syntax)' },
  { tag: [tags.url, tags.link], color: 'var(--muted)' },
  { tag: tags.monospace, color: 'var(--code)' },
  { tag: tags.quote, color: 'var(--quote)' },
  { tag: tags.comment, color: 'var(--muted)', fontStyle: 'italic' },
]);

const HEADING_LINE = /^ATXHeading(\d)$/;
// List items and quotes: leading indent plus the marker and its following space.
const LIST_PREFIX = /^(\s*(?:[-*+]|\d{1,9}[.)])\s+(?:\[[ xX]\]\s+)?|(?:\s*>\s?)+)/;

function hangingMarks(view: EditorView): DecorationSet {
  const { state } = view;
  const tree = syntaxTree(state);
  const builder = new RangeSetBuilder<Decoration>();
  for (const { from, to } of view.visibleRanges) {
    for (let pos = from; pos <= to; ) {
      const line = state.doc.lineAt(pos);
      const node = tree.resolveInner(line.from, 1);
      const heading = node.name === 'HeaderMark' && HEADING_LINE.test(node.parent?.name ?? '') ? node : null;
      const prefix = LIST_PREFIX.exec(line.text)?.[0];

      if (heading && heading.from === line.from) {
        // Include the space after the #s so the heading text lines up with the body.
        const end = Math.min(heading.to + 1, line.to);
        builder.add(
          line.from,
          end,
          Decoration.mark({ class: 'cm-hanging-mark', attributes: { style: `--hang: ${end - line.from}ch` } }),
        );
      } else if (prefix && !/Code|HTML/.test(node.name)) {
        // Wrapped lines of a list item line up under its text, not its bullet.
        builder.add(
          line.from,
          line.from,
          Decoration.line({ class: 'cm-hanging-line', attributes: { style: `--indent: ${prefix.length}ch` } }),
        );
      }
      pos = line.to + 1;
    }
  }
  return builder.finish();
}

/** Hangs heading markers (`## `) in the left margin and indents wrapped list items. */
const hangingHeadings = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = hangingMarks(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged || syntaxTree(update.startState) !== syntaxTree(update.state)) {
        this.decorations = hangingMarks(update.view);
      }
    }
  },
  { decorations: (plugin) => plugin.decorations },
);

// Keep the caret away from the bottom edge while writing, so there's always room to see what's next.
const comfortableScrolling = EditorView.scrollMargins.of((view) => ({
  top: 48,
  bottom: Math.round(view.scrollDOM.clientHeight * 0.25),
}));

export function markdownStyle(): Extension {
  return [syntaxHighlighting(markdownHighlight), hangingHeadings, comfortableScrolling];
}
