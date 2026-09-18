export interface SchoolIdentity {
  namaSekolah: string;
  alamatSekolah?: string;
  kepalaSekolah: string;
  nbmKepalaSekolah: string;
  mataPelajaran: string;
  kurikulum: string;
  kelasSemester: string;
  kelasKompetensi: string;
  bentukTes: string;
  jenisTes?: string;
  jumlahSoal: number;
  alokasiWaktu: string;
  tahunAjaran: string;
  penyusun: string;
  nbmPenyusun: string;
  nipPenyusun?: string;
  bukuSumber: string;
  tanggalPenyusunan: string;
}

export interface MasterSoalItem {
  no: number;
  elemen: string;
  capaianPembelajaran: string;
  ipk: string;
  materi: string;
  indikatorSoal: string;
  bentukTes: string;
  elemen2?: string;
}

export interface SoalItem {
  noSoal: number;
  kunci: string;
  rumusanButirSoal: string;
  pilihanA: string;
  pilihanB: string;
  pilihanC: string;
  pilihanD: string;
  pilihanE?: string;
  // Metadata kartu soal
  catatanManual?: string; // Kolom baru untuk input manual / catatan / pembahasan guru
  jenisTes?: string;
  jumlahSiswa?: number;
  tingkatKesukaran?: string; // 'Mudah' | 'Sedang' | 'HOTS'
  dayaPembeda?: string;
  proporsiA?: string;
  proporsiB?: string;
  proporsiC?: string;
  proporsiD?: string;
  proporsiE?: string;
  keterangan?: string;
  digunakanUntuk?: string;
  tanggal?: string;
  validator?: string;
  keputusanValidasi?: 'Diterima' | 'Revisi' | 'Ditolak';
  tanggapanValidator?: string;
}

export type SheetTab = 
  | 'menu' 
  | 'identitas' 
  | 'master' 
  | 'soal' 
  | 'kartu' 
  | 'kisi' 
  | 'lampiran';

export interface JenisTesOption {
  value: string;
  label: string;
  category: 'Tengah Semester' | 'Akhir Semester' | 'Akhir Tahun' | 'Lainnya';
}

export const OPSI_JENIS_TES: JenisTesOption[] = [
  // Penilaian Tengah Semester
  { value: 'Penilaian Tengah Semester (PTS)', label: 'Penilaian Tengah Semester (PTS)', category: 'Tengah Semester' },
  { value: 'Penilaian Tengah Semester (PSTS)', label: 'Penilaian Tengah Semester (PSTS)', category: 'Tengah Semester' },
  { value: 'Sumatif Tengah Semester (STS)', label: 'Sumatif Tengah Semester (STS)', category: 'Tengah Semester' },
  { value: 'Asesmen Sumatif Tengah Semester (ASTS)', label: 'Asesmen Sumatif Tengah Semester (ASTS)', category: 'Tengah Semester' },

  // Penilaian Akhir Semester
  { value: 'Penilaian Akhir Semester (PAS)', label: 'Penilaian Akhir Semester (PAS)', category: 'Akhir Semester' },
  { value: 'Penilaian Sumatif Akhir Semester (PSAS)', label: 'Penilaian Sumatif Akhir Semester (PSAS)', category: 'Akhir Semester' },
  { value: 'Sumatif Akhir Semester (SAS)', label: 'Sumatif Akhir Semester (SAS)', category: 'Akhir Semester' },
  { value: 'Asesmen Sumatif Akhir Semester (ASAS)', label: 'Asesmen Sumatif Akhir Semester (ASAS)', category: 'Akhir Semester' },

  // Penilaian Akhir Tahun
  { value: 'Penilaian Akhir Tahun (PAT)', label: 'Penilaian Akhir Tahun (PAT)', category: 'Akhir Tahun' },
  { value: 'Sumatif Akhir Tahun (SAT)', label: 'Sumatif Akhir Tahun (SAT)', category: 'Akhir Tahun' },
  { value: 'Asesmen Sumatif Akhir Tahun (ASAT)', label: 'Asesmen Sumatif Akhir Tahun (ASAT)', category: 'Akhir Tahun' },

  // Formatif & Ujian Lainnya
  { value: 'Penilaian Harian / Formatif (PH)', label: 'Penilaian Harian / Formatif (PH)', category: 'Lainnya' },
  { value: 'Asesmen Sumatif Akhir Jenjang (ASAJ)', label: 'Asesmen Sumatif Akhir Jenjang (ASAJ)', category: 'Lainnya' },
  { value: 'Ujian Sekolah (US)', label: 'Ujian Sekolah (US)', category: 'Lainnya' },
  { value: 'Tes Kemampuan Akademik (TKA)', label: 'Tes Kemampuan Akademik (TKA)', category: 'Lainnya' },
];
