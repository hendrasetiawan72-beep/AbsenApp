export type Gender = 'L' | 'P';

export type AttendanceStatus = 'H' | 'S' | 'I' | 'A';

export interface TeacherProfile {
  id: string;
  namaGuru: string;
  nip: string;
  namaSekolah: string;
  mataPelajaranUtama: string;
  tahunAjaran: string;
  semester: 'Ganjil' | 'Genap';
  isLoggedIn: boolean;
  email?: string;
  avatarUrl?: string;
  googleId?: string;
}

export interface ClassRoom {
  id: string;
  namaKelas: string;
  mataPelajaran: string;
  kkm: number;
  jurusan?: string;
  keterangan?: string;
  createdAt: string;
}

export interface Student {
  id: string;
  classId: string;
  no: number;
  nisn: string;
  nama: string;
  gender: Gender;
  catatanUmum: string;
  noHpOrangTua?: string;
}

export interface AttendanceRecordItem {
  status: AttendanceStatus;
  catatan: string;
}

export interface AttendanceSession {
  id: string;
  classId: string;
  tanggal: string; // YYYY-MM-DD
  pertemuanKe: number;
  topikMateri: string;
  records: Record<string, AttendanceRecordItem>; // studentId -> { status, catatan }
}

export interface StudentGrade {
  id: string;
  studentId: string;
  classId: string;
  tugas1: number | null;
  tugas2: number | null;
  tugas3: number | null;
  uts: number | null;
  uas: number | null;
  praktik: number | null;
  catatan: string;
}

export interface CalculatedGrade {
  studentId: string;
  rataTugas: number;
  nilaiAkhir: number;
  predikat: 'A' | 'B' | 'C' | 'D';
  status: 'Tuntas' | 'Belum Tuntas';
}

export type ActiveTab = 'absensi' | 'nilai' | 'statistik' | 'impor' | 'laporan-ortu' | 'workspace' | 'peta';
