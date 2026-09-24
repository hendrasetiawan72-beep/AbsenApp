import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { AttendanceSession, AttendanceRecordItem } from '../types';
import { IndexedDBManager } from '../utils/indexedDb';

export const AttendanceService = {
  /**
   * List all attendance sessions with their embedded records
   */
  async listAttendanceSessions(teacherId: string): Promise<AttendanceSession[]> {
    if (!isSupabaseConfigured()) {
      const cached = await IndexedDBManager.getCache<AttendanceSession[]>('sessions');
      return cached || [];
    }

    try {
      const { data: sessionRows, error: sErr } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('attendance_date', { ascending: false });

      if (sErr) throw sErr;
      if (!sessionRows || sessionRows.length === 0) return [];

      const sessionIds = sessionRows.map((s) => s.id);

      // Fetch records for these sessions
      const { data: recordRows, error: rErr } = await supabase
        .from('attendance_records')
        .select('*')
        .in('session_id', sessionIds);

      if (rErr) throw rErr;

      // Group records by sessionId
      const recordsBySession = new Map<string, Record<string, AttendanceRecordItem>>();
      (recordRows || []).forEach((rec) => {
        if (!recordsBySession.has(rec.session_id)) {
          recordsBySession.set(rec.session_id, {});
        }
        recordsBySession.get(rec.session_id)![rec.student_id] = {
          status: rec.status as any,
          catatan: rec.notes || '',
        };
      });

      const sessions: AttendanceSession[] = sessionRows.map((s) => ({
        id: s.id,
        legacy_id: s.legacy_id || undefined,
        classId: s.class_id,
        tanggal: s.attendance_date,
        pertemuanKe: s.meeting_number,
        topikMateri: s.notes || s.subject || '',
        records: recordsBySession.get(s.id) || {},
      }));

      await IndexedDBManager.setCache('sessions', sessions);
      return sessions;
    } catch (err) {
      console.warn('[AttendanceService] listAttendanceSessions error, fallback to cache:', err);
      const cached = await IndexedDBManager.getCache<AttendanceSession[]>('sessions');
      return cached || [];
    }
  },

  /**
   * Save a single session and its records
   */
  async saveAttendanceSession(teacherId: string, session: AttendanceSession): Promise<void> {
    const sessionPayload = {
      id: session.id.includes('-') && session.id.length >= 32 ? session.id : undefined,
      class_id: session.classId,
      teacher_id: teacherId,
      attendance_date: session.tanggal,
      subject: session.topikMateri || 'Presensi Pembelajaran',
      meeting_number: session.pertemuanKe || 1,
      notes: session.topikMateri || '',
      legacy_id: session.legacy_id || session.id,
      updated_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured()) {
      await IndexedDBManager.enqueueMutation('session', 'upsert', { teacherId, session });
      return;
    }

    try {
      const { data: insertedSession, error: sErr } = await supabase
        .from('attendance_sessions')
        .upsert(sessionPayload, { onConflict: 'id' })
        .select('id')
        .single();

      if (sErr) throw sErr;

      const effectiveSessionId = insertedSession?.id || session.id;

      // Save records
      if (session.records && Object.keys(session.records).length > 0) {
        const recordsToUpsert = Object.entries(session.records).map(([studentId, item]) => ({
          session_id: effectiveSessionId,
          student_id: studentId,
          status: item.status,
          notes: item.catatan || '',
          updated_at: new Date().toISOString(),
        }));

        const { error: rErr } = await supabase
          .from('attendance_records')
          .upsert(recordsToUpsert, { onConflict: 'session_id,student_id' });

        if (rErr) throw rErr;
      }
    } catch (err) {
      console.error('[AttendanceService] saveAttendanceSession error:', err);
      await IndexedDBManager.enqueueMutation('session', 'upsert', { teacherId, session });
      throw new Error('Gagal menyimpan sesi presensi ke cloud Supabase.');
    }
  },

  /**
   * Batch save attendance sessions
   */
  async saveAttendanceSessionsBatch(teacherId: string, sessions: AttendanceSession[]): Promise<void> {
    if (!sessions.length) return;
    for (const session of sessions) {
      await this.saveAttendanceSession(teacherId, session);
    }
  },

  /**
   * Delete attendance session
   */
  async deleteAttendanceSession(sessionId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      await IndexedDBManager.enqueueMutation('session', 'delete', { sessionId });
      return;
    }

    try {
      const { error } = await supabase.from('attendance_sessions').delete().eq('id', sessionId);
      if (error) throw error;
    } catch (err) {
      console.error('[AttendanceService] deleteAttendanceSession error:', err);
      throw new Error('Gagal menghapus sesi presensi dari Supabase.');
    }
  },
};
