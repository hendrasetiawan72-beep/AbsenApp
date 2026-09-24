import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Student } from '../types';
import { IndexedDBManager } from '../utils/indexedDb';

export const StudentService = {
  /**
   * List all students across teacher's classes
   */
  async listAllStudents(): Promise<Student[]> {
    if (!isSupabaseConfigured()) {
      const cached = await IndexedDBManager.getCache<Student[]>('students');
      return cached || [];
    }

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('attendance_number', { ascending: true });

      if (error) throw error;

      const students: Student[] = (data || []).map((row) => ({
        id: row.id,
        legacy_id: row.legacy_id || undefined,
        classId: row.class_id,
        no: row.attendance_number || 1,
        nisn: row.nisn || '',
        nis: row.nis || '',
        nama: row.name,
        gender: row.gender,
        catatanUmum: row.notes || '',
        noHpOrangTua: row.phone || '',
      }));

      await IndexedDBManager.setCache('students', students);
      return students;
    } catch (err) {
      console.warn('[StudentService] listAllStudents error, falling back to cache:', err);
      const cached = await IndexedDBManager.getCache<Student[]>('students');
      return cached || [];
    }
  },

  /**
   * Save a single student
   */
  async saveStudent(student: Student): Promise<void> {
    const payload = {
      id: student.id.includes('-') && student.id.length >= 32 ? student.id : undefined,
      class_id: student.classId,
      name: student.nama,
      gender: student.gender,
      nisn: student.nisn || '',
      nis: student.nis || '',
      attendance_number: student.no,
      notes: student.catatanUmum || '',
      phone: student.noHpOrangTua || '',
      legacy_id: student.legacy_id || student.id,
      updated_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured()) {
      await IndexedDBManager.enqueueMutation('student', 'upsert', student);
      return;
    }

    try {
      const { error } = await supabase
        .from('students')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;
    } catch (err) {
      console.error('[StudentService] saveStudent error:', err);
      await IndexedDBManager.enqueueMutation('student', 'upsert', student);
      throw new Error('Gagal menyimpan data siswa ke cloud Supabase.');
    }
  },

  /**
   * Batch upsert students (e.g. from Excel import)
   */
  async saveStudentsBatch(students: Student[]): Promise<void> {
    if (!students.length) return;

    const records = students.map((s) => ({
      id: s.id.includes('-') && s.id.length >= 32 ? s.id : undefined,
      class_id: s.classId,
      name: s.nama,
      gender: s.gender,
      nisn: s.nisn || '',
      nis: s.nis || '',
      attendance_number: s.no,
      notes: s.catatanUmum || '',
      phone: s.noHpOrangTua || '',
      legacy_id: s.legacy_id || s.id,
      updated_at: new Date().toISOString(),
    }));

    if (!isSupabaseConfigured()) {
      await IndexedDBManager.enqueueMutation('student', 'upsert', students);
      return;
    }

    try {
      // Chunk batches by 100 to prevent payload timeouts
      const CHUNK_SIZE = 100;
      for (let i = 0; i < records.length; i += CHUNK_SIZE) {
        const chunk = records.slice(i, i + CHUNK_SIZE);
        const { error } = await supabase.from('students').upsert(chunk, { onConflict: 'id' });
        if (error) throw error;
      }
    } catch (err) {
      console.error('[StudentService] saveStudentsBatch error:', err);
      throw new Error('Gagal menyimpan batch siswa ke Supabase.');
    }
  },

  /**
   * Delete student
   */
  async deleteStudent(studentId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      await IndexedDBManager.enqueueMutation('student', 'delete', { studentId });
      return;
    }

    try {
      const { error } = await supabase.from('students').delete().eq('id', studentId);
      if (error) throw error;
    } catch (err) {
      console.error('[StudentService] deleteStudent error:', err);
      throw new Error('Gagal menghapus siswa dari Supabase.');
    }
  },
};
