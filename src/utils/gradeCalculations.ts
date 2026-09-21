import { StudentGrade, GradeColumnHeader } from '../types';
import { getDefaultGradeHeaders } from './gradeHeaders';

export interface FormatifItemDetail {
  key: string;
  label: string;
  monthIndex: number;
  monthName: string;
  val: number | null;
  tanggal?: string;
  keterangan?: string;
}

export interface FormattedGradeDetail {
  formatif1: number | null;
  formatif2: number | null;
  formatif3: number | null;
  formatif4: number | null;
  formatif5: number | null;
  formatif6: number | null;
  formatif7: number | null;
  formatif8: number | null;
  sumatifTengah: number | null;
  sumatifAkhir: number | null;
  rataFormatif: number;
  nilaiAkhir: number;
  predikat: 'A' | 'B' | 'C' | 'D';
  isTuntas: boolean;
  status: 'Tuntas' | 'Belum Tuntas';
  // Enhanced details for rich display in public view & modals
  allFormatifItems: FormatifItemDetail[];
  monthlySummaries: Array<{
    monthIndex: number;
    monthName: string;
    scores: (number | null)[];
    average: number | null;
  }>;
  totalAssessmentsTaken: number;
}

/**
 * Extracts normalized grade values from StudentGrade, handling monthlyGrades,
 * legacy fields (formatif1..10, tugas1..3, praktik), and column headers.
 */
export function extractGradeValues(
  g?: StudentGrade,
  customHeaders?: GradeColumnHeader[]
) {
  const headers = customHeaders && customHeaders.length > 0
    ? customHeaders
    : getDefaultGradeHeaders();

  // 1. Extract Formatif 1 to 8 (Month 0 and Month 1) with dual-lookup (monthlyGrades vs top-level fields)
  const getVal = (mKey: string, ...fallbackFields: (number | null | undefined)[]) => {
    if (g?.monthlyGrades && g.monthlyGrades[mKey] !== undefined && g.monthlyGrades[mKey] !== null) {
      const raw = g.monthlyGrades[mKey];
      const parsed = Number(raw);
      if (!isNaN(parsed)) return parsed;
    }
    for (const f of fallbackFields) {
      if (f !== undefined && f !== null) {
        const parsed = Number(f);
        if (!isNaN(parsed)) return parsed;
      }
    }
    return null;
  };

  const formatif1 = getVal('m0_c0', g?.formatif1, g?.tugas1);
  const formatif2 = getVal('m0_c1', g?.formatif2, g?.tugas2);
  const formatif3 = getVal('m0_c2', g?.formatif3, g?.tugas3);
  const formatif4 = getVal('m0_c3', g?.formatif4, g?.praktik);
  const formatif5 = getVal('m1_c0', g?.formatif5);
  const formatif6 = getVal('m1_c1', g?.formatif6);
  const formatif7 = getVal('m1_c2', g?.formatif7);
  const formatif8 = getVal('m1_c3', g?.formatif8);

  // 2. Sumatif Tengah Semester (STS)
  const sumatifTengah = getVal('sumatif_tengah', g?.sumatifTengah, g?.uts);

  // 3. Sumatif Akhir Semester (SAS)
  const sumatifAkhir = getVal('sumatif_akhir', g?.sumatifAkhir, g?.uas);

  // 4. Build complete list of all 24 formatif column items
  const allFormatifItems: FormatifItemDetail[] = [];
  const monthlySummaries: Array<{
    monthIndex: number;
    monthName: string;
    scores: (number | null)[];
    average: number | null;
  }> = [];

  const validScores: number[] = [];

  // Group headers by monthIndex 0..5 (exclude 98 and 99 which are STS and SAS)
  for (let m = 0; m < 6; m++) {
    const mHeaders = headers.filter((h) => h.monthIndex === m);
    const monthName = mHeaders[0]?.monthName || `Bulan ${m + 1}`;
    const mScores: (number | null)[] = [];

    for (let c = 0; c < 4; c++) {
      const h = mHeaders.find((item) => item.colIndex === c);
      const key = `m${m}_c${c}`;
      let val: number | null = null;

      if (m === 0) {
        if (c === 0) val = formatif1;
        else if (c === 1) val = formatif2;
        else if (c === 2) val = formatif3;
        else if (c === 3) val = formatif4;
      } else if (m === 1) {
        if (c === 0) val = formatif5;
        else if (c === 1) val = formatif6;
        else if (c === 2) val = formatif7;
        else if (c === 3) val = formatif8;
      } else {
        val = getVal(key);
      }

      mScores.push(val);
      if (val !== null && !isNaN(val)) {
        validScores.push(val);
      }

      allFormatifItems.push({
        key,
        label: h?.colLabel || `Formatif ${c + 1}`,
        monthIndex: m,
        monthName,
        val,
        tanggal: h?.tanggal || '',
        keterangan: h?.keterangan || '',
      });
    }

    const validMScores = mScores.filter((v): v is number => v !== null && !isNaN(v));
    const mAvg =
      validMScores.length > 0
        ? Math.round(validMScores.reduce((acc, v) => acc + v, 0) / validMScores.length)
        : null;

    monthlySummaries.push({
      monthIndex: m,
      monthName,
      scores: mScores,
      average: mAvg,
    });
  }

  // Also collect any legacy formatif9 and formatif10 if present
  if (g?.formatif9 !== undefined && g?.formatif9 !== null) {
    validScores.push(Number(g.formatif9));
  }
  if (g?.formatif10 !== undefined && g?.formatif10 !== null) {
    validScores.push(Number(g.formatif10));
  }

  return {
    formatif1,
    formatif2,
    formatif3,
    formatif4,
    formatif5,
    formatif6,
    formatif7,
    formatif8,
    sumatifTengah,
    sumatifAkhir,
    allFormatifItems,
    monthlySummaries,
    validScores,
  };
}

/**
 * Calculates student assessment results for Kurikulum Merdeka:
 * - Formatif Assessments (up to 24 columns across 6 months)
 * - 2 Sumatif Assessments (STS & SAS)
 */
export function calculateStudentGrade(
  g?: StudentGrade,
  kkm: number = 75,
  customHeaders?: GradeColumnHeader[]
): FormattedGradeDetail {
  const {
    formatif1,
    formatif2,
    formatif3,
    formatif4,
    formatif5,
    formatif6,
    formatif7,
    formatif8,
    sumatifTengah,
    sumatifAkhir,
    allFormatifItems,
    monthlySummaries,
    validScores,
  } = extractGradeValues(g, customHeaders);

  const rataFormatif =
    validScores.length > 0
      ? Math.round(validScores.reduce((acc, val) => acc + val, 0) / validScores.length)
      : 0;

  // Weighting calculation (Kurikulum Merdeka):
  // 50% Rata-rata Formatif + 25% Sumatif STS + 25% Sumatif SAS
  let totalWeightedScore = 0;
  let totalWeight = 0;

  if (validScores.length > 0) {
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
    totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : rataFormatif;

  let predikat: 'A' | 'B' | 'C' | 'D' = 'D';
  if (nilaiAkhir >= 88) predikat = 'A';
  else if (nilaiAkhir >= 76) predikat = 'B';
  else if (nilaiAkhir >= 60) predikat = 'C';

  const isTuntas = nilaiAkhir >= kkm;
  const status: 'Tuntas' | 'Belum Tuntas' = isTuntas ? 'Tuntas' : 'Belum Tuntas';

  return {
    formatif1,
    formatif2,
    formatif3,
    formatif4,
    formatif5,
    formatif6,
    formatif7,
    formatif8,
    sumatifTengah,
    sumatifAkhir,
    rataFormatif,
    nilaiAkhir,
    predikat,
    isTuntas,
    status,
    allFormatifItems,
    monthlySummaries,
    totalAssessmentsTaken: validScores.length,
  };
}

