import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { ClassRoom } from '../types';
import { IndexedDBManager } from '../utils/indexedDb';

export const ClassService = {
  /**
   * Fetch all classes for the authenticated teacher
   */
  async listClasses(teacherId: string): Promise<ClassRoom[]> {
    if (!isSupabaseConfigured()) {
      const cached = await IndexedDBManager.getCache<ClassRoom[]>('classes');
      return cached || [];
    }

    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('name', { ascending: true });

      if (error) throw error;

      const classes: ClassRoom[] = (data || []).map((row) => ({
        id: row.id,
        legacy_id: row.legacy_id || undefined,
        teacherUid: row.teacher_id,
        namaKelas: row.name,
        mataPelajaran: row.major || '',
        kkm: Number(row.kkm) || 75,
        jurusan: row.major || '',
        keterangan: row.notes || '',
        createdAt: row.created_at,
      }));

      // Cache locally in IndexedDB
      await IndexedDBManager.setCache('classes', classes);
      return classes;
    } catch (err) {
      console.warn('[ClassService] listClasses error, falling back to cache:', err);
      const cached = await IndexedDBManager.getCache<ClassRoom[]>('classes');
      return cached || [];
    }
  },

  /**
   * Insert or update a single class
   */
  async saveClass(teacherId: string, cls: ClassRoom): Promise<void> {
    const payload = {
      id: cls.id.includes('-') && cls.id.length >= 32 ? cls.id : undefined,
      teacher_id: teacherId,
      name: cls.namaKelas,
      major: cls.jurusan || cls.mataPelajaran || '',
      kkm: cls.kkm || 75,
      notes: cls.keterangan || '',
      legacy_id: cls.legacy_id || cls.id,
      updated_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured()) {
      await IndexedDBManager.enqueueMutation('class', 'upsert', { teacherId, cls });
      return;
    }

    try {
      const { error } = await supabase
        .from('classes')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;
    } catch (err) {
      console.error('[ClassService] saveClass error:', err);
      await IndexedDBManager.enqueueMutation('class', 'upsert', { teacherId, cls });
      throw new Error('Gagal menyimpan data kelas ke cloud Supabase.');
    }
  },

  /**
   * Batch upsert classes
   */
  async saveClassesBatch(teacherId: string, classes: ClassRoom[]): Promise<void> {
    if (!classes.length) return;

    const records = classes.map((cls) => ({
      id: cls.id.includes('-') && cls.id.length >= 32 ? cls.id : undefined,
      teacher_id: teacherId,
      name: cls.namaKelas,
      major: cls.jurusan || cls.mataPelajaran || '',
      kkm: cls.kkm || 75,
      notes: cls.keterangan || '',
      legacy_id: cls.legacy_id || cls.id,
      updated_at: new Date().toISOString(),
    }));

    if (!isSupabaseConfigured()) {
      await IndexedDBManager.enqueueMutation('class', 'upsert', { teacherId, classes });
      return;
    }

    try {
      const { error } = await supabase
        .from('classes')
        .upsert(records, { onConflict: 'id' });

      if (error) throw error;
    } catch (err) {
      console.error('[ClassService] saveClassesBatch error:', err);
      throw new Error('Gagal menyimpan batch kelas ke Supabase.');
    }
  },

  /**
   * Delete class
   */
  async deleteClass(teacherId: string, classId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      await IndexedDBManager.enqueueMutation('class', 'delete', { teacherId, classId });
      return;
    }

    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId)
        .eq('teacher_id', teacherId);

      if (error) throw error;
    } catch (err) {
      console.error('[ClassService] deleteClass error:', err);
      throw new Error('Gagal menghapus kelas dari cloud Supabase.');
    }
  },
};
