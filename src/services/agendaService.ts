import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { TeachingAgenda } from '../types';
import { IndexedDBManager } from '../utils/indexedDb';

export const AgendaService = {
  /**
   * List all teaching agendas for teacher
   */
  async listAgendas(teacherId: string): Promise<TeachingAgenda[]> {
    if (!isSupabaseConfigured()) {
      const cached = await IndexedDBManager.getCache<TeachingAgenda[]>('agendas');
      return cached || [];
    }

    try {
      const { data, error } = await supabase
        .from('teaching_agendas')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('agenda_date', { ascending: false });

      if (error) throw error;

      const agendas: TeachingAgenda[] = (data || []).map((row) => ({
        id: row.id,
        legacy_id: row.legacy_id || undefined,
        tanggal: row.agenda_date,
        jamKe: Array.isArray(row.hours_array) ? (row.hours_array as number[]) : [1, 2],
        jamRentang: row.hours_range || '',
        classId: row.class_id,
        materiAjar: row.material || row.subject || '',
        kegiatan: row.activity || '',
        catatan: row.notes || '',
        jumlahHadir: row.attendance_count || 0,
        jumlahTidakHadir: row.absent_count || 0,
        createdAt: row.created_at,
      }));

      await IndexedDBManager.setCache('agendas', agendas);
      return agendas;
    } catch (err) {
      console.warn('[AgendaService] listAgendas error, fallback to cache:', err);
      const cached = await IndexedDBManager.getCache<TeachingAgenda[]>('agendas');
      return cached || [];
    }
  },

  /**
   * Save an agenda
   */
  async saveAgenda(teacherId: string, agenda: TeachingAgenda): Promise<void> {
    const payload = {
      id: agenda.id.includes('-') && agenda.id.length >= 32 ? agenda.id : undefined,
      teacher_id: teacherId,
      class_id: agenda.classId,
      agenda_date: agenda.tanggal,
      subject: agenda.materiAjar || 'Agenda Pembelajaran',
      material: agenda.materiAjar || '',
      activity: agenda.kegiatan || '',
      attendance_count: agenda.jumlahHadir || 0,
      absent_count: agenda.jumlahTidakHadir || 0,
      hours_range: agenda.jamRentang || '',
      hours_array: agenda.jamKe || [1, 2],
      notes: agenda.catatan || '',
      legacy_id: agenda.legacy_id || agenda.id,
      updated_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured()) {
      await IndexedDBManager.enqueueMutation('agenda', 'upsert', { teacherId, agenda });
      return;
    }

    try {
      const { error } = await supabase
        .from('teaching_agendas')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;
    } catch (err) {
      console.error('[AgendaService] saveAgenda error:', err);
      await IndexedDBManager.enqueueMutation('agenda', 'upsert', { teacherId, agenda });
      throw new Error('Gagal menyimpan agenda ke Supabase.');
    }
  },

  /**
   * Batch save agendas
   */
  async saveAgendasBatch(teacherId: string, agendas: TeachingAgenda[]): Promise<void> {
    if (!agendas.length) return;
    for (const item of agendas) {
      await this.saveAgenda(teacherId, item);
    }
  },

  /**
   * Delete agenda
   */
  async deleteAgenda(agendaId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      await IndexedDBManager.enqueueMutation('agenda', 'delete', { agendaId });
      return;
    }

    try {
      const { error } = await supabase.from('teaching_agendas').delete().eq('id', agendaId);
      if (error) throw error;
    } catch (err) {
      console.error('[AgendaService] deleteAgenda error:', err);
      throw new Error('Gagal menghapus agenda dari Supabase.');
    }
  },
};
