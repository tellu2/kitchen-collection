// Minimal IndexedDB key-value store. Two stores: "kv" for JSON state
// (prefs, synced data) and "files" for blobs (synced images, user photos).
// Every call resolves even if storage is unavailable, so the UI never blocks.

type StoreName = 'kv' | 'files';
let dbPromise: Promise<IDBDatabase | null> | null = null;

function open(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise(resolve => {
    try {
      const req = indexedDB.open('kitchen-collection', 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore('kv');
        req.result.createObjectStore('files');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

export async function dbGet<T>(store: StoreName, key: string): Promise<T | undefined> {
  const db = await open();
  if (!db) return undefined;
  return new Promise(resolve => {
    try {
      const req = db.transaction(store).objectStore(store).get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => resolve(undefined);
    } catch {
      resolve(undefined);
    }
  });
}

export async function dbSet(store: StoreName, key: string, value: unknown): Promise<boolean> {
  const db = await open();
  if (!db) return false;
  return new Promise(resolve => {
    try {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).put(value, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

export async function dbDelete(store: StoreName, key: string): Promise<void> {
  const db = await open();
  if (!db) return;
  await new Promise<void>(resolve => {
    try {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function dbEntries<T>(store: StoreName, prefix: string): Promise<[string, T][]> {
  const db = await open();
  if (!db) return [];
  return new Promise(resolve => {
    const out: [string, T][] = [];
    try {
      const req = db.transaction(store).objectStore(store).openCursor();
      req.onsuccess = () => {
        const c = req.result;
        if (!c) return resolve(out);
        if (String(c.key).startsWith(prefix)) out.push([String(c.key), c.value as T]);
        c.continue();
      };
      req.onerror = () => resolve(out);
    } catch {
      resolve(out);
    }
  });
}
