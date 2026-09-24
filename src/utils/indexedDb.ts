/**
 * Offline Cache & Mutation Queue backed by browser IndexedDB
 * Replaces localStorage as the primary database storage layer.
 */

const DB_NAME = 'AbsenAppOfflineDB';
const DB_VERSION = 1;

export interface PendingMutation {
  id: string; // unique UUID or timestamp-based mutation id
  entity: 'profile' | 'class' | 'student' | 'session' | 'grade' | 'agenda' | 'saving';
  action: 'upsert' | 'delete';
  payload: any;
  timestamp: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB not supported in this environment'));
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache', { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains('pending_mutations')) {
        const mutationStore = db.createObjectStore('pending_mutations', { keyPath: 'id' });
        mutationStore.createIndex('by_timestamp', 'timestamp', { unique: false });
        mutationStore.createIndex('by_entity', 'entity', { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });

  return dbPromise;
}

export const IndexedDBManager = {
  /**
   * Set cached data in IndexedDB
   */
  async setCache<T>(key: string, data: T): Promise<void> {
    try {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('cache', 'readwrite');
        const store = tx.objectStore('cache');
        const req = store.put({ key, data, updatedAt: Date.now() });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('[IndexedDB] setCache fallback warning:', err);
    }
  },

  /**
   * Get cached data from IndexedDB
   */
  async getCache<T>(key: string): Promise<T | null> {
    try {
      const db = await openDatabase();
      return new Promise((resolve) => {
        const tx = db.transaction('cache', 'readonly');
        const store = tx.objectStore('cache');
        const req = store.get(key);
        req.onsuccess = () => {
          if (req.result && req.result.data !== undefined) {
            resolve(req.result.data as T);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  },

  /**
   * Remove cached item
   */
  async removeCache(key: string): Promise<void> {
    try {
      const db = await openDatabase();
      return new Promise((resolve) => {
        const tx = db.transaction('cache', 'readwrite');
        const store = tx.objectStore('cache');
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    } catch {}
  },

  /**
   * Add a mutation to the offline queue
   */
  async enqueueMutation(
    entity: PendingMutation['entity'],
    action: PendingMutation['action'],
    payload: any
  ): Promise<string> {
    const id = `mut_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const mutation: PendingMutation = {
      id,
      entity,
      action,
      payload,
      timestamp: Date.now(),
    };

    try {
      const db = await openDatabase();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('pending_mutations', 'readwrite');
        const store = tx.objectStore('pending_mutations');
        const req = store.put(mutation);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[IndexedDB] enqueueMutation failed:', e);
    }
    return id;
  },

  /**
   * Get all pending mutations sorted by timestamp
   */
  async getPendingMutations(): Promise<PendingMutation[]> {
    try {
      const db = await openDatabase();
      return new Promise((resolve) => {
        const tx = db.transaction('pending_mutations', 'readonly');
        const store = tx.objectStore('pending_mutations');
        const req = store.getAll();
        req.onsuccess = () => {
          const list: PendingMutation[] = req.result || [];
          list.sort((a, b) => a.timestamp - b.timestamp);
          resolve(list);
        };
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  },

  /**
   * Remove a completed mutation from queue
   */
  async dequeueMutation(id: string): Promise<void> {
    try {
      const db = await openDatabase();
      return new Promise((resolve) => {
        const tx = db.transaction('pending_mutations', 'readwrite');
        const store = tx.objectStore('pending_mutations');
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    } catch {}
  },

  /**
   * Clear all pending mutations
   */
  async clearPendingMutations(): Promise<void> {
    try {
      const db = await openDatabase();
      return new Promise((resolve) => {
        const tx = db.transaction('pending_mutations', 'readwrite');
        const store = tx.objectStore('pending_mutations');
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    } catch {}
  },
};
