import { RangeSetBuilder, type Extension } from '@codemirror/state';
import { Decoration, ViewPlugin, type DecorationSet, type EditorView, type ViewUpdate } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { findStyleIssues, type StyleKinds } from '../text/styleRules';
import { nonProseRanges, overlapChecker, visibleParagraphs } from './prose';

function buildDecorations(view: EditorView, kinds: StyleKinds): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  for (const paragraph of visibleParagraphs(view)) {
    const end = paragraph.from + paragraph.text.length;
    const excluded = overlapChecker(nonProseRanges(view.state, paragraph.from, end));
    for (const issue of findStyleIssues(paragraph.text, kinds)) {
      const from = paragraph.from + issue.from;
      const to = paragraph.from + issue.to;
      if (excluded(from, to)) continue;
      builder.add(
        from,
        to,
        Decoration.mark({
          class: `cm-style-issue cm-style-${issue.kind}`,
          attributes: { title: issue.message },
        }),
      );
    }
  }
  return builder.finish();
}

/** Underlines filler words, clichés, redundancies and repeated words. */
export function styleCheck(kinds: StyleKinds): Extension {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = buildDecorations(view, kinds);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged || syntaxTree(update.startState) !== syntaxTree(update.state)) {
          this.decorations = buildDecorations(update.view, kinds);
        }
      }
    },
    { decorations: (plugin) => plugin.decorations },
  );
}
