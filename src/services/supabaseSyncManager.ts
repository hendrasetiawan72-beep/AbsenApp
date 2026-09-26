import { isSupabaseConfigured } from '../lib/supabase';
import { IndexedDBManager, type PendingMutation } from '../utils/indexedDb';
import { ClassService } from './classService';
import { StudentService } from './studentService';
import { AttendanceService } from './attendanceService';
import { GradeService } from './gradeService';
import { AgendaService } from './agendaService';
import { SavingsService } from './savingsService';
import { AuthService } from './authService';

export type SyncStatus = 'idle' | 'saving' | 'synced' | 'offline' | 'error';

export interface SyncState {
  status: SyncStatus;
  pendingChanges: number;
  lastSavedAt: string | null;
  errorMessage: string | null;
  isOnline: boolean;
}

type SyncStateListener = (state: SyncState) => void;

class SupabaseSyncManagerClass {
  private activeTeacherId: string = '';
  private listeners: Set<SyncStateListener> = new Set();
  private state: SyncState = {
    status: 'synced',
    pendingChanges: 0,
    lastSavedAt: null,
    errorMessage: null,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  };
  private isProcessingQueue: boolean = false;
  private syncTimeout: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.updateState({ isOnline: true, status: 'idle' });
        this.drainOfflineQueue();
      });

      window.addEventListener('offline', () => {
        this.updateState({ isOnline: false, status: 'offline' });
      });
    }
  }

  public setActiveUid(uid: string): void {
    this.activeTeacherId = uid;
  }

  public getActiveUid(): string {
    return this.activeTeacherId;
  }

  public getSyncState(): SyncState {
    return { ...this.state };
  }

  public subscribe(listener: SyncStateListener): () => void {
    this.listeners.add(listener);
    listener(this.getSyncState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private updateState(partial: Partial<SyncState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  private notify(): void {
    const currentState = this.getSyncState();
    this.listeners.forEach((fn) => {
      try {
        fn(currentState);
      } catch (err) {
        console.error('[SupabaseSyncManager] listener error:', err);
      }
    });
  }

  /**
   * Called when a granular item is modified in the UI
   */
  public markLocalChange(_entityKey?: string): void {
    const nextPending = this.state.pendingChanges + 1;
    this.updateState({
      pendingChanges: nextPending,
      status: !this.state.isOnline ? 'offline' : 'saving',
    });

    if (this.state.isOnline && isSupabaseConfigured()) {
      // Trigger instant cloud sync without debounce delay
      if (this.syncTimeout) clearTimeout(this.syncTimeout);
      this.syncTimeout = setTimeout(() => {
        this.drainOfflineQueue();
      }, 0);
    }
  }

  /**
   * Called when cloud save completes
   */
  public markCloudSynced(): void {
    this.updateState({
      status: 'synced',
      pendingChanges: 0,
      lastSavedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      errorMessage: null,
    });
  }

  /**
   * Mark sync error
   */
  public markSyncError(message: string): void {
    this.updateState({
      status: 'error',
      errorMessage: message,
    });
  }

  /**
   * Granular processing of pending mutations from IndexedDB
   */
  public async drainOfflineQueue(): Promise<void> {
    if (this.isProcessingQueue || !this.state.isOnline || !isSupabaseConfigured()) return;
    this.isProcessingQueue = true;
    this.updateState({ status: 'saving' });

    try {
      const mutations = await IndexedDBManager.getPendingMutations();
      if (!mutations || mutations.length === 0) {
        this.markCloudSynced();
        this.isProcessingQueue = false;
        return;
      }

      for (const mutation of mutations) {
        await this.processSingleMutation(mutation);
        await IndexedDBManager.dequeueMutation(mutation.id);
      }

      this.markCloudSynced();
    } catch (err: any) {
      console.error('[SupabaseSyncManager] drainQueue error:', err);
      this.markSyncError(err.message || 'Gagal menyelaraskan antrean offline.');
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private async processSingleMutation(mutation: PendingMutation): Promise<void> {
    const { entity, action, payload } = mutation;
    const teacherId = this.activeTeacherId || payload?.teacherId || payload?.teacherUid || '';

    switch (entity) {
      case 'profile':
        if (action === 'upsert' && teacherId) {
          await AuthService.updateProfile(teacherId, payload);
        }
        break;
      case 'class':
        if (action === 'upsert' && teacherId) {
          if (Array.isArray(payload.classes)) {
            await ClassService.saveClassesBatch(teacherId, payload.classes);
          } else {
            await ClassService.saveClass(teacherId, payload.cls || payload);
          }
        } else if (action === 'delete' && payload.classId) {
          await ClassService.deleteClass(teacherId, payload.classId);
        }
        break;
      case 'student':
        if (action === 'upsert') {
          if (Array.isArray(payload)) {
            await StudentService.saveStudentsBatch(payload);
          } else {
            await StudentService.saveStudent(payload);
          }
        } else if (action === 'delete' && payload.studentId) {
          await StudentService.deleteStudent(payload.studentId);
        }
        break;
      case 'session':
        if (action === 'upsert' && teacherId) {
          await AttendanceService.saveAttendanceSession(teacherId, payload.session || payload);
        } else if (action === 'delete' && payload.sessionId) {
          await AttendanceService.deleteAttendanceSession(payload.sessionId);
        }
        break;
      case 'grade':
        if (action === 'upsert') {
          if (Array.isArray(payload)) {
            await GradeService.saveGradesBatch(payload);
          } else {
            await GradeService.saveGrade(payload);
          }
        }
        break;
      case 'agenda':
        if (action === 'upsert' && teacherId) {
          await AgendaService.saveAgenda(teacherId, payload.agenda || payload);
        } else if (action === 'delete' && payload.agendaId) {
          await AgendaService.deleteAgenda(payload.agendaId);
        }
        break;
      case 'saving':
        if (action === 'upsert' && teacherId) {
          if (Array.isArray(payload.txs)) {
            await SavingsService.saveSavingsBatch(teacherId, payload.txs);
          } else {
            await SavingsService.saveSaving(teacherId, payload.tx || payload);
          }
        } else if (action === 'delete' && payload.txId) {
          await SavingsService.deleteSaving(payload.txId);
        }
        break;
    }
  }
}

export const SupabaseSyncManager = new SupabaseSyncManagerClass();

// Export alias GradualSyncManager for backwards-compatibility without pulling Firestore
export const GradualSyncManager = SupabaseSyncManager;
