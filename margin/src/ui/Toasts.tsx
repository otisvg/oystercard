import { useEffect } from 'react';
import { dismissToast } from '../actions';
import { useApp } from '../store';

export function Toasts() {
  const toast = useApp((s) => s.toast);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(dismissToast, toast.action ? 8000 : 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // The live region is always rendered so screen readers announce new messages.
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toast && (
        <div className="toast" key={toast.id}>
          <span>{toast.message}</span>
          {toast.action && (
            <button type="button" onClick={toast.action.run}>
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
