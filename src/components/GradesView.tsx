import React, { useState } from 'react';
import {
  GraduationCap,
  FileSpreadsheet,
  Search,
  CheckCircle2,
  AlertTriangle,
  Award,
  TrendingUp,
  Percent,
  Edit2,
  Edit3,
  Sliders,
  X,
  Save,
} from 'lucide-react';
import { Student, StudentGrade, Gender } from '../types';
import { exportGradesToExcel } from '../utils/excel';
import { calculateStudentGrade, extractGradeValues } from '../utils/gradeCalculations';

interface GradesViewProps {
  students: Student[];
  grades: StudentGrade[];
  kkm: number;
  className: string;
  mataPelajaran: string;
  onUpdateGrade: (studentId: string, field: keyof StudentGrade, value: number | string | null) => void;
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
  onUpdateGrade,
  onUpdateStudentField,
  onEditStudent,
  onOpenEditClass,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'tuntas' | 'belum'>('all');
  const [filterGender, setFilterGender] = useState<'all' | Gender>('all');
  const [isQuickEditMode, setIsQuickEditMode] = useState(false);

  // Manual Edit Modal State
  const [manualEditStudent, setManualEditStudent] = useState<Student | null>(null);
  const [modalStudentData, setModalStudentData] = useState<{
    nama: string;
    nisn: string;
    gender: Gender;
    catatanUmum?: string;
  }>({
    nama: '',
    nisn: '',
    gender: 'L',
    catatanUmum: '',
  });
  const [modalGrades, setModalGrades] = useState<{
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
    catatan: string;
  }>({
    formatif1: null,
    formatif2: null,
    formatif3: null,
    formatif4: null,
    formatif5: null,
    formatif6: null,
    formatif7: null,
    formatif8: null,
    sumatifTengah: null,
    sumatifAkhir: null,
    catatan: '',
  });

  const handleOpenManualEdit = (student: Student) => {
    const g = grades.find((item) => item.studentId === student.id);
    const extracted = extractGradeValues(g);

    setManualEditStudent(student);
    setModalStudentData({
      nama: student.nama,
      nisn: student.nisn,
      gender: student.gender,
      catatanUmum: student.catatanUmum || '',
    });
    setModalGrades({
      formatif1: extracted.formatif1,
      formatif2: extracted.formatif2,
      formatif3: extracted.formatif3,
      formatif4: extracted.formatif4,
      formatif5: extracted.formatif5,
      formatif6: extracted.formatif6,
      formatif7: extracted.formatif7,
      formatif8: extracted.formatif8,
      sumatifTengah: extracted.sumatifTengah,
      sumatifAkhir: extracted.sumatifAkhir,
      catatan: g?.catatan || '',
    });
  };

  const handleSaveManualEdit = () => {
    if (!manualEditStudent) return;

    if (onUpdateStudentField) {
      onUpdateStudentField(manualEditStudent.id, 'nama', modalStudentData.nama);
      onUpdateStudentField(manualEditStudent.id, 'nisn', modalStudentData.nisn);
      onUpdateStudentField(manualEditStudent.id, 'gender', modalStudentData.gender);
      onUpdateStudentField(manualEditStudent.id, 'catatanUmum', modalStudentData.catatanUmum);
    }

    // Update 8 Asesmen Formatif
    onUpdateGrade(manualEditStudent.id, 'formatif1', modalGrades.formatif1);
    onUpdateGrade(manualEditStudent.id, 'formatif2', modalGrades.formatif2);
    onUpdateGrade(manualEditStudent.id, 'formatif3', modalGrades.formatif3);
    onUpdateGrade(manualEditStudent.id, 'formatif4', modalGrades.formatif4);
    onUpdateGrade(manualEditStudent.id, 'formatif5', modalGrades.formatif5);
    onUpdateGrade(manualEditStudent.id, 'formatif6', modalGrades.formatif6);
    onUpdateGrade(manualEditStudent.id, 'formatif7', modalGrades.formatif7);
    onUpdateGrade(manualEditStudent.id, 'formatif8', modalGrades.formatif8);

    // Update 2 Asesmen Sumatif (pengganti UTS dan UAS)
    onUpdateGrade(manualEditStudent.id, 'sumatifTengah', modalGrades.sumatifTengah);
    onUpdateGrade(manualEditStudent.id, 'sumatifAkhir', modalGrades.sumatifAkhir);

    // Sync legacy compatibility fields
    onUpdateGrade(manualEditStudent.id, 'tugas1', modalGrades.formatif1);
    onUpdateGrade(manualEditStudent.id, 'tugas2', modalGrades.formatif2);
    onUpdateGrade(manualEditStudent.id, 'tugas3', modalGrades.formatif3);
    onUpdateGrade(manualEditStudent.id, 'uts', modalGrades.sumatifTengah);
    onUpdateGrade(manualEditStudent.id, 'uas', modalGrades.sumatifAkhir);

    onUpdateGrade(manualEditStudent.id, 'catatan', modalGrades.catatan);

    setManualEditStudent(null);
  };

  // Class Statistics
  let totalScore = 0;
  let maxScore = 0;
  let minScore = 100;
  let tuntasCount = 0;
  let belumCount = 0;

  students.forEach((s) => {
    const g = grades.find((item) => item.studentId === s.id);
    const { nilaiAkhir, isTuntas } = calculateStudentGrade(g, kkm);
    totalScore += nilaiAkhir;
    if (nilaiAkhir > maxScore) maxScore = nilaiAkhir;
    if (nilaiAkhir < minScore) minScore = nilaiAkhir;
    if (isTuntas) tuntasCount++;
    else belumCount++;
  });

  const averageScore = students.length > 0 ? Math.round(totalScore / students.length) : 0;
  if (students.length === 0) minScore = 0;

  // Filtered Students
  const filteredStudents = students.filter((s) => {
    const g = grades.find((item) => item.studentId === s.id);
    const { isTuntas } = calculateStudentGrade(g, kkm);

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

  const handleExportExcel = () => {
    exportGradesToExcel(className, mataPelajaran, kkm, students, grades);
  };

  return (
    <div className="space-y-5">
      {/* Header & Metrics */}
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
                KKM: <strong className="text-slate-800">{kkm}</strong>
              </span>
              {onOpenEditClass && (
                <button
                  type="button"
                  onClick={onOpenEditClass}
                  title={`Edit nama kelas, mapel, atau KKM (${className})`}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-2 py-0.5 rounded-md transition-colors cursor-pointer shadow-2xs ml-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit Kelas & Mapel</span>
                </button>
              )}
            </div>

            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Rekap & Input Nilai Siswa
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Input nilai tugas harian, UTS, UAS, dan praktik. Nilai akhir, predikat, dan ketuntasan KKM dikalkulasi otomatis.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel Nilai</span>
            </button>
          </div>
        </div>

        {/* Top Summary Cards */}
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

      {/* Toolbar: Search and Filter */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="relative min-w-[200px] sm:min-w-[240px] grow sm:grow-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari siswa / NISN..."
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
              Semua Gender
            </button>
            <button
              type="button"
              onClick={() => setFilterGender('L')}
              className={`px-2.5 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
                filterGender === 'L'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-blue-700 hover:bg-blue-50'
              }`}
            >
              ♂ L
            </button>
            <button
              type="button"
              onClick={() => setFilterGender('P')}
              className={`px-2.5 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
                filterGender === 'P'
                  ? 'bg-pink-600 text-white shadow-2xs'
                  : 'text-pink-700 hover:bg-pink-50'
              }`}
            >
              ♀ P
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
            title="Aktifkan mode edit cepat untuk mengubah NISN dan Nama langsung di tabel nilai"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isQuickEditMode ? 'Tutup Edit Cepat' : 'Edit Cepat Siswa'}</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet Input Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[1300px]">
            <thead className="bg-slate-100/95 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 sticky top-0 z-20">
              <tr>
                {/* Frozen Column 1: No */}
                <th rowSpan={2} className="sticky left-0 bg-slate-100 z-30 py-2.5 px-3 w-10 text-center border-r border-slate-200">
                  No
                </th>

                {/* Frozen Column 2: Nama Siswa */}
                <th rowSpan={2} className="sticky left-10 bg-slate-100 z-30 py-2.5 px-4 min-w-[190px] border-r border-slate-200 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)]">
                  Nama Siswa
                </th>

                <th rowSpan={2} className="py-2.5 px-2 w-14 text-center border-r border-slate-200">L/P</th>
                <th rowSpan={2} className="py-2.5 px-3 w-26 border-r border-slate-200">NISN</th>
                <th rowSpan={2} className="py-2.5 px-2 w-16 text-center border-r border-slate-200 bg-slate-50">Aksi</th>

                {/* Group 1: 8 Kolom Asesmen Formatif + Rata */}
                <th colSpan={9} className="py-2 px-2 text-center border-r border-slate-200 bg-emerald-50 text-emerald-900 font-black border-b border-emerald-200">
                  ASESMEN FORMATIF (8 Kolom Nilai)
                </th>

                {/* Group 2: 2 Kolom Asesmen Sumatif */}
                <th colSpan={2} className="py-2 px-2 text-center border-r border-slate-200 bg-amber-50 text-amber-900 font-black border-b border-amber-200">
                  ASESMEN SUMATIF (2 Kolom Nilai)
                </th>

                {/* Group 3: Hasil Otomatis */}
                <th colSpan={3} className="py-2 px-2 text-center border-r border-slate-200 bg-indigo-50 text-indigo-950 font-black border-b border-indigo-200">
                  HASIL AKHIR
                </th>

                <th rowSpan={2} className="py-2.5 px-3 min-w-[180px]">Catatan / Evaluasi Siswa</th>
              </tr>
              <tr className="bg-slate-50 text-[10px] text-slate-600">
                {/* Formatif Subcolumns F1..F8 + Rata */}
                <th className="py-2 px-1 w-12 text-center border-r border-slate-200 bg-emerald-50/50">F1</th>
                <th className="py-2 px-1 w-12 text-center border-r border-slate-200 bg-emerald-50/50">F2</th>
                <th className="py-2 px-1 w-12 text-center border-r border-slate-200 bg-emerald-50/50">F3</th>
                <th className="py-2 px-1 w-12 text-center border-r border-slate-200 bg-emerald-50/50">F4</th>
                <th className="py-2 px-1 w-12 text-center border-r border-slate-200 bg-emerald-50/50">F5</th>
                <th className="py-2 px-1 w-12 text-center border-r border-slate-200 bg-emerald-50/50">F6</th>
                <th className="py-2 px-1 w-12 text-center border-r border-slate-200 bg-emerald-50/50">F7</th>
                <th className="py-2 px-1 w-12 text-center border-r border-slate-200 bg-emerald-50/50">F8</th>
                <th className="py-2 px-1 w-14 text-center border-r border-slate-200 bg-emerald-100/70 font-extrabold text-emerald-950">
                  Rata F
                </th>

                {/* Sumatif Subcolumns STS (UTS) & SAS (UAS) */}
                <th className="py-2 px-1 w-14 text-center border-r border-slate-200 bg-amber-50/60 font-bold" title="Sumatif Tengah Semester (Pengganti UTS)">
                  STS
                </th>
                <th className="py-2 px-1 w-14 text-center border-r border-slate-200 bg-amber-50/60 font-bold" title="Sumatif Akhir Semester (Pengganti UAS)">
                  SAS
                </th>

                {/* Hasil Akhir */}
                <th className="py-2 px-1 w-14 text-center border-r border-slate-200 bg-indigo-100/70 font-black text-indigo-950">
                  NA
                </th>
                <th className="py-2 px-1 w-12 text-center border-r border-slate-200 font-bold">Pred</th>
                <th className="py-2 px-2 w-24 text-center border-r border-slate-200 font-bold">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={20} className="text-center py-10 text-slate-400">
                    Tidak ada siswa yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const g = grades.find((item) => item.studentId === student.id);
                  const detail = calculateStudentGrade(g, kkm);

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Frozen Column 1: No */}
                      <td className="sticky left-0 bg-white group-hover:bg-slate-50 z-10 py-2 px-3 text-center font-medium text-slate-500 border-r border-slate-200">
                        {student.no}
                      </td>

                      {/* Frozen Column 2: Nama Siswa */}
                      <td className="sticky left-10 bg-white group-hover:bg-slate-50 z-10 py-2 px-4 font-bold text-slate-900 border-r border-slate-200 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)]">
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
                          <span
                            onDoubleClick={() => handleOpenManualEdit(student)}
                            title="Klik tombol Edit atau klik dua kali untuk mengubah"
                            className="cursor-pointer hover:text-indigo-600 block truncate max-w-[200px]"
                          >
                            {student.nama}
                          </span>
                        )}
                      </td>

                      {/* Gender Badge */}
                      <td className="py-2 px-2 text-center border-r border-slate-200">
                        <button
                          type="button"
                          onClick={() => {
                            const nextGender = student.gender === 'L' ? 'P' : 'L';
                            onUpdateStudentField?.(student.id, 'gender', nextGender);
                          }}
                          title="Klik untuk beralih Jenis Kelamin (L/P)"
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold transition-all cursor-pointer ${
                            student.gender === 'L'
                              ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                              : 'bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-200'
                          }`}
                        >
                          <span>{student.gender === 'L' ? '♂ L' : '♀ P'}</span>
                        </button>
                      </td>

                      {/* NISN */}
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-600 border-r border-slate-200">
                        {isQuickEditMode ? (
                          <input
                            type="text"
                            value={student.nisn}
                            onChange={(e) =>
                              onUpdateStudentField?.(student.id, 'nisn', e.target.value)
                            }
                            placeholder="NISN..."
                            className="w-full font-mono text-[11px] px-2 py-1 border border-amber-300 rounded bg-amber-50/50 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                          />
                        ) : (
                          <span
                            onDoubleClick={() => handleOpenManualEdit(student)}
                            title="Klik tombol Edit atau klik dua kali untuk mengubah"
                            className="cursor-pointer hover:text-indigo-600"
                          >
                            {student.nisn}
                          </span>
                        )}
                      </td>

                      {/* Aksi: Edit Manual */}
                      <td className="py-1.5 px-2 text-center border-r border-slate-200 bg-slate-50/50">
                        <button
                          type="button"
                          onClick={() => handleOpenManualEdit(student)}
                          title={`Edit manual lengkap untuk ${student.nama}`}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </td>

                      {/* 8 Kolom Asesmen Formatif (F1 s.d F8) */}
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
                        const fieldName = `formatif${num}` as keyof StudentGrade;
                        const val = detail[fieldName as keyof typeof detail] as number | null;
                        return (
                          <td key={num} className="py-1 px-0.5 text-center border-r border-slate-200">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={val ?? ''}
                              onChange={(e) => {
                                const numVal = e.target.value === '' ? null : Number(e.target.value);
                                onUpdateGrade(student.id, fieldName, numVal);
                                // Sync legacy field if 1..3
                                if (num === 1) onUpdateGrade(student.id, 'tugas1', numVal);
                                if (num === 2) onUpdateGrade(student.id, 'tugas2', numVal);
                                if (num === 3) onUpdateGrade(student.id, 'tugas3', numVal);
                              }}
                              placeholder="-"
                              title={`Asesmen Formatif ${num}`}
                              className="w-full text-center text-xs py-1 px-0.5 rounded border border-slate-200 hover:border-slate-400 focus:border-emerald-500 focus:outline-none bg-white font-medium"
                            />
                          </td>
                        );
                      })}

                      {/* Rata-rata Asesmen Formatif (Auto) */}
                      <td className="py-2 px-1 text-center border-r border-slate-200 bg-emerald-50/60 font-bold text-emerald-950">
                        {detail.rataFormatif}
                      </td>

                      {/* 2 Kolom Asesmen Sumatif: STS (Tengah / UTS) & SAS (Akhir / UAS) */}
                      <td className="py-1 px-1 text-center border-r border-slate-200 bg-amber-50/20">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={detail.sumatifTengah ?? ''}
                          onChange={(e) => {
                            const numVal = e.target.value === '' ? null : Number(e.target.value);
                            onUpdateGrade(student.id, 'sumatifTengah', numVal);
                            onUpdateGrade(student.id, 'uts', numVal);
                          }}
                          placeholder="-"
                          title="Asesmen Sumatif Tengah Semester (STS)"
                          className="w-full text-center text-xs py-1 px-0.5 rounded border border-slate-200 hover:border-slate-400 focus:border-amber-500 focus:outline-none bg-white font-medium"
                        />
                      </td>

                      <td className="py-1 px-1 text-center border-r border-slate-200 bg-amber-50/20">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={detail.sumatifAkhir ?? ''}
                          onChange={(e) => {
                            const numVal = e.target.value === '' ? null : Number(e.target.value);
                            onUpdateGrade(student.id, 'sumatifAkhir', numVal);
                            onUpdateGrade(student.id, 'uas', numVal);
                          }}
                          placeholder="-"
                          title="Asesmen Sumatif Akhir Semester (SAS)"
                          className="w-full text-center text-xs py-1 px-0.5 rounded border border-slate-200 hover:border-slate-400 focus:border-amber-500 focus:outline-none bg-white font-medium"
                        />
                      </td>

                      {/* Nilai Akhir Otomatis */}
                      <td className="py-2 px-1 text-center border-r border-slate-200 bg-indigo-50 font-black text-indigo-950 text-sm">
                        {detail.nilaiAkhir}
                      </td>

                      {/* Predikat (A, B, C, D) */}
                      <td className="py-2 px-1 text-center border-r border-slate-200 font-bold">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs ${
                            detail.predikat === 'A'
                              ? 'bg-emerald-100 text-emerald-800'
                              : detail.predikat === 'B'
                              ? 'bg-blue-100 text-blue-800'
                              : detail.predikat === 'C'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {detail.predikat}
                        </span>
                      </td>

                      {/* Ketuntasan KKM */}
                      <td className="py-2 px-2 text-center border-r border-slate-200 font-bold">
                        {detail.isTuntas ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Tuntas
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <AlertTriangle className="w-3 h-3" />
                            Remedial
                          </span>
                        )}
                      </td>

                      {/* Catatan Siswa */}
                      <td className="py-1 px-3">
                        <input
                          type="text"
                          value={g?.catatan || ''}
                          onChange={(e) =>
                            onUpdateGrade(student.id, 'catatan', e.target.value)
                          }
                          placeholder="Catatan kemajuan / evaluasi..."
                          className="w-full text-xs px-2 py-1 rounded border border-transparent hover:border-slate-300 focus:bg-white focus:border-indigo-500 focus:outline-none text-slate-700"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
          <span>
            Bobot Nilai Akhir: <b>50% Rata Asesmen Formatif (F1-F8) + 25% Sumatif STS + 25% Sumatif SAS</b>
          </span>
          <span>
            Predikat: <b>A (&ge;88)</b>, <b>B (&ge;76)</b>, <b>C (&ge;60)</b>, <b>D (&lt;60)</b>
          </span>
        </div>
      </div>

      {/* MODAL EDIT MANUAL SISWA & NILAI LENGKAP */}
      {manualEditStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Edit Manual Data Siswa & Nilai</h3>
                  <p className="text-xs text-slate-300">
                    Koreksi identitas siswa, nilai akademik harian, ujian, dan evaluasi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManualEditStudent(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
              {/* Bagian 1: Identitas Siswa */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span>1. Identitas Siswa</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      NISN
                    </label>
                    <input
                      type="text"
                      value={modalStudentData.nisn}
                      onChange={(e) =>
                        setModalStudentData({ ...modalStudentData, nisn: e.target.value })
                      }
                      className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Nama Lengkap Siswa
                    </label>
                    <input
                      type="text"
                      value={modalStudentData.nama}
                      onChange={(e) =>
                        setModalStudentData({ ...modalStudentData, nama: e.target.value })
                      }
                      className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Jenis Kelamin
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setModalStudentData({ ...modalStudentData, gender: 'L' })}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          modalStudentData.gender === 'L'
                            ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        ♂ Laki-laki
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalStudentData({ ...modalStudentData, gender: 'P' })}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          modalStudentData.gender === 'P'
                            ? 'bg-pink-600 text-white border-pink-700 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        ♀ Perempuan
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Catatan Umum Siswa (Opsional)
                    </label>
                    <input
                      type="text"
                      value={modalStudentData.catatanUmum || ''}
                      onChange={(e) =>
                        setModalStudentData({ ...modalStudentData, catatanUmum: e.target.value })
                      }
                      placeholder="Info nomor kontak, wali, dll."
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Bagian 2: 8 Kolom Asesmen Formatif */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200">
                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>2. Asesmen Formatif (8 Kolom Nilai Harian / Proses)</span>
                  <span className="text-[11px] font-normal text-emerald-700">Skala 0 - 100</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
                    const key = `formatif${num}` as keyof typeof modalGrades;
                    const val = modalGrades[key] as number | null;
                    return (
                      <div key={num}>
                        <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                          Formatif {num}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={val ?? ''}
                          onChange={(e) =>
                            setModalGrades({
                              ...modalGrades,
                              [key]: e.target.value === '' ? null : Number(e.target.value),
                            })
                          }
                          placeholder="-"
                          className="w-full text-xs font-bold text-center px-3 py-2 bg-white border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bagian 3: 2 Kolom Asesmen Sumatif */}
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200">
                <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>3. Asesmen Sumatif (2 Kolom Nilai: STS & SAS)</span>
                  <span className="text-[11px] font-normal text-amber-700">Pengganti UTS & UAS</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-amber-950 mb-1">
                      Sumatif Tengah Semester (STS / UTS)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={modalGrades.sumatifTengah ?? ''}
                      onChange={(e) =>
                        setModalGrades({
                          ...modalGrades,
                          sumatifTengah: e.target.value === '' ? null : Number(e.target.value),
                        })
                      }
                      placeholder="-"
                      className="w-full text-xs font-bold text-center px-3 py-2 bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-amber-950 mb-1">
                      Sumatif Akhir Semester (SAS / UAS)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={modalGrades.sumatifAkhir ?? ''}
                      onChange={(e) =>
                        setModalGrades({
                          ...modalGrades,
                          sumatifAkhir: e.target.value === '' ? null : Number(e.target.value),
                        })
                      }
                      placeholder="-"
                      className="w-full text-xs font-bold text-center px-3 py-2 bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Bagian 4: Catatan / Evaluasi Nilai Siswa */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  4. Catatan / Evaluasi Guru untuk Siswa
                </label>
                <input
                  type="text"
                  value={modalGrades.catatan}
                  onChange={(e) =>
                    setModalGrades({ ...modalGrades, catatan: e.target.value })
                  }
                  placeholder="Contoh: Sangat aktif dalam praktikum, perlu pendalaman materi logika..."
                  className="w-full text-xs px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Bagian 5: Kalkulasi Preview Otomatis */}
              {(() => {
                const previewGrade: StudentGrade = {
                  id: 'temp',
                  studentId: manualEditStudent?.id || '',
                  classId: '',
                  formatif1: modalGrades.formatif1,
                  formatif2: modalGrades.formatif2,
                  formatif3: modalGrades.formatif3,
                  formatif4: modalGrades.formatif4,
                  formatif5: modalGrades.formatif5,
                  formatif6: modalGrades.formatif6,
                  formatif7: modalGrades.formatif7,
                  formatif8: modalGrades.formatif8,
                  sumatifTengah: modalGrades.sumatifTengah,
                  sumatifAkhir: modalGrades.sumatifAkhir,
                  catatan: modalGrades.catatan,
                };
                const { rataFormatif, nilaiAkhir, predikat, isTuntas } = calculateStudentGrade(previewGrade, kkm);

                return (
                  <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-200">
                    <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider mb-2">
                      Kalkulasi Otomatis Hasil Nilai (Preview)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                        <span className="text-[10px] text-slate-500 font-bold block">Rata Formatif</span>
                        <span className="text-lg font-black text-emerald-800">{rataFormatif}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                        <span className="text-[10px] text-slate-500 font-bold block">Nilai Akhir (NA)</span>
                        <span className="text-xl font-black text-indigo-950">{nilaiAkhir}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                        <span className="text-[10px] text-slate-500 font-bold block">Predikat</span>
                        <span className="text-lg font-black text-indigo-700">{predikat}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                        <span className="text-[10px] text-slate-500 font-bold block">KKM ({kkm})</span>
                        <span
                          className={`text-xs font-bold inline-block px-2 py-0.5 mt-1 rounded-full ${
                            isTuntas
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isTuntas ? 'TUNTAS' : 'REMEDIAL'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setManualEditStudent(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveManualEdit}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
