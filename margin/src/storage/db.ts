import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { VersionKind } from '../history/policy';

export interface DocRecord {
  id: string;
  content: string;
  title: string;
  words: number;
  createdAt: number;
  updatedAt: number;
}

export interface VersionRecord {
  id: string;
  docId: string;
  content: string;
  words: number;
  kind: VersionKind;
  createdAt: number;
}

interface MarginSchema extends DBSchema {
  docs: { key: string; value: DocRecord; indexes: { updatedAt: number } };
  versions: { key: string; value: VersionRecord; indexes: { docId: string } };
}

export type MarginDB = IDBPDatabase<MarginSchema>;

const DB_NAME = 'margin';
let connection: Promise<MarginDB> | null = null;

export function db(): Promise<MarginDB> {
  connection ??= openDB<MarginSchema>(DB_NAME, 1, {
    upgrade(database) {
      const docs = database.createObjectStore('docs', { keyPath: 'id' });
      docs.createIndex('updatedAt', 'updatedAt');
      const versions = database.createObjectStore('versions', { keyPath: 'id' });
      versions.createIndex('docId', 'docId');
    },
    blocking() {
      // A newer version of the app wants to upgrade the database: let it.
      void connection?.then((database) => database.close());
      connection = null;
    },
  });
  return connection;
}

/** Close and delete the database. Used by tests. */
export async function resetDatabase(): Promise<void> {
  if (connection) (await connection).close();
  connection = null;
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
