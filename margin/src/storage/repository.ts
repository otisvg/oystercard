import { shouldAutoSnapshot, versionsToPrune, type VersionKind } from '../history/policy';
import { countWords } from '../text/stats';
import { deriveTitle } from '../text/title';
import { db, type DocRecord, type VersionRecord } from './db';

export type DocMeta = Omit<DocRecord, 'content'>;

const newId = () => crypto.randomUUID();

export function toMeta({ content: _content, ...meta }: DocRecord): DocMeta {
  return meta;
}

export async function listDocs(): Promise<DocMeta[]> {
  const docs = await (await db()).getAllFromIndex('docs', 'updatedAt');
  return docs.reverse().map(toMeta);
}

export async function getDoc(id: string): Promise<DocRecord | undefined> {
  return (await db()).get('docs', id);
}

export async function createDoc(content = '', at = Date.now()): Promise<DocRecord> {
  const doc: DocRecord = {
    id: newId(),
    content,
    title: deriveTitle(content),
    words: countWords(content),
    createdAt: at,
    updatedAt: at,
  };
  await (await db()).put('docs', doc);
  return doc;
}

export async function saveDoc(id: string, content: string, at = Date.now()): Promise<DocRecord> {
  const database = await db();
  const tx = database.transaction('docs', 'readwrite');
  const existing = await tx.store.get(id);
  if (!existing) throw new Error(`Document ${id} no longer exists`);
  const doc: DocRecord = {
    ...existing,
    content,
    title: deriveTitle(content),
    words: countWords(content),
    updatedAt: at,
  };
  await tx.store.put(doc);
  await tx.done;
  return doc;
}

export interface DeletedDoc {
  doc: DocRecord;
  versions: VersionRecord[];
}

export async function deleteDoc(id: string): Promise<DeletedDoc | undefined> {
  const database = await db();
  const tx = database.transaction(['docs', 'versions'], 'readwrite');
  const doc = await tx.objectStore('docs').get(id);
  const versions = await tx.objectStore('versions').index('docId').getAll(id);
  await tx.objectStore('docs').delete(id);
  for (const version of versions) await tx.objectStore('versions').delete(version.id);
  await tx.done;
  return doc && { doc, versions };
}

export async function restoreDeleted({ doc, versions }: DeletedDoc): Promise<void> {
  const database = await db();
  const tx = database.transaction(['docs', 'versions'], 'readwrite');
  await tx.objectStore('docs').put(doc);
  for (const version of versions) await tx.objectStore('versions').put(version);
  await tx.done;
}

/** All versions of a document, newest first. */
export async function listVersions(docId: string): Promise<VersionRecord[]> {
  const versions = await (await db()).getAllFromIndex('versions', 'docId', docId);
  return versions.sort((a, b) => b.createdAt - a.createdAt);
}

export async function latestVersion(docId: string): Promise<VersionRecord | undefined> {
  return (await listVersions(docId))[0];
}

/**
 * Snapshot `content` as a new version and prune old ones. Returns undefined
 * when the content is identical to the latest version, except that saving a
 * manual version over an identical automatic one promotes it to manual.
 */
export async function addVersion(
  docId: string,
  content: string,
  kind: VersionKind,
  at = Date.now(),
): Promise<VersionRecord | undefined> {
  const existing = await listVersions(docId);
  const latest = existing[0];
  if (latest?.content === content) {
    if (kind !== 'manual' || latest.kind === 'manual') return undefined;
    const promoted: VersionRecord = { ...latest, kind: 'manual' };
    await (await db()).put('versions', promoted);
    return promoted;
  }

  const version: VersionRecord = { id: newId(), docId, content, words: countWords(content), kind, createdAt: at };
  const prune = versionsToPrune([version, ...existing], at);

  const tx = (await db()).transaction('versions', 'readwrite');
  await tx.store.put(version);
  for (const id of prune) await tx.store.delete(id);
  await tx.done;
  return version;
}

/** Take an automatic snapshot if enough time has passed since the last one. */
export async function maybeAutoSnapshot(docId: string, content: string, at = Date.now()) {
  const latest = await latestVersion(docId);
  if (!shouldAutoSnapshot(latest, content, at)) return undefined;
  return addVersion(docId, content, 'auto', at);
}

export interface Backup {
  format: 'margin-backup';
  version: 1;
  exportedAt: number;
  docs: DocRecord[];
  versions: VersionRecord[];
}

export async function exportBackup(): Promise<Backup> {
  const database = await db();
  return {
    format: 'margin-backup',
    version: 1,
    exportedAt: Date.now(),
    docs: await database.getAll('docs'),
    versions: await database.getAll('versions'),
  };
}

export function isBackup(value: unknown): value is Backup {
  const backup = value as Backup;
  return backup?.format === 'margin-backup' && Array.isArray(backup.docs) && Array.isArray(backup.versions);
}

/**
 * Merge a backup into the library. Documents are matched by id and the most
 * recently edited copy wins; versions are added if missing. Returns how many
 * documents were added or updated.
 */
export async function importBackup(backup: Backup): Promise<number> {
  const database = await db();
  const tx = database.transaction(['docs', 'versions'], 'readwrite');
  let changed = 0;
  for (const doc of backup.docs) {
    const existing = await tx.objectStore('docs').get(doc.id);
    if (existing && existing.updatedAt >= doc.updatedAt) continue;
    await tx.objectStore('docs').put(doc);
    changed++;
  }
  for (const version of backup.versions) {
    if (!(await tx.objectStore('versions').getKey(version.id))) await tx.objectStore('versions').put(version);
  }
  await tx.done;
  return changed;
}
