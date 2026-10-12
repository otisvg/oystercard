import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { resetDatabase } from './db';
import {
  addVersion, createDoc, deleteDoc, exportBackup, getDoc, importBackup, listDocs, listVersions,
  maybeAutoSnapshot, restoreDeleted, saveDoc,
} from './repository';

beforeEach(resetDatabase);

describe('documents', () => {
  it('creates documents with a derived title and word count', async () => {
    const doc = await createDoc('# Hello world\n\nSome text here.');
    expect(doc).toMatchObject({ title: 'Hello world', words: 5 });
    expect(await getDoc(doc.id)).toEqual(doc);
  });

  it('lists documents most recently edited first, without content', async () => {
    const a = await createDoc('A', 1);
    const b = await createDoc('B', 2);
    await saveDoc(a.id, 'A edited', 3);
    const docs = await listDocs();
    expect(docs.map((d) => d.id)).toEqual([a.id, b.id]);
    expect(docs[0]).not.toHaveProperty('content');
  });

  it('refuses to save a document that was deleted', async () => {
    const doc = await createDoc('x');
    await deleteDoc(doc.id);
    await expect(saveDoc(doc.id, 'y')).rejects.toThrow();
  });

  it('deletes a document with its history and can undo it', async () => {
    const doc = await createDoc('one');
    await addVersion(doc.id, 'one', 'manual');
    const deleted = await deleteDoc(doc.id);
    expect(await listDocs()).toEqual([]);
    expect(await listVersions(doc.id)).toEqual([]);

    await restoreDeleted(deleted!);
    expect(await getDoc(doc.id)).toEqual(doc);
    expect(await listVersions(doc.id)).toHaveLength(1);
  });
});

describe('versions', () => {
  it('skips a snapshot identical to the latest version', async () => {
    const doc = await createDoc('same');
    expect(await addVersion(doc.id, 'same', 'manual', 1)).toBeDefined();
    expect(await addVersion(doc.id, 'same', 'manual', 2)).toBeUndefined();
  });

  it('promotes an identical automatic version when saving manually', async () => {
    const doc = await createDoc('');
    await addVersion(doc.id, 'text', 'auto', 1);
    expect(await addVersion(doc.id, 'text', 'manual', 2)).toMatchObject({ kind: 'manual', createdAt: 1 });
    expect(await listVersions(doc.id)).toHaveLength(1);
  });

  it('lists versions newest first', async () => {
    const doc = await createDoc('');
    await addVersion(doc.id, 'v1', 'auto', 1);
    await addVersion(doc.id, 'v2', 'manual', 2);
    expect((await listVersions(doc.id)).map((v) => v.content)).toEqual(['v2', 'v1']);
  });

  it('takes automatic snapshots at most every ten minutes', async () => {
    const doc = await createDoc('');
    const t0 = 1_000_000_000;
    expect(await maybeAutoSnapshot(doc.id, 'a', t0)).toBeDefined();
    expect(await maybeAutoSnapshot(doc.id, 'ab', t0 + 60_000)).toBeUndefined();
    expect(await maybeAutoSnapshot(doc.id, 'abc', t0 + 11 * 60_000)).toBeDefined();
  });
});

describe('backup', () => {
  it('round-trips documents and versions, keeping the newer copy of each document', async () => {
    const doc = await createDoc('original', 1);
    await addVersion(doc.id, 'original', 'manual', 1);
    const backup = await exportBackup();

    await saveDoc(doc.id, 'edited later', 5);
    const other = await createDoc('other', 2);
    await deleteDoc(other.id);

    expect(await importBackup(backup)).toBe(0);
    expect((await getDoc(doc.id))?.content).toBe('edited later');

    await resetDatabase();
    expect(await importBackup(backup)).toBe(1);
    expect((await getDoc(doc.id))?.content).toBe('original');
    expect(await listVersions(doc.id)).toHaveLength(1);
  });
});
