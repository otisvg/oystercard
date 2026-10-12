import { useRef } from 'react';
import * as actions from '../actions';
import { plural } from './format';

async function importFiles(files: File[]): Promise<void> {
  try {
    await actions.flushSave();
    const { readImport } = await import('../export/files');
    const result = await readImport(files);
    if (result.texts.length) await actions.importAsDocs(result.texts);
    if (result.restored) await actions.reloadLibrary();
    const parts = [
      result.texts.length && `Imported ${plural(result.texts.length, 'document')}`,
      result.restored && `Restored ${plural(result.restored, 'document')} from backup`,
      result.backups && !result.restored && 'Your library already has everything in that backup',
      result.skipped.length && `Skipped ${result.skipped.join(', ')}`,
    ].filter(Boolean);
    actions.showToast(parts.length ? `${parts.join('. ')}.` : 'Nothing to import.');
  } catch (error) {
    console.error(error);
    actions.showToast('Couldn’t read that file.');
  }
}

/** Back up / import buttons, shared by the export menu and Settings. */
export function DataActions({ onDone, asMenu = false }: { onDone?: () => void; asMenu?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const className = asMenu ? 'menu-item' : 'button';

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => {
          onDone?.();
          void actions
            .flushSave()
            .then(() => import('../export/files'))
            .then((files) => files.exportEverything());
        }}
      >
        Back up everything (.zip)
      </button>
      <button type="button" className={className} onClick={() => input.current?.click()}>
        Import files…
      </button>
      <input
        ref={input}
        type="file"
        hidden
        multiple
        accept=".md,.markdown,.mdown,.txt,.text,.zip,.json"
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          event.target.value = '';
          onDone?.();
          if (files.length) void importFiles(files);
        }}
      />
    </>
  );
}
