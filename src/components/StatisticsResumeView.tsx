import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2,
  Users,
  CalendarCheck2,
  FileSpreadsheet,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { Student, AttendanceSession, StudentGrade } from '../types';
import { calculateStudentGrade } from '../utils/gradeCalculations';

interface StatisticsResumeViewProps {
  students: Student[];
  sessions: AttendanceSession[];
  grades: StudentGrade[];
  kkm: number;
  className: string;
  mataPelajaran: string;
}

export const StatisticsResumeView: React.FC<StatisticsResumeViewProps> = ({
  students,
  sessions,
  grades,
  kkm,
  className,
  mataPelajaran,
}) => {
  // 1. Attendance Statistics Calculation
  const totalStudents = students.length;
  const totalSessions = sessions.length;

  let totalHadir = 0;
  let totalSakit = 0;
  let totalIzin = 0;
  let totalAlfa = 0;

  // By gender
  let maleCount = 0;
  let femaleCount = 0;
  let maleHadir = 0;
  let femaleHadir = 0;

  students.forEach((s) => {
    if (s.gender === 'L') maleCount++;
    else femaleCount++;
  });

  // Per student attendance counts
  const studentAttendanceStats: Record<
    string,
    { hadir: number; sakit: number; izin: number; alfa: number; percent: number }
  > = {};

  students.forEach((s) => {
    studentAttendanceStats[s.id] = { hadir: 0, sakit: 0, izin: 0, alfa: 0, percent: 100 };
  });

  sessions.forEach((ses) => {
    Object.entries(ses.records).forEach(([studentId, item]) => {
      const rec = item as { status?: string; catatan?: string };
      const st = rec?.status;
      const student = students.find((s) => s.id === studentId);
      if (!student) return;

      if (st === 'H') {
        totalHadir++;
        if (student.gender === 'L') maleHadir++;
        else femaleHadir++;
        if (studentAttendanceStats[studentId]) studentAttendanceStats[studentId].hadir++;
      } else if (st === 'S') {
        totalSakit++;
        if (studentAttendanceStats[studentId]) studentAttendanceStats[studentId].sakit++;
      } else if (st === 'I') {
        totalIzin++;
        if (studentAttendanceStats[studentId]) studentAttendanceStats[studentId].izin++;
      } else if (st === 'A') {
        totalAlfa++;
        if (studentAttendanceStats[studentId]) studentAttendanceStats[studentId].alfa++;
      }
    });
  });

  // Calculate percentages
  const totalRecordedAttendance = totalHadir + totalSakit + totalIzin + totalAlfa;
  const overallAttendancePercent =
    totalRecordedAttendance > 0
      ? Math.round((totalHadir / totalRecordedAttendance) * 100)
      : 100;

  Object.keys(studentAttendanceStats).forEach((id) => {
    const stats = studentAttendanceStats[id];
    stats.percent =
      totalSessions > 0 ? Math.round((stats.hadir / totalSessions) * 100) : 100;
  });

  // Students needing attendance attention (attendance < 80% or alfa >= 2)
  const attendanceWarningStudents = students
    .map((s) => ({
      ...s,
      stats: studentAttendanceStats[s.id],
    }))
    .filter((s) => s.stats && (s.stats.percent < 80 || s.stats.alfa > 0))
    .sort((a, b) => (b.stats?.alfa || 0) - (a.stats?.alfa || 0));

  // 2. Grades Statistics Calculation
  const studentGradeCalculations = students.map((s) => {
    const g = grades.find((item) => item.studentId === s.id);
    const detail = calculateStudentGrade(g, kkm);

    return {
      student: s,
      grade: g,
      rataFormatif: detail.rataFormatif,
      nilaiAkhir: detail.nilaiAkhir,
      predikat: detail.predikat,
      isTuntas: detail.isTuntas,
    };
  });

  const scores = studentGradeCalculations.map((c) => c.nilaiAkhir);
  const averageGrade =
    scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const highestGrade = scores.length > 0 ? Math.max(...scores) : 0;
  const lowestGrade = scores.length > 0 ? Math.min(...scores) : 0;

  const tuntasCount = studentGradeCalculations.filter((c) => c.isTuntas).length;
  const belumTuntasCount = studentGradeCalculations.filter((c) => !c.isTuntas).length;
  const tuntasPercent =
    totalStudents > 0 ? Math.round((tuntasCount / totalStudents) * 100) : 0;

  // Predicate distribution
  const predikatCounts = {
    A: studentGradeCalculations.filter((c) => c.predikat === 'A').length,
    B: studentGradeCalculations.filter((c) => c.predikat === 'B').length,
    C: studentGradeCalculations.filter((c) => c.predikat === 'C').length,
    D: studentGradeCalculations.filter((c) => c.predikat === 'D').length,
  };

  // Top 5 students
  const topStudents = [...studentGradeCalculations]
    .sort((a, b) => b.nilaiAkhir - a.nilaiAkhir)
    .slice(0, 5);

  // Remedial students
  const remedialStudents = studentGradeCalculations.filter((c) => !c.isTuntas);

  return (
    <div className="space-y-5">
      {/* Title Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Resume & Statistik Komprehensif
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Analisis performa hasil absensi dan nilai siswa untuk evaluasi pembelajaran & laporan wali kelas
            </p>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end gap-2 text-xs text-slate-600 font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 shrink-0">
            <div>Jumlah Siswa: <span className="font-bold text-slate-900">{totalStudents} Siswa</span></div>
            <div>Total Pertemuan: <span className="font-bold text-slate-900">{totalSessions} Sesi</span></div>
          </div>
        </div>
      </div>

      {/* SECTION 1: RESUME STATISTIK ABSENSI */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <CalendarCheck2 className="w-4 h-4 text-emerald-600" />
          1. Resume Statistik Kehadiran Siswa
        </h3>

        {/* 4 Big Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Rata-rata Kehadiran</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900">{overallAttendancePercent}%</span>
              <span className="text-xs text-emerald-600 font-bold">
                {overallAttendancePercent >= 85 ? 'Sangat Baik' : 'Cukup'}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${overallAttendancePercent}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Dari total {totalRecordedAttendance} catatan kehadiran
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-500 font-semibold uppercase">Total Hadir (H)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-emerald-700">{totalHadir}</span>
              <span className="text-xs text-slate-400">kali absen</span>
            </div>
            <div className="flex items-center gap-3 mt-3 text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> ♂ L: {maleHadir}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-pink-500"></span> ♀ P: {femaleHadir}
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-500 font-semibold uppercase">Sakit & Izin (S / I)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-amber-600">{totalSakit + totalIzin}</span>
              <span className="text-xs text-slate-400">kali tercatat</span>
            </div>
            <div className="flex items-center gap-3 mt-3 text-xs text-slate-600">
              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold">
                Sakit: {totalSakit}
              </span>
              <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-semibold">
                Izin: {totalIzin}
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-500 font-semibold uppercase">Total Alfa (A)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-rose-700">{totalAlfa}</span>
              <span className="text-xs text-slate-400">tanpa keterangan</span>
            </div>
            <div className="mt-3 text-xs text-rose-600 font-medium">
              {totalAlfa === 0
                ? 'Nihil Alfa • Sangat tertib!'
                : `${attendanceWarningStudents.length} siswa memiliki catatan absen`}
            </div>
          </div>
        </div>

        {/* Per Pertemuan Breakdown & Attendance Warning List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Trend Per Pertemuan */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Statistik Kehadiran Tiap Pertemuan
            </h4>
            <div className="space-y-3">
              {sessions.map((ses) => {
                let h = 0;
                let s = 0;
                let i = 0;
                let a = 0;
                students.forEach((std) => {
                  const st = ses.records[std.id]?.status;
                  if (st === 'H') h++;
                  else if (st === 'S') s++;
                  else if (st === 'I') i++;
                  else if (st === 'A') a++;
                });
                const pct = totalStudents > 0 ? Math.round((h / totalStudents) * 100) : 0;

                return (
                  <div key={ses.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-900">
                        Pertemuan Ke-{ses.pertemuanKe} ({ses.tanggal})
                      </span>
                      <span className="font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        {pct}% Hadir ({h}/{totalStudents})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mb-1.5 truncate">
                      Materi: {ses.topikMateri}
                    </div>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-emerald-700">H: {h}</span>
                      <span className="text-blue-700">S: {s}</span>
                      <span className="text-amber-700">I: {i}</span>
                      <span className="text-rose-700 font-bold">A: {a}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Siswa Perlu Perhatian Absensi */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Siswa Butuh Perhatian Kehadiran
            </h4>

            {attendanceWarningStudents.length === 0 ? (
              <div className="p-8 text-center bg-emerald-50/60 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                <span className="font-bold block text-sm">Semua Siswa Sangat Tertib!</span>
                Tidak ada siswa yang memiliki catatan Alfa atau persentase kehadiran di bawah 80%.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {attendanceWarningStudents.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-rose-200 bg-rose-50/40 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{item.nama}</span>
                        <span className="text-slate-400 font-normal">({item.gender === 'L' ? '♂ L' : '♀ P'})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        NISN: {item.nisn} • Catatan: {item.catatanUmum || '-'}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-rose-700 bg-rose-100 px-2 py-0.5 rounded block">
                        {item.stats?.alfa}x Alfa
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Kehadiran: {item.stats?.percent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: RESUME STATISTIK NILAI */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Award className="w-4 h-4 text-indigo-600" />
          2. Resume Statistik Nilai & Kriteria Ketuntasan (KKM {kkm})
        </h3>

        {/* 4 Big Grade Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-500 font-semibold uppercase">Rata-rata Nilai Kelas</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900">{averageGrade}</span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
            <span className="text-xs text-emerald-600 font-semibold mt-2 block">
              {averageGrade >= kkm ? 'Melampaui KKM' : 'Perlu Peningkatan'}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-500 font-semibold uppercase">Ketuntasan Belajar</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-emerald-700">{tuntasPercent}%</span>
              <span className="text-xs text-emerald-600 font-bold">({tuntasCount} Siswa)</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${tuntasPercent}%` }}
              />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-500 font-semibold uppercase">Siswa Remedial</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-rose-700">{belumTuntasCount}</span>
              <span className="text-xs text-slate-400">Siswa di bawah KKM</span>
            </div>
            <span className="text-xs text-slate-500 mt-2 block">
              Perlu bimbingan & ujian perbaikan
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-500 font-semibold uppercase">Rentang Nilai (Max / Min)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-amber-800">{highestGrade}</span>
              <span className="text-slate-400 font-light text-xl">/</span>
              <span className="text-xl font-bold text-slate-600">{lowestGrade}</span>
            </div>
            <span className="text-xs text-slate-400 mt-2 block">
              Selisih: {highestGrade - lowestGrade} poin
            </span>
          </div>
        </div>

        {/* Predicate Distribution Bars */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
            Distribusi Predikat Nilai Siswa
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
              <span className="text-xs font-bold text-emerald-800 block">Predikat A (Sangat Baik)</span>
              <span className="text-2xl font-black text-emerald-900 mt-1 block">
                {predikatCounts.A} <span className="text-xs font-normal text-emerald-700">Siswa</span>
              </span>
              <span className="text-[11px] text-emerald-600">&ge; 88 Poin</span>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center">
              <span className="text-xs font-bold text-blue-800 block">Predikat B (Baik)</span>
              <span className="text-2xl font-black text-blue-900 mt-1 block">
                {predikatCounts.B} <span className="text-xs font-normal text-blue-700">Siswa</span>
              </span>
              <span className="text-[11px] text-blue-600">76 - 87 Poin</span>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
              <span className="text-xs font-bold text-amber-800 block">Predikat C (Cukup)</span>
              <span className="text-2xl font-black text-amber-900 mt-1 block">
                {predikatCounts.C} <span className="text-xs font-normal text-amber-700">Siswa</span>
              </span>
              <span className="text-[11px] text-amber-600">60 - 75 Poin</span>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
              <span className="text-xs font-bold text-rose-800 block">Predikat D (Kurang)</span>
              <span className="text-2xl font-black text-rose-900 mt-1 block">
                {predikatCounts.D} <span className="text-xs font-normal text-rose-700">Siswa</span>
              </span>
              <span className="text-[11px] text-rose-600">&lt; 60 Poin</span>
            </div>
          </div>
        </div>

        {/* Top 5 Students & Remedial List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top 5 Students */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              Peringkat Teratas (Top 5 Siswa)
            </h4>
            <div className="space-y-2">
              {topStudents.map((item, idx) => (
                <div
                  key={item.student.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-xs ${
                        idx === 0
                          ? 'bg-amber-400 text-amber-950'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-800'
                          : idx === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900">{item.student.nama}</div>
                      <div className="text-[11px] text-slate-500">NISN: {item.student.nisn}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-indigo-900">{item.nilaiAkhir}</span>
                    <span className="text-[10px] text-slate-400 ml-1">Predikat {item.predikat}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Remedial List */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              Daftar Siswa Remedial (Nilai &lt; KKM {kkm})
            </h4>

            {remedialStudents.length === 0 ? (
              <div className="p-8 text-center bg-emerald-50/60 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                <span className="font-bold block text-sm">Semua Siswa Tuntas KKM!</span>
                Seluruh siswa telah memenuhi kriteria ketuntasan minimal {kkm}.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {remedialStudents.map((item) => (
                  <div
                    key={item.student.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-rose-200 bg-rose-50/40 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{item.student.nama}</div>
                      <div className="text-[11px] text-slate-500">
                        NISN: {item.student.nisn} • Catatan: {item.grade?.catatan || 'Perlu remedial'}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                        {item.nilaiAkhir}
                      </span>
                      <span className="text-[10px] text-rose-600 block mt-0.5">
                        Kurang {kkm - item.nilaiAkhir} poin
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
