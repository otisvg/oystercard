import type { ReactNode } from 'react';
import * as actions from '../actions';
import { FONT_LABELS, FONT_SIZES, type FocusMode, type FontChoice, type LineWidth, type Theme } from '../settings';
import { useApp } from '../store';
import { DataActions } from './DataActions';
import { Dialog } from './Dialog';
import { HighlightOptions } from './HighlightOptions';

function Choice<T extends string>({
  name, label, value, options, onChange,
}: {
  name: string;
  label: string;
  value: T;
  options: [T, ReactNode][];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="choice">
      <legend>{label}</legend>
      <div className="segmented">
        {options.map(([option, text]) => (
          <label key={option}>
            <input type="radio" name={name} value={option} checked={value === option} onChange={() => onChange(option)} />
            <span>{text}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function SettingsDialog({ open }: { open: boolean }) {
  const settings = useApp((s) => s.settings);
  const persisted = useApp((s) => s.persisted);
  const update = actions.updateSettings;
  const focus: 'off' | FocusMode = settings.focusEnabled ? settings.focusMode : 'off';

  return (
    <Dialog open={open} title="Settings" onClose={actions.closeDialog} className="settings-dialog">
      <section>
        <h3>Appearance</h3>
        <Choice<Theme>
          name="theme"
          label="Theme"
          value={settings.theme}
          options={[['system', 'System'], ['light', 'Light'], ['dark', 'Dark']]}
          onChange={(theme) => update({ theme })}
        />
        <Choice<FontChoice>
          name="font"
          label="Font"
          value={settings.font}
          options={(Object.keys(FONT_LABELS) as FontChoice[]).map((font) => [
            font,
            <span className={`font-sample font-${font}`}>{FONT_LABELS[font]}</span>,
          ])}
          onChange={(font) => update({ font })}
        />
        <label className="range">
          <span>Text size <output>{settings.fontSize}px</output></span>
          <input
            type="range"
            min={FONT_SIZES.min}
            max={FONT_SIZES.max}
            value={settings.fontSize}
            onChange={(e) => update({ fontSize: Number(e.target.value) })}
          />
        </label>
        <Choice<LineWidth>
          name="width"
          label="Line width"
          value={settings.lineWidth}
          options={[['narrow', 'Narrow'], ['medium', 'Medium'], ['wide', 'Wide']]}
          onChange={(lineWidth) => update({ lineWidth })}
        />
      </section>

      <section>
        <h3>Writing</h3>
        <Choice<'off' | FocusMode>
          name="focus"
          label="Focus mode"
          value={focus}
          options={[['off', 'Off'], ['sentence', 'Sentence'], ['paragraph', 'Paragraph']]}
          onChange={(mode) => update(mode === 'off' ? { focusEnabled: false } : { focusEnabled: true, focusMode: mode })}
        />
        <label className="check-row">
          <input type="checkbox" checked={settings.typewriter} onChange={(e) => update({ typewriter: e.target.checked })} />
          Typewriter scrolling: keep the current line centred
        </label>
        <label className="check-row">
          <input type="checkbox" checked={settings.spellcheck} onChange={(e) => update({ spellcheck: e.target.checked })} />
          Check spelling
        </label>
      </section>

      <section>
        <h3>Highlighting</h3>
        <HighlightOptions />
      </section>

      <section>
        <h3>Your data</h3>
        <p className="hint">
          Documents are stored in this browser on this device.{' '}
          {persisted === false
            ? 'The browser may clear them if the device runs low on space, so back up regularly.'
            : 'Back up now and then to keep a copy elsewhere.'}
        </p>
        <div className="button-row">
          <DataActions />
        </div>
      </section>
    </Dialog>
  );
}
