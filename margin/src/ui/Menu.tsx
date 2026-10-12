import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

interface Props {
  icon: IconName;
  label: string;
  shortcut?: string;
  active?: boolean;
  className?: string;
  children: (close: () => void) => ReactNode;
}

/** A toolbar button that opens a popover panel (light-dismissed by the browser). */
export function Menu({ icon, label, shortcut, active, className = '', children }: Props) {
  const id = useId();
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = panel.current;
    if (!element) return;
    const place = (event: Event) => {
      if ((event as ToggleEvent).newState !== 'open' || !button.current) return;
      const rect = button.current.getBoundingClientRect();
      element.style.top = `${rect.bottom + 6}px`;
      element.style.right = `${Math.max(8, window.innerWidth - rect.right)}px`;
    };
    element.addEventListener('beforetoggle', place);
    return () => element.removeEventListener('beforetoggle', place);
  }, []);

  const close = () => panel.current?.hidePopover();

  return (
    <>
      <button
        ref={button}
        type="button"
        className={`icon-button ${active ? 'is-active' : ''}`}
        aria-label={label}
        title={shortcut ? `${label} (${shortcut})` : label}
        popoverTarget={id}
      >
        <Icon name={icon} />
      </button>
      <div ref={panel} id={id} popover="auto" className={`popover ${className}`} aria-label={label} role="group">
        {children(close)}
      </div>
    </>
  );
}
