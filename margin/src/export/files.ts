import quattroBoldItalic from '@fontsource/ia-writer-quattro/files/ia-writer-quattro-latin-700-italic.woff2?url';
import quattroBold from '@fontsource/ia-writer-quattro/files/ia-writer-quattro-latin-700-normal.woff2?url';
import quattroItalic from '@fontsource/ia-writer-quattro/files/ia-writer-quattro-latin-400-italic.woff2?url';
import quattroRegular from '@fontsource/ia-writer-quattro/files/ia-writer-quattro-latin-400-normal.woff2?url';
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { renderMarkdown } from '../preview/render';
import previewCss from '../preview/preview.css?raw';
import * as repo from '../storage/repository';
import { fileNameFor, uniqueName } from '../text/title';

export function download(fileName: string, data: Blob): void {
  const url = URL.createObjectURL(data);
  const link = Object.assign(document.createElement('a'), { href: url, download: fileName });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const escapeHtml = (text: string) =>
  text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

// For printing, embed iA Writer Quattro so PDFs match the preview. (Exported .html files fall
// back to system fonts, since they can't reach the app's font files.)
function printFontFaces(): string {
  const faces: [string, number, string][] = [
    [quattroRegular, 400, 'normal'],
    [quattroItalic, 400, 'italic'],
    [quattroBold, 700, 'normal'],
    [quattroBoldItalic, 700, 'italic'],
  ];
  return faces
    .map(([url, weight, style]) =>
      `@font-face { font-family: "iA Writer Quattro"; font-weight: ${weight}; font-style: ${style}; src: url("${new URL(url, location.href)}") format("woff2"); }`,
    )
    .join('\n');
}

/** A self-contained HTML page for a document, styled like the preview. */
export function standaloneHtml(title: string, markdown: string, extraCss = ''): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
${extraCss}
${previewCss}
body { margin: 0; background: #fff; color: #1d1d1b; }
.markdown-body { max-width: 42rem; margin: 0 auto; padding: 3rem 1.5rem; }
@media print { .markdown-body { padding: 0; } }
</style>
</head>
<body>
<article class="markdown-body">
${renderMarkdown(markdown)}
</article>
</body>
</html>
`;
}

export function exportMarkdown(title: string, markdown: string): void {
  download(`${fileNameFor(title)}.md`, new Blob([markdown], { type: 'text/markdown;charset=utf-8' }));
}

export function exportHtml(title: string, markdown: string): void {
  download(`${fileNameFor(title)}.html`, new Blob([standaloneHtml(title, markdown)], { type: 'text/html;charset=utf-8' }));
}

/** Print the document on its own (the browser's print dialog offers "Save as PDF"). */
export function printDocument(title: string, markdown: string): void {
  // Some browsers never fire afterprint; don't let old frames pile up.
  document.querySelectorAll('iframe.print-frame').forEach((old) => old.remove());
  const frame = Object.assign(document.createElement('iframe'), { title: 'Print preview', className: 'print-frame' });
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  frame.srcdoc = standaloneHtml(title, markdown, printFontFaces());
  frame.addEventListener(
    'load',
    () => {
      const win = frame.contentWindow!;
      win.addEventListener('afterprint', () => setTimeout(() => frame.remove(), 100), { once: true });
      // Let web fonts settle so the PDF isn't set in a fallback font.
      void win.document.fonts.ready.then(() => {
        win.focus();
        win.print();
      });
    },
    { once: true },
  );
  document.body.append(frame);
}

/** A .zip of every document as Markdown, plus a full backup (with history) Margin can restore. */
export async function exportEverything(): Promise<void> {
  const backup = await repo.exportBackup();
  const taken = new Set<string>();
  const files: Record<string, Uint8Array> = {
    'margin-backup.json': strToU8(JSON.stringify(backup)),
  };
  for (const doc of [...backup.docs].sort((a, b) => b.updatedAt - a.updatedAt)) {
    files[`Documents/${uniqueName(fileNameFor(doc.title), taken)}.md`] = strToU8(doc.content);
  }
  const date = new Date().toISOString().slice(0, 10);
  const zipped = zipSync(files, { level: 6 });
  download(`Margin backup ${date}.zip`, new Blob([zipped.slice()], { type: 'application/zip' }));
}

export interface ImportResult {
  /** Plain text files that should each become a new document. */
  texts: string[];
  /** How many Margin backups were found, and how many documents they added or updated. */
  backups: number;
  restored: number;
  skipped: string[];
}

const TEXT_FILE = /\.(md|markdown|mdown|txt|text)$/i;

/** Read files chosen by the user: Markdown/text files, Margin backups (.json) or zips of either. */
export async function readImport(files: File[]): Promise<ImportResult> {
  const result: ImportResult = { texts: [], backups: 0, restored: 0, skipped: [] };
  const restore = async (data: unknown) => {
    if (!repo.isBackup(data)) return false;
    result.backups++;
    result.restored += await repo.importBackup(data);
    return true;
  };
  for (const file of files) {
    if (TEXT_FILE.test(file.name)) {
      result.texts.push(await file.text());
    } else if (/\.json$/i.test(file.name)) {
      if (!(await restore(JSON.parse(await file.text())))) result.skipped.push(file.name);
    } else if (/\.zip$/i.test(file.name)) {
      const entries = unzipSync(new Uint8Array(await file.arrayBuffer()));
      const backupName = Object.keys(entries).find((name) => name.endsWith('margin-backup.json'));
      if (!backupName || !(await restore(JSON.parse(strFromU8(entries[backupName]))))) {
        for (const [name, bytes] of Object.entries(entries)) {
          if (TEXT_FILE.test(name) && !name.startsWith('__MACOSX/')) result.texts.push(strFromU8(bytes));
        }
      }
    } else {
      result.skipped.push(file.name);
    }
  }
  return result;
}
