import {
  FullDatabaseBackup,
  TeacherProfile,
  ClassRoom,
  Student,
  AttendanceSession,
  StudentGrade,
  TeachingAgenda,
  GradeColumnHeader,
  SavingTransaction,
} from '../types';
import { Storage } from './storage';

export interface BackupValidationResult {
  isValid: boolean;
  error?: string;
  backup?: FullDatabaseBackup;
  summary?: {
    classesCount: number;
    studentsCount: number;
    sessionsCount: number;
    gradesCount: number;
    agendasCount: number;
    savingsCount: number;
    exportedAt: string;
    teacherName: string;
    schoolName: string;
  };
}

/**
 * Generate full database backup object
 */
export function buildDatabaseBackup(
  teacher: TeacherProfile,
  classes: ClassRoom[],
  activeClassId: string,
  allStudents: Student[],
  allSessions: AttendanceSession[],
  allGrades: StudentGrade[],
  allAgendas: TeachingAgenda[],
  allSavings: SavingTransaction[]
): FullDatabaseBackup {
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Collect grade headers for all classes
  const gradeHeadersMap: Record<string, GradeColumnHeader[]> = {};
  classes.forEach((cls) => {
    gradeHeadersMap[cls.id] = Storage.getGradeHeaders(cls.id, teacher.semester, teacher.tahunAjaran);
  });

  // Collect Kisi-Kisi & Kartu Soal data from localStorage
  let kisiKartuSoalData: any = null;
  try {
    const idStr = localStorage.getItem('kisi_kartu_soal_v1_identitas');
    const masterStr = localStorage.getItem('kisi_kartu_soal_v1_master');
    const soalStr = localStorage.getItem('kisi_kartu_soal_v1_soal');
    if (idStr || masterStr || soalStr) {
      kisiKartuSoalData = {
        identitas: idStr ? JSON.parse(idStr) : null,
        masterData: masterStr ? JSON.parse(masterStr) : [],
        soalData: soalStr ? JSON.parse(soalStr) : [],
      };
    }
  } catch (e) {
    console.warn('Failed collecting kisi-kartu-soal backup:', e);
  }

  const backup: FullDatabaseBackup = {
    app: 'SIM Presensi, Nilai & Tabungan Siswa SMK Muhammadiyah Bawang',
    version: '2.2.0',
    exportedAt: now.toISOString(),
    exportedAtFormatted: dateFormatted,
    exportedBy: {
      namaGuru: teacher.namaGuru || 'Guru SMK',
      nip: teacher.nip || '-',
      nbm: teacher.nbm || '-',
      namaSekolah: teacher.namaSekolah || 'SMK Muhammadiyah Bawang',
      email: teacher.email || '-',
    },
    summary: {
      totalClasses: classes.length,
      totalStudents: allStudents.length,
      totalAttendanceSessions: allSessions.length,
      totalGrades: allGrades.length,
      totalAgendas: allAgendas.length,
      totalSavingsTransactions: allSavings.length,
    },
    data: {
      teacher,
      classes,
      activeClassId,
      students: allStudents,
      sessions: allSessions,
      grades: allGrades,
      agendas: allAgendas,
      gradeHeaders: gradeHeadersMap,
      savings: allSavings,
      kisiKartuSoal: kisiKartuSoalData,
    },
  };

  return backup;
}

/**
 * Trigger immediate client-side download of backup JSON file
 */
export function downloadBackupJson(backup: FullDatabaseBackup): void {
  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const teacherSlug = (backup.exportedBy.namaGuru || 'Guru')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 20);
  const dateSlug = new Date().toISOString().slice(0, 10);
  const timeSlug = new Date().toTimeString().slice(0, 5).replace(':', '-');
  const filename = `Backup_Database_SMK_Bawang_${teacherSlug}_${dateSlug}_${timeSlug}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validate and parse a backup file string
 */
export function validateBackupJson(jsonString: string): BackupValidationResult {
  try {
    const parsed = JSON.parse(jsonString);

    if (!parsed || typeof parsed !== 'object') {
      return { isValid: false, error: 'Format file tidak valid (bukan objek JSON).' };
    }

    if (!parsed.data || typeof parsed.data !== 'object') {
      return {
        isValid: false,
        error: 'File JSON ini tidak memiliki struktur data cadangan yang valid.',
      };
    }

    const { data } = parsed;
    const classes = Array.isArray(data.classes) ? data.classes : [];
    const students = Array.isArray(data.students) ? data.students : [];
    const sessions = Array.isArray(data.sessions) ? data.sessions : [];
    const grades = Array.isArray(data.grades) ? data.grades : [];
    const agendas = Array.isArray(data.agendas) ? data.agendas : [];
    const savings = Array.isArray(data.savings) ? data.savings : [];

    return {
      isValid: true,
      backup: parsed as FullDatabaseBackup,
      summary: {
        classesCount: classes.length,
        studentsCount: students.length,
        sessionsCount: sessions.length,
        gradesCount: grades.length,
        agendasCount: agendas.length,
        savingsCount: savings.length,
        exportedAt: parsed.exportedAtFormatted || parsed.exportedAt || 'Tidak diketahui',
        teacherName: parsed.exportedBy?.namaGuru || data.teacher?.namaGuru || 'Guru',
        schoolName: parsed.exportedBy?.namaSekolah || data.teacher?.namaSekolah || 'SMK',
      },
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: 'Gagal memproses file JSON: ' + (err.message || 'Format JSON rusak/tidak valid.'),
    };
  }
}

/**
 * Merge or Replace restored data with existing data
 */
export function processRestoredData(
  current: {
    teacher: TeacherProfile;
    classes: ClassRoom[];
    students: Student[];
    sessions: AttendanceSession[];
    grades: StudentGrade[];
    agendas: TeachingAgenda[];
    savings: SavingTransaction[];
  },
  backup: FullDatabaseBackup,
  mode: 'replace' | 'merge'
): {
  teacher: TeacherProfile;
  classes: ClassRoom[];
  activeClassId: string;
  students: Student[];
  sessions: AttendanceSession[];
  grades: StudentGrade[];
  agendas: TeachingAgenda[];
  savings: SavingTransaction[];
} {
  const bData = backup.data;

  if (mode === 'replace') {
    const activeClassId =
      bData.activeClassId || (bData.classes && bData.classes[0]?.id) || 'class-1';

    // Restore grade headers if available
    if (bData.gradeHeaders) {
      Object.entries(bData.gradeHeaders).forEach(([cId, headers]) => {
        Storage.setGradeHeaders(cId, headers);
      });
    }

    // Restore Kisi-kisi data if available
    if (bData.kisiKartuSoal) {
      try {
        if (bData.kisiKartuSoal.identitas) {
          localStorage.setItem(
            'kisi_kartu_soal_v1_identitas',
            JSON.stringify(bData.kisiKartuSoal.identitas)
          );
        }
        if (bData.kisiKartuSoal.masterData) {
          localStorage.setItem(
            'kisi_kartu_soal_v1_master',
            JSON.stringify(bData.kisiKartuSoal.masterData)
          );
        }
        if (bData.kisiKartuSoal.soalData) {
          localStorage.setItem(
            'kisi_kartu_soal_v1_soal',
            JSON.stringify(bData.kisiKartuSoal.soalData)
          );
        }
      } catch (e) {
        console.warn('Failed restoring kisi-kartu-soal:', e);
      }
    }

    return {
      teacher: bData.teacher || current.teacher,
      classes: bData.classes || [],
      activeClassId,
      students: bData.students || [],
      sessions: bData.sessions || [],
      grades: bData.grades || [],
      agendas: bData.agendas || [],
      savings: bData.savings || [],
    };
  }

  // MERGE MODE: Combine unique entries without overwriting existing
  const existingClassIds = new Set(current.classes.map((c) => c.id));
  const mergedClasses = [
    ...current.classes,
    ...(bData.classes || []).filter((c) => !existingClassIds.has(c.id)),
  ];

  const existingStudentIds = new Set(current.students.map((s) => s.id));
  const mergedStudents = [
    ...current.students,
    ...(bData.students || []).filter((s) => !existingStudentIds.has(s.id)),
  ];

  const existingSessionIds = new Set(current.sessions.map((s) => s.id));
  const mergedSessions = [
    ...current.sessions,
    ...(bData.sessions || []).filter((s) => !existingSessionIds.has(s.id)),
  ];

  const existingGradeIds = new Set(current.grades.map((g) => g.id));
  const mergedGrades = [
    ...current.grades,
    ...(bData.grades || []).filter((g) => !existingGradeIds.has(g.id)),
  ];

  const existingAgendaIds = new Set(current.agendas.map((a) => a.id));
  const mergedAgendas = [
    ...current.agendas,
    ...(bData.agendas || []).filter((a) => !existingAgendaIds.has(a.id)),
  ];

  const existingSavingIds = new Set(current.savings.map((s) => s.id));
  const mergedSavings = [
    ...current.savings,
    ...(bData.savings || []).filter((s) => !existingSavingIds.has(s.id)),
  ];

  return {
    teacher: current.teacher,
    classes: mergedClasses,
    activeClassId: current.classes[0]?.id || bData.activeClassId || 'class-1',
    students: mergedStudents,
    sessions: mergedSessions,
    grades: mergedGrades,
    agendas: mergedAgendas,
    savings: mergedSavings,
  };
}
