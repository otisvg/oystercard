import { closeDialog } from '../actions';
import { EDITOR_SHORTCUTS, formatKeys, formatShortcut, SHORTCUTS } from '../shortcuts';
import { Dialog } from './Dialog';

export function ShortcutsDialog({ open }: { open: boolean }) {
  return (
    <Dialog open={open} title="Keyboard shortcuts" onClose={closeDialog} className="shortcuts-dialog">
      <div className="shortcut-columns">
        <dl className="shortcut-list">
          {SHORTCUTS.map((s) => (
            <div key={s.label}>
              <dt>{s.label}</dt>
              <dd><kbd>{formatShortcut(s)}</kbd></dd>
            </div>
          ))}
        </dl>
        <dl className="shortcut-list">
          {EDITOR_SHORTCUTS.map((s) => (
            <div key={s.label}>
              <dt>{s.label}</dt>
              <dd><kbd>{formatKeys(s.keys)}</kbd></dd>
            </div>
          ))}
          <div>
            <dt>Continue a list</dt>
            <dd><kbd>Enter</kbd></dd>
          </div>
          <div>
            <dt>Leave the editor</dt>
            <dd><kbd>Esc</kbd> then <kbd>Tab</kbd></dd>
          </div>
        </dl>
      </div>
    </Dialog>
  );
}
