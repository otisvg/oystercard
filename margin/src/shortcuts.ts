import * as actions from './actions';

export const isMac =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

export interface Shortcut {
  /** `KeyboardEvent.code` of the key, so Option-key characters on macOS don't matter. */
  code: string;
  mod?: boolean;
  alt?: boolean;
  shift?: boolean;
  label: string;
  run: () => void;
}

export const SHORTCUTS: Shortcut[] = [
  { code: 'KeyN', mod: true, alt: true, label: 'New document', run: () => void actions.newDoc() },
  { code: 'KeyS', mod: true, label: 'Save a version', run: () => void actions.saveVersion() },
  { code: 'KeyD', mod: true, label: 'Focus mode', run: actions.toggleFocusMode },
  { code: 'KeyT', mod: true, alt: true, label: 'Typewriter scrolling', run: actions.toggleTypewriter },
  { code: 'KeyY', mod: true, alt: true, label: 'Syntax highlighting', run: actions.toggleSyntax },
  { code: 'KeyC', mod: true, alt: true, label: 'Style check', run: actions.toggleStyleCheck },
  { code: 'KeyP', mod: true, alt: true, label: 'Preview beside editor', run: () => actions.togglePreview('split') },
  { code: 'KeyR', mod: true, alt: true, label: 'Reading view', run: () => actions.togglePreview('full') },
  { code: 'KeyL', mod: true, alt: true, label: 'Library', run: () => actions.toggleSidebar('docs') },
  { code: 'KeyO', mod: true, alt: true, label: 'Outline', run: () => actions.toggleSidebar('outline') },
  { code: 'KeyH', mod: true, alt: true, label: 'Version history', run: () => actions.openDialog('history') },
  { code: 'Comma', mod: true, label: 'Settings', run: () => actions.openDialog('settings') },
  { code: 'Slash', mod: true, label: 'Keyboard shortcuts', run: () => actions.openDialog('shortcuts') },
];

/** Shortcuts handled by the editor itself, listed for reference. */
export const EDITOR_SHORTCUTS: { keys: string; label: string }[] = [
  { keys: 'Mod-B', label: 'Bold' },
  { keys: 'Mod-I', label: 'Italic' },
  { keys: 'Mod-K', label: 'Link' },
  { keys: 'Mod-F', label: 'Find and replace' },
  { keys: 'Mod-Z', label: 'Undo' },
  { keys: isMac ? 'Mod-Shift-Z' : 'Mod-Y', label: 'Redo' },
];

const KEY_NAMES: Record<string, string> = { Comma: ',', Slash: '/' };

export function formatShortcut(shortcut: Pick<Shortcut, 'code' | 'mod' | 'alt' | 'shift'>): string {
  const key = KEY_NAMES[shortcut.code] ?? shortcut.code.replace(/^Key|^Digit/, '');
  const parts = [
    shortcut.mod && (isMac ? '⌘' : 'Ctrl'),
    shortcut.alt && (isMac ? '⌥' : 'Alt'),
    shortcut.shift && (isMac ? '⇧' : 'Shift'),
    key,
  ].filter(Boolean);
  return parts.join(isMac ? '' : '+');
}

/** Formats CodeMirror-style key names such as `Mod-Shift-Z`. */
export function formatKeys(keys: string): string {
  const parts = keys.split('-');
  const key = parts.pop()!;
  return formatShortcut({
    code: `Key${key}`,
    mod: parts.includes('Mod'),
    alt: parts.includes('Alt'),
    shift: parts.includes('Shift'),
  });
}

export function matchShortcut(event: KeyboardEvent): Shortcut | undefined {
  // AltGr on Windows reports Ctrl+Alt; it's for typing characters, not shortcuts.
  if (event.getModifierState?.('AltGraph')) return undefined;
  const mod = isMac ? event.metaKey : event.ctrlKey;
  return SHORTCUTS.find(
    (s) =>
      s.code === event.code &&
      !!s.mod === mod &&
      !!s.alt === event.altKey &&
      !!s.shift === event.shiftKey,
  );
}
