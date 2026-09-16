export interface SchoolIdentity {
  namaSekolah: string;
  kepalaSekolah: string;
  nbmKepalaSekolah: string;
  mataPelajaran: string;
  kurikulum: string;
  kelasSemester: string;
  kelasKompetensi: string;
  bentukTes: string;
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
