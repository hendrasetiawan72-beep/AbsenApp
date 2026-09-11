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

interface GradesViewProps {
  students: Student[];
  grades: StudentGrade[];
  kkm: number;
  className: string;
  mataPelajaran: string;
  onUpdateGrade: (studentId: string, field: keyof StudentGrade, value: number | string | null) => void;
  onUpdateStudentField?: (studentId: string, field: keyof Student, value: any) => void;
  onEditStudent?: (student: Student) => void;
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
    tugas1: number | null;
    tugas2: number | null;
    tugas3: number | null;
    uts: number | null;
    uas: number | null;
    praktik: number | null;
    catatan: string;
  }>({
    tugas1: null,
    tugas2: null,
    tugas3: null,
    uts: null,
    uas: null,
    praktik: null,
    catatan: '',
  });

  const handleOpenManualEdit = (student: Student) => {
    const g = grades.find((item) => item.studentId === student.id);
    setManualEditStudent(student);
    setModalStudentData({
      nama: student.nama,
      nisn: student.nisn,
      gender: student.gender,
      catatanUmum: student.catatanUmum || '',
    });
    setModalGrades({
      tugas1: g?.tugas1 ?? null,
      tugas2: g?.tugas2 ?? null,
      tugas3: g?.tugas3 ?? null,
      uts: g?.uts ?? null,
      uas: g?.uas ?? null,
      praktik: g?.praktik ?? null,
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

    onUpdateGrade(manualEditStudent.id, 'tugas1', modalGrades.tugas1);
    onUpdateGrade(manualEditStudent.id, 'tugas2', modalGrades.tugas2);
    onUpdateGrade(manualEditStudent.id, 'tugas3', modalGrades.tugas3);
    onUpdateGrade(manualEditStudent.id, 'uts', modalGrades.uts);
    onUpdateGrade(manualEditStudent.id, 'uas', modalGrades.uas);
    onUpdateGrade(manualEditStudent.id, 'praktik', modalGrades.praktik);
    onUpdateGrade(manualEditStudent.id, 'catatan', modalGrades.catatan);

    setManualEditStudent(null);
  };

  // Compute calculated values per student
  const calculateStudentGrade = (g?: StudentGrade) => {
    const t1 = g?.tugas1 ?? null;
    const t2 = g?.tugas2 ?? null;
    const t3 = g?.tugas3 ?? null;

    const validTugas = [t1, t2, t3].filter((v): v is number => v !== null && !isNaN(v));
    const rataTugas =
      validTugas.length > 0
        ? Math.round(validTugas.reduce((a, b) => a + b, 0) / validTugas.length)
        : 0;

    const uts = g?.uts ?? 0;
    const uas = g?.uas ?? 0;
    const praktik = g?.praktik ?? 0;

    // Weighting: 30% Tugas + 25% UTS + 25% UAS + 20% Praktik
    const nilaiAkhir = Math.round(rataTugas * 0.3 + uts * 0.25 + uas * 0.25 + praktik * 0.2);

    let predikat: 'A' | 'B' | 'C' | 'D' = 'D';
    if (nilaiAkhir >= 88) predikat = 'A';
    else if (nilaiAkhir >= 76) predikat = 'B';
    else if (nilaiAkhir >= 60) predikat = 'C';

    const isTuntas = nilaiAkhir >= kkm;

    return { rataTugas, nilaiAkhir, predikat, isTuntas };
  };

  // Class Statistics
  let totalScore = 0;
  let maxScore = 0;
  let minScore = 100;
  let tuntasCount = 0;
  let belumCount = 0;

  students.forEach((s) => {
    const g = grades.find((item) => item.studentId === s.id);
    const { nilaiAkhir, isTuntas } = calculateStudentGrade(g);
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
    const { isTuntas } = calculateStudentGrade(g);

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
          <table className="w-full text-xs text-left border-collapse min-w-[950px]">
            <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-10 text-center border-r border-slate-200">No</th>
                <th className="py-3 px-2 w-16 text-center border-r border-slate-200 bg-slate-50">Aksi</th>
                <th className="py-3 px-3 w-28 border-r border-slate-200">NISN</th>
                <th className="py-3 px-4 min-w-[180px] border-r border-slate-200">Nama Siswa</th>
                <th className="py-3 px-2 w-14 text-center border-r border-slate-200">L/P</th>

                {/* Tugas */}
                <th className="py-3 px-2 w-16 text-center border-r border-slate-200 bg-slate-50">Tugas 1</th>
                <th className="py-3 px-2 w-16 text-center border-r border-slate-200 bg-slate-50">Tugas 2</th>
                <th className="py-3 px-2 w-16 text-center border-r border-slate-200 bg-slate-50">Tugas 3</th>
                <th className="py-3 px-2 w-16 text-center border-r border-slate-200 bg-indigo-50/60 font-extrabold text-indigo-950">
                  Rata T
                </th>

                {/* Ujian & Praktik */}
                <th className="py-3 px-2 w-16 text-center border-r border-slate-200 bg-slate-50">UTS</th>
                <th className="py-3 px-2 w-16 text-center border-r border-slate-200 bg-slate-50">UAS</th>
                <th className="py-3 px-2 w-16 text-center border-r border-slate-200 bg-slate-50">Praktik</th>

                {/* Hasil Otomatis */}
                <th className="py-3 px-2 w-16 text-center border-r border-slate-200 bg-indigo-100/80 font-extrabold text-indigo-950">
                  Akhir
                </th>
                <th className="py-3 px-2 w-12 text-center border-r border-slate-200 font-extrabold">Predikat</th>
                <th className="py-3 px-3 w-24 text-center border-r border-slate-200 font-extrabold">Ketuntasan</th>
                <th className="py-3 px-3 min-w-[180px]">Catatan / Evaluasi Siswa</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={15} className="text-center py-10 text-slate-400">
                    Tidak ada siswa yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const g = grades.find((item) => item.studentId === student.id);
                  const { rataTugas, nilaiAkhir, predikat, isTuntas } = calculateStudentGrade(g);

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* No */}
                      <td className="py-2.5 px-3 text-center font-medium text-slate-500 border-r border-slate-200">
                        {student.no}
                      </td>

                      {/* Aksi: Edit Manual */}
                      <td className="py-2 px-2 text-center border-r border-slate-200 bg-slate-50/50">
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

                      {/* NISN */}
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 border-r border-slate-200">
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

                      {/* Nama */}
                      <td className="py-2.5 px-4 font-bold text-slate-900 border-r border-slate-200">
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
                            className="cursor-pointer hover:text-indigo-600"
                          >
                            {student.nama}
                          </span>
                        )}
                      </td>

                      {/* Gender Badge - Click to toggle */}
                      <td className="py-2.5 px-2 text-center border-r border-slate-200">
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

                      {/* Input Tugas 1 */}
                      <td className="py-1 px-1 text-center border-r border-slate-200">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={g?.tugas1 ?? ''}
                          onChange={(e) =>
                            onUpdateGrade(
                              student.id,
                              'tugas1',
                              e.target.value === '' ? null : Number(e.target.value)
                            )
                          }
                          placeholder="-"
                          className="w-full text-center text-xs py-1 px-0.5 rounded border border-slate-200 hover:border-slate-400 focus:border-indigo-500 focus:outline-none bg-white font-medium"
                        />
                      </td>

                      {/* Input Tugas 2 */}
                      <td className="py-1 px-1 text-center border-r border-slate-200">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={g?.tugas2 ?? ''}
                          onChange={(e) =>
                            onUpdateGrade(
                              student.id,
                              'tugas2',
                              e.target.value === '' ? null : Number(e.target.value)
                            )
                          }
                          placeholder="-"
                          className="w-full text-center text-xs py-1 px-0.5 rounded border border-slate-200 hover:border-slate-400 focus:border-indigo-500 focus:outline-none bg-white font-medium"
                        />
                      </td>

                      {/* Input Tugas 3 */}
                      <td className="py-1 px-1 text-center border-r border-slate-200">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={g?.tugas3 ?? ''}
                          onChange={(e) =>
                            onUpdateGrade(
                              student.id,
                              'tugas3',
                              e.target.value === '' ? null : Number(e.target.value)
                            )
                          }
                          placeholder="-"
                          className="w-full text-center text-xs py-1 px-0.5 rounded border border-slate-200 hover:border-slate-400 focus:border-indigo-500 focus:outline-none bg-white font-medium"
                        />
                      </td>

                      {/* Rata-rata Tugas (Auto) */}
                      <td className="py-2.5 px-2 text-center border-r border-slate-200 bg-indigo-50/40 font-bold text-indigo-900">
                        {rataTugas}
                      </td>

                      {/* Input UTS */}
                      <td className="py-1 px-1 text-center border-r border-slate-200">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={g?.uts ?? ''}
                          onChange={(e) =>
                            onUpdateGrade(
                              student.id,
                              'uts',
                              e.target.value === '' ? null : Number(e.target.value)
                            )
                          }
                          placeholder="-"
                          className="w-full text-center text-xs py-1 px-0.5 rounded border border-slate-200 hover:border-slate-400 focus:border-indigo-500 focus:outline-none bg-white font-medium"
                        />
                      </td>

                      {/* Input UAS */}
                      <td className="py-1 px-1 text-center border-r border-slate-200">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={g?.uas ?? ''}
                          onChange={(e) =>
                            onUpdateGrade(
                              student.id,
                              'uas',
                              e.target.value === '' ? null : Number(e.target.value)
                            )
                          }
                          placeholder="-"
                          className="w-full text-center text-xs py-1 px-0.5 rounded border border-slate-200 hover:border-slate-400 focus:border-indigo-500 focus:outline-none bg-white font-medium"
                        />
                      </td>

                      {/* Input Praktik */}
                      <td className="py-1 px-1 text-center border-r border-slate-200">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={g?.praktik ?? ''}
                          onChange={(e) =>
                            onUpdateGrade(
                              student.id,
                              'praktik',
                              e.target.value === '' ? null : Number(e.target.value)
                            )
                          }
                          placeholder="-"
                          className="w-full text-center text-xs py-1 px-0.5 rounded border border-slate-200 hover:border-slate-400 focus:border-indigo-500 focus:outline-none bg-white font-medium"
                        />
                      </td>

                      {/* Nilai Akhir Otomatis */}
                      <td className="py-2.5 px-2 text-center border-r border-slate-200 bg-indigo-50 font-extrabold text-indigo-950 text-sm">
                        {nilaiAkhir}
                      </td>

                      {/* Predikat (A, B, C, D) */}
                      <td className="py-2.5 px-2 text-center border-r border-slate-200 font-bold">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs ${
                            predikat === 'A'
                              ? 'bg-emerald-100 text-emerald-800'
                              : predikat === 'B'
                              ? 'bg-blue-100 text-blue-800'
                              : predikat === 'C'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {predikat}
                        </span>
                      </td>

                      {/* Ketuntasan KKM */}
                      <td className="py-2.5 px-3 text-center border-r border-slate-200 font-bold">
                        {isTuntas ? (
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
                          placeholder="Catatan prestasi / remedial..."
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
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            Formula Nilai Akhir: <b>30% Rata-rata Tugas + 25% UTS + 25% UAS + 20% Praktik</b>
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

              {/* Bagian 2: Nilai Tugas, Ujian & Praktik */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span>2. Nilai Akademik ({mataPelajaran})</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Tugas 1 (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={modalGrades.tugas1 ?? ''}
                      onChange={(e) =>
                        setModalGrades({
                          ...modalGrades,
                          tugas1: e.target.value === '' ? null : Number(e.target.value),
                        })
                      }
                      placeholder="-"
                      className="w-full text-xs font-bold text-center px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Tugas 2 (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={modalGrades.tugas2 ?? ''}
                      onChange={(e) =>
                        setModalGrades({
                          ...modalGrades,
                          tugas2: e.target.value === '' ? null : Number(e.target.value),
                        })
                      }
                      placeholder="-"
                      className="w-full text-xs font-bold text-center px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Tugas 3 (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={modalGrades.tugas3 ?? ''}
                      onChange={(e) =>
                        setModalGrades({
                          ...modalGrades,
                          tugas3: e.target.value === '' ? null : Number(e.target.value),
                        })
                      }
                      placeholder="-"
                      className="w-full text-xs font-bold text-center px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      UTS (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={modalGrades.uts ?? ''}
                      onChange={(e) =>
                        setModalGrades({
                          ...modalGrades,
                          uts: e.target.value === '' ? null : Number(e.target.value),
                        })
                      }
                      placeholder="-"
                      className="w-full text-xs font-bold text-center px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      UAS (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={modalGrades.uas ?? ''}
                      onChange={(e) =>
                        setModalGrades({
                          ...modalGrades,
                          uas: e.target.value === '' ? null : Number(e.target.value),
                        })
                      }
                      placeholder="-"
                      className="w-full text-xs font-bold text-center px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Praktik (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={modalGrades.praktik ?? ''}
                      onChange={(e) =>
                        setModalGrades({
                          ...modalGrades,
                          praktik: e.target.value === '' ? null : Number(e.target.value),
                        })
                      }
                      placeholder="-"
                      className="w-full text-xs font-bold text-center px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Catatan / Evaluasi Nilai Siswa
                    </label>
                    <input
                      type="text"
                      value={modalGrades.catatan}
                      onChange={(e) =>
                        setModalGrades({ ...modalGrades, catatan: e.target.value })
                      }
                      placeholder="Catatan kemajuan, remedial, atau prestasi siswa..."
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Bagian 3: Kalkulasi Preview Otomatis */}
              {(() => {
                const vt = [modalGrades.tugas1, modalGrades.tugas2, modalGrades.tugas3].filter(
                  (v): v is number => v !== null && !isNaN(v)
                );
                const rt = vt.length > 0 ? Math.round(vt.reduce((a, b) => a + b, 0) / vt.length) : 0;
                const uts = modalGrades.uts ?? 0;
                const uas = modalGrades.uas ?? 0;
                const pr = modalGrades.praktik ?? 0;
                const na = Math.round(rt * 0.3 + uts * 0.25 + uas * 0.25 + pr * 0.2);
                let pred: 'A' | 'B' | 'C' | 'D' = 'D';
                if (na >= 88) pred = 'A';
                else if (na >= 76) pred = 'B';
                else if (na >= 60) pred = 'C';
                const pass = na >= kkm;

                return (
                  <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-200">
                    <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider mb-2">
                      Kalkulasi Otomatis Hasil Nilai
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                        <span className="text-[10px] text-slate-500 font-bold block">Rata Tugas</span>
                        <span className="text-lg font-black text-slate-800">{rt}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                        <span className="text-[10px] text-slate-500 font-bold block">Nilai Akhir</span>
                        <span className="text-xl font-black text-indigo-900">{na}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                        <span className="text-[10px] text-slate-500 font-bold block">Predikat</span>
                        <span className="text-lg font-black text-indigo-700">{pred}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                        <span className="text-[10px] text-slate-500 font-bold block">KKM ({kkm})</span>
                        <span
                          className={`text-xs font-bold inline-block px-2 py-0.5 mt-1 rounded-full ${
                            pass
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {pass ? 'TUNTAS' : 'REMEDIAL'}
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
