import { GradeColumnHeader, StudentGrade } from '../types';

export const SEMESTER_MONTHS_GANJIL = [
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const SEMESTER_MONTHS_GENAP = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
];

export function getSemesterMonths(semester: 'Ganjil' | 'Genap' = 'Ganjil'): string[] {
  return semester === 'Genap' ? SEMESTER_MONTHS_GENAP : SEMESTER_MONTHS_GANJIL;
}

/**
 * Generate 24 grade column headers (6 months x 4 assessment columns)
 * Named specifically as Asesmen Formatif (Formatif 1 s/d Formatif 4 per month)
 */
export function getDefaultGradeHeaders(
  semester: 'Ganjil' | 'Genap' = 'Ganjil',
  academicYear: string = '2025/2026'
): GradeColumnHeader[] {
  const months = getSemesterMonths(semester);
  const startYear = parseInt(academicYear.split('/')[0]) || 2025;
  const headers: GradeColumnHeader[] = [];

  const defaultDescriptions = [
    'Formatif 1 (Tugas/TP 1)',
    'Formatif 2 (Praktik/TP 2)',
    'Formatif 3 (Kuis/TP 3)',
    'Formatif 4 (Tes Formatif/TP 4)',
  ];

  months.forEach((monthName, mIndex) => {
    // Month number for date construction (Juli = 7, Des = 12; Jan = 1, Jun = 6)
    let calMonth = semester === 'Ganjil' ? mIndex + 7 : mIndex + 1;
    let calYear = semester === 'Ganjil' ? startYear : startYear + 1;
    const padMonth = String(calMonth).padStart(2, '0');

    for (let cIndex = 0; cIndex < 4; cIndex++) {
      const day = String(Math.min(28, 7 * (cIndex + 1))).padStart(2, '0');
      headers.push({
        key: `m${mIndex}_c${cIndex}`,
        monthIndex: mIndex,
        monthName,
        colIndex: cIndex,
        colLabel: `Formatif ${cIndex + 1}`,
        tanggal: `${calYear}-${padMonth}-${day}`,
        keterangan: defaultDescriptions[cIndex] || `Asesmen Formatif ${cIndex + 1}`,
      });
    }
  });

  // Asesmen Sumatif Tengah Semester (STS) - Bulan ke-3
  const stsMonth = semester === 'Ganjil' ? 9 : 3;
  const stsYear = semester === 'Ganjil' ? startYear : startYear + 1;
  headers.push({
    key: 'sumatif_tengah',
    monthIndex: 98,
    monthName: months[2] || 'Tengah Semester',
    colIndex: 0,
    colLabel: 'Sumatif Tengah (STS)',
    tanggal: `${stsYear}-${String(stsMonth).padStart(2, '0')}-22`,
    keterangan: 'Asesmen Sumatif Tengah Semester (STS)',
  });

  // Asesmen Sumatif Akhir Semester (SAS) - Bulan ke-6
  const sasMonth = semester === 'Ganjil' ? 12 : 6;
  const sasYear = semester === 'Ganjil' ? startYear : startYear + 1;
  headers.push({
    key: 'sumatif_akhir',
    monthIndex: 99,
    monthName: months[5] || 'Akhir Semester',
    colIndex: 0,
    colLabel: 'Sumatif Akhir (SAS)',
    tanggal: `${sasYear}-${String(sasMonth).padStart(2, '0')}-08`,
    keterangan: 'Asesmen Sumatif Akhir Semester (SAS)',
  });

  return headers;
}

export interface MonthlySummary {
  monthIndex: number;
  monthName: string;
  scores: (number | null)[];
  average: number | null;
}

export interface CalculatedMonthlyResult {
  studentId: string;
  monthlySummaries: MonthlySummary[];
  totalAssessmentsTaken: number;
  rataFormatif: number | null;
  sumatifTengah: number | null;
  sumatifAkhir: number | null;
  nilaiAkhir: number;
  predikat: 'A' | 'B' | 'C' | 'D';
  isTuntas: boolean;
  status: 'Tuntas' | 'Belum Tuntas';
}

/**
 * Calculates grade statistics based on:
 * - 6 months x 4 Asesmen Formatif columns (Monthly assessments)
 * - Asesmen Sumatif Tengah Semester (STS)
 * - Asesmen Sumatif Akhir Semester (SAS)
 * In Kurikulum Merdeka: 50% Rata-rata Formatif + 25% Sumatif STS + 25% Sumatif SAS
 */
export function calculateMonthlyStudentGrade(
  grade: StudentGrade | undefined,
  headers: GradeColumnHeader[],
  kkm: number = 75
): CalculatedMonthlyResult {
  const monthlySummaries: MonthlySummary[] = [];
  const allFormatifScores: number[] = [];

  // Group by months 0 to 5
  for (let m = 0; m < 6; m++) {
    const monthHeaders = headers.filter((h) => h.monthIndex === m);
    const monthName = monthHeaders[0]?.monthName || `Bulan ${m + 1}`;
    const scores: (number | null)[] = [];

    for (let c = 0; c < 4; c++) {
      const key = `m${m}_c${c}`;
      let val: number | null = null;

      // 1. First check monthlyGrades record
      if (grade?.monthlyGrades && grade.monthlyGrades[key] !== undefined) {
        const raw = grade.monthlyGrades[key];
        val = raw !== null && !isNaN(Number(raw)) ? Number(raw) : null;
      } else {
        // Fallback backward compatibility from existing formatif / tugas fields for Month 0 & 1
        if (m === 0) {
          if (c === 0) val = grade?.formatif1 ?? grade?.tugas1 ?? null;
          else if (c === 1) val = grade?.formatif2 ?? grade?.tugas2 ?? null;
          else if (c === 2) val = grade?.formatif3 ?? grade?.tugas3 ?? null;
          else if (c === 3) val = grade?.formatif4 ?? grade?.praktik ?? null;
        } else if (m === 1) {
          if (c === 0) val = grade?.formatif5 ?? null;
          else if (c === 1) val = grade?.formatif6 ?? null;
          else if (c === 2) val = grade?.formatif7 ?? null;
          else if (c === 3) val = grade?.formatif8 ?? null;
        }
      }

      scores.push(val);
      if (val !== null && !isNaN(val)) {
        allFormatifScores.push(val);
      }
    }

    const validScores = scores.filter((v): v is number => v !== null && !isNaN(v));
    const average =
      validScores.length > 0
        ? Math.round(validScores.reduce((acc, v) => acc + v, 0) / validScores.length)
        : null;

    monthlySummaries.push({
      monthIndex: m,
      monthName,
      scores,
      average,
    });
  }

  // 1. Rata-rata Asesmen Formatif (Bulanan)
  const rataFormatif =
    allFormatifScores.length > 0
      ? Math.round(allFormatifScores.reduce((acc, v) => acc + v, 0) / allFormatifScores.length)
      : null;

  // 2. Asesmen Sumatif Tengah Semester (STS)
  let sumatifTengah: number | null = null;
  if (grade?.sumatifTengah !== undefined && grade?.sumatifTengah !== null && !isNaN(Number(grade.sumatifTengah))) {
    sumatifTengah = Number(grade.sumatifTengah);
  } else if (grade?.monthlyGrades?.['sumatif_tengah'] !== undefined && grade?.monthlyGrades?.['sumatif_tengah'] !== null) {
    const rawSts = grade.monthlyGrades['sumatif_tengah'];
    sumatifTengah = !isNaN(Number(rawSts)) ? Number(rawSts) : null;
  } else if (grade?.uts !== undefined && grade?.uts !== null && !isNaN(Number(grade.uts))) {
    sumatifTengah = Number(grade.uts);
  }

  // 3. Asesmen Sumatif Akhir Semester (SAS)
  let sumatifAkhir: number | null = null;
  if (grade?.sumatifAkhir !== undefined && grade?.sumatifAkhir !== null && !isNaN(Number(grade.sumatifAkhir))) {
    sumatifAkhir = Number(grade.sumatifAkhir);
  } else if (grade?.monthlyGrades?.['sumatif_akhir'] !== undefined && grade?.monthlyGrades?.['sumatif_akhir'] !== null) {
    const rawSas = grade.monthlyGrades['sumatif_akhir'];
    sumatifAkhir = !isNaN(Number(rawSas)) ? Number(rawSas) : null;
  } else if (grade?.uas !== undefined && grade?.uas !== null && !isNaN(Number(grade.uas))) {
    sumatifAkhir = Number(grade.uas);
  }

  // 4. Perhitungan Nilai Akhir (NA) Kurikulum Merdeka
  // Standard bobot: 50% Rata-rata Formatif + 25% STS + 25% SAS
  let totalWeightedScore = 0;
  let totalWeight = 0;

  if (rataFormatif !== null) {
    totalWeightedScore += rataFormatif * 0.5;
    totalWeight += 0.5;
  }

  if (sumatifTengah !== null && !isNaN(sumatifTengah)) {
    totalWeightedScore += sumatifTengah * 0.25;
    totalWeight += 0.25;
  }

  if (sumatifAkhir !== null && !isNaN(sumatifAkhir)) {
    totalWeightedScore += sumatifAkhir * 0.25;
    totalWeight += 0.25;
  }

  const nilaiAkhir =
    totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;

  let predikat: 'A' | 'B' | 'C' | 'D' = 'D';
  if (nilaiAkhir >= 88) predikat = 'A';
  else if (nilaiAkhir >= 76) predikat = 'B';
  else if (nilaiAkhir >= 60) predikat = 'C';

  const isTuntas = nilaiAkhir >= kkm;
  const status: 'Tuntas' | 'Belum Tuntas' = isTuntas ? 'Tuntas' : 'Belum Tuntas';

  return {
    studentId: grade?.studentId || '',
    monthlySummaries,
    totalAssessmentsTaken: allFormatifScores.length,
    rataFormatif,
    sumatifTengah,
    sumatifAkhir,
    nilaiAkhir,
    predikat,
    isTuntas,
    status,
  };
}
