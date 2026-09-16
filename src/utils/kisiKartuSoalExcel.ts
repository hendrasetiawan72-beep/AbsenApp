import * as XLSX from 'xlsx';
import { SchoolIdentity, MasterSoalItem, SoalItem } from '../types/kisiKartuSoal';
import {
  DEFAULT_SCHOOL_IDENTITY,
  DEFAULT_MASTER_DATA,
  DEFAULT_SOAL_DATA,
} from '../data/kisiKartuSoalDefaultData';

export function exportCurrentDataToExcel(
  identitas: SchoolIdentity,
  masterData: MasterSoalItem[],
  soalData: SoalItem[],
  fileName = 'Kisi_dan_Kartu_Soal_SMK_Muh_Bawang.xlsx'
) {
  const wb = XLSX.utils.book_new();

  // 1. Sheet IDENTITAS GURU
  const identitasRows = [
    ['PARAMETER', 'DATA SEKOLAH & GURU PENYUSUN'],
    ['Nama Sekolah', identitas.namaSekolah],
    ['Kepala Sekolah', identitas.kepalaSekolah],
    ['NBM Kepala Sekolah', identitas.nbmKepalaSekolah],
    ['Mata Pelajaran', identitas.mataPelajaran],
    ['Kurikulum', identitas.kurikulum],
    ['Kelas / Semester', identitas.kelasSemester],
    ['Kelas / Komptensi', identitas.kelasKompetensi],
    ['Bentuk Tes', identitas.bentukTes],
    ['Jumlah Soal', identitas.jumlahSoal],
    ['Alokasi Waktu', identitas.alokasiWaktu],
    ['Tahun Ajaran', identitas.tahunAjaran],
    ['Penyusun', identitas.penyusun],
    ['NIP Penyusun', identitas.nipPenyusun],
    ['Buku Sumber', identitas.bukuSumber],
    ['Tanggal Penyusunan', identitas.tanggalPenyusunan],
  ];
  const wsIdentitas = XLSX.utils.aoa_to_sheet(identitasRows);
  XLSX.utils.book_append_sheet(wb, wsIdentitas, 'IDENTITAS GURU');

  // 2. Sheet DATA MASTER
  const masterHeaders = [
    'No',
    'Elemen',
    'Capaian Pembelajaran',
    'IPK',
    'Materi',
    'Indikator Soal',
    'Bentuk Tes',
  ];
  const masterRows = masterData.map((m) => [
    m.no,
    m.elemen,
    m.capaianPembelajaran,
    m.ipk,
    m.materi,
    m.indikatorSoal,
    m.bentukTes,
  ]);
  const wsMaster = XLSX.utils.aoa_to_sheet([masterHeaders, ...masterRows]);
  XLSX.utils.book_append_sheet(wb, wsMaster, 'DATA MASTER');

  // 3. Sheet DATA SOAL
  const soalHeaders = [
    'No. Soal',
    'Kunci',
    'Rumusan Butir Soal',
    'Pilihan A',
    'Pilihan B',
    'Pilihan C',
    'Pilihan D',
  ];
  const soalRows = soalData.map((s) => [
    s.noSoal,
    s.kunci,
    s.rumusanButirSoal,
    s.pilihanA,
    s.pilihanB,
    s.pilihanC,
    s.pilihanD,
  ]);
  const wsSoal = XLSX.utils.aoa_to_sheet([soalHeaders, ...soalRows]);
  XLSX.utils.book_append_sheet(wb, wsSoal, 'DATA SOAL');

  // Generate and download
  XLSX.writeFile(wb, fileName);
}

export function downloadSampleTemplateExcel() {
  exportCurrentDataToExcel(
    DEFAULT_SCHOOL_IDENTITY,
    DEFAULT_MASTER_DATA,
    DEFAULT_SOAL_DATA,
    'Template_Kisi_Kartu_Soal_Kumer_SMK_Muh_Bawang.xlsx'
  );
}

export async function parseUploadedExcel(file: File): Promise<{
  identitas?: Partial<SchoolIdentity>;
  masterData?: MasterSoalItem[];
  soalData?: SoalItem[];
}> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });

  let parsedIdentitas: Partial<SchoolIdentity> | undefined;
  let parsedMaster: MasterSoalItem[] | undefined;
  let parsedSoal: SoalItem[] | undefined;

  // 1. Check for IDENTITAS sheet
  const identitasSheetName = wb.SheetNames.find(
    (n) => n.toUpperCase().includes('IDENTITAS') || n.toUpperCase().includes('GURU') || n.toUpperCase().includes('SEKOLAH')
  );
  if (identitasSheetName) {
    const ws = wb.Sheets[identitasSheetName];
    const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
    parsedIdentitas = {};
    for (const row of data) {
      if (Array.isArray(row) && row.length >= 2) {
        const key = String(row[0] || '').trim().toLowerCase();
        const val = String(row[1] || '').trim();
        if (key.includes('sekolah')) parsedIdentitas.namaSekolah = val;
        else if (key.includes('kepala')) parsedIdentitas.kepalaSekolah = val;
        else if (key.includes('nbm')) parsedIdentitas.nbmKepalaSekolah = val;
        else if (key.includes('pelajaran') || key.includes('mapel')) parsedIdentitas.mataPelajaran = val;
        else if (key.includes('kurikulum')) parsedIdentitas.kurikulum = val;
        else if (key.includes('semester')) parsedIdentitas.kelasSemester = val;
        else if (key.includes('kompetensi')) parsedIdentitas.kelasKompetensi = val;
        else if (key.includes('bentuk')) parsedIdentitas.bentukTes = val;
        else if (key.includes('jumlah')) parsedIdentitas.jumlahSoal = parseInt(val) || 50;
        else if (key.includes('waktu')) parsedIdentitas.alokasiWaktu = val;
        else if (key.includes('tahun')) parsedIdentitas.tahunAjaran = val;
        else if (key.includes('penyusun') && !key.includes('tanggal')) parsedIdentitas.penyusun = val;
        else if (key.includes('nip')) parsedIdentitas.nipPenyusun = val;
        else if (key.includes('buku') || key.includes('sumber')) parsedIdentitas.bukuSumber = val;
        else if (key.includes('tanggal')) parsedIdentitas.tanggalPenyusunan = val;
      }
    }
  }

  // 2. Check for DATA MASTER sheet
  const masterSheetName = wb.SheetNames.find(
    (n) => n.toUpperCase().includes('MASTER') || n.toUpperCase().includes('CP') || n.toUpperCase().includes('KISI')
  );
  if (masterSheetName) {
    const ws = wb.Sheets[masterSheetName];
    const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);
    if (jsonRows.length > 0) {
      parsedMaster = jsonRows.map((row, idx) => {
        const no = parseInt(row['No'] || row['NO'] || row['no'] || row['Nomor'] || (idx + 1));
        const elemen = row['Elemen'] || row['ELEMEN'] || row['elemen'] || '';
        const cp = row['Capaian Pembelajaran'] || row['CP'] || row['Capaian'] || '';
        const ipk = row['IPK'] || row['Indikator Pencapaian'] || '';
        const materi = row['Materi'] || row['MATERI'] || '';
        const indikator = row['Indikator Soal'] || row['Indikator'] || '';
        const bentuk = row['Bentuk Tes'] || row['Bentuk Soal'] || 'pilihan ganda';

        return {
          no,
          elemen,
          capaianPembelajaran: cp,
          ipk,
          materi,
          indikatorSoal: indikator,
          bentukTes: bentuk,
          elemen2: elemen,
        };
      });
    }
  }

  // 3. Check for DATA SOAL sheet
  const soalSheetName = wb.SheetNames.find(
    (n) => n.toUpperCase().includes('SOAL') || n.toUpperCase().includes('BUTIR')
  ) || wb.SheetNames[0]; // fallback to first sheet if only 1 sheet

  if (soalSheetName) {
    const ws = wb.Sheets[soalSheetName];
    const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);
    if (jsonRows.length > 0) {
      parsedSoal = jsonRows
        .filter((r) => {
          // ensure row is not empty
          return (
            r['Rumusan Butir Soal'] ||
            r['Soal'] ||
            r['SOAL'] ||
            r['Pilihan A'] ||
            r['pilihanA'] ||
            r['Kunci'] ||
            r['No. Soal']
          );
        })
        .map((row, idx) => {
          const noSoal =
            parseInt(
              row['No. Soal'] ||
              row['No'] ||
              row['NO'] ||
              row['Nomor Soal'] ||
              row['No Soal'] ||
              (idx + 1)
            ) || idx + 1;
          const kunci = String(row['Kunci'] || row['KUNCI'] || row['Kunci Jawaban'] || 'A').trim().toUpperCase();
          const rumusanButirSoal = String(
            row['Rumusan Butir Soal'] ||
            row['Soal'] ||
            row['SOAL'] ||
            row['Pertanyaan'] ||
            ''
          ).trim();
          const pilihanA = String(row['Pilihan A'] || row['PilihanA'] || row['A'] || row['a'] || '').trim();
          const pilihanB = String(row['Pilihan B'] || row['PilihanB'] || row['B'] || row['b'] || '').trim();
          const pilihanC = String(row['Pilihan C'] || row['PilihanC'] || row['C'] || row['c'] || '').trim();
          const pilihanD = String(row['Pilihan D'] || row['PilihanD'] || row['D'] || row['d'] || '').trim();
          const pilihanE = String(row['Pilihan E'] || row['PilihanE'] || row['E'] || row['e'] || '').trim();

          return {
            noSoal,
            kunci,
            rumusanButirSoal,
            pilihanA,
            pilihanB,
            pilihanC,
            pilihanD,
            pilihanE: pilihanE || undefined,
            jumlahSiswa: 144,
            tingkatKesukaran: noSoal % 3 === 0 ? 'HOTS' : noSoal % 2 === 0 ? 'Mudah' : 'Sedang',
            digunakanUntuk: 'PSTS',
            tanggal: '11 Maret 2026',
            keputusanValidasi: 'Diterima',
          };
        });
    }
  }

  return {
    identitas: parsedIdentitas,
    masterData: parsedMaster,
    soalData: parsedSoal,
  };
}
