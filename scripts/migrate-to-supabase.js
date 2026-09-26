/**
 * Standalone Node.js Supabase Migration Script (JavaScript / CommonJS)
 * Migrates old Firebase/LocalStorage JSON data directly to Supabase.
 *
 * Requirements:
 * npm install @supabase/supabase-js dotenv
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const OLD_TEACHER_UID = 'jDMULvPfg1SkElZX41jKzEGm7Ck1';
const NEW_TEACHER_UUID = '1faf8eb2-971b-4b72-bcfb-6b24f88c8971';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or ANON_KEY) must be provided in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function runMigration() {
  const jsonPath = process.argv[2] || path.resolve(__dirname, '../src/data/hendraInitialData.json');

  console.log('====================================================');
  console.log('🚀 SUPABASE DATABASE MIGRATION SCRIPT');
  console.log('====================================================');
  console.log(`📂 Reading JSON backup: ${jsonPath}`);
  console.log(`🔄 Mapping teacherUid: "${OLD_TEACHER_UID}" -> "${NEW_TEACHER_UUID}"`);

  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ ERROR: JSON file not found at: ${jsonPath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(jsonPath, 'utf8');
  const parsed = JSON.parse(fileContent);
  const data = parsed.data || parsed;

  const teacher = data.teacher || {};
  const classes = data.classes || [];
  const students = data.students || [];
  const sessions = data.sessions || [];

  console.log(`📊 Backup contents:`);
  console.log(`   - 1 Teacher profile`);
  console.log(`   - ${classes.length} Classes`);
  console.log(`   - ${students.length} Students`);
  console.log(`   - ${sessions.length} Attendance Sessions`);
  console.log('----------------------------------------------------');

  try {
    // 1. TEACHER
    console.log('⏳ [1/4] Inserting Teacher profile...');
    const teacherPayload = {
      id: NEW_TEACHER_UUID,
      name: teacher.namaGuru || 'Hendra Setiawan',
      email: teacher.email || 'hendra.alkindi@gmail.com',
      nip: teacher.nip || '-',
      nbm: teacher.nbm || '-',
      school_name: teacher.namaSekolah || 'SMK Muhammadiyah Bawang',
      main_subject: teacher.mataPelajaranUtama || 'Bahasa Inggris',
      academic_year: teacher.tahunAjaran || '2026/2027',
      semester: teacher.semester || 'Ganjil',
      role: teacher.role || 'admin',
      avatar_url: teacher.avatarUrl || '',
      updated_at: new Date().toISOString(),
    };

    const { error: tErr } = await supabase
      .from('teachers')
      .upsert(teacherPayload, { onConflict: 'id' });

    if (tErr) throw new Error(`Teacher migration error: ${tErr.message}`);
    console.log(`✅ [1/4] Teacher profile inserted. ID: ${NEW_TEACHER_UUID}`);

    // 2. CLASSES
    console.log(`⏳ [2/4] Inserting ${classes.length} Classes...`);
    const mappedClasses = classes.map((c) => ({
      id: c.id || c.legacy_id,
      teacher_id: c.teacherUid === OLD_TEACHER_UID ? NEW_TEACHER_UUID : (c.teacherUid || NEW_TEACHER_UUID),
      name: c.namaKelas || c.name,
      subject: c.mataPelajaran || c.subject || 'Bahasa Inggris',
      major: c.jurusan || c.major || '-',
      kkm: typeof c.kkm === 'number' ? c.kkm : 75,
      description: c.keterangan || c.description || '',
      created_at: c.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // Chunked upsert
    const CHUNK = 50;
    for (let i = 0; i < mappedClasses.length; i += CHUNK) {
      const slice = mappedClasses.slice(i, i + CHUNK);
      const { error: cErr } = await supabase.from('classes').upsert(slice, { onConflict: 'id' });
      if (cErr) throw new Error(`Classes insert error: ${cErr.message}`);
    }
    console.log(`✅ [2/4] ${classes.length} classes inserted successfully.`);

    // 3. STUDENTS
    console.log(`⏳ [3/4] Inserting ${students.length} Students...`);
    const mappedStudents = students.map((s, idx) => ({
      id: s.id || s.legacy_id || `std-${idx}`,
      class_id: s.classId || s.class_id,
      attendance_number: s.no || s.attendance_number || (idx + 1),
      nisn: s.nisn || '',
      nis: s.nis || '',
      name: s.nama || s.name || `Siswa ${idx + 1}`,
      gender: s.gender === 'P' ? 'P' : 'L',
      notes: s.catatanUmum || s.notes || '',
      updated_at: new Date().toISOString(),
    }));

    for (let i = 0; i < mappedStudents.length; i += CHUNK) {
      const slice = mappedStudents.slice(i, i + CHUNK);
      const { error: sErr } = await supabase.from('students').upsert(slice, { onConflict: 'id' });
      if (sErr) throw new Error(`Students insert error: ${sErr.message}`);
    }
    console.log(`✅ [3/4] ${students.length} students inserted successfully.`);

    // 4. SESSIONS
    console.log(`⏳ [4/4] Inserting ${sessions.length} Attendance Sessions...`);
    const mappedSessions = sessions.map((sess, idx) => ({
      id: sess.id || sess.legacy_id || `sess-${idx}`,
      class_id: sess.classId || sess.class_id,
      date: sess.tanggal || sess.date || new Date().toISOString().split('T')[0],
      meeting_number: sess.pertemuanKe || sess.meeting_number || (idx + 1),
      topic: sess.topikMateri || sess.topic || '',
      records: sess.records || {},
      updated_at: new Date().toISOString(),
    }));

    for (let i = 0; i < mappedSessions.length; i += CHUNK) {
      const slice = mappedSessions.slice(i, i + CHUNK);
      const { error: sessErr } = await supabase.from('sessions').upsert(slice, { onConflict: 'id' });
      if (sessErr) throw new Error(`Sessions insert error: ${sessErr.message}`);
    }
    console.log(`✅ [4/4] ${sessions.length} attendance sessions inserted successfully.`);

    console.log('====================================================');
    console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!');
    console.log(`   - Data mapped to Supabase UUID: ${NEW_TEACHER_UUID}`);
    console.log(`   - Retained string Primary Keys (class-*, std-*, sess-*)`);
    console.log('====================================================');
  } catch (error) {
    console.error('❌ MIGRATION ABORTED:', error.message);
    process.exit(1);
  }
}

runMigration();
