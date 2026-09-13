import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Search,
  CheckCircle2,
  AlertTriangle,
  Award,
  TrendingUp,
  Edit3,
  Sliders,
  X,
  Save,
  Calendar,
  CloudUpload,
  Check,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import { Student, StudentGrade, Gender, GradeColumnHeader } from '../types';
import { exportGradesToExcel } from '../utils/excel';
import {
  getDefaultGradeHeaders,
  getSemesterMonths,
  calculateMonthlyStudentGrade,
} from '../utils/gradeHeaders';
import { Storage } from '../utils/storage';

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
    updatedHeaders: GradeColumnHeader[]
  ) => Promise<void> | void;
  onUpdateGrade?: (
    studentId: string,
    field: keyof StudentGrade,
    value: number | string | null
  ) => void;
  onUpdateStudentField?: (studentId: string, field: keyof Student, value: any) => void;
  onEditStudent?: (student: Student) => void;
  onOpenEditClass?: () => void;
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
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'tuntas' | 'belum'>('all');
  const [filterGender, setFilterGender] = useState<'all' | Gender>('all');
  const [isQuickEditMode, setIsQuickEditMode] = useState(false);

  // Month navigation tab: 'all' or 0..5 (monthIndex)
  const [activeMonthTab, setActiveMonthTab] = useState<'all' | number>(0);

  // Unsaved changes & saving states
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  const safeSemester: 'Ganjil' | 'Genap' = semester === 'Genap' ? 'Genap' : 'Ganjil';

  // Local working copy of headers (24 columns: 6 months x 4 columns)
  const [columnHeaders, setColumnHeaders] = useState<GradeColumnHeader[]>(() => {
    if (initialHeaders && initialHeaders.length > 0) return initialHeaders;
    return Storage.getGradeHeaders(classId, safeSemester, academicYear);
  });

  // Local working copy of student grades
  const [localGrades, setLocalGrades] = useState<StudentGrade[]>(() => {
    return grades;
  });

  // Header configuration modal state
  const [isHeaderModalOpen, setIsHeaderModalOpen] = useState(false);
  const [editingMonthIndex, setEditingMonthIndex] = useState<number>(0);

  const months = useMemo(() => getSemesterMonths(safeSemester), [safeSemester]);

  // Sync with prop changes when class or external data updates
  useEffect(() => {
    const loadedHeaders =
      initialHeaders && initialHeaders.length > 0
        ? initialHeaders
        : Storage.getGradeHeaders(classId, safeSemester, academicYear);
    setColumnHeaders(loadedHeaders);
    setLocalGrades(grades);
    setHasUnsavedChanges(false);
  }, [classId, safeSemester, academicYear, grades, initialHeaders]);

  // Find or create grade object for student in local state
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
      if (index >= 0) {
        const target = prev[index];
        const nextMonthly = { ...(target.monthlyGrades || {}), [key]: numVal };
        const updated = { ...target, monthlyGrades: nextMonthly };
        const next = [...prev];
        next[index] = updated;
        return next;
      } else {
        const newGrade: StudentGrade = {
          id: `grd-${studentId}`,
          studentId,
          classId,
          monthlyGrades: { [key]: numVal },
          catatan: '',
        };
        return [...prev, newGrade];
      }
    });

    setHasUnsavedChanges(true);
  };

  // Handler for student evaluation / note
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

  // Update a single column's header (tanggal or keterangan)
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

  // Explicit Save to Cloud Action
  const handleSaveToCloud = async () => {
    setIsSaving(true);
    try {
      await onSaveGrades(localGrades, columnHeaders);
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

  // Columns to display based on activeMonthTab
  const visibleHeaders = useMemo(() => {
    if (activeMonthTab === 'all') {
      return columnHeaders;
    }
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

  return (
    <div className="space-y-5">
      {/* Header Banner & Save Action */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold uppercase tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                {className}
              </span>
              <span className="text-xs font-bold text-slate-700">
                {mataPelajaran}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-500">
                Semester {semester} ({academicYear})
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-500">
                KKM: <strong className="text-slate-800">{kkm}</strong>
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
              <span>Buku Nilai Bulanan Siswa (Semester {semester})</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                4 Kolom Nilai / Bulan
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Data penilaian tersimpan di cloud hanya ketika tombol <strong>Simpan Penilaian ke Cloud</strong> ditekan. Tanggal dan keterangan penilaian di bagian atas kolom dapat diedit langsung.
            </p>
          </div>

          {/* Action Buttons: Save & Export */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Save to Cloud Button */}
            <button
              type="button"
              onClick={handleSaveToCloud}
              disabled={isSaving}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer ${
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

            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
              title="Export seluruh rekap penilaian per bulan ke format Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Save Status & Cloud Alert Banner */}
        <div className="mt-3 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            {hasUnsavedChanges ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-300 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Ada perubahan nilai/keterangan yang belum disimpan ke Cloud. Tekan tombol Simpan!</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/90 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                <span>Data tersimpan aman di Cloud Firestore.</span>
                {lastSavedTime && (
                  <span className="text-slate-400 text-[11px] ml-1">
                    (Terakhir disimpan pukul {lastSavedTime})
                  </span>
                )}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingMonthIndex(activeMonthTab === 'all' ? 0 : activeMonthTab);
              setIsHeaderModalOpen(true);
            }}
            className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            title="Buka dialog pengaturan tanggal dan keterangan untuk seluruh kolom bulan ini"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>Atur Tanggal & Keterangan Kolom</span>
          </button>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-indigo-600" />
              Rata-rata Kelas
            </span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block">
              {averageScore}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Target KKM: {kkm}</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Siswa Tuntas
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-emerald-950">{tuntasCount}</span>
              <span className="text-xs font-bold text-emerald-700">
                ({students.length > 0 ? Math.round((tuntasCount / students.length) * 100) : 0}%)
              </span>
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">Nilai &ge; {kkm}</span>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/70">
            <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              Perlu Remedial
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-rose-950">{belumCount}</span>
              <span className="text-xs font-bold text-rose-700">
                ({students.length > 0 ? Math.round((belumCount / students.length) * 100) : 0}%)
              </span>
            </div>
            <span className="text-[10px] text-rose-600 font-medium">Nilai &lt; {kkm}</span>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3 h-3 text-amber-600" />
              Tertinggi / Terendah
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-amber-950">{maxScore}</span>
              <span className="text-xs text-slate-400 font-bold">/</span>
              <span className="text-lg font-black text-slate-700">{minScore}</span>
            </div>
            <span className="text-[10px] text-amber-700 font-medium">Rentang skor kelas</span>
          </div>
        </div>
      </div>

      {/* Month Navigator Tabs */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider px-2 hidden sm:inline">
              Bulan:
            </span>

            {/* All Months Button */}
            <button
              type="button"
              onClick={() => setActiveMonthTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeMonthTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Semua Bulan (24 Kolom)
            </button>

            {/* Individual Month Buttons (0 to 5) */}
            {months.map((monthName, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveMonthTab(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  activeMonthTab === idx
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{monthName}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-extrabold ${
                    activeMonthTab === idx
                      ? 'bg-indigo-800 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  4 Kolom
                </span>
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-500 font-medium shrink-0 pr-2">
            {activeMonthTab === 'all'
              ? 'Menampilkan seluruh 6 bulan dalam 1 semester'
              : `Menampilkan 4 kolom penilaian bulan ${months[activeMonthTab]}`}
          </div>
        </div>
      </div>

      {/* Toolbar: Search and Filter */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="relative min-w-[200px] sm:min-w-[240px] grow sm:grow-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari siswa atau catatan..."
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

      {/* Spreadsheet Input Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[1000px]">
            <thead className="bg-slate-100/95 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 sticky top-0 z-20">
              {/* Row 1: Month Group Headers & General Headers */}
              <tr>
                <th
                  rowSpan={3}
                  className="sticky left-0 bg-slate-100 z-30 py-2.5 px-3 w-10 text-center border-r border-slate-200"
                >
                  No
                </th>

                <th
                  rowSpan={3}
                  className="sticky left-10 bg-slate-100 z-30 py-2.5 px-4 min-w-[190px] border-r border-slate-200 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)]"
                >
                  Nama Siswa
                </th>

                <th
                  rowSpan={3}
                  className="py-2.5 px-2 w-14 text-center border-r border-slate-200"
                >
                  L/P
                </th>

                {/* Monthly Column Groups */}
                {activeMonthTab === 'all' ? (
                  months.map((mName, mIdx) => (
                    <th
                      key={mIdx}
                      colSpan={5}
                      className="py-2 px-2 text-center border-r border-slate-200 bg-indigo-50/70 text-indigo-950 font-black border-b border-indigo-200"
                    >
                      BULAN {mName.toUpperCase()} (4 Kolom Nilai + Rata-rata)
                    </th>
                  ))
                ) : (
                  <th
                    colSpan={5}
                    className="py-2 px-2 text-center border-r border-slate-200 bg-indigo-50/70 text-indigo-950 font-black border-b border-indigo-200"
                  >
                    BULAN {months[activeMonthTab].toUpperCase()} (4 Kolom Nilai + Rata-rata)
                  </th>
                )}

                {/* Final Results */}
                <th
                  colSpan={3}
                  className="py-2 px-2 text-center border-r border-slate-200 bg-emerald-50 text-emerald-950 font-black border-b border-emerald-200"
                >
                  HASIL SEMESTER
                </th>

                <th rowSpan={3} className="py-2.5 px-3 min-w-[180px]">
                  Catatan / Evaluasi
                </th>
              </tr>

              {/* Row 2: Header Information (Tanggal & Keterangan Penilaian) */}
              <tr className="bg-slate-50 text-[10px] text-slate-600 border-b border-slate-200">
                {visibleHeaders.map((header) => (
                  <th
                    key={header.key}
                    className="p-1.5 w-32 border-r border-slate-200 text-center align-top bg-amber-50/40"
                  >
                    {/* Tanggal Penilaian */}
                    <div className="mb-1">
                      <span className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">
                        Tgl Penilaian
                      </span>
                      <input
                        type="date"
                        value={header.tanggal}
                        onChange={(e) =>
                          handleUpdateHeader(header.key, 'tanggal', e.target.value)
                        }
                        className="w-full text-[10px] font-mono px-1 py-0.5 border border-slate-300 rounded bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        title="Ubah tanggal pelaksanaan penilaian"
                      />
                    </div>

                    {/* Keterangan Penilaian */}
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">
                        Keterangan
                      </span>
                      <input
                        type="text"
                        value={header.keterangan}
                        onChange={(e) =>
                          handleUpdateHeader(header.key, 'keterangan', e.target.value)
                        }
                        placeholder="Ket (Tugas/UH)..."
                        className="w-full text-[10px] px-1.5 py-0.5 border border-slate-300 rounded bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-semibold truncate"
                        title="Ubah keterangan materi/tugas penilaian"
                      />
                    </div>
                  </th>
                ))}

                {/* Monthly average column header placeholder */}
                {activeMonthTab === 'all' ? (
                  months.map((_, i) => (
                    <th
                      key={`avg-hdr-${i}`}
                      className="p-1.5 w-14 text-center border-r border-slate-200 bg-indigo-100/60 font-black text-indigo-900"
                    >
                      <span className="text-[10px] block">Rata</span>
                      <span className="text-[9px] text-slate-500 font-normal">Bulan</span>
                    </th>
                  ))
                ) : (
                  <th className="p-1.5 w-14 text-center border-r border-slate-200 bg-indigo-100/60 font-black text-indigo-900">
                    <span className="text-[10px] block">Rata</span>
                    <span className="text-[9px] text-slate-500 font-normal">Bulan</span>
                  </th>
                )}

                {/* Final summary column headers */}
                <th className="p-1.5 w-16 text-center border-r border-slate-200 bg-emerald-100/60 font-extrabold text-emerald-950">
                  Nilai Akhir
                </th>
                <th className="p-1.5 w-12 text-center border-r border-slate-200 bg-emerald-50 font-bold text-slate-700">
                  Predikat
                </th>
                <th className="p-1.5 w-20 text-center border-r border-slate-200 bg-emerald-50 font-bold text-slate-700">
                  Ketuntasan
                </th>
              </tr>

              {/* Row 3: Column Sub-labels (Nilai 1, Nilai 2, Nilai 3, Nilai 4) */}
              <tr className="bg-slate-100 text-[10px] text-slate-700 font-extrabold">
                {visibleHeaders.map((header) => (
                  <th
                    key={`lbl-${header.key}`}
                    className="py-1 px-1 text-center border-r border-slate-200 bg-indigo-50/40 text-indigo-900"
                  >
                    {header.colLabel}
                  </th>
                ))}

                {/* Monthly Average title */}
                <th className="py-1 px-1 text-center border-r border-slate-200 bg-indigo-100/80 text-indigo-950">
                  Rata
                </th>

                {/* Final title repeats */}
                <th className="py-1 px-1 text-center border-r border-slate-200 bg-emerald-100 text-emerald-950">
                  NA
                </th>
                <th className="py-1 px-1 text-center border-r border-slate-200 bg-emerald-50 text-slate-600">
                  Grade
                </th>
                <th className="py-1 px-1 text-center border-r border-slate-200 bg-emerald-50 text-slate-600">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleHeaders.length + 8}
                    className="text-center py-12 text-slate-400"
                  >
                    Tidak ada siswa yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const g = getStudentGrade(student.id);
                  const calc = studentCalculations.get(student.id);

                  // Month average for current view
                  const currentMonthAvg =
                    activeMonthTab !== 'all'
                      ? calc?.monthlySummaries[activeMonthTab]?.average
                      : null;

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-indigo-50/20 transition-colors group"
                    >
                      {/* Frozen 1: No */}
                      <td className="sticky left-0 bg-white group-hover:bg-indigo-50/40 z-10 py-2.5 px-3 text-center font-medium text-slate-500 border-r border-slate-200">
                        {student.no}
                      </td>

                      {/* Frozen 2: Nama Siswa */}
                      <td className="sticky left-10 bg-white group-hover:bg-indigo-50/40 z-10 py-2.5 px-4 font-bold text-slate-900 border-r border-slate-200 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)]">
                        {isQuickEditMode ? (
                          <input
                            type="text"
                            value={student.nama}
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

                      {/* Gender - Read Only, only editable in Data Siswa */}
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

                      {/* Visible Assessment Score Inputs (4 columns per month) */}
                      {visibleHeaders.map((header) => {
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
                            className="p-1 text-center border-r border-slate-200"
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
                              className={`w-14 text-center font-bold text-xs py-1.5 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all ${
                                isUnderKkm
                                  ? 'bg-rose-50/80 border-rose-300 text-rose-700 font-extrabold'
                                  : scoreVal !== null
                                  ? 'bg-white border-slate-300 text-slate-900'
                                  : 'bg-slate-50/60 border-slate-200 text-slate-400 hover:bg-white'
                              }`}
                            />
                          </td>
                        );
                      })}

                      {/* Monthly Average Cell(s) */}
                      {activeMonthTab === 'all' ? (
                        months.map((_, mIdx) => {
                          const avg = calc?.monthlySummaries[mIdx]?.average;
                          return (
                            <td
                              key={`avg-${mIdx}`}
                              className="py-2.5 px-2 text-center font-bold font-mono text-xs border-r border-slate-200 bg-indigo-50/40 text-indigo-950"
                            >
                              {avg !== null && avg !== undefined ? avg : '-'}
                            </td>
                          );
                        })
                      ) : (
                        <td className="py-2.5 px-2 text-center font-bold font-mono text-xs border-r border-slate-200 bg-indigo-50/50 text-indigo-950">
                          {currentMonthAvg !== null && currentMonthAvg !== undefined
                            ? currentMonthAvg
                            : '-'}
                        </td>
                      )}

                      {/* Final Semester Results: Nilai Akhir, Predikat, Ketuntasan */}
                      <td className="py-2.5 px-2 text-center font-black font-mono text-sm border-r border-slate-200 bg-emerald-50/30 text-slate-900">
                        {calc?.nilaiAkhir || 0}
                      </td>

                      <td className="py-2.5 px-2 text-center font-extrabold text-xs border-r border-slate-200">
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

                      {/* Notes input */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={g.catatan || ''}
                          onChange={(e) => handleNoteChange(student.id, e.target.value)}
                          placeholder="Catatan perkembangan..."
                          className="w-full text-xs px-2 py-1 border border-slate-200 rounded-lg bg-slate-50/60 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Atur Tanggal & Keterangan Kolom Penilaian */}
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
                    Pengaturan Header Kolom Penilaian
                  </h3>
                  <p className="text-xs text-slate-500">
                    Atur tanggal pelaksanaan dan keterangan materi untuk 4 kolom penilaian per bulan.
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

            {/* Select Month to Edit */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Pilih Bulan yang Ingin Diatur:
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

            {/* 4 Columns for the selected month */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                4 Kolom Penilaian Bulan {months[editingMonthIndex]}
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
                      colLabel: `Nilai ${cIdx + 1}`,
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
                          Kolom {cIdx + 1} ({h.colLabel})
                        </span>
                        <input
                          type="text"
                          value={h.colLabel}
                          onChange={(e) =>
                            handleUpdateHeader(key, 'colLabel', e.target.value)
                          }
                          placeholder="Label kolom..."
                          className="text-[11px] font-bold text-slate-700 bg-white border border-slate-300 rounded px-2 py-0.5 w-24 text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          title="Ubah label kolom (cth: Nilai 1 / Tugas / Praktik)"
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
                          Keterangan / Materi Uji:
                        </label>
                        <input
                          type="text"
                          value={h.keterangan || ''}
                          onChange={(e) =>
                            handleUpdateHeader(key, 'keterangan', e.target.value)
                          }
                          placeholder="Contoh: Tugas 1, UH Algoritma, Praktik..."
                          className="w-full text-xs font-medium px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

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
    </div>
  );
};
