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
 */
export function getDefaultGradeHeaders(
  semester: 'Ganjil' | 'Genap' = 'Ganjil',
  academicYear: string = '2025/2026'
): GradeColumnHeader[] {
  const months = getSemesterMonths(semester);
  const startYear = parseInt(academicYear.split('/')[0]) || 2025;
  const headers: GradeColumnHeader[] = [];

  const defaultDescriptions = [
    'Tugas 1 / Formatif',
    'Tugas 2 / Praktik',
    'Ulangan Harian',
    'Proyek / Kuis',
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
        colLabel: `Nilai ${cIndex + 1}`,
        tanggal: `${calYear}-${padMonth}-${day}`,
        keterangan: defaultDescriptions[cIndex] || `Penilaian ${cIndex + 1}`,
      });
    }
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
  nilaiAkhir: number;
  predikat: 'A' | 'B' | 'C' | 'D';
  isTuntas: boolean;
  status: 'Tuntas' | 'Belum Tuntas';
}

/**
 * Calculates grade statistics based on the 6 months x 4 columns structure
 */
export function calculateMonthlyStudentGrade(
  grade: StudentGrade | undefined,
  headers: GradeColumnHeader[],
  kkm: number = 75
): CalculatedMonthlyResult {
  const monthlySummaries: MonthlySummary[] = [];
  const allScores: number[] = [];

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
        } else if (m === 2 && c === 3) {
          val = grade?.sumatifTengah ?? grade?.uts ?? null;
        } else if (m === 5 && c === 3) {
          val = grade?.sumatifAkhir ?? grade?.uas ?? null;
        }
      }

      scores.push(val);
      if (val !== null && !isNaN(val)) {
        allScores.push(val);
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

  // Calculate Nilai Akhir:
  // If scores exist, average of all valid scores
  const nilaiAkhir =
    allScores.length > 0
      ? Math.round(allScores.reduce((acc, v) => acc + v, 0) / allScores.length)
      : 0;

  let predikat: 'A' | 'B' | 'C' | 'D' = 'D';
  if (nilaiAkhir >= 88) predikat = 'A';
  else if (nilaiAkhir >= 76) predikat = 'B';
  else if (nilaiAkhir >= 60) predikat = 'C';

  const isTuntas = nilaiAkhir >= kkm;
  const status: 'Tuntas' | 'Belum Tuntas' = isTuntas ? 'Tuntas' : 'Belum Tuntas';

  return {
    studentId: grade?.studentId || '',
    monthlySummaries,
    totalAssessmentsTaken: allScores.length,
    nilaiAkhir,
    predikat,
    isTuntas,
    status,
  };
}
