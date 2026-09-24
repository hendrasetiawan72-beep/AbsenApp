/**
 * Supabase-Powered Data Service Layer for AbsenApp
 * Eliminates all Firestore calls, double writes, and monolithic workspace syncs.
 * Uses granular Supabase PostgreSQL tables with IndexedDB offline-first caching.
 */

import {
  TeacherProfile,
  ClassRoom,
  Student,
  AttendanceSession,
  StudentGrade,
  TeachingAgenda,
  GradeColumnHeader,
  SavingTransaction,
  TeacherWorkspaceData,
} from '../types';
import { Storage } from '../utils/storage';
import { IndexedDBManager } from '../utils/indexedDb';
import { broadcastPreviewUpdate } from './previewSyncChannel';
import { SupabaseSyncManager, GradualSyncManager } from './supabaseSyncManager';
import { AuthService } from './authService';
import { ClassService } from './classService';
import { StudentService } from './studentService';
import { AttendanceService } from './attendanceService';
import { GradeService } from './gradeService';
import { AgendaService } from './agendaService';
import { SavingsService } from './savingsService';
import { PublicShareService, type PublicSharePayload } from './publicShareService';
import { HENDRA_MASTER_DATA } from '../data/seedData';

// Firestore quota breaker is obsolete with Supabase PostgreSQL
export function isQuotaExceeded(): boolean {
  return false;
}

export function isQuotaExceededError(_err: unknown): boolean {
  return false;
}

export function markQuotaExceeded(_reason?: string): void {}

export const FirestoreService = {
  getCachedUserData(_uid: string): UserWorkspaceData | null {
    try {
      const teacher = Storage.getTeacher();
      const classes = Storage.getClasses();
      const activeClassId = Storage.getActiveClassId();
      const students = Storage.getAllStudents();
      const sessions = Storage.getAllSessions();
      const grades = Storage.getAllGrades();
      const agendas = Storage.getAllAgendas();
      const savings = Storage.getAllSavings();

      return {
        teacherUid: _uid,
        email: teacher.email || '',
        teacher,
        classes,
        activeClassId,
        students,
        sessions,
        grades,
        agendas,
        savings,
        updatedAt: new Date().toISOString(),
      };
    } catch {
      return null;
    }
  },

  queueWorkspaceSync(uid: string, _partial: Partial<UserWorkspaceData>): void {
    SupabaseSyncManager.setActiveUid(uid);
    SupabaseSyncManager.markLocalChange();
  },

  async flushWorkspaceSync(uid: string): Promise<void> {
    SupabaseSyncManager.setActiveUid(uid);
    await SupabaseSyncManager.drainOfflineQueue();
  },

  /**
   * Load user data from Supabase PostgreSQL tables
   */
  async loadUserData(uid: string, _forceRemote: boolean = false): Promise<UserWorkspaceData> {
    SupabaseSyncManager.setActiveUid(uid);

    try {
      const [profile, classes, students, sessions, grades, agendas, savings] = await Promise.all([
        AuthService.getProfile(uid),
        ClassService.listClasses(uid),
        StudentService.listAllStudents(),
        AttendanceService.listAttendanceSessions(uid),
        GradeService.listGrades(),
        AgendaService.listAgendas(uid),
        SavingsService.listSavings(uid),
      ]);

      const isNewUser = classes.length === 0 && students.length === 0 && !profile;

      if (isNewUser) {
        return {
          teacherUid: uid,
          email: '',
          teacher: Storage.getTeacher(),
          classes: Storage.getClasses(),
          activeClassId: Storage.getActiveClassId(),
          students: Storage.getAllStudents(),
          sessions: Storage.getAllSessions(),
          grades: Storage.getAllGrades(),
          agendas: Storage.getAllAgendas(),
          savings: Storage.getAllSavings(),
          isNewUser: true,
          updatedAt: new Date().toISOString(),
        };
      }

      const activeClassId = classes[0]?.id || Storage.getActiveClassId();

      const workspaceData: UserWorkspaceData = {
        teacherUid: uid,
        email: profile?.email || '',
        teacher: profile || Storage.getTeacher(),
        classes: classes.length > 0 ? classes : Storage.getClasses(),
        activeClassId,
        students: students.length > 0 ? students : Storage.getAllStudents(),
        sessions: sessions.length > 0 ? sessions : Storage.getAllSessions(),
        grades: grades.length > 0 ? grades : Storage.getAllGrades(),
        agendas: agendas.length > 0 ? agendas : Storage.getAllAgendas(),
        savings: savings.length > 0 ? savings : Storage.getAllSavings(),
        isNewUser: false,
        updatedAt: new Date().toISOString(),
      };

      // Cache into local IndexedDB
      await IndexedDBManager.setCache(`workspace_${uid}`, workspaceData);
      SupabaseSyncManager.markCloudSynced();

      return workspaceData;
    } catch (err) {
      console.warn('[DataService] Error loading from Supabase, serving local cache:', err);
      const cached = await IndexedDBManager.getCache<UserWorkspaceData>(`workspace_${uid}`);
      if (cached) return cached;

      return {
        teacherUid: uid,
        email: '',
        teacher: Storage.getTeacher(),
        classes: Storage.getClasses(),
        activeClassId: Storage.getActiveClassId(),
        students: Storage.getAllStudents(),
        sessions: Storage.getAllSessions(),
        grades: Storage.getAllGrades(),
        agendas: Storage.getAllAgendas(),
        savings: Storage.getAllSavings(),
        isNewUser: false,
        updatedAt: new Date().toISOString(),
      };
    }
  },

  async seedInitialUserData(uid: string, user: any): Promise<UserWorkspaceData> {
    const defaultData = HENDRA_MASTER_DATA.data;
    const teacher: TeacherProfile = {
      ...defaultData.teacher,
      id: uid,
      email: user?.email || defaultData.teacher.email,
      namaGuru: user?.displayName || defaultData.teacher.namaGuru,
      isLoggedIn: true,
    };

    const initialWorkspace: UserWorkspaceData = {
      teacherUid: uid,
      email: user?.email || '',
      teacher,
      classes: defaultData.classes,
      activeClassId: defaultData.activeClassId,
      students: defaultData.students,
      sessions: defaultData.sessions,
      grades: defaultData.grades,
      agendas: defaultData.agendas || [],
      savings: defaultData.savings || [],
      isNewUser: false,
      updatedAt: new Date().toISOString(),
    };

    // Save initial workspace in parallel to Supabase
    try {
      await Promise.allSettled([
        AuthService.updateProfile(uid, teacher),
        ClassService.saveClassesBatch(uid, defaultData.classes),
        StudentService.saveStudentsBatch(defaultData.students),
        AttendanceService.saveAttendanceSessionsBatch(uid, defaultData.sessions),
        GradeService.saveGradesBatch(defaultData.grades),
        defaultData.agendas ? AgendaService.saveAgendasBatch(uid, defaultData.agendas) : Promise.resolve(),
        defaultData.savings ? SavingsService.saveSavingsBatch(uid, defaultData.savings) : Promise.resolve(),
      ]);
      SupabaseSyncManager.markCloudSynced();
    } catch (e) {
      console.warn('[DataService] Seed Supabase error:', e);
    }

    return initialWorkspace;
  },

  async saveTeacherProfile(uid: string, profile: TeacherProfile): Promise<void> {
    await AuthService.updateProfile(uid, profile);
    SupabaseSyncManager.markCloudSynced();
  },

  async saveClass(uid: string, classItem: ClassRoom, _allClasses?: ClassRoom[]): Promise<void> {
    await ClassService.saveClass(uid, classItem);
    SupabaseSyncManager.markCloudSynced();
  },

  async deleteClass(uid: string, classId: string): Promise<void> {
    await ClassService.deleteClass(uid, classId);
    SupabaseSyncManager.markCloudSynced();
  },

  async saveStudent(_uid: string, student: Student, _allStudents?: Student[]): Promise<void> {
    await StudentService.saveStudent(student);
    SupabaseSyncManager.markCloudSynced();
  },

  async deleteStudent(_uid: string, studentId: string): Promise<void> {
    await StudentService.deleteStudent(studentId);
    SupabaseSyncManager.markCloudSynced();
  },

  async importStudentsBatch(
    _uid: string,
    students: Student[],
    addedGradesOrClassId?: any,
    _mode?: any,
    _activeClassId?: string
  ): Promise<void> {
    await StudentService.saveStudentsBatch(students);
    if (Array.isArray(addedGradesOrClassId) && addedGradesOrClassId.length > 0) {
      await GradeService.saveGradesBatch(addedGradesOrClassId);
    }
    SupabaseSyncManager.markCloudSynced();
  },

  async saveAttendanceSession(uid: string, session: AttendanceSession, _allSessions?: AttendanceSession[]): Promise<void> {
    await AttendanceService.saveAttendanceSession(uid, session);
    SupabaseSyncManager.markCloudSynced();
  },

  async saveAttendanceSessionsBatch(uid: string, sessions: AttendanceSession[], _allSessions?: AttendanceSession[]): Promise<void> {
    await AttendanceService.saveAttendanceSessionsBatch(uid, sessions);
    SupabaseSyncManager.markCloudSynced();
  },

  async deleteAttendanceSession(_uid: string, sessionId: string, _allSessions?: AttendanceSession[]): Promise<void> {
    await AttendanceService.deleteAttendanceSession(sessionId);
    SupabaseSyncManager.markCloudSynced();
  },

  async saveGrade(_uid: string, grade: StudentGrade, _allGrades?: StudentGrade[]): Promise<void> {
    await GradeService.saveGrade(grade);
    SupabaseSyncManager.markCloudSynced();
  },

  async saveGradesBatch(
    _uid: string,
    grades: StudentGrade[],
    _allGrades?: StudentGrade[],
    headerMeta?: any
  ): Promise<void> {
    await GradeService.saveGradesBatch(grades);
    if (headerMeta?.headers && headerMeta?.classId) {
      await GradeService.saveGradeHeaders(_uid, headerMeta.classId, headerMeta.headers);
    }
    SupabaseSyncManager.markCloudSynced();
  },

  async saveGradeHeaders(uid: string, classId: string, headers: GradeColumnHeader[]): Promise<void> {
    await GradeService.saveGradeHeaders(uid, classId, headers);
    SupabaseSyncManager.markCloudSynced();
  },

  async getGradeHeaders(_uid: string, _classId: string): Promise<GradeColumnHeader[]> {
    return [];
  },

  async saveAgenda(uid: string, agenda: TeachingAgenda, _allAgendas?: TeachingAgenda[]): Promise<void> {
    await AgendaService.saveAgenda(uid, agenda);
    SupabaseSyncManager.markCloudSynced();
  },

  async deleteAgenda(_uid: string, agendaId: string, _allAgendas?: TeachingAgenda[]): Promise<void> {
    await AgendaService.deleteAgenda(agendaId);
    SupabaseSyncManager.markCloudSynced();
  },

  async saveSavingsBatch(uid: string, transactions: SavingTransaction[], _allSavings?: SavingTransaction[]): Promise<void> {
    await SavingsService.saveSavingsBatch(uid, transactions);
    SupabaseSyncManager.markCloudSynced();
  },

  async saveFullWorkspace(uid: string, workspace: any): Promise<void> {
    SupabaseSyncManager.setActiveUid(uid);
    try {
      const promises: Promise<any>[] = [];
      if (workspace.teacher) promises.push(AuthService.updateProfile(uid, workspace.teacher));
      if (workspace.classes?.length) promises.push(ClassService.saveClassesBatch(uid, workspace.classes));
      if (workspace.students?.length) promises.push(StudentService.saveStudentsBatch(workspace.students));
      if (workspace.sessions?.length) promises.push(AttendanceService.saveAttendanceSessionsBatch(uid, workspace.sessions));
      if (workspace.grades?.length) promises.push(GradeService.saveGradesBatch(workspace.grades));
      if (workspace.agendas?.length) promises.push(AgendaService.saveAgendasBatch(uid, workspace.agendas));
      if (workspace.savings?.length) promises.push(SavingsService.saveSavingsBatch(uid, workspace.savings));

      await Promise.allSettled(promises);
      SupabaseSyncManager.markCloudSynced();
    } catch (e) {
      console.warn('[DataService] saveFullWorkspace notice:', e);
    }
  },

  async resetUserData(uid: string, _userProfile?: any): Promise<UserWorkspaceData> {
    const defaultData = HENDRA_MASTER_DATA.data;
    const initialWorkspace: UserWorkspaceData = {
      teacherUid: uid,
      email: defaultData.teacher.email,
      teacher: defaultData.teacher,
      classes: defaultData.classes,
      activeClassId: defaultData.activeClassId,
      students: defaultData.students,
      sessions: defaultData.sessions,
      grades: defaultData.grades,
      agendas: defaultData.agendas || [],
      savings: defaultData.savings || [],
      isNewUser: false,
      updatedAt: new Date().toISOString(),
    };
    await this.saveFullWorkspace(uid, initialWorkspace);
    return initialWorkspace;
  },

  broadcastAllLocalPreviews(teacherUid: string): void {
    const classes = Storage.getClasses();
    const teacher = Storage.getTeacher();
    const nowIso = new Date().toISOString();

    for (const cls of classes) {
      const absToken = this.getPublicAbsensiShareId(teacherUid, cls.id);
      const nilToken = this.getPublicNilaiShareId(teacherUid, cls.id);
      const tbToken = this.getPublicTabunganShareId(teacherUid, cls.id);

      const classStudents = Storage.getAllStudents().filter(s => s.classId === cls.id);
      const classSessions = Storage.getAllSessions().filter(s => s.classId === cls.id);
      const classGrades = Storage.getAllGrades().filter(g => g.classId === cls.id);
      const classSavings = Storage.getAllSavings().filter(s => s.classId === cls.id);

      broadcastPreviewUpdate('absensi', absToken, cls.id, {
        shareId: absToken,
        classId: cls.id,
        className: cls.namaKelas,
        mataPelajaran: cls.mataPelajaran || '',
        schoolName: teacher.namaSekolah || 'SMK Muhammadiyah Bawang',
        waliKelas: teacher.namaGuru || 'Guru Pengampu',
        academicYear: teacher.tahunAjaran || '2026/2027',
        semester: teacher.semester || 'Ganjil',
        teacherUid,
        updatedAt: nowIso,
        students: classStudents,
        sessions: classSessions,
        isPublicEnabled: true,
      });

      broadcastPreviewUpdate('nilai', nilToken, cls.id, {
        shareId: nilToken,
        classId: cls.id,
        className: cls.namaKelas,
        mataPelajaran: cls.mataPelajaran || '',
        schoolName: teacher.namaSekolah || 'SMK Muhammadiyah Bawang',
        waliKelas: teacher.namaGuru || 'Guru Pengampu',
        academicYear: teacher.tahunAjaran || '2026/2027',
        semester: teacher.semester || 'Ganjil',
        kkm: cls.kkm || 75,
        teacherUid,
        updatedAt: nowIso,
        students: classStudents,
        grades: classGrades,
        isPublicEnabled: true,
      });

      broadcastPreviewUpdate('tabungan', tbToken, cls.id, {
        shareId: tbToken,
        classId: cls.id,
        className: cls.namaKelas,
        schoolName: teacher.namaSekolah || 'SMK Muhammadiyah Bawang',
        waliKelas: teacher.namaGuru || 'Guru Pengampu',
        academicYear: teacher.tahunAjaran || '2026/2027',
        semester: teacher.semester || 'Ganjil',
        teacherUid,
        updatedAt: nowIso,
        students: classStudents,
        savings: classSavings,
        isPublicEnabled: true,
      });
    }
  },

  async syncAllPublicSnapshots(teacherUid: string, data: any): Promise<{ syncedClasses: number; totalSnapshots: number }> {
    const classes = data.classes || Storage.getClasses();
    let count = 0;
    for (const cls of classes) {
      try {
        const absToken = this.getPublicAbsensiShareId(teacherUid, cls.id);
        const nilToken = this.getPublicNilaiShareId(teacherUid, cls.id);
        const tbToken = this.getPublicTabunganShareId(teacherUid, cls.id);

        const classStudents = (data.students || Storage.getAllStudents()).filter((s: any) => s.classId === cls.id);
        const classSessions = (data.sessions || Storage.getAllSessions()).filter((s: any) => s.classId === cls.id);
        const classGrades = (data.grades || Storage.getAllGrades()).filter((g: any) => g.classId === cls.id);
        const classSavings = (data.savings || Storage.getAllSavings()).filter((sv: any) => sv.classId === cls.id);

        await Promise.allSettled([
          this.publishPublicAbsensi({
            shareId: absToken,
            classId: cls.id,
            className: cls.namaKelas,
            mataPelajaran: cls.mataPelajaran || '',
            schoolName: data.teacher?.namaSekolah || 'SMK Muhammadiyah Bawang',
            waliKelas: data.teacher?.namaGuru || 'Guru Pengampu',
            academicYear: data.teacher?.tahunAjaran || '2026/2027',
            semester: data.teacher?.semester || 'Ganjil',
            teacherUid,
            updatedAt: new Date().toISOString(),
            students: classStudents,
            sessions: classSessions,
            isPublicEnabled: true,
          }),
          this.publishPublicNilai({
            shareId: nilToken,
            classId: cls.id,
            className: cls.namaKelas,
            mataPelajaran: cls.mataPelajaran || '',
            schoolName: data.teacher?.namaSekolah || 'SMK Muhammadiyah Bawang',
            waliKelas: data.teacher?.namaGuru || 'Guru Pengampu',
            academicYear: data.teacher?.tahunAjaran || '2026/2027',
            semester: data.teacher?.semester || 'Ganjil',
            kkm: cls.kkm || 75,
            teacherUid,
            updatedAt: new Date().toISOString(),
            students: classStudents,
            grades: classGrades,
            isPublicEnabled: true,
          }),
          this.publishPublicTabungan({
            shareId: tbToken,
            classId: cls.id,
            className: cls.namaKelas,
            schoolName: data.teacher?.namaSekolah || 'SMK Muhammadiyah Bawang',
            waliKelas: data.teacher?.namaGuru || 'Guru Pengampu',
            academicYear: data.teacher?.tahunAjaran || '2026/2027',
            semester: data.teacher?.semester || 'Ganjil',
            teacherUid,
            updatedAt: new Date().toISOString(),
            students: classStudents,
            savings: classSavings,
            isPublicEnabled: true,
          }),
        ]);
        count += 3;
      } catch (err) {
        console.warn('Sync public snapshot notice:', err);
      }
    }
    return { syncedClasses: classes.length, totalSnapshots: count };
  },

  getAllPossibleShareIds(type: 'abs' | 'nil' | 'tb', classId: string, teacherUid?: string): string[] {
    const cleanUid = (teacherUid || 'demo').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
    const cleanClass = (classId || 'default').replace(/[^a-zA-Z0-9_-]/g, '');
    return [`${type}_${cleanUid}_${cleanClass}`, `${type}_${cleanClass}`, cleanClass];
  },

  getPublicTabunganShareId(teacherUid: string, classId: string): string {
    const cleanUid = (teacherUid || 'demo').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
    const cleanClass = (classId || 'default').replace(/[^a-zA-Z0-9_-]/g, '');
    return `tb_${cleanUid}_${cleanClass}`;
  },

  async publishPublicTabungan(data: PublicTabunganData): Promise<void> {
    await PublicShareService.publishShare(
      data.teacherUid || 'demo',
      data.classId,
      'tabungan',
      data.shareId,
      data as any,
      data.isPublicEnabled
    );
    broadcastPreviewUpdate('tabungan', data.shareId, data.classId, data);
  },

  async getPublicTabungan(shareId: string): Promise<PublicTabunganData | null> {
    return (await PublicShareService.getPublicShare(shareId, 'tabungan')) as unknown as PublicTabunganData | null;
  },

  subscribePublicTabungan(
    shareId: string,
    callback: (data: PublicTabunganData | null) => void,
    onError?: (err: any) => void
  ): () => void {
    const sub = PublicShareService.subscribeShare(shareId, 'tabungan', (payload) => {
      callback(payload as unknown as PublicTabunganData);
    });

    // Also fetch initial value immediately
    this.getPublicTabungan(shareId)
      .then((data) => callback(data))
      .catch((err) => {
        if (onError) onError(err);
      });

    return () => sub.unsubscribe();
  },

  getPublicAbsensiShareId(teacherUid: string, classId: string): string {
    const cleanUid = (teacherUid || 'demo').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
    const cleanClass = (classId || 'default').replace(/[^a-zA-Z0-9_-]/g, '');
    return `abs_${cleanUid}_${cleanClass}`;
  },

  async publishPublicAbsensi(data: PublicAbsensiData): Promise<void> {
    await PublicShareService.publishShare(
      data.teacherUid || 'demo',
      data.classId,
      'absensi',
      data.shareId,
      data as any,
      data.isPublicEnabled
    );
    broadcastPreviewUpdate('absensi', data.shareId, data.classId, data);
  },

  async getPublicAbsensi(shareId: string): Promise<PublicAbsensiData | null> {
    return (await PublicShareService.getPublicShare(shareId, 'absensi')) as unknown as PublicAbsensiData | null;
  },

  subscribePublicAbsensi(
    shareId: string,
    callback: (data: PublicAbsensiData | null) => void,
    onError?: (err: any) => void
  ): () => void {
    const sub = PublicShareService.subscribeShare(shareId, 'absensi', (payload) => {
      callback(payload as unknown as PublicAbsensiData);
    });

    this.getPublicAbsensi(shareId)
      .then((data) => callback(data))
      .catch((err) => {
        if (onError) onError(err);
      });

    return () => sub.unsubscribe();
  },

  getPublicNilaiShareId(teacherUid: string, classId: string): string {
    const cleanUid = (teacherUid || 'demo').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
    const cleanClass = (classId || 'default').replace(/[^a-zA-Z0-9_-]/g, '');
    return `nil_${cleanUid}_${cleanClass}`;
  },

  async publishPublicNilai(data: PublicNilaiData): Promise<void> {
    await PublicShareService.publishShare(
      data.teacherUid || 'demo',
      data.classId,
      'nilai',
      data.shareId,
      data as any,
      data.isPublicEnabled
    );
    broadcastPreviewUpdate('nilai', data.shareId, data.classId, data);
  },

  async getPublicNilai(shareId: string): Promise<PublicNilaiData | null> {
    return (await PublicShareService.getPublicShare(shareId, 'nilai')) as unknown as PublicNilaiData | null;
  },

  subscribePublicNilai(
    shareId: string,
    callback: (data: PublicNilaiData | null) => void,
    onError?: (err: any) => void
  ): () => void {
    const sub = PublicShareService.subscribeShare(shareId, 'nilai', (payload) => {
      callback(payload as unknown as PublicNilaiData);
    });

    this.getPublicNilai(shareId)
      .then((data) => callback(data))
      .catch((err) => {
        if (onError) onError(err);
      });

    return () => sub.unsubscribe();
  },
};

export interface UserWorkspaceData extends TeacherWorkspaceData {
  savings?: SavingTransaction[];
  isNewUser?: boolean;
}

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
