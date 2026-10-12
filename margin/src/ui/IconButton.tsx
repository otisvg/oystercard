import type { ButtonHTMLAttributes } from 'react';
import { Icon, type IconName } from './Icon';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  label: string;
  shortcut?: string;
  pressed?: boolean;
}

export function IconButton({ icon, label, shortcut, pressed, className = '', ...rest }: Props) {
  return (
    <button
      type="button"
      className={`icon-button ${className}`}
      aria-label={label}
      aria-pressed={pressed}
      title={shortcut ? `${label} (${shortcut})` : label}
      {...rest}
    >
      <Icon name={icon} />
    </button>
  );
}
