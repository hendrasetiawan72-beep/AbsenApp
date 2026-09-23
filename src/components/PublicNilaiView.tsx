import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Award,
  BookOpen,
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
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  Download,
  Share2,
  QrCode,
} from 'lucide-react';
import { FirestoreService, PublicNilaiData } from '../services/firestoreService';
import { subscribeToPreviewSync } from '../services/previewSyncChannel';
import { StudentGrade } from '../types';
import { calculateStudentGrade, FormattedGradeDetail } from '../utils/gradeCalculations';
import { QRCodeModal } from './QRCodeModal';

interface StudentCalcEntry {
  student: {
    id: string;
    no: number;
    nisn?: string;
    nama: string;
    gender?: 'L' | 'P' | string;
  };
  grade: StudentGrade | undefined;
  calc: FormattedGradeDetail;
}

interface PublicNilaiViewProps {
  shareId: string;
  initialNisn?: string;
  initialStudentId?: string;
}

export const PublicNilaiView: React.FC<PublicNilaiViewProps> = ({
  shareId,
  initialNisn,
  initialStudentId,
}) => {
  // Fast initial cache lookup for 0ms instant preview access
  const [data, setData] = useState<PublicNilaiData | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem(`cache_pub_nil_${shareId}`);
      if (cached) return JSON.parse(cached);
      if (shareId.includes('_')) {
        const parts = shareId.split('_');
        const lastPart = parts[parts.length - 1];
        const aliasCached = localStorage.getItem(`cache_pub_nil_nil_${lastPart}`);
        if (aliasCached) return JSON.parse(aliasCached);
      }
    } catch {}
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      if (localStorage.getItem(`cache_pub_nil_${shareId}`)) return false;
      if (shareId.includes('_')) {
        const parts = shareId.split('_');
        const lastPart = parts[parts.length - 1];
        if (localStorage.getItem(`cache_pub_nil_nil_${lastPart}`)) return false;
      }
    } catch {}
    return true;
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [lastLiveSync, setLastLiveSync] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  });
  const [syncPulse, setSyncPulse] = useState<boolean>(false);
  const [showHeaderQr, setShowHeaderQr] = useState<boolean>(false);

  // Tab: 'kartu_siswa' (Individual Student Grade Report) or 'rekap' (Full Class Recap)
  const [activeTab, setActiveTab] = useState<'kartu_siswa' | 'rekap'>('kartu_siswa');

  // Selected student for 'kartu_siswa'
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Search and filter for Class Recap
  const [searchRecap, setSearchRecap] = useState<string>('');
  const [filterRecapStatus, setFilterRecapStatus] = useState<'all' | 'tuntas' | 'belum_tuntas' | 'A' | 'B' | 'C' | 'D'>('all');
  const [sortRecapBy, setSortRecapBy] = useState<'no' | 'nama' | 'nilai_desc' | 'nilai_asc'>('no');

  // PIN Protection State
  const [isPinUnlocked, setIsPinUnlocked] = useState<boolean>(true);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Filter for formative assessment months
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<number | 'all'>('all');

  // Real-time Firestore subscription + instant 0ms cross-tab/channel synchronization
  useEffect(() => {
    // Only show loading indicator if data has not yet been loaded from cache
    if (!data) {
      setIsLoading(true);
    }
    setErrorMsg(null);

    const applyDataUpdate = (updatedData: PublicNilaiData | null) => {
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
          const unlockedCache = sessionStorage.getItem(`pin_unlocked_nil_${shareId}`);
          if (unlockedCache !== 'true') {
            setIsPinUnlocked(false);
          } else {
            setIsPinUnlocked(true);
          }
        } else {
          setIsPinUnlocked(true);
        }

        // Set initial student if query param exists or fallback to first student
        if (updatedData.students && updatedData.students.length > 0) {
          setSelectedStudentId((prev) => {
            if (prev && updatedData.students.some((s) => s.id === prev)) {
              return prev;
            }
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
    };

    // 1. Instant cross-tab and storage channel synchronization (0ms latency)
    const unsubChannel = subscribeToPreviewSync('nilai', shareId, (instantData) => {
      if (instantData) {
        applyDataUpdate(instantData);
      }
    });

    // 2. Fetch snapshot with 1x read only (NO onSnapshot) - Cloud Run In-Memory Cache first, fallback to Firestore 1x getDoc
    let isCancelled = false;
    const fetchSnapshot = async () => {
      try {
        // Cek Cloud Run cache endpoint terlebih dahulu (0 Firestore reads jika cache hit)
        const res = await fetch(`/api/public/nilai/${encodeURIComponent(shareId)}`);
        if (res.ok) {
          const snapData = await res.json();
          if (!isCancelled) {
            applyDataUpdate(snapData);
            return;
          }
        }
      } catch (e) {
        console.warn('[PublicNilaiView] Cloud Run cache API unavailable, fallback to direct Firestore 1x getDoc');
      }

      // Fallback: 1x getDoc langsung dari Firestore (TIDAK MENGGUNAKAN onSnapshot)
      try {
        const fallbackData = await FirestoreService.getPublicNilai(shareId);
        if (!isCancelled) {
          applyDataUpdate(fallbackData);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setIsLoading(false);
          setErrorMsg('Gagal memuat data nilai dari server cloud.');
          console.error('[PublicNilaiView] One-time fetch error:', err);
        }
      }
    };

    fetchSnapshot();

    return () => {
      isCancelled = true;
      unsubChannel();
    };
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
      sessionStorage.setItem(`pin_unlocked_nil_${shareId}`, 'true');
    } else {
      setPinError('Kode PIN salah. Silakan hubungi guru pengampu atau wali kelas.');
    }
  };

  const kkm = data?.kkm || 75;

  // Compute calculated grades for all students
  const calculatedStudentsMap = useMemo(() => {
    if (!data) return new Map<string, StudentCalcEntry>();
    const map = new Map<string, StudentCalcEntry>();

    data.students.forEach((st) => {
      const g = data.grades?.find((gr) => gr.studentId === st.id);
      const calc = calculateStudentGrade(g, kkm, data.columnHeaders);
      map.set(st.id, { student: st, grade: g, calc });
    });

    return map;
  }, [data, kkm]);

  // Current active student data
  const activeStudentData = useMemo(() => {
    if (!selectedStudentId || !calculatedStudentsMap.has(selectedStudentId)) {
      const first = Array.from(calculatedStudentsMap.values())[0];
      return first || null;
    }
    return calculatedStudentsMap.get(selectedStudentId) || null;
  }, [selectedStudentId, calculatedStudentsMap]);

  // Summary statistics for Class Recap
  const classStats = useMemo(() => {
    const list: StudentCalcEntry[] = Array.from(calculatedStudentsMap.values());
    if (list.length === 0) {
      return {
        totalSiswa: 0,
        rataRataKelas: 0,
        nilaiTertinggi: 0,
        nilaiTerendah: 0,
        tuntasCount: 0,
        belumTuntasCount: 0,
        persenTuntas: 0,
        predikatCounts: { A: 0, B: 0, C: 0, D: 0 },
      };
    }

    let sum = 0;
    let max = -Infinity;
    let min = Infinity;
    let tuntas = 0;
    const predikatCounts = { A: 0, B: 0, C: 0, D: 0 };

    list.forEach(({ calc }) => {
      const na = calc.nilaiAkhir;
      sum += na;
      if (na > max) max = na;
      if (na < min) min = na;
      if (calc.isTuntas) tuntas++;
      if (predikatCounts[calc.predikat] !== undefined) {
        predikatCounts[calc.predikat]++;
      }
    });

    const avg = Math.round(sum / list.length);
    const persenTuntas = Math.round((tuntas / list.length) * 100);

    return {
      totalSiswa: list.length,
      rataRataKelas: avg,
      nilaiTertinggi: max === -Infinity ? 0 : max,
      nilaiTerendah: min === Infinity ? 0 : min,
      tuntasCount: tuntas,
      belumTuntasCount: list.length - tuntas,
      persenTuntas,
      predikatCounts,
    };
  }, [calculatedStudentsMap]);

  // Filtered and sorted students for recap
  const filteredRecapStudents = useMemo(() => {
    const list: StudentCalcEntry[] = Array.from(calculatedStudentsMap.values());

    return list
      .filter(({ student, calc }) => {
        // Search filter
        if (searchRecap.trim()) {
          const q = searchRecap.toLowerCase();
          const matchName = student.nama.toLowerCase().includes(q);
          const matchNisn = student.nisn?.toLowerCase().includes(q);
          if (!matchName && !matchNisn) return false;
        }

        // Status filter
        if (filterRecapStatus === 'tuntas') return calc.isTuntas;
        if (filterRecapStatus === 'belum_tuntas') return !calc.isTuntas;
        if (filterRecapStatus === 'A') return calc.predikat === 'A';
        if (filterRecapStatus === 'B') return calc.predikat === 'B';
        if (filterRecapStatus === 'C') return calc.predikat === 'C';
        if (filterRecapStatus === 'D') return calc.predikat === 'D';

        return true;
      })
      .sort((a: StudentCalcEntry, b: StudentCalcEntry) => {
        if (sortRecapBy === 'no') return a.student.no - b.student.no;
        if (sortRecapBy === 'nama') return a.student.nama.localeCompare(b.student.nama);
        if (sortRecapBy === 'nilai_desc') return b.calc.nilaiAkhir - a.calc.nilaiAkhir;
        if (sortRecapBy === 'nilai_asc') return a.calc.nilaiAkhir - b.calc.nilaiAkhir;
        return 0;
      });
  }, [calculatedStudentsMap, searchRecap, filterRecapStatus, sortRecapBy]);

  // Export recap as CSV spreadsheet
  const handleExportCsv = () => {
    if (!data) return;
    const headers = [
      'No',
      'Nama Siswa',
      'NISN',
      'L/P',
      'Rata Formatif',
      'STS (Sumatif Tengah)',
      'SAS (Sumatif Akhir)',
      'Nilai Akhir',
      'Predikat',
      'Status Ketuntasan',
      'Catatan Pembelajaran',
    ];

    const rows = Array.from(calculatedStudentsMap.values()).map(({ student, grade, calc }) => [
      student.no,
      `"${student.nama.replace(/"/g, '""')}"`,
      student.nisn ? `"${student.nisn}"` : '""',
      student.gender || '-',
      calc.rataFormatif,
      calc.sumatifTengah ?? '-',
      calc.sumatifAkhir ?? '-',
      calc.nilaiAkhir,
      calc.predikat,
      calc.status,
      `"${(grade?.catatan || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [`Rekap Nilai Siswa - ${data.className} (${data.mataPelajaran})`, `KKM: ${kkm}`]
        .map((r) => `"${r}"`)
        .join('\n') +
      '\n\n' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Rekap_Nilai_${data.className.replace(/\s+/g, '_')}_${data.mataPelajaran.replace(/\s+/g, '_')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Share active student report via WhatsApp
  const handleShareStudentWhatsApp = () => {
    if (!activeStudentData || !data) return;
    const { student, grade, calc } = activeStudentData;

    const baseUrl = window.location.origin + window.location.pathname;
    const studentUrl = `${baseUrl}?nilai_share=${encodeURIComponent(shareId)}&nisn=${encodeURIComponent(
      student.nisn || student.id
    )}`;

    const msg =
      `*LAPORAN HASIL BELAJAR & NILAI SISWA*\n` +
      `*${data.schoolName || 'SMK Muhammadiyah Bawang'}*\n\n` +
      `Nama Siswa: *${student.nama}*\n` +
      `NISN: ${student.nisn || '-'}\n` +
      `Kelas: ${data.className}\n` +
      `Mata Pelajaran: *${data.mataPelajaran}*\n` +
      `Semester / TA: ${data.semester} ${data.academicYear}\n` +
      `KKM: *${kkm}*\n\n` +
      `📊 *Rincian Nilai Capaian Belajar:*\n` +
      `• Rata-rata Asesmen Formatif: ${calc.rataFormatif}\n` +
      `• Asesmen Sumatif Tengah (STS): ${calc.sumatifTengah ?? '-'}\n` +
      `• Asesmen Sumatif Akhir (SAS): ${calc.sumatifAkhir ?? '-'}\n` +
      `• *NILAI AKHIR: ${calc.nilaiAkhir}*\n` +
      `• Predikat: *${calc.predikat}*\n` +
      `• Status: *${calc.status.toUpperCase()}*\n` +
      (grade?.catatan ? `\n📝 *Catatan Guru:*\n_"${grade.catatan}"_\n` : '') +
      `\n🔗 *Buka Kartu Rapor Nilai Digital Lengkap:*\n${studentUrl}\n\n` +
      `Guru Pengampu: ${data.waliKelas}\n` +
      `Terima kasih atas perhatian dan dukungan Bapak/Ibu.`;

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-2xl bg-indigo-500/20 animate-ping"></div>
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <GraduationCap className="w-8 h-8 text-white animate-pulse" />
          </div>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white mb-1">
          Menghubungkan ke Portal Nilai Siswa...
        </h2>
        <p className="text-sm text-slate-400 max-w-sm">
          Memuat rekapitulasi penilaian kurikulum merdeka langsung dari cloud server.
        </p>
      </div>
    );
  }

  // Error / Not Found Screen
  if (errorMsg || !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4 border border-rose-500/30">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Tautan Nilai Tidak Ditemukan</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
          {errorMsg ||
            'Tautan pratinjau nilai ini belum dipublikasikan oleh guru, dinonaktifkan, atau format tautan tidak valid.'}
        </p>
      </div>
    );
  }

  // Tautan Privat / Terkunci (Ketika Belum Dibuka Akses Publik oleh Guru)
  if (data.isPublicEnabled !== true) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="bg-slate-800/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-slate-700 max-w-md w-full space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
            <Lock className="w-8 h-8" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            Tautan Privat / Terkunci
          </div>
          <h2 className="text-xl font-black text-white">Akses Nilai Sedang Ditutup</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Tautan pratinjau nilai kelas <strong>{data.className}</strong> ini bersifat privat dan terkunci. Tautan hanya dapat diakses saat guru pengampu membuka perizinan akses publik di aplikasi.
          </p>
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] text-slate-400">
            Silakan hubungi wali kelas atau guru mata pelajaran {data.mataPelajaran} untuk informasi nilai rapor siswa.
          </div>
        </div>
      </div>
    );
  }

  // PIN Gate Screen
  if (!isPinUnlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-md rounded-3xl p-8 border border-slate-800 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mb-3">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">Akses Nilai Dilindungi PIN</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Masukkan kode PIN yang diberikan oleh guru pengampu {data.waliKelas} untuk membuka rekap nilai kelas {data.className}.
            </p>
          </div>

          <form onSubmit={handleUnlockPin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Kode PIN Akses
              </label>
              <input
                type="password"
                maxLength={8}
                value={enteredPin}
                onChange={(e) => {
                  setEnteredPin(e.target.value);
                  setPinError(null);
                }}
                placeholder="Masukkan PIN..."
                autoFocus
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-center text-lg font-black tracking-widest text-white placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
              />
              {pinError && (
                <p className="text-xs font-semibold text-rose-400 mt-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{pinError}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Buka Rekapitulasi Nilai
            </button>
          </form>
        </div>
      </div>
    );
  }

  const allowClassRecap = data.allowClassRecap !== false;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-16">
      {/* Top Banner Header */}
      <header className="bg-gradient-to-r from-indigo-900 via-slate-900 to-teal-900 text-white shadow-md border-b border-indigo-950/40 print:bg-white print:text-black print:border-none print:shadow-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* School & Subject Identity */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
                <GraduationCap className="w-6 h-6 text-indigo-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                    Portal Nilai Siswa
                  </span>
                  <span className="text-[11px] text-slate-300 font-semibold">
                    {data.schoolName || 'SMK Muhammadiyah Bawang'}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>{data.mataPelajaran}</span>
                  <span className="text-indigo-300 font-bold">•</span>
                  <span className="text-indigo-200">Kelas {data.className}</span>
                </h1>
                <p className="text-xs text-slate-300 mt-0.5">
                  Semester {data.semester} {data.academicYear} • Guru: {data.waliKelas} • KKM:{' '}
                  <strong className="text-white">{kkm}</strong>
                </p>
              </div>
            </div>

            {/* Status Live & Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap print:hidden">
              {/* Real-Time Firestore Sync Status Badge */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  isLiveConnected
                    ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400'
                }`}
                title="Tersinkronisasi secara langsung (real-time) dengan buku nilai guru"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isLiveConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                  } ${syncPulse ? 'scale-150' : 'scale-100'} transition-transform`}
                />
                <span>Real-Time Cloud</span>
                {lastLiveSync && <span className="text-[10px] text-emerald-400/80 font-normal">({lastLiveSync})</span>}
              </div>

              {/* Print Button */}
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-colors cursor-pointer shadow-xs"
                title="Cetak kartu nilai atau simpan sebagai PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak / PDF</span>
              </button>

              {/* QR Code Button */}
              <button
                type="button"
                onClick={() => setShowHeaderQr(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-colors cursor-pointer shadow-xs"
                title="Tampilkan Kode QR Halaman Ini"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR Code</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-5 border-t border-white/10 pt-3 print:hidden">
            <button
              type="button"
              onClick={() => setActiveTab('kartu_siswa')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'kartu_siswa'
                  ? 'bg-white text-slate-900 shadow-md scale-100'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <User className="w-4 h-4 text-indigo-600" />
              <span>Kartu Nilai Siswa (Rapor Digital)</span>
            </button>

            {allowClassRecap && (
              <button
                type="button"
                onClick={() => setActiveTab('rekap')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'rekap'
                    ? 'bg-white text-slate-900 shadow-md scale-100'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Rekapitulasi Nilai Kelas</span>
                <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-normal">
                  {data.students.length} Siswa
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* TAB 1: KARTU NILAI SISWA (INDIVIDUAL GRADE REPORT) */}
        {activeTab === 'kartu_siswa' && (
          <div className="space-y-6">
            {/* Student Picker Bar */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Pilih Siswa / Masukkan NISN</h3>
                  <p className="text-xs text-slate-500">
                    Pilih nama ananda untuk melihat rincian asesmen formatif, sumatif, dan hasil akhir.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-1 max-w-md">
                <div className="relative w-full">
                  <select
                    id="select-public-student"
                    value={selectedStudentId || ''}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full pl-3 pr-8 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-900 text-xs sm:text-sm font-bold rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition-colors cursor-pointer"
                  >
                    {data.students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.no}. {st.nama} {st.nisn ? `(${st.nisn})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Individual Student Report Card */}
            {activeStudentData && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 print:border-none print:shadow-none print:p-0 space-y-6">
                {/* Printable School Header (Only in Print) */}
                <div className="hidden print:block text-center border-b-2 border-black pb-4 mb-4">
                  <h2 className="text-xl font-black uppercase tracking-wider">
                    {data.schoolName || 'SMK MUHAMMADIYAH BAWANG'}
                  </h2>
                  <p className="text-xs font-semibold">
                    LAPORAN CAPAIAN HASIL BELAJAR PESERTA DIDIK (KURIKULUM MERDEKA)
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Mata Pelajaran: {data.mataPelajaran} • Semester: {data.semester} {data.academicYear} • Guru:{' '}
                    {data.waliKelas}
                  </p>
                </div>

                {/* Hero Student Banner */}
                <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-teal-800 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full pointer-events-none blur-2xl" />

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                    {/* Student Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30">
                          Nomor Absen {activeStudentData.student.no}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-white">
                          Kelas {data.className}
                        </span>
                        {activeStudentData.student.nisn && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-white">
                            NISN: {activeStudentData.student.nisn}
                          </span>
                        )}
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        {activeStudentData.student.nama}
                      </h2>

                      <p className="text-xs sm:text-sm text-indigo-100 max-w-xl leading-relaxed">
                        Capaian hasil pembelajaran mata pelajaran <strong>{data.mataPelajaran}</strong>. Standar
                        Kriteria Ketuntasan Minimal (KKM) mata pelajaran adalah <strong>{kkm}</strong>.
                      </p>
                    </div>

                    {/* Score & Status Highlight */}
                    <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 self-start lg:self-auto shrink-0">
                      <div className="text-center px-2">
                        <span className="text-[10px] uppercase font-bold text-indigo-200 block tracking-wider">
                          Nilai Akhir
                        </span>
                        <span className="text-4xl font-black text-white">
                          {activeStudentData.calc.nilaiAkhir}
                        </span>
                        <span className="text-[10px] text-indigo-200 block">
                          KKM: {kkm}
                        </span>
                      </div>

                      <div className="h-12 w-px bg-white/20" />

                      <div className="space-y-1.5">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-indigo-200 block">Predikat</span>
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-black uppercase ${
                              activeStudentData.calc.predikat === 'A'
                                ? 'bg-emerald-400 text-emerald-950 font-black'
                                : activeStudentData.calc.predikat === 'B'
                                ? 'bg-sky-400 text-sky-950 font-black'
                                : activeStudentData.calc.predikat === 'C'
                                ? 'bg-amber-400 text-amber-950 font-black'
                                : 'bg-rose-400 text-rose-950 font-black'
                            }`}
                          >
                            Predikat {activeStudentData.calc.predikat}
                          </span>
                        </div>

                        <div>
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded-md ${
                              activeStudentData.calc.isTuntas
                                ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40'
                                : 'bg-rose-500/20 text-rose-200 border border-rose-400/40'
                            }`}
                          >
                            {activeStudentData.calc.isTuntas ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Tuntas</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-3 h-3" />
                                <span>Perlu Remedial</span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score Breakdown Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Card 1: Formatif (50%) */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3 md:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                          50%
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900">Asesmen Formatif (Tugas/Praktik/Kuis)</h4>
                          <p className="text-[11px] text-slate-500">
                            {activeStudentData.calc.totalAssessmentsTaken > 0
                              ? `${activeStudentData.calc.totalAssessmentsTaken} nilai formatif tercatat • Bobot 50% nilai akhir`
                              : 'Bobot 50% dalam penentuan nilai akhir'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-500 block">Rata-rata Formatif</span>
                        <span className="text-xl font-black text-indigo-700">
                          {activeStudentData.calc.rataFormatif}
                        </span>
                      </div>
                    </div>

                    {/* Month selector if monthly summaries exist */}
                    {activeStudentData.calc.monthlySummaries && activeStudentData.calc.monthlySummaries.length > 0 && (
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
                        <button
                          type="button"
                          onClick={() => setSelectedMonthFilter('all')}
                          className={`px-3 py-1 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                            selectedMonthFilter === 'all'
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          Semua Formatif
                        </button>
                        {activeStudentData.calc.monthlySummaries.map((m) => {
                          const hasScores = m.scores.some((s) => s !== null && !isNaN(Number(s)));
                          return (
                            <button
                              key={m.monthIndex}
                              type="button"
                              onClick={() => setSelectedMonthFilter(m.monthIndex)}
                              className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                                selectedMonthFilter === m.monthIndex
                                  ? 'bg-indigo-600 text-white shadow-2xs'
                                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                              }`}
                            >
                              <span>{m.monthName}</span>
                              {hasScores && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Grid of Formatif Columns */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                      {(() => {
                        const items = activeStudentData.calc.allFormatifItems || [];
                        let displayedItems: typeof items = [];

                        if (selectedMonthFilter !== 'all') {
                          displayedItems = items.filter((it) => it.monthIndex === selectedMonthFilter);
                        } else {
                          // Show items from first two months (standard 8) PLUS any items in other months that have values
                          const coreItems = items.filter((it) => it.monthIndex < 2);
                          const otherFilledItems = items.filter(
                            (it) => it.monthIndex >= 2 && it.val !== null && !isNaN(Number(it.val))
                          );
                          displayedItems = [...coreItems, ...otherFilledItems];
                        }

                        if (displayedItems.length === 0) {
                          displayedItems = [
                            { key: 'f1', label: 'Formatif 1', monthIndex: 0, monthName: 'Bulan 1', val: activeStudentData.calc.formatif1 },
                            { key: 'f2', label: 'Formatif 2', monthIndex: 0, monthName: 'Bulan 1', val: activeStudentData.calc.formatif2 },
                            { key: 'f3', label: 'Formatif 3', monthIndex: 0, monthName: 'Bulan 1', val: activeStudentData.calc.formatif3 },
                            { key: 'f4', label: 'Formatif 4', monthIndex: 0, monthName: 'Bulan 1', val: activeStudentData.calc.formatif4 },
                            { key: 'f5', label: 'Formatif 5', monthIndex: 1, monthName: 'Bulan 2', val: activeStudentData.calc.formatif5 },
                            { key: 'f6', label: 'Formatif 6', monthIndex: 1, monthName: 'Bulan 2', val: activeStudentData.calc.formatif6 },
                            { key: 'f7', label: 'Formatif 7', monthIndex: 1, monthName: 'Bulan 2', val: activeStudentData.calc.formatif7 },
                            { key: 'f8', label: 'Formatif 8', monthIndex: 1, monthName: 'Bulan 2', val: activeStudentData.calc.formatif8 },
                          ];
                        }

                        return displayedItems.map((item, idx) => (
                          <div
                            key={item.key || idx}
                            className="bg-white rounded-xl p-3 border border-slate-200 text-center shadow-2xs flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider truncate">
                                  {item.label}
                                </span>
                                {item.monthName && (
                                  <span className="text-[9px] font-semibold text-slate-400">
                                    {item.monthName.slice(0, 3)}
                                  </span>
                                )}
                              </div>
                              {item.keterangan && (
                                <p className="text-[10px] text-slate-500 truncate" title={item.keterangan}>
                                  {item.keterangan}
                                </p>
                              )}
                            </div>

                            <div className="py-1">
                              <span
                                className={`text-xl font-black block ${
                                  item.val === null || item.val === undefined
                                    ? 'text-slate-300'
                                    : item.val >= kkm
                                    ? 'text-emerald-700'
                                    : 'text-amber-700'
                                }`}
                              >
                                {item.val !== null && item.val !== undefined ? item.val : '-'}
                              </span>
                              {item.tanggal && (
                                <span className="text-[9px] text-slate-400 font-mono block">
                                  {item.tanggal}
                                </span>
                              )}
                            </div>

                            <div className="w-full bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  item.val && item.val >= kkm ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}
                                style={{ width: `${Math.min(100, Number(item.val) || 0)}%` }}
                              />
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Card 2: Sumatif (STS & SAS) */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">
                          50%
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900">Asesmen Sumatif</h4>
                          <p className="text-[11px] text-slate-500">STS (25%) & SAS (25%)</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {/* STS */}
                        <div className="bg-white rounded-xl p-3.5 border border-slate-200 flex items-center justify-between shadow-2xs">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">
                              Sumatif Tengah (STS)
                            </span>
                            <span className="text-xs text-slate-400">Bobot 25%</span>
                          </div>
                          <span
                            className={`text-2xl font-black ${
                              activeStudentData.calc.sumatifTengah === null
                                ? 'text-slate-300'
                                : activeStudentData.calc.sumatifTengah >= kkm
                                ? 'text-teal-700'
                                : 'text-rose-700'
                            }`}
                          >
                            {activeStudentData.calc.sumatifTengah ?? '-'}
                          </span>
                        </div>

                        {/* SAS */}
                        <div className="bg-white rounded-xl p-3.5 border border-slate-200 flex items-center justify-between shadow-2xs">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">
                              Sumatif Akhir (SAS)
                            </span>
                            <span className="text-xs text-slate-400">Bobot 25%</span>
                          </div>
                          <span
                            className={`text-2xl font-black ${
                              activeStudentData.calc.sumatifAkhir === null
                                ? 'text-slate-300'
                                : activeStudentData.calc.sumatifAkhir >= kkm
                                ? 'text-teal-700'
                                : 'text-rose-700'
                            }`}
                          >
                            {activeStudentData.calc.sumatifAkhir ?? '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-teal-50/70 border border-teal-200/80 rounded-xl p-3 text-[11px] text-teal-900 mt-2">
                      <strong>Rumus Capaian:</strong> Nilai Akhir dihitung dari 50% Formatif + 25% STS + 25% SAS
                      sesuai pedoman Asesmen Kurikulum Merdeka.
                    </div>
                  </div>
                </div>

                {/* Teacher's Feedback & Guidance */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-2">
                  <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span>Catatan Masukan Pembelajaran & Remedial</span>
                  </h4>
                  <div className="bg-white rounded-xl p-4 border border-slate-200 text-sm leading-relaxed text-slate-700">
                    {activeStudentData.grade?.catatan ? (
                      <p className="italic">"{activeStudentData.grade.catatan}"</p>
                    ) : (
                      <p className="text-slate-500 italic">
                        {activeStudentData.calc.isTuntas
                          ? 'Selamat atas capaian prestasi belajar yang telah diraih. Pertahankan kedisiplinan dan semangat belajar ananda pada materi berikutnya.'
                          : 'Perlu peningkatan pada pemahaman konsep dan penyelesaian tugas formatif. Mohon bimbingan orang tua dalam memotivasi ananda mengikuti program remedial.'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Bar (WhatsApp & Print) */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 print:hidden">
                  <div className="text-xs text-slate-500">
                    Bagikan hasil belajar ananda kepada orang tua atau simpan salinan digital.
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleShareStudentWhatsApp}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Kirim Rapor ke WhatsApp Ortu</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Cetak Rapor Nilai</span>
                    </button>
                  </div>
                </div>

                {/* Printable Signature Section (Only on Print) */}
                <div className="hidden print:grid grid-cols-2 gap-8 pt-12 text-center text-xs">
                  <div>
                    <p className="font-semibold text-slate-700">Mengetahui,</p>
                    <p className="font-semibold text-slate-700">Orang Tua / Wali Siswa</p>
                    <div className="h-16" />
                    <p className="font-bold underline text-slate-900">( ............................................ )</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">Bawang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p className="font-semibold text-slate-700">Guru Pengampu Mata Pelajaran</p>
                    <div className="h-16" />
                    <p className="font-bold underline text-slate-900">{data.waliKelas}</p>
                    {data.nip && <p className="text-[10px] text-slate-600">NIP. {data.nip}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REKAPITULASI NILAI KELAS (CLASS RECAP TABLE) */}
        {activeTab === 'rekap' && allowClassRecap && (
          <div className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5 print:grid-cols-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Rata-rata Kelas
                </span>
                <span className="text-2xl font-black text-indigo-700 mt-1 block">
                  {classStats.rataRataKelas}
                </span>
                <span className="text-[10px] text-slate-500">KKM: {kkm}</span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Ketuntasan Kelas
                </span>
                <span className="text-2xl font-black text-emerald-700 mt-1 block">
                  {classStats.persenTuntas}%
                </span>
                <span className="text-[10px] text-slate-500">
                  {classStats.tuntasCount} dari {classStats.totalSiswa} Siswa Tuntas
                </span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Nilai Tertinggi
                </span>
                <span className="text-2xl font-black text-teal-700 mt-1 block">
                  {classStats.nilaiTertinggi}
                </span>
                <span className="text-[10px] text-slate-500">Skor Maksimal</span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Nilai Terendah
                </span>
                <span className="text-2xl font-black text-amber-700 mt-1 block">
                  {classStats.nilaiTerendah}
                </span>
                <span className="text-[10px] text-slate-500">Perlu Pendampingan</span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs col-span-2 sm:col-span-4 lg:col-span-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Distribusi Predikat
                </span>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    A: {classStats.predikatCounts.A}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800">
                    B: {classStats.predikatCounts.B}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                    C: {classStats.predikatCounts.C}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                    D: {classStats.predikatCounts.D}
                  </span>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 print:hidden">
              <div className="flex items-center gap-2 flex-1 max-w-sm">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchRecap}
                    onChange={(e) => setSearchRecap(e.target.value)}
                    placeholder="Cari siswa atau NISN..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 text-xs rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                  {searchRecap && (
                    <button
                      type="button"
                      onClick={() => setSearchRecap('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setFilterRecapStatus('all')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    filterRecapStatus === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Semua ({calculatedStudentsMap.size})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterRecapStatus('tuntas')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    filterRecapStatus === 'tuntas'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                  }`}
                >
                  Tuntas ({classStats.tuntasCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterRecapStatus('belum_tuntas')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    filterRecapStatus === 'belum_tuntas'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-800'
                  }`}
                >
                  Belum Tuntas ({classStats.belumTuntasCount})
                </button>

                <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

                {/* Export CSV Button */}
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-2xs ml-auto sm:ml-0"
                  title="Unduh rekapitulasi nilai format spreadsheet CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh CSV</span>
                </button>
              </div>
            </div>

            {/* Recap Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-3 w-12 text-center">No</th>
                      <th className="py-3 px-4 min-w-[180px]">Nama Siswa</th>
                      <th className="py-3 px-3 text-center w-28">NISN</th>
                      <th className="py-3 px-3 text-center w-28">Rata Formatif</th>
                      <th className="py-3 px-3 text-center w-24">STS (25%)</th>
                      <th className="py-3 px-3 text-center w-24">SAS (25%)</th>
                      <th className="py-3 px-3 text-center w-28 bg-indigo-50/50">Nilai Akhir</th>
                      <th className="py-3 px-3 text-center w-24">Predikat</th>
                      <th className="py-3 px-3 text-center w-28">Status</th>
                      <th className="py-3 px-3 text-center w-24 print:hidden">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecapStudents.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-8 text-slate-400">
                          Tidak ada data siswa yang cocok dengan filter pencarian.
                        </td>
                      </tr>
                    ) : (
                      filteredRecapStudents.map(({ student, calc }) => (
                        <tr
                          key={student.id}
                          onClick={() => {
                            setSelectedStudentId(student.id);
                            setActiveTab('kartu_siswa');
                          }}
                          className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                        >
                          <td className="py-3 px-3 text-center font-bold text-slate-500">
                            {student.no}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                              {student.nama}
                            </div>
                            {student.gender && (
                              <span className="text-[10px] text-slate-400">
                                {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-600">
                            {student.nisn || '-'}
                          </td>
                          <td className="py-3 px-3 text-center font-semibold text-slate-700">
                            {calc.rataFormatif}
                          </td>
                          <td className="py-3 px-3 text-center text-slate-600">
                            {calc.sumatifTengah ?? '-'}
                          </td>
                          <td className="py-3 px-3 text-center text-slate-600">
                            {calc.sumatifAkhir ?? '-'}
                          </td>
                          <td className="py-3 px-3 text-center bg-indigo-50/50">
                            <span className="text-sm font-black text-indigo-900">
                              {calc.nilaiAkhir}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-black uppercase ${
                                calc.predikat === 'A'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : calc.predikat === 'B'
                                  ? 'bg-sky-100 text-sky-800'
                                  : calc.predikat === 'C'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {calc.predikat}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                calc.isTuntas
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {calc.isTuntas ? 'Tuntas' : 'Remedial'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center print:hidden">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStudentId(student.id);
                                setActiveTab('kartu_siswa');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 group-hover:bg-indigo-600 text-indigo-700 group-hover:text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                              title="Buka kartu rapor nilai siswa"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Lihat</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Printable Signatures for Class Recap (Print Only) */}
            <div className="hidden print:grid grid-cols-2 gap-8 pt-12 text-center text-xs">
              <div>
                <p className="font-semibold text-slate-700">Mengetahui,</p>
                <p className="font-semibold text-slate-700">Kepala Sekolah</p>
                <div className="h-16" />
                <p className="font-bold underline text-slate-900">( ............................................ )</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700">
                  Bawang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p className="font-semibold text-slate-700">Guru Pengampu Mata Pelajaran</p>
                <div className="h-16" />
                <p className="font-bold underline text-slate-900">{data.waliKelas}</p>
                {data.nip && <p className="text-[10px] text-slate-600">NIP. {data.nip}</p>}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Public Page QR Code Modal */}
      <QRCodeModal
        isOpen={showHeaderQr}
        onClose={() => setShowHeaderQr(false)}
        url={typeof window !== 'undefined' ? window.location.href : ''}
        title={`QR Rapor Nilai - ${data.className}`}
        subtitle={`Pindai kode QR untuk membuka rekapitulasi penilaian dan capaian kompetensi kelas ${data.className} mata pelajaran ${data.mataPelajaran}.`}
        badgeText="Rapor Nilai"
        badgeColor="indigo"
      />
    </div>
  );
};
