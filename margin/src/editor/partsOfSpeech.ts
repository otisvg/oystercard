import { RangeSetBuilder, StateEffect, type Extension } from '@codemirror/state';
import { Decoration, ViewPlugin, type DecorationSet, type EditorView, type ViewUpdate } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import type { PosKind, PosKinds } from '../settings';
import { nonProseRanges, overlapChecker, visibleParagraphs } from './prose';

type Tagger = typeof import('./tagger').tagParagraph;

let tagger: Tagger | null = null;
let loading: Promise<Tagger> | null = null;

export function loadTagger(): Promise<Tagger> {
  loading ??= import('./tagger').then((module) => (tagger = module.tagParagraph));
  return loading;
}

const taggerReady = StateEffect.define<null>();

const MARKS = Object.fromEntries(
  (['noun', 'verb', 'adjective', 'adverb', 'conjunction'] as PosKind[]).map((pos) => [
    pos,
    Decoration.mark({ class: `cm-pos cm-pos-${pos}` }),
  ]),
) as Record<PosKind, Decoration>;

function buildDecorations(view: EditorView, kinds: PosKinds): DecorationSet {
  if (!tagger) return Decoration.none;
  const builder = new RangeSetBuilder<Decoration>();
  for (const paragraph of visibleParagraphs(view)) {
    const end = paragraph.from + paragraph.text.length;
    const excluded = overlapChecker(nonProseRanges(view.state, paragraph.from, end));
    for (const token of tagger(paragraph.text)) {
      if (!kinds[token.pos]) continue;
      const from = paragraph.from + token.from;
      const to = paragraph.from + token.to;
      if (!excluded(from, to)) builder.add(from, to, MARKS[token.pos]);
    }
  }
  return builder.finish();
}

/** iA-style syntax highlighting: colours words by their part of speech. */
export function partsOfSpeech(kinds: PosKinds): Extension {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = buildDecorations(view, kinds);
        if (!tagger) {
          void loadTagger().then(() => view.dispatch({ effects: taggerReady.of(null) }));
        }
      }

      update(update: ViewUpdate) {
        if (
          update.docChanged ||
          update.viewportChanged ||
          syntaxTree(update.startState) !== syntaxTree(update.state) ||
          update.transactions.some((tr) => tr.effects.some((e) => e.is(taggerReady)))
        ) {
          this.decorations = buildDecorations(update.view, kinds);
        }
      }
    },
    { decorations: (plugin) => plugin.decorations },
  );
}
