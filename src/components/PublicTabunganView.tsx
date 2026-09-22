import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Search,
  Printer,
  Calendar,
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
  PieChart,
  History,
  Info,
  CheckCircle2,
  Share2,
  Users,
  Coins,
  FileSpreadsheet,
  Layers,
  Filter,
  TrendingUp,
  Clock,
  Eye,
  QrCode,
} from 'lucide-react';
import { FirestoreService, PublicTabunganData } from '../services/firestoreService';
import { subscribeToPreviewSync } from '../services/previewSyncChannel';
import { SavingTransaction, SavingCategory } from '../types';
import { QRCodeModal } from './QRCodeModal';

interface PublicTabunganViewProps {
  shareId: string;
  initialNisn?: string;
  initialStudentId?: string;
  onExitToApp?: () => void;
}

export const PublicTabunganView: React.FC<PublicTabunganViewProps> = ({
  shareId,
  initialNisn,
  initialStudentId,
  onExitToApp,
}) => {
  // Fast initial cache lookup for 0ms instant preview access
  const [data, setData] = useState<PublicTabunganData | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem(`cache_pub_tb_${shareId}`);
      if (cached) return JSON.parse(cached);
      if (shareId.includes('_')) {
        const parts = shareId.split('_');
        const lastPart = parts[parts.length - 1];
        const aliasCached = localStorage.getItem(`cache_pub_tb_tb_${lastPart}`);
        if (aliasCached) return JSON.parse(aliasCached);
      }
    } catch {}
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      if (localStorage.getItem(`cache_pub_tb_${shareId}`)) return false;
      if (shareId.includes('_')) {
        const parts = shareId.split('_');
        const lastPart = parts[parts.length - 1];
        if (localStorage.getItem(`cache_pub_tb_tb_${lastPart}`)) return false;
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

  // Search & Student Selection
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Active View Tab for Parents: defaults to 'semua_harian' if general class link, or 'buku_tabungan' if student link
  const [parentTab, setParentTab] = useState<'semua_harian' | 'buku_tabungan' | 'kas_kelas'>(
    initialNisn || initialStudentId ? 'buku_tabungan' : 'semua_harian'
  );

  // Filters for "Semua Data Harian"
  const [dailyDateFilter, setDailyDateFilter] = useState<'all' | 'today' | '7days' | 'month' | 'custom'>('all');
  const [dailyCustomDate, setDailyCustomDate] = useState<string>('');
  const [dailyCategoryFilter, setDailyCategoryFilter] = useState<string>('all');
  const [dailyTypeFilter, setDailyTypeFilter] = useState<'all' | 'setor' | 'tarik'>('all');
  const [dailySearchQuery, setDailySearchQuery] = useState<string>('');
  const [dailyDisplayMode, setDailyDisplayMode] = useState<'transaksi' | 'rekap_siswa'>('transaksi');
  const [dailyStudentSort, setDailyStudentSort] = useState<'no' | 'nama' | 'saldo' | 'transaksi'>('no');

  // Category filter for passbook
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // PIN protection state if teacher configured PIN
  const [isPinUnlocked, setIsPinUnlocked] = useState<boolean>(true);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Real-time listener for Firestore public document + instant 0ms cross-tab/channel synchronization
  useEffect(() => {
    // Only show loading indicator if data has not yet been loaded from cache
    if (!data) {
      setIsLoading(true);
    }
    setErrorMsg(null);

    const applyDataUpdate = (updatedData: PublicTabunganData | null) => {
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

        // Flash pulse effect on real-time update
        setSyncPulse(true);
        setTimeout(() => setSyncPulse(false), 2000);

        if (updatedData.pinRequired && updatedData.accessPin) {
          setIsPinUnlocked(false);
        } else {
          setIsPinUnlocked(true);
        }
      } else {
        // If Firestore returns null (not found in cloud yet), check fallback
        setErrorMsg('Tautan publik tabungan belum ditemukan atau belum diterbitkan oleh wali kelas.');
        setIsLiveConnected(false);
      }
    };

    // 1. Instant cross-tab and storage channel synchronization (0ms latency)
    const unsubChannel = subscribeToPreviewSync('tabungan', shareId, (instantData) => {
      if (instantData) {
        applyDataUpdate(instantData);
      }
    });

    // 2. Cloud Firestore persistent real-time streaming
    const unsubscribe = FirestoreService.subscribePublicTabungan(
      shareId,
      (updatedData) => {
        applyDataUpdate(updatedData);
      },
      (err) => {
        console.error('[PublicTabunganView] Firestore listener error:', err);
        setIsLoading(false);
        setErrorMsg('Gagal terhubung ke Cloud Firestore: ' + (err?.message || 'Periksa koneksi internet'));
        setIsLiveConnected(false);
      }
    );

    return () => {
      unsubChannel();
      unsubscribe();
    };
  }, [shareId]);

  // Handle direct link (from URL nisn or studentId) once data loads
  useEffect(() => {
    if (!data || !data.students) return;

    if (initialNisn) {
      const match = data.students.find((s) => s.nisn === initialNisn);
      if (match) {
        setSelectedStudentId(match.id);
        return;
      }
    }

    if (initialStudentId) {
      const match = data.students.find((s) => s.id === initialStudentId);
      if (match) {
        setSelectedStudentId(match.id);
        return;
      }
    }

    // Default select first student if not yet selected and not searching
    if (!selectedStudentId && data.students.length > 0 && !searchQuery) {
      setSelectedStudentId(data.students[0].id);
    }
  }, [data, initialNisn, initialStudentId]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getCategoryLabel = (cat: SavingCategory | string) => {
    switch (cat) {
      case 'harian':
        return 'Tabungan Harian';
      case 'kas_kelas':
        return 'Kas Kelas';
      case 'qurban':
        return 'Tabungan Qurban';
      case 'rekreasi':
        return 'Rekreasi / Wisata';
      case 'lks_buku':
        return 'Buku / LKS';
      default:
        return 'Lainnya';
    }
  };

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    if (!data?.students) return [];
    if (!searchQuery.trim()) return data.students;
    const q = searchQuery.toLowerCase();
    return data.students.filter(
      (s) => s.nama.toLowerCase().includes(q) || (s.nisn && s.nisn.includes(q))
    );
  }, [data?.students, searchQuery]);

  // Selected student object
  const currentStudent = useMemo(() => {
    if (!data?.students || !selectedStudentId) return null;
    return data.students.find((s) => s.id === selectedStudentId) || null;
  }, [data?.students, selectedStudentId]);

  // Transactions for current student
  const studentTransactions = useMemo(() => {
    if (!data?.savings || !selectedStudentId) return [];
    let list = data.savings.filter((tx) => tx.studentId === selectedStudentId);
    if (selectedCategory !== 'all') {
      list = list.filter((tx) => tx.kategori === selectedCategory);
    }
    // Sort chronological: oldest first for running balance calculation
    return [...list].sort(
      (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
    );
  }, [data?.savings, selectedStudentId, selectedCategory]);

  // Calculate cumulative balances for selected student
  const { totalSetor, totalTarik, currentBalance, transactionsWithBalance, categoryBalances } =
    useMemo(() => {
      let running = 0;
      let setor = 0;
      let tarik = 0;

      const catMap: Record<string, number> = {};

      const withBal = studentTransactions.map((tx) => {
        if (tx.jenis === 'setor') {
          running += tx.nominal;
          setor += tx.nominal;
          catMap[tx.kategori] = (catMap[tx.kategori] || 0) + tx.nominal;
        } else {
          running -= tx.nominal;
          tarik += tx.nominal;
          catMap[tx.kategori] = (catMap[tx.kategori] || 0) - tx.nominal;
        }
        return {
          ...tx,
          runningBalance: running,
        };
      });

      return {
        totalSetor: setor,
        totalTarik: tarik,
        currentBalance: running,
        // Reverse for display: newest transaction at the top
        transactionsWithBalance: [...withBal].reverse(),
        categoryBalances: catMap,
      };
    }, [studentTransactions]);

  // Class Cash Summary
  const classKasSummary = useMemo(() => {
    if (!data?.savings) return { totalKasMasuk: 0, totalKasKeluar: 0, saldoKas: 0, kasTransactions: [] };
    const kasTxs = data.savings.filter((tx) => tx.kategori === 'kas_kelas');
    const masuk = kasTxs.filter((t) => t.jenis === 'setor').reduce((sum, t) => sum + t.nominal, 0);
    const keluar = kasTxs.filter((t) => t.jenis === 'tarik').reduce((sum, t) => sum + t.nominal, 0);
    return {
      totalKasMasuk: masuk,
      totalKasKeluar: keluar,
      saldoKas: masuk - keluar,
      kasTransactions: [...kasTxs].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()),
    };
  }, [data?.savings]);

  // Today's date string (YYYY-MM-DD)
  const todayDateStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Class Savings Totals (All Students in Class)
  const classSavingsSummary = useMemo(() => {
    if (!data?.savings) {
      return {
        totalSetor: 0,
        totalTarik: 0,
        saldoTotal: 0,
        totalTransaksi: 0,
        todaySetor: 0,
        todayTxsCount: 0,
        activeStudentsCount: 0,
      };
    }
    const all = data.savings;
    const setor = all.filter((t) => t.jenis === 'setor').reduce((sum, t) => sum + t.nominal, 0);
    const tarik = all.filter((t) => t.jenis === 'tarik').reduce((sum, t) => sum + t.nominal, 0);
    const todayTxs = all.filter((t) => t.tanggal === todayDateStr);
    const todaySetor = todayTxs.filter((t) => t.jenis === 'setor').reduce((sum, t) => sum + t.nominal, 0);

    // Count students with active balance > 0
    const studentBalanceMap = new Map<string, number>();
    all.forEach((t) => {
      const prev = studentBalanceMap.get(t.studentId) || 0;
      studentBalanceMap.set(t.studentId, prev + (t.jenis === 'setor' ? t.nominal : -t.nominal));
    });
    let activeCount = 0;
    studentBalanceMap.forEach((bal) => {
      if (bal > 0) activeCount++;
    });

    return {
      totalSetor: setor,
      totalTarik: tarik,
      saldoTotal: setor - tarik,
      totalTransaksi: all.length,
      todaySetor,
      todayTxsCount: todayTxs.length,
      activeStudentsCount: activeCount,
    };
  }, [data?.savings, todayDateStr]);

  // Unique transaction dates list for dropdown filter
  const availableTransactionDates = useMemo(() => {
    if (!data?.savings) return [];
    const setDates = new Set(data.savings.map((t) => t.tanggal));
    return Array.from(setDates).sort().reverse();
  }, [data?.savings]);

  // Filtered Daily Transactions List for "Semua Data Harian"
  const filteredDailyTransactions = useMemo(() => {
    if (!data?.savings) return [];
    let list = [...data.savings];

    // Filter by Date
    if (dailyDateFilter === 'today') {
      list = list.filter((t) => t.tanggal === todayDateStr);
    } else if (dailyDateFilter === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const sevenDaysAgo = d.toISOString().split('T')[0];
      list = list.filter((t) => t.tanggal >= sevenDaysAgo);
    } else if (dailyDateFilter === 'month') {
      const monthPrefix = todayDateStr.slice(0, 7);
      list = list.filter((t) => t.tanggal.startsWith(monthPrefix));
    } else if (dailyDateFilter === 'custom' && dailyCustomDate) {
      list = list.filter((t) => t.tanggal === dailyCustomDate);
    }

    // Filter by Category / Pos
    if (dailyCategoryFilter !== 'all') {
      list = list.filter((t) => t.kategori === dailyCategoryFilter);
    }

    // Filter by Type
    if (dailyTypeFilter !== 'all') {
      list = list.filter((t) => t.jenis === dailyTypeFilter);
    }

    // Filter by Search Query
    if (dailySearchQuery.trim()) {
      const q = dailySearchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.studentName.toLowerCase().includes(q) ||
          (t.nisn && t.nisn.includes(q)) ||
          (t.keterangan && t.keterangan.toLowerCase().includes(q)) ||
          (t.petugas && t.petugas.toLowerCase().includes(q))
      );
    }

    // Sort newest first
    return list.sort((a, b) => {
      const dateDiff = new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
      if (dateDiff !== 0) return dateDiff;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }, [
    data?.savings,
    dailyDateFilter,
    dailyCustomDate,
    dailyCategoryFilter,
    dailyTypeFilter,
    dailySearchQuery,
    todayDateStr,
  ]);

  // Summary of filtered transactions
  const filteredDailyMetrics = useMemo(() => {
    const setor = filteredDailyTransactions.filter((t) => t.jenis === 'setor').reduce((s, t) => s + t.nominal, 0);
    const tarik = filteredDailyTransactions.filter((t) => t.jenis === 'tarik').reduce((s, t) => s + t.nominal, 0);
    return {
      count: filteredDailyTransactions.length,
      totalSetor: setor,
      totalTarik: tarik,
      saldoNet: setor - tarik,
    };
  }, [filteredDailyTransactions]);

  // Student-level summary list for all students in class
  const studentsSummaryList = useMemo(() => {
    if (!data?.students) return [];
    const allTxs = data.savings || [];

    const list = data.students.map((std) => {
      const stdTxs = allTxs.filter((t) => t.studentId === std.id);
      const totalSetor = stdTxs.filter((t) => t.jenis === 'setor').reduce((sum, t) => sum + t.nominal, 0);
      const totalTarik = stdTxs.filter((t) => t.jenis === 'tarik').reduce((sum, t) => sum + t.nominal, 0);
      const saldoAkhir = totalSetor - totalTarik;

      const sortedTxs = [...stdTxs].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
      const lastTxDate = sortedTxs.length > 0 ? sortedTxs[0].tanggal : '-';

      return {
        ...std,
        totalSetor,
        totalTarik,
        saldoAkhir,
        txCount: stdTxs.length,
        lastTxDate,
      };
    });

    let filtered = list;
    if (dailySearchQuery.trim()) {
      const q = dailySearchQuery.toLowerCase();
      filtered = list.filter((s) => s.nama.toLowerCase().includes(q) || (s.nisn && s.nisn.includes(q)));
    }

    if (dailyStudentSort === 'saldo') {
      return [...filtered].sort((a, b) => b.saldoAkhir - a.saldoAkhir);
    } else if (dailyStudentSort === 'nama') {
      return [...filtered].sort((a, b) => a.nama.localeCompare(b.nama));
    } else if (dailyStudentSort === 'transaksi') {
      return [...filtered].sort((a, b) => b.txCount - a.txCount);
    }
    return [...filtered].sort((a, b) => a.no - b.no);
  }, [data?.students, data?.savings, dailySearchQuery, dailyStudentSort]);

  // Quick switch from daily table to student passbook
  const handleOpenStudentPassbook = (studentId: string) => {
    setSelectedStudentId(studentId);
    setParentTab('buku_tabungan');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Trigger Print for Passbook
  const handlePrintPassbook = () => {
    window.print();
  };

  // Contact Wali Kelas via WhatsApp
  const handleContactWaliWA = () => {
    if (!data || !currentStudent) return;
    const msg =
      `Assalamu'alaikum Wr. Wb. Bapak/Ibu Wali Kelas ${data.className},\n` +
      `Saya orang tua/wali dari ${currentStudent.nama} (NISN: ${currentStudent.nisn || '-'}).\n` +
      `Ingin konfirmasi/bertanya perihal tabungan ananda dengan saldo tercatat ${formatRupiah(currentBalance)}.\n` +
      `Terima kasih.`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  // Export Daily Transactions or Recap to CSV
  const handleExportDailyCsv = () => {
    if (!data) return;
    let csvContent = '\uFEFF'; // UTF-8 BOM

    if (dailyDisplayMode === 'transaksi') {
      csvContent += `"LAPORAN MUTASI HARIAN TABUNGAN SISWA"\n`;
      csvContent += `"Sekolah:","${data.schoolName || 'SMK Muhammadiyah Bawang'}"\n`;
      csvContent += `"Kelas:","${data.className}"\n`;
      csvContent += `"Wali Kelas:","${data.waliKelas}"\n`;
      csvContent += `"Periode:","${dailyDateFilter === 'custom' ? dailyCustomDate : dailyDateFilter}"\n`;
      csvContent += `"Tanggal Unduh:","${new Date().toLocaleDateString('id-ID')}"\n\n`;
      csvContent += `"No","Tanggal","Nama Siswa","NISN","Jenis","Kategori","Nominal","Keterangan","Petugas"\n`;

      filteredDailyTransactions.forEach((tx, idx) => {
        csvContent += `"${idx + 1}","${tx.tanggal}","${tx.studentName.replace(/"/g, '""')}","${tx.nisn || ''}","${tx.jenis === 'setor' ? 'Setor' : 'Tarik'}","${getCategoryLabel(tx.kategori)}","${tx.nominal}","${(tx.keterangan || '').replace(/"/g, '""')}","${(tx.petugas || '').replace(/"/g, '""')}"\n`;
      });
    } else {
      csvContent += `"REKAPITULASI TABUNGAN SISWA PER KELAS"\n`;
      csvContent += `"Sekolah:","${data.schoolName || 'SMK Muhammadiyah Bawang'}"\n`;
      csvContent += `"Kelas:","${data.className}"\n`;
      csvContent += `"Wali Kelas:","${data.waliKelas}"\n`;
      csvContent += `"Tanggal Unduh:","${new Date().toLocaleDateString('id-ID')}"\n\n`;
      csvContent += `"No. Absen","Nama Siswa","NISN","Total Setor","Total Tarik","Saldo Akhir","Jumlah Transaksi","Transaksi Terakhir"\n`;

      studentsSummaryList.forEach((std) => {
        csvContent += `"${std.no}","${std.nama.replace(/"/g, '""')}","${std.nisn || ''}","${std.totalSetor}","${std.totalTarik}","${std.saldoAkhir}","${std.txCount}","${std.lastTxDate}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Tabungan_Harian_${data.className.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // PIN unlock handler
  const handleUnlockPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.accessPin) {
      setIsPinUnlocked(true);
      return;
    }
    if (enteredPin.trim() === data.accessPin.trim()) {
      setIsPinUnlocked(true);
      setPinError(null);
    } else {
      setPinError('PIN yang Anda masukkan salah. Hubungi wali kelas untuk bantuan.');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 text-center max-w-md w-full space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto animate-pulse">
            <Wallet className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-800">Menghubungkan Portal Tabungan Siswa...</h2>
          <p className="text-xs text-slate-500">
            Mengambil data mutasi tabungan real-time dari Cloud Firestore SMK Muhammadiyah Bawang
          </p>
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-600 pt-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Memuat data resmi...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error or Not Found state
  if (errorMsg || !data) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-rose-200 text-center max-w-md w-full space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <Info className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900">Data Tabungan Belum Tersedia</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {errorMsg || 'Tautan ini belum aktif atau belum dipublikasikan oleh Wali Kelas.'}
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Muat Ulang Halaman</span>
            </button>
            {onExitToApp && (
              <button
                onClick={onExitToApp}
                className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Kembali ke Aplikasi Utama
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // PIN Unlock Screen if teacher locked with PIN
  if (!isPinUnlocked) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="text-center">
            <h2 className="text-base font-extrabold text-slate-900">Akses Dilindungi PIN</h2>
            <p className="text-xs text-slate-500 mt-1">
              Masukkan PIN dari Wali Kelas {data.className} untuk melihat data tabungan.
            </p>
          </div>

          <form onSubmit={handleUnlockPin} className="space-y-3">
            <input
              type="password"
              maxLength={8}
              placeholder="Masukkan PIN..."
              value={enteredPin}
              onChange={(e) => setEnteredPin(e.target.value)}
              className="w-full text-center tracking-widest text-lg font-mono py-2.5 px-4 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              autoFocus
            />
            {pinError && <p className="text-xs text-rose-600 text-center font-medium">{pinError}</p>}
            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Buka Tabungan Siswa
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans pb-12">
      {/* Top Bar for Parents */}
      <header className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 text-white shadow-md no-print sticky top-0 z-30">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* School & Brand Title */}
          <div className="flex items-center gap-3">
            <img
              src="/logo-smk.png"
              alt="Logo SMK Muhammadiyah Bawang"
              className="w-10 h-10 object-contain drop-shadow-md rounded-lg bg-white/10 p-0.5"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-black tracking-tight text-white">
                  {data.schoolName || 'SMK Muhammadiyah Bawang'}
                </h1>
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                  Portal Orang Tua
                </span>
              </div>
              <p className="text-xs text-teal-100 font-medium">
                Buku Tabungan & Kas Kelas: <strong className="text-white font-extrabold">{data.className}</strong>
              </p>
            </div>
          </div>

          {/* Real-time Cloud Status Badge */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                syncPulse
                  ? 'bg-emerald-400 text-slate-900 shadow-md scale-105'
                  : 'bg-white/10 text-emerald-200 border border-white/15'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="truncate">
                {isLiveConnected ? 'Real-Time Cloud Aktif' : 'Tersinkronisasi'}
              </span>
              {lastLiveSync && (
                <span className="text-[11px] text-teal-200 font-normal hidden md:inline">
                  • {lastLiveSync} WIB
                </span>
              )}
            </div>

            {/* QR Code Button */}
            <button
              type="button"
              onClick={() => setShowHeaderQr(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer shadow-xs"
              title="Tampilkan Kode QR Halaman Ini"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">QR Code</span>
            </button>

            {onExitToApp && (
              <button
                onClick={onExitToApp}
                className="text-[11px] text-teal-200 hover:text-white underline underline-offset-4 px-2 py-1 cursor-pointer transition-colors"
                title="Beralih ke Aplikasi Portal Guru"
              >
                Portal Guru
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 grow space-y-6">
        {/* Class Overview Banner (No-Print) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs no-print flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300/50">
                {data.className}
              </span>
              {data.jurusan && (
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                  {data.jurusan}
                </span>
              )}
              <span className="text-xs text-slate-500 font-medium">
                T.A. {data.academicYear} ({data.semester})
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Wali Kelas / Bendahara: <strong className="text-slate-800 font-bold">{data.waliKelas}</strong>
              {data.nip && <span className="text-slate-400 font-mono"> (NIP: {data.nip})</span>}
            </p>
          </div>

          {/* Navigation Tabs for Parents */}
          <div className="flex items-center gap-2 self-stretch md:self-auto bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold flex-wrap">
            <button
              onClick={() => setParentTab('semua_harian')}
              className={`flex-1 md:flex-none px-3.5 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                parentTab === 'semua_harian'
                  ? 'bg-white text-emerald-800 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Semua Data Harian</span>
            </button>

            <button
              onClick={() => setParentTab('buku_tabungan')}
              className={`flex-1 md:flex-none px-3.5 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                parentTab === 'buku_tabungan'
                  ? 'bg-white text-emerald-800 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Buku Tabungan Siswa</span>
            </button>

            {data.allowClassRecap && (
              <button
                onClick={() => setParentTab('kas_kelas')}
                className={`flex-1 md:flex-none px-3.5 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  parentTab === 'kas_kelas'
                    ? 'bg-white text-emerald-800 shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PieChart className="w-3.5 h-3.5" />
                <span>Kas & Keuangan Kelas</span>
              </button>
            )}
          </div>
        </div>

        {/* ================= VIEW 0: SEMUA DATA HARIAN TABUNGAN SISWA ================= */}
        {parentTab === 'semua_harian' && (
          <div className="space-y-6">
            {/* Printable Class Header (Hidden on Screen, Shown on Print) */}
            <div className="hidden print:block text-center border-b-2 border-slate-900 pb-4 mb-4">
              <h1 className="text-lg font-black uppercase tracking-wide">
                {data.schoolName || 'SMK MUHAMMADIYAH BAWANG'}
              </h1>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                LAPORAN REKAPITULASI DATA HARIAN TABUNGAN SISWA
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Kelas: {data.className} • Tahun Ajaran: {data.academicYear} ({data.semester})
              </p>
              <div className="grid grid-cols-2 gap-2 text-left text-xs mt-3 pt-3 border-t border-slate-300">
                <div>
                  <span className="font-bold">Wali Kelas / Bendahara:</span> {data.waliKelas} {data.nip ? `(NIP: ${data.nip})` : ''}
                </div>
                <div>
                  <span className="font-bold">Tanggal Cetak:</span>{' '}
                  {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div>
                  <span className="font-bold">Total Saldo Terkumpul:</span> {formatRupiah(classSavingsSummary.saldoTotal)}
                </div>
                <div>
                  <span className="font-bold">Total Siswa Aktif:</span> {classSavingsSummary.activeStudentsCount} dari {data.students.length} Siswa
                </div>
              </div>
            </div>

            {/* Class Executive Highlight Cards (No-Print) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
              {/* Card 1: Total Tabungan Siswa Tersimpan */}
              <div className="bg-gradient-to-br from-emerald-700 to-teal-800 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
                    Total Tabungan Siswa
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-emerald-100" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-black tracking-tight block">
                    {formatRupiah(classSavingsSummary.saldoTotal)}
                  </span>
                  <span className="text-[11px] text-teal-100 mt-0.5 block">
                    Sisa saldo akumulatif seluruh kelas
                  </span>
                </div>
              </div>

              {/* Card 2: Total Setoran Masuk */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Setoran Masuk
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ArrowDownRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-black text-emerald-700 tracking-tight block">
                    {formatRupiah(classSavingsSummary.totalSetor)}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                    {classSavingsSummary.todaySetor > 0 ? (
                      <span className="text-emerald-600 font-bold">
                        +{formatRupiah(classSavingsSummary.todaySetor)} hari ini
                      </span>
                    ) : (
                      <span>Tercatat sejak awal semester</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 3: Total Penarikan Siswa */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Penarikan
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-black text-rose-700 tracking-tight block">
                    {formatRupiah(classSavingsSummary.totalTarik)}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Pencairan & penarikan siswa
                  </span>
                </div>
              </div>

              {/* Card 4: Transaksi & Partisipasi */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Partisipasi Menabung
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-black text-slate-800 tracking-tight block">
                    {classSavingsSummary.activeStudentsCount} / {data.students.length}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Siswa memiliki saldo • {classSavingsSummary.totalTransaksi} transaksi
                  </span>
                </div>
              </div>
            </div>

            {/* Filter, Search & View Controls Bar (No-Print) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs no-print space-y-4">
              {/* Row 1: Search & Mode Switcher */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama siswa, NISN, catatan, atau petugas..."
                    value={dailySearchQuery}
                    onChange={(e) => setDailySearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  {dailySearchQuery && (
                    <button
                      onClick={() => setDailySearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Mode Switcher: Transaksi Harian vs Rekap Siswa */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold shrink-0">
                  <button
                    onClick={() => setDailyDisplayMode('transaksi')}
                    className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      dailyDisplayMode === 'transaksi'
                        ? 'bg-white text-emerald-800 shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Daftar Transaksi Harian ({filteredDailyTransactions.length})</span>
                  </button>

                  <button
                    onClick={() => setDailyDisplayMode('rekap_siswa')}
                    className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      dailyDisplayMode === 'rekap_siswa'
                        ? 'bg-white text-emerald-800 shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Rekapitulasi Saldo Siswa ({studentsSummaryList.length})</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Date Filters & Category Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                {/* Date Filter Badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-slate-600 mr-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Periode:</span>
                  </span>

                  <button
                    onClick={() => {
                      setDailyDateFilter('all');
                      setDailyCustomDate('');
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      dailyDateFilter === 'all'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Semua Tanggal
                  </button>

                  <button
                    onClick={() => {
                      setDailyDateFilter('today');
                      setDailyCustomDate('');
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      dailyDateFilter === 'today'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Hari Ini
                  </button>

                  <button
                    onClick={() => {
                      setDailyDateFilter('7days');
                      setDailyCustomDate('');
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      dailyDateFilter === '7days'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    7 Hari Terakhir
                  </button>

                  <button
                    onClick={() => {
                      setDailyDateFilter('month');
                      setDailyCustomDate('');
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      dailyDateFilter === 'month'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Bulan Ini
                  </button>

                  {/* Specific Date Picker */}
                  <div className="flex items-center gap-1.5 ml-1">
                    <input
                      type="date"
                      value={dailyCustomDate}
                      onChange={(e) => {
                        setDailyCustomDate(e.target.value);
                        if (e.target.value) {
                          setDailyDateFilter('custom');
                        } else {
                          setDailyDateFilter('all');
                        }
                      }}
                      className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-700 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                      title="Pilih tanggal mutasi harian spesifik"
                    />
                  </div>
                </div>

                {/* Additional Filters & Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Category Filter */}
                  <select
                    value={dailyCategoryFilter}
                    onChange={(e) => setDailyCategoryFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="all">Semua Pos Tabungan</option>
                    <option value="harian">Tabungan Harian</option>
                    <option value="kas_kelas">Kas Kelas</option>
                    <option value="qurban">Tabungan Qurban</option>
                    <option value="rekreasi">Rekreasi / Wisata</option>
                    <option value="lks_buku">Buku / LKS</option>
                    <option value="lainnya">Lainnya</option>
                  </select>

                  {/* Type Filter */}
                  <select
                    value={dailyTypeFilter}
                    onChange={(e) => setDailyTypeFilter(e.target.value as any)}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="all">Semua Jenis</option>
                    <option value="setor">Hanya Setor (+)</option>
                    <option value="tarik">Hanya Tarik (-)</option>
                  </select>

                  {/* Print Daily Recap Button */}
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    title="Cetak format cetak / PDF dokumen resmi"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak</span>
                  </button>

                  {/* Export CSV Button */}
                  <button
                    onClick={handleExportDailyCsv}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    title="Unduh laporan ke format Excel / Spreadsheet CSV"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Unduh CSV</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ================= TAMPILAN 1: DAFTAR TRANSAKSI HARIAN ================= */}
            {dailyDisplayMode === 'transaksi' && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-0">
                {/* Sub-Header Banner */}
                <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-700" />
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-800">
                      Jurnal Mutasi Harian Seluruh Siswa Kelas {data.className}
                    </h3>
                  </div>

                  {/* Subtotal Pill */}
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <span className="text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-lg">
                      Setor: +{formatRupiah(filteredDailyMetrics.totalSetor)}
                    </span>
                    <span className="text-rose-700 bg-rose-100/70 px-2.5 py-1 rounded-lg">
                      Tarik: -{formatRupiah(filteredDailyMetrics.totalTarik)}
                    </span>
                    <span className="text-slate-800 bg-slate-200/80 px-2.5 py-1 rounded-lg">
                      Net: {formatRupiah(filteredDailyMetrics.saldoNet)}
                    </span>
                  </div>
                </div>

                {/* Table of Daily Transactions */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100/80 text-slate-600 font-extrabold border-b border-slate-200 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-3.5 text-center w-10">No</th>
                        <th className="py-3 px-3.5">Tanggal</th>
                        <th className="py-3 px-3.5">Nama Siswa</th>
                        <th className="py-3 px-3.5 text-center">Jenis</th>
                        <th className="py-3 px-3.5">Pos Tabungan</th>
                        <th className="py-3 px-3.5">Catatan / Keperluan</th>
                        <th className="py-3 px-3.5 text-right font-black">Nominal</th>
                        <th className="py-3 px-3.5 text-center">Petugas</th>
                        <th className="py-3 px-3.5 text-center no-print w-24">Buku Tabungan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredDailyTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-slate-400">
                            <Wallet className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                            <p className="font-bold text-slate-700 text-sm">Tidak Ada Catatan Transaksi Harian</p>
                            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                              Tidak ditemukan data transaksi tabungan pada periode atau filter yang dipilih.
                              Coba ubah pilihan tanggal atau bersihkan kolom pencarian.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredDailyTransactions.map((tx, idx) => {
                          const isSetor = tx.jenis === 'setor';
                          return (
                            <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2.5 px-3.5 text-center text-slate-400 font-mono">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3.5 font-medium text-slate-700 whitespace-nowrap">
                                {tx.tanggal}
                              </td>
                              <td className="py-2.5 px-3.5 whitespace-nowrap">
                                <button
                                  onClick={() => handleOpenStudentPassbook(tx.studentId)}
                                  className="font-bold text-slate-900 hover:text-emerald-700 hover:underline text-left cursor-pointer transition-colors"
                                  title="Klik untuk membuka buku tabungan siswa ini"
                                >
                                  {tx.studentName}
                                </button>
                                {tx.nisn && (
                                  <span className="text-[10px] text-slate-400 font-mono block">
                                    NISN: {tx.nisn}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                                    isSetor
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {isSetor ? (
                                    <>
                                      <ArrowDownRight className="w-3 h-3" />
                                      <span>Setor</span>
                                    </>
                                  ) : (
                                    <>
                                      <ArrowUpRight className="w-3 h-3" />
                                      <span>Tarik</span>
                                    </>
                                  )}
                                </span>
                              </td>
                              <td className="py-2.5 px-3.5 whitespace-nowrap">
                                <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                  {getCategoryLabel(tx.kategori)}
                                </span>
                              </td>
                              <td className="py-2.5 px-3.5 text-slate-600 max-w-xs truncate">
                                {tx.keterangan || '-'}
                              </td>
                              <td
                                className={`py-2.5 px-3.5 text-right font-black whitespace-nowrap text-sm ${
                                  isSetor ? 'text-emerald-700' : 'text-rose-700'
                                }`}
                              >
                                {isSetor ? '+' : '-'} {formatRupiah(tx.nominal)}
                              </td>
                              <td className="py-2.5 px-3.5 text-center text-slate-500 whitespace-nowrap">
                                {tx.petugas || 'Wali Kelas'}
                              </td>
                              <td className="py-2.5 px-3.5 text-center no-print whitespace-nowrap">
                                <button
                                  onClick={() => handleOpenStudentPassbook(tx.studentId)}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded-lg transition-all flex items-center gap-1 mx-auto cursor-pointer border border-emerald-200"
                                  title="Lihat rincian buku tabungan ananda"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Buku</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    {filteredDailyTransactions.length > 0 && (
                      <tfoot className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-300">
                        <tr>
                          <td colSpan={6} className="py-3 px-3.5 text-right uppercase tracking-wider text-xs">
                            Total Mutasi Terfilter ({filteredDailyTransactions.length} transaksi):
                          </td>
                          <td className="py-3 px-3.5 text-right text-emerald-800 text-sm whitespace-nowrap">
                            {formatRupiah(filteredDailyMetrics.saldoNet)}
                          </td>
                          <td colSpan={2} className="py-3 px-3.5"></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}

            {/* ================= TAMPILAN 2: REKAPITULASI SALDO SISWA ================= */}
            {dailyDisplayMode === 'rekap_siswa' && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-0">
                {/* Sub-Header Banner */}
                <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-700" />
                      <span>Rekapitulasi Saldo Tabungan Seluruh Siswa ({studentsSummaryList.length} Siswa)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Rincian total setoran, penarikan, dan saldo aktif tiap siswa di kelas {data.className}
                    </p>
                  </div>

                  {/* Sort Options */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-bold text-slate-500 text-[11px]">Urutkan:</span>
                    <button
                      onClick={() => setDailyStudentSort('no')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        dailyStudentSort === 'no' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      No. Absen
                    </button>
                    <button
                      onClick={() => setDailyStudentSort('nama')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        dailyStudentSort === 'nama' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      Nama
                    </button>
                    <button
                      onClick={() => setDailyStudentSort('saldo')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        dailyStudentSort === 'saldo' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      Saldo Tertinggi
                    </button>
                    <button
                      onClick={() => setDailyStudentSort('transaksi')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        dailyStudentSort === 'transaksi' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      Keaktifan
                    </button>
                  </div>
                </div>

                {/* Table of Students Recap */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100/80 text-slate-600 font-extrabold border-b border-slate-200 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-3.5 text-center w-12">No. Absen</th>
                        <th className="py-3 px-3.5">Nama Siswa</th>
                        <th className="py-3 px-3.5">NISN</th>
                        <th className="py-3 px-3.5 text-right">Total Setor</th>
                        <th className="py-3 px-3.5 text-right">Total Tarik</th>
                        <th className="py-3 px-3.5 text-right font-black">Saldo Akhir</th>
                        <th className="py-3 px-3.5 text-center">Transaksi Terakhir</th>
                        <th className="py-3 px-3.5 text-center">Frekuensi</th>
                        <th className="py-3 px-3.5 text-center no-print w-28">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentsSummaryList.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-slate-400">
                            <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                            <p className="font-bold text-slate-700">Tidak ada siswa ditemukan</p>
                          </td>
                        </tr>
                      ) : (
                        studentsSummaryList.map((std) => {
                          const hasSavings = std.saldoAkhir > 0;
                          return (
                            <tr key={std.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2.5 px-3.5 text-center font-bold text-slate-600">
                                {std.no}
                              </td>
                              <td className="py-2.5 px-3.5 font-bold text-slate-900 whitespace-nowrap">
                                <button
                                  onClick={() => handleOpenStudentPassbook(std.id)}
                                  className="hover:text-emerald-700 hover:underline cursor-pointer transition-colors"
                                  title="Lihat buku tabungan siswa ini"
                                >
                                  {std.nama}
                                </button>
                                {std.gender && (
                                  <span className="text-[10px] text-slate-400 ml-1.5 font-normal">
                                    ({std.gender})
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3.5 text-slate-500 font-mono whitespace-nowrap">
                                {std.nisn || '-'}
                              </td>
                              <td className="py-2.5 px-3.5 text-right font-medium text-emerald-700 whitespace-nowrap">
                                {formatRupiah(std.totalSetor)}
                              </td>
                              <td className="py-2.5 px-3.5 text-right font-medium text-rose-700 whitespace-nowrap">
                                {formatRupiah(std.totalTarik)}
                              </td>
                              <td className="py-2.5 px-3.5 text-right font-black whitespace-nowrap text-sm bg-slate-50/60">
                                <span className={hasSavings ? 'text-emerald-800' : 'text-slate-400'}>
                                  {formatRupiah(std.saldoAkhir)}
                                </span>
                              </td>
                              <td className="py-2.5 px-3.5 text-center text-slate-600 whitespace-nowrap">
                                {std.lastTxDate}
                              </td>
                              <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                                  {std.txCount}x
                                </span>
                              </td>
                              <td className="py-2.5 px-3.5 text-center no-print whitespace-nowrap">
                                <button
                                  onClick={() => handleOpenStudentPassbook(std.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1 mx-auto cursor-pointer shadow-xs"
                                  title="Buka buku rekening tabungan siswa ini"
                                >
                                  <Wallet className="w-3 h-3" />
                                  <span>Buka Buku</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    {studentsSummaryList.length > 0 && (
                      <tfoot className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                        <tr>
                          <td colSpan={3} className="py-3 px-3.5 text-right uppercase tracking-wider text-xs">
                            Total Akumulasi Seluruh Kelas:
                          </td>
                          <td className="py-3 px-3.5 text-right text-emerald-700 text-sm whitespace-nowrap">
                            {formatRupiah(classSavingsSummary.totalSetor)}
                          </td>
                          <td className="py-3 px-3.5 text-right text-rose-700 text-sm whitespace-nowrap">
                            {formatRupiah(classSavingsSummary.totalTarik)}
                          </td>
                          <td className="py-3 px-3.5 text-right text-emerald-800 text-base font-black whitespace-nowrap bg-emerald-50/80">
                            {formatRupiah(classSavingsSummary.saldoTotal)}
                          </td>
                          <td colSpan={3} className="py-3 px-3.5 text-center text-xs text-slate-500">
                            {classSavingsSummary.totalTransaksi} total transaksi mutasi
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}

            {/* Printable Signatures Footer for Class Recap (Hidden on screen, Shown on Print) */}
            <div className="hidden print:block mt-8 pt-6 border-t border-slate-300">
              <div className="flex justify-between items-start text-xs">
                <div className="text-center w-48">
                  <p>Mengetahui,</p>
                  <p className="font-bold">Kepala Sekolah / Komite,</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline">_________________________</p>
                </div>

                <div className="text-center w-64">
                  <p>Bawang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p>Wali Kelas / Guru Pengampu,</p>
                  <div className="h-16 flex items-center justify-center">
                    <span className="text-[10px] text-emerald-800 font-bold border border-emerald-500 px-2 py-1 rounded">
                      [TERVERIFIKASI RESMI]
                    </span>
                  </div>
                  <p className="font-bold underline">{data.waliKelas}</p>
                  {data.nip && <p className="text-[10px]">NIP. {data.nip}</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= VIEW 1: BUKU TABUNGAN ANAK ================= */}
        {parentTab === 'buku_tabungan' && (
          <div className="space-y-6">
            {/* Quick Back to Class Daily Data (No-Print) */}
            <div className="flex items-center justify-between no-print">
              <button
                onClick={() => setParentTab('semua_harian')}
                className="py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200 shadow-2xs"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-emerald-700" />
                <span>Kembali ke Semua Data Harian Kelas</span>
              </button>
            </div>

            {/* Student Search & Quick Select Bar (No-Print) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs no-print space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>Pilih Nama Siswa / Ananda:</span>
                </div>

                {/* Search Input */}
                <div className="relative w-full sm:w-80">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama atau NISN putra/putri..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Students Horizontal Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
                {filteredStudents.length === 0 ? (
                  <span className="text-xs text-slate-400 py-1 italic">
                    Tidak ditemukan siswa dengan kata kunci "{searchQuery}".
                  </span>
                ) : (
                  filteredStudents.map((std) => {
                    const isSelected = std.id === selectedStudentId;
                    return (
                      <button
                        key={std.id}
                        onClick={() => setSelectedStudentId(std.id)}
                        className={`shrink-0 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                          isSelected
                            ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-bold">
                          {std.no}
                        </span>
                        <span>{std.nama}</span>
                        {std.nisn && (
                          <span className={`text-[10px] font-mono ${isSelected ? 'text-emerald-200' : 'text-slate-400'}`}>
                            {std.nisn}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* If Student is Selected: Show Detailed Passbook */}
            {currentStudent ? (
              <div className="space-y-6">
                {/* Printable Digital Passbook Header (Hidden on screen, Shown on Print) */}
                <div className="hidden print:block text-center border-b-2 border-slate-900 pb-4 mb-4">
                  <h1 className="text-lg font-black uppercase tracking-wide">
                    {data.schoolName || 'SMK MUHAMMADIYAH BAWANG'}
                  </h1>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                    BUKU REKENING TABUNGAN SISWA DIGITAL
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Kelas: {data.className} • Tahun Ajaran: {data.academicYear} ({data.semester})
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-left text-xs mt-3 pt-3 border-t border-slate-300">
                    <div>
                      <span className="font-bold">Nama Siswa:</span> {currentStudent.nama}
                    </div>
                    <div>
                      <span className="font-bold">NISN / No. Absen:</span> {currentStudent.nisn || '-'} / No. {currentStudent.no}
                    </div>
                    <div>
                      <span className="font-bold">Wali Kelas:</span> {data.waliKelas}
                    </div>
                    <div>
                      <span className="font-bold">Status Rekening:</span> AKTIF & TERVERIFIKASI
                    </div>
                  </div>
                </div>

                {/* Identity & Financial Highlight Card */}
                <div className="bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden">
                  <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

                  <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                          Buku Tabungan Aktif
                        </span>
                        <span className="text-xs text-teal-200">
                          No. Absen {currentStudent.no} • {data.className}
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                        {currentStudent.nama}
                      </h2>
                      <div className="flex items-center gap-4 text-xs text-teal-100 font-mono">
                        <span>NISN: <strong>{currentStudent.nisn || '-'}</strong></span>
                        <span>•</span>
                        <span>Wali: <strong>{data.waliKelas}</strong></span>
                      </div>
                    </div>

                    {/* Sisa Saldo Aktif Callout */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 text-right w-full md:w-auto shrink-0 shadow-lg">
                      <span className="text-xs font-semibold text-emerald-200 block uppercase tracking-wider">
                        Sisa Saldo Aktif Tabungan
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-emerald-300 tracking-tight block mt-1">
                        {formatRupiah(currentBalance)}
                      </span>
                      <span className="text-[11px] text-teal-200 mt-1 block">
                        Terakhir update: {lastLiveSync || 'Hari ini'}
                      </span>
                    </div>
                  </div>

                  {/* 3 Metric Summary Boxes */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/15">
                    <div className="bg-black/20 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                        <ArrowDownRight className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-300 block">Total Disetor</span>
                        <strong className="text-sm font-bold text-white">
                          {formatRupiah(totalSetor)}
                        </strong>
                      </div>
                    </div>

                    <div className="bg-black/20 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center">
                        <ArrowUpRight className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-300 block">Total Ditarik</span>
                        <strong className="text-sm font-bold text-white">
                          {formatRupiah(totalTarik)}
                        </strong>
                      </div>
                    </div>

                    <div className="bg-black/20 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                        <History className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-300 block">Total Mutasi</span>
                        <strong className="text-sm font-bold text-white">
                          {studentTransactions.length} Transaksi
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons for Parents (No-Print) */}
                <div className="flex flex-wrap items-center justify-between gap-3 no-print">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">Filter Pos:</span>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    >
                      <option value="all">Semua Pos Tabungan</option>
                      <option value="harian">Tabungan Harian</option>
                      <option value="kas_kelas">Kas Kelas</option>
                      <option value="qurban">Tabungan Qurban</option>
                      <option value="rekreasi">Rekreasi / Wisata</option>
                      <option value="lks_buku">Buku / LKS</option>
                      <option value="lainnya">Lainnya</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleContactWaliWA}
                      className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Kirim pesan WhatsApp ke Wali Kelas"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Tanya Wali Kelas</span>
                    </button>

                    <button
                      onClick={handlePrintPassbook}
                      className="py-2 px-3.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Cetak atau simpan bukti mutasi buku rekening ke format PDF"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Cetak Rekening</span>
                    </button>
                  </div>
                </div>

                {/* Mutation History Table */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-emerald-700" />
                      <h3 className="text-sm font-bold text-slate-800">
                        Riwayat Transaksi Buku Tabungan
                      </h3>
                    </div>
                    <span className="text-xs text-slate-500">
                      {transactionsWithBalance.length} catatan mutasi
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200 uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-3.5 text-center w-10">No</th>
                          <th className="py-3 px-3.5">Tanggal</th>
                          <th className="py-3 px-3.5 text-center">Jenis</th>
                          <th className="py-3 px-3.5">Pos / Kategori</th>
                          <th className="py-3 px-3.5">Catatan Keperluan</th>
                          <th className="py-3 px-3.5 text-right">Nominal</th>
                          <th className="py-3 px-3.5 text-right font-black">Saldo</th>
                          <th className="py-3 px-3.5 text-center">Petugas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {transactionsWithBalance.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-10 text-center text-slate-400">
                              <Wallet className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                              <p className="font-semibold text-slate-600">Belum ada riwayat transaksi</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Setoran harian ananda akan otomatis tercatat dan muncul di tabel ini.
                              </p>
                            </td>
                          </tr>
                        ) : (
                          transactionsWithBalance.map((tx, idx) => {
                            const isSetor = tx.jenis === 'setor';
                            return (
                              <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-2.5 px-3.5 text-center text-slate-400 font-mono">
                                  {idx + 1}
                                </td>
                                <td className="py-2.5 px-3.5 font-medium text-slate-700 whitespace-nowrap">
                                  {tx.tanggal}
                                </td>
                                <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                                      isSetor
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    {isSetor ? (
                                      <>
                                        <ArrowDownRight className="w-3 h-3" />
                                        <span>Setor</span>
                                      </>
                                    ) : (
                                      <>
                                        <ArrowUpRight className="w-3 h-3" />
                                        <span>Tarik</span>
                                      </>
                                    )}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3.5 whitespace-nowrap">
                                  <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                    {getCategoryLabel(tx.kategori)}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3.5 text-slate-600 max-w-xs truncate">
                                  {tx.keterangan || '-'}
                                </td>
                                <td
                                  className={`py-2.5 px-3.5 text-right font-extrabold whitespace-nowrap ${
                                    isSetor ? 'text-emerald-700' : 'text-rose-700'
                                  }`}
                                >
                                  {isSetor ? '+' : '-'} {formatRupiah(tx.nominal)}
                                </td>
                                <td className="py-2.5 px-3.5 text-right font-black text-slate-900 whitespace-nowrap bg-slate-50/50">
                                  {formatRupiah(tx.runningBalance)}
                                </td>
                                <td className="py-2.5 px-3.5 text-center text-slate-500 whitespace-nowrap">
                                  {tx.petugas || 'Wali Kelas'}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Printable Signature & Validation Footer (Hidden on screen, Shown on Print) */}
                <div className="hidden print:block mt-8 pt-6 border-t border-slate-300">
                  <div className="flex justify-between items-start text-xs">
                    <div className="text-center w-48">
                      <p>Orang Tua / Wali Siswa,</p>
                      <div className="h-16"></div>
                      <p className="font-bold underline">_________________________</p>
                    </div>

                    <div className="text-center w-64">
                      <p>Bawang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      <p>Wali Kelas / Guru Pengampu,</p>
                      <div className="h-16 flex items-center justify-center">
                        <span className="text-[10px] text-emerald-800 font-bold border border-emerald-500 px-2 py-1 rounded">
                          [TERVERIFIKASI RESMI]
                        </span>
                      </div>
                      <p className="font-bold underline">{data.waliKelas}</p>
                      {data.nip && <p className="text-[10px]">NIP. {data.nip}</p>}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
                <User className="w-12 h-12 mx-auto text-slate-300" />
                <h3 className="text-base font-bold text-slate-700">Silakan Pilih Nama Siswa</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Pilih nama ananda dari daftar siswa di atas atau gunakan kolom pencarian untuk melihat buku tabungan dan riwayat setoran.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ================= VIEW 2: KAS & KEUANGAN KELAS ================= */}
        {parentTab === 'kas_kelas' && data.allowClassRecap && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-emerald-600" />
                    <span>Transparansi Kas Kelas {data.className}</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Laporan terbuka pemasukan dan pengeluaran kas paguyuban kelas
                  </p>
                </div>
              </div>

              {/* 3 Kas Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <span className="text-xs font-semibold text-emerald-800 block">Total Pemasukan Kas</span>
                  <strong className="text-xl font-black text-emerald-700 block mt-1">
                    {formatRupiah(classKasSummary.totalKasMasuk)}
                  </strong>
                </div>

                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                  <span className="text-xs font-semibold text-rose-800 block">Total Pengeluaran Kas</span>
                  <strong className="text-xl font-black text-rose-700 block mt-1">
                    {formatRupiah(classKasSummary.totalKasKeluar)}
                  </strong>
                </div>

                <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
                  <span className="text-xs font-semibold text-cyan-800 block">Sisa Saldo Kas Terkini</span>
                  <strong className="text-xl font-black text-cyan-800 block mt-1">
                    {formatRupiah(classKasSummary.saldoKas)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Kas Transaction List */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Riwayat Mutasi Kas Kelas
                </h3>
                <span className="text-xs text-slate-500">
                  {classKasSummary.kasTransactions.length} transaksi
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-3.5 text-center w-10">No</th>
                      <th className="py-3 px-3.5">Tanggal</th>
                      <th className="py-3 px-3.5 text-center">Jenis</th>
                      <th className="py-3 px-3.5">Atas Nama Siswa / Uraian</th>
                      <th className="py-3 px-3.5">Keterangan / Keperluan</th>
                      <th className="py-3 px-3.5 text-right font-black">Nominal</th>
                      <th className="py-3 px-3.5 text-center">Petugas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classKasSummary.kasTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Belum ada transaksi kas kelas yang dicatat.
                        </td>
                      </tr>
                    ) : (
                      classKasSummary.kasTransactions.map((tx, idx) => {
                        const isSetor = tx.jenis === 'setor';
                        return (
                          <tr key={tx.id} className="hover:bg-slate-50/80">
                            <td className="py-2.5 px-3.5 text-center text-slate-400 font-mono">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3.5 text-slate-700 whitespace-nowrap">
                              {tx.tanggal}
                            </td>
                            <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  isSetor ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {isSetor ? 'Masuk' : 'Keluar'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3.5 font-bold text-slate-800">
                              {tx.studentName || 'Kas Umum'}
                            </td>
                            <td className="py-2.5 px-3.5 text-slate-600">
                              {tx.keterangan || '-'}
                            </td>
                            <td
                              className={`py-2.5 px-3.5 text-right font-extrabold whitespace-nowrap ${
                                isSetor ? 'text-emerald-700' : 'text-rose-700'
                              }`}
                            >
                              {isSetor ? '+' : '-'} {formatRupiah(tx.nominal)}
                            </td>
                            <td className="py-2.5 px-3.5 text-center text-slate-500 whitespace-nowrap">
                              {tx.petugas || 'Wali Kelas'}
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
      </main>

      {/* Footer for Public View (No-Print) */}
      <footer className="mt-auto pt-8 border-t border-slate-200 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-700">
            {data.schoolName || 'SMK Muhammadiyah Bawang'} • Transparansi & Akuntabilitas Tabungan Siswa
          </p>
          <p className="text-[11px] text-slate-400">
            Data disinkronkan secara real-time via Cloud Firestore. Hak Cipta dilindungi.
          </p>
        </div>
      </footer>

      {/* Public Page QR Code Modal */}
      <QRCodeModal
        isOpen={showHeaderQr}
        onClose={() => setShowHeaderQr(false)}
        url={typeof window !== 'undefined' ? window.location.href : ''}
        title={`QR Tabungan & Kas - ${data.className}`}
        subtitle="Pindai kode QR ini menggunakan kamera ponsel untuk langsung membuka buku tabungan kelas di perangkat Anda."
        badgeText="Tabungan Siswa"
        badgeColor="emerald"
      />
    </div>
  );
};
