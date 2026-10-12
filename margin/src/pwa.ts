import { registerSW } from 'virtual:pwa-register';
import { flushSave, showToast } from './actions';
import { useApp } from './store';

export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;
  const updateServiceWorker = registerSW({
    onNeedRefresh() {
      // Never reload on our own: the writer might be mid-sentence.
      showToast('A new version of Margin is ready.', {
        label: 'Reload',
        run: () => void flushSave().then(() => updateServiceWorker(true)),
      });
    },
    onOfflineReady() {
      // Nice to know, but never worth replacing a message that matters (like "Deleted · Undo").
      if (!useApp.getState().toast) showToast('Margin is ready to work offline.');
    },
  });
}
