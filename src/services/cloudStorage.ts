import {
  TeacherProfile,
  ClassRoom,
  Student,
  AttendanceSession,
  StudentGrade,
  TeacherWorkspaceData,
  TeachingAgenda,
} from '../types';
import { IndexedDBManager } from '../utils/indexedDb';
import { ClassService } from './classService';
import { StudentService } from './studentService';
import { AttendanceService } from './attendanceService';
import { GradeService } from './gradeService';
import { AgendaService } from './agendaService';
import { AuthService } from './authService';

/**
 * Cloud Storage Service for Multi-Device Persistence backed by Supabase
 */
export const CloudStorage = {
  getEmailCacheKey(emailOrUid: string): string {
    const cleanKey = (emailOrUid || 'anonymous')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');
    return `absensi_workspace_${cleanKey}`;
  },

  /**
   * Saves teacher workspace to Supabase and caches locally in IndexedDB
   */
  async saveWorkspace(
    teacherUid: string,
    email: string,
    data: {
      teacher: TeacherProfile;
      classes: ClassRoom[];
      activeClassId: string;
      students: Student[];
      sessions: AttendanceSession[];
      grades: StudentGrade[];
      agendas?: TeachingAgenda[];
    }
  ): Promise<boolean> {
    const payload: TeacherWorkspaceData = {
      teacherUid,
      email: email.toLowerCase().trim(),
      teacher: data.teacher,
      classes: data.classes,
      activeClassId: data.activeClassId,
      students: data.students,
      sessions: data.sessions,
      grades: data.grades,
      agendas: data.agendas,
      updatedAt: new Date().toISOString(),
    };

    // 1. Save to local IndexedDB cache immediately
    await IndexedDBManager.setCache(this.getEmailCacheKey(email || teacherUid), payload);

    if (!teacherUid) return true;

    // 2. Granular parallel persistence to Supabase
    try {
      await Promise.allSettled([
        AuthService.updateProfile(teacherUid, data.teacher),
        ClassService.saveClassesBatch(teacherUid, data.classes),
        StudentService.saveStudentsBatch(data.students),
        AttendanceService.saveAttendanceSessionsBatch(teacherUid, data.sessions),
        GradeService.saveGradesBatch(data.grades),
        data.agendas ? AgendaService.saveAgendasBatch(teacherUid, data.agendas) : Promise.resolve(),
      ]);
      return true;
    } catch (err) {
      console.warn('[CloudStorage] Notice persisting to Supabase:', err);
      return true;
    }
  },

  /**
   * Loads teacher workspace from Supabase, falling back to IndexedDB cache
   */
  async loadWorkspace(
    teacherUid: string,
    email: string
  ): Promise<TeacherWorkspaceData | null> {
    const cacheKey = this.getEmailCacheKey(email || teacherUid);

    // 1. Try reading from Supabase
    if (teacherUid) {
      try {
        const [profile, classes, students, sessions, grades, agendas] = await Promise.all([
          AuthService.getProfile(teacherUid),
          ClassService.listClasses(teacherUid),
          StudentService.listAllStudents(),
          AttendanceService.listAttendanceSessions(teacherUid),
          GradeService.listGrades(),
          AgendaService.listAgendas(teacherUid),
        ]);

        if (classes.length > 0 || students.length > 0) {
          const workspace: TeacherWorkspaceData = {
            teacherUid,
            email: email || '',
            teacher: profile || {
              id: teacherUid,
              namaGuru: 'Guru SMK Muhammadiyah Bawang',
              nip: '-',
              namaSekolah: 'SMK Muhammadiyah Bawang',
              mataPelajaranUtama: 'Bahasa Inggris',
              tahunAjaran: '2026/2027',
              semester: 'Ganjil',
              isLoggedIn: true,
            },
            classes,
            activeClassId: classes[0]?.id || '',
            students,
            sessions,
            grades,
            agendas,
            updatedAt: new Date().toISOString(),
          };

          await IndexedDBManager.setCache(cacheKey, workspace);
          return workspace;
        }
      } catch (err) {
        console.warn('[CloudStorage] Supabase load error, checking cache:', err);
      }
    }

    // 2. Fallback to IndexedDB cache
    const cached = await IndexedDBManager.getCache<TeacherWorkspaceData>(cacheKey);
    if (cached) return cached;

    // 3. Fallback to localStorage legacy
    try {
      const local = localStorage.getItem(cacheKey);
      if (local) return JSON.parse(local);
    } catch {}

    return null;
  },
};
