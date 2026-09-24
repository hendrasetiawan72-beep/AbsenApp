import { Student } from '../types';

export type SavingTransactionType = 'setor' | 'tarik';

export type SavingCategory =
  | 'harian'
  | 'study_tour'
  | 'qurban'
  | 'wisuda'
  | 'lks_buku'
  | 'infaq'
  | 'lainnya';

export interface SavingTransaction {
  id: string;
  legacy_id?: string;
  classId: string;
  studentId: string;
  studentName: string;
  nisn: string;
  tanggal: string; // YYYY-MM-DD
  jenis: SavingTransactionType;
  nominal: number;
  kategori: SavingCategory;
  keterangan: string;
  petugas: string;
  saldoSetelah?: number;
  createdAt: string;
}

export interface StudentSavingSummary {
  student: Student;
  totalSetor: number;
  totalTarik: number;
  saldoAkhir: number;
  transaksiTerakhir?: string;
  jumlahTransaksi: number;
}
