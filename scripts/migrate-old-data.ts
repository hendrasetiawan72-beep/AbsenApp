/**
 * Data Migration Tool: Legacy JSON / Firestore Export -> Supabase PostgreSQL
 * Usage: npx tsx scripts/migrate-old-data.ts <path-to-json-file> [teacher-uuid]
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY must be set in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function migrate() {
  const args = process.argv.slice(2);
  const inputFilePath = args[0] || 'src/data/hendraInitialData.json';
  const targetTeacherUid = args[1] || '00000000-0000-0000-0000-000000000001';

  const fullPath = path.resolve(process.cwd(), inputFilePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    process.exit(1);
  }

  console.log(`Reading legacy dataset from: ${fullPath}`);
  const rawContent = fs.readFileSync(fullPath, 'utf8');
  const legacyData = JSON.parse(rawContent);

  // Handle both { data: { ... } } and direct structure
  const root = legacyData.data || legacyData;

  const teacher = root.teacher || {};
  const classes = root.classes || [];
  const students = root.students || [];
  const sessions = root.sessions || [];
  const grades = root.grades || [];
  const agendas = root.agendas || [];
  const savings = root.savings || [];

  console.log('\n--- DATASET SUMMARY ---');
  console.log(`Teacher : ${teacher.namaGuru || '-'}`);
  console.log(`Classes : ${classes.length}`);
  console.log(`Students: ${students.length}`);
  console.log(`Sessions: ${sessions.length}`);
  console.log(`Grades  : ${grades.length}`);
  console.log(`Agendas : ${agendas.length}`);
  console.log(`Savings : ${savings.length}`);

  // 1. Profile
  console.log('\n1. Upserting Profile...');
  const { error: profileErr } = await supabase.from('profiles').upsert({
    id: targetTeacherUid,
    full_name: teacher.namaGuru || 'Hendra Setiawan, S.Pd',
    email: teacher.email || 'hendra.alkindi@gmail.com',
    role: 'teacher',
    school_name: teacher.namaSekolah || 'SMK Muhammadiyah Bawang',
    nip: teacher.nip || '-',
    nbm: teacher.nbm || '-',
    main_subject: teacher.mataPelajaranUtama || 'Bahasa Inggris',
    academic_year: teacher.tahunAjaran || '2026/2027',
    semester: teacher.semester || 'Ganjil',
  });
  if (profileErr) console.warn('Profile upsert notice:', profileErr.message);

  // 2. Classes
  console.log('2. Upserting Classes...');
  const classIdMap = new Map<string, string>();
  for (const cls of classes) {
    const { data: insertedClass, error: cErr } = await supabase
      .from('classes')
      .upsert({
        teacher_id: targetTeacherUid,
        name: cls.namaKelas,
        major: cls.jurusan || cls.mataPelajaran || '',
        kkm: cls.kkm || 75,
        notes: cls.keterangan || '',
        legacy_id: cls.id,
      })
      .select('id, legacy_id')
      .single();

    if (cErr) {
      console.warn(`Class ${cls.namaKelas} upsert error:`, cErr.message);
    } else if (insertedClass) {
      classIdMap.set(cls.id, insertedClass.id);
    }
  }

  // 3. Students
  console.log('3. Upserting Students...');
  const studentIdMap = new Map<string, string>();
  for (const stu of students) {
    const targetClassId = classIdMap.get(stu.classId) || stu.classId;
    const { data: insertedStudent, error: sErr } = await supabase
      .from('students')
      .upsert({
        class_id: targetClassId,
        name: stu.nama,
        gender: stu.gender || 'L',
        nisn: stu.nisn || '',
        nis: stu.nis || '',
        attendance_number: stu.no || 1,
        notes: stu.catatanUmum || '',
        phone: stu.noHpOrangTua || '',
        legacy_id: stu.id,
      })
      .select('id, legacy_id')
      .single();

    if (sErr) {
      console.warn(`Student ${stu.nama} error:`, sErr.message);
    } else if (insertedStudent) {
      studentIdMap.set(stu.id, insertedStudent.id);
    }
  }

  // 4. Attendance Sessions & Records
  console.log('4. Upserting Attendance Sessions...');
  for (const sess of sessions) {
    const targetClassId = classIdMap.get(sess.classId) || sess.classId;
    const { data: insertedSession, error: sessErr } = await supabase
      .from('attendance_sessions')
      .upsert({
        teacher_id: targetTeacherUid,
        class_id: targetClassId,
        attendance_date: sess.tanggal,
        subject: sess.topikMateri || 'Presensi',
        meeting_number: sess.pertemuanKe || 1,
        notes: sess.topikMateri || '',
        legacy_id: sess.id,
      })
      .select('id')
      .single();

    if (sessErr) {
      console.warn(`Session ${sess.id} error:`, sessErr.message);
      continue;
    }

    if (insertedSession && sess.records) {
      const recordsToInsert = Object.entries(sess.records).map(([oldStudentId, val]: [string, any]) => ({
        session_id: insertedSession.id,
        student_id: studentIdMap.get(oldStudentId) || oldStudentId,
        status: val.status || 'H',
        notes: val.catatan || '',
      }));

      if (recordsToInsert.length > 0) {
        await supabase.from('attendance_records').upsert(recordsToInsert, { onConflict: 'session_id,student_id' });
      }
    }
  }

  // 5. Grades
  console.log('5. Upserting Grades...');
  for (const gr of grades) {
    const targetClassId = classIdMap.get(gr.classId) || gr.classId;
    const targetStudentId = studentIdMap.get(gr.studentId) || gr.studentId;

    await supabase.from('student_grades_summary').upsert({
      class_id: targetClassId,
      student_id: targetStudentId,
      formatif1: gr.formatif1,
      formatif2: gr.formatif2,
      formatif3: gr.formatif3,
      formatif4: gr.formatif4,
      formatif5: gr.formatif5,
      formatif6: gr.formatif6,
      formatif7: gr.formatif7,
      formatif8: gr.formatif8,
      sumatif_tengah: gr.sumatifTengah,
      sumatif_akhir: gr.sumatifAkhir,
      tugas1: gr.tugas1,
      tugas2: gr.tugas2,
      tugas3: gr.tugas3,
      uts: gr.uts,
      uas: gr.uas,
      notes: gr.catatan || '',
      legacy_id: gr.id,
    }, { onConflict: 'student_id' });
  }

  // 6. Agendas
  console.log('6. Upserting Agendas...');
  for (const ag of agendas) {
    const targetClassId = classIdMap.get(ag.classId) || ag.classId;
    await supabase.from('teaching_agendas').upsert({
      teacher_id: targetTeacherUid,
      class_id: targetClassId,
      agenda_date: ag.tanggal,
      subject: ag.materiAjar || '',
      material: ag.materiAjar || '',
      activity: ag.kegiatan || '',
      attendance_count: ag.jumlahHadir || 0,
      absent_count: ag.jumlahTidakHadir || 0,
      hours_range: ag.jamRentang || '',
      hours_array: ag.jamKe || [1, 2],
      notes: ag.catatan || '',
      legacy_id: ag.id,
    });
  }

  // 7. Savings
  console.log('7. Upserting Savings...');
  for (const sv of savings) {
    const targetClassId = classIdMap.get(sv.classId) || sv.classId;
    const targetStudentId = studentIdMap.get(sv.studentId) || sv.studentId;
    await supabase.from('savings').upsert({
      teacher_id: targetTeacherUid,
      class_id: targetClassId,
      student_id: targetStudentId,
      transaction_date: sv.tanggal,
      transaction_type: sv.jenis,
      amount: sv.nominal,
      category: sv.kategori || 'harian',
      description: sv.keterangan || '',
      officer: sv.petugas || 'Wali Kelas',
      legacy_id: sv.id,
    });
  }

  console.log('\nMigration to Supabase completed successfully!');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
