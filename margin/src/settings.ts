import type { StyleKinds } from './text/styleRules';

export type Theme = 'system' | 'light' | 'dark';
export type FontChoice = 'mono' | 'duo' | 'quattro';
export type LineWidth = 'narrow' | 'medium' | 'wide';
export type FocusMode = 'sentence' | 'paragraph';
export type PosKind = 'noun' | 'verb' | 'adjective' | 'adverb' | 'conjunction';
export type PosKinds = Record<PosKind, boolean>;

export interface Settings {
  theme: Theme;
  font: FontChoice;
  fontSize: number;
  lineWidth: LineWidth;
  focusEnabled: boolean;
  focusMode: FocusMode;
  typewriter: boolean;
  spellcheck: boolean;
  syntaxEnabled: boolean;
  syntax: PosKinds;
  styleEnabled: boolean;
  style: StyleKinds;
}

export const POS_LABELS: Record<PosKind, string> = {
  noun: 'Nouns',
  verb: 'Verbs',
  adjective: 'Adjectives',
  adverb: 'Adverbs',
  conjunction: 'Conjunctions',
};

export const FONT_LABELS: Record<FontChoice, string> = {
  mono: 'Mono',
  duo: 'Duo',
  quattro: 'Quattro',
};

export const FONT_SIZES = { min: 14, max: 26 } as const;

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  font: 'duo',
  fontSize: 18,
  lineWidth: 'medium',
  focusEnabled: false,
  focusMode: 'sentence',
  typewriter: false,
  spellcheck: true,
  syntaxEnabled: false,
  syntax: { noun: false, verb: false, adjective: true, adverb: true, conjunction: false },
  styleEnabled: false,
  style: { filler: true, cliche: true, redundancy: true, repetition: true },
};

const KEY = 'margin:settings';

export function loadSettings(): Settings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Settings>;
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      syntax: { ...DEFAULT_SETTINGS.syntax, ...saved.syntax },
      style: { ...DEFAULT_SETTINGS.style, ...saved.style },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Storage can be unavailable (private mode); settings then last for this session only.
  }
}
