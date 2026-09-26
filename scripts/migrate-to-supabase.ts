/**
 * Supabase Data Migration Script
 * Migrates old Firebase / LocalStorage JSON backup to Supabase PostgreSQL.
 *
 * Replaces old teacherUid ('jDMULvPfg1SkElZX41jKzEGm7Ck1')
 * with new Supabase UUID ('1faf8eb2-971b-4b72-bcfb-6b24f88c8971').
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const OLD_TEACHER_UID = 'jDMULvPfg1SkElZX41jKzEGm7Ck1';
const NEW_TEACHER_UUID = '1faf8eb2-971b-4b72-bcfb-6b24f88c8971';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or ANON_KEY) must be provided in .env or environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function runMigration(jsonFilePath?: string) {
  const targetFile = jsonFilePath || path.resolve(process.cwd(), 'src/data/hendraInitialData.json');

  console.log('====================================================');
  console.log('🚀 SUPABASE DATABASE MIGRATION SCRIPT');
  console.log('====================================================');
  console.log(`📂 Reading JSON file: ${targetFile}`);
  console.log(`🔄 Mapping teacherUid: ${OLD_TEACHER_UID} -> ${NEW_TEACHER_UUID}`);

  if (!fs.existsSync(targetFile)) {
    console.error(`❌ ERROR: File not found at ${targetFile}`);
    process.exit(1);
  }

  const rawJson = fs.readFileSync(targetFile, 'utf8');
  const parsed = JSON.parse(rawJson);
  const data = parsed.data || parsed;

  const teacherData = data.teacher || {};
  const classesData: any[] = data.classes || [];
  const studentsData: any[] = data.students || [];
  const sessionsData: any[] = data.sessions || [];

  console.log(`📊 Found in JSON:`);
  console.log(`   - 1 Teacher Profile`);
  console.log(`   - ${classesData.length} Classes`);
  console.log(`   - ${studentsData.length} Students`);
  console.log(`   - ${sessionsData.length} Attendance Sessions`);
  console.log('----------------------------------------------------');

  try {
    // 1. MIGRATE TEACHER
    console.log('⏳ [1/4] Migrating Teacher Profile...');
    const teacherRecord = {
      id: NEW_TEACHER_UUID,
      name: teacherData.namaGuru || 'Hendra Setiawan',
      email: teacherData.email || 'hendra.alkindi@gmail.com',
      nip: teacherData.nip || '-',
      nbm: teacherData.nbm || '-',
      school_name: teacherData.namaSekolah || 'SMK Muhammadiyah Bawang',
      main_subject: teacherData.mataPelajaranUtama || 'Bahasa Inggris',
      academic_year: teacherData.tahunAjaran || '2026/2027',
      semester: teacherData.semester || 'Ganjil',
      role: teacherData.role || 'admin',
      avatar_url: teacherData.avatarUrl || '',
      updated_at: new Date().toISOString(),
    };

    const { error: teacherError } = await supabase
      .from('teachers')
      .upsert(teacherRecord, { onConflict: 'id' });

    if (teacherError) {
      throw new Error(`Failed to upsert teacher: ${teacherError.message}`);
    }
    console.log(`✅ [1/4] Teacher profile migrated successfully (ID: ${NEW_TEACHER_UUID})`);

    // 2. MIGRATE CLASSES
    console.log(`⏳ [2/4] Migrating ${classesData.length} Classes...`);
    const mappedClasses = classesData.map((cls) => {
      const clsTeacherId =
        cls.teacherUid === OLD_TEACHER_UID ? NEW_TEACHER_UUID : cls.teacherUid || NEW_TEACHER_UUID;

      return {
        id: cls.id || cls.legacy_id,
        teacher_id: clsTeacherId,
        name: cls.namaKelas || cls.name,
        subject: cls.mataPelajaran || cls.subject || 'Bahasa Inggris',
        major: cls.jurusan || cls.major || '-',
        kkm: typeof cls.kkm === 'number' ? cls.kkm : 75,
        description: cls.keterangan || cls.description || '',
        created_at: cls.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    // Batch insert in chunks of 50
    const chunkSize = 50;
    for (let i = 0; i < mappedClasses.length; i += chunkSize) {
      const chunk = mappedClasses.slice(i, i + chunkSize);
      const { error: classError } = await supabase
        .from('classes')
        .upsert(chunk, { onConflict: 'id' });

      if (classError) {
        throw new Error(`Failed to upsert classes batch ${i}: ${classError.message}`);
      }
    }
    console.log(`✅ [2/4] All ${classesData.length} classes migrated successfully.`);

    // 3. MIGRATE STUDENTS
    console.log(`⏳ [3/4] Migrating ${studentsData.length} Students...`);
    const mappedStudents = studentsData.map((std, idx) => ({
      id: std.id || std.legacy_id || `std-${idx}`,
      class_id: std.classId || std.class_id,
      attendance_number: std.no || std.attendance_number || idx + 1,
      nisn: std.nisn || '',
      nis: std.nis || '',
      name: std.nama || std.name || `Siswa ${idx + 1}`,
      gender: std.gender === 'P' ? 'P' : 'L',
      notes: std.catatanUmum || std.notes || '',
      updated_at: new Date().toISOString(),
    }));

    for (let i = 0; i < mappedStudents.length; i += chunkSize) {
      const chunk = mappedStudents.slice(i, i + chunkSize);
      const { error: studentError } = await supabase
        .from('students')
        .upsert(chunk, { onConflict: 'id' });

      if (studentError) {
        throw new Error(`Failed to upsert students batch ${i}: ${studentError.message}`);
      }
    }
    console.log(`✅ [3/4] All ${studentsData.length} students migrated successfully.`);

    // 4. MIGRATE SESSIONS
    console.log(`⏳ [4/4] Migrating ${sessionsData.length} Attendance Sessions...`);
    const mappedSessions = sessionsData.map((sess, idx) => ({
      id: sess.id || sess.legacy_id || `sess-${idx}`,
      class_id: sess.classId || sess.class_id,
      date: sess.tanggal || sess.date || new Date().toISOString().split('T')[0],
      meeting_number: sess.pertemuanKe || sess.meeting_number || idx + 1,
      topic: sess.topikMateri || sess.topic || '',
      records: sess.records || {},
      updated_at: new Date().toISOString(),
    }));

    for (let i = 0; i < mappedSessions.length; i += chunkSize) {
      const chunk = mappedSessions.slice(i, i + chunkSize);
      const { error: sessionError } = await supabase
        .from('sessions')
        .upsert(chunk, { onConflict: 'id' });

      if (sessionError) {
        throw new Error(`Failed to upsert sessions batch ${i}: ${sessionError.message}`);
      }
    }
    console.log(`✅ [4/4] All ${sessionsData.length} attendance sessions migrated successfully.`);

    console.log('====================================================');
    console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!');
    console.log(`   All custom string IDs (class-*, std-*, sess-*) preserved.`);
    console.log(`   Foreign keys & RLS linked to Supabase UUID: ${NEW_TEACHER_UUID}`);
    console.log('====================================================');
  } catch (err: any) {
    console.error('❌ MIGRATION FAILED:', err.message);
    process.exit(1);
  }
}

// Allow passing custom file path via command line: node migrate.js /path/to/backup.json
const customPath = process.argv[2];
runMigration(customPath);
