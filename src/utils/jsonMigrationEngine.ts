import {
  TeacherProfile,
  ClassRoom,
  Student,
  AttendanceSession,
  StudentGrade,
  TeachingAgenda,
  SavingTransaction,
} from '../types';
import {
  MigrationDryRunResult,
  MigrationImportRecord,
  MigrationImportItem,
  MigrationDuplicateStrategy,
  EntityDryRunStats,
} from '../types/migration';

const MIGRATION_IMPORTS_KEY = 'migration_imports_history';
const MIGRATION_ITEMS_KEY = 'migration_import_items_history';

/**
 * Normalizes an entity to include legacy_id
 */
function withLegacyId<T extends { id: string; legacy_id?: string }>(item: T): T {
  return {
    ...item,
    legacy_id: item.legacy_id || item.id,
  };
}

/**
 * Dry-run validation engine
 * Analyzes JSON content, checks schema, validates relationships, and detects duplicates.
 * DOES NOT commit any changes.
 */
export function validateAndDryRunJson(
  jsonString: string,
  fileName: string,
  adminUser: { id: string; email?: string },
  existing: {
    classes: ClassRoom[];
    students: Student[];
    sessions: AttendanceSession[];
    grades: StudentGrade[];
    agendas: TeachingAgenda[];
    savings: SavingTransaction[];
  }
): MigrationDryRunResult {
  let parsed: any;
  const errors: MigrationDryRunResult['errors'] = [];
  const missingFields: string[] = [];

  const emptyStats = (): EntityDryRunStats => ({
    total: 0,
    valid: 0,
    invalid: 0,
    duplicates: 0,
    missingFields: [],
    items: [],
  });

  const breakdown = {
    teacher: emptyStats(),
    classes: emptyStats(),
    students: emptyStats(),
    sessions: emptyStats(),
    grades: emptyStats(),
    agendas: emptyStats(),
    savings: emptyStats(),
  };

  try {
    parsed = JSON.parse(jsonString);
  } catch (err: any) {
    return {
      isValid: false,
      formatDetected: 'unknown',
      fileName,
      adminUserId: adminUser.id,
      summary: {
        totalRecords: 0,
        validCount: 0,
        invalidCount: 0,
        duplicateCount: 0,
        missingFields: ['Format JSON tidak valid / syntax error'],
      },
      breakdown,
      errors: [
        {
          entity: 'file',
          message: `Gagal membaca file JSON: ${err.message || 'Syntax error'}`,
        },
      ],
      payloadToImport: null,
    };
  }

  // Detect payload structure
  let formatDetected: MigrationDryRunResult['formatDetected'] = 'unknown';
  let rawClasses: any[] = [];
  let rawStudents: any[] = [];
  let rawSessions: any[] = [];
  let rawGrades: any[] = [];
  let rawAgendas: any[] = [];
  let rawSavings: any[] = [];
  let rawTeacher: any = null;

  if (Array.isArray(parsed)) {
    // Array format - identify by first element's keys
    const first = parsed[0] || {};
    if ('namaKelas' in first || ('kelas' in first && !('nisn' in first) && !('gender' in first))) {
      formatDetected = 'class_array';
      rawClasses = parsed;
    } else if ('nisn' in first || 'gender' in first || 'nama' in first) {
      formatDetected = 'student_array';
      rawStudents = parsed;
    } else if ('pertemuanKe' in first || 'topikMateri' in first) {
      formatDetected = 'session_array';
      rawSessions = parsed;
    } else {
      formatDetected = 'student_array';
      rawStudents = parsed;
    }
  } else if (parsed && typeof parsed === 'object') {
    if (parsed.data && typeof parsed.data === 'object') {
      formatDetected = 'full_backup';
      rawClasses = Array.isArray(parsed.data.classes) ? parsed.data.classes : [];
      rawStudents = Array.isArray(parsed.data.students) ? parsed.data.students : [];
      rawSessions = Array.isArray(parsed.data.sessions) ? parsed.data.sessions : [];
      rawGrades = Array.isArray(parsed.data.grades) ? parsed.data.grades : [];
      rawAgendas = Array.isArray(parsed.data.agendas) ? parsed.data.agendas : [];
      rawSavings = Array.isArray(parsed.data.savings) ? parsed.data.savings : [];
      rawTeacher = parsed.data.teacher || null;
    } else {
      // Loose object format
      formatDetected = 'full_backup';
      rawClasses = Array.isArray(parsed.classes) ? parsed.classes : [];
      rawStudents = Array.isArray(parsed.students) ? parsed.students : [];
      rawSessions = Array.isArray(parsed.sessions) ? parsed.sessions : [];
      rawGrades = Array.isArray(parsed.grades) ? parsed.grades : [];
      rawAgendas = Array.isArray(parsed.agendas) ? parsed.agendas : [];
      rawSavings = Array.isArray(parsed.savings) ? parsed.savings : [];
      rawTeacher = parsed.teacher || null;
    }
  }

  // --- 1. VALIDATE TEACHER PROFILE ---
  if (rawTeacher) {
    breakdown.teacher.total = 1;
    if (rawTeacher.namaGuru || rawTeacher.email) {
      breakdown.teacher.valid = 1;
      breakdown.teacher.items.push({
        legacy_id: rawTeacher.legacy_id || rawTeacher.id,
        identifier: rawTeacher.namaGuru || rawTeacher.email,
        status: 'valid',
        data: rawTeacher,
      });
    } else {
      breakdown.teacher.invalid = 1;
      errors.push({ entity: 'teacher', message: 'Profil guru tidak memiliki nama atau email' });
    }
  }

  // --- 2. VALIDATE CLASSES & DUPLICATE CHECK ---
  const existingClassMap = new Map<string, ClassRoom>();
  const existingClassByName = new Map<string, ClassRoom>();
  existing.classes.forEach((c) => {
    existingClassMap.set(c.id, c);
    if (c.legacy_id) existingClassMap.set(c.legacy_id, c);
    existingClassByName.set(c.namaKelas.toLowerCase().trim(), c);
  });

  const parsedClassMap = new Map<string, any>();

  rawClasses.forEach((raw, idx) => {
    breakdown.classes.total++;
    const legacyId = raw.legacy_id || raw.id || `class-import-${idx + 1}`;
    const className = (raw.namaKelas || raw.nama_kelas || raw.name || raw.kelas || '').trim();

    if (!className) {
      breakdown.classes.invalid++;
      errors.push({
        entity: 'classes',
        rowNumber: idx + 1,
        message: 'Nama kelas wajib diisi',
        dataPreview: raw,
      });
      return;
    }

    const isDuplicate = existingClassMap.has(legacyId) || existingClassByName.has(className.toLowerCase());
    if (isDuplicate) {
      breakdown.classes.duplicates++;
      breakdown.classes.items.push({
        legacy_id: legacyId,
        identifier: className,
        status: 'duplicate',
        warningOrError: 'Kelas sudah ada di database',
        data: raw,
      });
    } else {
      breakdown.classes.valid++;
      breakdown.classes.items.push({
        legacy_id: legacyId,
        identifier: className,
        status: 'valid',
        data: raw,
      });
    }

    parsedClassMap.set(legacyId, { ...raw, id: legacyId, legacy_id: legacyId, namaKelas: className });
    parsedClassMap.set(className.toLowerCase(), { ...raw, id: legacyId, legacy_id: legacyId, namaKelas: className });
  });

  // --- 3. VALIDATE STUDENTS & DUPLICATE CHECK ---
  const existingStudentMap = new Map<string, Student>();
  const existingStudentByNisn = new Map<string, Student>();
  existing.students.forEach((s) => {
    existingStudentMap.set(s.id, s);
    if (s.legacy_id) existingStudentMap.set(s.legacy_id, s);
    if (s.nisn && s.nisn !== '-') existingStudentByNisn.set(s.nisn.trim(), s);
  });

  rawStudents.forEach((raw, idx) => {
    breakdown.students.total++;
    const legacyId = raw.legacy_id || raw.id || `std-import-${idx + 1}`;
    const name = (raw.nama || raw.nama_siswa || raw.name || '').trim();
    const nisn = (raw.nisn || raw.nis || '-').toString().trim();
    const rawClassId = (raw.classId || raw.class_id || raw.kelas_id || raw.kelas || '').toString().trim();

    if (!name) {
      breakdown.students.invalid++;
      errors.push({
        entity: 'students',
        rowNumber: idx + 1,
        message: 'Nama siswa wajib diisi',
        dataPreview: raw,
      });
      return;
    }

    // Relationship check: classId must exist in existing classes or incoming classes
    const foundClass =
      existingClassMap.get(rawClassId) ||
      existingClassByName.get(rawClassId.toLowerCase()) ||
      parsedClassMap.get(rawClassId) ||
      parsedClassMap.get(rawClassId.toLowerCase());

    if (!foundClass && rawClassId) {
      missingFields.push(`Siswa "${name}" memiliki referensi kelas "${rawClassId}" yang belum terdaftar.`);
    }

    const isDuplicate =
      existingStudentMap.has(legacyId) || (nisn !== '-' && existingStudentByNisn.has(nisn));

    if (isDuplicate) {
      breakdown.students.duplicates++;
      breakdown.students.items.push({
        legacy_id: legacyId,
        identifier: `${name} (${nisn})`,
        status: 'duplicate',
        warningOrError: 'Siswa / NISN sudah terdaftar di database',
        data: raw,
      });
    } else {
      breakdown.students.valid++;
      breakdown.students.items.push({
        legacy_id: legacyId,
        identifier: `${name} (${nisn})`,
        status: 'valid',
        data: raw,
      });
    }
  });

  // --- 4. VALIDATE SESSIONS & DUPLICATE CHECK ---
  const existingSessionMap = new Map<string, AttendanceSession>();
  existing.sessions.forEach((ses) => {
    existingSessionMap.set(ses.id, ses);
    if (ses.legacy_id) existingSessionMap.set(ses.legacy_id, ses);
    const key = `${ses.classId}_${ses.tanggal}_${ses.pertemuanKe}`;
    existingSessionMap.set(key, ses);
  });

  rawSessions.forEach((raw, idx) => {
    breakdown.sessions.total++;
    const legacyId = raw.legacy_id || raw.id || `ses-import-${idx + 1}`;
    const tanggal = raw.tanggal || new Date().toISOString().slice(0, 10);
    const classId = raw.classId || raw.class_id || '';
    const pertemuanKe = Number(raw.pertemuanKe || raw.pertemuan_ke) || 1;
    const key = `${classId}_${tanggal}_${pertemuanKe}`;

    const isDuplicate = existingSessionMap.has(legacyId) || existingSessionMap.has(key);
    if (isDuplicate) {
      breakdown.sessions.duplicates++;
      breakdown.sessions.items.push({
        legacy_id: legacyId,
        identifier: `Pertemuan ${pertemuanKe} (${tanggal})`,
        status: 'duplicate',
        warningOrError: 'Sesi tanggal dan pertemuan ini sudah ada',
        data: raw,
      });
    } else {
      breakdown.sessions.valid++;
      breakdown.sessions.items.push({
        legacy_id: legacyId,
        identifier: `Pertemuan ${pertemuanKe} (${tanggal})`,
        status: 'valid',
        data: raw,
      });
    }
  });

  // --- 5. VALIDATE GRADES ---
  const existingGradesMap = new Map<string, StudentGrade>();
  existing.grades.forEach((g) => {
    existingGradesMap.set(g.id, g);
    if (g.legacy_id) existingGradesMap.set(g.legacy_id, g);
    existingGradesMap.set(`${g.classId}_${g.studentId}`, g);
  });

  rawGrades.forEach((raw, idx) => {
    breakdown.grades.total++;
    const legacyId = raw.legacy_id || raw.id || `grd-import-${idx + 1}`;
    const key = `${raw.classId || raw.class_id}_${raw.studentId || raw.student_id}`;

    const isDuplicate = existingGradesMap.has(legacyId) || existingGradesMap.has(key);
    if (isDuplicate) {
      breakdown.grades.duplicates++;
      breakdown.grades.items.push({
        legacy_id: legacyId,
        identifier: `Nilai Siswa (${raw.studentId})`,
        status: 'duplicate',
        warningOrError: 'Catatan nilai siswa untuk kelas ini sudah ada',
        data: raw,
      });
    } else {
      breakdown.grades.valid++;
      breakdown.grades.items.push({
        legacy_id: legacyId,
        identifier: `Nilai Siswa (${raw.studentId})`,
        status: 'valid',
        data: raw,
      });
    }
  });

  // --- 6. VALIDATE AGENDAS ---
  rawAgendas.forEach((raw, idx) => {
    breakdown.agendas.total++;
    const legacyId = raw.legacy_id || raw.id || `agd-import-${idx + 1}`;
    breakdown.agendas.valid++;
    breakdown.agendas.items.push({
      legacy_id: legacyId,
      identifier: `${raw.tanggal || ''} - ${raw.materiAjar || 'Agenda'}`,
      status: 'valid',
      data: raw,
    });
  });

  // --- 7. VALIDATE SAVINGS ---
  rawSavings.forEach((raw, idx) => {
    breakdown.savings.total++;
    const legacyId = raw.legacy_id || raw.id || `sav-import-${idx + 1}`;
    breakdown.savings.valid++;
    breakdown.savings.items.push({
      legacy_id: legacyId,
      identifier: `${raw.studentName || 'Siswa'} - Rp ${Number(raw.nominal || 0).toLocaleString('id-ID')}`,
      status: 'valid',
      data: raw,
    });
  });

  const totalRecords =
    breakdown.classes.total +
    breakdown.students.total +
    breakdown.sessions.total +
    breakdown.grades.total +
    breakdown.agendas.total +
    breakdown.savings.total;

  const validCount =
    breakdown.classes.valid +
    breakdown.students.valid +
    breakdown.sessions.valid +
    breakdown.grades.valid +
    breakdown.agendas.valid +
    breakdown.savings.valid;

  const invalidCount =
    breakdown.classes.invalid +
    breakdown.students.invalid +
    breakdown.sessions.invalid +
    breakdown.grades.invalid +
    breakdown.agendas.invalid +
    breakdown.savings.invalid;

  const duplicateCount =
    breakdown.classes.duplicates +
    breakdown.students.duplicates +
    breakdown.sessions.duplicates +
    breakdown.grades.duplicates +
    breakdown.agendas.duplicates +
    breakdown.savings.duplicates;

  return {
    isValid: errors.length === 0,
    formatDetected,
    fileName,
    adminUserId: adminUser.id,
    summary: {
      totalRecords,
      validCount,
      invalidCount,
      duplicateCount,
      missingFields,
    },
    breakdown,
    errors,
    payloadToImport: {
      teacher: rawTeacher,
      classes: rawClasses,
      students: rawStudents,
      sessions: rawSessions,
      grades: rawGrades,
      agendas: rawAgendas,
      savings: rawSavings,
      gradeHeaders: parsed?.data?.gradeHeaders || parsed?.gradeHeaders || null,
    },
  };
}

/**
 * Execute actual import with selected duplicate strategy and relational ID mapping.
 */
export function executeMigrationImport(
  dryRunResult: MigrationDryRunResult,
  strategy: MigrationDuplicateStrategy,
  adminUser: { id: string; email?: string },
  currentWorkspace: {
    teacher: TeacherProfile;
    classes: ClassRoom[];
    students: Student[];
    sessions: AttendanceSession[];
    grades: StudentGrade[];
    agendas: TeachingAgenda[];
    savings: SavingTransaction[];
  }
): {
  success: boolean;
  importRecord: MigrationImportRecord;
  importItems: MigrationImportItem[];
  updatedWorkspace: {
    teacher: TeacherProfile;
    classes: ClassRoom[];
    activeClassId: string;
    students: Student[];
    sessions: AttendanceSession[];
    grades: StudentGrade[];
    agendas: TeachingAgenda[];
    savings: SavingTransaction[];
  };
} {
  const importId = `mig-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const startedAt = new Date().toISOString();
  const importItems: MigrationImportItem[] = [];

  if (strategy === 'cancel') {
    const record: MigrationImportRecord = {
      id: importId,
      admin_user_id: adminUser.id,
      admin_email: adminUser.email || 'admin',
      file_name: dryRunResult.fileName,
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      total_records: dryRunResult.summary.totalRecords,
      valid_count: dryRunResult.summary.validCount,
      invalid_count: dryRunResult.summary.invalidCount,
      success_count: 0,
      failed_count: 0,
      duplicate_count: dryRunResult.summary.duplicateCount,
      status: 'cancelled',
      strategy,
      error_summary: 'Import dibatalkan oleh Admin.',
    };
    saveImportLog(record, []);
    return {
      success: false,
      importRecord: record,
      importItems: [],
      updatedWorkspace: {
        ...currentWorkspace,
        activeClassId: currentWorkspace.classes[0]?.id || '',
      },
    };
  }

  const { payloadToImport } = dryRunResult;
  let successCount = 0;
  let duplicateCount = 0;
  let failedCount = 0;

  // Legacy ID Mapping Table
  // Map<old_id/legacy_id, target_id>
  const classIdMap = new Map<string, string>();
  const studentIdMap = new Map<string, string>();

  // 1. Resolve & Merge Classes
  const existingClassMap = new Map<string, ClassRoom>();
  currentWorkspace.classes.forEach((c) => {
    existingClassMap.set(c.id, c);
    if (c.legacy_id) existingClassMap.set(c.legacy_id, c);
    classIdMap.set(c.id, c.id);
    if (c.legacy_id) classIdMap.set(c.legacy_id, c.id);
    classIdMap.set(c.namaKelas.toLowerCase().trim(), c.id);
  });

  const mergedClasses: ClassRoom[] = [...currentWorkspace.classes];

  (payloadToImport.classes || []).forEach((c: any) => {
    const legacyId = c.legacy_id || c.id;
    const existing = existingClassMap.get(legacyId) || existingClassMap.get(c.namaKelas?.toLowerCase()?.trim());

    if (existing) {
      if (strategy === 'skip') {
        duplicateCount++;
        importItems.push({
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          import_id: importId,
          entity_type: 'classes',
          legacy_id: legacyId,
          target_id: existing.id,
          name_or_title: c.namaKelas,
          status: 'skipped',
          details: 'Duplikat dilewati sesuai preferensi',
        });
        classIdMap.set(legacyId, existing.id);
        return;
      } else if (strategy === 'update') {
        const updated: ClassRoom = {
          ...existing,
          ...c,
          id: existing.id,
          legacy_id: legacyId,
        };
        const idx = mergedClasses.findIndex((item) => item.id === existing.id);
        if (idx !== -1) mergedClasses[idx] = updated;
        successCount++;
        importItems.push({
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          import_id: importId,
          entity_type: 'classes',
          legacy_id: legacyId,
          target_id: existing.id,
          name_or_title: c.namaKelas,
          status: 'updated',
          details: 'Data kelas diperbarui',
        });
        classIdMap.set(legacyId, existing.id);
        return;
      }
    }

    const newClass: ClassRoom = {
      ...c,
      id: legacyId || `class-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      legacy_id: legacyId,
      namaKelas: c.namaKelas || c.name || 'Kelas Baru',
      mataPelajaran: c.mataPelajaran || currentWorkspace.teacher.mataPelajaranUtama || 'Umum',
      kkm: Number(c.kkm) || 75,
      createdAt: c.createdAt || new Date().toISOString().slice(0, 10),
    };
    mergedClasses.push(newClass);
    classIdMap.set(legacyId, newClass.id);
    classIdMap.set(newClass.namaKelas.toLowerCase().trim(), newClass.id);
    existingClassMap.set(newClass.id, newClass);
    existingClassMap.set(legacyId, newClass);
    successCount++;
    importItems.push({
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      import_id: importId,
      entity_type: 'classes',
      legacy_id: legacyId,
      target_id: newClass.id,
      name_or_title: newClass.namaKelas,
      status: 'imported',
      details: 'Kelas baru berhasil ditambahkan',
    });
  });

  // 2. Resolve & Merge Students
  const existingStudentMap = new Map<string, Student>();
  currentWorkspace.students.forEach((s) => {
    existingStudentMap.set(s.id, s);
    if (s.legacy_id) existingStudentMap.set(s.legacy_id, s);
    if (s.nisn && s.nisn !== '-') existingStudentMap.set(s.nisn.trim(), s);
    studentIdMap.set(s.id, s.id);
    if (s.legacy_id) studentIdMap.set(s.legacy_id, s.id);
  });

  const mergedStudents: Student[] = [...currentWorkspace.students];

  (payloadToImport.students || []).forEach((s: any) => {
    const legacyId = s.legacy_id || s.id;
    const nisn = (s.nisn || '-').toString().trim();
    const existing = existingStudentMap.get(legacyId) || (nisn !== '-' ? existingStudentMap.get(nisn) : undefined);

    // Map classId
    const rawClassRef = (s.classId || s.class_id || s.kelas || '').toString().trim();
    const targetClassId = classIdMap.get(rawClassRef) || classIdMap.get(rawClassRef.toLowerCase()) || mergedClasses[0]?.id || 'class-1';

    if (existing) {
      if (strategy === 'skip') {
        duplicateCount++;
        importItems.push({
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          import_id: importId,
          entity_type: 'students',
          legacy_id: legacyId,
          target_id: existing.id,
          name_or_title: s.nama,
          status: 'skipped',
          details: 'Duplikat siswa dilewati',
        });
        studentIdMap.set(legacyId, existing.id);
        return;
      } else if (strategy === 'update') {
        const updated: Student = {
          ...existing,
          ...s,
          id: existing.id,
          legacy_id: legacyId,
          classId: targetClassId,
        };
        const idx = mergedStudents.findIndex((item) => item.id === existing.id);
        if (idx !== -1) mergedStudents[idx] = updated;
        successCount++;
        importItems.push({
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          import_id: importId,
          entity_type: 'students',
          legacy_id: legacyId,
          target_id: existing.id,
          name_or_title: s.nama,
          status: 'updated',
          details: 'Data siswa diperbarui',
        });
        studentIdMap.set(legacyId, existing.id);
        return;
      }
    }

    const newStudent: Student = {
      ...s,
      id: legacyId || `std-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      legacy_id: legacyId,
      classId: targetClassId,
      no: Number(s.no) || mergedStudents.filter((st) => st.classId === targetClassId).length + 1,
      nisn: nisn || '-',
      nama: s.nama || 'Siswa',
      gender: s.gender === 'P' ? 'P' : 'L',
      catatanUmum: s.catatanUmum || '',
    };
    mergedStudents.push(newStudent);
    studentIdMap.set(legacyId, newStudent.id);
    existingStudentMap.set(newStudent.id, newStudent);
    existingStudentMap.set(legacyId, newStudent);
    if (newStudent.nisn !== '-') existingStudentMap.set(newStudent.nisn, newStudent);
    successCount++;
    importItems.push({
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      import_id: importId,
      entity_type: 'students',
      legacy_id: legacyId,
      target_id: newStudent.id,
      name_or_title: newStudent.nama,
      status: 'imported',
      details: 'Siswa berhasil diimport',
    });
  });

  // 3. Resolve & Merge Attendance Sessions with records
  const existingSessionMap = new Map<string, AttendanceSession>();
  currentWorkspace.sessions.forEach((ses) => {
    existingSessionMap.set(ses.id, ses);
    if (ses.legacy_id) existingSessionMap.set(ses.legacy_id, ses);
  });

  const mergedSessions: AttendanceSession[] = [...currentWorkspace.sessions];

  (payloadToImport.sessions || []).forEach((ses: any) => {
    const legacyId = ses.legacy_id || ses.id;
    const targetClassId = classIdMap.get(ses.classId || ses.class_id) || mergedClasses[0]?.id || 'class-1';

    // Map student IDs in records
    const mappedRecords: AttendanceSession['records'] = {};
    if (ses.records && typeof ses.records === 'object') {
      Object.entries(ses.records).forEach(([stdKey, rec]: [string, any]) => {
        const resolvedStdId = studentIdMap.get(stdKey) || stdKey;
        mappedRecords[resolvedStdId] = {
          status: rec.status || 'H',
          catatan: rec.catatan || '',
        };
      });
    }

    const existing = existingSessionMap.get(legacyId);
    if (existing) {
      if (strategy === 'skip') {
        duplicateCount++;
        return;
      } else if (strategy === 'update') {
        const updated: AttendanceSession = {
          ...existing,
          ...ses,
          id: existing.id,
          legacy_id: legacyId,
          classId: targetClassId,
          records: { ...existing.records, ...mappedRecords },
        };
        const idx = mergedSessions.findIndex((s) => s.id === existing.id);
        if (idx !== -1) mergedSessions[idx] = updated;
        successCount++;
        return;
      }
    }

    const newSession: AttendanceSession = {
      ...ses,
      id: legacyId || `ses-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      legacy_id: legacyId,
      classId: targetClassId,
      tanggal: ses.tanggal || new Date().toISOString().slice(0, 10),
      pertemuanKe: Number(ses.pertemuanKe) || 1,
      topikMateri: ses.topikMateri || 'Materi Pembelajaran',
      records: mappedRecords,
    };
    mergedSessions.push(newSession);
    existingSessionMap.set(newSession.id, newSession);
    successCount++;
  });

  // 4. Resolve & Merge Grades
  const existingGradesMap = new Map<string, StudentGrade>();
  currentWorkspace.grades.forEach((g) => {
    existingGradesMap.set(g.id, g);
    if (g.legacy_id) existingGradesMap.set(g.legacy_id, g);
    existingGradesMap.set(`${g.classId}_${g.studentId}`, g);
  });

  const mergedGrades: StudentGrade[] = [...currentWorkspace.grades];

  (payloadToImport.grades || []).forEach((g: any) => {
    const legacyId = g.legacy_id || g.id;
    const targetClassId = classIdMap.get(g.classId || g.class_id) || mergedClasses[0]?.id || 'class-1';
    const targetStudentId = studentIdMap.get(g.studentId || g.student_id) || g.studentId;

    const key = `${targetClassId}_${targetStudentId}`;
    const existing = existingGradesMap.get(legacyId) || existingGradesMap.get(key);

    if (existing) {
      if (strategy === 'skip') {
        duplicateCount++;
        return;
      } else if (strategy === 'update') {
        const updated: StudentGrade = {
          ...existing,
          ...g,
          id: existing.id,
          legacy_id: legacyId,
          classId: targetClassId,
          studentId: targetStudentId,
        };
        const idx = mergedGrades.findIndex((item) => item.id === existing.id);
        if (idx !== -1) mergedGrades[idx] = updated;
        successCount++;
        return;
      }
    }

    const newGrade: StudentGrade = {
      ...g,
      id: legacyId || `grd-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      legacy_id: legacyId,
      classId: targetClassId,
      studentId: targetStudentId,
      catatan: g.catatan || '',
    };
    mergedGrades.push(newGrade);
    existingGradesMap.set(newGrade.id, newGrade);
    existingGradesMap.set(key, newGrade);
    successCount++;
  });

  // 5. Agendas
  const mergedAgendas: TeachingAgenda[] = [...currentWorkspace.agendas];
  (payloadToImport.agendas || []).forEach((a: any) => {
    const legacyId = a.legacy_id || a.id;
    const targetClassId = classIdMap.get(a.classId || a.class_id) || mergedClasses[0]?.id || 'class-1';
    mergedAgendas.push({
      ...a,
      id: legacyId || `agd-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      legacy_id: legacyId,
      classId: targetClassId,
    });
    successCount++;
  });

  // 6. Savings
  const mergedSavings: SavingTransaction[] = [...currentWorkspace.savings];
  (payloadToImport.savings || []).forEach((s: any) => {
    const legacyId = s.legacy_id || s.id;
    const targetClassId = classIdMap.get(s.classId || s.class_id) || mergedClasses[0]?.id || 'class-1';
    const targetStudentId = studentIdMap.get(s.studentId || s.student_id) || s.studentId;
    mergedSavings.push({
      ...s,
      id: legacyId || `sav-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      legacy_id: legacyId,
      classId: targetClassId,
      studentId: targetStudentId,
    });
    successCount++;
  });

  // 7. Teacher Profile
  let updatedTeacher = currentWorkspace.teacher;
  if (payloadToImport.teacher) {
    updatedTeacher = {
      ...currentWorkspace.teacher,
      ...payloadToImport.teacher,
      namaGuru: payloadToImport.teacher.namaGuru || currentWorkspace.teacher.namaGuru,
      namaSekolah: payloadToImport.teacher.namaSekolah || currentWorkspace.teacher.namaSekolah,
      mataPelajaranUtama: payloadToImport.teacher.mataPelajaranUtama || currentWorkspace.teacher.mataPelajaranUtama,
      tahunAjaran: payloadToImport.teacher.tahunAjaran || currentWorkspace.teacher.tahunAjaran,
      semester: payloadToImport.teacher.semester || currentWorkspace.teacher.semester,
    };
  }

  const activeClassId =
    payloadToImport.activeClassId && classIdMap.get(payloadToImport.activeClassId)
      ? classIdMap.get(payloadToImport.activeClassId)!
      : mergedClasses[0]?.id || '';

  const completedAt = new Date().toISOString();
  const record: MigrationImportRecord = {
    id: importId,
    admin_user_id: adminUser.id,
    admin_email: adminUser.email || 'admin',
    file_name: dryRunResult.fileName,
    started_at: startedAt,
    completed_at: completedAt,
    total_records: dryRunResult.summary.totalRecords,
    valid_count: dryRunResult.summary.validCount,
    invalid_count: dryRunResult.summary.invalidCount,
    success_count: successCount,
    failed_count: failedCount,
    duplicate_count: duplicateCount,
    status: 'completed',
    strategy,
    error_summary:
      failedCount > 0
        ? `${failedCount} record gagal dimasukkan.`
        : `Sukses import ${successCount} record.`,
  };

  saveImportLog(record, importItems);

  return {
    success: true,
    importRecord: record,
    importItems,
    updatedWorkspace: {
      teacher: updatedTeacher,
      classes: mergedClasses,
      activeClassId,
      students: mergedStudents,
      sessions: mergedSessions,
      grades: mergedGrades,
      agendas: mergedAgendas,
      savings: mergedSavings,
    },
  };
}

/**
 * Save import log to local storage & cloud tracking
 */
export function saveImportLog(record: MigrationImportRecord, items: MigrationImportItem[]): void {
  try {
    const existingLogs = getMigrationHistory();
    const updated = [record, ...existingLogs].slice(0, 50); // keep last 50
    localStorage.setItem(MIGRATION_IMPORTS_KEY, JSON.stringify(updated));

    if (items.length > 0) {
      const storedItemsStr = localStorage.getItem(MIGRATION_ITEMS_KEY);
      const existingItems = storedItemsStr ? JSON.parse(storedItemsStr) : [];
      const updatedItems = [...items, ...existingItems].slice(0, 300);
      localStorage.setItem(MIGRATION_ITEMS_KEY, JSON.stringify(updatedItems));
    }
  } catch (e) {
    console.warn('Failed saving migration import logs:', e);
  }
}

/**
 * Retrieve migration import history
 */
export function getMigrationHistory(): MigrationImportRecord[] {
  try {
    const raw = localStorage.getItem(MIGRATION_IMPORTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

/**
 * Clear migration logs
 */
export function clearMigrationHistory(): void {
  try {
    localStorage.removeItem(MIGRATION_IMPORTS_KEY);
    localStorage.removeItem(MIGRATION_ITEMS_KEY);
  } catch {}
}
