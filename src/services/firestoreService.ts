import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  onSnapshot,
  disableNetwork,
  enableNetwork,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  TeacherProfile,
  ClassRoom,
  Student,
  AttendanceSession,
  StudentGrade,
  TeachingAgenda,
  GradeColumnHeader,
  SavingTransaction,
} from '../types';
import { Storage } from '../utils/storage';
import { broadcastPreviewUpdate } from './previewSyncChannel';
import { GradualSyncManager } from './gradualSyncManager';

/**
 * Sanitize object to remove undefined values before sending to Firestore
 * (Firestore throws an error if any field is undefined).
 * Also guards against oversized base64 image strings (>80KB) that could breach
 * Firestore's strict 1MB per-document payload limit.
 */
function sanitizeForFirestore<T>(data: T): T {
  try {
    const jsonStr = JSON.stringify(data, (_, value) => {
      if (value === undefined) return null;
      if (typeof value === 'string' && value.startsWith('data:image') && value.length > 80000) {
        // Prevent exceeding 1MB document quota if teacher avatar is a large base64 file
        return value.slice(0, 80000);
      }
      return value;
    });
    return JSON.parse(jsonStr);
  } catch (err) {
    console.warn('[FirestoreService] sanitizeForFirestore fallback warning:', err);
    return data;
  }
}

// Quota Exceeded Circuit Breaker
let _memoryQuotaExceeded = false;

// Check immediately on module load
if (typeof window !== 'undefined') {
  try {
    const initStored =
      localStorage.getItem('smk_firestore_quota_exceeded') ||
      sessionStorage.getItem('smk_firestore_quota_exceeded');
    if (initStored) {
      const parsed = JSON.parse(initStored);
      if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
        _memoryQuotaExceeded = true;
        try {
          disableNetwork(db).catch(() => {});
        } catch {}
      }
    }
  } catch {}
}

export function isQuotaExceededError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);
  const code = (err as any)?.code || '';
  return (
    code === 'resource-exhausted' ||
    msg.includes('resource-exhausted') ||
    msg.includes('Quota limit exceeded') ||
    msg.includes('Quota exceeded') ||
    msg.includes('Free daily write units')
  );
}

export function markQuotaExceeded(reason?: string) {
  _memoryQuotaExceeded = true;
  if (typeof window !== 'undefined') {
    try {
      const payload = JSON.stringify({
        exceeded: true,
        timestamp: Date.now(),
        reason: reason || 'Batas kuota harian Cloud Firestore tercapai',
      });
      localStorage.setItem('smk_firestore_quota_exceeded', payload);
      sessionStorage.setItem('smk_firestore_quota_exceeded', payload);
      window.dispatchEvent(
        new CustomEvent('firestore_quota_exceeded', {
          detail: { reason },
        })
      );
    } catch {}
  }
  try {
    disableNetwork(db).catch(() => {});
  } catch {}
}

export function clearQuotaExceeded() {
  _memoryQuotaExceeded = false;
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('smk_firestore_quota_exceeded');
      sessionStorage.removeItem('smk_firestore_quota_exceeded');
      window.dispatchEvent(new CustomEvent('firestore_quota_cleared'));
    } catch {}
  }
  try {
    enableNetwork(db).catch(() => {});
  } catch {}
}

export function isQuotaExceeded(): boolean {
  if (_memoryQuotaExceeded) return true;
  if (typeof window !== 'undefined') {
    try {
      const stored =
        localStorage.getItem('smk_firestore_quota_exceeded') ||
        sessionStorage.getItem('smk_firestore_quota_exceeded');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          _memoryQuotaExceeded = true;
          try {
            disableNetwork(db).catch(() => {});
          } catch {}
          return true;
        } else {
          localStorage.removeItem('smk_firestore_quota_exceeded');
          sessionStorage.removeItem('smk_firestore_quota_exceeded');
        }
      }
    } catch {}
  }
  return false;
}

/**
 * Safe wrapper around setDoc that gracefully catches Quota Exceeded
 * to prevent crash loops and exponential backoff hangs.
 */
async function safeSetDoc(docRef: any, data: any, options: any = { merge: true }): Promise<void> {
  if (isQuotaExceeded()) {
    return;
  }
  try {
    await setDoc(docRef, data, options);
  } catch (err) {
    if (isQuotaExceededError(err)) {
      markQuotaExceeded(String(err));
      console.warn('[FirestoreService] Firestore daily write quota reached. Switched to offline storage.');
      return;
    }
    throw err;
  }
}

async function safeDeleteDoc(docRef: any): Promise<void> {
  if (isQuotaExceeded()) {
    return;
  }
  try {
    await deleteDoc(docRef);
  } catch (err) {
    if (isQuotaExceededError(err)) {
      markQuotaExceeded(String(err));
      return;
    }
    throw err;
  }
}

/**
 * Executes write batch operations in safe chunks (max 350 per batch)
 * to strictly prevent the Firestore "A write batch can contain at most 500 operations" crash.
 */
async function commitBatchOperations(
  operations: Array<(batch: ReturnType<typeof writeBatch>) => void>,
  chunkSize = 350
): Promise<void> {
  if (!operations || operations.length === 0) return;
  if (isQuotaExceeded()) {
    console.warn('[FirestoreService] Cloud batch write skipped: Daily Firestore write quota exceeded.');
    return;
  }
  try {
    for (let i = 0; i < operations.length; i += chunkSize) {
      const chunk = operations.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      for (const op of chunk) {
        op(batch);
      }
      await batch.commit();
    }
  } catch (err) {
    if (isQuotaExceededError(err)) {
      markQuotaExceeded(String(err));
      console.warn('[FirestoreService] Firestore batch quota exceeded! Switched to offline mode.');
      return;
    }
    throw err;
  }
}


export interface UserWorkspaceData {
  teacher: TeacherProfile;
  classes: ClassRoom[];
  activeClassId: string;
  students: Student[];
  sessions: AttendanceSession[];
  grades: StudentGrade[];
  agendas?: TeachingAgenda[];
  savings?: SavingTransaction[];
  isNewUser?: boolean;
  updatedAt?: string;
}

// In-memory cache for ultra-fast instant UI rendering
const memoryWorkspaceCache: Record<string, { data: UserWorkspaceData; timestamp: number }> = {};
let workspaceDebounceTimers: Record<string, any> = {};
let pendingWorkspacePayloads: Record<string, any> = {};

export const FirestoreService = {
  isQuotaExceeded,
  markQuotaExceeded,
  clearQuotaExceeded,

  /**
   * Synchronously retrieve cached workspace data for 0ms instant app startup
   */
  getCachedUserData(uid: string): UserWorkspaceData | null {
    if (!uid) return null;
    // 1. Check memory cache first
    const mem = memoryWorkspaceCache[uid];
    if (mem && mem.data && mem.data.classes?.length > 0) {
      return mem.data;
    }
    // 2. Check localStorage cache
    try {
      const cacheKey = `smk_ws_cache_${uid}`;
      const cachedStr = localStorage.getItem(cacheKey);
      if (cachedStr) {
        const parsed = JSON.parse(cachedStr) as UserWorkspaceData;
        if (parsed && Array.isArray(parsed.classes) && parsed.classes.length > 0) {
          memoryWorkspaceCache[uid] = { data: parsed, timestamp: Date.now() };
          return parsed;
        }
      }
    } catch {}
    return null;
  },

  /**
   * High-performance debounced workspace background consolidator.
   * Immediately updates local and memory cache (0ms), then debounces Firestore write.
   */
  queueWorkspaceSync(uid: string, partial: Partial<UserWorkspaceData>): void {
    if (!uid) return;

    // 1. Merge into memory cache and localStorage immediately (0ms)
    const cacheKey = `smk_ws_cache_${uid}`;
    try {
      const existing = this.getCachedUserData(uid) || {
        teacher: Storage.getTeacher(),
        classes: Storage.getClasses(),
        activeClassId: Storage.getActiveClassId(),
        students: Storage.getAllStudents(),
        sessions: Storage.getAllSessions(),
        grades: Storage.getAllGrades(),
        agendas: Storage.getAllAgendas(),
        savings: Storage.getAllSavings(),
        isNewUser: false,
      };

      const updated = {
        ...existing,
        ...partial,
        updatedAt: new Date().toISOString(),
      };

      memoryWorkspaceCache[uid] = { data: updated as UserWorkspaceData, timestamp: Date.now() };
      localStorage.setItem(cacheKey, JSON.stringify(updated));
    } catch (e) {
      console.warn('[FirestoreService] Cache update warning:', e);
    }

    // If quota is already exceeded, don't attempt cloud write; local state is preserved!
    if (isQuotaExceeded()) {
      return;
    }

    // 2. Accumulate partial payloads for Firestore consolidated workspace doc
    if (!pendingWorkspacePayloads[uid]) {
      pendingWorkspacePayloads[uid] = {};
    }
    pendingWorkspacePayloads[uid] = {
      ...pendingWorkspacePayloads[uid],
      ...partial,
      teacherUid: uid,
      updatedAt: new Date().toISOString(),
    };

    // 3. Debounce the cloud write (2500ms) to coalesce rapid consecutive writes
    if (workspaceDebounceTimers[uid]) {
      clearTimeout(workspaceDebounceTimers[uid]);
    }

    workspaceDebounceTimers[uid] = setTimeout(async () => {
      const payload = pendingWorkspacePayloads[uid];
      delete pendingWorkspacePayloads[uid];
      delete workspaceDebounceTimers[uid];

      if (!payload || isQuotaExceeded()) return;
      try {
        const wsRef = doc(db, 'teacher_workspaces', uid);
        await safeSetDoc(wsRef, sanitizeForFirestore(payload), { merge: true });
        console.log(`[FirestoreService] Debounced workspace write completed for ${uid}`);
      } catch (err) {
        console.warn('[FirestoreService] Debounced workspace write error:', err);
      }
    }, 2500);
  },

  /**
   * Immediately flush any pending debounced workspace write
   */
  async flushWorkspaceSync(uid: string): Promise<void> {
    if (!uid || !pendingWorkspacePayloads[uid] || isQuotaExceeded()) return;
    if (workspaceDebounceTimers[uid]) {
      clearTimeout(workspaceDebounceTimers[uid]);
      delete workspaceDebounceTimers[uid];
    }
    const payload = pendingWorkspacePayloads[uid];
    delete pendingWorkspacePayloads[uid];
    try {
      const wsRef = doc(db, 'teacher_workspaces', uid);
      await safeSetDoc(wsRef, sanitizeForFirestore(payload), { merge: true });
    } catch (err) {
      console.warn('[FirestoreService] Flush workspace write error:', err);
    }
  },

  /**
   * Load all teacher data isolated by UID from Cloud Firestore
   * Optimized with 1-doc fast path (<150ms), instant memory/local cache, and timeout safeguards.
   */
  async loadUserData(uid: string, forceRemote: boolean = false): Promise<UserWorkspaceData> {
    if (!uid) {
      throw new Error('User UID tidak valid untuk memuat data Firestore.');
    }

    // Connect UID to gradual sync manager
    GradualSyncManager.setActiveUid(uid);

    // 0. BROWSER STORAGE INTEGRITY SHIELD:
    // If the browser currently has classes and either has pending unsaved changes
    // or local data was modified after cloud sync, the browser local storage is THE TRUTH!
    // Never allow remote data to overwrite local user inputs.
    const localClasses = Storage.getClasses();
    const hasPendingChanges = GradualSyncManager.getPendingQueue().length > 0;
    if (!forceRemote && localClasses.length > 0 && hasPendingChanges) {
      console.log('[FirestoreService] Local browser has pending changes. Using local browser data and scheduling gradual cloud sync.');
      const localWorkspace: UserWorkspaceData = {
        teacher: Storage.getTeacher(),
        classes: localClasses,
        activeClassId: Storage.getActiveClassId() || localClasses[0]?.id || '',
        students: Storage.getAllStudents(),
        sessions: Storage.getAllSessions(),
        grades: Storage.getAllGrades(),
        agendas: Storage.getAllAgendas(),
        savings: Storage.getAllSavings(),
        isNewUser: false,
      };
      // Keep local cache fresh
      try {
        memoryWorkspaceCache[uid] = { data: localWorkspace, timestamp: Date.now() };
        localStorage.setItem(`smk_ws_cache_${uid}`, JSON.stringify(localWorkspace));
      } catch {}
      GradualSyncManager.triggerGradualSync(1000);
      return localWorkspace;
    }

    // Check instant memory or localStorage cache
    const cachedData = this.getCachedUserData(uid);
    if (!forceRemote && cachedData && Array.isArray(cachedData.classes) && cachedData.classes.length > 0) {
      // Instant return (0ms) so the UI loads without any blocking wait
      // Revalidate in the background asynchronously
      setTimeout(() => {
        const wsRef = doc(db, 'teacher_workspaces', uid);
        getDoc(wsRef)
          .then((wsSnap) => {
            if (wsSnap.exists()) {
              const wsData = wsSnap.data() as any;
              // If local browser data was edited after this cloud snapshot, protect local data!
              if (GradualSyncManager.isLocalNewerThan(wsData?.updatedAt)) {
                console.log('[FirestoreService] Local data is newer than Cloud workspace. Syncing local to Cloud.');
                GradualSyncManager.triggerGradualSync(1200);
                return;
              }
              if (wsData && Array.isArray(wsData.classes) && wsData.classes.length > 0) {
                const updated: UserWorkspaceData = {
                  teacher: wsData.teacher || cachedData.teacher,
                  classes: wsData.classes,
                  activeClassId: wsData.activeClassId || cachedData.activeClassId,
                  students: Array.isArray(wsData.students) ? wsData.students : cachedData.students,
                  sessions: Array.isArray(wsData.sessions) ? wsData.sessions : cachedData.sessions,
                  grades: Array.isArray(wsData.grades) ? wsData.grades : cachedData.grades,
                  agendas: Array.isArray(wsData.agendas) ? wsData.agendas : cachedData.agendas,
                  savings: Array.isArray(wsData.savings) ? wsData.savings : cachedData.savings,
                  isNewUser: false,
                };
                memoryWorkspaceCache[uid] = { data: updated, timestamp: Date.now() };
                localStorage.setItem(`smk_ws_cache_${uid}`, JSON.stringify(updated));
              }
            }
          })
          .catch(() => {});
      }, 100);
      return cachedData;
    }

    const updateLocalCache = (data: UserWorkspaceData) => {
      try {
        const cacheKey = `smk_ws_cache_${uid}`;
        memoryWorkspaceCache[uid] = { data, timestamp: Date.now() };
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (e) {
        console.warn('[FirestoreService] Local cache write warning:', e);
      }
    };

    const fetchFromFirestore = async (): Promise<UserWorkspaceData> => {
      // 1. FAST PATH: Check unified snapshot in /teacher_workspaces/{uid} FIRST (1 document read ~80ms!)
      try {
        const wsRef = doc(db, 'teacher_workspaces', uid);
        const wsSnapPromise = getDoc(wsRef);
        const timeoutWs = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), forceRemote ? 6000 : 2500)
        );
        const wsSnap = await Promise.race([wsSnapPromise, timeoutWs]);

        if (wsSnap && wsSnap.exists()) {
          const wsData = wsSnap.data() as any;
          if (wsData && Array.isArray(wsData.classes) && wsData.classes.length > 0) {
            // If local browser data is newer than Cloud document, preserve local browser data UNLESS forceRemote is true!
            if (!forceRemote && wsData.updatedAt && GradualSyncManager.isLocalNewerThan(wsData.updatedAt)) {
              console.log('[FirestoreService] Local browser data is newer than Cloud workspace. Preserving local data.');
              const localWorkspace: UserWorkspaceData = {
                teacher: Storage.getTeacher(),
                classes: Storage.getClasses(),
                activeClassId: Storage.getActiveClassId() || Storage.getClasses()[0]?.id || '',
                students: Storage.getAllStudents(),
                sessions: Storage.getAllSessions(),
                grades: Storage.getAllGrades(),
                agendas: Storage.getAllAgendas(),
                savings: Storage.getAllSavings(),
                isNewUser: false,
              };
              GradualSyncManager.triggerGradualSync(1500);
              return localWorkspace;
            }
            console.log('[FirestoreService] Fast-path: loaded workspace in 1 single document read');
            const result: UserWorkspaceData = {
              teacher: wsData.teacher || {
                id: 't-' + uid,
                namaGuru: wsData.email?.split('@')[0] || 'Guru SMK',
                nip: '',
                namaSekolah: 'SMK Muhammadiyah Bawang',
                mataPelajaranUtama: wsData.classes[0]?.mataPelajaran || 'Informatika',
                tahunAjaran: '2025/2026',
                semester: 'Ganjil',
                isLoggedIn: true,
                activeClassId: wsData.activeClassId || wsData.classes[0]?.id || '',
              },
              classes: wsData.classes,
              activeClassId: wsData.activeClassId || wsData.classes[0]?.id || '',
              students: Array.isArray(wsData.students) ? wsData.students : [],
              sessions: Array.isArray(wsData.sessions) ? wsData.sessions : [],
              grades: Array.isArray(wsData.grades) ? wsData.grades : [],
              agendas: Array.isArray(wsData.agendas) ? wsData.agendas : [],
              savings: Array.isArray(wsData.savings) ? wsData.savings : Storage.getAllSavings(),
              isNewUser: false,
            };

            // Restore any class-specific grade column headers from workspace document
            try {
              Object.keys(wsData).forEach((key) => {
                if (key.startsWith('gradeHeaders_')) {
                  const cId = key.replace('gradeHeaders_', '');
                  if (Array.isArray(wsData[key]) && wsData[key].length > 0) {
                    Storage.setGradeHeaders(cId, wsData[key]);
                  }
                }
              });
            } catch (hErr) {
              console.warn('[FirestoreService] Header restoration notice:', hErr);
            }

            updateLocalCache(result);
            return result;
          }
        }
      } catch (wsError) {
        console.warn('[FirestoreService] Fast-path workspace check notice:', wsError);
      }

      // 2. SLOW PATH: Subcollections query if teacher_workspaces is not populated yet
      try {
        const teacherDocRef = doc(db, 'users', uid, 'profile', 'teacher');
        const classesColRef = collection(db, 'users', uid, 'classes');
        const studentsColRef = collection(db, 'users', uid, 'students');
        const sessionsColRef = collection(db, 'users', uid, 'attendance_sessions');
        const gradesColRef = collection(db, 'users', uid, 'grades');
        const agendasColRef = collection(db, 'users', uid, 'teaching_agendas');

        const [teacherSnap, classesSnap, studentsSnap, sessionsSnap, gradesSnap, agendasSnap] =
          await Promise.all([
            getDoc(teacherDocRef).catch(() => ({ exists: () => false, data: () => null } as any)),
            getDocs(classesColRef).catch(() => ({ docs: [] } as any)),
            getDocs(studentsColRef).catch(() => ({ docs: [] } as any)),
            getDocs(sessionsColRef).catch(() => ({ docs: [] } as any)),
            getDocs(gradesColRef).catch(() => ({ docs: [] } as any)),
            getDocs(agendasColRef).catch(() => ({ docs: [] } as any)),
          ]);

        const teacherData = teacherSnap.exists()
          ? (teacherSnap.data() as TeacherProfile)
          : null;
        const classesData = classesSnap.docs.map((d: any) => d.data() as ClassRoom);
        const studentsData = studentsSnap.docs.map((d: any) => d.data() as Student);
        const sessionsData = sessionsSnap.docs.map((d: any) => d.data() as AttendanceSession);
        const gradesData = gradesSnap.docs.map((d: any) => d.data() as StudentGrade);
        const agendasData = agendasSnap.docs.map((d: any) => d.data() as TeachingAgenda);

        // Check if user has classes in subcollections
        if (classesData.length > 0) {
          const activeClassId =
            teacherData?.activeClassId || classesData[0]?.id || '';

          const compiled: UserWorkspaceData = {
            teacher: teacherData || {
              id: 't-' + uid,
              namaGuru: 'Guru SMK',
              nip: '',
              namaSekolah: 'SMK Muhammadiyah Bawang',
              mataPelajaranUtama: classesData[0]?.mataPelajaran || 'Informatika',
              tahunAjaran: '2025/2026',
              semester: 'Ganjil',
              isLoggedIn: true,
              activeClassId,
            },
            classes: classesData,
            activeClassId,
            students: studentsData,
            sessions: sessionsData,
            grades: gradesData,
            agendas: agendasData,
            savings: Storage.getAllSavings(),
            isNewUser: false,
          };

          // Cache locally and consolidate in teacher_workspaces in background
          updateLocalCache(compiled);
          if (!isQuotaExceeded()) {
            try {
              const wsRef = doc(db, 'teacher_workspaces', uid);
              safeSetDoc(
                wsRef,
                sanitizeForFirestore({
                  teacherUid: uid,
                  teacher: compiled.teacher,
                  classes: compiled.classes,
                  activeClassId: compiled.activeClassId,
                  students: compiled.students,
                  sessions: compiled.sessions,
                  grades: compiled.grades,
                  agendas: compiled.agendas,
                  savings: compiled.savings,
                  updatedAt: new Date().toISOString(),
                }),
                { merge: true }
              ).catch((e) => console.warn('Background consolidate notice:', e));
            } catch {}
          }

          return compiled;
        }
      } catch (subColErr) {
        console.warn('[FirestoreService] Subcollection query notice:', subColErr);
      }

      // Check local storage before declaring a new user
      const localClasses = Storage.getClasses();
      if (localClasses && localClasses.length > 0) {
        const localWorkspace: UserWorkspaceData = {
          teacher: Storage.getTeacher(),
          classes: localClasses,
          activeClassId: Storage.getActiveClassId() || localClasses[0]?.id || '',
          students: Storage.getAllStudents(),
          sessions: Storage.getAllSessions(),
          grades: Storage.getAllGrades(),
          agendas: Storage.getAllAgendas(),
          savings: Storage.getAllSavings(),
          isNewUser: false,
        };
        updateLocalCache(localWorkspace);
        return localWorkspace;
      }

      // Truly new user or empty database
      return {
        teacher: {
          id: 't-' + uid,
          namaGuru: '',
          nip: '',
          namaSekolah: 'SMK Muhammadiyah Bawang',
          mataPelajaranUtama: 'Informatika & Pemrograman',
          tahunAjaran: '2025/2026',
          semester: 'Ganjil',
          isLoggedIn: true,
        },
        classes: [],
        activeClassId: '',
        students: [],
        sessions: [],
        grades: [],
        agendas: [],
        savings: Storage.getAllSavings(),
        isNewUser: true,
      };
    };

    // Fast Timeout Guard (up to 7.5 seconds if forceRemote, 3 seconds otherwise)
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT_FAST_LOAD')), forceRemote ? 7500 : 3000)
      );
      return await Promise.race([fetchFromFirestore(), timeoutPromise]);
    } catch (err: any) {
      if (cachedData && cachedData.classes?.length > 0) {
        console.warn('[FirestoreService] Cloud load timed out, serving cached data');
        fetchFromFirestore().catch((e) => console.warn('Background sync error:', e));
        return cachedData;
      }
      const localClasses = Storage.getClasses();
      if (localClasses && localClasses.length > 0) {
        return {
          teacher: Storage.getTeacher(),
          classes: localClasses,
          activeClassId: Storage.getActiveClassId() || localClasses[0]?.id || '',
          students: Storage.getAllStudents(),
          sessions: Storage.getAllSessions(),
          grades: Storage.getAllGrades(),
          agendas: Storage.getAllAgendas(),
          savings: Storage.getAllSavings(),
          isNewUser: false,
        };
      }
      return await fetchFromFirestore();
    }
  },

  /**
   * Seeds initial default dataset for a newly registered Google user
   */
  async seedInitialUserData(
    uid: string,
    googleUser: {
      displayName?: string | null;
      email?: string | null;
      photoURL?: string | null;
    }
  ): Promise<UserWorkspaceData> {
    const defaultClasses = Storage.getClasses();
    const defaultStudents = Storage.getAllStudents();
    const defaultSessions = Storage.getAllSessions();
    const defaultGrades = Storage.getAllGrades();

    const teacherProfile: TeacherProfile = {
      id: 't-' + uid,
      namaGuru: googleUser.displayName || 'Guru SMK',
      nip: '198507152010011005',
      namaSekolah: 'SMK Muhammadiyah Bawang',
      mataPelajaranUtama: defaultClasses[0]?.mataPelajaran || 'Informatika',
      tahunAjaran: '2025/2026',
      semester: 'Ganjil',
      isLoggedIn: true,
      email: googleUser.email || '',
      avatarUrl: googleUser.photoURL || '',
      activeClassId: defaultClasses[0]?.id || 'class-1',
    };

    const batch = writeBatch(db);

    // Save profile
    const profileRef = doc(db, 'users', uid, 'profile', 'teacher');
    batch.set(profileRef, sanitizeForFirestore(teacherProfile));

    // Save classes
    defaultClasses.forEach((cls) => {
      const classRef = doc(db, 'users', uid, 'classes', cls.id);
      batch.set(classRef, sanitizeForFirestore({ ...cls, teacherUid: uid }));
    });

    // Save students
    defaultStudents.forEach((std) => {
      const stdRef = doc(db, 'users', uid, 'students', std.id);
      batch.set(stdRef, sanitizeForFirestore({ ...std, teacherUid: uid }));
    });

    // Save sessions
    defaultSessions.forEach((ses) => {
      const sesRef = doc(db, 'users', uid, 'attendance_sessions', ses.id);
      batch.set(sesRef, sanitizeForFirestore({ ...ses, teacherUid: uid }));
    });

    // Save grades
    defaultGrades.forEach((grd) => {
      const grdRef = doc(db, 'users', uid, 'grades', grd.id);
      batch.set(grdRef, sanitizeForFirestore({ ...grd, teacherUid: uid }));
    });

    // Save unified workspace snapshot for instantaneous future loads
    const wsRef = doc(db, 'teacher_workspaces', uid);
    batch.set(
      wsRef,
      sanitizeForFirestore({
        teacherUid: uid,
        email: googleUser.email || '',
        teacher: teacherProfile,
        classes: defaultClasses,
        activeClassId: defaultClasses[0]?.id || 'class-1',
        students: defaultStudents,
        sessions: defaultSessions,
        grades: defaultGrades,
        agendas: [],
        savings: Storage.getAllSavings(),
        updatedAt: new Date().toISOString(),
      })
    );

    if (!isQuotaExceeded()) {
      try {
        await batch.commit();
        console.log(`[FirestoreService] Seeded initial data for user ${uid}`);
      } catch (seedErr) {
        if (isQuotaExceededError(seedErr)) {
          markQuotaExceeded(String(seedErr));
          console.warn('[FirestoreService] Daily quota exceeded during seed. Saved in local storage.');
        } else {
          console.warn('[FirestoreService] Seed commit notice:', seedErr);
        }
      }
    }

    return {
      teacher: teacherProfile,
      classes: defaultClasses,
      activeClassId: defaultClasses[0]?.id || 'class-1',
      students: defaultStudents,
      sessions: defaultSessions,
      grades: defaultGrades,
      savings: Storage.getAllSavings(),
      isNewUser: false,
    };
  },

  /**
   * Save or update Teacher Profile
   */
  async saveTeacherProfile(uid: string, profile: TeacherProfile): Promise<void> {
    this.queueWorkspaceSync(uid, { teacher: profile });
  },

  /**
   * Save or update a ClassRoom
   */
  async saveClass(uid: string, classItem: ClassRoom, allClasses?: ClassRoom[]): Promise<void> {
    const classesList = allClasses || Storage.getClasses();
    this.queueWorkspaceSync(uid, { classes: classesList });
  },

  /**
   * Delete a ClassRoom and its related students, sessions, and grades
   */
  async deleteClass(uid: string, classId: string): Promise<void> {
    const classesList = Storage.getClasses().filter((c) => c.id !== classId);
    const studentsList = Storage.getAllStudents().filter((s) => s.classId !== classId);
    const sessionsList = Storage.getAllSessions().filter((s) => s.classId !== classId);
    const gradesList = Storage.getAllGrades().filter((g) => g.classId !== classId);

    // Update workspace sync & local cache immediately
    this.queueWorkspaceSync(uid, {
      classes: classesList,
      students: studentsList,
      sessions: sessionsList,
      grades: gradesList,
    });
  },

  /**
   * Save or update a Student
   */
  async saveStudent(uid: string, student: Student, allStudents?: Student[]): Promise<void> {
    const studentsList = allStudents || Storage.getAllStudents();
    this.queueWorkspaceSync(uid, { students: studentsList });
  },

  /**
   * Delete a Student and their grade record
   */
  async deleteStudent(uid: string, studentId: string): Promise<void> {
    const studentsList = Storage.getAllStudents().filter((s) => s.id !== studentId);
    const gradesList = Storage.getAllGrades().filter((g) => g.studentId !== studentId);

    this.queueWorkspaceSync(uid, {
      students: studentsList,
      grades: gradesList,
    });
  },

  /**
   * Save multiple students (e.g. from Excel/Spreadsheet import)
   */
  async importStudentsBatch(
    uid: string,
    _students: Student[],
    _newGrades: StudentGrade[],
    _mode: 'replace' | 'append',
    _targetClassId: string
  ): Promise<void> {
    // Update workspace snapshot document (1 consolidated write)
    this.queueWorkspaceSync(uid, {
      students: Storage.getAllStudents(),
      grades: Storage.getAllGrades(),
    });
  },

  /**
   * Save or update Attendance Session (optimistic & workspace sync)
   */
  async saveAttendanceSession(
    uid: string,
    session: AttendanceSession,
    allSessions?: AttendanceSession[]
  ): Promise<void> {
    const sessionsList = allSessions || Storage.getAllSessions();
    this.queueWorkspaceSync(uid, { sessions: sessionsList });
  },

  /**
   * Save multiple Attendance Sessions in batch
   */
  async saveAttendanceSessionsBatch(
    uid: string,
    sessions: AttendanceSession[],
    allSessions?: AttendanceSession[]
  ): Promise<void> {
    if (!sessions || sessions.length === 0) return;
    const sessionsList = allSessions || Storage.getAllSessions();
    this.queueWorkspaceSync(uid, { sessions: sessionsList });
  },

  /**
   * Delete an Attendance Session
   */
  async deleteAttendanceSession(
    uid: string,
    sessionId: string,
    remainingSessions?: AttendanceSession[]
  ): Promise<void> {
    const sessionsList =
      remainingSessions || Storage.getAllSessions().filter((s) => s.id !== sessionId);
    this.queueWorkspaceSync(uid, { sessions: sessionsList });
  },

  /**
   * Save or update Student Grade
   */
  async saveGrade(uid: string, grade: StudentGrade, allGrades?: StudentGrade[]): Promise<void> {
    const gradesList = allGrades || Storage.getAllGrades();
    this.queueWorkspaceSync(uid, { grades: gradesList });
  },

  /**
   * Save Grades in Batch to Cloud Firestore
   * Highly optimized: performs single-document atomic write to unified teacher_workspaces (1 single write!)
   * without burning quota through dozens of individual subcollection writes.
   */
  async saveGradesBatch(
    uid: string,
    grades: StudentGrade[],
    allGrades?: StudentGrade[],
    gradeHeaders?: { classId: string; headers: GradeColumnHeader[] }
  ): Promise<void> {
    if (!uid) return;
    if (!grades || grades.length === 0) return;
    const gradesList = allGrades || Storage.getAllGrades();

    // 1. Instant local memory cache update (0ms)
    this.queueWorkspaceSync(uid, { grades: gradesList });

    if (isQuotaExceeded()) return;

    // 2. High-speed single-document atomic write to consolidated workspace document
    const wsRef = doc(db, 'teacher_workspaces', uid);
    const wsPayload: Record<string, any> = {
      teacherUid: uid,
      grades: gradesList,
      updatedAt: new Date().toISOString(),
    };
    if (gradeHeaders) {
      wsPayload[`gradeHeaders_${gradeHeaders.classId}`] = gradeHeaders.headers;
    }
    await safeSetDoc(wsRef, sanitizeForFirestore(wsPayload), { merge: true });
  },

  /**
   * Save Grade Column Headers (dates & descriptions for 4 columns x 6 months)
   */
  async saveGradeHeaders(
    uid: string,
    classId: string,
    headers: GradeColumnHeader[]
  ): Promise<void> {
    if (!uid) return;
    if (isQuotaExceeded()) return;
    const wsRef = doc(db, 'teacher_workspaces', uid);
    await safeSetDoc(
      wsRef,
      sanitizeForFirestore({
        [`gradeHeaders_${classId}`]: headers,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  },

  /**
   * Get Grade Column Headers from Cloud Firestore
   */
  async getGradeHeaders(
    uid: string,
    classId: string
  ): Promise<GradeColumnHeader[] | null> {
    try {
      const cached = this.getCachedUserData(uid);
      if (cached && (cached as any)[`gradeHeaders_${classId}`]) {
        return (cached as any)[`gradeHeaders_${classId}`];
      }
      const wsRef = doc(db, 'teacher_workspaces', uid);
      const wsSnap = await getDoc(wsRef);
      if (wsSnap.exists()) {
        const wsData = wsSnap.data();
        if (wsData && wsData[`gradeHeaders_${classId}`]) {
          return wsData[`gradeHeaders_${classId}`];
        }
      }
      const docRef = doc(db, 'users', uid, 'grade_headers', classId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data && Array.isArray(data.headers)) {
          return data.headers;
        }
      }
      return null;
    } catch (err) {
      console.error('Error fetching grade headers from Firestore:', err);
      return null;
    }
  },

  /**
   * Save or update Teaching Agenda (Persisted in subcollection and unified workspace)
   */
  async saveAgenda(
    uid: string,
    agenda: TeachingAgenda,
    allAgendas?: TeachingAgenda[]
  ): Promise<void> {
    let updatedList: TeachingAgenda[];
    if (allAgendas && allAgendas.length > 0) {
      updatedList = allAgendas;
    } else {
      const current = Storage.getAllAgendas();
      const existingIdx = current.findIndex((a) => a.id === agenda.id);
      if (existingIdx >= 0) {
        current[existingIdx] = agenda;
        updatedList = current;
      } else {
        updatedList = [agenda, ...current];
      }
    }

    this.queueWorkspaceSync(uid, { agendas: updatedList });
    if (isQuotaExceeded()) return;

    const wsRef = doc(db, 'teacher_workspaces', uid);
    await safeSetDoc(
      wsRef,
      sanitizeForFirestore({
        teacherUid: uid,
        agendas: updatedList,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  },

  /**
   * Delete Teaching Agenda (from subcollection & workspace snapshot)
   */
  async deleteAgenda(
    uid: string,
    agendaId: string,
    remainingAgendas?: TeachingAgenda[]
  ): Promise<void> {
    const updatedList =
      remainingAgendas || Storage.getAllAgendas().filter((a) => a.id !== agendaId);
    this.queueWorkspaceSync(uid, { agendas: updatedList });
  },

  /**
   * Reset all user data back to default SMK demo dataset
   */
  async resetUserData(
    uid: string,
    googleUser: {
      displayName?: string | null;
      email?: string | null;
      photoURL?: string | null;
    }
  ): Promise<UserWorkspaceData> {
    // 1. Delete all current documents in user's subcollections
    const collectionsToClear = [
      'classes',
      'students',
      'attendance_sessions',
      'grades',
    ];

    for (const colName of collectionsToClear) {
      if (isQuotaExceeded()) break;
      const colRef = collection(db, 'users', uid, colName);
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach((d) => batch.delete(d.ref));
        try {
          await batch.commit();
        } catch (err) {
          if (isQuotaExceededError(err)) {
            markQuotaExceeded(String(err));
            break;
          }
        }
      }
    }

    // 2. Re-seed default
    return await this.seedInitialUserData(uid, googleUser);
  },

  /**
   * Save student saving transactions to Cloud Firestore
   */
  async saveSavingsBatch(
    uid: string,
    savings: SavingTransaction[],
    allSavings?: SavingTransaction[]
  ): Promise<void> {
    if (!uid) return;
    const targetSavings = allSavings || savings;

    // 1. Debounced unified workspace document & instant local cache update (0ms)
    this.queueWorkspaceSync(uid, { savings: targetSavings });

    if (isQuotaExceeded()) return;

    const wsRef = doc(db, 'teacher_workspaces', uid);
    await safeSetDoc(
      wsRef,
      sanitizeForFirestore({
        teacherUid: uid,
        savings: targetSavings,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  },

  /**
   * Save full restored workspace to Cloud Firestore
   */
  async saveFullWorkspace(
    uid: string,
    fullData: {
      teacher?: TeacherProfile;
      classes?: ClassRoom[];
      activeClassId?: string;
      students?: Student[];
      sessions?: AttendanceSession[];
      grades?: StudentGrade[];
      agendas?: TeachingAgenda[];
      savings?: SavingTransaction[];
    }
  ): Promise<void> {
    if (!uid) return;

    // Update local cache
    try {
      const cacheKey = `smk_ws_cache_${uid}`;
      localStorage.setItem(cacheKey, JSON.stringify(fullData));
    } catch {}

    if (isQuotaExceeded()) return;

    const wsRef = doc(db, 'teacher_workspaces', uid);
    await safeSetDoc(
      wsRef,
      sanitizeForFirestore({
        teacherUid: uid,
        teacher: fullData.teacher || Storage.getTeacher(),
        classes: fullData.classes || Storage.getClasses(),
        activeClassId: fullData.activeClassId || Storage.getActiveClassId(),
        students: fullData.students || Storage.getAllStudents(),
        sessions: fullData.sessions || Storage.getAllSessions(),
        grades: fullData.grades || Storage.getAllGrades(),
        agendas: fullData.agendas || Storage.getAllAgendas(),
        savings: fullData.savings || Storage.getAllSavings(),
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
    GradualSyncManager.markCloudSynced();
  },

  /**
   * Broadcast all current local browser data to any opened preview tabs/windows (0ms latency)
   */
  broadcastAllLocalPreviews(teacherUid: string): void {
    if (typeof window === 'undefined') return;
    try {
      const teacher = Storage.getTeacher();
      const classes = Storage.getClasses();
      const students = Storage.getAllStudents();
      const sessions = Storage.getAllSessions();
      const grades = Storage.getAllGrades();
      const savings = Storage.getAllSavings();

      classes.forEach((cls) => {
        const classStudents = students.filter((s) => s.classId === cls.id);
        const classSessions = sessions.filter((s) => s.classId === cls.id);
        const classGrades = grades.filter((g) => g.classId === cls.id);
        const classSavings = savings.filter(
          (t) => t.classId === cls.id || classStudents.some((s) => s.id === t.studentId)
        );

        const absShareId = this.getPublicAbsensiShareId(teacherUid, cls.id);
        const nilShareId = this.getPublicNilaiShareId(teacherUid, cls.id);
        const tbShareId = this.getPublicTabunganShareId(teacherUid, cls.id);

        const isAbsOpen = typeof window !== 'undefined'
          ? localStorage.getItem(`pub_access_abs_${cls.id}`) === 'true'
          : false;
        const isNilOpen = typeof window !== 'undefined'
          ? localStorage.getItem(`pub_access_nil_${cls.id}`) === 'true'
          : false;
        const isTbOpen = typeof window !== 'undefined'
          ? localStorage.getItem(`pub_access_tb_${cls.id}`) === 'true'
          : false;

        broadcastPreviewUpdate('absensi', absShareId, cls.id, {
          shareId: absShareId,
          classId: cls.id,
          className: cls.namaKelas,
          mataPelajaran: cls.mataPelajaran || teacher.mataPelajaranUtama || 'Umum',
          schoolName: teacher.namaSekolah || 'SMK Muhammadiyah Bawang',
          waliKelas: teacher.namaGuru || 'Guru Pengampu',
          nip: teacher.nip || '',
          academicYear: teacher.tahunAjaran || '2025/2026',
          semester: teacher.semester || 'Ganjil',
          teacherUid,
          updatedAt: new Date().toISOString(),
          students: isAbsOpen ? classStudents : [],
          sessions: isAbsOpen ? classSessions : [],
          isPublicEnabled: isAbsOpen,
          allowClassRecap: true,
        });

        broadcastPreviewUpdate('nilai', nilShareId, cls.id, {
          shareId: nilShareId,
          classId: cls.id,
          className: cls.namaKelas,
          mataPelajaran: cls.mataPelajaran || teacher.mataPelajaranUtama || 'Umum',
          schoolName: teacher.namaSekolah || 'SMK Muhammadiyah Bawang',
          waliKelas: teacher.namaGuru || 'Guru Pengampu',
          academicYear: teacher.tahunAjaran || '2025/2026',
          semester: teacher.semester || 'Ganjil',
          teacherUid,
          kkm: cls.kkm || 75,
          updatedAt: new Date().toISOString(),
          students: isNilOpen ? classStudents : [],
          grades: isNilOpen ? classGrades : [],
          isPublicEnabled: isNilOpen,
        });

        broadcastPreviewUpdate('tabungan', tbShareId, cls.id, {
          shareId: tbShareId,
          classId: cls.id,
          className: cls.namaKelas,
          schoolName: teacher.namaSekolah || 'SMK Muhammadiyah Bawang',
          waliKelas: teacher.namaGuru || 'Guru Pengampu',
          academicYear: teacher.tahunAjaran || '2025/2026',
          teacherUid,
          updatedAt: new Date().toISOString(),
          students: isTbOpen ? classStudents : [],
          savings: isTbOpen ? classSavings : [],
          isPublicEnabled: isTbOpen,
        });
      });
    } catch (e) {
      console.warn('[FirestoreService] broadcastAllLocalPreviews error:', e);
    }
  },

  /**
   * Fast bidirectional Cloud & Preview snapshot sync.
   * Immediately generates and deploys public snapshot documents for all active teacher classes
   * into public_absensi, public_nilai, and public_tabungan, plus Cloud Run cache invalidation,
   * so public link previews immediately show new data.
   */
  async syncAllPublicSnapshots(
    teacherUid: string,
    workspaceData?: {
      teacher?: TeacherProfile;
      classes?: ClassRoom[];
      students?: Student[];
      sessions?: AttendanceSession[];
      grades?: StudentGrade[];
      savings?: SavingTransaction[];
    }
  ): Promise<{ syncedClasses: number; totalSnapshots: number }> {
    if (!teacherUid) return { syncedClasses: 0, totalSnapshots: 0 };

    const teacher = workspaceData?.teacher || Storage.getTeacher();
    const classes = workspaceData?.classes || Storage.getClasses();
    const students = workspaceData?.students || Storage.getAllStudents();
    const sessions = workspaceData?.sessions || Storage.getAllSessions();
    const grades = workspaceData?.grades || Storage.getAllGrades();
    const savings = workspaceData?.savings || Storage.getAllSavings();

    if (!classes || classes.length === 0) return { syncedClasses: 0, totalSnapshots: 0 };

    let count = 0;
    const nowIso = new Date().toISOString();

    for (const cls of classes) {
      try {
        const classStudents = students.filter((s) => s.classId === cls.id);
        const classSessions = sessions.filter((s) => s.classId === cls.id);
        const classGrades = grades.filter((g) => g.classId === cls.id);
        const classSavings = savings.filter(
          (t) => t.classId === cls.id || classStudents.some((s) => s.id === t.studentId)
        );

        // Deterministic Share IDs
        const absShareId = this.getPublicAbsensiShareId(teacherUid, cls.id);
        const nilShareId = this.getPublicNilaiShareId(teacherUid, cls.id);
        const tbShareId = this.getPublicTabunganShareId(teacherUid, cls.id);

        const isAbsOpen = typeof window !== 'undefined'
          ? localStorage.getItem(`pub_access_abs_${cls.id}`) === 'true'
          : false;
        const isNilOpen = typeof window !== 'undefined'
          ? localStorage.getItem(`pub_access_nil_${cls.id}`) === 'true'
          : false;
        const isTbOpen = typeof window !== 'undefined'
          ? localStorage.getItem(`pub_access_tb_${cls.id}`) === 'true'
          : false;

        // 1. Absensi Payload
        const absPayload: PublicAbsensiData = {
          shareId: absShareId,
          classId: cls.id,
          className: cls.namaKelas,
          mataPelajaran: cls.mataPelajaran || teacher.mataPelajaranUtama || 'Umum',
          schoolName: teacher.namaSekolah || 'SMK Muhammadiyah Bawang',
          waliKelas: teacher.namaGuru || 'Guru Pengampu',
          nip: teacher.nip || '',
          academicYear: teacher.tahunAjaran || '2025/2026',
          semester: teacher.semester || 'Ganjil',
          teacherUid,
          updatedAt: nowIso,
          students: isAbsOpen ? classStudents.map((s) => ({
            id: s.id,
            no: s.no,
            nisn: s.nisn || '',
            nama: s.nama,
            gender: s.gender,
          })) : [],
          sessions: isAbsOpen ? classSessions : [],
          isPublicEnabled: isAbsOpen,
          allowClassRecap: true,
        };

        // 2. Nilai Payload
        const nilPayload: PublicNilaiData = {
          shareId: nilShareId,
          classId: cls.id,
          className: cls.namaKelas,
          mataPelajaran: cls.mataPelajaran || teacher.mataPelajaranUtama || 'Umum',
          schoolName: teacher.namaSekolah || 'SMK Muhammadiyah Bawang',
          waliKelas: teacher.namaGuru || 'Guru Pengampu',
          academicYear: teacher.tahunAjaran || '2025/2026',
          semester: teacher.semester || 'Ganjil',
          teacherUid,
          kkm: cls.kkm || 75,
          updatedAt: nowIso,
          students: isNilOpen ? classStudents.map((s) => ({
            id: s.id,
            no: s.no,
            nisn: s.nisn || '',
            nama: s.nama,
            gender: s.gender,
          })) : [],
          grades: isNilOpen ? classGrades : [],
          isPublicEnabled: isNilOpen,
        };

        // 3. Tabungan Payload
        const tbPayload: PublicTabunganData = {
          shareId: tbShareId,
          classId: cls.id,
          className: cls.namaKelas,
          schoolName: teacher.namaSekolah || 'SMK Muhammadiyah Bawang',
          waliKelas: teacher.namaGuru || 'Guru Pengampu',
          academicYear: teacher.tahunAjaran || '2025/2026',
          semester: teacher.semester || 'Ganjil',
          teacherUid,
          updatedAt: nowIso,
          students: isTbOpen ? classStudents.map((s) => ({
            id: s.id,
            no: s.no,
            nisn: s.nisn || '',
            nama: s.nama,
          })) : [],
          savings: isTbOpen ? classSavings : [],
          isPublicEnabled: isTbOpen,
        };

        // Broadcast to preview channels with 0ms delay immediately
        broadcastPreviewUpdate('absensi', absShareId, cls.id, absPayload);
        broadcastPreviewUpdate('nilai', nilShareId, cls.id, nilPayload);
        broadcastPreviewUpdate('tabungan', tbShareId, cls.id, tbPayload);

        // Write snapshots to Firestore in parallel
        await Promise.allSettled([
          this.publishPublicAbsensi(absPayload),
          this.publishPublicNilai(nilPayload),
          this.publishPublicTabungan(tbPayload),
        ]);

        count += 3;
      } catch (clsErr) {
        console.warn(`[FirestoreService] Error syncing public snapshot for class ${cls.id}:`, clsErr);
      }
    }

    // Invalidate server cache
    if (typeof window !== 'undefined') {
      try {
        await fetch('/api/public/cache/invalidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
      } catch {}
    }

    return { syncedClasses: classes.length, totalSnapshots: count };
  },

  /**
   * Helper to derive deterministic public share ID for a teacher and class
   */
  getPublicTabunganShareId(teacherUid: string, classId: string): string {
    const cleanUid = (teacherUid || 'demo').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
    const cleanClass = (classId || 'default').replace(/[^a-zA-Z0-9]/g, '');
    return `tb_${cleanUid}_${cleanClass}`;
  },

  /**
   * Publish or update class savings snapshot to public collection for parents
   */
  async publishPublicTabungan(data: PublicTabunganData): Promise<void> {
    if (!data.shareId) {
      throw new Error('ID tautan publik tabungan tidak valid.');
    }
    const sanitized = sanitizeForFirestore({
      ...data,
      updatedAt: new Date().toISOString(),
    });

    const cleanClass = data.classId ? data.classId.replace(/[^a-zA-Z0-9_-]/g, '') : '';
    const cleanClassNoHyphen = data.classId ? data.classId.replace(/[^a-zA-Z0-9]/g, '') : '';

    // Instant local cache and broadcast channel for immediate zero-latency preview
    if (typeof window !== 'undefined') {
      broadcastPreviewUpdate('tabungan', data.shareId, data.classId, sanitized);
      try {
        localStorage.setItem(`cache_pub_tb_${data.shareId}`, JSON.stringify(sanitized));
        if (cleanClass) localStorage.setItem(`cache_pub_tb_tb_${cleanClass}`, JSON.stringify(sanitized));
        if (cleanClassNoHyphen) localStorage.setItem(`cache_pub_tb_tb_${cleanClassNoHyphen}`, JSON.stringify(sanitized));
      } catch {}
    }

    if (isQuotaExceeded()) return;

    const publicRef = doc(db, 'public_tabungan', data.shareId);
    await safeSetDoc(publicRef, sanitized, { merge: true });
  },

  /**
   * Fetch public tabungan data once
   */
  async getPublicTabungan(shareId: string): Promise<PublicTabunganData | null> {
    if (!shareId) return null;
    const publicRef = doc(db, 'public_tabungan', shareId);
    const snap = await getDoc(publicRef);
    if (snap.exists()) {
      return snap.data() as PublicTabunganData;
    }
    // Try fallback alias if shareId was composite
    if (shareId.startsWith('tb_')) {
      const parts = shareId.split('_');
      if (parts.length > 2) {
        const classPart = parts.slice(2).join('_');
        const cleanClass = classPart.replace(/[^a-zA-Z0-9_-]/g, '');
        const aliasRef = doc(db, 'public_tabungan', `tb_${cleanClass}`);
        const aliasSnap = await getDoc(aliasRef);
        if (aliasSnap.exists()) {
          return aliasSnap.data() as PublicTabunganData;
        }
        const noHyphen = cleanClass.replace(/[^a-zA-Z0-9]/g, '');
        if (noHyphen !== cleanClass) {
          const nhSnap = await getDoc(doc(db, 'public_tabungan', `tb_${noHyphen}`));
          if (nhSnap.exists()) return nhSnap.data() as PublicTabunganData;
        }
      }
    }
    return null;
  },

  /**
   * Real-time listener for public tabungan data (used by parents view)
   */
  subscribePublicTabungan(
    shareId: string,
    onUpdate: (data: PublicTabunganData | null) => void,
    onError?: (err: any) => void
  ): () => void {
    if (!shareId) {
      onUpdate(null);
      return () => {};
    }

    // 1. Instant local/session cache delivery (0ms instant UI load)
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`cache_pub_tb_${shareId}`);
        if (cached) {
          onUpdate(JSON.parse(cached));
        } else if (shareId.includes('_')) {
          const parts = shareId.split('_');
          const lastPart = parts[parts.length - 1];
          const aliasCached = localStorage.getItem(`cache_pub_tb_tb_${lastPart}`);
          if (aliasCached) {
            onUpdate(JSON.parse(aliasCached));
          }
        }
      } catch {}
    }

    const publicRef = doc(db, 'public_tabungan', shareId);
    let fallbackUnsub: (() => void) | null = null;
    let hasLoadedCloudData = false;

    const saveToCache = (d: PublicTabunganData) => {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`cache_pub_tb_${shareId}`, JSON.stringify(d));
          if (d.classId) {
            const cleanC = d.classId.replace(/[^a-zA-Z0-9_-]/g, '');
            localStorage.setItem(`cache_pub_tb_tb_${cleanC}`, JSON.stringify(d));
          }
        } catch {}
      }
    };

    const primaryUnsub = onSnapshot(
      publicRef,
      (snapshot) => {
        if (snapshot.exists()) {
          hasLoadedCloudData = true;
          const fresh = snapshot.data() as PublicTabunganData;
          saveToCache(fresh);
          onUpdate(fresh);
        } else {
          // If primary shareId is not found, try fallback class alias snapshot
          if (!hasLoadedCloudData && shareId.startsWith('tb_')) {
            const parts = shareId.split('_');
            if (parts.length > 2) {
              const classPart = parts.slice(2).join('_');
              const cleanPart = classPart.replace(/[^a-zA-Z0-9_-]/g, '');
              const aliasRef = doc(db, 'public_tabungan', `tb_${cleanPart}`);
              if (!fallbackUnsub) {
                fallbackUnsub = onSnapshot(
                  aliasRef,
                  (aliasSnap) => {
                    if (aliasSnap.exists()) {
                      hasLoadedCloudData = true;
                      const aliasData = aliasSnap.data() as PublicTabunganData;
                      saveToCache(aliasData);
                      onUpdate(aliasData);
                    } else {
                      const noHyphen = cleanPart.replace(/[^a-zA-Z0-9]/g, '');
                      if (noHyphen !== cleanPart) {
                        getDoc(doc(db, 'public_tabungan', `tb_${noHyphen}`)).then((nhSnap) => {
                          if (nhSnap.exists()) {
                            const nhData = nhSnap.data() as PublicTabunganData;
                            saveToCache(nhData);
                            onUpdate(nhData);
                          } else {
                            onUpdate(null);
                          }
                        }).catch(() => onUpdate(null));
                      } else {
                        onUpdate(null);
                      }
                    }
                  },
                  () => onUpdate(null)
                );
              }
              return;
            }
          }
          onUpdate(null);
        }
      },
      (error) => {
        if (isQuotaExceededError(error)) {
          markQuotaExceeded();
        } else {
          console.error('[FirestoreService] subscribePublicTabungan error:', error);
        }
        if (onError) onError(error);
      }
    );

    return () => {
      primaryUnsub();
      if (fallbackUnsub) {
        fallbackUnsub();
      }
    };
  },

  /**
   * Deterministic share ID generator for public attendance link
   */
  getPublicAbsensiShareId(teacherUid: string, classId: string): string {
    const cleanUid = (teacherUid || 'demo').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
    const cleanClass = (classId || 'default').replace(/[^a-zA-Z0-9_-]/g, '');
    return `abs_${cleanUid}_${cleanClass}`;
  },

  /**
   * Publish or update class attendance snapshot to public collection for parents
   */
  async publishPublicAbsensi(data: PublicAbsensiData): Promise<void> {
    if (!data.shareId) {
      throw new Error('ID tautan publik absensi tidak valid.');
    }
    const sanitized = sanitizeForFirestore({
      ...data,
      updatedAt: new Date().toISOString(),
    });

    const cleanClass = data.classId ? data.classId.replace(/[^a-zA-Z0-9_-]/g, '') : '';
    const cleanClassNoHyphen = data.classId ? data.classId.replace(/[^a-zA-Z0-9]/g, '') : '';

    // Instant local cache and broadcast channel for immediate zero-latency preview (0ms)
    if (typeof window !== 'undefined') {
      broadcastPreviewUpdate('absensi', data.shareId, data.classId, sanitized);
      try {
        localStorage.setItem(`cache_pub_abs_${data.shareId}`, JSON.stringify(sanitized));
        if (cleanClass) localStorage.setItem(`cache_pub_abs_abs_${cleanClass}`, JSON.stringify(sanitized));
        if (cleanClassNoHyphen) localStorage.setItem(`cache_pub_abs_abs_${cleanClassNoHyphen}`, JSON.stringify(sanitized));
      } catch {}
    }

    if (isQuotaExceeded()) return;

    const publicRef = doc(db, 'public_absensi', data.shareId);
    await safeSetDoc(publicRef, sanitized, { merge: true });
  },

  /**
   * Fetch public attendance data once
   */
  async getPublicAbsensi(shareId: string): Promise<PublicAbsensiData | null> {
    if (!shareId) return null;
    const publicRef = doc(db, 'public_absensi', shareId);
    const snap = await getDoc(publicRef);
    if (snap.exists()) {
      return snap.data() as PublicAbsensiData;
    }
    // Try fallback alias if shareId was composite
    if (shareId.startsWith('abs_')) {
      const parts = shareId.split('_');
      if (parts.length > 2) {
        const classPart = parts.slice(2).join('_');
        const cleanClass = classPart.replace(/[^a-zA-Z0-9_-]/g, '');
        const aliasRef = doc(db, 'public_absensi', `abs_${cleanClass}`);
        const aliasSnap = await getDoc(aliasRef);
        if (aliasSnap.exists()) {
          return aliasSnap.data() as PublicAbsensiData;
        }
        const noHyphen = cleanClass.replace(/[^a-zA-Z0-9]/g, '');
        if (noHyphen !== cleanClass) {
          const nhSnap = await getDoc(doc(db, 'public_absensi', `abs_${noHyphen}`));
          if (nhSnap.exists()) return nhSnap.data() as PublicAbsensiData;
        }
      }
    }
    return null;
  },

  /**
   * Real-time listener for public attendance data (used by parents view)
   */
  subscribePublicAbsensi(
    shareId: string,
    onUpdate: (data: PublicAbsensiData | null) => void,
    onError?: (err: any) => void
  ): () => void {
    if (!shareId) {
      onUpdate(null);
      return () => {};
    }

    // 1. Instant local/session cache delivery (0ms instant UI load)
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`cache_pub_abs_${shareId}`);
        if (cached) {
          onUpdate(JSON.parse(cached));
        } else if (shareId.includes('_')) {
          const parts = shareId.split('_');
          const lastPart = parts[parts.length - 1];
          const aliasCached = localStorage.getItem(`cache_pub_abs_abs_${lastPart}`);
          if (aliasCached) {
            onUpdate(JSON.parse(aliasCached));
          }
        }
      } catch {}
    }

    const publicRef = doc(db, 'public_absensi', shareId);
    let fallbackUnsub: (() => void) | null = null;
    let hasLoadedCloudData = false;

    const saveToCache = (d: PublicAbsensiData) => {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`cache_pub_abs_${shareId}`, JSON.stringify(d));
          if (d.classId) {
            const cleanC = d.classId.replace(/[^a-zA-Z0-9_-]/g, '');
            localStorage.setItem(`cache_pub_abs_abs_${cleanC}`, JSON.stringify(d));
          }
        } catch {}
      }
    };

    const primaryUnsub = onSnapshot(
      publicRef,
      (snapshot) => {
        if (snapshot.exists()) {
          hasLoadedCloudData = true;
          const fresh = snapshot.data() as PublicAbsensiData;
          saveToCache(fresh);
          onUpdate(fresh);
        } else {
          // If primary shareId is not found, try fallback class alias snapshot
          if (!hasLoadedCloudData && shareId.startsWith('abs_')) {
            const parts = shareId.split('_');
            if (parts.length > 2) {
              const classPart = parts.slice(2).join('_');
              const cleanPart = classPart.replace(/[^a-zA-Z0-9_-]/g, '');
              const aliasRef = doc(db, 'public_absensi', `abs_${cleanPart}`);
              if (!fallbackUnsub) {
                fallbackUnsub = onSnapshot(
                  aliasRef,
                  (aliasSnap) => {
                    if (aliasSnap.exists()) {
                      hasLoadedCloudData = true;
                      const aliasData = aliasSnap.data() as PublicAbsensiData;
                      saveToCache(aliasData);
                      onUpdate(aliasData);
                    } else {
                      const noHyphen = cleanPart.replace(/[^a-zA-Z0-9]/g, '');
                      if (noHyphen !== cleanPart) {
                        getDoc(doc(db, 'public_absensi', `abs_${noHyphen}`)).then((nhSnap) => {
                          if (nhSnap.exists()) {
                            const nhData = nhSnap.data() as PublicAbsensiData;
                            saveToCache(nhData);
                            onUpdate(nhData);
                          } else {
                            onUpdate(null);
                          }
                        }).catch(() => onUpdate(null));
                      } else {
                        onUpdate(null);
                      }
                    }
                  },
                  () => onUpdate(null)
                );
              }
              return;
            }
          }
          onUpdate(null);
        }
      },
      (error) => {
        if (isQuotaExceededError(error)) {
          markQuotaExceeded();
        } else {
          console.error('[FirestoreService] subscribePublicAbsensi error:', error);
        }
        if (onError) onError(error);
      }
    );

    return () => {
      primaryUnsub();
      if (fallbackUnsub) {
        fallbackUnsub();
      }
    };
  },

  /**
   * Deterministic share ID generator for public grade preview and recap link
   */
  getPublicNilaiShareId(teacherUid: string, classId: string): string {
    const cleanUid = (teacherUid || 'demo').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
    const cleanClass = (classId || 'default').replace(/[^a-zA-Z0-9_-]/g, '');
    return `nil_${cleanUid}_${cleanClass}`;
  },

  /**
   * Publish or update student grades snapshot to public collection for students & parents
   */
  async publishPublicNilai(data: PublicNilaiData): Promise<void> {
    if (!data.shareId) {
      throw new Error('ID tautan publik nilai tidak valid.');
    }

    // Normalize monthly grades if present so formatif 1..8 and sumatifs are always populated
    const normalizedGrades = (data.grades || []).map((g) => {
      const m = g.monthlyGrades || {};
      return {
        ...g,
        formatif1: g.formatif1 ?? (m['m0_c0'] !== undefined ? Number(m['m0_c0']) : null),
        formatif2: g.formatif2 ?? (m['m0_c1'] !== undefined ? Number(m['m0_c1']) : null),
        formatif3: g.formatif3 ?? (m['m0_c2'] !== undefined ? Number(m['m0_c2']) : null),
        formatif4: g.formatif4 ?? (m['m0_c3'] !== undefined ? Number(m['m0_c3']) : null),
        formatif5: g.formatif5 ?? (m['m1_c0'] !== undefined ? Number(m['m1_c0']) : null),
        formatif6: g.formatif6 ?? (m['m1_c1'] !== undefined ? Number(m['m1_c1']) : null),
        formatif7: g.formatif7 ?? (m['m1_c2'] !== undefined ? Number(m['m1_c2']) : null),
        formatif8: g.formatif8 ?? (m['m1_c3'] !== undefined ? Number(m['m1_c3']) : null),
        sumatifTengah:
          g.sumatifTengah ??
          (m['sumatif_tengah'] !== undefined ? Number(m['sumatif_tengah']) : null),
        sumatifAkhir:
          g.sumatifAkhir ??
          (m['sumatif_akhir'] !== undefined ? Number(m['sumatif_akhir']) : null),
        monthlyGrades: m,
      };
    });

    const sanitized = sanitizeForFirestore({
      ...data,
      grades: normalizedGrades,
      updatedAt: new Date().toISOString(),
    });

    const cleanClass = data.classId ? data.classId.replace(/[^a-zA-Z0-9_-]/g, '') : '';
    const cleanClassNoHyphen = data.classId ? data.classId.replace(/[^a-zA-Z0-9]/g, '') : '';

    // Instant local cache and broadcast channel for immediate zero-latency preview
    if (typeof window !== 'undefined') {
      broadcastPreviewUpdate('nilai', data.shareId, data.classId, sanitized);
      try {
        localStorage.setItem(`cache_pub_nil_${data.shareId}`, JSON.stringify(sanitized));
        if (cleanClass) localStorage.setItem(`cache_pub_nil_nil_${cleanClass}`, JSON.stringify(sanitized));
        if (cleanClassNoHyphen) localStorage.setItem(`cache_pub_nil_nil_${cleanClassNoHyphen}`, JSON.stringify(sanitized));
      } catch {}
    }

    if (isQuotaExceeded()) return;

    const publicRef = doc(db, 'public_nilai', data.shareId);
    await safeSetDoc(publicRef, sanitized, { merge: true });
  },

  /**
   * Fetch public grades data once
   */
  async getPublicNilai(shareId: string): Promise<PublicNilaiData | null> {
    if (!shareId) return null;
    const publicRef = doc(db, 'public_nilai', shareId);
    const snap = await getDoc(publicRef);
    if (snap.exists()) {
      return snap.data() as PublicNilaiData;
    }
    // Try fallback alias if shareId was composite
    if (shareId.startsWith('nil_')) {
      const parts = shareId.split('_');
      if (parts.length > 2) {
        const classPart = parts.slice(2).join('_');
        const cleanClass = classPart.replace(/[^a-zA-Z0-9_-]/g, '');
        const aliasRef = doc(db, 'public_nilai', `nil_${cleanClass}`);
        const aliasSnap = await getDoc(aliasRef);
        if (aliasSnap.exists()) {
          return aliasSnap.data() as PublicNilaiData;
        }
        const noHyphen = cleanClass.replace(/[^a-zA-Z0-9]/g, '');
        if (noHyphen !== cleanClass) {
          const nhSnap = await getDoc(doc(db, 'public_nilai', `nil_${noHyphen}`));
          if (nhSnap.exists()) return nhSnap.data() as PublicNilaiData;
        }
      }
    }
    return null;
  },

  /**
   * Real-time listener for public grades data (used by students & parents view)
   */
  subscribePublicNilai(
    shareId: string,
    onUpdate: (data: PublicNilaiData | null) => void,
    onError?: (err: any) => void
  ): () => void {
    if (!shareId) {
      onUpdate(null);
      return () => {};
    }

    // 1. Instant local/session cache delivery (0ms instant UI load)
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`cache_pub_nil_${shareId}`);
        if (cached) {
          onUpdate(JSON.parse(cached));
        } else if (shareId.includes('_')) {
          const parts = shareId.split('_');
          const lastPart = parts[parts.length - 1];
          const aliasCached = localStorage.getItem(`cache_pub_nil_nil_${lastPart}`);
          if (aliasCached) {
            onUpdate(JSON.parse(aliasCached));
          }
        }
      } catch {}
    }

    const publicRef = doc(db, 'public_nilai', shareId);
    let fallbackUnsub: (() => void) | null = null;
    let hasLoadedCloudData = false;

    const saveToCache = (d: PublicNilaiData) => {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`cache_pub_nil_${shareId}`, JSON.stringify(d));
          if (d.classId) {
            const cleanC = d.classId.replace(/[^a-zA-Z0-9_-]/g, '');
            localStorage.setItem(`cache_pub_nil_nil_${cleanC}`, JSON.stringify(d));
          }
        } catch {}
      }
    };

    const primaryUnsub = onSnapshot(
      publicRef,
      (snapshot) => {
        if (snapshot.exists()) {
          hasLoadedCloudData = true;
          const fresh = snapshot.data() as PublicNilaiData;
          saveToCache(fresh);
          onUpdate(fresh);
        } else {
          // If primary shareId is not found, try fallback class alias snapshot
          if (!hasLoadedCloudData && shareId.startsWith('nil_')) {
            const parts = shareId.split('_');
            if (parts.length > 2) {
              const classPart = parts.slice(2).join('_');
              const cleanPart = classPart.replace(/[^a-zA-Z0-9_-]/g, '');
              const aliasRef = doc(db, 'public_nilai', `nil_${cleanPart}`);
              if (!fallbackUnsub) {
                fallbackUnsub = onSnapshot(
                  aliasRef,
                  (aliasSnap) => {
                    if (aliasSnap.exists()) {
                      hasLoadedCloudData = true;
                      const aliasData = aliasSnap.data() as PublicNilaiData;
                      saveToCache(aliasData);
                      onUpdate(aliasData);
                    } else {
                      const noHyphen = cleanPart.replace(/[^a-zA-Z0-9]/g, '');
                      if (noHyphen !== cleanPart) {
                        getDoc(doc(db, 'public_nilai', `nil_${noHyphen}`)).then((nhSnap) => {
                          if (nhSnap.exists()) {
                            const nhData = nhSnap.data() as PublicNilaiData;
                            saveToCache(nhData);
                            onUpdate(nhData);
                          } else {
                            onUpdate(null);
                          }
                        }).catch(() => onUpdate(null));
                      } else {
                        onUpdate(null);
                      }
                    }
                  },
                  () => onUpdate(null)
                );
              }
              return;
            }
          }
          onUpdate(null);
        }
      },
      (error) => {
        if (isQuotaExceededError(error)) {
          markQuotaExceeded();
        } else {
          console.error('[FirestoreService] subscribePublicNilai error:', error);
        }
        if (onError) onError(error);
      }
    );

    return () => {
      primaryUnsub();
      if (fallbackUnsub) {
        fallbackUnsub();
      }
    };
  },
};

export interface PublicNilaiData {
  shareId: string;
  classId: string;
  className: string;
  mataPelajaran: string;
  jurusan?: string;
  tingkat?: string;
  schoolName: string;
  waliKelas: string;
  nip?: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap' | string;
  kkm: number;
  teacherUid: string;
  updatedAt: string;
  students: Array<{
    id: string;
    no: number;
    nisn?: string;
    nama: string;
    gender?: 'L' | 'P' | string;
  }>;
  grades: StudentGrade[];
  columnHeaders?: GradeColumnHeader[];
  isPublicEnabled: boolean;
  pinRequired?: boolean;
  accessPin?: string;
  allowClassRecap?: boolean;
}

export interface PublicTabunganData {
  shareId: string;
  classId: string;
  className: string;
  mataPelajaran?: string;
  jurusan?: string;
  schoolName: string;
  waliKelas: string;
  nip?: string;
  academicYear: string;
  semester: string;
  teacherUid: string;
  updatedAt: string;
  students: Array<{
    id: string;
    no: number;
    nisn?: string;
    nama: string;
    gender?: 'L' | 'P' | string;
  }>;
  savings: SavingTransaction[];
  isPublicEnabled: boolean;
  pinRequired?: boolean;
  accessPin?: string;
  allowClassRecap?: boolean;
}

export interface PublicAbsensiData {
  shareId: string;
  classId: string;
  className: string;
  mataPelajaran: string;
  jurusan?: string;
  schoolName: string;
  waliKelas: string;
  nip?: string;
  academicYear: string;
  semester: string;
  teacherUid: string;
  updatedAt: string;
  students: Array<{
    id: string;
    no: number;
    nisn?: string;
    nama: string;
    gender?: 'L' | 'P' | string;
  }>;
  sessions: AttendanceSession[];
  isPublicEnabled: boolean;
  pinRequired?: boolean;
  accessPin?: string;
  allowClassRecap?: boolean;
}
