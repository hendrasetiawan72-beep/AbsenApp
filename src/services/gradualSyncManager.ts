/**
 * Gradual Sync Manager - Supabase PostgreSQL & IndexedDB edition
 * Offline-first granular queue with automatic debounced background sync.
 */

import { SupabaseSyncManager } from './supabaseSyncManager';

export type SyncStatus = 'synced' | 'saving_local' | 'syncing' | 'pending' | 'offline' | 'error' | 'quota_exceeded';

export interface SyncState {
  status: SyncStatus;
  lastLocalModified: number;
  lastCloudSynced: number;
  lastSyncedTimeStr: string | null;
  pendingCount: number;
  pendingCategories: string[];
  message: string;
}

const STORAGE_KEYS = {
  QUEUE: 'smk_gradual_sync_queue',
  LAST_LOCAL_MODIFIED: 'smk_last_local_modified',
  LAST_CLOUD_SYNCED: 'smk_last_cloud_synced',
};

type SyncListener = (state: SyncState) => void;

class GradualSyncManagerClass {
  private listeners: Set<SyncListener> = new Set();
  private debounceTimer: any = null;
  private isProcessing: boolean = false;
  private currentUid: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.currentUid = localStorage.getItem('smk_active_teacher_uid');
      } catch {}

      window.addEventListener('online', () => {
        this.notifyListeners();
        this.triggerGradualSync();
      });
      window.addEventListener('offline', () => {
        this.notifyListeners();
      });
    }
  }

  setActiveUid(uid: string | null): void {
    this.currentUid = uid;
    if (uid) {
      SupabaseSyncManager.setActiveUid(uid);
      try {
        localStorage.setItem('smk_active_teacher_uid', uid);
      } catch {}
    }
    this.notifyListeners();
  }

  getActiveUid(): string | null {
    return this.currentUid;
  }

  markLocalChange(category: string): void {
    const now = Date.now();
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_LOCAL_MODIFIED, String(now));
      const queue = this.getPendingQueue();
      if (!queue.includes(category)) {
        queue.push(category);
        localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(queue));
      }
    } catch {}

    SupabaseSyncManager.markLocalChange(category);
    this.notifyListeners();
    this.triggerGradualSync();
  }

  markCloudSynced(): void {
    const now = Date.now();
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_CLOUD_SYNCED, String(now));
      localStorage.removeItem(STORAGE_KEYS.QUEUE);
    } catch {}
    SupabaseSyncManager.markCloudSynced();
    this.notifyListeners();
  }

  getPendingQueue(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.QUEUE);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  getLastLocalModified(): number {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LAST_LOCAL_MODIFIED);
      return raw ? parseInt(raw, 10) : 0;
    } catch {
      return 0;
    }
  }

  getLastCloudSynced(): number {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LAST_CLOUD_SYNCED);
      return raw ? parseInt(raw, 10) : 0;
    } catch {
      return 0;
    }
  }

  isLocalNewerThan(cloudTimestampIso?: string): boolean {
    const localModified = this.getLastLocalModified();
    if (!localModified) return false;
    if (!cloudTimestampIso) return true;
    try {
      const cloudTime = new Date(cloudTimestampIso).getTime();
      return localModified > cloudTime;
    } catch {
      return true;
    }
  }

  triggerGradualSync(delayMs: number = 1200): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.processQueue().catch(() => {});
    }, delayMs);
  }

  async forceImmediateSync(): Promise<boolean> {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    return await this.processQueue(true);
  }

  private async processQueue(force: boolean = false): Promise<boolean> {
    if (this.isProcessing) return false;

    const queue = this.getPendingQueue();
    if (queue.length === 0 && !force) {
      this.notifyListeners();
      return true;
    }

    const uid = this.currentUid || (typeof window !== 'undefined' ? localStorage.getItem('smk_active_teacher_uid') : null);
    if (!uid) {
      this.notifyListeners();
      return false;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.notifyListeners();
      return false;
    }

    this.isProcessing = true;
    this.notifyListeners();

    try {
      await SupabaseSyncManager.drainOfflineQueue();
      this.markCloudSynced();
      this.isProcessing = false;
      this.notifyListeners();
      return true;
    } catch (err: any) {
      console.warn('[GradualSync] Notice persisting to Supabase:', err);
      this.isProcessing = false;
      this.notifyListeners();
      return false;
    }
  }

  getSyncState(): SyncState {
    const queue = this.getPendingQueue();
    const lastLocal = this.getLastLocalModified();
    const lastCloud = this.getLastCloudSynced();
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    let lastSyncedTimeStr: string | null = null;
    if (lastCloud > 0) {
      const d = new Date(lastCloud);
      lastSyncedTimeStr = d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    }

    let status: SyncStatus = 'synced';
    let message = 'Tersimpan di Cloud Supabase';

    if (!isOnline) {
      status = 'offline';
      message = 'Tersimpan di browser (Mode Offline)';
    } else if (this.isProcessing) {
      status = 'syncing';
      message = 'Menyinkronkan ke Supabase...';
    } else if (queue.length > 0) {
      status = 'pending';
      message = `Tersimpan di browser (${queue.length} antrean Supabase)`;
    } else if (!this.currentUid) {
      status = 'synced';
      message = 'Tersimpan di browser lokal';
    }

    return {
      status,
      lastLocalModified: lastLocal,
      lastCloudSynced: lastCloud,
      lastSyncedTimeStr,
      pendingCount: queue.length,
      pendingCategories: queue,
      message,
    };
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getSyncState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const state = this.getSyncState();
    this.listeners.forEach((fn) => {
      try {
        fn(state);
      } catch (e) {
        console.error('[GradualSync] Listener error:', e);
      }
    });
  }
}

export const GradualSyncManager = new GradualSyncManagerClass();
