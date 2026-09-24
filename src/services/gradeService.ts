import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { StudentGrade, GradeColumnHeader } from '../types';
import { IndexedDBManager } from '../utils/indexedDb';

export const GradeService = {
  /**
   * List all student grades
   */
  async listGrades(): Promise<StudentGrade[]> {
    if (!isSupabaseConfigured()) {
      const cached = await IndexedDBManager.getCache<StudentGrade[]>('grades');
      return cached || [];
    }

    try {
      const { data, error } = await supabase
        .from('student_grades_summary')
        .select('*');

      if (error) throw error;

      const grades: StudentGrade[] = (data || []).map((row) => ({
        id: row.id,
        legacy_id: row.legacy_id || undefined,
        studentId: row.student_id,
        classId: row.class_id,
        formatif1: row.formatif1,
        formatif2: row.formatif2,
        formatif3: row.formatif3,
        formatif4: row.formatif4,
        formatif5: row.formatif5,
        formatif6: row.formatif6,
        formatif7: row.formatif7,
        formatif8: row.formatif8,
        sumatifTengah: row.sumatif_tengah,
        sumatifAkhir: row.sumatif_akhir,
        tugas1: row.tugas1,
        tugas2: row.tugas2,
        tugas3: row.tugas3,
        uts: row.uts,
        uas: row.uas,
        praktik: row.praktik,
        catatan: row.notes || '',
      }));

      await IndexedDBManager.setCache('grades', grades);
      return grades;
    } catch (err) {
      console.warn('[GradeService] listGrades error, fallback to cache:', err);
      const cached = await IndexedDBManager.getCache<StudentGrade[]>('grades');
      return cached || [];
    }
  },

  /**
   * Save a single student's grade summary
   */
  async saveGrade(grade: StudentGrade): Promise<void> {
    const payload = {
      id: grade.id.includes('-') && grade.id.length >= 32 ? grade.id : undefined,
      class_id: grade.classId,
      student_id: grade.studentId,
      formatif1: grade.formatif1 ?? null,
      formatif2: grade.formatif2 ?? null,
      formatif3: grade.formatif3 ?? null,
      formatif4: grade.formatif4 ?? null,
      formatif5: grade.formatif5 ?? null,
      formatif6: grade.formatif6 ?? null,
      formatif7: grade.formatif7 ?? null,
      formatif8: grade.formatif8 ?? null,
      sumatif_tengah: grade.sumatifTengah ?? null,
      sumatif_akhir: grade.sumatifAkhir ?? null,
      tugas1: grade.tugas1 ?? null,
      tugas2: grade.tugas2 ?? null,
      tugas3: grade.tugas3 ?? null,
      uts: grade.uts ?? null,
      uas: grade.uas ?? null,
      praktik: grade.praktik ?? null,
      notes: grade.catatan || '',
      legacy_id: grade.legacy_id || grade.id,
      updated_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured()) {
      await IndexedDBManager.enqueueMutation('grade', 'upsert', grade);
      return;
    }

    try {
      const { error } = await supabase
        .from('student_grades_summary')
        .upsert(payload, { onConflict: 'student_id' });

      if (error) throw error;
    } catch (err) {
      console.error('[GradeService] saveGrade error:', err);
      await IndexedDBManager.enqueueMutation('grade', 'upsert', grade);
      throw new Error('Gagal menyimpan nilai siswa ke cloud Supabase.');
    }
  },

  /**
   * Batch upsert student grades
   */
  async saveGradesBatch(grades: StudentGrade[]): Promise<void> {
    if (!grades.length) return;

    const records = grades.map((g) => ({
      id: g.id.includes('-') && g.id.length >= 32 ? g.id : undefined,
      class_id: g.classId,
      student_id: g.studentId,
      formatif1: g.formatif1 ?? null,
      formatif2: g.formatif2 ?? null,
      formatif3: g.formatif3 ?? null,
      formatif4: g.formatif4 ?? null,
      formatif5: g.formatif5 ?? null,
      formatif6: g.formatif6 ?? null,
      formatif7: g.formatif7 ?? null,
      formatif8: g.formatif8 ?? null,
      sumatif_tengah: g.sumatifTengah ?? null,
      sumatif_akhir: g.sumatifAkhir ?? null,
      tugas1: g.tugas1 ?? null,
      tugas2: g.tugas2 ?? null,
      tugas3: g.tugas3 ?? null,
      uts: g.uts ?? null,
      uas: g.uas ?? null,
      praktik: g.praktik ?? null,
      notes: g.catatan || '',
      legacy_id: g.legacy_id || g.id,
      updated_at: new Date().toISOString(),
    }));

    if (!isSupabaseConfigured()) {
      await IndexedDBManager.enqueueMutation('grade', 'upsert', grades);
      return;
    }

    try {
      const CHUNK_SIZE = 100;
      for (let i = 0; i < records.length; i += CHUNK_SIZE) {
        const chunk = records.slice(i, i + CHUNK_SIZE);
        const { error } = await supabase
          .from('student_grades_summary')
          .upsert(chunk, { onConflict: 'student_id' });

        if (error) throw error;
      }
    } catch (err) {
      console.error('[GradeService] saveGradesBatch error:', err);
      throw new Error('Gagal menyimpan batch nilai ke Supabase.');
    }
  },

  /**
   * Save grade headers
   */
  async saveGradeHeaders(teacherId: string, classId: string, headers: GradeColumnHeader[]): Promise<void> {
    if (!headers.length) return;
    const records = headers.map((h, idx) => ({
      class_id: classId,
      teacher_id: teacherId,
      name: h.colLabel,
      semester: 'Ganjil',
      academic_year: '2026/2027',
      category: h.key,
      order_index: idx,
      legacy_id: h.key,
      updated_at: new Date().toISOString(),
    }));

    if (!isSupabaseConfigured()) return;
    try {
      await supabase.from('grade_headers').upsert(records, { onConflict: 'id' });
    } catch (e) {
      console.warn('[GradeService] saveGradeHeaders notice:', e);
    }
  },
};
