import * as editor from './editor/bridge';
import { saveSettings, type Settings } from './settings';
import * as repo from './storage/repository';
import type { VersionRecord } from './storage/db';
import { useApp, type DialogName, type PreviewMode, type SidebarPanel } from './store';
import { WELCOME } from './welcome';

const SAVE_DELAY = 500;
const LAST_DOC_KEY = 'margin:lastDoc';

const get = useApp.getState;
const set = useApp.setState;

let pending: { id: string; content: string } | null = null;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let editedSinceOpen = false;
let applyingExternalChange = false;
let toastId = 0;

const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('margin');
type Message = { type: 'saved' | 'deleted' | 'created'; id: string };

// ---- Toasts -------------------------------------------------------------

export function showToast(message: string, action?: { label: string; run: () => void }): void {
  set({ toast: { id: ++toastId, message, action } });
}

export function dismissToast(): void {
  set({ toast: null });
}

// ---- Startup ------------------------------------------------------------

let initialised = false;

export async function init(): Promise<void> {
  if (initialised) return;
  initialised = true;
  editor.setCallbacks({ onChange: handleEditorChange, onSelection: (caret) => set({ caret }) });

  let docs: repo.DocMeta[];
  try {
    docs = await repo.listDocs();
    if (docs.length === 0) {
      await repo.createDoc(WELCOME);
      docs = await repo.listDocs();
    }
  } catch (error) {
    console.error('Margin: storage unavailable', error);
    set({ ready: true, saveStatus: 'error' });
    showToast('This browser is blocking storage (private mode?), so Margin can’t save your writing here.');
    return;
  }

  const last = readLocal(LAST_DOC_KEY);
  set({ docs, ready: true });
  await openDoc(docs.find((d) => d.id === last)?.id ?? docs[0].id);

  channel?.addEventListener('message', (event: MessageEvent<Message>) => void handleMessage(event.data));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flushSave();
  });
  window.addEventListener('pagehide', () => void flushSave());
}

/**
 * Ask the browser not to evict our storage. Firefox shows a prompt for this, so
 * it's requested once there's writing worth keeping rather than on first load.
 */
async function requestPersistence(): Promise<void> {
  if (get().persisted !== null || !navigator.storage?.persisted) return;
  let persisted = await navigator.storage.persisted();
  if (!persisted && navigator.storage.persist) persisted = await navigator.storage.persist();
  set({ persisted });
}

// ---- Documents ----------------------------------------------------------

async function refreshDocs(): Promise<void> {
  set({ docs: await repo.listDocs() });
}

export async function openDoc(id: string): Promise<void> {
  const { currentId } = get();
  if (currentId === id) return;
  await leaveCurrentDoc();

  const doc = await repo.getDoc(id);
  if (!doc) return;
  editedSinceOpen = false;
  set({ currentId: id, content: doc.content, saveStatus: 'saved' });
  editor.showDocument(id, doc.content, get().settings);
  writeLocal(LAST_DOC_KEY, id);
}

/** Save the open document and, if it was edited, snapshot it for version history. */
async function leaveCurrentDoc(): Promise<void> {
  const { currentId, content } = get();
  await flushSave();
  if (currentId && editedSinceOpen) await repo.addVersion(currentId, content, 'auto');
}

export async function newDoc(): Promise<void> {
  await leaveCurrentDoc();
  const doc = await repo.createDoc('');
  await refreshDocs();
  await openDoc(doc.id);
  broadcast({ type: 'created', id: doc.id });
  editor.focusEditor();
}

export async function importAsDocs(contents: string[]): Promise<void> {
  let lastId: string | undefined;
  for (const content of contents) lastId = (await repo.createDoc(content)).id;
  await refreshDocs();
  if (lastId) await openDoc(lastId);
}

export async function reloadLibrary(): Promise<void> {
  await refreshDocs();
  const { docs, currentId } = get();
  if (!docs.some((d) => d.id === currentId) && docs[0]) await openDoc(docs[0].id);
}

export async function deleteDocument(id: string): Promise<void> {
  if (get().currentId === id) await flushSave();
  const deleted = await repo.deleteDoc(id);
  if (pending?.id === id) pending = null;
  editor.forgetDocument(id);
  await refreshDocs();
  broadcast({ type: 'deleted', id });

  if (get().currentId === id) {
    set({ currentId: null });
    const next = get().docs[0];
    if (next) await openDoc(next.id);
    else await newDoc();
  }

  if (deleted) {
    showToast(`Deleted “${deleted.doc.title}”`, {
      label: 'Undo',
      run: () => void undoDelete(deleted),
    });
  }
}

async function undoDelete(deleted: repo.DeletedDoc): Promise<void> {
  await repo.restoreDeleted(deleted);
  await refreshDocs();
  await openDoc(deleted.doc.id);
  broadcast({ type: 'created', id: deleted.doc.id });
  dismissToast();
}

// ---- Saving -------------------------------------------------------------

function handleEditorChange(content: string): void {
  const { currentId } = get();
  if (applyingExternalChange || !currentId) {
    set({ content });
    return;
  }
  editedSinceOpen = true;
  pending = { id: currentId, content };
  set({ content, saveStatus: 'saving' });
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => void flushSave(), SAVE_DELAY);
}

export async function flushSave(): Promise<void> {
  clearTimeout(saveTimer);
  if (!pending) return;
  const { id, content } = pending;
  pending = null;
  try {
    const saved = await repo.saveDoc(id, content);
    const others = get().docs.filter((d) => d.id !== id);
    set({ docs: [repo.toMeta(saved), ...others] });
    if (!pending) set({ saveStatus: 'saved' });
    broadcast({ type: 'saved', id });
    await repo.maybeAutoSnapshot(id, content);
    void requestPersistence();
  } catch (error) {
    console.error('Margin: could not save', error);
    set({ saveStatus: 'error' });
    showToast('Couldn’t save. Export a backup so you don’t lose work.');
  }
}

// ---- Version history ----------------------------------------------------

export async function saveVersion(): Promise<void> {
  const { currentId, content } = get();
  if (!currentId) return;
  await flushSave();
  const version = await repo.addVersion(currentId, content, 'manual');
  showToast(version ? 'Version saved' : 'No changes since the last version');
}

export async function restoreVersion(version: VersionRecord): Promise<void> {
  const { currentId, content } = get();
  if (!currentId || version.docId !== currentId) return;
  await flushSave();
  await repo.addVersion(currentId, content, 'restore');
  editor.replaceContent(version.content, 'input.restore');
  await flushSave();
  set({ dialog: 'none' });
  showToast('Version restored. Your previous text was saved to history first.');
}

// ---- Other tabs ---------------------------------------------------------

function broadcast(message: Message): void {
  channel?.postMessage(message);
}

async function handleMessage(message: Message): Promise<void> {
  await refreshDocs();
  const { currentId, docs } = get();
  if (message.id !== currentId) return;

  if (message.type === 'deleted') {
    set({ currentId: null });
    if (docs[0]) await openDoc(docs[0].id);
    return;
  }

  // Another tab saved the document that's open here. Take its text unless we have unsaved edits.
  if (message.type === 'saved' && !pending) {
    const doc = await repo.getDoc(message.id);
    if (doc && doc.content !== get().content) {
      applyingExternalChange = true;
      try {
        editor.replaceContent(doc.content, 'input.external');
      } finally {
        applyingExternalChange = false;
      }
    }
  }
}

// ---- Settings & layout --------------------------------------------------

export function updateSettings(patch: Partial<Settings>): void {
  const settings = { ...get().settings, ...patch };
  set({ settings });
  saveSettings(settings);
  editor.applySettings(settings);
}

export function toggleSidebar(panel: Exclude<SidebarPanel, 'none'>): void {
  set({ sidebar: get().sidebar === panel ? 'none' : panel });
}

export function setPreview(preview: PreviewMode): void {
  set({ preview });
}

export function togglePreview(mode: Exclude<PreviewMode, 'off'>): void {
  set({ preview: get().preview === mode ? 'off' : mode });
}

export function openDialog(dialog: DialogName): void {
  set({ dialog });
}

export function closeDialog(): void {
  set({ dialog: 'none' });
  editor.focusEditor();
}

export function toggleFocusMode(): void {
  updateSettings({ focusEnabled: !get().settings.focusEnabled });
}

export function toggleTypewriter(): void {
  updateSettings({ typewriter: !get().settings.typewriter });
}

export function toggleSyntax(): void {
  updateSettings({ syntaxEnabled: !get().settings.syntaxEnabled });
}

export function toggleStyleCheck(): void {
  updateSettings({ styleEnabled: !get().settings.styleEnabled });
}

export function setTyping(typing: boolean): void {
  if (get().typing !== typing) set({ typing });
}

// ---- Helpers ------------------------------------------------------------

function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Not remembering the last document is fine.
  }
}
