import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Printer,
  FileSpreadsheet,
  Users,
  User,
  ShieldCheck,
  RefreshCw,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Building2,
  Lock,
  Sparkles,
  Layers,
  Filter,
  Eye,
  Check,
  X,
  UserCheck,
  AlertTriangle,
  QrCode,
} from 'lucide-react';
import { FirestoreService, PublicAbsensiData } from '../services/firestoreService';
import { AttendanceSession, AttendanceStatus } from '../types';
import { QRCodeModal } from './QRCodeModal';

interface PublicAbsensiViewProps {
  shareId: string;
  initialNisn?: string;
  initialStudentId?: string;
  onExitToApp?: () => void;
}

// Helper to extract student record regardless of whether records is dictionary or array
const getRecordForStudent = (
  session: AttendanceSession | null | undefined,
  studentId: string
): { status?: AttendanceStatus; catatan?: string } | null => {
  if (!session || !session.records) return null;
  if (Array.isArray(session.records)) {
    return (session.records as any[]).find((r) => r.studentId === studentId) || null;
  }
  return (session.records as Record<string, any>)[studentId] || null;
};

export const PublicAbsensiView: React.FC<PublicAbsensiViewProps> = ({
  shareId,
  initialNisn,
  initialStudentId,
  onExitToApp,
}) => {
  const [data, setData] = useState<PublicAbsensiData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [lastLiveSync, setLastLiveSync] = useState<string | null>(null);
  const [syncPulse, setSyncPulse] = useState<boolean>(false);
  const [showHeaderQr, setShowHeaderQr] = useState<boolean>(false);

  // Tab: 'harian' (Daily Attendance), 'rekap' (Full Recap), 'kartu_siswa' (Individual Student Card)
  const [activeTab, setActiveTab] = useState<'harian' | 'rekap' | 'kartu_siswa'>(
    initialNisn || initialStudentId ? 'kartu_siswa' : 'harian'
  );

  // Student selection for 'kartu_siswa'
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Selected Session for 'harian' view
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');

  // Search and filters for Daily view
  const [searchDaily, setSearchDaily] = useState<string>('');
  const [filterDailyStatus, setFilterDailyStatus] = useState<'all' | AttendanceStatus | 'unmarked'>('all');

  // Search and filters for Recap view
  const [searchRecap, setSearchRecap] = useState<string>('');
  const [filterRecapStatus, setFilterRecapStatus] = useState<'all' | 'alfa' | 'warning' | 'perfect'>('all');
  const [sortRecapBy, setSortRecapBy] = useState<'no' | 'nama' | 'persen_desc' | 'persen_asc' | 'alfa_desc'>('no');

  // PIN Protection State
  const [isPinUnlocked, setIsPinUnlocked] = useState<boolean>(true);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Real-time Firestore subscription
  useEffect(() => {
    setIsLoading(true);
    setErrorMsg(null);

    const unsubscribe = FirestoreService.subscribePublicAbsensi(
      shareId,
      (updatedData) => {
        setIsLoading(false);
        if (updatedData) {
          setData(updatedData);
          setIsLiveConnected(true);
          const nowStr = new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
          setLastLiveSync(nowStr);
          setSyncPulse(true);
          setTimeout(() => setSyncPulse(false), 1500);

          // Check PIN lock
          if (updatedData.pinRequired && updatedData.accessPin) {
            const unlockedCache = sessionStorage.getItem(`pin_unlocked_abs_${shareId}`);
            if (unlockedCache !== 'true') {
              setIsPinUnlocked(false);
            } else {
              setIsPinUnlocked(true);
            }
          } else {
            setIsPinUnlocked(true);
          }

          // Set default selected session if not yet set
          if (updatedData.sessions && updatedData.sessions.length > 0) {
            setSelectedSessionId((prev) => {
              const exists = updatedData.sessions.some((s) => s.id === prev);
              if (!exists) {
                // Select most recent session
                return updatedData.sessions[updatedData.sessions.length - 1].id;
              }
              return prev;
            });
          }

          // Set initial student if query param exists
          if (updatedData.students && updatedData.students.length > 0) {
            setSelectedStudentId((prev) => {
              if (prev) return prev;
              if (initialNisn) {
                const matchNisn = updatedData.students.find((s) => s.nisn === initialNisn);
                if (matchNisn) return matchNisn.id;
              }
              if (initialStudentId) {
                const matchId = updatedData.students.find((s) => s.id === initialStudentId);
                if (matchId) return matchId.id;
              }
              return updatedData.students[0].id;
            });
          }
        } else {
          setData(null);
          setIsLiveConnected(false);
        }
      },
      (err) => {
        setIsLoading(false);
        setErrorMsg('Gagal memuat data presensi dari server cloud.');
        console.error('Subscription public absensi error:', err);
      }
    );

    return () => unsubscribe();
  }, [shareId, initialNisn, initialStudentId]);

  // Handle PIN unlock
  const handleUnlockPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.accessPin) {
      setIsPinUnlocked(true);
      return;
    }
    if (enteredPin.trim() === data.accessPin.trim()) {
      setIsPinUnlocked(true);
      setPinError(null);
      sessionStorage.setItem(`pin_unlocked_abs_${shareId}`, 'true');
    } else {
      setPinError('Kode PIN salah. Silakan hubungi wali kelas atau guru pengampu.');
    }
  };

  // Sessions sorted chronologically
  const sortedSessions = useMemo(() => {
    if (!data?.sessions) return [];
    return [...data.sessions].sort((a, b) => {
      if (a.tanggal !== b.tanggal) return a.tanggal.localeCompare(b.tanggal);
      return a.pertemuanKe - b.pertemuanKe;
    });
  }, [data?.sessions]);

  // Active session
  const activeSession = useMemo(() => {
    if (!sortedSessions.length) return null;
    return sortedSessions.find((s) => s.id === selectedSessionId) || sortedSessions[sortedSessions.length - 1];
  }, [sortedSessions, selectedSessionId]);

  // Active Session statistics
  const activeSessionStats = useMemo(() => {
    if (!activeSession || !data?.students) {
      return { total: 0, hadir: 0, sakit: 0, izin: 0, alfa: 0, belum: 0, persen: 0 };
    }
    const total = data.students.length;
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alfa = 0;
    let belum = 0;

    data.students.forEach((st) => {
      const rec = getRecordForStudent(activeSession, st.id);
      if (!rec || !rec.status) {
        belum++;
      } else if (rec.status === 'H') {
        hadir++;
      } else if (rec.status === 'S') {
        sakit++;
      } else if (rec.status === 'I') {
        izin++;
      } else if (rec.status === 'A') {
        alfa++;
      }
    });

    const persen = total > 0 ? Math.round((hadir / total) * 100) : 0;
    return { total, hadir, sakit, izin, alfa, belum, persen };
  }, [activeSession, data?.students]);

  // Filtered students for Daily view
  const filteredDailyStudents = useMemo(() => {
    if (!data?.students || !activeSession) return [];
    return data.students.filter((st) => {
      const matchesSearch =
        st.nama.toLowerCase().includes(searchDaily.toLowerCase()) ||
        (st.nisn && st.nisn.includes(searchDaily));
      if (!matchesSearch) return false;

      if (filterDailyStatus === 'all') return true;

      const rec = getRecordForStudent(activeSession, st.id);
      const status = rec?.status;

      if (filterDailyStatus === 'unmarked') return !status;
      return status === filterDailyStatus;
    });
  }, [data?.students, activeSession, searchDaily, filterDailyStatus]);

  // Recap statistics per student across all sessions
  const studentRecaps = useMemo(() => {
    if (!data?.students || !sortedSessions) return [];

    return data.students.map((st) => {
      let hadir = 0;
      let sakit = 0;
      let izin = 0;
      let alfa = 0;
      let total = sortedSessions.length;

      sortedSessions.forEach((ses) => {
        const rec = getRecordForStudent(ses, st.id);
        if (rec) {
          if (rec.status === 'H') hadir++;
          else if (rec.status === 'S') sakit++;
          else if (rec.status === 'I') izin++;
          else if (rec.status === 'A') alfa++;
        }
      });

      const persen = total > 0 ? Math.round((hadir / total) * 100) : 100;
      let predikat = 'Sangat Baik';
      if (persen < 80 || alfa >= 3) predikat = 'Butuh Pembinaan';
      else if (persen < 85 || alfa >= 2) predikat = 'Cukup';
      else if (persen < 95 || alfa >= 1) predikat = 'Baik';

      return {
        student: st,
        hadir,
        sakit,
        izin,
        alfa,
        total,
        persen,
        predikat,
      };
    });
  }, [data?.students, sortedSessions]);

  // Overall class recap statistics
  const overallClassStats = useMemo(() => {
    if (!studentRecaps.length) {
      return { totalSiswa: 0, totalPertemuan: 0, avgPersen: 0, totalAlfa: 0, totalSakitIzin: 0 };
    }
    const totalSiswa = studentRecaps.length;
    const totalPertemuan = sortedSessions.length;
    const sumPersen = studentRecaps.reduce((sum, item) => sum + item.persen, 0);
    const avgPersen = Math.round(sumPersen / totalSiswa);
    const totalAlfa = studentRecaps.reduce((sum, item) => sum + item.alfa, 0);
    const totalSakitIzin = studentRecaps.reduce((sum, item) => sum + item.sakit + item.izin, 0);

    return { totalSiswa, totalPertemuan, avgPersen, totalAlfa, totalSakitIzin };
  }, [studentRecaps, sortedSessions]);

  // Filtered & sorted student recaps
  const filteredAndSortedRecap = useMemo(() => {
    let result = studentRecaps.filter((item) => {
      const matchesSearch =
        item.student.nama.toLowerCase().includes(searchRecap.toLowerCase()) ||
        (item.student.nisn && item.student.nisn.includes(searchRecap));
      if (!matchesSearch) return false;

      if (filterRecapStatus === 'alfa') return item.alfa > 0;
      if (filterRecapStatus === 'warning') return item.persen < 80;
      if (filterRecapStatus === 'perfect') return item.persen === 100;
      return true;
    });

    result.sort((a, b) => {
      if (sortRecapBy === 'no') return a.student.no - b.student.no;
      if (sortRecapBy === 'nama') return a.student.nama.localeCompare(b.student.nama);
      if (sortRecapBy === 'persen_desc') return b.persen - a.persen;
      if (sortRecapBy === 'persen_asc') return a.persen - b.persen;
      if (sortRecapBy === 'alfa_desc') return b.alfa - a.alfa;
      return 0;
    });

    return result;
  }, [studentRecaps, searchRecap, filterRecapStatus, sortRecapBy]);

  // Selected Student for Card
  const activeStudentRecap = useMemo(() => {
    if (!studentRecaps.length) return null;
    return studentRecaps.find((item) => item.student.id === selectedStudentId) || studentRecaps[0];
  }, [studentRecaps, selectedStudentId]);

  // Attendance history for selected student
  const studentSessionHistory = useMemo(() => {
    if (!activeStudentRecap || !sortedSessions) return [];
    return sortedSessions.map((ses) => {
      const rec = getRecordForStudent(ses, activeStudentRecap.student.id);
      return {
        session: ses,
        status: rec?.status || null,
        catatan: rec?.catatan || '',
      };
    });
  }, [activeStudentRecap, sortedSessions]);

  // Print Handlers
  const handlePrintDaily = () => {
    window.print();
  };

  const handlePrintRecap = () => {
    window.print();
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!data) return;
    const headers = ['No', 'Nama Siswa', 'NISN', 'Total Pertemuan', 'Hadir', 'Sakit', 'Izin', 'Alfa', 'Persentase', 'Predikat'];
    const rows = studentRecaps.map((item) => [
      item.student.no,
      `"${item.student.nama.replace(/"/g, '""')}"`,
      `"${item.student.nisn || ''}"`,
      item.total,
      item.hadir,
      item.sakit,
      item.izin,
      item.alfa,
      `${item.persen}%`,
      `"${item.predikat}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Rekap_Presensi_${data.className.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for status badge
  const renderStatusBadge = (status: AttendanceStatus | null | undefined, size: 'sm' | 'md' = 'md') => {
    if (!status) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
          Belum Diabsen
        </span>
      );
    }
    if (status === 'H') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
          <Check className="w-3 h-3" />
          <span>Hadir (H)</span>
        </span>
      );
    }
    if (status === 'S') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
          <span>Sakit (S)</span>
        </span>
      );
    }
    if (status === 'I') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-black bg-sky-100 text-sky-900 border border-sky-300 shadow-2xs">
          <span>Izin (I)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-black bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs animate-pulse">
        <X className="w-3 h-3" />
        <span>Alfa (A)</span>
      </span>
    );
  };

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 text-center max-w-sm w-full space-y-4">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
            <UserCheck className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800">
              Memuat Presensi Siswa...
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Menghubungkan ke server Cloud Firestore secara real-time
            </p>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-2/3 animate-progress" />
          </div>
        </div>
      </div>
    );
  }

  // Error / Not Found Screen
  if (errorMsg || !data) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 text-center max-w-md w-full space-y-4">
          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-slate-900">
            Tautan Presensi Tidak Ditemukan
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Data tautan presensi orang tua ini mungkin belum diaktifkan oleh guru pengampu, atau alamat tautan tidak lengkap.
          </p>
          {onExitToApp && (
            <button
              type="button"
              onClick={onExitToApp}
              className="mt-2 w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Kembali ke Halaman Utama
            </button>
          )}
        </div>
      </div>
    );
  }

  // Disabled by teacher screen
  if (!data.isPublicEnabled) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 text-center max-w-md w-full space-y-4">
          <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-slate-900">
            Akses Publik Presensi Sedang Ditutup
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Guru pengampu kelas <strong>{data.className}</strong> saat ini menonaktifkan portal publik presensi. Silakan hubungi wali kelas untuk informasi lebih lanjut.
          </p>
          {onExitToApp && (
            <button
              type="button"
              onClick={onExitToApp}
              className="mt-2 w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Buka Aplikasi Guru
            </button>
          )}
        </div>
      </div>
    );
  }

  // PIN Gate Screen
  if (!isPinUnlocked) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 max-w-sm w-full space-y-5 text-center">
          <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
              Proteksi PIN Orang Tua
            </span>
            <h3 className="text-lg font-black text-slate-900 mt-2">
              Masukkan PIN Akses
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Portal presensi kelas <strong>{data.className}</strong> diproteksi untuk menjaga privasi siswa.
            </p>
          </div>

          <form onSubmit={handleUnlockPin} className="space-y-3">
            <input
              type="password"
              placeholder="Ketik PIN..."
              value={enteredPin}
              onChange={(e) => setEnteredPin(e.target.value)}
              className="w-full text-center text-lg font-mono font-bold tracking-widest bg-slate-50 border border-slate-300 rounded-2xl py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              autoFocus
            />
            {pinError && (
              <p className="text-xs font-medium text-rose-600 bg-rose-50 p-2 rounded-xl border border-rose-200">
                {pinError}
              </p>
            )}
            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Buka Akses Presensi
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Top Notification Bar (Live Status) */}
      <div className="bg-emerald-700 text-white text-[11px] font-semibold py-1.5 px-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-emerald-800/90 text-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-500/40">
              <span className={`w-2 h-2 rounded-full bg-emerald-400 ${syncPulse ? 'animate-ping' : ''}`} />
              Real-Time Aktif
            </span>
            <span>
              Portal Resmi Pemantauan Presensi Orang Tua / Wali Murid
            </span>
          </div>

          <div className="flex items-center gap-3 text-emerald-100 text-[11px]">
            {lastLiveSync && (
              <span className="flex items-center gap-1 opacity-90">
                <Clock className="w-3 h-3" />
                Terakhir sinkron: {lastLiveSync}
              </span>
            )}
            {onExitToApp && (
              <button
                type="button"
                onClick={onExitToApp}
                className="bg-emerald-800 hover:bg-emerald-900 text-white px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer font-bold border border-emerald-600/60"
              >
                Kembali ke Aplikasi Guru
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-black text-xl shadow-md shrink-0">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-lg text-xs font-extrabold uppercase tracking-wide bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {data.className}
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    {data.mataPelajaran}
                  </span>
                </div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-0.5">
                  Presensi Siswa Real-Time
                </h1>
                <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                  <span>{data.schoolName}</span>
                  <span>•</span>
                  <span>Guru / Wali Kelas: <strong>{data.waliKelas}</strong></span>
                  <span>•</span>
                  <span>T.A {data.academicYear} ({data.semester})</span>
                </p>
              </div>
            </div>

            {/* Quick Actions (Print / CSV) */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={activeTab === 'harian' ? handlePrintDaily : handlePrintRecap}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                title="Cetak Tampilan Presensi"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak</span>
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition-colors cursor-pointer"
                title="Unduh Rekap Spreadsheet (CSV)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Unduh CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setShowHeaderQr(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-xl border border-sky-200 transition-colors cursor-pointer"
                title="Tampilkan Kode QR Halaman Ini"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">QR Code</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-5 border-t border-slate-100 pt-3 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('harian')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'harian'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Absen Harian (Per Pertemuan)</span>
              {activeSession && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  activeTab === 'harian' ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 text-slate-700'
                }`}>
                  P{activeSession.pertemuanKe}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rekap')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'rekap'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Rekapitulasi Presensi Kelas</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                activeTab === 'rekap' ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 text-slate-700'
              }`}>
                {sortedSessions.length} Pertemuan
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('kartu_siswa')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'kartu_siswa'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Kartu Presensi Siswa</span>
              {activeStudentRecap && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md max-w-[120px] truncate ${
                  activeTab === 'kartu_siswa' ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 text-slate-700'
                }`}>
                  {activeStudentRecap.student.nama.split(' ')[0]}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        {/* ========================================================================= */}
        {/* TAB 1: ABSEN HARIAN (PER PERTEMUAN)                                       */}
        {/* ========================================================================= */}
        {activeTab === 'harian' && (
          <div className="space-y-5">
            {/* Session Controller & Selector */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Data Presensi Harian Terpilih
                </span>
                {activeSession ? (
                  <div className="mt-1.5">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2 flex-wrap">
                      <span>Pertemuan Ke-{activeSession.pertemuanKe}</span>
                      <span className="text-slate-400 font-normal">|</span>
                      <span className="text-slate-600 text-sm font-semibold">{activeSession.tanggal}</span>
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5 font-medium">
                      Materi / Topik: <span className="text-slate-900 font-bold">{activeSession.topikMateri || 'Materi Pelajaran Reguler'}</span>
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 mt-1">Belum ada sesi pertemuan yang tercatat.</p>
                )}
              </div>

              {/* Session Switcher dropdown */}
              {sortedSessions.length > 0 && (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-slate-500 hidden sm:inline">
                    Pilih Pertemuan:
                  </span>
                  <select
                    aria-label="Pilih Pertemuan Presensi"
                    value={selectedSessionId}
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                    className="text-xs font-bold bg-slate-100 hover:bg-slate-200/80 border border-slate-300 rounded-xl px-3 py-2 pr-8 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    {sortedSessions.map((ses) => (
                      <option key={ses.id} value={ses.id}>
                        Pertemuan {ses.pertemuanKe} • {ses.tanggal}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Daily Summary Metric Cards */}
            {activeSession && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
                  <div className="text-[11px] font-bold text-slate-500">Total Siswa</div>
                  <div className="text-xl font-black text-slate-900 mt-1">
                    {activeSessionStats.total}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Siswa Terdaftar</div>
                </div>

                <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200 shadow-2xs">
                  <div className="text-[11px] font-bold text-emerald-800">Hadir (H)</div>
                  <div className="text-xl font-black text-emerald-700 mt-1">
                    {activeSessionStats.hadir}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                    {activeSessionStats.persen}% Kehadiran
                  </div>
                </div>

                <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200 shadow-2xs">
                  <div className="text-[11px] font-bold text-amber-800">Sakit (S)</div>
                  <div className="text-xl font-black text-amber-700 mt-1">
                    {activeSessionStats.sakit}
                  </div>
                  <div className="text-[10px] text-amber-600 font-medium mt-0.5">Dengan Surat</div>
                </div>

                <div className="bg-sky-50/70 rounded-2xl p-4 border border-sky-200 shadow-2xs">
                  <div className="text-[11px] font-bold text-sky-800">Izin (I)</div>
                  <div className="text-xl font-black text-sky-700 mt-1">
                    {activeSessionStats.izin}
                  </div>
                  <div className="text-[10px] text-sky-600 font-medium mt-0.5">Pemberitahuan</div>
                </div>

                <div className={`rounded-2xl p-4 border shadow-2xs ${
                  activeSessionStats.alfa > 0
                    ? 'bg-rose-50 border-rose-200 ring-1 ring-rose-300'
                    : 'bg-white border-slate-200'
                }`}>
                  <div className={`text-[11px] font-bold ${activeSessionStats.alfa > 0 ? 'text-rose-800' : 'text-slate-500'}`}>
                    Alfa (A)
                  </div>
                  <div className={`text-xl font-black mt-1 ${activeSessionStats.alfa > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                    {activeSessionStats.alfa}
                  </div>
                  <div className={`text-[10px] mt-0.5 ${activeSessionStats.alfa > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                    Tanpa Keterangan
                  </div>
                </div>

                <div className="bg-indigo-50/70 rounded-2xl p-4 border border-indigo-200 shadow-2xs">
                  <div className="text-[11px] font-bold text-indigo-800">Tingkat Kelas</div>
                  <div className="text-xl font-black text-indigo-700 mt-1">
                    {activeSessionStats.persen}%
                  </div>
                  <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">
                    {activeSessionStats.persen >= 90 ? 'Disiplin Tinggi' : 'Perlu Peningkatan'}
                  </div>
                </div>
              </div>
            )}

            {/* Filter and Search Bar */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-500">Filter Status:</span>
                <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setFilterDailyStatus('all')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      filterDailyStatus === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Semua ({activeSessionStats.total})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterDailyStatus('H')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      filterDailyStatus === 'H' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-emerald-700'
                    }`}
                  >
                    Hadir ({activeSessionStats.hadir})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterDailyStatus('S')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      filterDailyStatus === 'S' ? 'bg-amber-600 text-white shadow-2xs' : 'text-amber-700'
                    }`}
                  >
                    Sakit ({activeSessionStats.sakit})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterDailyStatus('I')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      filterDailyStatus === 'I' ? 'bg-sky-600 text-white shadow-2xs' : 'text-sky-700'
                    }`}
                  >
                    Izin ({activeSessionStats.izin})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterDailyStatus('A')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      filterDailyStatus === 'A' ? 'bg-rose-600 text-white shadow-2xs' : 'text-rose-700'
                    }`}
                  >
                    Alfa ({activeSessionStats.alfa})
                  </button>
                </div>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama atau NISN siswa..."
                  value={searchDaily}
                  onChange={(e) => setSearchDaily(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4 w-12 text-center">No</th>
                      <th className="py-3 px-4">Nama Siswa</th>
                      <th className="py-3 px-4 w-28">NISN</th>
                      <th className="py-3 px-4 w-16 text-center">L/P</th>
                      <th className="py-3 px-4 w-36 text-center">Status Kehadiran</th>
                      <th className="py-3 px-4">Keterangan / Catatan Guru</th>
                      <th className="py-3 px-4 w-28 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDailyStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 font-medium text-xs">
                          Tidak ada siswa yang sesuai filter pencarian.
                        </td>
                      </tr>
                    ) : (
                      filteredDailyStudents.map((st) => {
                        const rec = getRecordForStudent(activeSession, st.id);
                        const status = rec?.status || null;
                        const catatan = rec?.catatan || '-';

                        return (
                          <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 text-center font-mono font-bold text-slate-500">
                              {st.no}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{st.nama}</div>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-500">
                              {st.nisn || '-'}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-slate-400">
                              {st.gender || '-'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {renderStatusBadge(status)}
                            </td>
                            <td className="py-3 px-4 text-slate-600 italic">
                              {catatan !== '-' ? catatan : <span className="text-slate-300">-</span>}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStudentId(st.id);
                                  setActiveTab('kartu_siswa');
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Kartu</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: REKAPITULASI PRESENSI KELAS                                        */}
        {/* ========================================================================= */}
        {activeTab === 'rekap' && (
          <div className="space-y-5">
            {/* Overall Recap Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
                <div className="text-[11px] font-bold text-slate-500">Total Pertemuan</div>
                <div className="text-xl font-black text-slate-900 mt-1">
                  {overallClassStats.totalPertemuan} Sesi
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Tercatat di Sistem</div>
              </div>

              <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200 shadow-2xs">
                <div className="text-[11px] font-bold text-emerald-800">Rata-Rata Kehadiran</div>
                <div className="text-xl font-black text-emerald-700 mt-1">
                  {overallClassStats.avgPersen}%
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                  Tingkat Kedisiplinan Kelas
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
                <div className="text-[11px] font-bold text-slate-500">Jumlah Siswa</div>
                <div className="text-xl font-black text-slate-900 mt-1">
                  {overallClassStats.totalSiswa} Siswa
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Rombel {data.className}</div>
              </div>

              <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200 shadow-2xs">
                <div className="text-[11px] font-bold text-amber-800">Sakit / Izin Total</div>
                <div className="text-xl font-black text-amber-700 mt-1">
                  {overallClassStats.totalSakitIzin} Kali
                </div>
                <div className="text-[10px] text-amber-600 font-medium mt-0.5">Izin Terkonfirmasi</div>
              </div>

              <div className={`rounded-2xl p-4 border shadow-2xs ${
                overallClassStats.totalAlfa > 0 ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'
              }`}>
                <div className={`text-[11px] font-bold ${overallClassStats.totalAlfa > 0 ? 'text-rose-800' : 'text-slate-500'}`}>
                  Total Alfa (A)
                </div>
                <div className={`text-xl font-black mt-1 ${overallClassStats.totalAlfa > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {overallClassStats.totalAlfa} Kali
                </div>
                <div className={`text-[10px] mt-0.5 ${overallClassStats.totalAlfa > 0 ? 'text-rose-600 font-semibold' : 'text-slate-400'}`}>
                  Akumulasi Se-Kelas
                </div>
              </div>
            </div>

            {/* Filter & Sort Bar */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-500">Filter:</span>
                <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-50 text-xs">
                  <button
                    type="button"
                    onClick={() => setFilterRecapStatus('all')}
                    className={`px-3 py-1 font-bold rounded-lg transition-colors cursor-pointer ${
                      filterRecapStatus === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterRecapStatus('alfa')}
                    className={`px-3 py-1 font-bold rounded-lg transition-colors cursor-pointer ${
                      filterRecapStatus === 'alfa' ? 'bg-rose-600 text-white shadow-2xs' : 'text-rose-700'
                    }`}
                  >
                    Pernah Alfa
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterRecapStatus('warning')}
                    className={`px-3 py-1 font-bold rounded-lg transition-colors cursor-pointer ${
                      filterRecapStatus === 'warning' ? 'bg-rose-600 text-white shadow-2xs' : 'text-rose-700'
                    }`}
                  >
                    Butuh Pembinaan (&lt; 80%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterRecapStatus('perfect')}
                    className={`px-3 py-1 font-bold rounded-lg transition-colors cursor-pointer ${
                      filterRecapStatus === 'perfect' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-emerald-700'
                    }`}
                  >
                    100% Hadir
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-500">Urutkan:</span>
                <select
                  aria-label="Urutkan Rekapitulasi"
                  value={sortRecapBy}
                  onChange={(e) => setSortRecapBy(e.target.value as any)}
                  className="text-xs font-bold bg-slate-100 hover:bg-slate-200/80 border border-slate-300 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="no">No Absen</option>
                  <option value="nama">Nama Siswa (A-Z)</option>
                  <option value="persen_desc">Kehadiran Tertinggi</option>
                  <option value="persen_asc">Kehadiran Terendah</option>
                  <option value="alfa_desc">Alfa Terbanyak</option>
                </select>

                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari siswa..."
                    value={searchRecap}
                    onChange={(e) => setSearchRecap(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Recap Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4 w-12 text-center">No</th>
                      <th className="py-3 px-4">Nama Siswa</th>
                      <th className="py-3 px-4 w-28">NISN</th>
                      <th className="py-3 px-3 w-16 text-center text-emerald-800 bg-emerald-50/60">H</th>
                      <th className="py-3 px-3 w-16 text-center text-amber-800 bg-amber-50/60">S</th>
                      <th className="py-3 px-3 w-16 text-center text-sky-800 bg-sky-50/60">I</th>
                      <th className="py-3 px-3 w-16 text-center text-rose-800 bg-rose-50/60">A</th>
                      <th className="py-3 px-4 w-24 text-center">Total</th>
                      <th className="py-3 px-4 w-28 text-center">Persentase</th>
                      <th className="py-3 px-4 w-32 text-center">Predikat</th>
                      <th className="py-3 px-4 w-24 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAndSortedRecap.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-8 text-center text-slate-400 font-medium text-xs">
                          Tidak ada data siswa yang cocok dengan filter.
                        </td>
                      </tr>
                    ) : (
                      filteredAndSortedRecap.map((item) => {
                        return (
                          <tr key={item.student.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 text-center font-mono font-bold text-slate-500">
                              {item.student.no}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{item.student.nama}</div>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-500">
                              {item.student.nisn || '-'}
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-emerald-700 bg-emerald-50/30">
                              {item.hadir}
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-amber-700 bg-amber-50/30">
                              {item.sakit}
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-sky-700 bg-sky-50/30">
                              {item.izin}
                            </td>
                            <td className={`py-3 px-3 text-center font-bold ${
                              item.alfa > 0 ? 'text-rose-700 bg-rose-100/60 font-black' : 'text-slate-400 bg-rose-50/30'
                            }`}>
                              {item.alfa}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-slate-700">
                              {item.total}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <span className={`font-black ${
                                  item.persen >= 90
                                    ? 'text-emerald-700'
                                    : item.persen >= 80
                                    ? 'text-amber-700'
                                    : 'text-rose-700'
                                }`}>
                                  {item.persen}%
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                item.predikat === 'Sangat Baik'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.predikat === 'Baik'
                                  ? 'bg-sky-100 text-sky-800'
                                  : item.predikat === 'Cukup'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800 ring-1 ring-rose-200'
                              }`}>
                                {item.predikat}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStudentId(item.student.id);
                                  setActiveTab('kartu_siswa');
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Detail</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: KARTU PRESENSI SISWA (INDIVIDUAL CARD)                            */}
        {/* ========================================================================= */}
        {activeTab === 'kartu_siswa' && activeStudentRecap && (
          <div className="space-y-5">
            {/* Student Switcher Banner */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-base shrink-0 shadow-inner">
                  #{activeStudentRecap.student.no}
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    {activeStudentRecap.student.nama}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>NISN: <strong>{activeStudentRecap.student.nisn || '-'}</strong></span>
                    <span>•</span>
                    <span>Jenis Kelamin: <strong>{activeStudentRecap.student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</strong></span>
                  </p>
                </div>
              </div>

              {/* Student Selector */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-slate-500">Pilih Siswa:</span>
                <select
                  aria-label="Pilih Siswa"
                  value={activeStudentRecap.student.id}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="text-xs font-bold bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl px-3 py-2 pr-8 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer max-w-xs truncate"
                >
                  {data.students.map((st) => (
                    <option key={st.id} value={st.id}>
                      #{st.no} {st.nama}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Attendance Overview Card for this Student */}
            <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-indigo-800 rounded-3xl p-6 text-white shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30">
                      Ringkasan Kehadiran Semester Ini
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xs ${
                      activeStudentRecap.predikat === 'Sangat Baik'
                        ? 'bg-emerald-100 text-emerald-900'
                        : activeStudentRecap.predikat === 'Baik'
                        ? 'bg-sky-100 text-sky-900'
                        : activeStudentRecap.predikat === 'Cukup'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-rose-100 text-rose-900'
                    }`}>
                      Predikat: {activeStudentRecap.predikat}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-white">
                    {activeStudentRecap.persen}% Tingkat Kehadiran
                  </h3>
                  <p className="text-xs text-emerald-100 max-w-md leading-relaxed">
                    Ananda telah mengikuti {activeStudentRecap.hadir} dari total {activeStudentRecap.total} pertemuan mata pelajaran {data.mataPelajaran}.
                    {activeStudentRecap.persen < 80 && (
                      <span className="block mt-1 font-bold text-rose-200 bg-rose-900/40 p-1.5 rounded-lg border border-rose-400/30">
                        ⚠️ Perhatian: Tingkat kehadiran di bawah 80% (Predikat: Butuh Pembinaan). Mohon bantuan Bapak/Ibu untuk meningkatkan kedisiplinan belajar ananda.
                      </span>
                    )}
                  </p>
                </div>

                {/* Stat pills */}
                <div className="grid grid-cols-4 gap-2 sm:gap-3 shrink-0">
                  <div className="bg-white/15 backdrop-blur-xs rounded-2xl p-3 text-center border border-white/20">
                    <div className="text-[10px] font-bold text-emerald-200">Hadir</div>
                    <div className="text-xl font-black text-white mt-0.5">{activeStudentRecap.hadir}</div>
                  </div>
                  <div className="bg-white/15 backdrop-blur-xs rounded-2xl p-3 text-center border border-white/20">
                    <div className="text-[10px] font-bold text-amber-200">Sakit</div>
                    <div className="text-xl font-black text-white mt-0.5">{activeStudentRecap.sakit}</div>
                  </div>
                  <div className="bg-white/15 backdrop-blur-xs rounded-2xl p-3 text-center border border-white/20">
                    <div className="text-[10px] font-bold text-sky-200">Izin</div>
                    <div className="text-xl font-black text-white mt-0.5">{activeStudentRecap.izin}</div>
                  </div>
                  <div className="bg-white/15 backdrop-blur-xs rounded-2xl p-3 text-center border border-white/20">
                    <div className="text-[10px] font-bold text-rose-200">Alfa</div>
                    <div className="text-xl font-black text-white mt-0.5">{activeStudentRecap.alfa}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline of All Meetings for This Student */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  Riwayat Kehadiran Setiap Pertemuan
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  {studentSessionHistory.length} Pertemuan
                </span>
              </div>

              <div className="space-y-2.5">
                {studentSessionHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">
                    Belum ada pertemuan yang diselenggarakan.
                  </p>
                ) : (
                  studentSessionHistory.map((item, idx) => (
                    <div
                      key={item.session.id}
                      className="p-3.5 rounded-xl border border-slate-150 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-mono font-bold text-xs text-slate-700 shrink-0">
                          P{item.session.pertemuanKe}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-slate-900">
                              Pertemuan {item.session.pertemuanKe}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                              ({item.session.tanggal})
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Topik: <span className="font-semibold text-slate-800">{item.session.topikMateri || 'Materi Reguler'}</span>
                          </p>
                          {item.catatan && (
                            <p className="text-[11px] text-slate-500 italic mt-0.5">
                              Catatan: &ldquo;{item.catatan}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 sm:self-center pl-11 sm:pl-0">
                        {renderStatusBadge(item.status)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            {data.schoolName} • Sistem Informasi Presensi & Penilaian Siswa
          </span>
          <span className="text-slate-400">
            Disediakan oleh Guru: {data.waliKelas}
          </span>
        </div>
      </footer>

      {/* Public Page QR Code Modal */}
      <QRCodeModal
        isOpen={showHeaderQr}
        onClose={() => setShowHeaderQr(false)}
        url={typeof window !== 'undefined' ? window.location.href : ''}
        title={`QR Presensi - ${data.className}`}
        subtitle={`Pindai kode QR untuk membuka rekapitulasi kehadiran kelas ${data.className} mata pelajaran ${data.mataPelajaran}.`}
        badgeText="Presensi Siswa"
        badgeColor="blue"
      />
    </div>
  );
};
