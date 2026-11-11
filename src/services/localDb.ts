/**
 * Tiny IndexedDB wrapper — the device's own database.
 *
 * Everything is written here first, so the app keeps working when the internet is down.
 * A background sync (added later) copies the data to Google Sheets when a connection is back.
 *
 * If IndexedDB is unavailable (private mode, very old browser) it falls back to memory so the
 * app still runs; `getStorageMode()` lets the UI warn that nothing will survive a refresh.
 */

export type StoreName = 'workOrders' | 'outbox';

/** One pending change waiting to be sent. Keyed by order, so repeated edits collapse into one. */
export interface OutboxEntry {
  id: string; // `work-order:<orderId>`
  kind: 'UPSERT_WORK_ORDER';
  orderId: string;
  queuedAt: string; // ISO
  attempts: number;
}

export type StorageMode = 'indexeddb' | 'memory';

const DB_NAME = 'loomworks';
const DB_VERSION = 1;
const STORES: readonly StoreName[] = ['workOrders', 'outbox'];

const memory: Record<StoreName, Map<string, unknown>> = {
  workOrders: new Map(),
  outbox: new Map(),
};

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null);
      return;
    }
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        for (const name of STORES) {
          if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

export async function getStorageMode(): Promise<StorageMode> {
  return (await openDb()) ? 'indexeddb' : 'memory';
}

function asPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });
}

export async function dbGetAll<T>(store: StoreName): Promise<T[]> {
  const db = await openDb();
  if (!db) return [...memory[store].values()] as T[];
  return asPromise(db.transaction(store, 'readonly').objectStore(store).getAll() as IDBRequest<T[]>);
}

export async function dbGet<T>(store: StoreName, id: string): Promise<T | undefined> {
  const db = await openDb();
  if (!db) return memory[store].get(id) as T | undefined;
  return asPromise(db.transaction(store, 'readonly').objectStore(store).get(id) as IDBRequest<T | undefined>);
}

export type DbOperation =
  | { store: StoreName; put: { id: string } }
  | { store: StoreName; deleteId: string };

/** Applies several writes in ONE transaction: either all of them are saved or none. */
export async function dbWrite(operations: readonly DbOperation[]): Promise<void> {
  const db = await openDb();
  if (!db) {
    for (const operation of operations) {
      if ('put' in operation) memory[operation.store].set(operation.put.id, structuredClone(operation.put));
      else memory[operation.store].delete(operation.deleteId);
    }
    return;
  }

  const names = [...new Set(operations.map((operation) => operation.store))];
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(names, 'readwrite');
    for (const operation of operations) {
      const objectStore = transaction.objectStore(operation.store);
      if ('put' in operation) objectStore.put(operation.put);
      else objectStore.delete(operation.deleteId);
    }
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Saving to the device failed.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Saving to the device was cancelled.'));
  });
}

/**
 * Unique id that also works on plain http (crypto.randomUUID only exists on https/localhost,
 * and the factory PCs may open the app from a local address).
 */
export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
