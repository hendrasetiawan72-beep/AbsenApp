import {
  TeacherProfile,
  ClassRoom,
  Student,
  AttendanceSession,
  StudentGrade,
  TeachingAgenda,
  GradeColumnHeader,
} from '../types';
import { getDefaultGradeHeaders } from './gradeHeaders';
import { GradualSyncManager } from '../services/gradualSyncManager';
import { HENDRA_MASTER_DATA } from '../data/seedData';

const STORAGE_KEYS = {
  TEACHER: 'absensi_teacher_profile',
  CLASSES: 'absensi_classes',
  ACTIVE_CLASS: 'absensi_active_class_id',
  STUDENTS: 'absensi_students',
  ATTENDANCE: 'absensi_sessions',
  GRADES: 'absensi_grades',
  GRADE_HEADERS: 'absensi_grade_headers',
  AGENDAS: 'absensi_teaching_agendas',
  SAVINGS: 'absensi_student_savings',
};

const DEFAULT_TEACHER: TeacherProfile = HENDRA_MASTER_DATA.data.teacher;
const DEFAULT_CLASSES: ClassRoom[] = HENDRA_MASTER_DATA.data.classes;
const DEFAULT_STUDENTS: Student[] = HENDRA_MASTER_DATA.data.students;
const DEFAULT_SESSIONS: AttendanceSession[] = HENDRA_MASTER_DATA.data.sessions;
const DEFAULT_GRADES: StudentGrade[] = HENDRA_MASTER_DATA.data.grades;
const DEFAULT_AGENDAS: TeachingAgenda[] = HENDRA_MASTER_DATA.data.agendas || [];
const DEFAULT_SAVINGS: import('../types').SavingTransaction[] = HENDRA_MASTER_DATA.data.savings || [];

export const Storage = {
  /**
   * Check if browser has custom local data saved by the user
   * (returns false if only using untouched default demo datasets)
   */
  hasCustomLocalData(): boolean {
    try {
      const classesRaw = localStorage.getItem(STORAGE_KEYS.CLASSES);
      const teacherRaw = localStorage.getItem(STORAGE_KEYS.TEACHER);
      const studentsRaw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (!classesRaw && !teacherRaw && !studentsRaw) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  getTeacher(): TeacherProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TEACHER);
      if (!data) return DEFAULT_TEACHER;
      const parsed = JSON.parse(data);
      // Migrate old default school name to SMK Muhammadiyah Bawang if needed
      if (!parsed.namaSekolah || parsed.namaSekolah.includes('Teladan Nusantara')) {
        parsed.namaSekolah = 'SMK Muhammadiyah Bawang';
      }
      if (!parsed.email) {
        parsed.email = '';
      }
      return parsed;
    } catch {
      return DEFAULT_TEACHER;
    }
  },

  setTeacher(teacher: TeacherProfile, skipMarkChange?: boolean): void {
    localStorage.setItem(STORAGE_KEYS.TEACHER, JSON.stringify(teacher));
    if (!skipMarkChange) {
      GradualSyncManager.markLocalChange('teacher');
    }
  },

  getClasses(): ClassRoom[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLASSES);
      return data ? JSON.parse(data) : DEFAULT_CLASSES;
    } catch {
      return DEFAULT_CLASSES;
    }
  },

  setClasses(classes: ClassRoom[], skipMarkChange?: boolean): void {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
    if (!skipMarkChange) {
      GradualSyncManager.markLocalChange('classes');
    }
  },

  getActiveClassId(): string {
    const classes = this.getClasses();
    const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_CLASS);
    if (stored && classes.some((c) => c.id === stored)) {
      return stored;
    }
    return HENDRA_MASTER_DATA.data.activeClassId || classes[0]?.id || '';
  },

  setActiveClassId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CLASS, id);
  },

  getAllStudents(): Student[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      return data ? JSON.parse(data) : DEFAULT_STUDENTS;
    } catch {
      return DEFAULT_STUDENTS;
    }
  },

  setAllStudents(students: Student[], skipMarkChange?: boolean): void {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    if (!skipMarkChange) {
      GradualSyncManager.markLocalChange('students');
    }
  },

  getStudentsByClass(classId: string): Student[] {
    const all = this.getAllStudents();
    return all.filter((s) => s.classId === classId).sort((a, b) => a.no - b.no);
  },

  getAllSessions(): AttendanceSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      return data ? JSON.parse(data) : DEFAULT_SESSIONS;
    } catch {
      return DEFAULT_SESSIONS;
    }
  },

  setAllSessions(sessions: AttendanceSession[], skipMarkChange?: boolean): void {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(sessions));
    if (!skipMarkChange) {
      GradualSyncManager.markLocalChange('sessions');
    }
  },

  getSessionsByClass(classId: string): AttendanceSession[] {
    const all = this.getAllSessions();
    return all.filter((s) => s.classId === classId).sort((a, b) => a.pertemuanKe - b.pertemuanKe);
  },

  getAllGrades(): StudentGrade[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GRADES);
      const rawList: StudentGrade[] = data ? JSON.parse(data) : DEFAULT_GRADES;

      // Ensure every grade item has the 10 assessment columns initialized
      return rawList.map((g) => ({
        ...g,
        formatif1: g.formatif1 ?? g.tugas1 ?? null,
        formatif2: g.formatif2 ?? g.tugas2 ?? null,
        formatif3: g.formatif3 ?? g.tugas3 ?? null,
        formatif4: g.formatif4 ?? g.praktik ?? null,
        formatif5: g.formatif5 ?? null,
        formatif6: g.formatif6 ?? null,
        formatif7: g.formatif7 ?? null,
        formatif8: g.formatif8 ?? null,
        sumatifTengah: g.sumatifTengah ?? g.uts ?? null,
        sumatifAkhir: g.sumatifAkhir ?? g.uas ?? null,
      }));
    } catch {
      return DEFAULT_GRADES;
    }
  },

  setAllGrades(grades: StudentGrade[], skipMarkChange?: boolean): void {
    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(grades));
    if (!skipMarkChange) {
      GradualSyncManager.markLocalChange('grades');
    }
  },

  getGradesByClass(classId: string): StudentGrade[] {
    const all = this.getAllGrades();
    return all.filter((g) => g.classId === classId);
  },

  getGradeHeaders(
    classId: string,
    semester: 'Ganjil' | 'Genap' = 'Ganjil',
    academicYear: string = '2025/2026'
  ): GradeColumnHeader[] {
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.GRADE_HEADERS}_${classId}`);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return getDefaultGradeHeaders(semester, academicYear);
    } catch {
      return getDefaultGradeHeaders(semester, academicYear);
    }
  },

  setGradeHeaders(classId: string, headers: GradeColumnHeader[], skipMarkChange?: boolean): void {
    try {
      localStorage.setItem(
        `${STORAGE_KEYS.GRADE_HEADERS}_${classId}`,
        JSON.stringify(headers)
      );
      if (!skipMarkChange) {
        GradualSyncManager.markLocalChange('gradeHeaders');
      }
    } catch (err) {
      console.error('Failed to save grade headers to localStorage:', err);
    }
  },

  getAllGradeHeadersMap(): Record<string, GradeColumnHeader[]> {
    const classes = this.getClasses();
    const map: Record<string, GradeColumnHeader[]> = {};
    classes.forEach((c) => {
      map[c.id] = this.getGradeHeaders(c.id);
    });
    return map;
  },

  setAllGradeHeadersMap(map: Record<string, GradeColumnHeader[]>, skipMarkChange?: boolean): void {
    if (!map || typeof map !== 'object') return;
    Object.entries(map).forEach(([classId, headers]) => {
      if (Array.isArray(headers) && headers.length > 0) {
        this.setGradeHeaders(classId, headers, skipMarkChange);
      }
    });
  },

  getAllAgendas(): TeachingAgenda[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AGENDAS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  setAllAgendas(agendas: TeachingAgenda[], skipMarkChange?: boolean): void {
    localStorage.setItem(STORAGE_KEYS.AGENDAS, JSON.stringify(agendas));
    if (!skipMarkChange) {
      GradualSyncManager.markLocalChange('agendas');
    }
  },

  getAgendasByClass(classId: string): TeachingAgenda[] {
    const all = this.getAllAgendas();
    return all.filter((a) => a.classId === classId);
  },

  getAllSavings(): import('../types').SavingTransaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SAVINGS);
      return data ? JSON.parse(data) : DEFAULT_SAVINGS;
    } catch {
      return DEFAULT_SAVINGS;
    }
  },

  setAllSavings(savings: import('../types').SavingTransaction[], skipMarkChange?: boolean): void {
    localStorage.setItem(STORAGE_KEYS.SAVINGS, JSON.stringify(savings));
    if (!skipMarkChange) {
      GradualSyncManager.markLocalChange('savings');
    }
  },

  getSavingsByClass(classId: string): import('../types').SavingTransaction[] {
    const all = this.getAllSavings();
    return all.filter((s) => s.classId === classId);
  },

  // Reset to default demo data
  resetToDefault(): void {
    localStorage.setItem(STORAGE_KEYS.TEACHER, JSON.stringify(DEFAULT_TEACHER));
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(DEFAULT_CLASSES));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CLASS, HENDRA_MASTER_DATA.data.activeClassId || DEFAULT_CLASSES[0]?.id || '');
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(DEFAULT_STUDENTS));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(DEFAULT_SESSIONS));
    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(DEFAULT_GRADES));
    localStorage.setItem(STORAGE_KEYS.SAVINGS, JSON.stringify(DEFAULT_SAVINGS));
    localStorage.setItem(STORAGE_KEYS.AGENDAS, JSON.stringify(DEFAULT_AGENDAS));
    GradualSyncManager.markLocalChange('reset');
  },
};
