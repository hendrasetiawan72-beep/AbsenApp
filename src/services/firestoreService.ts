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

/**
 * Executes write batch operations in safe chunks (max 350 per batch)
 * to strictly prevent the Firestore "A write batch can contain at most 500 operations" crash.
 */
async function commitBatchOperations(
  operations: Array<(batch: ReturnType<typeof writeBatch>) => void>,
  chunkSize = 350
): Promise<void> {
  if (!operations || operations.length === 0) return;
  for (let i = 0; i < operations.length; i += chunkSize) {
    const chunk = operations.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    for (const op of chunk) {
      op(batch);
    }
    await batch.commit();
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
}

// In-memory cache for ultra-fast instant UI rendering
const memoryWorkspaceCache: Record<string, { data: UserWorkspaceData; timestamp: number }> = {};
let workspaceDebounceTimers: Record<string, any> = {};
let pendingWorkspacePayloads: Record<string, any> = {};

export const FirestoreService = {
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

    // 1. Merge into memory cache and localStorage immediately
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

    // 3. Debounce the cloud write (200ms) to coalesce rapid consecutive writes
    if (workspaceDebounceTimers[uid]) {
      clearTimeout(workspaceDebounceTimers[uid]);
    }

    workspaceDebounceTimers[uid] = setTimeout(async () => {
      const payload = pendingWorkspacePayloads[uid];
      delete pendingWorkspacePayloads[uid];
      delete workspaceDebounceTimers[uid];

      if (!payload) return;
      try {
        const wsRef = doc(db, 'teacher_workspaces', uid);
        await setDoc(wsRef, sanitizeForFirestore(payload), { merge: true });
        console.log(`[FirestoreService] Debounced workspace write completed for ${uid}`);
      } catch (err) {
        console.warn('[FirestoreService] Debounced workspace write error:', err);
      }
    }, 200);
  },

  /**
   * Immediately flush any pending debounced workspace write
   */
  async flushWorkspaceSync(uid: string): Promise<void> {
    if (!uid || !pendingWorkspacePayloads[uid]) return;
    if (workspaceDebounceTimers[uid]) {
      clearTimeout(workspaceDebounceTimers[uid]);
      delete workspaceDebounceTimers[uid];
    }
    const payload = pendingWorkspacePayloads[uid];
    delete pendingWorkspacePayloads[uid];
    try {
      const wsRef = doc(db, 'teacher_workspaces', uid);
      await setDoc(wsRef, sanitizeForFirestore(payload), { merge: true });
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

    // 0. Check instant memory or localStorage cache first
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
        const timeoutWs = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1800));
        const wsSnap = await Promise.race([wsSnapPromise, timeoutWs]);

        if (wsSnap && wsSnap.exists()) {
          const wsData = wsSnap.data() as any;
          if (wsData && Array.isArray(wsData.classes) && wsData.classes.length > 0) {
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
          try {
            const wsRef = doc(db, 'teacher_workspaces', uid);
            setDoc(
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

    // Fast Timeout Guard (2.5 seconds max wait before serving instant cached or local data)
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT_FAST_LOAD')), 2500)
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

    await batch.commit();
    console.log(`[FirestoreService] Seeded initial data for user ${uid}`);

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
    const docRef = doc(db, 'users', uid, 'profile', 'teacher');
    const writePromise = setDoc(docRef, sanitizeForFirestore(profile), { merge: true });
    this.queueWorkspaceSync(uid, { teacher: profile });
    await writePromise;
  },

  /**
   * Save or update a ClassRoom
   */
  async saveClass(uid: string, classItem: ClassRoom, allClasses?: ClassRoom[]): Promise<void> {
    const docRef = doc(db, 'users', uid, 'classes', classItem.id);
    const writePromise = setDoc(
      docRef,
      sanitizeForFirestore({ ...classItem, teacherUid: uid }),
      { merge: true }
    );
    const classesList = allClasses || Storage.getClasses();
    this.queueWorkspaceSync(uid, { classes: classesList });
    await writePromise;
  },

  /**
   * Delete a ClassRoom and its related students, sessions, and grades
   */
  async deleteClass(uid: string, classId: string): Promise<void> {
    // 1. Delete class document
    await deleteDoc(doc(db, 'users', uid, 'classes', classId));

    // 2. Cascade delete students of this class
    const studentsRef = collection(db, 'users', uid, 'students');
    const studentsSnap = await getDocs(
      query(studentsRef, where('classId', '==', classId))
    );
    const batch = writeBatch(db);
    studentsSnap.docs.forEach((d) => batch.delete(d.ref));

    // 3. Cascade delete sessions of this class
    const sessionsRef = collection(db, 'users', uid, 'attendance_sessions');
    const sessionsSnap = await getDocs(
      query(sessionsRef, where('classId', '==', classId))
    );
    sessionsSnap.docs.forEach((d) => batch.delete(d.ref));

    // 4. Cascade delete grades of this class
    const gradesRef = collection(db, 'users', uid, 'grades');
    const gradesSnap = await getDocs(
      query(gradesRef, where('classId', '==', classId))
    );
    gradesSnap.docs.forEach((d) => batch.delete(d.ref));

    await batch.commit();

    // Update workspace sync
    this.queueWorkspaceSync(uid, {
      classes: Storage.getClasses().filter((c) => c.id !== classId),
      students: Storage.getAllStudents().filter((s) => s.classId !== classId),
      sessions: Storage.getAllSessions().filter((s) => s.classId !== classId),
      grades: Storage.getAllGrades().filter((g) => g.classId !== classId),
    });
  },

  /**
   * Save or update a Student
   */
  async saveStudent(uid: string, student: Student, allStudents?: Student[]): Promise<void> {
    const docRef = doc(db, 'users', uid, 'students', student.id);
    const writePromise = setDoc(
      docRef,
      sanitizeForFirestore({ ...student, teacherUid: uid }),
      { merge: true }
    );
    const studentsList = allStudents || Storage.getAllStudents();
    this.queueWorkspaceSync(uid, { students: studentsList });
    await writePromise;
  },

  /**
   * Delete a Student and their grade record
   */
  async deleteStudent(uid: string, studentId: string): Promise<void> {
    await deleteDoc(doc(db, 'users', uid, 'students', studentId));

    const gradesRef = collection(db, 'users', uid, 'grades');
    const gradesSnap = await getDocs(
      query(gradesRef, where('studentId', '==', studentId))
    );
    if (!gradesSnap.empty) {
      const batch = writeBatch(db);
      gradesSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    this.queueWorkspaceSync(uid, {
      students: Storage.getAllStudents().filter((s) => s.id !== studentId),
      grades: Storage.getAllGrades().filter((g) => g.studentId !== studentId),
    });
  },

  /**
   * Save multiple students (e.g. from Excel/Spreadsheet import) with chunked batches
   */
  async importStudentsBatch(
    uid: string,
    students: Student[],
    newGrades: StudentGrade[],
    mode: 'replace' | 'append',
    targetClassId: string
  ): Promise<void> {
    const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];

    if (mode === 'replace') {
      // Delete existing students for this class
      const studentsRef = collection(db, 'users', uid, 'students');
      const existingSnap = await getDocs(
        query(studentsRef, where('classId', '==', targetClassId))
      );
      existingSnap.docs.forEach((d) => {
        ops.push((batch) => batch.delete(d.ref));
      });

      // Delete existing grades for this class
      const gradesRef = collection(db, 'users', uid, 'grades');
      const existingGradesSnap = await getDocs(
        query(gradesRef, where('classId', '==', targetClassId))
      );
      existingGradesSnap.docs.forEach((d) => {
        ops.push((batch) => batch.delete(d.ref));
      });
    }

    // Insert new students
    students.forEach((s) => {
      const sRef = doc(db, 'users', uid, 'students', s.id);
      ops.push((batch) => {
        batch.set(sRef, sanitizeForFirestore({ ...s, teacherUid: uid }));
      });
    });

    // Insert new grades
    newGrades.forEach((g) => {
      const gRef = doc(db, 'users', uid, 'grades', g.id);
      ops.push((batch) => {
        batch.set(gRef, sanitizeForFirestore({ ...g, teacherUid: uid }));
      });
    });

    await commitBatchOperations(ops, 350);

    // Update workspace snapshot document
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
    const docRef = doc(db, 'users', uid, 'attendance_sessions', session.id);
    const subColPromise = setDoc(
      docRef,
      sanitizeForFirestore({ ...session, teacherUid: uid }),
      { merge: true }
    ).catch((e) => console.warn('[FirestoreService] subCol saveAttendanceSession notice:', e));

    // Queue debounced unified workspace snapshot update (0ms local cache + background consolidator)
    const sessionsList = allSessions || Storage.getAllSessions();
    this.queueWorkspaceSync(uid, { sessions: sessionsList });

    // Write directly to unified workspace doc concurrently for ultra-fast sync
    const wsRef = doc(db, 'teacher_workspaces', uid);
    const wsPromise = setDoc(
      wsRef,
      sanitizeForFirestore({
        teacherUid: uid,
        sessions: sessionsList,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    ).catch((e) => console.warn('[FirestoreService] ws saveAttendanceSession notice:', e));

    await Promise.all([subColPromise, wsPromise]);
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

    const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];
    sessions.forEach((ses) => {
      const docRef = doc(db, 'users', uid, 'attendance_sessions', ses.id);
      ops.push((batch) => {
        batch.set(
          docRef,
          sanitizeForFirestore({ ...ses, teacherUid: uid }),
          { merge: true }
        );
      });
    });

    const batchPromise = commitBatchOperations(ops, 350).catch((e) => {
      console.warn('[FirestoreService] saveAttendanceSessionsBatch notice:', e);
    });

    // Concurrently write to consolidated workspace document
    const sessionsList = allSessions || Storage.getAllSessions();
    this.queueWorkspaceSync(uid, { sessions: sessionsList });
    const wsRef = doc(db, 'teacher_workspaces', uid);
    const wsPromise = setDoc(
      wsRef,
      sanitizeForFirestore({
        teacherUid: uid,
        sessions: sessionsList,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    ).catch((e) => console.warn('[FirestoreService] saveAttendanceSessionsBatch ws notice:', e));

    // Auto-update public_absensi snapshots for each affected class in background
    try {
      const classIds = Array.from(new Set(sessionsList.map((s) => s.classId).filter(Boolean)));
      for (const cId of classIds) {
        const clsSessions = sessionsList.filter((s) => s.classId === cId);
        const sId = this.getPublicAbsensiShareId(uid, cId);
        const cleanC = cId.replace(/[^a-zA-Z0-9_-]/g, '');
        const cleanCNoHyphen = cId.replace(/[^a-zA-Z0-9]/g, '');
        const absPayload = sanitizeForFirestore({
          shareId: sId,
          classId: cId,
          sessions: clsSessions,
          updatedAt: new Date().toISOString(),
        });
        setDoc(doc(db, 'public_absensi', sId), absPayload, { merge: true }).catch(() => {});
        if (cleanC && sId !== `abs_${cleanC}`) {
          setDoc(doc(db, 'public_absensi', `abs_${cleanC}`), absPayload, { merge: true }).catch(() => {});
        }
        if (cleanCNoHyphen && cleanCNoHyphen !== cleanC && sId !== `abs_${cleanCNoHyphen}`) {
          setDoc(doc(db, 'public_absensi', `abs_${cleanCNoHyphen}`), absPayload, { merge: true }).catch(() => {});
        }
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`cache_pub_abs_${sId}`, JSON.stringify(absPayload));
            if (cleanC) localStorage.setItem(`cache_pub_abs_abs_${cleanC}`, JSON.stringify(absPayload));
            if (cleanCNoHyphen) localStorage.setItem(`cache_pub_abs_abs_${cleanCNoHyphen}`, JSON.stringify(absPayload));
          } catch {}
        }
      }
    } catch {}

    // Cap network wait to max 1200ms so UI never hangs or becomes unresponsive
    await Promise.race([
      Promise.all([batchPromise, wsPromise]),
      new Promise((resolve) => setTimeout(resolve, 1200)),
    ]);
  },

  /**
   * Delete an Attendance Session
   */
  async deleteAttendanceSession(
    uid: string,
    sessionId: string,
    remainingSessions?: AttendanceSession[]
  ): Promise<void> {
    const docRef = doc(db, 'users', uid, 'attendance_sessions', sessionId);
    const deletePromise = deleteDoc(docRef).catch((e) => console.warn('[FirestoreService] deleteAttendanceSession notice:', e));

    const sessionsList =
      remainingSessions || Storage.getAllSessions().filter((s) => s.id !== sessionId);
    this.queueWorkspaceSync(uid, { sessions: sessionsList });

    await deletePromise;
  },

  /**
   * Save or update Student Grade
   */
  async saveGrade(uid: string, grade: StudentGrade, allGrades?: StudentGrade[]): Promise<void> {
    const docRef = doc(db, 'users', uid, 'grades', grade.id);
    const subColPromise = setDoc(
      docRef,
      sanitizeForFirestore({ ...grade, teacherUid: uid }),
      { merge: true }
    ).catch((e) => console.warn('[FirestoreService] saveGrade notice:', e));

    const gradesList = allGrades || Storage.getAllGrades();
    this.queueWorkspaceSync(uid, { grades: gradesList });

    const wsRef = doc(db, 'teacher_workspaces', uid);
    const wsPromise = setDoc(
      wsRef,
      sanitizeForFirestore({
        teacherUid: uid,
        grades: gradesList,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    ).catch((e) => console.warn('[FirestoreService] saveGrade ws notice:', e));

    await Promise.all([subColPromise, wsPromise]);
  },

  /**
   * Save Grades in Batch to Cloud Firestore
   * Highly optimized: performs single-document atomic write to unified teacher_workspaces (<100ms)
   * while asynchronously persisting to subcollection in the background with batch chunking.
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

    // 1. Instant local memory cache update
    this.queueWorkspaceSync(uid, { grades: gradesList });

    // 2. High-speed atomic write to consolidated workspace document
    const wsRef = doc(db, 'teacher_workspaces', uid);
    const wsPayload: Record<string, any> = {
      teacherUid: uid,
      grades: gradesList,
      updatedAt: new Date().toISOString(),
    };
    if (gradeHeaders) {
      wsPayload[`gradeHeaders_${gradeHeaders.classId}`] = gradeHeaders.headers;
    }
    const wsPromise = setDoc(wsRef, sanitizeForFirestore(wsPayload), { merge: true })
      .catch((err) => {
        console.warn('[FirestoreService] Workspace grades write notice:', err?.message || err);
      });

    // 3. Concurrently sync subcollections with chunking protection
    const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];
    grades.forEach((grade, idx) => {
      const gradeId = grade.id || `grd-${grade.studentId || idx}`;
      const docRef = doc(db, 'users', uid, 'grades', gradeId);
      ops.push((batch) => {
        batch.set(
          docRef,
          sanitizeForFirestore({ ...grade, id: gradeId, teacherUid: uid }),
          { merge: true }
        );
      });
    });

    if (gradeHeaders) {
      const hRef = doc(db, 'users', uid, 'grade_headers', gradeHeaders.classId);
      ops.push((batch) => {
        batch.set(
          hRef,
          sanitizeForFirestore({
            classId: gradeHeaders.classId,
            headers: gradeHeaders.headers,
            updatedAt: new Date().toISOString(),
            teacherUid: uid,
          }),
          { merge: true }
        );
      });
    }

    // Fire subcollection updates in background so hundreds of subcollection writes never block the UI
    commitBatchOperations(ops, 350).catch((e) => {
      console.warn('[FirestoreService] Background subcollection batch notice:', e?.message || e);
    });

    // Auto-update public_nilai snapshot for the affected class in background
    if (gradeHeaders?.classId) {
      try {
        const cId = gradeHeaders.classId;
        const targetGrades = (allGrades || grades).filter((g) => g.classId === cId);
        const sId = this.getPublicNilaiShareId(uid, cId);
        const cleanC = cId.replace(/[^a-zA-Z0-9_-]/g, '');
        const cleanCNoHyphen = cId.replace(/[^a-zA-Z0-9]/g, '');
        const pubPayload = sanitizeForFirestore({
          shareId: sId,
          classId: cId,
          grades: targetGrades,
          columnHeaders: gradeHeaders.headers,
          updatedAt: new Date().toISOString(),
        });
        setDoc(doc(db, 'public_nilai', sId), pubPayload, { merge: true }).catch(() => {});
        if (cleanC && sId !== `nil_${cleanC}`) {
          setDoc(doc(db, 'public_nilai', `nil_${cleanC}`), pubPayload, { merge: true }).catch(() => {});
        }
        if (cleanCNoHyphen && cleanCNoHyphen !== cleanC && sId !== `nil_${cleanCNoHyphen}`) {
          setDoc(doc(db, 'public_nilai', `nil_${cleanCNoHyphen}`), pubPayload, { merge: true }).catch(() => {});
        }
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`cache_pub_nil_${sId}`, JSON.stringify(pubPayload));
            if (cleanC) localStorage.setItem(`cache_pub_nil_nil_${cleanC}`, JSON.stringify(pubPayload));
            if (cleanCNoHyphen) localStorage.setItem(`cache_pub_nil_nil_${cleanCNoHyphen}`, JSON.stringify(pubPayload));
          } catch {}
        }
      } catch {}
    }

    // Fast non-blocking completion: Wait for workspace document with a maximum 1200ms timeout
    // Strictly prevents UI freezing, spinners sticking, or "not responding" errors
    await Promise.race([
      wsPromise,
      new Promise((resolve) => setTimeout(resolve, 1200)),
    ]);
  },

  /**
   * Save Grade Column Headers (dates & descriptions for 4 columns x 6 months)
   */
  async saveGradeHeaders(
    uid: string,
    classId: string,
    headers: GradeColumnHeader[]
  ): Promise<void> {
    const docRef = doc(db, 'users', uid, 'grade_headers', classId);
    const wsRef = doc(db, 'teacher_workspaces', uid);

    await Promise.all([
      setDoc(
        docRef,
        sanitizeForFirestore({
          classId,
          headers,
          updatedAt: new Date().toISOString(),
          teacherUid: uid,
        }),
        { merge: true }
      ),
      setDoc(
        wsRef,
        sanitizeForFirestore({
          [`gradeHeaders_${classId}`]: headers,
          updatedAt: new Date().toISOString(),
        }),
        { merge: true }
      ).catch(() => {}),
    ]);
  },

  /**
   * Get Grade Column Headers from Cloud Firestore
   */
  async getGradeHeaders(
    uid: string,
    classId: string
  ): Promise<GradeColumnHeader[] | null> {
    try {
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
    // 1. Subcollection write
    const docRef = doc(db, 'users', uid, 'teaching_agendas', agenda.id);
    const subColPromise = setDoc(
      docRef,
      sanitizeForFirestore({ ...agenda, teacherUid: uid }),
      { merge: true }
    );

    // 2. Determine agendas list for consolidated workspace snapshot
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
    await subColPromise;
  },

  /**
   * Delete Teaching Agenda (from subcollection & workspace snapshot)
   */
  async deleteAgenda(
    uid: string,
    agendaId: string,
    remainingAgendas?: TeachingAgenda[]
  ): Promise<void> {
    const docRef = doc(db, 'users', uid, 'teaching_agendas', agendaId);
    const subColPromise = deleteDoc(docRef);

    const updatedList =
      remainingAgendas || Storage.getAllAgendas().filter((a) => a.id !== agendaId);
    this.queueWorkspaceSync(uid, { agendas: updatedList });

    await subColPromise;
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
      const colRef = collection(db, 'users', uid, colName);
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
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

    // 1. Debounced unified workspace document & instant local cache update
    this.queueWorkspaceSync(uid, { savings: targetSavings });

    // 2. Fast Parallel Real-Time sync for all active public_tabungan snapshots
    const publicSyncPromises: Promise<any>[] = [];
    try {
      const classIds = Array.from(new Set(targetSavings.map((s) => s.classId)));
      for (const cId of classIds) {
        if (!cId) continue;
        const clsSavings = targetSavings.filter((s) => s.classId === cId);
        const updatePayload = sanitizeForFirestore({
          savings: clsSavings,
          updatedAt: new Date().toISOString(),
        });

        // 2a. Update primary deterministic share ID
        const sId = FirestoreService.getPublicTabunganShareId(uid, cId);
        const pRef = doc(db, 'public_tabungan', sId);
        publicSyncPromises.push(setDoc(pRef, updatePayload, { merge: true }).catch(() => {}));

        // 2b. Update class alias mirror (tb_classId) for robust instant link access
        const cleanCId = cId.replace(/[^a-zA-Z0-9_-]/g, '');
        if (cleanCId && sId !== `tb_${cleanCId}`) {
          const aliasRef = doc(db, 'public_tabungan', `tb_${cleanCId}`);
          publicSyncPromises.push(setDoc(aliasRef, updatePayload, { merge: true }).catch(() => {}));
        }
      }
    } catch {}

    await Promise.all(publicSyncPromises);
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

    const wsRef = doc(db, 'teacher_workspaces', uid);
    await setDoc(
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

    // Update local cache
    try {
      const cacheKey = `smk_ws_cache_${uid}`;
      localStorage.setItem(cacheKey, JSON.stringify(fullData));
    } catch {}
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
    const publicRef = doc(db, 'public_tabungan', data.shareId);
    const sanitized = sanitizeForFirestore({
      ...data,
      updatedAt: new Date().toISOString(),
    });

    const writes: Promise<any>[] = [setDoc(publicRef, sanitized, { merge: true })];

    // Mirror to clean class aliases for zero-friction sharing and instant lookup
    const cleanClass = data.classId ? data.classId.replace(/[^a-zA-Z0-9_-]/g, '') : '';
    const cleanClassNoHyphen = data.classId ? data.classId.replace(/[^a-zA-Z0-9]/g, '') : '';

    if (cleanClass && data.shareId !== `tb_${cleanClass}`) {
      const aliasRef = doc(db, 'public_tabungan', `tb_${cleanClass}`);
      writes.push(setDoc(aliasRef, sanitized, { merge: true }).catch(() => {}));
    }
    if (cleanClassNoHyphen && cleanClassNoHyphen !== cleanClass && data.shareId !== `tb_${cleanClassNoHyphen}`) {
      const aliasNoHyphenRef = doc(db, 'public_tabungan', `tb_${cleanClassNoHyphen}`);
      writes.push(setDoc(aliasNoHyphenRef, sanitized, { merge: true }).catch(() => {}));
    }

    // Instant local cache for immediate zero-latency preview
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`cache_pub_tb_${data.shareId}`, JSON.stringify(sanitized));
        if (cleanClass) localStorage.setItem(`cache_pub_tb_tb_${cleanClass}`, JSON.stringify(sanitized));
        if (cleanClassNoHyphen) localStorage.setItem(`cache_pub_tb_tb_${cleanClassNoHyphen}`, JSON.stringify(sanitized));
      } catch {}
    }

    await Promise.all(writes);
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
        console.error('[FirestoreService] subscribePublicTabungan error:', error);
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
    const publicRef = doc(db, 'public_absensi', data.shareId);
    const sanitized = sanitizeForFirestore({
      ...data,
      updatedAt: new Date().toISOString(),
    });

    const writes: Promise<any>[] = [setDoc(publicRef, sanitized, { merge: true })];

    // Mirror to clean class aliases for zero-friction sharing and instant lookup
    const cleanClass = data.classId ? data.classId.replace(/[^a-zA-Z0-9_-]/g, '') : '';
    const cleanClassNoHyphen = data.classId ? data.classId.replace(/[^a-zA-Z0-9]/g, '') : '';

    if (cleanClass && data.shareId !== `abs_${cleanClass}`) {
      const aliasRef = doc(db, 'public_absensi', `abs_${cleanClass}`);
      writes.push(setDoc(aliasRef, sanitized, { merge: true }).catch(() => {}));
    }
    if (cleanClassNoHyphen && cleanClassNoHyphen !== cleanClass && data.shareId !== `abs_${cleanClassNoHyphen}`) {
      const aliasNoHyphenRef = doc(db, 'public_absensi', `abs_${cleanClassNoHyphen}`);
      writes.push(setDoc(aliasNoHyphenRef, sanitized, { merge: true }).catch(() => {}));
    }

    // Instant local cache for immediate zero-latency preview
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`cache_pub_abs_${data.shareId}`, JSON.stringify(sanitized));
        if (cleanClass) localStorage.setItem(`cache_pub_abs_abs_${cleanClass}`, JSON.stringify(sanitized));
        if (cleanClassNoHyphen) localStorage.setItem(`cache_pub_abs_abs_${cleanClassNoHyphen}`, JSON.stringify(sanitized));
      } catch {}
    }

    await Promise.all(writes);
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
        console.error('[FirestoreService] subscribePublicAbsensi error:', error);
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
    const publicRef = doc(db, 'public_nilai', data.shareId);

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

    const writes: Promise<any>[] = [setDoc(publicRef, sanitized, { merge: true })];

    // Mirror to clean class aliases for zero-friction sharing and instant lookup
    const cleanClass = data.classId ? data.classId.replace(/[^a-zA-Z0-9_-]/g, '') : '';
    const cleanClassNoHyphen = data.classId ? data.classId.replace(/[^a-zA-Z0-9]/g, '') : '';

    if (cleanClass && data.shareId !== `nil_${cleanClass}`) {
      const aliasRef = doc(db, 'public_nilai', `nil_${cleanClass}`);
      writes.push(setDoc(aliasRef, sanitized, { merge: true }).catch(() => {}));
    }
    if (cleanClassNoHyphen && cleanClassNoHyphen !== cleanClass && data.shareId !== `nil_${cleanClassNoHyphen}`) {
      const aliasNoHyphenRef = doc(db, 'public_nilai', `nil_${cleanClassNoHyphen}`);
      writes.push(setDoc(aliasNoHyphenRef, sanitized, { merge: true }).catch(() => {}));
    }

    // Instant local cache for immediate zero-latency preview
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`cache_pub_nil_${data.shareId}`, JSON.stringify(sanitized));
        if (cleanClass) localStorage.setItem(`cache_pub_nil_nil_${cleanClass}`, JSON.stringify(sanitized));
        if (cleanClassNoHyphen) localStorage.setItem(`cache_pub_nil_nil_${cleanClassNoHyphen}`, JSON.stringify(sanitized));
      } catch {}
    }

    await Promise.all(writes);
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
        console.error('[FirestoreService] subscribePublicNilai error:', error);
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
