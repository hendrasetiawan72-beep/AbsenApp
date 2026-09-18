import React, { useState, useMemo } from 'react';
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
  Save,
  Filter,
  AlertTriangle,
  Layers,
  BarChart3,
  Eye,
  Check,
  X,
  Globe,
} from 'lucide-react';
import { Student, AttendanceSession, AttendanceStatus, Gender, ClassRoom, TeacherProfile } from '../types';
import { exportAttendanceToExcel } from '../utils/excel';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { SharePublicAbsensiModal } from './SharePublicAbsensiModal';

const monthNamesIndo = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const parseDateToMonthInfo = (dateStr: string) => {
  if (!dateStr) {
    return { key: 'unknown', year: 0, monthNum: 0, monthName: 'Lainnya', label: 'Lainnya' };
  }
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
      const year = parseInt(parts[0], 10);
      const monthNum = parseInt(parts[1], 10);
      if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
        const y = isNaN(year) ? new Date().getFullYear() : year;
        return {
          key: `${y}-${String(monthNum).padStart(2, '0')}`,
          year: y,
          monthNum,
          monthName: monthNamesIndo[monthNum - 1],
          label: `${monthNamesIndo[monthNum - 1]} ${y > 0 ? y : ''}`.trim(),
        };
      }
    }
  }
  return { key: 'unknown', year: 0, monthNum: 0, monthName: 'Lainnya', label: 'Lainnya' };
};

const formatSessionDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const day = parts[2];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${parseInt(day, 10)} ${shortMonths[monthIndex]}`;
    }
    return `${day}/${parts[1]}`;
  }
  return dateStr;
};

const MONTH_THEMES = [
  {
    headerBg: 'bg-indigo-50 border-indigo-200 text-indigo-950',
    subHeaderBg: 'bg-indigo-50/40 text-indigo-900',
    titleText: 'text-indigo-900',
    borderSep: 'border-r-2 border-indigo-300',
    badge: 'bg-indigo-600 text-white',
    accentText: 'text-indigo-700',
    tabActive: 'bg-indigo-600 text-white shadow-xs',
  },
  {
    headerBg: 'bg-sky-50 border-sky-200 text-sky-950',
    subHeaderBg: 'bg-sky-50/40 text-sky-900',
    titleText: 'text-sky-900',
    borderSep: 'border-r-2 border-sky-300',
    badge: 'bg-sky-600 text-white',
    accentText: 'text-sky-700',
    tabActive: 'bg-sky-600 text-white shadow-xs',
  },
  {
    headerBg: 'bg-violet-50 border-violet-200 text-violet-950',
    subHeaderBg: 'bg-violet-50/40 text-violet-900',
    titleText: 'text-violet-900',
    borderSep: 'border-r-2 border-violet-300',
    badge: 'bg-violet-600 text-white',
    accentText: 'text-violet-700',
    tabActive: 'bg-violet-600 text-white shadow-xs',
  },
  {
    headerBg: 'bg-emerald-50 border-emerald-200 text-emerald-950',
    subHeaderBg: 'bg-emerald-50/40 text-emerald-900',
    titleText: 'text-emerald-900',
    borderSep: 'border-r-2 border-emerald-300',
    badge: 'bg-emerald-600 text-white',
    accentText: 'text-emerald-700',
    tabActive: 'bg-emerald-600 text-white shadow-xs',
  },
  {
    headerBg: 'bg-amber-50 border-amber-200 text-amber-950',
    subHeaderBg: 'bg-amber-50/40 text-amber-900',
    titleText: 'text-amber-900',
    borderSep: 'border-r-2 border-amber-300',
    badge: 'bg-amber-600 text-white',
    accentText: 'text-amber-700',
    tabActive: 'bg-amber-600 text-white shadow-xs',
  },
  {
    headerBg: 'bg-rose-50 border-rose-200 text-rose-950',
    subHeaderBg: 'bg-rose-50/40 text-rose-900',
    titleText: 'text-rose-900',
    borderSep: 'border-r-2 border-rose-300',
    badge: 'bg-rose-600 text-white',
    accentText: 'text-rose-700',
    tabActive: 'bg-rose-600 text-white shadow-xs',
  },
];

interface AttendanceViewProps {
  students: Student[];
  sessions: AttendanceSession[];
  activeClassId: string;
  activeClassName: string;
  mataPelajaran: string;
  teacherName: string;
  schoolName?: string;
  isCloudSaving?: boolean;
  onSaveAttendanceToCloud?: (sessionId?: string) => Promise<boolean | void> | void;
  onUpdateStatus: (sessionId: string, studentId: string, status: AttendanceStatus) => void;
  onUpdateCatatan: (sessionId: string, studentId: string, catatan: string) => void;
  onMarkAllPresent: (sessionId: string) => void;
  onResetSession: (sessionId: string) => void;
  onAddSession: (tanggal: string, pertemuanKe: number, topikMateri: string) => void;
  onUpdateSession?: (sessionId: string, updates: { tanggal?: string; pertemuanKe?: number; topikMateri?: string }) => void;
  onDeleteSession: (sessionId: string) => void;
  onEditStudent: (student: Student) => void;
  onUpdateStudentField?: (studentId: string, field: keyof Student, value: any) => void;
  onDeleteStudent: (studentId: string) => void;
  onOpenAddStudent: () => void;
  onOpenSpreadsheetImport: () => void;
  onOpenWorkspaceTab?: () => void;
  onOpenParentReportTab?: () => void;
  onOpenEditClass?: () => void;
  currentClass?: ClassRoom;
  teacher?: TeacherProfile;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  students,
  sessions,
  activeClassId,
  activeClassName,
  mataPelajaran,
  teacherName,
  schoolName = 'SMK Muhammadiyah Bawang',
  isCloudSaving = false,
  onSaveAttendanceToCloud,
  onUpdateStatus,
  onUpdateCatatan,
  onMarkAllPresent,
  onResetSession,
  onAddSession,
  onUpdateSession,
  onDeleteSession,
  onEditStudent,
  onUpdateStudentField,
  onDeleteStudent,
  onOpenAddStudent,
  onOpenSpreadsheetImport,
  onOpenWorkspaceTab,
  onOpenParentReportTab,
  onOpenEditClass,
  currentClass,
  teacher,
  onShowToast,
}) => {
  // Public Share Modal state
  const [showPublicShareModal, setShowPublicShareModal] = useState(false);

  // Fallback ClassRoom and TeacherProfile objects for sharing
  const classObj: ClassRoom = currentClass || {
    id: activeClassId,
    namaKelas: activeClassName,
    mataPelajaran: mataPelajaran,
    kkm: 75,
    totalSiswa: students.length,
  };

  const teacherObj: TeacherProfile = teacher || {
    id: 'guru-1',
    namaGuru: teacherName,
    nip: '',
    namaSekolah: schoolName,
    mataPelajaranUtama: mataPelajaran,
    tahunAjaran: '2025/2026',
    semester: 'Ganjil',
    isLoggedIn: true,
    activeClassId: activeClassId,
  };
  // Active session selector
  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    sessions[sessions.length - 1]?.id || ''
  );

  // Cloud Save States & UX feedback
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [isLocalSaving, setIsLocalSaving] = useState<boolean>(false);

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

  // Matrix View Month Grouping & Detection states
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('all');
  const [showMonthSubtotals, setShowMonthSubtotals] = useState<boolean>(true);
  const [matrixAbsenceFilter, setMatrixAbsenceFilter] = useState<'all' | 'alfa' | 'absence' | 'risk'>('all');
  const [matrixSearchQuery, setMatrixSearchQuery] = useState<string>('');

  // Group all sessions chronologically by month
  const monthGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        year: number;
        monthNum: number;
        monthName: string;
        label: string;
        sessions: AttendanceSession[];
      }
    >();

    // Sort sessions chronologically by date and pertemuanKe
    const sortedSessions = [...sessions].sort((a, b) => {
      if (a.tanggal !== b.tanggal) return a.tanggal.localeCompare(b.tanggal);
      return a.pertemuanKe - b.pertemuanKe;
    });

    sortedSessions.forEach((ses) => {
      const info = parseDateToMonthInfo(ses.tanggal);
      if (!map.has(info.key)) {
        map.set(info.key, {
          key: info.key,
          year: info.year,
          monthNum: info.monthNum,
          monthName: info.monthName,
          label: info.label,
          sessions: [],
        });
      }
      map.get(info.key)!.sessions.push(ses);
    });

    return Array.from(map.values()).map((g) => {
      let totalH = 0;
      let totalS = 0;
      let totalI = 0;
      let totalA = 0;
      const studentsWithAlfa: { student: Student; count: number }[] = [];
      const studentsWithAbsence: { student: Student; h: number; s: number; i: number; a: number }[] = [];

      students.forEach((std) => {
        let stdH = 0;
        let stdS = 0;
        let stdI = 0;
        let stdA = 0;

        g.sessions.forEach((ses) => {
          const rec = ses.records[std.id]?.status;
          if (rec === 'H') stdH++;
          else if (rec === 'S') stdS++;
          else if (rec === 'I') stdI++;
          else if (rec === 'A') stdA++;
        });

        totalH += stdH;
        totalS += stdS;
        totalI += stdI;
        totalA += stdA;

        if (stdA > 0) {
          studentsWithAlfa.push({ student: std, count: stdA });
        }
        if (stdS > 0 || stdI > 0 || stdA > 0) {
          studentsWithAbsence.push({ student: std, h: stdH, s: stdS, i: stdI, a: stdA });
        }
      });

      const totalCheck = totalH + totalS + totalI + totalA;
      const percent = totalCheck > 0 ? Math.round((totalH / totalCheck) * 100) : 100;

      return {
        ...g,
        stats: {
          totalH,
          totalS,
          totalI,
          totalA,
          totalCheck,
          percent,
          studentsWithAlfa,
          studentsWithAbsence,
        },
      };
    });
  }, [sessions, students]);

  // Filtered month groups to display in matrix table
  const displayedMonthGroups = useMemo(() => {
    if (selectedMonthFilter === 'all') {
      return monthGroups;
    }
    return monthGroups.filter((g) => g.key === selectedMonthFilter);
  }, [monthGroups, selectedMonthFilter]);

  // Summary statistics for the currently displayed month groups
  const activeDisplayedStats = useMemo(() => {
    let totalH = 0;
    let totalS = 0;
    let totalI = 0;
    let totalA = 0;
    const studentsWithAlfaMap = new Map<string, { student: Student; count: number }>();
    const studentsWithAbsenceMap = new Map<string, { student: Student; count: number }>();

    displayedMonthGroups.forEach((g) => {
      totalH += g.stats.totalH;
      totalS += g.stats.totalS;
      totalI += g.stats.totalI;
      totalA += g.stats.totalA;

      g.stats.studentsWithAlfa.forEach(({ student, count }) => {
        const prev = studentsWithAlfaMap.get(student.id);
        if (prev) {
          prev.count += count;
        } else {
          studentsWithAlfaMap.set(student.id, { student, count });
        }
      });

      g.stats.studentsWithAbsence.forEach(({ student, s, i, a }) => {
        const totalAbs = s + i + a;
        const prev = studentsWithAbsenceMap.get(student.id);
        if (prev) {
          prev.count += totalAbs;
        } else {
          studentsWithAbsenceMap.set(student.id, { student, count: totalAbs });
        }
      });
    });

    const totalCheck = totalH + totalS + totalI + totalA;
    const percent = totalCheck > 0 ? Math.round((totalH / totalCheck) * 100) : 100;

    return {
      totalH,
      totalS,
      totalI,
      totalA,
      totalCheck,
      percent,
      studentsWithAlfa: Array.from(studentsWithAlfaMap.values()),
      studentsWithAbsence: Array.from(studentsWithAbsenceMap.values()),
    };
  }, [displayedMonthGroups]);

  // Filter students displayed in the matrix table
  const filteredMatrixStudents = useMemo(() => {
    return students.filter((std) => {
      // 1. Search Query
      if (matrixSearchQuery.trim()) {
        const q = matrixSearchQuery.toLowerCase();
        const matchName = std.nama.toLowerCase().includes(q);
        const matchNis = std.nisn.toLowerCase().includes(q);
        if (!matchName && !matchNis) return false;
      }

      // 2. Absence / Alfa Filter for displayed groups
      let stdH = 0;
      let stdS = 0;
      let stdI = 0;
      let stdA = 0;
      let totalSes = 0;

      displayedMonthGroups.forEach((g) => {
        g.sessions.forEach((ses) => {
          totalSes++;
          const rec = ses.records[std.id]?.status;
          if (rec === 'H') stdH++;
          else if (rec === 'S') stdS++;
          else if (rec === 'I') stdI++;
          else if (rec === 'A') stdA++;
        });
      });

      if (matrixAbsenceFilter === 'alfa') {
        return stdA > 0;
      }
      if (matrixAbsenceFilter === 'absence') {
        return stdS + stdI + stdA > 0;
      }
      if (matrixAbsenceFilter === 'risk') {
        const pct = totalSes > 0 ? (stdH / totalSes) * 100 : 100;
        return pct < 80 || stdA >= 2;
      }

      return true;
    });
  }, [students, matrixSearchQuery, displayedMonthGroups, matrixAbsenceFilter]);

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

  // State & Handlers for Editing Existing Session (Topik/Materi, Tanggal, Pertemuan Ke)
  const [editingSession, setEditingSession] = useState<AttendanceSession | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editPertemuanKe, setEditPertemuanKe] = useState<number>(1);
  const [editTopic, setEditTopic] = useState('');

  const handleStartEditSession = (session: AttendanceSession) => {
    setEditingSession(session);
    setEditDate(session.tanggal);
    setEditPertemuanKe(session.pertemuanKe);
    setEditTopic(session.topikMateri || '');
  };

  const handleSaveEditSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    if (!editDate) {
      alert('Mohon tentukan tanggal pertemuan');
      return;
    }
    if (onUpdateSession) {
      onUpdateSession(editingSession.id, {
        tanggal: editDate,
        pertemuanKe: Number(editPertemuanKe) || 1,
        topikMateri: editTopic.trim() || `Pertemuan ke-${editPertemuanKe}`,
      });
    }
    if (onShowToast) {
      onShowToast('Data pertemuan berhasil diperbarui', 'success');
    }
    setEditingSession(null);
  };

  const handleExportExcel = () => {
    exportAttendanceToExcel(activeClassName, mataPelajaran, teacherName, students, sessions);
  };

  const handleSaveToCloud = async (targetSessionId?: string) => {
    const idToSave = targetSessionId || currentSessionId;
    if (!idToSave && viewMode !== 'matrix') return;
    setIsLocalSaving(true);
    try {
      if (onSaveAttendanceToCloud) {
        await onSaveAttendanceToCloud(idToSave);
      }
      setHasUnsavedChanges(false);
      const timeStr =
        new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB';
      setLastSavedTime(timeStr);
    } catch (err) {
      console.error('Error saving attendance to cloud:', err);
    } finally {
      setIsLocalSaving(false);
    }
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
                  onClick={() => handleStartEditSession(activeSession)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/90 px-2 py-0.5 rounded-md transition-colors cursor-pointer shadow-2xs ml-1"
                  title="Edit manual topik, materi pembelajaran, dan tanggal pertemuan ini"
                >
                  <Edit3 className="w-3 h-3 text-indigo-600" />
                  <span>Edit Pertemuan</span>
                </button>
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
              <div className="flex items-center gap-1">
                <div className="relative inline-block">
                  <select
                    aria-label="Pilih Pertemuan"
                    value={currentSessionId}
                    onChange={(e) => {
                      setSelectedSessionId(e.target.value);
                      setHasUnsavedChanges(false);
                    }}
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
                {activeSession && (
                  <button
                    type="button"
                    onClick={() => handleStartEditSession(activeSession)}
                    className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
                    title={`Edit Pertemuan ke-${activeSession.pertemuanKe} (Topik, Materi, Tanggal)`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
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

            {/* Tombol Simpan Presensi ke Cloud (Save) di Top Bar */}
            {activeSession && (
              <button
                type="button"
                id="btn-top-save-attendance"
                onClick={() => handleSaveToCloud()}
                disabled={isLocalSaving || isCloudSaving}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 ${
                  hasUnsavedChanges
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400/60'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                }`}
                title="Simpan Hasil Presensi ke Cloud Firestore"
              >
                {isLocalSaving || isCloudSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 text-white" />
                    <span>Simpan (Save)</span>
                    {hasUnsavedChanges && (
                      <span className="w-2 h-2 rounded-full bg-amber-300 ml-0.5 animate-ping" title="Ada perubahan belum tersimpan" />
                    )}
                  </>
                )}
              </button>
            )}

            {/* Tombol Link Preview Orang Tua Real-Time (Absen Harian & Rekap) */}
            <button
              type="button"
              id="btn-public-absen-share"
              onClick={() => setShowPublicShareModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer ring-1 ring-teal-400/50 hover:shadow-md"
              title="Buka Link Preview Orang Tua Real-Time (Absen Harian & Rekapitulasi)"
            >
              <Globe className="w-3.5 h-3.5 text-teal-100" />
              <span>Link Preview Ortu</span>
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            </button>

            {activeSession && (
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                title="Kirim Rekap Absensi Pertemuan Ini ke WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
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
                <span className="hidden md:inline">Laporan Ortu</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-xs transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
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
                  placeholder="Cari nama siswa atau catatan..."
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
                    onClick={() => {
                      setHasUnsavedChanges(true);
                      onMarkAllPresent(currentSessionId);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                    title="Set status semua siswa dalam pertemuan ini menjadi Masuk (Hadir)"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Set Semua Masuk</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Reset status absensi pada pertemuan ini?')) {
                        setHasUnsavedChanges(true);
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
                title="Aktifkan mode edit cepat untuk mengubah nama siswa langsung di tabel"
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
                    <th className="py-3 px-4">Nama Lengkap Siswa</th>
                    <th className="py-3 px-3 w-24 text-center">Gender</th>
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
                      <td colSpan={6} className="text-center py-12 text-slate-400">
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

                          {/* Nama Lengkap */}
                          <td className="py-3 px-4">
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

                          {/* Gender - Read-only di bagian absen, edit hanya di menu Data Siswa */}
                          <td className="py-3 px-3 text-center">
                            <span
                              title={`Jenis Kelamin: ${student.gender === 'L' ? 'Laki-laki (♂)' : 'Perempuan (♀)'} • Diedit hanya melalui menu Data Siswa`}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border select-none ${
                                student.gender === 'L'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200/90 shadow-2xs'
                                  : 'bg-pink-50 text-pink-700 border-pink-200/90 shadow-2xs'
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
                            </span>
                          </td>

                          {/* Attendance Status Selector Buttons (Pilih salah satu / Klik lagi untuk reset) */}
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 gap-1 shadow-2xs">
                              {/* Hadir (H) */}
                              <button
                                type="button"
                                title={currentStatus === 'H' ? 'Sudah Hadir (Klik untuk kosongkan)' : 'Tandai Hadir'}
                                onClick={() => {
                                  setHasUnsavedChanges(true);
                                  onUpdateStatus(
                                    currentSessionId,
                                    student.id,
                                    currentStatus === 'H' ? ('' as AttendanceStatus) : 'H'
                                  );
                                }}
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
                                onClick={() => {
                                  setHasUnsavedChanges(true);
                                  onUpdateStatus(
                                    currentSessionId,
                                    student.id,
                                    currentStatus === 'S' ? ('' as AttendanceStatus) : 'S'
                                  );
                                }}
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
                                onClick={() => {
                                  setHasUnsavedChanges(true);
                                  onUpdateStatus(
                                    currentSessionId,
                                    student.id,
                                    currentStatus === 'I' ? ('' as AttendanceStatus) : 'I'
                                  );
                                }}
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
                                onClick={() => {
                                  setHasUnsavedChanges(true);
                                  onUpdateStatus(
                                    currentSessionId,
                                    student.id,
                                    currentStatus === 'A' ? ('' as AttendanceStatus) : 'A'
                                  );
                                }}
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
                              onChange={(e) => {
                                setHasUnsavedChanges(true);
                                onUpdateCatatan(
                                  currentSessionId,
                                  student.id,
                                  e.target.value
                                );
                              }}
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

          {/* ============================================================ */}
          {/* SECTION AKHIR SETELAH MENGABSEN: TOMBOL SIMPAN KE CLOUD */}
          {/* ============================================================ */}
          {activeSession && (
            <div
              id="attendance-save-bar-bottom"
              className="mt-6 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                      hasUnsavedChanges
                        ? 'bg-amber-50 border-amber-300 text-amber-600 ring-4 ring-amber-50'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-600 ring-4 ring-emerald-50'
                    }`}
                  >
                    {hasUnsavedChanges ? (
                      <Cloud className="w-7 h-7 animate-pulse" />
                    ) : (
                      <CheckCircle className="w-7 h-7" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">
                        Selesai Mengabsen Siswa Pertemuan Ke-{activeSession.pertemuanKe}?
                      </h3>
                      {hasUnsavedChanges ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                          Ada Perubahan Belum Disimpan ke Cloud
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          Data Tersimpan di Cloud
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 mt-1.5">
                      Rekap Kehadiran: <b className="text-emerald-700">{hadirCount} Hadir</b>,{' '}
                      <b className="text-blue-700">{sakitCount} Sakit</b>,{' '}
                      <b className="text-amber-700">{izinCount} Izin</b>,{' '}
                      <b className="text-rose-700">{alfaCount} Alfa</b>
                      {unmarkedCount > 0 ? (
                        <span className="text-amber-700 font-bold">
                          {' '}
                          • ({unmarkedCount} siswa belum diabsen)
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-bold">
                          {' '}
                          • (Lengkap! Semua {totalStudents} siswa telah diabsen)
                        </span>
                      )}
                    </p>

                    <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-2 flex-wrap">
                      <span>
                        Tanggal: <b>{activeSession.tanggal}</b>
                      </span>
                      <span>•</span>
                      <span>
                        Topik/Materi: <b>{activeSession.topikMateri || 'Tanpa topik'}</b>
                      </span>
                      {lastSavedTime ? (
                        <>
                          <span>•</span>
                          <span className="text-emerald-700 font-semibold">
                            Terakhir disimpan: <b>{lastSavedTime}</b>
                          </span>
                        </>
                      ) : (
                        <>
                          <span>•</span>
                          <span className="text-slate-400">
                            Klik tombol Save di samping agar data tersimpan aman di Cloud Firestore.
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <button
                    type="button"
                    id="btn-save-attendance-bottom"
                    onClick={() => handleSaveToCloud()}
                    disabled={isLocalSaving || isCloudSaving}
                    className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLocalSaving || isCloudSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Menyimpan ke Cloud Firestore...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 text-white" />
                        <span>Simpan Presensi ke Cloud (Save)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowWhatsAppModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-3.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
                    title="Kirim Rekap Harian ke WhatsApp Orang Tua"
                  >
                    <Share2 className="w-4 h-4 text-emerald-600" />
                    <span>Share WA</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MATRIX VIEW (ALL SESSIONS SPREADSHEET TABLE GROUPED BY MONTH) */}
      {viewMode === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-0">
          {/* Top Bar Matrix */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/90">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Rekap Matriks Presensi
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {monthGroups.length} Bulan • {sessions.length} Sesi Pertemuan
                </span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Matriks Presensi Siswa Terkelompok per Bulan
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pertemuan dikelompokkan berdasarkan bulan kalender untuk mendeteksi ketidakhadiran (Hadir, Sakit, Izin, Alfa) siswa secara cepat.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                id="btn-save-matrix-top"
                onClick={() => handleSaveToCloud()}
                disabled={isLocalSaving || isCloudSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isLocalSaving || isCloudSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan ke Cloud (Save)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
                title="Download spreadsheet matriks absensi lengkap dengan pemisahan bulan"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Download Excel Matriks</span>
              </button>
            </div>
          </div>

          {/* Month Tabs Navigator & Quick Filters */}
          <div className="p-4 border-b border-slate-200 bg-white">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Month Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-thin">
                <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1 shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  Bulan:
                </span>

                {/* All Months Tab */}
                <button
                  type="button"
                  onClick={() => setSelectedMonthFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 inline-flex items-center gap-1.5 ${
                    selectedMonthFilter === 'all'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Semua Bulan</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      selectedMonthFilter === 'all'
                        ? 'bg-indigo-700 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {sessions.length} P
                  </span>
                </button>

                {/* Individual Month Tabs */}
                {monthGroups.map((group, idx) => {
                  const isActive = selectedMonthFilter === group.key;
                  const theme = MONTH_THEMES[idx % MONTH_THEMES.length];
                  const hasAlfa = group.stats.totalA > 0;
                  const hasAbsence = group.stats.totalS > 0 || group.stats.totalI > 0;

                  return (
                    <button
                      key={group.key}
                      type="button"
                      onClick={() => setSelectedMonthFilter(group.key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 inline-flex items-center gap-1.5 border ${
                        isActive
                          ? `${theme.tabActive} border-transparent`
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span>{group.monthName}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                          isActive
                            ? 'bg-black/20 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {group.sessions.length} P
                      </span>

                      {/* Warning pill if has Alfa in this month */}
                      {hasAlfa && (
                        <span
                          className="px-1.5 py-0.2 text-[10px] rounded-full font-extrabold bg-rose-500 text-white shrink-0"
                          title={`${group.stats.totalA} kasus Alfa di bulan ${group.monthName}`}
                        >
                          {group.stats.totalA} Alfa
                        </span>
                      )}
                      {!hasAlfa && hasAbsence && (
                        <span
                          className={`px-1.5 py-0.2 text-[10px] rounded-full font-medium ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                          title={`${group.stats.totalS + group.stats.totalI} Sakit/Izin`}
                        >
                          {group.stats.totalS + group.stats.totalI} S/I
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Subtotal Toggle & Quick Detection Stats */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowMonthSubtotals((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    showMonthSubtotals
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-800 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  title="Tampilkan kolom rekap Hadir, Sakit, Izin, Alfa untuk setiap bulan"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Subtotal Bulanan (H/S/I/A)</span>
                  <span
                    className={`w-4 h-4 rounded-full text-[10px] font-black inline-flex items-center justify-center ${
                      showMonthSubtotals
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {showMonthSubtotals ? '✓' : 'off'}
                  </span>
                </button>
              </div>
            </div>

            {/* Quick Absence Detection Callout Strip */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Detection Metrics for Current Selection */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-500">
                  Ringkasan{' '}
                  {selectedMonthFilter === 'all'
                    ? 'Semua Bulan'
                    : monthGroups.find((g) => g.key === selectedMonthFilter)?.label || 'Bulan Ini'}
                  :
                </span>

                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                  <span>Hadir (H):</span>
                  <span className="font-extrabold">{activeDisplayedStats.totalH}</span>
                  <span className="text-[10px] opacity-75">({activeDisplayedStats.percent}%)</span>
                </div>

                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold">
                  <span>Sakit (S):</span>
                  <span className="font-extrabold">{activeDisplayedStats.totalS}</span>
                </div>

                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                  <span>Izin (I):</span>
                  <span className="font-extrabold">{activeDisplayedStats.totalI}</span>
                </div>

                <div
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold border ${
                    activeDisplayedStats.totalA > 0
                      ? 'bg-rose-100 text-rose-800 border-rose-300 ring-2 ring-rose-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <AlertTriangle
                    className={`w-3.5 h-3.5 ${
                      activeDisplayedStats.totalA > 0 ? 'text-rose-600' : 'text-slate-400'
                    }`}
                  />
                  <span>Alfa (A):</span>
                  <span>{activeDisplayedStats.totalA}</span>
                </div>
              </div>

              {/* Student Filter Toolbar */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search in matrix */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={matrixSearchQuery}
                    onChange={(e) => setMatrixSearchQuery(e.target.value)}
                    placeholder="Cari siswa di matriks..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44 lg:w-52"
                  />
                  {matrixSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setMatrixSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Absence filter chips */}
                <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setMatrixAbsenceFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      matrixAbsenceFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semua ({students.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatrixAbsenceFilter('alfa')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      matrixAbsenceFilter === 'alfa'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'text-rose-700 hover:bg-rose-50'
                    }`}
                    title="Hanya tampilkan siswa yang tercatat Alfa"
                  >
                    <span>Ada Alfa</span>
                    <span className="text-[10px] px-1 rounded-full bg-rose-200/50">
                      {activeDisplayedStats.studentsWithAlfa.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatrixAbsenceFilter('absence')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      matrixAbsenceFilter === 'absence'
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : 'text-amber-800 hover:bg-amber-50'
                    }`}
                    title="Hanya tampilkan siswa yang pernah tidak hadir (Sakit, Izin, atau Alfa)"
                  >
                    Pernah Absen ({activeDisplayedStats.studentsWithAbsence.length})
                  </button>
                </div>
              </div>
            </div>

            {/* Alfa Detection Alert Notice */}
            {activeDisplayedStats.studentsWithAlfa.length > 0 && matrixAbsenceFilter !== 'alfa' && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50/90 border border-rose-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-bold text-rose-900">
                    Terdeteksi {activeDisplayedStats.studentsWithAlfa.length} siswa memiliki catatan Alfa (A):
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {activeDisplayedStats.studentsWithAlfa.slice(0, 4).map(({ student, count }) => (
                      <span
                        key={student.id}
                        className="px-2 py-0.5 rounded-md font-extrabold bg-white text-rose-800 border border-rose-200 text-[11px] shadow-2xs"
                      >
                        {student.nama} ({count}x)
                      </span>
                    ))}
                    {activeDisplayedStats.studentsWithAlfa.length > 4 && (
                      <span className="text-rose-700 text-[11px] font-bold">
                        +{activeDisplayedStats.studentsWithAlfa.length - 4} siswa lainnya
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMatrixAbsenceFilter('alfa')}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-colors shadow-2xs"
                >
                  Fokus Siswa Alfa
                </button>
              </div>
            )}
          </div>

          {/* Matrix Spreadsheet Table */}
          <div className="overflow-x-auto relative">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-300">
                {/* Level 1: Month Group Super Header */}
                <tr>
                  <th
                    rowSpan={2}
                    className="py-3 px-3 w-10 text-center border-r border-slate-200 sticky left-0 bg-slate-100 z-20"
                  >
                    No
                  </th>
                  <th
                    rowSpan={2}
                    className="py-3 px-3 min-w-[180px] border-r border-slate-200 sticky left-10 bg-slate-100 z-20 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]"
                  >
                    Nama Siswa
                  </th>
                  <th
                    rowSpan={2}
                    className="py-3 px-2 w-12 text-center border-r border-slate-200 bg-slate-100 z-10"
                  >
                    L/P
                  </th>

                  {/* Month Group Super Columns */}
                  {displayedMonthGroups.map((group, gIdx) => {
                    const theme = MONTH_THEMES[gIdx % MONTH_THEMES.length];
                    const colSpan = group.sessions.length + (showMonthSubtotals ? 4 : 0);

                    return (
                      <th
                        key={`month-hdr-${group.key}`}
                        colSpan={colSpan}
                        className={`py-2.5 px-3 text-center border-b border-slate-300 font-black tracking-wide ${theme.headerBg} ${theme.borderSep}`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="font-extrabold text-xs">
                            BULAN {group.monthName.toUpperCase()} {group.year > 0 ? group.year : ''}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${theme.badge}`}
                          >
                            {group.sessions.length} Pertemuan
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white text-slate-700 border border-slate-200/80 shadow-2xs">
                            {group.stats.percent}% Hadir
                          </span>
                          {group.stats.totalA > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-rose-600 text-white">
                              {group.stats.totalA} Alfa
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}

                  {/* Overall Semester Super Column */}
                  <th
                    colSpan={5}
                    className="py-2.5 px-3 text-center bg-indigo-100 text-indigo-950 font-black border-b border-indigo-200"
                  >
                    TOTAL KESELURUHAN (SEMESTER)
                  </th>
                </tr>

                {/* Level 2: Sub-headers for Sessions & Subtotals */}
                <tr className="bg-slate-50 text-[10px] text-slate-700 font-bold border-b border-slate-300">
                  {displayedMonthGroups.map((group, gIdx) => {
                    const theme = MONTH_THEMES[gIdx % MONTH_THEMES.length];

                    return (
                      <React.Fragment key={`month-subcols-${group.key}`}>
                        {/* Session columns */}
                        {group.sessions.map((ses, sIdx) => {
                          const isLast = sIdx === group.sessions.length - 1 && !showMonthSubtotals;
                          return (
                            <th
                              key={ses.id}
                              className={`py-1.5 px-1 w-14 text-center border-r ${
                                isLast ? theme.borderSep : 'border-slate-200'
                              } ${theme.subHeaderBg}`}
                              title={`${group.label} • Pertemuan ke-${ses.pertemuanKe}\nTanggal: ${ses.tanggal}\nTopik: ${ses.topikMateri}\n(Klik tombol pensil untuk edit materi & tanggal)`}
                            >
                              <div className="flex items-center justify-center gap-0.5">
                                <span className={`font-black text-[11px] ${theme.titleText}`}>
                                  P{ses.pertemuanKe}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleStartEditSession(ses)}
                                  className="text-slate-400 hover:text-indigo-600 p-0.5 rounded cursor-pointer transition-colors"
                                  title={`Edit Pertemuan ke-${ses.pertemuanKe} (Topik & Tanggal)`}
                                >
                                  <Edit3 className="w-2.5 h-2.5" />
                                </button>
                              </div>
                              <span className="text-[9px] text-slate-500 font-mono block truncate">
                                {formatSessionDate(ses.tanggal)}
                              </span>
                            </th>
                          );
                        })}

                        {/* Monthly Subtotal columns (H, S, I, A) */}
                        {showMonthSubtotals && (
                          <>
                            <th
                              className="py-2 px-1.5 w-8 text-center bg-emerald-100/90 text-emerald-950 border-r border-slate-200 font-black text-[10px]"
                              title={`Total Hadir bulan ${group.monthName}`}
                            >
                              H
                            </th>
                            <th
                              className="py-2 px-1.5 w-8 text-center bg-blue-100/90 text-blue-950 border-r border-slate-200 font-black text-[10px]"
                              title={`Total Sakit bulan ${group.monthName}`}
                            >
                              S
                            </th>
                            <th
                              className="py-2 px-1.5 w-8 text-center bg-amber-100/90 text-amber-950 border-r border-slate-200 font-black text-[10px]"
                              title={`Total Izin bulan ${group.monthName}`}
                            >
                              I
                            </th>
                            <th
                              className={`py-2 px-1.5 w-8 text-center bg-rose-100/90 text-rose-950 font-black text-[10px] ${theme.borderSep}`}
                              title={`Total Alfa bulan ${group.monthName}`}
                            >
                              A
                            </th>
                          </>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {/* Grand Totals */}
                  <th
                    className="py-2 px-2 w-10 text-center bg-emerald-100 text-emerald-900 border-r border-slate-200 font-black"
                    title="Total Hadir Seluruh Sesi"
                  >
                    H
                  </th>
                  <th
                    className="py-2 px-2 w-10 text-center bg-blue-100 text-blue-900 border-r border-slate-200 font-black"
                    title="Total Sakit Seluruh Sesi"
                  >
                    S
                  </th>
                  <th
                    className="py-2 px-2 w-10 text-center bg-amber-100 text-amber-900 border-r border-slate-200 font-black"
                    title="Total Izin Seluruh Sesi"
                  >
                    I
                  </th>
                  <th
                    className="py-2 px-2 w-10 text-center bg-rose-100 text-rose-900 border-r border-slate-200 font-black"
                    title="Total Alfa Seluruh Sesi"
                  >
                    A
                  </th>
                  <th
                    className="py-2 px-3 w-16 text-center bg-indigo-100 text-indigo-950 font-black"
                    title="Persentase Kehadiran Total"
                  >
                    % Hadir
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 text-slate-800">
                {filteredMatrixStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={
                        3 +
                        displayedMonthGroups.reduce(
                          (acc, g) => acc + g.sessions.length + (showMonthSubtotals ? 4 : 0),
                          0
                        ) +
                        5
                      }
                      className="py-12 text-center text-slate-400 bg-slate-50/50"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertTriangle className="w-8 h-8 text-slate-300" />
                        <span className="font-bold text-slate-600 text-sm">
                          Tidak ada siswa yang sesuai dengan filter
                        </span>
                        <span className="text-xs text-slate-400">
                          Coba ubah filter absensi atau hapus kata kunci pencarian.
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setMatrixSearchQuery('');
                            setMatrixAbsenceFilter('all');
                          }}
                          className="mt-2 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 rounded-lg cursor-pointer"
                        >
                          Reset Semua Filter
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMatrixStudents.map((student) => {
                    // Cumulative Grand Totals for this student
                    let grandH = 0;
                    let grandS = 0;
                    let grandI = 0;
                    let grandA = 0;

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* No */}
                        <td className="py-2 px-3 text-center font-mono text-slate-500 border-r border-slate-200 sticky left-0 bg-white z-10">
                          {student.no}
                        </td>

                        {/* Nama Siswa */}
                        <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-200 sticky left-10 bg-white z-10 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                          <div className="flex flex-col">
                            <span className="truncate">{student.nama}</span>
                            <span className="text-[10px] font-mono text-slate-400 font-normal">
                              {student.nisn}
                            </span>
                          </div>
                        </td>

                        {/* Gender */}
                        <td className="py-2 px-2 text-center border-r border-slate-200 bg-white">
                          <span
                            title={`Jenis Kelamin: ${student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}`}
                            className={`w-6 h-6 rounded-md font-extrabold text-xs inline-flex items-center justify-center select-none ${
                              student.gender === 'L'
                                ? 'text-blue-700 bg-blue-50 border border-blue-200'
                                : 'text-pink-700 bg-pink-50 border border-pink-200'
                            }`}
                          >
                            {student.gender}
                          </span>
                        </td>

                        {/* Month Groups & Sessions Cells */}
                        {displayedMonthGroups.map((group, gIdx) => {
                          const theme = MONTH_THEMES[gIdx % MONTH_THEMES.length];
                          let mH = 0;
                          let mS = 0;
                          let mI = 0;
                          let mA = 0;

                          return (
                            <React.Fragment key={`std-${student.id}-month-${group.key}`}>
                              {/* Session cells */}
                              {group.sessions.map((ses, sIdx) => {
                                const rec = ses.records[student.id];
                                const st = rec?.status || '';
                                if (st === 'H') {
                                  mH++;
                                  grandH++;
                                } else if (st === 'S') {
                                  mS++;
                                  grandS++;
                                } else if (st === 'I') {
                                  mI++;
                                  grandI++;
                                } else if (st === 'A') {
                                  mA++;
                                  grandA++;
                                }

                                const isLast = sIdx === group.sessions.length - 1 && !showMonthSubtotals;

                                return (
                                  <td
                                    key={ses.id}
                                    className={`py-1.5 px-1 text-center border-r ${
                                      isLast ? theme.borderSep : 'border-slate-200'
                                    } ${
                                      st === 'A'
                                        ? 'bg-rose-50/70'
                                        : st === 'S'
                                        ? 'bg-blue-50/40'
                                        : st === 'I'
                                        ? 'bg-amber-50/40'
                                        : ''
                                    }`}
                                    title={`${student.nama} • ${group.monthName} P${ses.pertemuanKe}: Klik untuk ubah (H → S → I → A → Kosongkan)`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setHasUnsavedChanges(true);
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
                                          ? 'bg-rose-600 text-white ring-2 ring-rose-400 font-black'
                                          : 'text-slate-300 hover:text-slate-600 hover:bg-slate-200 bg-slate-50'
                                      }`}
                                    >
                                      {st || '·'}
                                    </button>
                                  </td>
                                );
                              })}

                              {/* Monthly Subtotals for this student */}
                              {showMonthSubtotals && (
                                <>
                                  <td className="py-2 px-1 text-center bg-emerald-50/50 font-bold text-emerald-800 border-r border-slate-200">
                                    {mH}
                                  </td>
                                  <td className="py-2 px-1 text-center bg-blue-50/50 font-bold text-blue-800 border-r border-slate-200">
                                    {mS}
                                  </td>
                                  <td className="py-2 px-1 text-center bg-amber-50/50 font-bold text-amber-800 border-r border-slate-200">
                                    {mI}
                                  </td>
                                  <td
                                    className={`py-2 px-1 text-center font-black ${theme.borderSep} ${
                                      mA > 0
                                        ? 'bg-rose-100 text-rose-800 font-black'
                                        : 'bg-rose-50/30 text-slate-400'
                                    }`}
                                  >
                                    {mA}
                                  </td>
                                </>
                              )}
                            </React.Fragment>
                          );
                        })}

                        {/* Grand Totals */}
                        <td className="py-2 px-2 text-center bg-emerald-50/70 font-black text-emerald-800 border-r border-slate-200">
                          {grandH}
                        </td>
                        <td className="py-2 px-2 text-center bg-blue-50/70 font-black text-blue-800 border-r border-slate-200">
                          {grandS}
                        </td>
                        <td className="py-2 px-2 text-center bg-amber-50/70 font-black text-amber-800 border-r border-slate-200">
                          {grandI}
                        </td>
                        <td
                          className={`py-2 px-2 text-center border-r border-slate-200 font-black ${
                            grandA > 0
                              ? 'bg-rose-100 text-rose-800 ring-1 ring-rose-300'
                              : 'bg-rose-50/50 text-slate-400'
                          }`}
                        >
                          {grandA}
                        </td>
                        <td className="py-2 px-3 text-center bg-indigo-50 font-black text-indigo-950">
                          {sessions.length > 0
                            ? `${Math.round((grandH / sessions.length) * 100)}%`
                            : '100%'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Table Footer: Class Attendance Rate per Meeting */}
              {filteredMatrixStudents.length > 0 && (
                <tfoot className="bg-slate-100 font-black text-[11px] text-slate-800 border-t-2 border-slate-300">
                  <tr>
                    <td
                      colSpan={3}
                      className="py-2.5 px-3 font-extrabold text-slate-900 border-r border-slate-200 sticky left-0 bg-slate-100 z-10"
                    >
                      Total Siswa Hadir (H)
                    </td>

                    {/* Per Session totals */}
                    {displayedMonthGroups.map((group, gIdx) => {
                      const theme = MONTH_THEMES[gIdx % MONTH_THEMES.length];
                      return (
                        <React.Fragment key={`foot-month-${group.key}`}>
                          {group.sessions.map((ses, sIdx) => {
                            let countPresent = 0;
                            filteredMatrixStudents.forEach((std) => {
                              if (ses.records[std.id]?.status === 'H') countPresent++;
                            });
                            const isLast = sIdx === group.sessions.length - 1 && !showMonthSubtotals;
                            return (
                              <td
                                key={`foot-ses-${ses.id}`}
                                className={`py-2 px-1 text-center font-mono border-r ${
                                  isLast ? theme.borderSep : 'border-slate-200'
                                } bg-indigo-50/30 text-indigo-900`}
                                title={`Hadir: ${countPresent} dari ${filteredMatrixStudents.length} siswa`}
                              >
                                {countPresent}
                              </td>
                            );
                          })}

                          {showMonthSubtotals && (
                            <>
                              <td className="py-2 px-1 text-center bg-emerald-100 text-emerald-950 border-r border-slate-200 font-mono">
                                {group.stats.totalH}
                              </td>
                              <td className="py-2 px-1 text-center bg-blue-100 text-blue-950 border-r border-slate-200 font-mono">
                                {group.stats.totalS}
                              </td>
                              <td className="py-2 px-1 text-center bg-amber-100 text-amber-950 border-r border-slate-200 font-mono">
                                {group.stats.totalI}
                              </td>
                              <td
                                className={`py-2 px-1 text-center bg-rose-100 text-rose-950 font-mono ${theme.borderSep}`}
                              >
                                {group.stats.totalA}
                              </td>
                            </>
                          )}
                        </React.Fragment>
                      );
                    })}

                    {/* Grand totals foot */}
                    <td className="py-2 px-2 text-center bg-emerald-200 text-emerald-950 border-r border-slate-200 font-mono">
                      {activeDisplayedStats.totalH}
                    </td>
                    <td className="py-2 px-2 text-center bg-blue-200 text-blue-950 border-r border-slate-200 font-mono">
                      {activeDisplayedStats.totalS}
                    </td>
                    <td className="py-2 px-2 text-center bg-amber-200 text-amber-950 border-r border-slate-200 font-mono">
                      {activeDisplayedStats.totalI}
                    </td>
                    <td className="py-2 px-2 text-center bg-rose-200 text-rose-950 border-r border-slate-200 font-mono">
                      {activeDisplayedStats.totalA}
                    </td>
                    <td className="py-2 px-3 text-center bg-indigo-200 text-indigo-950 font-black">
                      {activeDisplayedStats.percent}%
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Section Akhir Matriks: Simpan ke Cloud */}
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  {hasUnsavedChanges
                    ? 'Ada perubahan data matriks presensi yang belum disimpan ke Cloud.'
                    : 'Seluruh rekap matriks pertemuan tersimpan di Cloud Firestore.'}
                </span>
                <span className="text-[11px] text-slate-500">
                  {lastSavedTime
                    ? `Terakhir disimpan: ${lastSavedTime}`
                    : 'Klik tombol Simpan untuk menyimpan seluruh sesi pertemuan ke database Cloud.'}
                </span>
              </div>
            </div>

            <button
              type="button"
              id="btn-save-matrix-bottom"
              onClick={() => handleSaveToCloud()}
              disabled={isLocalSaving || isCloudSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isLocalSaving || isCloudSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan ke Cloud...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Rekap ke Cloud (Save)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Floating Save Reminder for long tables when user has made changes */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-5 right-5 z-40 shadow-xl rounded-2xl bg-slate-900/95 text-white p-3 sm:px-4 sm:py-3 border border-slate-700 backdrop-blur-md flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
          <div className="text-xs">
            <span className="font-bold block text-slate-100">Presensi belum disimpan</span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">Klik Save agar data tersimpan di Cloud</span>
          </div>
          <button
            type="button"
            onClick={() => handleSaveToCloud()}
            disabled={isLocalSaving || isCloudSaving}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0"
          >
            {isLocalSaving || isCloudSaving ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save ke Cloud</span>
          </button>
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

      {/* Public Attendance Share Modal for Parents */}
      <SharePublicAbsensiModal
        isOpen={showPublicShareModal}
        onClose={() => setShowPublicShareModal(false)}
        currentClass={classObj}
        teacher={teacherObj}
        students={students}
        sessions={sessions}
        onShowToast={onShowToast}
      />

      {/* Modal Edit Pertemuan (Tanggal, Topik / Materi Pembelajaran, Nomor Pertemuan) */}
      {editingSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    Edit Sesi Pertemuan
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Ubah tanggal, nomor pertemuan, atau materi pembelajaran
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSession(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSession} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pertemuan Ke-
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={editPertemuanKe}
                    onChange={(e) => setEditPertemuanKe(parseInt(e.target.value) || 1)}
                    required
                    className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Pertemuan
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Topik / Materi Pembelajaran
                </label>
                <textarea
                  rows={3}
                  value={editTopic}
                  onChange={(e) => setEditTopic(e.target.value)}
                  placeholder="Contoh: Teks Anekdot, Struktur dan Ciri Kebahasaan..."
                  className="w-full px-3 py-2 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSession(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
