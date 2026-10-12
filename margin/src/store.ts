import { create } from 'zustand';
import { loadSettings, type Settings } from './settings';
import type { DocMeta } from './storage/repository';

export type SidebarPanel = 'none' | 'docs' | 'outline';
export type PreviewMode = 'off' | 'split' | 'full';
export type DialogName = 'none' | 'settings' | 'history' | 'shortcuts';
export type SaveStatus = 'saved' | 'saving' | 'error';

export interface Toast {
  id: number;
  message: string;
  action?: { label: string; run: () => void };
}

export interface AppState {
  ready: boolean;
  docs: DocMeta[];
  currentId: string | null;
  /** Live content of the open document, updated on every keystroke. */
  content: string;
  caret: number;
  saveStatus: SaveStatus;
  settings: Settings;
  sidebar: SidebarPanel;
  preview: PreviewMode;
  dialog: DialogName;
  toast: Toast | null;
  /** True while the writer is typing; the interface fades away until the mouse moves. */
  typing: boolean;
  persisted: boolean | null;
}

const UI_KEY = 'margin:ui';

function loadLayout(): Pick<AppState, 'sidebar' | 'preview'> {
  try {
    const saved = JSON.parse(localStorage.getItem(UI_KEY) ?? '{}');
    return {
      sidebar: ['none', 'docs', 'outline'].includes(saved.sidebar) ? saved.sidebar : 'none',
      preview: ['off', 'split', 'full'].includes(saved.preview) ? saved.preview : 'off',
    };
  } catch {
    return { sidebar: 'none', preview: 'off' };
  }
}

export const useApp = create<AppState>(() => ({
  ready: false,
  docs: [],
  currentId: null,
  content: '',
  caret: 0,
  saveStatus: 'saved',
  settings: loadSettings(),
  ...loadLayout(),
  dialog: 'none',
  toast: null,
  typing: false,
  persisted: null,
}));

useApp.subscribe((state, previous) => {
  if (state.sidebar === previous.sidebar && state.preview === previous.preview) return;
  try {
    localStorage.setItem(UI_KEY, JSON.stringify({ sidebar: state.sidebar, preview: state.preview }));
  } catch {
    // Layout just won't be remembered.
  }
});
