import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { SavingTransaction } from '../types/tabungan';
import { IndexedDBManager } from '../utils/indexedDb';

export const SavingsService = {
  /**
   * List all saving transactions
   */
  async listSavings(teacherId: string): Promise<SavingTransaction[]> {
    if (!isSupabaseConfigured()) {
      const cached = await IndexedDBManager.getCache<SavingTransaction[]>('savings');
      return cached || [];
    }

    try {
      const { data, error } = await supabase
        .from('savings')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('transaction_date', { ascending: false });

      if (error) throw error;

      const transactions: SavingTransaction[] = (data || []).map((row) => ({
        id: row.id,
        legacy_id: row.legacy_id || undefined,
        classId: row.class_id,
        studentId: row.student_id,
        studentName: '',
        nisn: '',
        tanggal: row.transaction_date,
        jenis: row.transaction_type,
        nominal: Number(row.amount) || 0,
        kategori: (row.category as any) || 'harian',
        keterangan: row.description || '',
        petugas: row.officer || 'Wali Kelas',
        createdAt: row.created_at,
      }));

      await IndexedDBManager.setCache('savings', transactions);
      return transactions;
    } catch (err) {
      console.warn('[SavingsService] listSavings error, fallback to cache:', err);
      const cached = await IndexedDBManager.getCache<SavingTransaction[]>('savings');
      return cached || [];
    }
  },

  /**
   * Save a single transaction
   */
  async saveSaving(teacherId: string, tx: SavingTransaction): Promise<void> {
    const payload = {
      id: tx.id.includes('-') && tx.id.length >= 32 ? tx.id : undefined,
      teacher_id: teacherId,
      class_id: tx.classId,
      student_id: tx.studentId,
      transaction_date: tx.tanggal,
      transaction_type: tx.jenis,
      amount: tx.nominal,
      category: tx.kategori || 'harian',
      description: tx.keterangan || '',
      officer: tx.petugas || 'Wali Kelas',
      legacy_id: tx.legacy_id || tx.id,
      updated_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured()) {
      await IndexedDBManager.enqueueMutation('saving', 'upsert', { teacherId, tx });
      return;
    }

    try {
      const { error } = await supabase
        .from('savings')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;
    } catch (err) {
      console.error('[SavingsService] saveSaving error:', err);
      await IndexedDBManager.enqueueMutation('saving', 'upsert', { teacherId, tx });
      throw new Error('Gagal menyimpan transaksi tabungan ke Supabase.');
    }
  },

  /**
   * Save batch of transactions
   */
  async saveSavingsBatch(teacherId: string, txs: SavingTransaction[]): Promise<void> {
    if (!txs.length) return;

    const records = txs.map((tx) => ({
      id: tx.id.includes('-') && tx.id.length >= 32 ? tx.id : undefined,
      teacher_id: teacherId,
      class_id: tx.classId,
      student_id: tx.studentId,
      transaction_date: tx.tanggal,
      transaction_type: tx.jenis,
      amount: tx.nominal,
      category: tx.kategori || 'harian',
      description: tx.keterangan || '',
      officer: tx.petugas || 'Wali Kelas',
      legacy_id: tx.legacy_id || tx.id,
      updated_at: new Date().toISOString(),
    }));

    if (!isSupabaseConfigured()) {
      await IndexedDBManager.enqueueMutation('saving', 'upsert', { teacherId, txs });
      return;
    }

    try {
      const CHUNK_SIZE = 100;
      for (let i = 0; i < records.length; i += CHUNK_SIZE) {
        const chunk = records.slice(i, i + CHUNK_SIZE);
        const { error } = await supabase.from('savings').upsert(chunk, { onConflict: 'id' });
        if (error) throw error;
      }
    } catch (err) {
      console.error('[SavingsService] saveSavingsBatch error:', err);
      throw new Error('Gagal menyimpan transaksi tabungan ke Supabase.');
    }
  },

  /**
   * Delete saving transaction
   */
  async deleteSaving(txId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      await IndexedDBManager.enqueueMutation('saving', 'delete', { txId });
      return;
    }

    try {
      const { error } = await supabase.from('savings').delete().eq('id', txId);
      if (error) throw error;
    } catch (err) {
      console.error('[SavingsService] deleteSaving error:', err);
      throw new Error('Gagal menghapus transaksi dari Supabase.');
    }
  },
};
