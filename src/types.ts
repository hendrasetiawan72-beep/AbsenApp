export type Gender = 'L' | 'P';

export type AttendanceStatus = 'H' | 'S' | 'I' | 'A';

export interface TeacherProfile {
  id: string;
  namaGuru: string;
  nip: string;
  nbm?: string; // Nomor Baku Muhammadiyah (NBM)
  namaSekolah: string;
  mataPelajaranUtama: string;
  tahunAjaran: string;
  semester: 'Ganjil' | 'Genap';
  isLoggedIn: boolean;
  email?: string;
  avatarUrl?: string;
  googleId?: string;
  activeClassId?: string;
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

export interface GradeColumnHeader {
  key: string; // e.g. "m0_c0"
  monthIndex: number; // 0 to 5
  monthName: string; // e.g. 'Juli'
  colIndex: number; // 0 to 3
  colLabel: string; // 'Nilai 1', 'Nilai 2', etc.
  tanggal: string; // editable date (e.g. '2025-07-21')
  keterangan: string; // editable description (e.g. 'UH 1: Teori Dasar')
}

export interface StudentGrade {
  id: string;
  studentId: string;
  classId: string;

  // Nilai per bulan dalam satu semester (6 bulan x 4 kolom nilai = 24 kolom)
  // Key format: "m{monthIndex}_c{colIndex}" misal "m0_c0", "m0_c1", etc.
  monthlyGrades?: Record<string, number | null>;

  // 10 Kolom Penilaian: 8 Asesmen Formatif + 2 Asesmen Sumatif
  formatif1?: number | null;
  formatif2?: number | null;
  formatif3?: number | null;
  formatif4?: number | null;
  formatif5?: number | null;
  formatif6?: number | null;
  formatif7?: number | null;
  formatif8?: number | null;
  formatif9?: number | null;
  formatif10?: number | null;
  sumatifTengah?: number | null; // Asesmen Sumatif Tengah Semester (STS / Pengganti UTS)
  sumatifAkhir?: number | null;  // Asesmen Sumatif Akhir Semester (SAS / Pengganti UAS)

  // Backward compatibility aliases
  tugas1?: number | null;
  tugas2?: number | null;
  tugas3?: number | null;
  uts?: number | null;
  uas?: number | null;
  praktik?: number | null;

  catatan: string;
}

export interface CalculatedGrade {
  studentId: string;
  rataFormatif: number;
  rataTugas?: number; // compat alias
  nilaiAkhir: number;
  predikat: 'A' | 'B' | 'C' | 'D';
  status: 'Tuntas' | 'Belum Tuntas';
  sumatifTengah?: number | null;
  sumatifAkhir?: number | null;
}

export interface TeachingAgenda {
  id: string;
  tanggal: string; // YYYY-MM-DD
  hari?: string; // e.g. 'Senin'
  jamKe: number[]; // e.g. [1, 2, 3]
  jamRentang?: string; // e.g. '07:15 - 09:15'
  classId: string;
  className?: string;
  materiAjar: string;
  kegiatan: string;
  catatan?: string;
  jumlahHadir?: number;
  jumlahTidakHadir?: number;
  createdAt: string;
}

export interface TeacherWorkspaceData {
  teacherUid: string;
  email: string;
  teacher: TeacherProfile;
  classes: ClassRoom[];
  activeClassId: string;
  students: Student[];
  sessions: AttendanceSession[];
  grades: StudentGrade[];
  agendas?: TeachingAgenda[];
  updatedAt: string;
}

export type SMKJurusan = 
  | 'TKR' 
  | 'TSM' 
  | 'Akuntansi' 
  | 'Perbankan Syari\'ah' 
  | 'TJAT' 
  | 'TKJ' 
  | 'Semua Jurusan';

export type AlternatifGenerateModul =
  | 'pjbl-tefa'
  | 'pbl-investigasi'
  | 'skills-bahasa'
  | 'deep-learning'
  | 'kemuhammadiyahan'
  | 'diferensiasi'
  | 'stem-komputasi'
  | 'technopreneurship'
  | 'k3lh-green-skills'
  | 'pancasila-7kebiasaan';

export interface AlternatifSkenarioKurikulum {
  id: AlternatifGenerateModul;
  nomor: number;
  judul: string;
  subjudul: string;
  deskripsi: string;
  fokusPedagogi: string;
  badge: string;
  color: string;
}

export interface ModulAjarPromptData {
  id?: string;
  // 1. Identitas Materi Mata Pelajaran
  kurikulum: string; // 'Kurikulum Merdeka Belajar'
  faseKelas: string; // 'Fase E (Kelas X)' | 'Fase F (Kelas XI)' | 'Fase F (Kelas XII)'
  topikMateri: string;
  pendekatan: string; // 'Deep Learning (meaningful – mindful – joyful, interkoneksi)'
  metodePembelajaran: string; // 'Project Based Learning (PjBL)' | 'Problem Based Learning (PBL)'
  durasiProyek: string; // e.g. '2 pertemuan (8 JP x 45 menit)'
  namaGuru: string;
  namaKelasJurusan: string;
  selectedJurusan: SMKJurusan[];
  mataPelajaran: string;
  alternatifTerpilih?: AlternatifGenerateModul;

  // 2. Capaian Pembelajaran Fase dan ATP
  capaianPembelajaran: string;
  alurTujuanPembelajaran: string;

  // 3. Tujuan Pembelajaran (ATP yang dijabarkan)
  tujuanPembelajaran: string[];

  // 4. Sintaks Metode Pembelajaran (PjBL / PBL aktivitas konkret)
  sintaksPembelajaran: {
    tahap: string;
    fokusDeepLearning: string; // 'Mindful' | 'Meaningful' | 'Joyful' | 'Interkoneksi'
    aktivitasKonkret: string;
  }[];

  // 8. Integrasi Skills + Practice
  integrasiSkillsPractice: {
    hardSkills: string;
    softSkills: string;
    praktikNyata: string;
    keselamatanKerjaK3: string;
  };

  // 10. Refleksi
  refleksi: {
    refleksiSiswa: string;
    refleksiGuru: string;
  };

  // Penguatan Karakter Kemuhammadiyahan
  karakterKemuhammadiyahan: string[];

  // Peta Konsep Karakter 7 Kebiasaan Anak Indonesia Hebat
  tujuhKebiasaanAnakHebat: {
    kebiasaan: string;
    implementasi: string;
  }[];

  // Konten LKPD Tambahan
  lkpd: {
    judulProyek: string;
    petunjukKerja: string[];
    tugasProyek: string;
    alatBahan: string[];
    rubrikPenilaian: string;
  };

  createdAt?: string;
}

export * from './types/tabungan';

export interface FullDatabaseBackup {
  app: string;
  version: string;
  exportedAt: string;
  exportedAtFormatted: string;
  exportedBy: {
    namaGuru: string;
    nip: string;
    nbm?: string;
    namaSekolah: string;
    email?: string;
  };
  summary: {
    totalClasses: number;
    totalStudents: number;
    totalAttendanceSessions: number;
    totalGrades: number;
    totalAgendas: number;
    totalSavingsTransactions: number;
  };
  data: {
    teacher: TeacherProfile;
    classes: ClassRoom[];
    activeClassId: string;
    students: Student[];
    sessions: AttendanceSession[];
    grades: StudentGrade[];
    agendas: TeachingAgenda[];
    gradeHeaders?: Record<string, GradeColumnHeader[]>;
    savings?: import('./types/tabungan').SavingTransaction[];
    kisiKartuSoal?: {
      identitas?: any;
      masterData?: any[];
      soalData?: any[];
    };
  };
}

export type ActiveTab =
  | 'absensi'
  | 'nilai'
  | 'tabungan'
  | 'statistik'
  | 'agenda'
  | 'generator-modul'
  | 'impor'
  | 'laporan-ortu'
  | 'workspace'
  | 'peta'
  | 'kisi-kartu-soal';

