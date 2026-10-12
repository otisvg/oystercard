import * as actions from '../actions';
import { POS_LABELS, type PosKind } from '../settings';
import { formatShortcut, SHORTCUTS } from '../shortcuts';
import { useApp } from '../store';
import { STYLE_LABELS, type StyleKind } from '../text/styleRules';

const shortcutFor = (label: string) => {
  const shortcut = SHORTCUTS.find((s) => s.label === label);
  return shortcut ? formatShortcut(shortcut) : '';
};

/** Toggles for syntax highlighting and style check, used in the toolbar menu and Settings. */
export function HighlightOptions() {
  const settings = useApp((s) => s.settings);

  return (
    <div className="highlight-options">
      <fieldset>
        <legend>
          <label className="switch-row">
            <input type="checkbox" checked={settings.syntaxEnabled} onChange={actions.toggleSyntax} />
            <span>Syntax highlighting</span>
            <kbd>{shortcutFor('Syntax highlighting')}</kbd>
          </label>
        </legend>
        {(Object.keys(POS_LABELS) as PosKind[]).map((pos) => (
          <label key={pos} className="check-row">
            <input
              type="checkbox"
              disabled={!settings.syntaxEnabled}
              checked={settings.syntax[pos]}
              onChange={(e) => actions.updateSettings({ syntax: { ...settings.syntax, [pos]: e.target.checked } })}
            />
            <span className={`swatch pos-${pos}`} aria-hidden="true" />
            {POS_LABELS[pos]}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>
          <label className="switch-row">
            <input type="checkbox" checked={settings.styleEnabled} onChange={actions.toggleStyleCheck} />
            <span>Style check</span>
            <kbd>{shortcutFor('Style check')}</kbd>
          </label>
        </legend>
        {(Object.keys(STYLE_LABELS) as StyleKind[]).map((kind) => (
          <label key={kind} className="check-row">
            <input
              type="checkbox"
              disabled={!settings.styleEnabled}
              checked={settings.style[kind]}
              onChange={(e) => actions.updateSettings({ style: { ...settings.style, [kind]: e.target.checked } })}
            />
            <span className={`underline-sample style-${kind}`} aria-hidden="true">abc</span>
            {STYLE_LABELS[kind]}
          </label>
        ))}
      </fieldset>
    </div>
  );
}
