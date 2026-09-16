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
 * Export full attendance sheet to Excel with sessions grouped by month
 */
export function exportAttendanceToExcel(
  className: string,
  mapel: string,
  teacherName: string,
  students: Student[],
  sessions: AttendanceSession[],
  includeMonthlySubtotals: boolean = true
): void {
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const getMonthLabel = (dateStr: string) => {
    if (!dateStr) return 'Lainnya';
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
      const m = parseInt(parts[1], 10);
      if (m >= 1 && m <= 12) {
        return monthNames[m - 1];
      }
    }
    return 'Lainnya';
  };

  // Sort sessions chronologically
  const sortedSessions = [...sessions].sort((a, b) => {
    if (a.tanggal !== b.tanggal) return a.tanggal.localeCompare(b.tanggal);
    return a.pertemuanKe - b.pertemuanKe;
  });

  // Group sessions by month key
  const monthGroupMap = new Map<string, AttendanceSession[]>();
  sortedSessions.forEach((ses) => {
    const mLabel = getMonthLabel(ses.tanggal);
    if (!monthGroupMap.has(mLabel)) {
      monthGroupMap.set(mLabel, []);
    }
    monthGroupMap.get(mLabel)!.push(ses);
  });

  const rows: Record<string, unknown>[] = [];

  students.forEach((s) => {
    let grandHadir = 0;
    let grandSakit = 0;
    let grandIzin = 0;
    let grandAlfa = 0;

    const rowObj: Record<string, unknown> = {
      'No': s.no,
      'NISN': s.nisn,
      'Nama Siswa': s.nama,
      'L/P': s.gender,
    };

    // Iterate by month groups
    monthGroupMap.forEach((mSessions, mName) => {
      let mH = 0;
      let mS = 0;
      let mI = 0;
      let mA = 0;

      mSessions.forEach((ses) => {
        const rec = ses.records[s.id];
        const st = rec?.status || '-';
        rowObj[`[${mName}] P${ses.pertemuanKe} (${ses.tanggal})`] = st;

        if (st === 'H') {
          mH++;
          grandHadir++;
        } else if (st === 'S') {
          mS++;
          grandSakit++;
        } else if (st === 'I') {
          mI++;
          grandIzin++;
        } else if (st === 'A') {
          mA++;
          grandAlfa++;
        }
      });

      if (includeMonthlySubtotals) {
        rowObj[`[${mName}] H`] = mH;
        rowObj[`[${mName}] S`] = mS;
        rowObj[`[${mName}] I`] = mI;
        rowObj[`[${mName}] A`] = mA;
      }
    });

    const totalTatapMuka = sortedSessions.length;
    const persentase = totalTatapMuka > 0 ? Math.round((grandHadir / totalTatapMuka) * 100) : 100;

    rowObj['Total Hadir (H)'] = grandHadir;
    rowObj['Total Sakit (S)'] = grandSakit;
    rowObj['Total Izin (I)'] = grandIzin;
    rowObj['Total Alfa (A)'] = grandAlfa;
    rowObj['% Kehadiran'] = `${persentase}%`;
    rowObj['Catatan'] = s.catatanUmum || '';

    rows.push(rowObj);
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Absensi Bulanan');

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

    let totalFormatifScore = 0;
    let formatifCount = 0;

    if (headers && headers.length > 0) {
      // Monthly 4-column structure (Asesmen Formatif)
      // Group by month to calculate monthly average in excel
      const months = Array.from(new Set(headers.map((h) => h.monthIndex))).sort((a, b) => a - b);

      months.forEach((mIdx) => {
        const mHeaders = headers.filter((h) => h.monthIndex === mIdx);
        const mName = mHeaders[0]?.monthName || `Bulan ${mIdx + 1}`;
        let mTotal = 0;
        let mCount = 0;

        mHeaders.forEach((h) => {
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

          const colName = `[${mName}] ${h.colLabel} (${h.keterangan || 'Formatif'} - ${h.tanggal || '-'})`;
          rowObj[colName] = val !== null && !isNaN(Number(val)) ? Number(val) : '';

          if (val !== null && !isNaN(Number(val))) {
            const num = Number(val);
            totalFormatifScore += num;
            formatifCount++;
            mTotal += num;
            mCount++;
          }
        });

        // Add monthly average column
        rowObj[`[${mName}] Rata-rata Formatif`] = mCount > 0 ? Math.round(mTotal / mCount) : '';
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
        totalFormatifScore = valid.reduce((a, b) => a + b, 0);
        formatifCount = valid.length;
      }
    }

    // Rata-rata Formatif Semester
    const rataFormatif = formatifCount > 0 ? Math.round(totalFormatifScore / formatifCount) : null;
    rowObj['Rata-rata Formatif'] = rataFormatif !== null ? rataFormatif : '';

    // Asesmen Sumatif Tengah Semester (STS)
    let sumatifTengah: number | null = null;
    if (g?.sumatifTengah !== undefined && g?.sumatifTengah !== null && !isNaN(Number(g.sumatifTengah))) {
      sumatifTengah = Number(g.sumatifTengah);
    } else if (g?.monthlyGrades?.['sumatif_tengah'] !== undefined && g?.monthlyGrades?.['sumatif_tengah'] !== null) {
      const v = g.monthlyGrades['sumatif_tengah'];
      sumatifTengah = !isNaN(Number(v)) ? Number(v) : null;
    } else if (g?.uts !== undefined && g?.uts !== null && !isNaN(Number(g.uts))) {
      sumatifTengah = Number(g.uts);
    }
    rowObj['Sumatif Tengah Semester (STS)'] = sumatifTengah !== null ? sumatifTengah : '';

    // Asesmen Sumatif Akhir Semester (SAS)
    let sumatifAkhir: number | null = null;
    if (g?.sumatifAkhir !== undefined && g?.sumatifAkhir !== null && !isNaN(Number(g.sumatifAkhir))) {
      sumatifAkhir = Number(g.sumatifAkhir);
    } else if (g?.monthlyGrades?.['sumatif_akhir'] !== undefined && g?.monthlyGrades?.['sumatif_akhir'] !== null) {
      const v = g.monthlyGrades['sumatif_akhir'];
      sumatifAkhir = !isNaN(Number(v)) ? Number(v) : null;
    } else if (g?.uas !== undefined && g?.uas !== null && !isNaN(Number(g.uas))) {
      sumatifAkhir = Number(g.uas);
    }
    rowObj['Sumatif Akhir Semester (SAS)'] = sumatifAkhir !== null ? sumatifAkhir : '';

    // Nilai Akhir (Kurikulum Merdeka: 50% Formatif + 25% STS + 25% SAS)
    let totalWeighted = 0;
    let totalWeight = 0;
    if (rataFormatif !== null) {
      totalWeighted += rataFormatif * 0.5;
      totalWeight += 0.5;
    }
    if (sumatifTengah !== null) {
      totalWeighted += sumatifTengah * 0.25;
      totalWeight += 0.25;
    }
    if (sumatifAkhir !== null) {
      totalWeighted += sumatifAkhir * 0.25;
      totalWeight += 0.25;
    }

    const nilaiAkhir = totalWeight > 0 ? Math.round(totalWeighted / totalWeight) : 0;
    let predikat = 'D';
    if (nilaiAkhir >= 88) predikat = 'A';
    else if (nilaiAkhir >= 76) predikat = 'B';
    else if (nilaiAkhir >= 60) predikat = 'C';

    const status = nilaiAkhir >= kkm ? 'Tuntas' : 'Belum Tuntas';

    rowObj['Nilai Akhir (NA)'] = nilaiAkhir;
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
