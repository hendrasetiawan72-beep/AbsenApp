import * as XLSX from 'xlsx';
import { Student, AttendanceSession, StudentGrade, Gender, GradeColumnHeader } from '../types';

export interface ParsedStudentRow {
  no: number;
  nisn: string;
  nama: string;
  gender: Gender;
  catatanUmum: string;
}

/**
 * Parses raw text copied directly from spreadsheet (Google Sheets or Excel)
 * Format usually tab-separated (\t) or comma-separated (, or ;)
 */
export function parseSpreadsheetText(rawText: string): ParsedStudentRow[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  const results: ParsedStudentRow[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Split by tab, or comma, or semicolon
    let cols = line.split('\t');
    if (cols.length === 1 && line.includes(',')) {
      cols = line.split(',');
    } else if (cols.length === 1 && line.includes(';')) {
      cols = line.split(';');
    }
    cols = cols.map((c) => c.trim().replace(/^["']|["']$/g, ''));

    // Check if it's header line
    const lowerFirst = cols[0]?.toLowerCase();
    const lowerSecond = cols[1]?.toLowerCase();
    if (
      lowerFirst?.includes('no') ||
      lowerFirst?.includes('nisn') ||
      lowerFirst?.includes('nama') ||
      lowerSecond?.includes('nama')
    ) {
      continue; // Skip header
    }

    // Determine column mapping:
    // Pattern 1: [No, NISN, Nama, Gender, Catatan]
    // Pattern 2: [NISN, Nama, Gender, Catatan]
    // Pattern 3: [Nama, Gender, NISN]
    // Pattern 4: [No, Nama, Gender]
    let no = results.length + 1;
    let nisn = '';
    let nama = '';
    let gender: Gender = 'L';
    let catatan = '';

    if (cols.length >= 4) {
      // Check if first column is numeric (No)
      const isFirstNum = !isNaN(Number(cols[0])) && Number(cols[0]) > 0;
      if (isFirstNum && cols[1].length >= 5) {
        // [No, NISN, Nama, Gender, Catatan]
        no = Number(cols[0]);
        nisn = cols[1];
        nama = cols[2];
        gender = normalizeGender(cols[3]);
        catatan = cols[4] || '';
      } else if (isFirstNum) {
        // [No, Nama, Gender, Catatan]
        no = Number(cols[0]);
        nama = cols[1];
        gender = normalizeGender(cols[2]);
        catatan = cols[3] || '';
      } else {
        // [NISN, Nama, Gender, Catatan]
        nisn = cols[0];
        nama = cols[1];
        gender = normalizeGender(cols[2]);
        catatan = cols[3] || '';
      }
    } else if (cols.length === 3) {
      if (!isNaN(Number(cols[0]))) {
        // [No, Nama, Gender]
        no = Number(cols[0]);
        nama = cols[1];
        gender = normalizeGender(cols[2]);
      } else {
        // [NISN, Nama, Gender]
        nisn = cols[0];
        nama = cols[1];
        gender = normalizeGender(cols[2]);
      }
    } else if (cols.length === 2) {
      // [Nama, Gender]
      nama = cols[0];
      gender = normalizeGender(cols[1]);
    } else if (cols.length === 1 && cols[0]) {
      nama = cols[0];
    }

    if (nama.trim().length > 0) {
      results.push({
        no: results.length + 1,
        nisn: nisn || generateRandomNisn(results.length + 1),
        nama: nama.trim(),
        gender,
        catatanUmum: catatan,
      });
    }
  }

  return results;
}

export function normalizeGender(val?: string): Gender {
  if (!val) return 'L';
  const clean = val.trim().toUpperCase();
  if (clean.startsWith('P') || clean.includes('PEREMPUAN') || clean.includes('WANITA') || clean === 'F') {
    return 'P';
  }
  return 'L';
}

function generateRandomNisn(index: number): string {
  const base = 71234000 + index;
  return '00' + base.toString();
}

/**
 * Parses an uploaded Excel (.xlsx, .xls) or CSV file
 */
export async function parseExcelFile(file: File): Promise<ParsedStudentRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          defval: '',
        });

        if (jsonRows.length === 0) {
          resolve([]);
          return;
        }

        const results: ParsedStudentRow[] = [];

        jsonRows.forEach((row, idx) => {
          // Normalize keys
          const rowLower: Record<string, string> = {};
          Object.keys(row).forEach((k) => {
            rowLower[k.trim().toLowerCase()] = String(row[k] || '').trim();
          });

          // Find nama
          const nama =
            rowLower['nama'] ||
            rowLower['nama lengkap'] ||
            rowLower['nama siswa'] ||
            rowLower['student name'] ||
            Object.values(rowLower).find((v) => v.length > 2 && isNaN(Number(v))) ||
            '';

          if (!nama) return;

          // Find nisn
          const nisn =
            rowLower['nisn'] ||
            rowLower['nis'] ||
            rowLower['nomor induk'] ||
            generateRandomNisn(idx + 1);

          // Find gender
          const genderRaw =
            rowLower['gender'] ||
            rowLower['jenis kelamin'] ||
            rowLower['jk'] ||
            rowLower['l/p'] ||
            'L';
          const gender = normalizeGender(genderRaw);

          // Find catatan
          const catatan =
            rowLower['catatan'] ||
            rowLower['keterangan'] ||
            rowLower['notes'] ||
            '';

          results.push({
            no: results.length + 1,
            nisn: String(nisn),
            nama: String(nama),
            gender,
            catatanUmum: String(catatan),
          });
        });

        resolve(results);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Downloads template for student import
 */
export function downloadStudentTemplate(format: 'xlsx' | 'csv' = 'xlsx'): void {
  const templateData = [
    {
      'No': 1,
      'NISN': '0071234001',
      'Nama Lengkap Siswa': 'Ahmad Fauzan Pratama',
      'Jenis Kelamin (L/P)': 'L',
      'Catatan': 'Ketua Kelas',
    },
    {
      'No': 2,
      'NISN': '0071234002',
      'Nama Lengkap Siswa': 'Aisyah Putri Azzahra',
      'Jenis Kelamin (L/P)': 'P',
      'Catatan': 'Sekretaris',
    },
    {
      'No': 3,
      'NISN': '0071234003',
      'Nama Lengkap Siswa': 'Bima Arya Wibowo',
      'Jenis Kelamin (L/P)': 'L',
      'Catatan': '',
    },
    {
      'No': 4,
      'NISN': '0071234004',
      'Nama Lengkap Siswa': 'Citra Lestari Rahayu',
      'Jenis Kelamin (L/P)': 'P',
      'Catatan': '',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 30 },
    { wch: 20 },
    { wch: 25 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Siswa');

  const filename = `Template_Data_Siswa.${format}`;
  XLSX.writeFile(workbook, filename);
}

/**
 * Export full attendance sheet to Excel
 */
export function exportAttendanceToExcel(
  className: string,
  mapel: string,
  teacherName: string,
  students: Student[],
  sessions: AttendanceSession[]
): void {
  const rows: Record<string, unknown>[] = [];

  students.forEach((s) => {
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alfa = 0;

    const rowObj: Record<string, unknown> = {
      'No': s.no,
      'NISN': s.nisn,
      'Nama Siswa': s.nama,
      'L/P': s.gender,
    };

    // Add per session
    sessions.forEach((ses) => {
      const rec = ses.records[s.id];
      const st = rec?.status || '-';
      rowObj[`Pertemuan ${ses.pertemuanKe} (${ses.tanggal})`] = st;

      if (st === 'H') hadir++;
      else if (st === 'S') sakit++;
      else if (st === 'I') izin++;
      else if (st === 'A') alfa++;
    });

    const totalTatapMuka = sessions.length;
    const persentase = totalTatapMuka > 0 ? Math.round((hadir / totalTatapMuka) * 100) : 100;

    rowObj['Total Hadir (H)'] = hadir;
    rowObj['Total Sakit (S)'] = sakit;
    rowObj['Total Izin (I)'] = izin;
    rowObj['Total Alfa (A)'] = alfa;
    rowObj['% Kehadiran'] = `${persentase}%`;
    rowObj['Catatan'] = s.catatanUmum || '';

    rows.push(rowObj);
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Absensi');

  const filename = `Rekap_Absensi_${className.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

/**
 * Export full grades sheet to Excel with Monthly Assessment Columns (6 Months x 4 Columns)
 */
export function exportGradesToExcel(
  className: string,
  mapel: string,
  kkm: number,
  students: Student[],
  grades: StudentGrade[],
  headers?: GradeColumnHeader[]
): void {
  const rows: Record<string, unknown>[] = [];

  students.forEach((s) => {
    const g = grades.find((item) => item.studentId === s.id);
    const rowObj: Record<string, unknown> = {
      'No': s.no,
      'NISN': s.nisn,
      'Nama Siswa': s.nama,
      'L/P': s.gender,
    };

    let totalScore = 0;
    let scoreCount = 0;

    if (headers && headers.length > 0) {
      // Monthly 4-column structure
      headers.forEach((h) => {
        let val: number | null = null;
        if (g?.monthlyGrades && g.monthlyGrades[h.key] !== undefined) {
          val = g.monthlyGrades[h.key];
        } else {
          // Backward compatibility
          if (h.monthIndex === 0) {
            if (h.colIndex === 0) val = g?.formatif1 ?? g?.tugas1 ?? null;
            else if (h.colIndex === 1) val = g?.formatif2 ?? g?.tugas2 ?? null;
            else if (h.colIndex === 2) val = g?.formatif3 ?? g?.tugas3 ?? null;
            else if (h.colIndex === 3) val = g?.formatif4 ?? g?.praktik ?? null;
          } else if (h.monthIndex === 1) {
            if (h.colIndex === 0) val = g?.formatif5 ?? null;
            else if (h.colIndex === 1) val = g?.formatif6 ?? null;
            else if (h.colIndex === 2) val = g?.formatif7 ?? null;
            else if (h.colIndex === 3) val = g?.formatif8 ?? null;
          }
        }

        const colName = `[${h.monthName}] ${h.colLabel} (${h.keterangan || 'Penilaian'} - ${h.tanggal || '-'})`;
        rowObj[colName] = val !== null && !isNaN(Number(val)) ? Number(val) : '';

        if (val !== null && !isNaN(Number(val))) {
          totalScore += Number(val);
          scoreCount++;
        }
      });
    } else {
      // Standard format
      const f1 = g?.formatif1 ?? g?.tugas1 ?? null;
      const f2 = g?.formatif2 ?? g?.tugas2 ?? null;
      const f3 = g?.formatif3 ?? g?.tugas3 ?? null;
      const f4 = g?.formatif4 ?? g?.praktik ?? null;
      const f5 = g?.formatif5 ?? null;
      const f6 = g?.formatif6 ?? null;
      const f7 = g?.formatif7 ?? null;
      const f8 = g?.formatif8 ?? null;

      rowObj['Formatif 1'] = f1 ?? '';
      rowObj['Formatif 2'] = f2 ?? '';
      rowObj['Formatif 3'] = f3 ?? '';
      rowObj['Formatif 4'] = f4 ?? '';
      rowObj['Formatif 5'] = f5 ?? '';
      rowObj['Formatif 6'] = f6 ?? '';
      rowObj['Formatif 7'] = f7 ?? '';
      rowObj['Formatif 8'] = f8 ?? '';

      const valid = [f1, f2, f3, f4, f5, f6, f7, f8].filter((v): v is number => v !== null && !isNaN(v));
      if (valid.length > 0) {
        totalScore = valid.reduce((a, b) => a + b, 0);
        scoreCount = valid.length;
      }
    }

    const nilaiAkhir = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;
    let predikat = 'D';
    if (nilaiAkhir >= 88) predikat = 'A';
    else if (nilaiAkhir >= 76) predikat = 'B';
    else if (nilaiAkhir >= 60) predikat = 'C';

    const status = nilaiAkhir >= kkm ? 'Tuntas' : 'Belum Tuntas';

    rowObj['Nilai Akhir'] = nilaiAkhir;
    rowObj['Predikat'] = predikat;
    rowObj['KKM'] = kkm;
    rowObj['Status'] = status;
    rowObj['Catatan Evaluasi'] = g?.catatan || '';

    rows.push(rowObj);
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Nilai');

  const filename = `Rekap_Nilai_${className.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
