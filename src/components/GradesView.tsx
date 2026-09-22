import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileSpreadsheet,
  Search,
  CheckCircle2,
  AlertTriangle,
  Award,
  TrendingUp,
  Edit3,
  X,
  Save,
  Calendar,
  CloudUpload,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CalendarDays,
  Layers,
  Settings2,
  BookOpen,
  GraduationCap,
  Info,
  Globe,
  Share2,
  UploadCloud,
} from 'lucide-react';
import { Student, StudentGrade, Gender, GradeColumnHeader, ClassRoom, TeacherProfile } from '../types';
import { exportGradesToExcel } from '../utils/excel';
import {
  getDefaultGradeHeaders,
  getSemesterMonths,
  calculateMonthlyStudentGrade,
} from '../utils/gradeHeaders';
import { Storage } from '../utils/storage';
import { SharePublicNilaiModal } from './SharePublicNilaiModal';
import { ImportGradesModal } from './ImportGradesModal';

interface GradesViewProps {
  students: Student[];
  grades: StudentGrade[];
  kkm: number;
  className: string;
  mataPelajaran: string;
  classId?: string;
  semester?: 'Ganjil' | 'Genap';
  academicYear?: string;
  initialHeaders?: GradeColumnHeader[];
  onSaveGrades: (
    updatedGrades: StudentGrade[],
    updatedHeaders: GradeColumnHeader[],
    options?: { silent?: boolean }
  ) => Promise<void> | void;
  onUpdateGrade?: (
    studentId: string,
    field: keyof StudentGrade,
    value: number | string | null
  ) => void;
  onUpdateStudentField?: (studentId: string, field: keyof Student, value: any) => void;
  onEditStudent?: (student: Student) => void;
  onOpenEditClass?: () => void;
  currentClass?: ClassRoom;
  teacher?: TeacherProfile;
  currentUid?: string;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const GradesView: React.FC<GradesViewProps> = ({
  students,
  grades,
  kkm,
  className,
  mataPelajaran,
  classId = 'class-1',
  semester = 'Ganjil',
  academicYear = '2025/2026',
  initialHeaders,
  onSaveGrades,
  onUpdateStudentField,
  onEditStudent,
  onOpenEditClass,
  currentClass,
  teacher,
  currentUid = 'demo',
  onShowToast,
}) => {
  const [showPublicShareModal, setShowPublicShareModal] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'tuntas' | 'belum'>('all');
  const [filterGender, setFilterGender] = useState<'all' | Gender>('all');
  const [isQuickEditMode, setIsQuickEditMode] = useState(false);

  // Month navigation tab: 0..5 (month index), 'sumatif' (Dedicated STS & SAS), or 'all' (Semester Summary)
  const [activeMonthTab, setActiveMonthTab] = useState<'all' | 'sumatif' | number>(0);

  // Unsaved changes & saving states
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  const safeSemester: 'Ganjil' | 'Genap' = semester === 'Genap' ? 'Genap' : 'Ganjil';

  // Working copy of headers (24 formatif columns + STS + SAS)
  const [columnHeaders, setColumnHeaders] = useState<GradeColumnHeader[]>(() => {
    if (initialHeaders && initialHeaders.length > 0) return initialHeaders;
    return Storage.getGradeHeaders(classId, safeSemester, academicYear);
  });

  // Working copy of student grades
  const [localGrades, setLocalGrades] = useState<StudentGrade[]>(() => {
    return grades;
  });

  // Header configuration modal state
  const [isHeaderModalOpen, setIsHeaderModalOpen] = useState(false);
  const [editingMonthIndex, setEditingMonthIndex] = useState<number>(0);
  const [modalTab, setModalTab] = useState<'formatif' | 'sumatif'>('formatif');

  const months = useMemo(() => getSemesterMonths(safeSemester), [safeSemester]);
  const prevClassIdRef = useRef(classId);

  // Sync with prop changes: preserve local inputs if user has unsaved changes unless switching class
  useEffect(() => {
    const loadedHeaders =
      initialHeaders && initialHeaders.length > 0
        ? initialHeaders
        : Storage.getGradeHeaders(classId, safeSemester, academicYear);
    setColumnHeaders(loadedHeaders);

    if (prevClassIdRef.current !== classId || !hasUnsavedChanges) {
      setLocalGrades(grades);
      setHasUnsavedChanges(false);
      prevClassIdRef.current = classId;
    }
  }, [classId, safeSemester, academicYear, grades, initialHeaders]);

  // Non-blocking debounced Cloud auto-sync (automatically saves changes in background after 500ms without locking the UI)
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const timer = setTimeout(async () => {
      try {
        setIsAutoSyncing(true);
        await onSaveGrades(localGrades, columnHeaders, { silent: true });
        Storage.setGradeHeaders(classId, columnHeaders);
        setHasUnsavedChanges(false);
        const now = new Date();
        const timeStr = now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        setLastSavedTime(timeStr);
      } catch (err) {
        console.warn('[GradesView] Auto-sync notice:', err);
      } finally {
        setIsAutoSyncing(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localGrades, columnHeaders, hasUnsavedChanges, classId, onSaveGrades]);

  // Find or initialize grade object for student in local state
  const getStudentGrade = (studentId: string): StudentGrade => {
    const existing = localGrades.find((g) => g.studentId === studentId);
    if (existing) return existing;
    return {
      id: `grd-${studentId}`,
      studentId,
      classId,
      monthlyGrades: {},
      catatan: '',
    };
  };

  // Handler for cell input change (0-100 or empty)
  const handleScoreChange = (
    studentId: string,
    key: string,
    rawVal: string
  ) => {
    const clean = rawVal.trim();
    let numVal: number | null = null;
    if (clean !== '') {
      const parsed = parseFloat(clean);
      if (!isNaN(parsed)) {
        numVal = Math.max(0, Math.min(100, Math.round(parsed)));
      }
    }

    setLocalGrades((prev) => {
      const index = prev.findIndex((g) => g.studentId === studentId);
      const legacyUpdates: Partial<StudentGrade> = {};
      if (key === 'm0_c0') legacyUpdates.formatif1 = numVal;
      else if (key === 'm0_c1') legacyUpdates.formatif2 = numVal;
      else if (key === 'm0_c2') legacyUpdates.formatif3 = numVal;
      else if (key === 'm0_c3') legacyUpdates.formatif4 = numVal;
      else if (key === 'm1_c0') legacyUpdates.formatif5 = numVal;
      else if (key === 'm1_c1') legacyUpdates.formatif6 = numVal;
      else if (key === 'm1_c2') legacyUpdates.formatif7 = numVal;
      else if (key === 'm1_c3') legacyUpdates.formatif8 = numVal;
      else if (key === 'sumatif_tengah') legacyUpdates.sumatifTengah = numVal;
      else if (key === 'sumatif_akhir') legacyUpdates.sumatifAkhir = numVal;

      if (index >= 0) {
        const target = prev[index];
        const nextMonthly = { ...(target.monthlyGrades || {}), [key]: numVal };
        const updated = { ...target, ...legacyUpdates, monthlyGrades: nextMonthly };
        const next = [...prev];
        next[index] = updated;
        return next;
      } else {
        const newGrade: StudentGrade = {
          id: `grd-${studentId}`,
          studentId,
          classId,
          ...legacyUpdates,
          monthlyGrades: { [key]: numVal },
          catatan: '',
        };
        return [...prev, newGrade];
      }
    });

    setHasUnsavedChanges(true);
  };

  // Handler for student evaluation note
  const handleNoteChange = (studentId: string, catatan: string) => {
    setLocalGrades((prev) => {
      const index = prev.findIndex((g) => g.studentId === studentId);
      if (index >= 0) {
        const next = [...prev];
        next[index] = { ...next[index], catatan };
        return next;
      } else {
        return [
          ...prev,
          {
            id: `grd-${studentId}`,
            studentId,
            classId,
            monthlyGrades: {},
            catatan,
          },
        ];
      }
    });
    setHasUnsavedChanges(true);
  };

  // Handler for Asesmen Sumatif Tengah (STS) & Akhir (SAS) input
  const handleSumatifChange = (
    studentId: string,
    field: 'sumatifTengah' | 'sumatifAkhir',
    rawVal: string
  ) => {
    const clean = rawVal.trim();
    let numVal: number | null = null;
    if (clean !== '') {
      const parsed = parseFloat(clean);
      if (!isNaN(parsed)) {
        numVal = Math.max(0, Math.min(100, Math.round(parsed)));
      }
    }

    setLocalGrades((prev) => {
      const index = prev.findIndex((g) => g.studentId === studentId);
      if (index >= 0) {
        const target = prev[index];
        const nextMonthly = {
          ...(target.monthlyGrades || {}),
          [field === 'sumatifTengah' ? 'sumatif_tengah' : 'sumatif_akhir']: numVal,
        };
        const updated = {
          ...target,
          [field]: numVal,
          monthlyGrades: nextMonthly,
        };
        const next = [...prev];
        next[index] = updated;
        return next;
      } else {
        const newGrade: StudentGrade = {
          id: `grd-${studentId}`,
          studentId,
          classId,
          [field]: numVal,
          monthlyGrades: {
            [field === 'sumatifTengah' ? 'sumatif_tengah' : 'sumatif_akhir']: numVal,
          },
          catatan: '',
        };
        return [...prev, newGrade];
      }
    });

    setHasUnsavedChanges(true);
  };

  // Update a single column's header
  const handleUpdateHeader = (
    key: string,
    field: 'tanggal' | 'keterangan' | 'colLabel',
    value: string
  ) => {
    setColumnHeaders((prev) =>
      prev.map((h) => (h.key === key ? { ...h, [field]: value } : h))
    );
    setHasUnsavedChanges(true);
  };

  // Sumatif Tengah (STS) Header helper
  const stsHeader = useMemo(() => {
    return (
      columnHeaders.find((h) => h.key === 'sumatif_tengah') || {
        key: 'sumatif_tengah',
        monthIndex: 98,
        monthName: months[2] || 'Tengah Semester',
        colIndex: 0,
        colLabel: 'Sumatif Tengah (STS)',
        tanggal: '',
        keterangan: 'Asesmen Sumatif Tengah Semester (STS)',
      }
    );
  }, [columnHeaders, months]);

  // Sumatif Akhir (SAS) Header helper
  const sasHeader = useMemo(() => {
    return (
      columnHeaders.find((h) => h.key === 'sumatif_akhir') || {
        key: 'sumatif_akhir',
        monthIndex: 99,
        monthName: months[5] || 'Akhir Semester',
        colIndex: 0,
        colLabel: 'Sumatif Akhir (SAS)',
        tanggal: '',
        keterangan: 'Asesmen Sumatif Akhir Semester (SAS)',
      }
    );
  }, [columnHeaders, months]);

  const handleUpdateSumatifHeader = (
    type: 'sts' | 'sas',
    field: 'tanggal' | 'keterangan' | 'colLabel',
    value: string
  ) => {
    const key = type === 'sts' ? 'sumatif_tengah' : 'sumatif_akhir';
    setColumnHeaders((prev) => {
      const exists = prev.some((h) => h.key === key);
      if (exists) {
        return prev.map((h) => (h.key === key ? { ...h, [field]: value } : h));
      } else {
        const defaultH: GradeColumnHeader = {
          key,
          monthIndex: type === 'sts' ? 98 : 99,
          monthName:
            type === 'sts'
              ? months[2] || 'Tengah Semester'
              : months[5] || 'Akhir Semester',
          colIndex: 0,
          colLabel: type === 'sts' ? 'Sumatif Tengah (STS)' : 'Sumatif Akhir (SAS)',
          tanggal: '',
          keterangan:
            type === 'sts'
              ? 'Asesmen Sumatif Tengah Semester (STS)'
              : 'Asesmen Sumatif Akhir Semester (SAS)',
          [field]: value,
        };
        return [...prev, defaultH];
      }
    });
    setHasUnsavedChanges(true);
  };

  // Quick preset generator for 4 columns in a month
  const applyMonthPresets = (
    mIndex: number,
    presetType: 'formatif_standard' | 'formatif_tp' | 'formatif_variasi'
  ) => {
    const startYear = parseInt(academicYear.split('/')[0]) || 2025;
    const calMonth = safeSemester === 'Ganjil' ? mIndex + 7 : mIndex + 1;
    const calYear = safeSemester === 'Ganjil' ? startYear : startYear + 1;
    const padMonth = String(calMonth).padStart(2, '0');

    setColumnHeaders((prev) =>
      prev.map((h) => {
        if (h.monthIndex !== mIndex) return h;
        const c = h.colIndex;
        const day = String(Math.min(28, 7 * (c + 1))).padStart(2, '0');
        const tanggal = `${calYear}-${padMonth}-${day}`;

        let colLabel = `Formatif ${c + 1}`;
        let keterangan = `Asesmen Formatif ${c + 1}`;

        if (presetType === 'formatif_standard') {
          colLabel = `Formatif ${c + 1}`;
          keterangan = `Asesmen Formatif ${c + 1} (${months[mIndex]})`;
        } else if (presetType === 'formatif_tp') {
          colLabel = `TP ${c + 1}`;
          keterangan = `Tujuan Pembelajaran ${c + 1} (${months[mIndex]})`;
        } else {
          if (c === 0) {
            colLabel = 'Formatif 1';
            keterangan = 'Formatif 1 (Tugas Mandiri/TP 1)';
          } else if (c === 1) {
            colLabel = 'Formatif 2';
            keterangan = 'Formatif 2 (Praktik/Proyek/TP 2)';
          } else if (c === 2) {
            colLabel = 'Formatif 3';
            keterangan = 'Formatif 3 (Kuis Refleksi/TP 3)';
          } else {
            colLabel = 'Formatif 4';
            keterangan = 'Formatif 4 (Tes Formatif/TP 4)';
          }
        }

        return { ...h, colLabel, keterangan, tanggal };
      })
    );
    setHasUnsavedChanges(true);
  };

  // Explicit Save to Cloud Action
  const handleSaveToCloud = async () => {
    setIsSaving(true);
    try {
      await onSaveGrades(localGrades, columnHeaders, { silent: false });
      Storage.setGradeHeaders(classId, columnHeaders);
      setHasUnsavedChanges(false);
      const now = new Date();
      const timeStr = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setLastSavedTime(timeStr);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculations for Class Statistics
  const studentCalculations = useMemo(() => {
    const map = new Map<string, ReturnType<typeof calculateMonthlyStudentGrade>>();
    students.forEach((s) => {
      const g = localGrades.find((item) => item.studentId === s.id);
      const res = calculateMonthlyStudentGrade(g, columnHeaders, kkm);
      map.set(s.id, res);
    });
    return map;
  }, [students, localGrades, columnHeaders, kkm]);

  let totalFinalScore = 0;
  let maxScore = 0;
  let minScore = 100;
  let tuntasCount = 0;
  let belumCount = 0;

  students.forEach((s) => {
    const res = studentCalculations.get(s.id);
    const finalScore = res?.nilaiAkhir || 0;
    totalFinalScore += finalScore;
    if (finalScore > maxScore) maxScore = finalScore;
    if (finalScore < minScore) minScore = finalScore;
    if (res?.isTuntas) tuntasCount++;
    else belumCount++;
  });

  const averageScore =
    students.length > 0 ? Math.round(totalFinalScore / students.length) : 0;
  if (students.length === 0) minScore = 0;

  // Active Month Specific Stats (Formatif)
  const activeMonthStats = useMemo(() => {
    if (typeof activeMonthTab !== 'number') return null;
    const mIdx = activeMonthTab;
    let totalScoreMonth = 0;
    let studentWithGradeCount = 0;

    students.forEach((s) => {
      const calc = studentCalculations.get(s.id);
      const avg = calc?.monthlySummaries[mIdx]?.average;
      if (avg !== null && avg !== undefined) {
        totalScoreMonth += avg;
        studentWithGradeCount++;
      }
    });

    const monthAverage =
      studentWithGradeCount > 0
        ? Math.round(totalScoreMonth / studentWithGradeCount)
        : 0;

    return {
      monthIndex: mIdx,
      monthName: months[mIdx],
      monthAverage,
      gradedStudentsCount: studentWithGradeCount,
      totalStudents: students.length,
    };
  }, [activeMonthTab, students, studentCalculations, months]);

  // Overall Sumatif (STS & SAS) Statistics
  const sumatifStats = useMemo(() => {
    let totalSts = 0;
    let stsCount = 0;
    let totalSas = 0;
    let sasCount = 0;
    let totalFormatif = 0;
    let formatifCount = 0;

    students.forEach((s) => {
      const calc = studentCalculations.get(s.id);
      if (calc?.sumatifTengah !== null && calc?.sumatifTengah !== undefined) {
        totalSts += calc.sumatifTengah;
        stsCount++;
      }
      if (calc?.sumatifAkhir !== null && calc?.sumatifAkhir !== undefined) {
        totalSas += calc.sumatifAkhir;
        sasCount++;
      }
      if (calc?.rataFormatif !== null && calc?.rataFormatif !== undefined) {
        totalFormatif += calc.rataFormatif;
        formatifCount++;
      }
    });

    return {
      avgSts: stsCount > 0 ? Math.round(totalSts / stsCount) : null,
      stsCount,
      avgSas: sasCount > 0 ? Math.round(totalSas / sasCount) : null,
      sasCount,
      avgFormatif: formatifCount > 0 ? Math.round(totalFormatif / formatifCount) : null,
      formatifCount,
      totalStudents: students.length,
    };
  }, [students, studentCalculations]);

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const res = studentCalculations.get(s.id);
      const isTuntas = res?.isTuntas || false;
      const g = localGrades.find((item) => item.studentId === s.id);

      const matchQuery =
        s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nisn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g?.catatan || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchGender = filterGender === 'all' || s.gender === filterGender;

      let matchStatus = true;
      if (filterStatus === 'tuntas') matchStatus = isTuntas;
      else if (filterStatus === 'belum') matchStatus = !isTuntas;

      return matchQuery && matchGender && matchStatus;
    });
  }, [students, searchQuery, filterGender, filterStatus, studentCalculations, localGrades]);

  // 4 Column headers for the active month (when in single-month view)
  const singleMonthHeaders = useMemo(() => {
    if (typeof activeMonthTab !== 'number') return [];
    return columnHeaders.filter((h) => h.monthIndex === activeMonthTab);
  }, [columnHeaders, activeMonthTab]);

  const handleExportExcel = () => {
    exportGradesToExcel(
      className,
      mataPelajaran,
      kkm,
      students,
      localGrades,
      columnHeaders
    );
  };

  // Helper to format date string YYYY-MM-DD into DD/MM
  const formatDateShort = (dateStr?: string) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return dateStr;
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Main Actions */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                {className}
              </span>
              <span className="text-xs font-extrabold text-slate-800">
                {mataPelajaran}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-500">
                Semester {safeSemester} ({academicYear})
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-500">
                KKM: <strong className="text-slate-900">{kkm}</strong>
              </span>
              {onOpenEditClass && (
                <button
                  type="button"
                  onClick={onOpenEditClass}
                  title={`Edit data kelas atau mapel (${className})`}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-2 py-0.5 rounded-md transition-colors cursor-pointer shadow-2xs ml-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit Kelas</span>
                </button>
              )}
            </div>

            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Buku Nilai (Formatif & Sumatif)</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                Kurikulum Merdeka
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Asesmen Formatif per bulan (4 formatif/bulan) • Asesmen Sumatif Tengah Semester (STS) • Asesmen Sumatif Akhir Semester (SAS).
            </p>
          </div>

          {/* Action Buttons: Cloud Save & Export */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleSaveToCloud}
              disabled={isSaving}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer ${
                hasUnsavedChanges
                  ? 'bg-amber-600 hover:bg-amber-700 text-white ring-4 ring-amber-100 shadow-md animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Simpan perubahan nilai dan keterangan kolom ke Cloud Firestore"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan ke Cloud...</span>
                </>
              ) : (
                <>
                  <CloudUpload className="w-4 h-4" />
                  <span>Simpan Penilaian ke Cloud</span>
                </>
              )}
            </button>

            {isAutoSyncing && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold">
                <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>Sinkronisasi otomatis...</span>
              </span>
            )}

            {!isAutoSyncing && lastSavedTime && !hasUnsavedChanges && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tersimpan di Cloud ({lastSavedTime})</span>
              </span>
            )}

            {!isAutoSyncing && hasUnsavedChanges && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Ada perubahan belum tersimpan</span>
              </span>
            )}

            <button
              type="button"
              onClick={() => {
                if (hasUnsavedChanges) {
                  onSaveGrades(localGrades, columnHeaders, { silent: true });
                  Storage.setGradeHeaders(classId, columnHeaders);
                  setHasUnsavedChanges(false);
                }
                setShowPublicShareModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer"
              title="Buat & bagikan tautan pratinjau nilai & rekapitulasi nilai untuk siswa & orang tua"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-200" />
              <span>Bagikan Link Nilai Siswa</span>
            </button>

            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              title="Unggah / Import nilai formatif dan sumatif dari file Excel atau salinan spreadsheet"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Import Nilai Excel</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              title="Export seluruh rekap penilaian formatif dan sumatif ke format Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Cloud Status Alert */}
        <div className="mt-3 flex items-center justify-between flex-wrap gap-2 text-xs">
          {hasUnsavedChanges ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Ada perubahan nilai formatif/sumatif yang belum disimpan. Tekan tombol Simpan!</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200/90 font-medium">
              <Check className="w-4 h-4 text-emerald-600 font-bold" />
              <span>Data penilaian tersimpan aman di Cloud Firestore.</span>
              {lastSavedTime && (
                <span className="text-slate-400 text-[11px] ml-1">
                  (Terakhir disimpan pukul {lastSavedTime})
                </span>
              )}
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              setEditingMonthIndex(typeof activeMonthTab === 'number' ? activeMonthTab : 0);
              setModalTab(activeMonthTab === 'sumatif' ? 'sumatif' : 'formatif');
              setIsHeaderModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-extrabold transition-colors cursor-pointer border border-slate-200"
            title="Buka dialog pengaturan tanggal dan materi penilaian formatif & sumatif"
          >
            <Settings2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Atur Tanggal & Materi Penilaian</span>
          </button>
        </div>
      </div>

      {/* IMMERSIVE TAB SELECTOR & NAVIGATOR (FORMATIF & SUMATIF) */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Month & Assessment Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {/* Formatif Months 1..6 */}
            {months.map((mName, idx) => {
              const isActive = activeMonthTab === idx;
              const isStsMonth = idx === 2; // Bulan 3: Tengah Semester
              const isSasMonth = idx === 5; // Bulan 6: Akhir Semester

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveMonthTab(idx)}
                  className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1.5 border ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-200'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <CalendarDays className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-200' : 'text-slate-400'}`} />
                  <span>{mName}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? 'bg-indigo-800 text-white'
                        : 'bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    4 Formatif
                  </span>
                  {isStsMonth && (
                    <span
                      title="Bulan ini merupakan periode Tengah Semester (STS)"
                      className={`text-[9px] px-1 py-0.2 rounded font-extrabold ${
                        isActive
                          ? 'bg-amber-400 text-amber-950'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      STS
                    </span>
                  )}
                  {isSasMonth && (
                    <span
                      title="Bulan ini merupakan periode Akhir Semester (SAS)"
                      className={`text-[9px] px-1 py-0.2 rounded font-extrabold ${
                        isActive
                          ? 'bg-emerald-300 text-emerald-950'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      SAS
                    </span>
                  )}
                </button>
              );
            })}

            {/* Separator */}
            <div className="w-px h-6 bg-slate-200 mx-1 shrink-0" />

            {/* Dedicated Sumatif (STS & SAS) Tab */}
            <button
              type="button"
              onClick={() => setActiveMonthTab('sumatif')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-2 border ${
                activeMonthTab === 'sumatif'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-200'
                  : 'bg-amber-50/80 hover:bg-amber-100 text-amber-900 border-amber-300/80'
              }`}
            >
              <Award className={`w-3.5 h-3.5 ${activeMonthTab === 'sumatif' ? 'text-amber-100' : 'text-amber-600'}`} />
              <span>Asesmen Sumatif (STS & SAS)</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeMonthTab === 'sumatif'
                    ? 'bg-amber-800 text-white'
                    : 'bg-amber-200 text-amber-900'
                }`}
              >
                2 Ujian
              </span>
            </button>

            {/* Rekap Semua Bulan Button */}
            <button
              type="button"
              onClick={() => setActiveMonthTab('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1.5 border ${
                activeMonthTab === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-slate-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Rekap Semua (Formatif + Sumatif)</span>
            </button>
          </div>

          {/* Quick Step Buttons for Prev / Next Month */}
          {typeof activeMonthTab === 'number' && (
            <div className="flex items-center gap-1.5 shrink-0 self-end md:self-auto">
              <button
                type="button"
                disabled={activeMonthTab === 0}
                onClick={() => setActiveMonthTab((prev) => (typeof prev === 'number' && prev > 0 ? prev - 1 : 0))}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-extrabold text-slate-700 px-1">
                Bulan {activeMonthTab + 1} dari 6
              </span>
              <button
                type="button"
                disabled={activeMonthTab === 5}
                onClick={() => setActiveMonthTab((prev) => (typeof prev === 'number' && prev < 5 ? prev + 1 : 5))}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Immersive Highlights Panel based on Tab */}
        {activeMonthStats ? (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="inline-flex items-center gap-1.5 bg-indigo-50/80 px-3 py-1 rounded-lg border border-indigo-100 font-bold text-indigo-900">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Asesmen Formatif: Bulan {activeMonthStats.monthName} (4 Formatif)</span>
              </div>
              <div className="text-slate-600 font-medium">
                Rata-rata Formatif Bulan Ini:{' '}
                <strong className="text-slate-900 font-black">
                  {activeMonthStats.monthAverage > 0 ? activeMonthStats.monthAverage : '-'}
                </strong>
              </div>
              <div className="text-slate-600 font-medium">
                Siswa Ternilai:{' '}
                <strong className="text-slate-900 font-black">
                  {activeMonthStats.gradedStudentsCount} / {activeMonthStats.totalStudents}
                </strong>
              </div>
              {activeMonthStats.monthIndex === 2 && (
                <div className="inline-flex items-center gap-1 text-[11px] bg-amber-50 text-amber-900 border border-amber-300/80 px-2 py-0.5 rounded-md font-bold">
                  <BookOpen className="w-3 h-3 text-amber-600" />
                  <span>Periode Tengah Semester • Nilai STS dapat diisi di kolom STS</span>
                </div>
              )}
              {activeMonthStats.monthIndex === 5 && (
                <div className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-900 border border-emerald-300/80 px-2 py-0.5 rounded-md font-bold">
                  <GraduationCap className="w-3 h-3 text-emerald-600" />
                  <span>Periode Akhir Semester • Nilai SAS dapat diisi di kolom SAS</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (typeof activeMonthTab === 'number') {
                    setEditingMonthIndex(activeMonthTab);
                    setModalTab('formatif');
                    setIsHeaderModalOpen(true);
                  }
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-indigo-200"
              >
                <Edit3 className="w-3 h-3" />
                <span>Ubah Tanggal & Materi Formatif Bulan Ini</span>
              </button>
            </div>
          </div>
        ) : activeMonthTab === 'sumatif' ? (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <Award className="w-4 h-4 text-amber-600" />
                <span>
                  Fokus Asesmen Sumatif: Sumatif Tengah Semester (STS) & Sumatif Akhir Semester (SAS)
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalTab('sumatif');
                  setIsHeaderModalOpen(true);
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-amber-300"
              >
                <Edit3 className="w-3 h-3 text-amber-700" />
                <span>Atur Tanggal & Materi STS & SAS</span>
              </button>
            </div>

            {/* 3 Overview Information Cards for Sumatif */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {/* Card 1: STS */}
              <div className="p-3 bg-gradient-to-br from-amber-50/90 to-amber-100/40 rounded-xl border border-amber-200/90">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                    <span>Sumatif Tengah Semester (STS)</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-amber-800 border border-amber-200">
                    Bobot 25%
                  </span>
                </div>
                <div className="text-[11px] text-amber-900/80 mb-2">
                  <div className="font-semibold truncate">
                    Materi: {stsHeader.keterangan || 'Lingkup materi tengah semester'}
                  </div>
                  <div className="font-mono text-[10px] text-amber-700">
                    Tgl: {stsHeader.tanggal ? formatDateShort(stsHeader.tanggal) : 'Belum diatur'} ({stsHeader.monthName})
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-amber-200/70 font-semibold text-amber-950">
                  <span>Rata-rata Kelas: <strong className="font-black font-mono">{sumatifStats.avgSts ?? '-'}</strong></span>
                  <span>Ternilai: <strong>{sumatifStats.stsCount} / {sumatifStats.totalStudents}</strong></span>
                </div>
              </div>

              {/* Card 2: SAS */}
              <div className="p-3 bg-gradient-to-br from-emerald-50/90 to-emerald-100/40 rounded-xl border border-emerald-200/90">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Sumatif Akhir Semester (SAS)</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-emerald-800 border border-emerald-200">
                    Bobot 25%
                  </span>
                </div>
                <div className="text-[11px] text-emerald-900/80 mb-2">
                  <div className="font-semibold truncate">
                    Materi: {sasHeader.keterangan || 'Lingkup materi akhir semester'}
                  </div>
                  <div className="font-mono text-[10px] text-emerald-700">
                    Tgl: {sasHeader.tanggal ? formatDateShort(sasHeader.tanggal) : 'Belum diatur'} ({sasHeader.monthName})
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-emerald-200/70 font-semibold text-emerald-950">
                  <span>Rata-rata Kelas: <strong className="font-black font-mono">{sumatifStats.avgSas ?? '-'}</strong></span>
                  <span>Ternilai: <strong>{sumatifStats.sasCount} / {sumatifStats.totalStudents}</strong></span>
                </div>
              </div>

              {/* Card 3: Formula Kurikulum Merdeka */}
              <div className="p-3 bg-gradient-to-br from-indigo-50/90 to-indigo-100/40 rounded-xl border border-indigo-200/90">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-700" />
                    <span>Formula Nilai Akhir (NA)</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-indigo-800 border border-indigo-200">
                    Rapor 100%
                  </span>
                </div>
                <div className="text-[11px] text-indigo-900/90 font-medium mb-2">
                  <strong>50%</strong> Rata Formatif + <strong>25%</strong> STS + <strong>25%</strong> SAS
                </div>
                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-indigo-200/70 font-semibold text-indigo-950">
                  <span>Rata-rata NA: <strong className="font-black font-mono">{averageScore}</strong></span>
                  <span>Tuntas (≥{kkm}): <strong className="text-emerald-700 font-bold">{tuntasCount} siswa</strong></span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
            <span className="font-semibold">
              Mode Rekap Lengkap: Menampilkan seluruh 24 Asesmen Formatif (6 bulan), rata-rata bulanan, serta Asesmen Sumatif (STS & SAS).
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              Total 24 Formatif + 2 Sumatif Semester {safeSemester}
            </span>
          </div>
        )}
      </div>

      {/* Toolbar: Search, Filters, & Quick Edit */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="relative min-w-[200px] sm:min-w-[240px] grow sm:grow-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama siswa atau catatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50/60"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 ml-auto">
          {/* Filter Ketuntasan */}
          <div className="inline-flex rounded-xl border border-slate-200 p-0.5 bg-slate-100 text-xs">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
                filterStatus === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('tuntas')}
              className={`px-2.5 py-1.5 rounded-lg font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                filterStatus === 'tuntas'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <span>Tuntas ({tuntasCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('belum')}
              className={`px-2.5 py-1.5 rounded-lg font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                filterStatus === 'belum'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <span>Remedial ({belumCount})</span>
            </button>
          </div>

          {/* Gender Filter */}
          <div className="inline-flex rounded-xl border border-slate-200 p-0.5 bg-slate-100 text-xs">
            <button
              type="button"
              onClick={() => setFilterGender('all')}
              className={`px-2.5 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
                filterGender === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setFilterGender('L')}
              className={`px-2.5 py-1.5 rounded-lg font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                filterGender === 'L'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-blue-700 hover:bg-blue-50'
              }`}
            >
              <span>♂ L</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterGender('P')}
              className={`px-2.5 py-1.5 rounded-lg font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                filterGender === 'P'
                  ? 'bg-pink-600 text-white shadow-2xs'
                  : 'text-pink-700 hover:bg-pink-50'
              }`}
            >
              <span>♀ P</span>
            </button>
          </div>

          {/* Quick Edit Student Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsQuickEditMode(!isQuickEditMode)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
              isQuickEditMode
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
            }`}
            title="Aktifkan mode edit cepat nama siswa langsung di tabel"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isQuickEditMode ? 'Tutup Edit Cepat' : 'Edit Cepat Siswa'}</span>
          </button>
        </div>
      </div>

      {/* SPREADSHEET TABLE: 3 DEDICATED, NON-COLLIDING MODES */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          {typeof activeMonthTab === 'number' ? (
            /* ========================================================================= */
            /* MODE 1: FOCUSED SINGLE MONTH VIEW (4 FORMATIF COLUMNS + SUMATIF OVERVIEW) */
            /* ========================================================================= */
            <table className="w-full text-xs text-left border-collapse min-w-[980px]">
              <thead className="bg-slate-100/95 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 sticky top-0 z-20">
                {/* Row 1: Month Group Banner */}
                <tr>
                  <th
                    rowSpan={2}
                    className="sticky left-0 bg-slate-100 z-30 py-3 px-3 w-12 text-center border-r border-slate-200"
                  >
                    No
                  </th>
                  <th
                    rowSpan={2}
                    className="sticky left-12 bg-slate-100 z-30 py-3 px-4 min-w-[200px] border-r border-slate-200 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)]"
                  >
                    Nama Siswa
                  </th>
                  <th
                    rowSpan={2}
                    className="py-3 px-2 w-12 text-center border-r border-slate-200"
                  >
                    L/P
                  </th>

                  {/* 4 Formatif Columns Header Group for Active Month */}
                  <th
                    colSpan={4}
                    className="py-2.5 px-3 text-center border-r border-indigo-200 bg-indigo-50/90 text-indigo-950 font-black border-b"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <CalendarDays className="w-4 h-4 text-indigo-600" />
                      <span>ASESMEN FORMATIF - BULAN {months[activeMonthTab].toUpperCase()} (4 FORMATIF)</span>
                    </div>
                  </th>

                  {/* Month Formatif Average */}
                  <th
                    rowSpan={2}
                    className="py-3 px-2.5 w-18 text-center border-r border-slate-200 bg-indigo-100/70 text-indigo-950 font-black"
                  >
                    <span className="block text-[10px] uppercase text-indigo-700">Rata Formatif</span>
                    <span className="text-xs">{months[activeMonthTab]}</span>
                  </th>

                  {/* Semester Results & Sumatif Group */}
                  <th
                    colSpan={6}
                    className="py-2 px-3 text-center border-r border-emerald-200 bg-emerald-50/90 text-emerald-950 font-black border-b"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-emerald-700" />
                      <span>HASIL RAPOR (KURIKULUM MERDEKA)</span>
                    </div>
                  </th>

                  {/* Notes */}
                  <th rowSpan={2} className="py-3 px-4 min-w-[180px]">
                    Catatan / Evaluasi Siswa
                  </th>
                </tr>

                {/* Row 2: Detailed Subheaders for Formatif & Sumatif */}
                <tr className="bg-slate-50 text-slate-700">
                  {singleMonthHeaders.map((header, cIdx) => (
                    <th
                      key={header.key}
                      className="p-2 w-28 border-r border-slate-200 text-center align-top bg-amber-50/50 hover:bg-amber-100/40 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-black text-indigo-950">
                          {header.colLabel || `Formatif ${cIdx + 1}`}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                          {formatDateShort(header.tanggal)}
                        </span>
                      </div>
                      <div
                        className="text-[10px] font-semibold text-slate-600 truncate max-w-[100px] mx-auto"
                        title={header.keterangan || 'Asesmen Formatif'}
                      >
                        {header.keterangan || `Formatif ${cIdx + 1}`}
                      </div>
                    </th>
                  ))}

                  {/* Formatif Semester Average */}
                  <th
                    className="py-1.5 px-1.5 w-16 text-center border-r border-slate-200 bg-indigo-50 font-black text-indigo-950 text-[10px]"
                    title="Rata-rata seluruh asesmen formatif semester (Bobot 50%)"
                  >
                    <span className="block">R.Form</span>
                    <span className="text-[8px] font-normal text-indigo-600">(50%)</span>
                  </th>

                  {/* Sumatif Tengah (STS) */}
                  <th
                    className={`py-1.5 px-1.5 w-16 text-center border-r border-slate-200 font-black text-[10px] ${
                      activeMonthTab === 2
                        ? 'bg-amber-200/80 text-amber-950 ring-1 ring-amber-400'
                        : 'bg-amber-50 text-amber-950'
                    }`}
                    title="Asesmen Sumatif Tengah Semester (Bobot 25%)"
                  >
                    <span className="block">STS</span>
                    <span className="text-[8px] font-normal text-amber-800">(25%)</span>
                  </th>

                  {/* Sumatif Akhir (SAS) */}
                  <th
                    className={`py-1.5 px-1.5 w-16 text-center border-r border-slate-200 font-black text-[10px] ${
                      activeMonthTab === 5
                        ? 'bg-emerald-200/80 text-emerald-950 ring-1 ring-emerald-400'
                        : 'bg-emerald-50 text-emerald-950'
                    }`}
                    title="Asesmen Sumatif Akhir Semester (Bobot 25%)"
                  >
                    <span className="block">SAS</span>
                    <span className="text-[8px] font-normal text-emerald-800">(25%)</span>
                  </th>

                  {/* Final Results Subheaders */}
                  <th
                    className="py-1.5 px-1.5 w-14 text-center border-r border-slate-200 bg-emerald-100/80 text-emerald-950 font-black text-[10px]"
                    title="Nilai Akhir Rapor: 50% Formatif + 25% STS + 25% SAS"
                  >
                    NA
                  </th>
                  <th className="py-1.5 px-1 w-12 text-center border-r border-slate-200 bg-emerald-50 text-slate-700 font-bold text-[10px]">
                    Grade
                  </th>
                  <th className="py-1.5 px-1.5 w-18 text-center border-r border-slate-200 bg-emerald-50 text-slate-700 font-bold text-[10px]">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={15}
                      className="text-center py-12 text-slate-400 font-medium"
                    >
                      Tidak ada siswa yang cocok dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => {
                    const g = getStudentGrade(student.id);
                    const calc = studentCalculations.get(student.id);
                    const currentMonthAvg =
                      typeof activeMonthTab === 'number'
                        ? calc?.monthlySummaries[activeMonthTab]?.average
                        : null;

                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-indigo-50/30 transition-colors group"
                      >
                        {/* No */}
                        <td className="sticky left-0 bg-white group-hover:bg-indigo-50/50 z-10 py-2.5 px-3 text-center font-medium text-slate-500 border-r border-slate-200">
                          {student.no}
                        </td>

                        {/* Nama Siswa */}
                        <td className="sticky left-12 bg-white group-hover:bg-indigo-50/50 z-10 py-2.5 px-4 font-bold text-slate-900 border-r border-slate-200 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)]">
                          {isQuickEditMode ? (
                            <input
                              type="text"
                              value={student.nama || ''}
                              onChange={(e) =>
                                onUpdateStudentField?.(student.id, 'nama', e.target.value)
                              }
                              placeholder="Nama Siswa..."
                              className="w-full font-bold text-xs px-2 py-1 border border-amber-300 rounded bg-amber-50/50 text-slate-900 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                            />
                          ) : (
                            <div
                              onDoubleClick={() => onEditStudent?.(student)}
                              className="cursor-pointer hover:text-indigo-600 transition-colors"
                              title="Klik dua kali atau tombol Edit Siswa untuk mengubah biodata"
                            >
                              {student.nama}
                            </div>
                          )}
                          <div className="text-[10px] text-slate-400 font-mono font-normal">
                            NISN: {student.nisn || '-'}
                          </div>
                        </td>

                        {/* L/P */}
                        <td className="py-2.5 px-2 text-center border-r border-slate-200">
                          <span
                            title={`Jenis Kelamin: ${
                              student.gender === 'L' ? 'Laki-laki' : 'Perempuan'
                            } • Hanya dapat diubah pada menu Data Siswa`}
                            className={`w-6 h-6 rounded-md font-extrabold text-xs inline-flex items-center justify-center select-none ${
                              student.gender === 'L'
                                ? 'text-blue-700 bg-blue-50 border border-blue-200'
                                : 'text-pink-700 bg-pink-50 border border-pink-200'
                            }`}
                          >
                            {student.gender}
                          </span>
                        </td>

                        {/* 4 Formatif Score Inputs */}
                        {singleMonthHeaders.map((header) => {
                          let scoreVal = g.monthlyGrades?.[header.key] ?? null;

                          // Fallback backward compatibility from formatif / tugas
                          if (scoreVal === null || scoreVal === undefined) {
                            if (header.monthIndex === 0) {
                              if (header.colIndex === 0) scoreVal = g.formatif1 ?? g.tugas1 ?? null;
                              else if (header.colIndex === 1) scoreVal = g.formatif2 ?? g.tugas2 ?? null;
                              else if (header.colIndex === 2) scoreVal = g.formatif3 ?? g.tugas3 ?? null;
                              else if (header.colIndex === 3) scoreVal = g.formatif4 ?? g.praktik ?? null;
                            } else if (header.monthIndex === 1) {
                              if (header.colIndex === 0) scoreVal = g.formatif5 ?? null;
                              else if (header.colIndex === 1) scoreVal = g.formatif6 ?? null;
                              else if (header.colIndex === 2) scoreVal = g.formatif7 ?? null;
                              else if (header.colIndex === 3) scoreVal = g.formatif8 ?? null;
                            }
                          }

                          const isUnderKkm =
                            scoreVal !== null &&
                            scoreVal !== undefined &&
                            !isNaN(scoreVal) &&
                            scoreVal < kkm;

                          return (
                            <td
                              key={header.key}
                              className="p-1.5 text-center border-r border-slate-200 bg-amber-50/15"
                            >
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={
                                  scoreVal !== null && scoreVal !== undefined ? scoreVal : ''
                                }
                                onChange={(e) =>
                                  handleScoreChange(student.id, header.key, e.target.value)
                                }
                                placeholder="-"
                                title={`${header.monthName} - ${header.colLabel}: ${header.keterangan}`}
                                className={`w-16 text-center font-bold text-xs py-1.5 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all ${
                                  isUnderKkm
                                    ? 'bg-rose-50 border-rose-300 text-rose-700 font-black'
                                    : scoreVal !== null
                                    ? 'bg-white border-slate-300 text-slate-900 font-black shadow-2xs'
                                    : 'bg-white/80 border-slate-200 text-slate-400 hover:bg-white'
                                }`}
                              />
                            </td>
                          );
                        })}

                        {/* Active Month Average */}
                        <td className="py-2.5 px-2 text-center font-black font-mono text-xs border-r border-slate-200 bg-indigo-50/60 text-indigo-950">
                          {currentMonthAvg !== null && currentMonthAvg !== undefined ? (
                            <span
                              className={`px-2 py-1 rounded-md text-xs font-black ${
                                currentMonthAvg >= kkm
                                  ? 'bg-indigo-100 text-indigo-900'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {currentMonthAvg}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* Rata Formatif Semester (50%) */}
                        <td className="py-2.5 px-1.5 text-center font-black font-mono text-xs border-r border-slate-200 bg-indigo-50/30 text-indigo-900">
                          {calc?.rataFormatif !== null && calc?.rataFormatif !== undefined ? (
                            <span>{calc.rataFormatif}</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* Sumatif Tengah Semester (STS) */}
                        <td
                          className={`p-1 text-center border-r border-slate-200 ${
                            activeMonthTab === 2 ? 'bg-amber-100/40' : 'bg-amber-50/20'
                          }`}
                        >
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={
                              calc?.sumatifTengah !== null && calc?.sumatifTengah !== undefined
                                ? calc.sumatifTengah
                                : ''
                            }
                            onChange={(e) =>
                              handleSumatifChange(student.id, 'sumatifTengah', e.target.value)
                            }
                            placeholder="-"
                            title="Asesmen Sumatif Tengah Semester (STS)"
                            className={`w-14 text-center font-bold text-xs py-1 rounded border focus:ring-1 focus:ring-amber-500 focus:outline-none ${
                              calc?.sumatifTengah !== null && calc?.sumatifTengah !== undefined
                                ? calc.sumatifTengah < kkm
                                  ? 'bg-rose-50 border-rose-300 text-rose-700 font-black'
                                  : 'bg-white border-amber-300 text-amber-950 font-black'
                                : 'bg-white/80 border-slate-200 text-slate-400'
                            }`}
                          />
                        </td>

                        {/* Sumatif Akhir Semester (SAS) */}
                        <td
                          className={`p-1 text-center border-r border-slate-200 ${
                            activeMonthTab === 5 ? 'bg-emerald-100/40' : 'bg-emerald-50/20'
                          }`}
                        >
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={
                              calc?.sumatifAkhir !== null && calc?.sumatifAkhir !== undefined
                                ? calc.sumatifAkhir
                                : ''
                            }
                            onChange={(e) =>
                              handleSumatifChange(student.id, 'sumatifAkhir', e.target.value)
                            }
                            placeholder="-"
                            title="Asesmen Sumatif Akhir Semester (SAS)"
                            className={`w-14 text-center font-bold text-xs py-1 rounded border focus:ring-1 focus:ring-emerald-500 focus:outline-none ${
                              calc?.sumatifAkhir !== null && calc?.sumatifAkhir !== undefined
                                ? calc.sumatifAkhir < kkm
                                  ? 'bg-rose-50 border-rose-300 text-rose-700 font-black'
                                  : 'bg-white border-emerald-300 text-emerald-950 font-black'
                                : 'bg-white/80 border-slate-200 text-slate-400'
                            }`}
                          />
                        </td>

                        {/* Final NA */}
                        <td className="py-2.5 px-2 text-center font-black font-mono text-xs border-r border-slate-200 bg-emerald-50/50 text-slate-900">
                          {calc?.nilaiAkhir || 0}
                        </td>

                        {/* Predikat */}
                        <td className="py-2.5 px-1.5 text-center font-extrabold text-xs border-r border-slate-200">
                          <span
                            className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-black text-xs ${
                              calc?.predikat === 'A'
                                ? 'bg-emerald-100 text-emerald-800'
                                : calc?.predikat === 'B'
                                ? 'bg-blue-100 text-blue-800'
                                : calc?.predikat === 'C'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {calc?.predikat || 'D'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-1.5 text-center border-r border-slate-200">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              calc?.isTuntas
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            {calc?.isTuntas ? 'Tuntas' : 'Remedial'}
                          </span>
                        </td>

                        {/* Notes */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={g.catatan || ''}
                            onChange={(e) => handleNoteChange(student.id, e.target.value)}
                            placeholder="Catatan perkembangan..."
                            className="w-full text-xs px-2.5 py-1 border border-slate-200 rounded-lg bg-slate-50/60 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : activeMonthTab === 'sumatif' ? (
            /* ========================================================================= */
            /* MODE 2: DEDICATED ASESMEN SUMATIF VIEW (STS & SAS WITH FORMULA BREAKDOWN) */
            /* ========================================================================= */
            <table className="w-full text-xs text-left border-collapse min-w-[900px]">
              <thead className="bg-slate-100/95 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 sticky top-0 z-20">
                <tr>
                  <th
                    rowSpan={2}
                    className="sticky left-0 bg-slate-100 z-30 py-3 px-3 w-12 text-center border-r border-slate-200"
                  >
                    No
                  </th>
                  <th
                    rowSpan={2}
                    className="sticky left-12 bg-slate-100 z-30 py-3 px-4 min-w-[220px] border-r border-slate-200 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)]"
                  >
                    Nama Siswa
                  </th>
                  <th
                    rowSpan={2}
                    className="py-3 px-2 w-12 text-center border-r border-slate-200"
                  >
                    L/P
                  </th>

                  {/* Asesmen Formatif Column */}
                  <th
                    className="py-2 px-3 text-center border-r border-indigo-200 bg-indigo-50/90 text-indigo-950 font-black"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
                      <span>RATA-RATA FORMATIF</span>
                    </div>
                  </th>

                  {/* Asesmen Sumatif Tengah (STS) */}
                  <th
                    className="py-2 px-3 text-center border-r border-amber-200 bg-amber-100/80 text-amber-950 font-black"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                      <span>SUMATIF TENGAH SEMESTER (STS)</span>
                    </div>
                  </th>

                  {/* Asesmen Sumatif Akhir (SAS) */}
                  <th
                    className="py-2 px-3 text-center border-r border-emerald-200 bg-emerald-100/80 text-emerald-950 font-black"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
                      <span>SUMATIF AKHIR SEMESTER (SAS)</span>
                    </div>
                  </th>

                  {/* Hasil Rapor */}
                  <th
                    colSpan={3}
                    className="py-2 px-3 text-center border-r border-indigo-200 bg-indigo-50 text-indigo-950 font-black border-b"
                  >
                    HASIL AKHIR RAPOR
                  </th>

                  {/* Notes */}
                  <th rowSpan={2} className="py-3 px-4 min-w-[180px]">
                    Catatan / Evaluasi Siswa
                  </th>
                </tr>

                {/* Subheaders with Weightings & Dates */}
                <tr className="bg-slate-50 text-slate-700 text-[10px]">
                  {/* Formatif Subheader */}
                  <th className="p-2 w-32 border-r border-slate-200 text-center bg-indigo-50/50">
                    <div className="font-extrabold text-indigo-950">Bobot 50%</div>
                    <div className="text-[9px] text-slate-500 font-normal">Rata 6 Bulan (24 Formatif)</div>
                  </th>

                  {/* STS Subheader */}
                  <th className="p-2 w-36 border-r border-slate-200 text-center bg-amber-50/70">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-black text-amber-950">Bobot 25%</span>
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-white text-slate-600 border border-slate-200">
                        {stsHeader.tanggal ? formatDateShort(stsHeader.tanggal) : '-'}
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-500 truncate" title={stsHeader.keterangan}>
                      {stsHeader.keterangan || 'Materi STS'}
                    </div>
                  </th>

                  {/* SAS Subheader */}
                  <th className="p-2 w-36 border-r border-slate-200 text-center bg-emerald-50/70">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-black text-emerald-950">Bobot 25%</span>
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-white text-slate-600 border border-slate-200">
                        {sasHeader.tanggal ? formatDateShort(sasHeader.tanggal) : '-'}
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-500 truncate" title={sasHeader.keterangan}>
                      {sasHeader.keterangan || 'Materi SAS'}
                    </div>
                  </th>

                  {/* NA, Grade, Status Subheaders */}
                  <th className="py-1.5 px-2 w-16 text-center border-r border-slate-200 bg-emerald-100/80 font-black text-emerald-950">
                    NA
                  </th>
                  <th className="py-1.5 px-1.5 w-12 text-center border-r border-slate-200 bg-emerald-50 font-bold text-slate-700">
                    Grade
                  </th>
                  <th className="py-1.5 px-2 w-20 text-center border-r border-slate-200 bg-emerald-50 font-bold text-slate-700">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="text-center py-12 text-slate-400 font-medium"
                    >
                      Tidak ada siswa yang cocok dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => {
                    const g = getStudentGrade(student.id);
                    const calc = studentCalculations.get(student.id);

                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-amber-50/30 transition-colors group"
                      >
                        {/* No */}
                        <td className="sticky left-0 bg-white group-hover:bg-amber-50/50 z-10 py-2.5 px-3 text-center font-medium text-slate-500 border-r border-slate-200">
                          {student.no}
                        </td>

                        {/* Nama Siswa */}
                        <td className="sticky left-12 bg-white group-hover:bg-amber-50/50 z-10 py-2.5 px-4 font-bold text-slate-900 border-r border-slate-200 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)]">
                          {isQuickEditMode ? (
                            <input
                              type="text"
                              value={student.nama || ''}
                              onChange={(e) =>
                                onUpdateStudentField?.(student.id, 'nama', e.target.value)
                              }
                              placeholder="Nama Siswa..."
                              className="w-full font-bold text-xs px-2 py-1 border border-amber-300 rounded bg-amber-50/50 text-slate-900 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                            />
                          ) : (
                            <div
                              onDoubleClick={() => onEditStudent?.(student)}
                              className="cursor-pointer hover:text-indigo-600 transition-colors"
                            >
                              {student.nama}
                            </div>
                          )}
                          <div className="text-[10px] text-slate-400 font-mono font-normal">
                            NISN: {student.nisn || '-'}
                          </div>
                        </td>

                        {/* L/P */}
                        <td className="py-2.5 px-2 text-center border-r border-slate-200">
                          <span
                            className={`w-6 h-6 rounded-md font-extrabold text-xs inline-flex items-center justify-center ${
                              student.gender === 'L'
                                ? 'text-blue-700 bg-blue-50 border border-blue-200'
                                : 'text-pink-700 bg-pink-50 border border-pink-200'
                            }`}
                          >
                            {student.gender}
                          </span>
                        </td>

                        {/* Rata Formatif (50%) */}
                        <td className="py-2.5 px-2 text-center font-black font-mono text-xs border-r border-slate-200 bg-indigo-50/40 text-indigo-950">
                          {calc?.rataFormatif !== null && calc?.rataFormatif !== undefined ? (
                            <span
                              className={`px-2 py-1 rounded-md text-xs font-black ${
                                calc.rataFormatif >= kkm
                                  ? 'bg-indigo-100 text-indigo-900'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {calc.rataFormatif}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* Asesmen Sumatif Tengah (STS) (25%) */}
                        <td className="p-2 text-center border-r border-slate-200 bg-amber-50/30">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={
                              calc?.sumatifTengah !== null && calc?.sumatifTengah !== undefined
                                ? calc.sumatifTengah
                                : ''
                            }
                            onChange={(e) =>
                              handleSumatifChange(student.id, 'sumatifTengah', e.target.value)
                            }
                            placeholder="-"
                            title="Masukkan Nilai Sumatif Tengah Semester (STS)"
                            className={`w-20 text-center font-black text-xs py-1.5 rounded-lg border focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all ${
                              calc?.sumatifTengah !== null && calc?.sumatifTengah !== undefined
                                ? calc.sumatifTengah < kkm
                                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                                  : 'bg-white border-amber-300 text-amber-950 shadow-2xs'
                                : 'bg-white/80 border-slate-200 text-slate-400 hover:bg-white'
                            }`}
                          />
                        </td>

                        {/* Asesmen Sumatif Akhir (SAS) (25%) */}
                        <td className="p-2 text-center border-r border-slate-200 bg-emerald-50/30">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={
                              calc?.sumatifAkhir !== null && calc?.sumatifAkhir !== undefined
                                ? calc.sumatifAkhir
                                : ''
                            }
                            onChange={(e) =>
                              handleSumatifChange(student.id, 'sumatifAkhir', e.target.value)
                            }
                            placeholder="-"
                            title="Masukkan Nilai Sumatif Akhir Semester (SAS)"
                            className={`w-20 text-center font-black text-xs py-1.5 rounded-lg border focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all ${
                              calc?.sumatifAkhir !== null && calc?.sumatifAkhir !== undefined
                                ? calc.sumatifAkhir < kkm
                                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                                  : 'bg-white border-emerald-300 text-emerald-950 shadow-2xs'
                                : 'bg-white/80 border-slate-200 text-slate-400 hover:bg-white'
                            }`}
                          />
                        </td>

                        {/* Final NA */}
                        <td className="py-2.5 px-2 text-center font-black font-mono text-sm border-r border-slate-200 bg-emerald-50/60 text-slate-900">
                          {calc?.nilaiAkhir || 0}
                        </td>

                        {/* Predikat */}
                        <td className="py-2.5 px-1.5 text-center font-extrabold text-xs border-r border-slate-200">
                          <span
                            className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-black text-xs ${
                              calc?.predikat === 'A'
                                ? 'bg-emerald-100 text-emerald-800'
                                : calc?.predikat === 'B'
                                ? 'bg-blue-100 text-blue-800'
                                : calc?.predikat === 'C'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {calc?.predikat || 'D'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-2 text-center border-r border-slate-200">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              calc?.isTuntas
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            {calc?.isTuntas ? 'Tuntas' : 'Remedial'}
                          </span>
                        </td>

                        {/* Notes */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={g.catatan || ''}
                            onChange={(e) => handleNoteChange(student.id, e.target.value)}
                            placeholder="Catatan perkembangan..."
                            className="w-full text-xs px-2.5 py-1 border border-slate-200 rounded-lg bg-slate-50/60 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            /* ========================================================================= */
            /* MODE 3: REKAP SEMESTER LENGKAP (24 FORMATIF + 6 RATA BULAN + STS + SAS)   */
            /* ========================================================================= */
            <table className="w-full text-xs text-left border-collapse min-w-[1750px]">
              <thead className="bg-slate-100/95 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 sticky top-0 z-20">
                {/* Row 1: Month Grouping Headers */}
                <tr>
                  <th
                    rowSpan={2}
                    className="sticky left-0 bg-slate-100 z-30 py-3 px-3 w-10 text-center border-r border-slate-200"
                  >
                    No
                  </th>
                  <th
                    rowSpan={2}
                    className="sticky left-10 bg-slate-100 z-30 py-3 px-4 min-w-[180px] border-r border-slate-200 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)]"
                  >
                    Nama Siswa
                  </th>
                  <th
                    rowSpan={2}
                    className="py-3 px-2 w-12 text-center border-r border-slate-200"
                  >
                    L/P
                  </th>

                  {/* 6 Months Groups, each with colSpan 5 (4 formatif + 1 average) */}
                  {months.map((mName, mIdx) => (
                    <th
                      key={mIdx}
                      colSpan={5}
                      className={`py-2 px-2 text-center border-r border-b font-black ${
                        mIdx % 2 === 0
                          ? 'bg-indigo-50/90 text-indigo-950 border-indigo-200'
                          : 'bg-sky-50/90 text-sky-950 border-sky-200'
                      }`}
                    >
                      BULAN {mName.toUpperCase()}
                    </th>
                  ))}

                  {/* Hasil Semester (R.Form, STS, SAS, NA, Grade, Status) */}
                  <th
                    colSpan={6}
                    className="py-2 px-2 text-center border-r border-emerald-200 bg-emerald-50 text-emerald-950 font-black border-b"
                  >
                    HASIL SEMESTER (KURIKULUM MERDEKA)
                  </th>

                  <th rowSpan={2} className="py-3 px-3 min-w-[170px]">
                    Catatan
                  </th>
                </tr>

                {/* Row 2: Sub-columns */}
                <tr className="bg-slate-50 text-[10px] text-slate-700 font-bold border-b border-slate-200">
                  {months.map((mName, mIdx) => (
                    <React.Fragment key={`sub-${mIdx}`}>
                      {[0, 1, 2, 3].map((cIdx) => {
                        const hKey = `m${mIdx}_c${cIdx}`;
                        const h = columnHeaders.find((item) => item.key === hKey);
                        return (
                          <th
                            key={hKey}
                            className={`py-1.5 px-1 w-14 text-center border-r border-slate-200 ${
                              mIdx % 2 === 0 ? 'bg-indigo-50/40' : 'bg-sky-50/40'
                            }`}
                            title={`${mName} - ${h?.colLabel || `Formatif ${cIdx + 1}`}: ${h?.keterangan || ''} (${h?.tanggal || '-'})`}
                          >
                            <span className="block text-[10px] font-black">{h?.colLabel || `F${cIdx + 1}`}</span>
                            <span className="block text-[8px] font-mono text-slate-400">
                              {formatDateShort(h?.tanggal)}
                            </span>
                          </th>
                        );
                      })}
                      {/* Month Average Subheader */}
                      <th
                        key={`sub-avg-${mIdx}`}
                        className={`py-1.5 px-1 w-14 text-center border-r border-slate-200 font-black ${
                          mIdx % 2 === 0
                            ? 'bg-indigo-100/80 text-indigo-900'
                            : 'bg-sky-100/80 text-sky-900'
                        }`}
                      >
                        Rata
                      </th>
                    </React.Fragment>
                  ))}

                  {/* Formatif Semester Average */}
                  <th
                    className="py-1.5 px-1 w-14 text-center border-r border-slate-200 bg-indigo-50 font-black text-indigo-950"
                    title="Rata-rata Seluruh Asesmen Formatif (50%)"
                  >
                    R.Form
                  </th>

                  {/* STS */}
                  <th
                    className="py-1.5 px-1 w-14 text-center border-r border-slate-200 bg-amber-100/70 font-black text-amber-950"
                    title="Asesmen Sumatif Tengah Semester (25%)"
                  >
                    STS
                  </th>

                  {/* SAS */}
                  <th
                    className="py-1.5 px-1 w-14 text-center border-r border-slate-200 bg-emerald-100/70 font-black text-emerald-950"
                    title="Asesmen Sumatif Akhir Semester (25%)"
                  >
                    SAS
                  </th>

                  {/* Final NA, Grade, Status */}
                  <th className="py-1.5 px-1 w-14 text-center border-r border-slate-200 bg-emerald-200/80 font-black text-emerald-950">
                    NA
                  </th>
                  <th className="py-1.5 px-1 w-12 text-center border-r border-slate-200 bg-emerald-50 font-bold text-slate-700">
                    Grade
                  </th>
                  <th className="py-1.5 px-1 w-18 text-center border-r border-slate-200 bg-emerald-50 font-bold text-slate-700">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={40} className="text-center py-12 text-slate-400">
                      Tidak ada siswa yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => {
                    const g = getStudentGrade(student.id);
                    const calc = studentCalculations.get(student.id);

                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-indigo-50/20 transition-colors group"
                      >
                        {/* No */}
                        <td className="sticky left-0 bg-white group-hover:bg-indigo-50/40 z-10 py-2 px-3 text-center font-medium text-slate-500 border-r border-slate-200">
                          {student.no}
                        </td>

                        {/* Nama Siswa */}
                        <td className="sticky left-10 bg-white group-hover:bg-indigo-50/40 z-10 py-2 px-4 font-bold text-slate-900 border-r border-slate-200 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)] truncate max-w-[200px]">
                          {student.nama}
                        </td>

                        {/* L/P */}
                        <td className="py-2 px-2 text-center border-r border-slate-200">
                          <span
                            className={`w-5 h-5 rounded font-extrabold text-[10px] inline-flex items-center justify-center ${
                              student.gender === 'L'
                                ? 'text-blue-700 bg-blue-50'
                                : 'text-pink-700 bg-pink-50'
                            }`}
                          >
                            {student.gender}
                          </span>
                        </td>

                        {/* 6 Months Cells: 4 score cells + 1 average cell per month */}
                        {months.map((_, mIdx) => {
                          const mSummary = calc?.monthlySummaries[mIdx];
                          return (
                            <React.Fragment key={`cells-${mIdx}`}>
                              {[0, 1, 2, 3].map((cIdx) => {
                                const hKey = `m${mIdx}_c${cIdx}`;
                                let scoreVal = g.monthlyGrades?.[hKey] ?? null;

                                // Backward compat
                                if (scoreVal === null || scoreVal === undefined) {
                                  if (mIdx === 0) {
                                    if (cIdx === 0) scoreVal = g.formatif1 ?? g.tugas1 ?? null;
                                    else if (cIdx === 1) scoreVal = g.formatif2 ?? g.tugas2 ?? null;
                                    else if (cIdx === 2) scoreVal = g.formatif3 ?? g.tugas3 ?? null;
                                    else if (cIdx === 3) scoreVal = g.formatif4 ?? g.praktik ?? null;
                                  } else if (mIdx === 1) {
                                    if (cIdx === 0) scoreVal = g.formatif5 ?? null;
                                    else if (cIdx === 1) scoreVal = g.formatif6 ?? null;
                                    else if (cIdx === 2) scoreVal = g.formatif7 ?? null;
                                    else if (cIdx === 3) scoreVal = g.formatif8 ?? null;
                                  }
                                }

                                const isUnderKkm =
                                  scoreVal !== null &&
                                  scoreVal !== undefined &&
                                  !isNaN(scoreVal) &&
                                  scoreVal < kkm;

                                return (
                                  <td
                                    key={hKey}
                                    className={`p-1 text-center border-r border-slate-200 ${
                                      mIdx % 2 === 0 ? 'bg-indigo-50/20' : 'bg-sky-50/20'
                                    }`}
                                  >
                                    <input
                                      type="number"
                                      min={0}
                                      max={100}
                                      value={
                                        scoreVal !== null && scoreVal !== undefined
                                          ? scoreVal
                                          : ''
                                      }
                                      onChange={(e) =>
                                        handleScoreChange(student.id, hKey, e.target.value)
                                      }
                                      placeholder="-"
                                      className={`w-12 text-center font-bold text-xs py-1 rounded border focus:ring-1 focus:ring-indigo-500 focus:outline-none ${
                                        isUnderKkm
                                          ? 'bg-rose-50 border-rose-300 text-rose-700 font-extrabold'
                                          : scoreVal !== null
                                          ? 'bg-white border-slate-300 text-slate-900'
                                          : 'bg-white/60 border-slate-200 text-slate-400'
                                      }`}
                                    />
                                  </td>
                                );
                              })}

                              {/* Month Average Cell */}
                              <td
                                key={`avg-cell-${mIdx}`}
                                className={`py-2 px-1 text-center font-black font-mono text-xs border-r border-slate-200 ${
                                  mIdx % 2 === 0
                                    ? 'bg-indigo-100/60 text-indigo-950'
                                    : 'bg-sky-100/60 text-sky-950'
                                }`}
                              >
                                {mSummary?.average !== null && mSummary?.average !== undefined
                                  ? mSummary.average
                                  : '-'}
                              </td>
                            </React.Fragment>
                          );
                        })}

                        {/* Formatif Semester Average */}
                        <td className="py-2 px-1 text-center font-black font-mono text-xs border-r border-slate-200 bg-indigo-50/40 text-indigo-900">
                          {calc?.rataFormatif !== null && calc?.rataFormatif !== undefined ? (
                            <span>{calc.rataFormatif}</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* STS Score Input */}
                        <td className="p-1 text-center border-r border-slate-200 bg-amber-50/30">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={
                              calc?.sumatifTengah !== null && calc?.sumatifTengah !== undefined
                                ? calc.sumatifTengah
                                : ''
                            }
                            onChange={(e) =>
                              handleSumatifChange(student.id, 'sumatifTengah', e.target.value)
                            }
                            placeholder="-"
                            title="Asesmen Sumatif Tengah Semester (STS)"
                            className={`w-12 text-center font-bold text-xs py-1 rounded border focus:ring-1 focus:ring-amber-500 focus:outline-none ${
                              calc?.sumatifTengah !== null && calc?.sumatifTengah !== undefined
                                ? calc.sumatifTengah < kkm
                                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                                  : 'bg-white border-amber-300 text-amber-950'
                                : 'bg-white/60 border-slate-200 text-slate-400'
                            }`}
                          />
                        </td>

                        {/* SAS Score Input */}
                        <td className="p-1 text-center border-r border-slate-200 bg-emerald-50/30">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={
                              calc?.sumatifAkhir !== null && calc?.sumatifAkhir !== undefined
                                ? calc.sumatifAkhir
                                : ''
                            }
                            onChange={(e) =>
                              handleSumatifChange(student.id, 'sumatifAkhir', e.target.value)
                            }
                            placeholder="-"
                            title="Asesmen Sumatif Akhir Semester (SAS)"
                            className={`w-12 text-center font-bold text-xs py-1 rounded border focus:ring-1 focus:ring-emerald-500 focus:outline-none ${
                              calc?.sumatifAkhir !== null && calc?.sumatifAkhir !== undefined
                                ? calc.sumatifAkhir < kkm
                                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                                  : 'bg-white border-emerald-300 text-emerald-950'
                                : 'bg-white/60 border-slate-200 text-slate-400'
                            }`}
                          />
                        </td>

                        {/* Final NA */}
                        <td className="py-2 px-1 text-center font-black font-mono text-xs border-r border-slate-200 bg-emerald-50/50 text-slate-900">
                          {calc?.nilaiAkhir || 0}
                        </td>

                        {/* Predikat */}
                        <td className="py-2 px-1 text-center font-bold text-xs border-r border-slate-200">
                          <span
                            className={`w-5 h-5 rounded-full inline-flex items-center justify-center font-black text-[10px] ${
                              calc?.predikat === 'A'
                                ? 'bg-emerald-100 text-emerald-800'
                                : calc?.predikat === 'B'
                                ? 'bg-blue-100 text-blue-800'
                                : calc?.predikat === 'C'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {calc?.predikat || 'D'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-2 px-1 text-center border-r border-slate-200">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                              calc?.isTuntas
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-rose-50 text-rose-800'
                            }`}
                          >
                            {calc?.isTuntas ? 'Tuntas' : 'Remedial'}
                          </span>
                        </td>

                        {/* Notes */}
                        <td className="py-1.5 px-2">
                          <input
                            type="text"
                            value={g.catatan || ''}
                            onChange={(e) => handleNoteChange(student.id, e.target.value)}
                            placeholder="Catatan..."
                            className="w-full text-xs px-2 py-0.5 border border-slate-200 rounded bg-white"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL: ATUR TANGGAL & MATERI PENILAIAN (FORMATIF & SUMATIF) */}
      {isHeaderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Pengaturan Asesmen Formatif & Sumatif
                  </h3>
                  <p className="text-xs text-slate-500">
                    Atur tanggal pelaksanaan dan materi untuk Asesmen Formatif bulanan serta Sumatif Tengah/Akhir Semester.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHeaderModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setModalTab('formatif')}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  modalTab === 'formatif'
                    ? 'bg-white text-indigo-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarDays className="w-4 h-4 text-indigo-600" />
                <span>Asesmen Formatif (Bulanan)</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('sumatif')}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  modalTab === 'sumatif'
                    ? 'bg-white text-amber-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Award className="w-4 h-4 text-amber-600" />
                <span>Asesmen Sumatif (STS & SAS)</span>
              </button>
            </div>

            {modalTab === 'formatif' ? (
              <div className="space-y-4">
                {/* Select Month to Edit */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Pilih Bulan Asesmen Formatif:
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {months.map((mName, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditingMonthIndex(idx)}
                        className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                          editingMonthIndex === idx
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {mName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Preset Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-bold text-slate-600">
                    Preset Formatif Bulan {months[editingMonthIndex]}:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => applyMonthPresets(editingMonthIndex, 'formatif_standard')}
                      className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                    >
                      Formatif (1-4)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyMonthPresets(editingMonthIndex, 'formatif_tp')}
                      className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                    >
                      TP (TP 1-4)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyMonthPresets(editingMonthIndex, 'formatif_variasi')}
                      className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                    >
                      Tugas/Proyek/Tes
                    </button>
                  </div>
                </div>

                {/* 4 Columns for the selected month */}
                <div className="space-y-3 pt-1">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    4 Kolom Asesmen Formatif Bulan {months[editingMonthIndex]}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[0, 1, 2, 3].map((cIdx) => {
                      const key = `m${editingMonthIndex}_c${cIdx}`;
                      const h =
                        columnHeaders.find((item) => item.key === key) || {
                          key,
                          monthIndex: editingMonthIndex,
                          monthName: months[editingMonthIndex],
                          colIndex: cIdx,
                          colLabel: `Formatif ${cIdx + 1}`,
                          tanggal: '',
                          keterangan: '',
                        };

                      return (
                        <div
                          key={cIdx}
                          className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-indigo-900 bg-indigo-100/80 px-2 py-0.5 rounded-md">
                              Formatif {cIdx + 1}
                            </span>
                            <input
                              type="text"
                              value={h.colLabel || ''}
                              onChange={(e) =>
                                handleUpdateHeader(key, 'colLabel', e.target.value)
                              }
                              placeholder="Label kolom..."
                              className="text-[11px] font-bold text-slate-700 bg-white border border-slate-300 rounded px-2 py-0.5 w-28 text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              title="Ubah label kolom (cth: Formatif 1 / TP 1)"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                              Tanggal Penilaian:
                            </label>
                            <input
                              type="date"
                              value={h.tanggal || ''}
                              onChange={(e) =>
                                handleUpdateHeader(key, 'tanggal', e.target.value)
                              }
                              className="w-full text-xs font-mono px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                              Materi / Tujuan Pembelajaran:
                            </label>
                            <input
                              type="text"
                              value={h.keterangan || ''}
                              onChange={(e) =>
                                handleUpdateHeader(key, 'keterangan', e.target.value)
                              }
                              placeholder="Contoh: TP 1 - Struktur Teks Eksplanasi..."
                              className="w-full text-xs font-medium px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* TAB 2: ATUR ASESMEN SUMATIF (STS & SAS) */
              <div className="space-y-4">
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900">
                  <strong>Catatan Kurikulum Merdeka:</strong> Asesmen Sumatif Tengah Semester (STS) dan Asesmen Sumatif Akhir Semester (SAS) masing-masing memiliki bobot 25%, melengkapi 50% dari Rata-rata Asesmen Formatif bulanan.
                </div>

                {/* Setting STS */}
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-amber-700" />
                      <span>Asesmen Sumatif Tengah Semester (STS)</span>
                    </span>
                    <input
                      type="text"
                      value={stsHeader.colLabel || ''}
                      onChange={(e) =>
                        handleUpdateSumatifHeader('sts', 'colLabel', e.target.value)
                      }
                      className="text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded px-2.5 py-1 w-44 text-right focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Tanggal Pelaksanaan STS:
                      </label>
                      <input
                        type="date"
                        value={stsHeader.tanggal || ''}
                        onChange={(e) =>
                          handleUpdateSumatifHeader('sts', 'tanggal', e.target.value)
                        }
                        className="w-full text-xs font-mono px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Lingkup Materi / Kisi-kisi STS:
                      </label>
                      <input
                        type="text"
                        value={stsHeader.keterangan || ''}
                        onChange={(e) =>
                          handleUpdateSumatifHeader('sts', 'keterangan', e.target.value)
                        }
                        placeholder="Contoh: Bab 1 s.d. Bab 3..."
                        className="w-full text-xs font-medium px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Setting SAS */}
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-emerald-700" />
                      <span>Asesmen Sumatif Akhir Semester (SAS)</span>
                    </span>
                    <input
                      type="text"
                      value={sasHeader.colLabel || ''}
                      onChange={(e) =>
                        handleUpdateSumatifHeader('sas', 'colLabel', e.target.value)
                      }
                      className="text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded px-2.5 py-1 w-44 text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Tanggal Pelaksanaan SAS:
                      </label>
                      <input
                        type="date"
                        value={sasHeader.tanggal || ''}
                        onChange={(e) =>
                          handleUpdateSumatifHeader('sas', 'tanggal', e.target.value)
                        }
                        className="w-full text-xs font-mono px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Lingkup Materi / Kisi-kisi SAS:
                      </label>
                      <input
                        type="text"
                        value={sasHeader.keterangan || ''}
                        onChange={(e) =>
                          handleUpdateSumatifHeader('sas', 'keterangan', e.target.value)
                        }
                        placeholder="Contoh: Keseluruhan Materi Semester 1..."
                        className="w-full text-xs font-medium px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsHeaderModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Selesai
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsHeaderModalOpen(false);
                  handleSaveToCloud();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Perubahan ke Cloud</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Public Nilai Modal for Students and Parents */}
      <SharePublicNilaiModal
        isOpen={showPublicShareModal}
        onClose={() => setShowPublicShareModal(false)}
        currentClass={
          currentClass || {
            id: classId,
            namaKelas: className,
            mataPelajaran,
            kkm,
            tingkat: '',
            jurusan: '',
          }
        }
        teacher={
          teacher || {
            namaGuru: '',
            namaSekolah: 'SMK Muhammadiyah Bawang',
            semester: safeSemester,
            tahunAjaran: academicYear,
          }
        }
        students={students}
        grades={localGrades}
        kkm={kkm}
        onShowToast={onShowToast || ((msg) => console.log(msg))}
        currentUid={currentUid || 'demo'}
      />

      {/* Import Grades Modal from Excel / Spreadsheet */}
      {isImportModalOpen && (
        <ImportGradesModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          students={students}
          headers={columnHeaders}
          currentGrades={localGrades}
          classId={classId}
          className={className}
          onApplyGrades={(updated) => {
            setLocalGrades(updated);
            setHasUnsavedChanges(true);
          }}
          onShowToast={(msg, type) => {
            if (onShowToast) onShowToast(msg, type);
          }}
        />
      )}
    </div>
  );
};
