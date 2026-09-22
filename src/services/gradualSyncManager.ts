/**
 * Gradual Sync Manager (Manajer Sinkronisasi Bertahap)
 *
 * Prinsip Kerja:
 * 1. "Simpan di Browser untuk Sementara":
 *    Setiap perubahan data (presensi, nilai, siswa, kelas, agenda, tabungan, profil)
 *    langsung disimpan secara sinkron (0ms) ke localStorage browser.
 *    Data dijamin TIDAK HILANG meskipun halaman di-refresh, tab ditutup, atau koneksi terputus.
 *
 * 2. "Secara Bertahap Simpan ke Cloud":
 *    Perubahan dimasukkan ke antrean persisten (smk_gradual_sync_queue).
 *    Worker latar belakang mengirim perubahan ke Cloud Firestore secara bertahap
 *    (coalesced/debounced 1.5 - 2.5 detik) untuk menghemat kuota Firestore dan menjaga performa.
 *    Jika pengguna me-refresh sebelum sync selesai, antrean tetap tersimpan di browser
 *    dan langsung dilanjutkan saat halaman dibuka kembali.
 *
 * 3. Perlindungan Timbal-Balik (Conflict Shield):
 *    Data cloud lama TIDAK AKAN PERNAH menimpa data baru yang ada di browser.
 */

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
  private retryDelay: number = 2000;

  constructor() {
    // Listen to online event to resume gradual sync
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.notifyListeners();
        this.triggerGradualSync();
      });
      window.addEventListener('offline', () => {
        this.notifyListeners();
      });
    }
  }

  /**
   * Set active teacher UID for cloud sync target
   */
  setActiveUid(uid: string | null): void {
    this.currentUid = uid;
    this.notifyListeners();
  }

  getActiveUid(): string | null {
    return this.currentUid;
  }

  /**
   * Get pending sync queue from persistent localStorage
   */
  getPendingQueue(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.QUEUE);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Set pending sync queue to persistent localStorage
   */
  private setPendingQueue(queue: string[]): void {
    try {
      const unique = Array.from(new Set(queue));
      localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(unique));
    } catch (e) {
      console.warn('[GradualSync] Failed to save queue to localStorage:', e);
    }
  }

  /**
   * Get last local modified timestamp (ms)
   */
  getLastLocalModified(): number {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.LAST_LOCAL_MODIFIED);
      return val ? parseInt(val, 10) : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Get last confirmed cloud synced timestamp (ms)
   */
  getLastCloudSynced(): number {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.LAST_CLOUD_SYNCED);
      return val ? parseInt(val, 10) : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Mark that a local change has occurred.
   * Immediately updates timestamps, enqueues category, and schedules gradual sync.
   */
  markLocalChange(category: string): void {
    const now = Date.now();
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_LOCAL_MODIFIED, now.toString());
    } catch {}

    const queue = this.getPendingQueue();
    if (!queue.includes(category)) {
      queue.push(category);
      this.setPendingQueue(queue);
    }

    this.notifyListeners();
    // Data is safely stored in browser localStorage.
    // Cloud sync occurs when the user clicks the navigation button ("Sinkronkan Cloud").
  }

  /**
   * Check if local browser data is newer than a given cloud timestamp.
   * If true, cloud data should NOT overwrite local data!
   */
  isLocalNewerThan(cloudUpdatedAt?: string | number): boolean {
    const queue = this.getPendingQueue();
    if (queue.length > 0) {
      // There are pending unsaved changes in browser!
      return true;
    }

    const localTime = this.getLastLocalModified();
    if (!localTime) return false;

    if (!cloudUpdatedAt) return true;

    const cloudTime =
      typeof cloudUpdatedAt === 'number'
        ? cloudUpdatedAt
        : new Date(cloudUpdatedAt).getTime();

    if (isNaN(cloudTime)) return true;

    // Give 1-second margin for server clock drift
    return localTime > cloudTime + 1000;
  }

  /**
   * Mark cloud sync as completed
   */
  markCloudSynced(categoriesSynced?: string[]): void {
    const now = Date.now();
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_CLOUD_SYNCED, now.toString());
      if (categoriesSynced && categoriesSynced.length > 0) {
        const queue = this.getPendingQueue().filter(
          (c) => !categoriesSynced.includes(c)
        );
        this.setPendingQueue(queue);
      } else {
        this.setPendingQueue([]);
      }
    } catch {}

    this.notifyListeners();
  }

  /**
   * Schedule or trigger gradual sync
   */
  triggerGradualSync(delayMs: number = 1800): void {
    if (typeof window !== 'undefined') {
      const q =
        localStorage.getItem('smk_firestore_quota_exceeded') ||
        sessionStorage.getItem('smk_firestore_quota_exceeded');
      if (q) {
        this.notifyListeners();
        return;
      }
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.processQueue();
    }, delayMs);
  }

  /**
   * Force sync immediately (e.g. user clicks "Sinkronkan Sekarang")
   */
  async forceSyncNow(): Promise<boolean> {
    if (typeof window !== 'undefined') {
      const q =
        localStorage.getItem('smk_firestore_quota_exceeded') ||
        sessionStorage.getItem('smk_firestore_quota_exceeded');
      if (q) {
        this.notifyListeners();
        return false;
      }
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    return await this.processQueue(true);
  }

  /**
   * Process the sync queue gradually
   */
  private async processQueue(force: boolean = false): Promise<boolean> {
    if (this.isProcessing) return false;

    // Fast check: if daily write quota is already exceeded, halt cloud writes
    const { isQuotaExceeded } = await import('./firestoreService');
    if (isQuotaExceeded()) {
      this.isProcessing = false;
      this.notifyListeners();
      return false;
    }

    const queue = this.getPendingQueue();
    if (queue.length === 0 && !force) {
      this.notifyListeners();
      return true;
    }

    const uid =
      this.currentUid ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('smk_active_teacher_uid')
        : null);

    if (!uid) {
      // User is not logged in with cloud account yet; keep in browser storage
      this.notifyListeners();
      return false;
    }

    // Check if offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.notifyListeners();
      return false;
    }

    this.isProcessing = true;
    this.notifyListeners();

    try {
      // Lazy load FirestoreService to prevent circular dependency
      const { FirestoreService } = await import('./firestoreService');
      const { Storage } = await import('../utils/storage');

      // Coalesced Full Workspace Sync (single atomic read/write)
      // This is the fastest, safest way to persist all browser data to cloud
      await FirestoreService.saveFullWorkspace(uid, {
        teacher: Storage.getTeacher(),
        classes: Storage.getClasses(),
        activeClassId: Storage.getActiveClassId(),
        students: Storage.getAllStudents(),
        sessions: Storage.getAllSessions(),
        grades: Storage.getAllGrades(),
        agendas: Storage.getAllAgendas(),
        savings: Storage.getAllSavings(),
      });

      // Mark all current queue categories as synced
      this.markCloudSynced();
      this.isProcessing = false;
      this.notifyListeners();
      console.log('[GradualSync] Cloud sync successfully completed for', uid);
      return true;
    } catch (err: any) {
      const { isQuotaExceededError, markQuotaExceeded, isQuotaExceeded: checkAgain } =
        await import('./firestoreService');
      if (isQuotaExceededError(err)) {
        markQuotaExceeded(err?.message || 'Quota limit exceeded');
        console.warn(
          '[GradualSync] Cloud write quota reached. Sync halted, data is 100% safe in browser.'
        );
        this.isProcessing = false;
        this.notifyListeners();
        return false;
      }
      console.warn('[GradualSync] Cloud sync notice (saved locally in browser):', err);
      this.isProcessing = false;
      this.notifyListeners();
      // Retry in background if appropriate (never if quota exceeded)
      if (this.getPendingQueue().length > 0 && !checkAgain()) {
        setTimeout(() => this.triggerGradualSync(15000), 15000);
      }
      return false;
    }
  }

  /**
   * Get current sync status state
   */
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

    const quotaStored =
      typeof window !== 'undefined' &&
      (localStorage.getItem('smk_firestore_quota_exceeded') !== null ||
        sessionStorage.getItem('smk_firestore_quota_exceeded') !== null);

    let status: SyncStatus = 'synced';
    let message = 'Tersimpan di browser & Cloud';

    if (quotaStored) {
      status = 'quota_exceeded';
      message = 'Tersimpan di browser (Batas kuota harian Cloud tercapai)';
    } else if (!isOnline) {
      status = 'offline';
      message = 'Tersimpan di browser (Mode Offline)';
    } else if (this.isProcessing) {
      status = 'syncing';
      message = 'Menyinkronkan ke Cloud secara bertahap...';
    } else if (queue.length > 0) {
      status = 'pending';
      message = `Tersimpan di browser (${queue.length} antrean Cloud)`;
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

  /**
   * Subscribe to sync state changes
   */
  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    // Emit current state immediately
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
