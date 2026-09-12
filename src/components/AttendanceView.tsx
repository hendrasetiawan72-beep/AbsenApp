import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle,
  Plus,
  Search,
  CheckCheck,
  RotateCcw,
  FileSpreadsheet,
  Edit2,
  Edit3,
  Trash2,
  Table,
  UserCheck,
  Share2,
  Cloud,
  ChevronDown,
  MessageSquare,
} from 'lucide-react';
import { Student, AttendanceSession, AttendanceStatus, Gender } from '../types';
import { exportAttendanceToExcel } from '../utils/excel';
import { WhatsAppShareModal } from './WhatsAppShareModal';

interface AttendanceViewProps {
  students: Student[];
  sessions: AttendanceSession[];
  activeClassId: string;
  activeClassName: string;
  mataPelajaran: string;
  teacherName: string;
  schoolName?: string;
  onUpdateStatus: (sessionId: string, studentId: string, status: AttendanceStatus) => void;
  onUpdateCatatan: (sessionId: string, studentId: string, catatan: string) => void;
  onMarkAllPresent: (sessionId: string) => void;
  onResetSession: (sessionId: string) => void;
  onAddSession: (tanggal: string, pertemuanKe: number, topikMateri: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onEditStudent: (student: Student) => void;
  onUpdateStudentField?: (studentId: string, field: keyof Student, value: any) => void;
  onDeleteStudent: (studentId: string) => void;
  onOpenAddStudent: () => void;
  onOpenSpreadsheetImport: () => void;
  onOpenWorkspaceTab?: () => void;
  onOpenParentReportTab?: () => void;
  onOpenEditClass?: () => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  students,
  sessions,
  activeClassId,
  activeClassName,
  mataPelajaran,
  teacherName,
  schoolName = 'SMK Muhammadiyah Bawang',
  onUpdateStatus,
  onUpdateCatatan,
  onMarkAllPresent,
  onResetSession,
  onAddSession,
  onDeleteSession,
  onEditStudent,
  onUpdateStudentField,
  onDeleteStudent,
  onOpenAddStudent,
  onOpenSpreadsheetImport,
  onOpenWorkspaceTab,
  onOpenParentReportTab,
  onOpenEditClass,
}) => {
  // Active session selector
  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    sessions[sessions.length - 1]?.id || ''
  );

  // WhatsApp Share Modal state
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  // New session modal/inline form
  const [showNewSessionForm, setShowNewSessionForm] = useState(false);
  const [newSessionDate, setNewSessionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [newSessionTopic, setNewSessionTopic] = useState('');

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGender, setFilterGender] = useState<'all' | Gender>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | AttendanceStatus | 'unmarked'>('all');

  // Matrix View vs Single Session View
  const [viewMode, setViewMode] = useState<'single' | 'matrix'>('single');
  const [isQuickEditMode, setIsQuickEditMode] = useState(false);

  // Active current session object
  const activeSession =
    sessions.find((s) => s.id === selectedSessionId) || sessions[sessions.length - 1];

  // If selectedSessionId is invalid or changed, sync it
  const currentSessionId = activeSession?.id || '';

  // Calculate session summary stats
  const totalStudents = students.length;
  let hadirCount = 0;
  let sakitCount = 0;
  let izinCount = 0;
  let alfaCount = 0;
  let unmarkedCount = 0;

  if (activeSession) {
    students.forEach((s) => {
      const rec = activeSession.records[s.id];
      const st = rec?.status;
      if (st === 'H') hadirCount++;
      else if (st === 'S') sakitCount++;
      else if (st === 'I') izinCount++;
      else if (st === 'A') alfaCount++;
      else unmarkedCount++;
    });
  }

  const attendancePercent =
    totalStudents > 0
      ? Math.round((hadirCount / totalStudents) * 100)
      : 0;

  // Filtered students for single view
  const filteredStudents = students.filter((s) => {
    // Search query
    const matchQuery =
      s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nisn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (activeSession?.records[s.id]?.catatan || '').toLowerCase().includes(searchQuery.toLowerCase());

    // Gender filter
    const matchGender = filterGender === 'all' || s.gender === filterGender;

    // Status filter
    const curStatus = activeSession?.records[s.id]?.status;
    let matchStatus = true;
    if (filterStatus === 'unmarked') {
      matchStatus = !curStatus || curStatus === undefined;
    } else if (filterStatus !== 'all') {
      matchStatus = curStatus === filterStatus;
    }

    return matchQuery && matchGender && matchStatus;
  });

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    const nextPertemuan = sessions.length + 1;
    onAddSession(newSessionDate, nextPertemuan, newSessionTopic.trim() || `Pertemuan ${nextPertemuan}`);
    setShowNewSessionForm(false);
    setNewSessionTopic('');
  };

  const handleExportExcel = () => {
    exportAttendanceToExcel(activeClassName, mataPelajaran, teacherName, students, sessions);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Session Controller */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold uppercase tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                {activeClassName}
              </span>
              <span className="text-xs font-bold text-slate-700">
                {mataPelajaran}
              </span>
              {onOpenEditClass && (
                <button
                  type="button"
                  onClick={onOpenEditClass}
                  title={`Edit nama kelas atau mapel (${activeClassName})`}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-2 py-0.5 rounded-md transition-colors cursor-pointer shadow-2xs"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit Kelas & Mapel</span>
                </button>
              )}
            </div>

            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Presensi Siswa
            </h2>

            {viewMode === 'single' && activeSession ? (
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 flex-wrap">
                <span className="font-bold text-indigo-900 bg-indigo-50/80 px-2 py-0.5 rounded-md border border-indigo-100">
                  Pertemuan Ke-{activeSession.pertemuanKe}
                </span>
                <span className="font-mono text-slate-500">{activeSession.tanggal}</span>
                <span className="text-slate-300">•</span>
                <span className="font-medium text-slate-700 truncate max-w-md">
                  {activeSession.topikMateri}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Hapus sesi pertemuan ke-${activeSession.pertemuanKe} ini?`)) {
                      onDeleteSession(activeSession.id);
                    }
                  }}
                  className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer ml-1"
                  title="Hapus Sesi Pertemuan"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-1">
                Kelola status kehadiran Hadir (H), Sakit (S), Izin (I), Alfa (A) dan catatan per siswa
              </p>
            )}
          </div>

          {/* Session Switcher & Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-100/90 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('single')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'single'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Per Pertemuan</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'matrix'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Rekap Matriks</span>
              </button>
            </div>

            {/* Session Dropdown (Single mode) */}
            {viewMode === 'single' && sessions.length > 0 && (
              <div className="relative inline-block">
                <select
                  aria-label="Pilih Pertemuan"
                  value={currentSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="text-xs font-bold bg-slate-100 hover:bg-slate-200/80 border border-slate-300/80 rounded-xl px-3 py-2 pr-7 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer transition-colors max-w-[170px] truncate"
                >
                  {sessions.map((ses) => (
                    <option key={ses.id} value={ses.id}>
                      P{ses.pertemuanKe} • {ses.tanggal}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowNewSessionForm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Pertemuan</span>
            </button>

            {activeSession && (
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                title="Kirim Rekap Absensi Pertemuan Ini ke WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share WA</span>
              </button>
            )}

            {onOpenParentReportTab && (
              <button
                type="button"
                onClick={onOpenParentReportTab}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
                title="Buka Format Laporan Harian untuk Orang Tua Siswa"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden md:inline">Laporan Ortu (WA)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Excel</span>
            </button>
          </div>
        </div>

        {/* Inline Form to add Session */}
        {showNewSessionForm && (
          <form
            onSubmit={handleCreateSession}
            className="mt-4 p-4 bg-slate-50 border border-indigo-200/80 rounded-2xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Tambah Pertemuan Absensi Baru (Pertemuan Ke-{sessions.length + 1})
              </span>
              <button
                type="button"
                onClick={() => setShowNewSessionForm(false)}
                className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Batal
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1 font-medium">Tanggal Pertemuan</label>
                <input
                  type="date"
                  required
                  value={newSessionDate}
                  onChange={(e) => setNewSessionDate(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-600 mb-1 font-medium">Topik / Materi Pelajaran</label>
                <input
                  type="text"
                  placeholder="Contoh: Pengenalan Komponen Mesin & Keselamatan Kerja"
                  value={newSessionTopic}
                  onChange={(e) => setNewSessionTopic(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowNewSessionForm(false)}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-xl border border-slate-300 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Simpan & Buka Absen
              </button>
            </div>
          </form>
        )}

        {/* Integrated KPI Metrics Strip (Single Mode) */}
        {viewMode === 'single' && activeSession && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-4 pt-4 border-t border-slate-100">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Total Siswa</span>
              <span className="text-xl font-black text-slate-900 mt-0.5 block">{totalStudents}</span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70">
              <span className="text-[10px] font-bold text-emerald-800 block uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Hadir (H)
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-black text-emerald-950">{hadirCount}</span>
                <span className="text-xs font-bold text-emerald-700">({attendancePercent}%)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/70">
              <span className="text-[10px] font-bold text-blue-800 block uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Sakit (S)
              </span>
              <span className="text-xl font-black text-blue-950 mt-0.5 block">{sakitCount}</span>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70">
              <span className="text-[10px] font-bold text-amber-800 block uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Izin (I)
              </span>
              <span className="text-xl font-black text-amber-950 mt-0.5 block">{izinCount}</span>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/70">
              <span className="text-[10px] font-bold text-rose-800 block uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Alfa (A)
              </span>
              <span className="text-xl font-black text-rose-950 mt-0.5 block">{alfaCount}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-center">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Kehadiran</span>
              <div className="w-full bg-slate-200 h-2 rounded-full mt-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    attendancePercent >= 85
                      ? 'bg-emerald-500'
                      : attendancePercent >= 75
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${attendancePercent}%` }}
                />
              </div>
              <span className="text-xs font-black text-slate-800 mt-1 text-right">{attendancePercent}%</span>
            </div>
          </div>
        )}
      </div>

      {/* SINGLE SESSION SPREADSHEET VIEW */}
      {viewMode === 'single' && (
        <div className="space-y-4">
          {/* Action & Filter Toolbar */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            {/* Search Input & Gender Segmented Filter */}
            <div className="flex flex-wrap items-center gap-2.5 grow sm:grow-0">
              <div className="relative min-w-[200px] sm:min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari nama siswa / NISN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50/60"
                />
              </div>

              {/* Gender Filter Segmented */}
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
            </div>

            {/* Batch Status & Student Management */}
            <div className="flex items-center gap-2 ml-auto flex-wrap">
              {currentSessionId && (
                <>
                  <button
                    type="button"
                    onClick={() => onMarkAllPresent(currentSessionId)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    title="Tandai semua siswa yang belum diabsen menjadi Hadir"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Semua Hadir</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Reset status absensi pada pertemuan ini?')) {
                        onResetSession(currentSessionId);
                      }
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    title="Kosongkan status absensi pertemuan ini"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setIsQuickEditMode(!isQuickEditMode)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
                  isQuickEditMode
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                }`}
                title="Aktifkan mode edit cepat untuk mengubah NISN, Nama, dan Gender langsung di tabel"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isQuickEditMode ? 'Tutup Edit Cepat' : 'Edit Cepat Siswa'}</span>
              </button>

              <button
                type="button"
                onClick={onOpenAddStudent}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+ Siswa</span>
              </button>

              <button
                type="button"
                onClick={onOpenSpreadsheetImport}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Impor</span>
              </button>
            </div>
          </div>

          {/* Spreadsheet Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse min-w-[760px]">
                <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 w-12 text-center">No</th>
                    <th className="py-3 px-3 w-28">NISN</th>
                    <th className="py-3 px-4">Nama Lengkap Siswa</th>
                    <th className="py-3 px-3 w-32 text-center">Gender</th>
                    <th className="py-3 px-4 w-72 text-center">
                      Status Kehadiran <span className="text-[10px] text-slate-500 font-normal block">(Pilih Salah Satu)</span>
                    </th>
                    <th className="py-3 px-4 min-w-[200px]">Catatan Per Siswa</th>
                    <th className="py-3 px-3 w-20 text-center">Aksi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        {students.length === 0 ? (
                          <div className="space-y-3">
                            <p className="text-sm font-semibold text-slate-600">
                              Belum ada data siswa di kelas {activeClassName}.
                            </p>
                            <div className="flex justify-center gap-2">
                              <button
                                type="button"
                                onClick={onOpenAddStudent}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                              >
                                + Tambah Siswa Manual
                              </button>
                              <button
                                type="button"
                                onClick={onOpenSpreadsheetImport}
                                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                              >
                                Impor dari Spreadsheet
                              </button>
                            </div>
                          </div>
                        ) : (
                          'Tidak ada siswa yang cocok dengan filter pencarian.'
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => {
                      const rec = activeSession?.records[student.id];
                      const currentStatus = rec?.status;
                      const currentCatatan = rec?.catatan || '';

                      return (
                        <tr
                          key={student.id}
                          className="hover:bg-indigo-50/30 transition-colors group"
                        >
                          {/* No */}
                          <td className="py-3 px-3 text-center font-medium text-slate-500">
                            {student.no}
                          </td>

                          {/* NISN */}
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
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
                                onDoubleClick={() => onEditStudent(student)}
                                title="Klik dua kali atau tombol Edit untuk mengubah NISN"
                                className="cursor-pointer hover:text-indigo-600"
                              >
                                {student.nisn}
                              </span>
                            )}
                          </td>

                          {/* Nama Lengkap */}
                          <td className="py-3 px-4">
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
                                onDoubleClick={() => onEditStudent(student)}
                                className="font-bold text-slate-900 leading-tight cursor-pointer hover:text-indigo-600"
                                title="Klik dua kali atau tombol Edit untuk mengubah nama"
                              >
                                {student.nama}
                              </div>
                            )}
                            {student.catatanUmum && (
                              <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[240px]">
                                Info: {student.catatanUmum}
                              </div>
                            )}
                          </td>

                          {/* Gender - Interactive Click to Toggle */}
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const nextGender = student.gender === 'L' ? 'P' : 'L';
                                onUpdateStudentField?.(student.id, 'gender', nextGender);
                              }}
                              title="Klik untuk beralih Jenis Kelamin (Laki-laki ♂ / Perempuan ♀)"
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer hover:scale-105 ${
                                student.gender === 'L'
                                  ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200/90 shadow-2xs'
                                  : 'bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-200/90 shadow-2xs'
                              }`}
                            >
                              <span
                                className={`w-4 h-4 rounded-full text-white flex items-center justify-center text-[10px] font-extrabold ${
                                  student.gender === 'L' ? 'bg-blue-600' : 'bg-pink-600'
                                }`}
                              >
                                {student.gender === 'L' ? '♂' : '♀'}
                              </span>
                              <span>{student.gender === 'L' ? 'L' : 'P'}</span>
                            </button>
                          </td>

                          {/* Attendance Status Selector Buttons (Pilih salah satu / Klik lagi untuk reset) */}
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 gap-1 shadow-2xs">
                              {/* Hadir (H) */}
                              <button
                                type="button"
                                title={currentStatus === 'H' ? 'Sudah Hadir (Klik untuk kosongkan)' : 'Tandai Hadir'}
                                onClick={() =>
                                  onUpdateStatus(
                                    currentSessionId,
                                    student.id,
                                    currentStatus === 'H' ? ('' as AttendanceStatus) : 'H'
                                  )
                                }
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  currentStatus === 'H'
                                    ? 'bg-emerald-600 text-white shadow-xs scale-102 ring-2 ring-emerald-500/20'
                                    : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                                }`}
                              >
                                H
                              </button>

                              {/* Sakit (S) */}
                              <button
                                type="button"
                                title={currentStatus === 'S' ? 'Sudah Sakit (Klik untuk kosongkan)' : 'Tandai Sakit'}
                                onClick={() =>
                                  onUpdateStatus(
                                    currentSessionId,
                                    student.id,
                                    currentStatus === 'S' ? ('' as AttendanceStatus) : 'S'
                                  )
                                }
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  currentStatus === 'S'
                                    ? 'bg-blue-600 text-white shadow-xs scale-102 ring-2 ring-blue-500/20'
                                    : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
                                }`}
                              >
                                S
                              </button>

                              {/* Izin (I) */}
                              <button
                                type="button"
                                title={currentStatus === 'I' ? 'Sudah Izin (Klik untuk kosongkan)' : 'Tandai Izin'}
                                onClick={() =>
                                  onUpdateStatus(
                                    currentSessionId,
                                    student.id,
                                    currentStatus === 'I' ? ('' as AttendanceStatus) : 'I'
                                  )
                                }
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  currentStatus === 'I'
                                    ? 'bg-amber-500 text-white shadow-xs scale-102 ring-2 ring-amber-500/20'
                                    : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
                                }`}
                              >
                                I
                              </button>

                              {/* Alfa (A) */}
                              <button
                                type="button"
                                title={currentStatus === 'A' ? 'Sudah Alfa (Klik untuk kosongkan)' : 'Tandai Alfa'}
                                onClick={() =>
                                  onUpdateStatus(
                                    currentSessionId,
                                    student.id,
                                    currentStatus === 'A' ? ('' as AttendanceStatus) : 'A'
                                  )
                                }
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  currentStatus === 'A'
                                    ? 'bg-rose-600 text-white shadow-xs scale-102 ring-2 ring-rose-500/20'
                                    : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
                                }`}
                              >
                                A
                              </button>
                            </div>
                          </td>

                          {/* Kolom Catatan per Siswa (Inline Text Input) */}
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={currentCatatan}
                              onChange={(e) =>
                                onUpdateCatatan(
                                  currentSessionId,
                                  student.id,
                                  e.target.value
                                )
                              }
                              placeholder="Tambah catatan siswa..."
                              className={`w-full text-xs px-2.5 py-1.5 rounded-lg border transition-colors focus:ring-1 focus:outline-none ${
                                currentCatatan
                                  ? 'bg-amber-50/50 border-amber-300 text-slate-800 font-medium focus:ring-amber-500'
                                  : 'bg-transparent border-transparent hover:border-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 text-slate-600'
                              }`}
                            />
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => onEditStudent(student)}
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded-md cursor-pointer hover:bg-indigo-50"
                                title="Edit Siswa"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Hapus siswa ${student.nama} dari kelas?`)) {
                                    onDeleteStudent(student.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer hover:bg-rose-50"
                                title="Hapus Siswa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Helper */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
              <div className="flex items-center gap-4">
                <span>
                  Menampilkan <b>{filteredStudents.length}</b> dari {students.length} siswa
                </span>
                <span className="hidden sm:inline-block text-slate-300">•</span>
                <span className="hidden sm:inline-flex items-center gap-1">
                  Keterangan: <span className="font-bold text-emerald-700">H</span> = Hadir,{' '}
                  <span className="font-bold text-blue-700">S</span> = Sakit,{' '}
                  <span className="font-bold text-amber-700">I</span> = Izin,{' '}
                  <span className="font-bold text-rose-700">A</span> = Alfa
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenAddStudent}
                  className="text-xs font-semibold text-indigo-700 hover:underline cursor-pointer"
                >
                  + Tambah Siswa Manual
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MATRIX VIEW (ALL SESSIONS SPREADSHEET TABLE) */}
      {viewMode === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/80">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Rekap Matriks Seluruh Pertemuan ({sessions.length} Sesi Terjadwal)
              </h3>
              <p className="text-xs text-slate-500">
                Tampilan format spreadsheet penuh memperlihatkan kehadiran tiap pertemuan serta persentase total
              </p>
              <p className="text-[11px] text-indigo-600 font-semibold mt-1">
                💡 Edit Manual Matriks: Klik langsung pada kotak status absensi siswa (P1, P2, dst.) untuk mengubah kehadiran (H → S → I → A → Reset). Klik L/P untuk mengubah jenis kelamin.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Download Excel Matriks</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-300">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center border-r border-slate-200">No</th>
                  <th className="py-2.5 px-3 w-24 border-r border-slate-200">NISN</th>
                  <th className="py-2.5 px-3 min-w-[180px] border-r border-slate-200">Nama Siswa</th>
                  <th className="py-2.5 px-2 w-12 text-center border-r border-slate-200">L/P</th>

                  {/* Sessions Columns */}
                  {sessions.map((ses) => (
                    <th
                      key={ses.id}
                      className="py-2 px-2 w-14 text-center border-r border-slate-200 bg-indigo-50/50"
                      title={`${ses.tanggal} - ${ses.topikMateri}`}
                    >
                      <span className="block font-extrabold text-indigo-900">P{ses.pertemuanKe}</span>
                      <span className="text-[9px] text-slate-500 font-normal block truncate">
                        {ses.tanggal.substring(5)}
                      </span>
                    </th>
                  ))}

                  {/* Summary Totals */}
                  <th className="py-2.5 px-2 w-10 text-center bg-emerald-50 text-emerald-900 border-r border-slate-200 font-extrabold">H</th>
                  <th className="py-2.5 px-2 w-10 text-center bg-blue-50 text-blue-900 border-r border-slate-200 font-extrabold">S</th>
                  <th className="py-2.5 px-2 w-10 text-center bg-amber-50 text-amber-900 border-r border-slate-200 font-extrabold">I</th>
                  <th className="py-2.5 px-2 w-10 text-center bg-rose-50 text-rose-900 border-r border-slate-200 font-extrabold">A</th>
                  <th className="py-2.5 px-3 w-16 text-center bg-indigo-100 text-indigo-950 font-extrabold">% Hadir</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 text-slate-800">
                {students.map((student) => {
                  let h = 0;
                  let s = 0;
                  let i = 0;
                  let a = 0;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-center font-mono text-slate-500 border-r border-slate-200">
                        {student.no}
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-600 border-r border-slate-200">
                        {student.nisn}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-200">
                        {student.nama}
                      </td>
                      <td className="py-2 px-2 text-center border-r border-slate-200">
                        <button
                          type="button"
                          onClick={() => {
                            const nextGender = student.gender === 'L' ? 'P' : 'L';
                            onUpdateStudentField?.(student.id, 'gender', nextGender);
                          }}
                          title="Klik untuk beralih Jenis Kelamin (L/P)"
                          className={`w-6 h-6 rounded-md font-extrabold text-xs transition-colors cursor-pointer inline-flex items-center justify-center ${
                            student.gender === 'L'
                              ? 'text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200'
                              : 'text-pink-700 bg-pink-50 hover:bg-pink-100 border border-pink-200'
                          }`}
                        >
                          {student.gender}
                        </button>
                      </td>

                      {/* Sessions cells */}
                      {sessions.map((ses) => {
                        const rec = ses.records[student.id];
                        const st = rec?.status || '';
                        if (st === 'H') h++;
                        else if (st === 'S') s++;
                        else if (st === 'I') i++;
                        else if (st === 'A') a++;

                        return (
                          <td
                            key={ses.id}
                            className="py-1.5 px-1 text-center border-r border-slate-200"
                            title={`${student.nama} - P${ses.pertemuanKe}: Klik untuk ubah (H->S->I->A->Kosongkan)`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                let nextSt: AttendanceStatus = 'H';
                                if (st === 'H') nextSt = 'S';
                                else if (st === 'S') nextSt = 'I';
                                else if (st === 'I') nextSt = 'A';
                                else if (st === 'A') nextSt = '' as AttendanceStatus;
                                else nextSt = 'H';
                                onUpdateStatus(ses.id, student.id, nextSt);
                              }}
                              className={`w-6 h-6 rounded text-xs font-extrabold transition-all cursor-pointer inline-flex items-center justify-center hover:scale-110 shadow-2xs ${
                                st === 'H'
                                  ? 'bg-emerald-600 text-white'
                                  : st === 'S'
                                  ? 'bg-blue-600 text-white'
                                  : st === 'I'
                                  ? 'bg-amber-500 text-white'
                                  : st === 'A'
                                  ? 'bg-rose-600 text-white'
                                  : 'text-slate-300 hover:text-slate-600 hover:bg-slate-200 bg-slate-50'
                              }`}
                            >
                              {st || '·'}
                            </button>
                          </td>
                        );
                      })}

                      {/* Totals */}
                      <td className="py-2 px-2 text-center bg-emerald-50/60 font-bold text-emerald-800 border-r border-slate-200">{h}</td>
                      <td className="py-2 px-2 text-center bg-blue-50/60 font-bold text-blue-800 border-r border-slate-200">{s}</td>
                      <td className="py-2 px-2 text-center bg-amber-50/60 font-bold text-amber-800 border-r border-slate-200">{i}</td>
                      <td className="py-2 px-2 text-center bg-rose-50/60 font-bold text-rose-800 border-r border-slate-200">{a}</td>
                      <td className="py-2 px-3 text-center bg-indigo-50/80 font-bold text-indigo-900">
                        {sessions.length > 0
                          ? `${Math.round((h / sessions.length) * 100)}%`
                          : '100%'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* WhatsApp Share Modal */}
      <WhatsAppShareModal
        isOpen={showWhatsAppModal}
        className={activeClassName}
        mataPelajaran={mataPelajaran}
        teacherName={teacherName}
        schoolName={schoolName}
        session={activeSession || null}
        students={students}
        onClose={() => setShowWhatsAppModal(false)}
      />
    </div>
  );
};
