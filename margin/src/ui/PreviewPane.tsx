import { useEffect, useMemo, useRef } from 'react';
import { getView } from '../editor/bridge';
import { renderMarkdown } from '../preview/render';
import { useApp } from '../store';
import { useDebounced } from './hooks';

/** Scroll the preview so it shows the same part of the document as the top of the editor. */
function syncScroll(preview: HTMLElement): void {
  const view = getView();
  if (!view) return;
  const scroller = view.scrollDOM;
  const height = scroller.getBoundingClientRect().top - view.documentTop + 1;
  const block = view.lineBlockAtHeight(Math.max(0, height));
  const line = view.state.doc.lineAt(block.from).number - 1;
  const progress = block.height > 0 ? Math.min(1, Math.max(0, (height - block.top) / block.height)) : 0;
  const editorLine = line + progress;

  // At the very end of the editor, show the end of the preview.
  if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2) {
    preview.scrollTop = preview.scrollHeight;
    return;
  }

  const blocks = [...preview.querySelectorAll<HTMLElement>('[data-line]')];
  const top = preview.getBoundingClientRect().top - preview.scrollTop;
  let before: { line: number; y: number } = { line: 0, y: 0 };
  let after: { line: number; y: number } | undefined;
  for (const element of blocks) {
    const entry = { line: Number(element.dataset.line), y: element.getBoundingClientRect().top - top };
    if (entry.line <= editorLine) before = entry;
    else {
      after = entry;
      break;
    }
  }
  const nextY = after?.y ?? preview.scrollHeight;
  const nextLine = after?.line ?? view.state.doc.lines;
  const fraction = nextLine > before.line ? (editorLine - before.line) / (nextLine - before.line) : 0;
  preview.scrollTop = before.y + fraction * (nextY - before.y) - 24;
}

export default function PreviewPane({ mode }: { mode: 'split' | 'full' }) {
  const content = useApp((s) => s.content);
  const debounced = useDebounced(content, 150);
  const html = useMemo(() => renderMarkdown(debounced), [debounced]);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const view = getView();
    const preview = scroller.current;
    if (!view || !preview || mode !== 'split') return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => syncScroll(preview));
    };
    onScroll();
    view.scrollDOM.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      view.scrollDOM.removeEventListener('scroll', onScroll);
    };
  }, [mode, html]);

  return (
    <div ref={scroller} className={`preview-pane is-${mode}`} tabIndex={0} aria-label="Preview">
      <article className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
