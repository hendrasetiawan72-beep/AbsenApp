import React, { useState, useMemo } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  FileSpreadsheet,
  Cloud,
  CheckCircle2,
  RefreshCw,
  Search,
  Plus,
  Minus,
  MessageCircle,
  BookOpen,
  Calendar,
  Filter,
  Trash2,
  Printer,
  X,
  Send,
  Sparkles,
  Users,
  Check,
  HelpCircle,
  Clock,
  ExternalLink,
  ChevronDown,
  Globe,
} from 'lucide-react';
import { SharePublicTabunganModal } from './SharePublicTabunganModal';
import {
  ClassRoom,
  Student,
  TeacherProfile,
  SavingTransaction,
  StudentSavingSummary,
  SavingTransactionType,
  SavingCategory,
} from '../types';
import {
  formatRupiah,
  calculateStudentSavingSummaries,
  buildParentSavingReportMessage,
  exportSavingsToSpreadsheet,
} from '../utils/savingsExport';

interface TabunganViewProps {
  currentClass: ClassRoom;
  allClasses: ClassRoom[];
  onSelectClass: (classId: string) => void;
  students: Student[];
  teacher: TeacherProfile;
  savings: SavingTransaction[];
  onAddTransaction: (tx: SavingTransaction) => void;
  onAddBatchTransactions: (txs: SavingTransaction[]) => void;
  onDeleteTransaction: (txId: string) => void;
  onSaveToCloud: () => Promise<void>;
  isSavingCloud: boolean;
  hasUnsavedCloudChanges: boolean;
  lastCloudSavedAt: string | null;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onOpenBackupModal?: () => void;
}

export const TabunganView: React.FC<TabunganViewProps> = ({
  currentClass,
  allClasses,
  onSelectClass,
  students,
  teacher,
  savings,
  onAddTransaction,
  onAddBatchTransactions,
  onDeleteTransaction,
  onSaveToCloud,
  isSavingCloud,
  hasUnsavedCloudChanges,
  lastCloudSavedAt,
  onShowToast,
  onOpenBackupModal,
}) => {
  const [subTab, setSubTab] = useState<'rekap' | 'batch_input' | 'riwayat'>('rekap');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [selectedStudentForTx, setSelectedStudentForTx] = useState<{
    student: Student;
    defaultType: SavingTransactionType;
  } | null>(null);
  const [txNominal, setTxNominal] = useState<number>(10000);
  const [txCategory, setTxCategory] = useState<SavingCategory>('harian');
  const [txKeterangan, setTxKeterangan] = useState('');
  const [txDate, setTxDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  // Passbook (Buku Tabungan) Modal
  const [passbookStudent, setPassbookStudent] = useState<Student | null>(null);

  // Parent WA Report Modal
  const [waReportStudent, setWaReportStudent] = useState<StudentSavingSummary | null>(null);

  // Public Parent Real-time Share Modal
  const [isSharePublicModalOpen, setIsSharePublicModalOpen] = useState(false);

  // Batch Morning Input State
  const [batchDate, setBatchDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [batchCategory, setBatchCategory] = useState<SavingCategory>('harian');
  const [batchPetugas, setBatchPetugas] = useState<string>(
    teacher.namaGuru ? `${teacher.namaGuru} (Wali Kelas)` : 'Wali Kelas'
  );
  const [batchAmounts, setBatchAmounts] = useState<Record<string, number>>({});
  const [batchNotes, setBatchNotes] = useState<Record<string, string>>({});

  // Filter current class transactions
  const classSavings = useMemo(() => {
    return savings.filter((tx) => tx.classId === currentClass.id);
  }, [savings, currentClass.id]);

  // Summaries per student
  const summaries = useMemo(() => {
    return calculateStudentSavingSummaries(students, classSavings);
  }, [students, classSavings]);

  // Overall class statistics
  const classTotals = useMemo(() => {
    let totalSetor = 0;
    let totalTarik = 0;
    let activeSavers = 0;

    summaries.forEach((s) => {
      totalSetor += s.totalSetor;
      totalTarik += s.totalTarik;
      if (s.saldoAkhir > 0) activeSavers++;
    });

    return {
      totalSetor,
      totalTarik,
      totalSaldo: totalSetor - totalTarik,
      activeSavers,
      totalStudents: students.length,
    };
  }, [summaries, students.length]);

  // Filtered summaries for search
  const filteredSummaries = useMemo(() => {
    if (!searchTerm.trim()) return summaries;
    const q = searchTerm.toLowerCase();
    return summaries.filter(
      (s) =>
        s.student.nama.toLowerCase().includes(q) ||
        (s.student.nisn && s.student.nisn.includes(q))
    );
  }, [summaries, searchTerm]);

  // Single Transaction submit
  const handleSingleTransactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForTx) return;

    if (txNominal <= 0) {
      onShowToast('Nominal transaksi harus lebih dari Rp 0', 'error');
      return;
    }

    // Check withdrawal balance
    if (selectedStudentForTx.defaultType === 'tarik') {
      const summary = summaries.find(
        (s) => s.student.id === selectedStudentForTx.student.id
      );
      const currentSaldo = summary ? summary.saldoAkhir : 0;
      if (txNominal > currentSaldo) {
        onShowToast(
          `Saldo tidak mencukupi! Saldo saat ini hanya ${formatRupiah(currentSaldo)}`,
          'error'
        );
        return;
      }
    }

    const newTx: SavingTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      classId: currentClass.id,
      studentId: selectedStudentForTx.student.id,
      studentName: selectedStudentForTx.student.nama,
      nisn: selectedStudentForTx.student.nisn || '',
      tanggal: txDate,
      jenis: selectedStudentForTx.defaultType,
      nominal: Number(txNominal),
      kategori: txCategory,
      keterangan:
        txKeterangan.trim() ||
        (selectedStudentForTx.defaultType === 'setor'
          ? 'Setoran tabungan harian'
          : 'Penarikan tabungan'),
      petugas: teacher.namaGuru || 'Wali Kelas',
      createdAt: new Date().toISOString(),
    };

    onAddTransaction(newTx);
    onShowToast(
      `${selectedStudentForTx.defaultType === 'setor' ? 'Setoran' : 'Penarikan'} ${formatRupiah(
        txNominal
      )} untuk ${selectedStudentForTx.student.nama} berhasil dicatat!`,
      'success'
    );
    setSelectedStudentForTx(null);
    setTxNominal(10000);
    setTxKeterangan('');
  };

  // Batch input submit
  const handleBatchSubmit = () => {
    const txsToCreate: SavingTransaction[] = [];

    Object.entries(batchAmounts).forEach(([studentId, rawAmount]) => {
      const amount = Number(rawAmount) || 0;
      if (amount > 0) {
        const student = students.find((s) => s.id === studentId);
        if (student) {
          txsToCreate.push({
            id: `tx-${Date.now()}-${studentId.slice(0, 5)}-${Math.random().toString(36).substring(2, 6)}`,
            classId: currentClass.id,
            studentId: student.id,
            studentName: student.nama,
            nisn: student.nisn || '',
            tanggal: batchDate,
            jenis: 'setor',
            nominal: amount,
            kategori: batchCategory,
            keterangan: batchNotes[studentId] || 'Setoran tabungan harian',
            petugas: batchPetugas || teacher.namaGuru || 'Wali Kelas',
            createdAt: new Date().toISOString(),
          });
        }
      }
    });

    if (txsToCreate.length === 0) {
      onShowToast('Belum ada nominal setoran siswa yang diisi.', 'error');
      return;
    }

    onAddBatchTransactions(txsToCreate);
    onShowToast(
      `Berhasil mencatat ${txsToCreate.length} setoran siswa dengan total ${formatRupiah(
        txsToCreate.reduce((sum, t) => sum + t.nominal, 0)
      )}!`,
      'success'
    );

    // Reset batch state
    setBatchAmounts({});
    setBatchNotes({});
    setSubTab('rekap');
  };

  // Quick preset amount helper for batch row
  const setQuickBatchAmount = (studentId: string, amt: number) => {
    setBatchAmounts((prev) => ({
      ...prev,
      [studentId]: amt,
    }));
  };

  // Export to spreadsheet
  const handleExportSpreadsheet = () => {
    try {
      exportSavingsToSpreadsheet(summaries, classSavings, currentClass, teacher);
      onShowToast(
        `Laporan tabungan kelas ${currentClass.namaKelas} berhasil diekspor ke Excel (.xlsx)!`,
        'success'
      );
    } catch (e: any) {
      console.error(e);
      onShowToast('Gagal mengekspor spreadsheet: ' + e.message, 'error');
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner / Hero Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-2xl shadow-md shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Tabungan Harian Siswa
                </h1>
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300/80">
                  {currentClass.namaKelas}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  {students.length} Siswa Terdaftar
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Pengelolaan saldo saku, study tour, dan infaq siswa SMK Muhammadiyah Bawang dengan laporan spreadsheet & WhatsApp orang tua
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Class Selector Dropdown */}
            <div className="relative inline-block">
              <select
                id="select-tabungan-class"
                value={currentClass.id}
                onChange={(e) => onSelectClass(e.target.value)}
                className="appearance-none bg-slate-100 hover:bg-slate-200/80 border border-slate-300 text-slate-800 text-xs sm:text-sm font-bold rounded-xl py-2.5 pl-3 pr-8 focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-colors"
              >
                {allClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    Kelas {c.namaKelas} ({c.tingkat})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Status Penyimpanan Otomatis di Browser */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-semibold"
              title="Tabungan tersimpan otomatis di browser. Sinkronkan ke cloud lewat tombol di bilah atas saat selesai."
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Tersimpan di Browser</span>
            </div>

            {/* Cloud Real-Time Status Badge */}
            {lastCloudSavedAt && !hasUnsavedCloudChanges && (
              <div
                id="badge-cloud-sync-status"
                className="hidden md:flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1.5 rounded-xl font-semibold"
                title={`Data transaksi tersinkronisasi di Cloud Firestore pada pukul ${lastCloudSavedAt}`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Cloud Aktif • {lastCloudSavedAt}</span>
              </div>
            )}

            {/* Export Spreadsheet Button */}
            <button
              id="btn-export-savings-spreadsheet"
              onClick={handleExportSpreadsheet}
              className="py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              title="Unduh format spreadsheet Excel (.xlsx) 3-sheet untuk arsip & laporan wali murid"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Lapor Spreadsheet</span>
            </button>

            {/* Link Publik Orang Tua Button */}
            <button
              id="btn-share-public-tabungan"
              onClick={() => setIsSharePublicModalOpen(true)}
              className="py-2.5 px-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 active:scale-95 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              title="Buat dan bagikan link preview publik data tabungan yang dapat dilihat orang tua secara real-time"
            >
              <Globe className="w-4 h-4" />
              <span>Link Publik Orang Tua</span>
            </button>
          </div>
        </div>

        {/* Sync Status Badge Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2 flex-wrap">
            {hasUnsavedCloudChanges ? (
              <span className="flex items-center gap-1.5 text-amber-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                Ada data baru yang belum disimpan ke Cloud
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Data tabungan tersinkronisasi di Cloud
              </span>
            )}
            {lastCloudSavedAt && (
              <span className="text-slate-400">· Tersimpan {lastCloudSavedAt}</span>
            )}

            <button
              onClick={() => setIsSharePublicModalOpen(true)}
              className="inline-flex items-center gap-1 text-[11px] text-teal-700 hover:text-teal-900 font-bold bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
            >
              <Globe className="w-3 h-3 text-teal-600" />
              <span>Link Real-Time Orang Tua</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500">
              Wali Kelas: <strong className="text-slate-700">{teacher.namaGuru || 'Guru SMK'}</strong>
            </span>
            {onOpenBackupModal && (
              <button
                onClick={onOpenBackupModal}
                className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
              >
                Cadangkan Seluruh Database JSON
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Saldo */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-emerald-100 text-xs font-semibold uppercase tracking-wider">
            <span>Saldo Kas Kelas</span>
            <Wallet className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black mt-2">
            {formatRupiah(classTotals.totalSaldo)}
          </div>
          <p className="text-emerald-100 text-xs mt-1">
            Total saldo dari {classTotals.activeSavers} siswa aktif menabung
          </p>
        </div>

        {/* Total Setoran */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Setoran Masuk</span>
            <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
              <ArrowDownLeft className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatRupiah(classTotals.totalSetor)}
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Akumulasi seluruh setoran tercatat
          </p>
        </div>

        {/* Total Penarikan */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Penarikan</span>
            <span className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatRupiah(classTotals.totalTarik)}
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Buku, kegiatan kejuruan & penarikan saku
          </p>
        </div>

        {/* Partisipasi Siswa */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Partisipasi Siswa</span>
            <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {classTotals.activeSavers}{' '}
            <span className="text-sm font-bold text-slate-400">
              / {classTotals.totalStudents} Siswa
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{
                width: `${
                  classTotals.totalStudents > 0
                    ? Math.round((classTotals.activeSavers / classTotals.totalStudents) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Sub Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl shadow-2xs p-1 gap-1">
        <button
          onClick={() => setSubTab('rekap')}
          className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            subTab === 'rekap'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Daftar Saldo Siswa ({students.length})</span>
        </button>

        <button
          onClick={() => setSubTab('batch_input')}
          className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            subTab === 'batch_input'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Input Setoran Harian Massal (Cepat)</span>
        </button>

        <button
          onClick={() => setSubTab('riwayat')}
          className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            subTab === 'riwayat'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Riwayat Transaksi ({classSavings.length})</span>
        </button>
      </div>

      {/* TAB 1: REKAP SALDO SISWA */}
      {subTab === 'rekap' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-4 sm:p-5">
          {/* Filter / Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama siswa atau NISN..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Menampilkan <strong>{filteredSummaries.length}</strong> dari{' '}
              <strong>{students.length}</strong> siswa
            </div>
          </div>

          {/* Student Ledger Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 text-xs font-extrabold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-3 text-center w-12">No</th>
                  <th className="py-3 px-3">NISN</th>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-3 text-right">Total Setor</th>
                  <th className="py-3 px-3 text-right">Total Tarik</th>
                  <th className="py-3 px-4 text-right">Saldo Akhir</th>
                  <th className="py-3 px-3 text-center">Tgl Terakhir</th>
                  <th className="py-3 px-3 text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-800">
                {filteredSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400">
                      Tidak ada data siswa yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredSummaries.map((summary, idx) => (
                    <tr
                      key={summary.student.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3 px-3 text-center text-slate-400 font-bold">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-slate-500">
                        {summary.student.nisn || '-'}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{summary.student.nama}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                              summary.student.gender === 'L'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-pink-100 text-pink-700'
                            }`}
                          >
                            {summary.student.gender}
                          </span>
                        </div>
                        {summary.student.noHpOrangTua && (
                          <div className="text-[11px] text-slate-400 font-normal">
                            WA: {summary.student.noHpOrangTua}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-700 font-medium">
                        {formatRupiah(summary.totalSetor)}
                      </td>
                      <td className="py-3 px-3 text-right text-rose-600 font-medium">
                        {formatRupiah(summary.totalTarik)}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-700 bg-emerald-50/30">
                        {formatRupiah(summary.saldoAkhir)}
                      </td>
                      <td className="py-3 px-3 text-center text-xs text-slate-500">
                        {summary.transaksiTerakhir}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Quick Setor Button */}
                          <button
                            onClick={() =>
                              setSelectedStudentForTx({
                                student: summary.student,
                                defaultType: 'setor',
                              })
                            }
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 transition-colors cursor-pointer"
                            title="Setor Tabungan (+)"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Tarik Button */}
                          <button
                            onClick={() =>
                              setSelectedStudentForTx({
                                student: summary.student,
                                defaultType: 'tarik',
                              })
                            }
                            disabled={summary.saldoAkhir <= 0}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 disabled:opacity-30 text-rose-700 font-bold border border-rose-200 transition-colors cursor-pointer"
                            title="Tarik Tabungan (-)"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          {/* Passbook Statement Modal Button */}
                          <button
                            onClick={() => setPassbookStudent(summary.student)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 transition-colors cursor-pointer"
                            title="Lihat Buku Tabungan Digital & Cetak"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                          </button>

                          {/* WhatsApp Parent Report Button */}
                          <button
                            onClick={() => setWaReportStudent(summary)}
                            className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold border border-teal-200 transition-colors cursor-pointer"
                            title="Kirim Laporan ke Orang Tua via WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: INPUT SETORAN HARIAN MASSAL */}
      {subTab === 'batch_input' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-6 space-y-4">
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-emerald-950 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Input Cepat Tabungan Pagi (Per Kelas)
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Isi nominal setoran siswa hari ini secara serentak. Siswa yang tidak menabung cukup biarkan kosong (Rp 0).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block">Tanggal Setoran</label>
                <input
                  type="date"
                  value={batchDate}
                  onChange={(e) => setBatchDate(e.target.value)}
                  className="bg-white border border-slate-300 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block">Kategori</label>
                <select
                  value={batchCategory}
                  onChange={(e) => setBatchCategory(e.target.value as SavingCategory)}
                  className="bg-white border border-slate-300 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="harian">Tabungan Harian</option>
                  <option value="study_tour">Study Tour</option>
                  <option value="qurban">Tabungan Qurban</option>
                  <option value="wisuda">Wisuda / Akhir Tahun</option>
                  <option value="lks_buku">LKS & Modul Kejuruan</option>
                  <option value="infaq">Infaq Jum'at / Sosial</option>
                </select>
              </div>
            </div>
          </div>

          {/* Student Batch Rows Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-[500px]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-100 z-10">
                <tr className="text-slate-700 text-xs font-extrabold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3 text-center w-12">No</th>
                  <th className="py-2.5 px-4">Nama Siswa</th>
                  <th className="py-2.5 px-3 text-center">Preset Cepat</th>
                  <th className="py-2.5 px-4 w-44">Nominal Setoran (Rp)</th>
                  <th className="py-2.5 px-4">Keterangan Khusus (Opsional)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {students.map((student, idx) => {
                  const currentAmt = batchAmounts[student.id] || 0;
                  return (
                    <tr
                      key={student.id}
                      className={currentAmt > 0 ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}
                    >
                      <td className="py-2 px-3 text-center text-slate-400 font-bold">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-4 font-bold text-slate-900">
                        {student.nama}
                        <span className="text-[11px] text-slate-400 font-normal ml-2">
                          ({student.gender})
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {[2000, 5000, 10000, 20000, 50000].map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setQuickBatchAmount(student.id, amt)}
                              className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                                currentAmt === amt
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              +{amt / 1000}k
                            </button>
                          ))}
                          {currentAmt > 0 && (
                            <button
                              type="button"
                              onClick={() => setQuickBatchAmount(student.id, 0)}
                              className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-100 hover:bg-rose-200 text-rose-700 cursor-pointer"
                              title="Reset jadi 0"
                            >
                              0
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="number"
                          step={1000}
                          min={0}
                          value={batchAmounts[student.id] || ''}
                          onChange={(e) =>
                            setBatchAmounts((prev) => ({
                              ...prev,
                              [student.id]: Number(e.target.value) || 0,
                            }))
                          }
                          placeholder="Rp 0"
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="text"
                          value={batchNotes[student.id] || ''}
                          onChange={(e) =>
                            setBatchNotes((prev) => ({
                              ...prev,
                              [student.id]: e.target.value,
                            }))
                          }
                          placeholder="Contoh: Titipan orang tua / Uang saku"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Batch Submit Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <div className="text-xs text-slate-600">
              Total yang akan dicatat:{' '}
              <strong className="text-emerald-700 text-sm">
                {formatRupiah(
                  (Object.values(batchAmounts) as unknown[]).reduce<number>((sum: number, a: unknown) => sum + (Number(a) || 0), 0)
                )}
              </strong>{' '}
              dari{' '}
              <strong>
                {(Object.values(batchAmounts) as unknown[]).filter((a: unknown) => Number(a) > 0).length} siswa
              </strong>
            </div>

            <button
              id="btn-submit-batch-savings"
              onClick={handleBatchSubmit}
              className="w-full sm:w-auto py-3 px-6 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>SIMPAN SEMUA SETORAN HARI INI</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: RIWAYAT TRANSAKSI HARIAN */}
      {subTab === 'riwayat' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              Riwayat Mutasi Tabungan Kelas {currentClass.namaKelas}
            </h2>
            <span className="text-xs text-slate-500">
              Total <strong>{classSavings.length}</strong> transaksi
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 text-xs font-extrabold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-4">Nama Siswa</th>
                  <th className="py-2.5 px-3">Jenis</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3 text-right">Nominal</th>
                  <th className="py-2.5 px-4">Keterangan</th>
                  <th className="py-2.5 px-3 text-center">Petugas</th>
                  <th className="py-2.5 px-2 text-center w-10">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {classSavings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400">
                      Belum ada transaksi tabungan yang dicatat untuk kelas ini.
                    </td>
                  </tr>
                ) : (
                  classSavings
                    .slice()
                    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
                    .map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 text-xs font-mono text-slate-600">
                          {tx.tanggal}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          {tx.studentName}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                              tx.jenis === 'setor'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {tx.jenis === 'setor' ? (
                              <>
                                <ArrowDownLeft className="w-3 h-3" /> Setor
                              </>
                            ) : (
                              <>
                                <ArrowUpRight className="w-3 h-3" /> Tarik
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-slate-600 uppercase font-semibold">
                          {tx.kategori.replace('_', ' ')}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-black ${
                            tx.jenis === 'setor' ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {tx.jenis === 'setor' ? '+' : '-'} {formatRupiah(tx.nominal)}
                        </td>
                        <td className="py-2.5 px-4 text-xs text-slate-600">
                          {tx.keterangan || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center text-xs text-slate-500">
                          {tx.petugas}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Hapus transaksi ${tx.jenis} sebesar ${formatRupiah(
                                    tx.nominal
                                  )} untuk ${tx.studentName}?`
                                )
                              ) {
                                onDeleteTransaction(tx.id);
                                onShowToast('Transaksi berhasil dihapus', 'info');
                              }
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: SINGLE SETOR / TARIK FORM */}
      {selectedStudentForTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 to-emerald-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm sm:text-base">
                  {selectedStudentForTx.defaultType === 'setor'
                    ? 'Catat Setoran Siswa'
                    : 'Catat Penarikan Siswa'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedStudentForTx(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSingleTransactionSubmit} className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-500">Nama Siswa:</div>
                <div className="text-base font-bold text-slate-900">
                  {selectedStudentForTx.student.nama}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Kelas: {currentClass.namaKelas} | NISN: {selectedStudentForTx.student.nisn || '-'}
                </div>
              </div>

              {/* Toggle Setor vs Tarik */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Jenis Transaksi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedStudentForTx((prev) =>
                        prev ? { ...prev, defaultType: 'setor' } : null
                      )
                    }
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      selectedStudentForTx.defaultType === 'setor'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4" /> Setoran (+)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedStudentForTx((prev) =>
                        prev ? { ...prev, defaultType: 'tarik' } : null
                      )
                    }
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      selectedStudentForTx.defaultType === 'tarik'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" /> Penarikan (-)
                  </button>
                </div>
              </div>

              {/* Nominal Input & Quick Chips */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nominal (Rp)
                </label>
                <input
                  type="number"
                  step={1000}
                  min={1000}
                  required
                  value={txNominal}
                  onChange={(e) => setTxNominal(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-base font-black text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[2000, 5000, 10000, 20000, 50000, 100000].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setTxNominal(chip)}
                      className="px-2 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                    >
                      {formatRupiah(chip)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Kategori</label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value as SavingCategory)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="harian">Harian</option>
                    <option value="study_tour">Study Tour</option>
                    <option value="qurban">Qurban</option>
                    <option value="wisuda">Wisuda</option>
                    <option value="lks_buku">Buku / LKS</option>
                    <option value="infaq">Infaq</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  value={txKeterangan}
                  onChange={(e) => setTxKeterangan(e.target.value)}
                  placeholder="Contoh: Setoran uang saku / Pembelian modul"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForTx(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BUKU TABUNGAN DIGITAL SISWA (PASSBOOK STATEMENT) */}
      {passbookStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-base">Buku Tabungan Digital Siswa</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Cetak
                </button>
                <button
                  onClick={() => setPassbookStudent(null)}
                  className="text-slate-300 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {/* Official Header */}
              <div className="text-center border-b pb-3 border-slate-200">
                <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  SMK MUHAMMADIYAH BAWANG
                </div>
                <div className="text-base font-black text-slate-900">
                  REKENING TABUNGAN SISWA
                </div>
                <div className="text-xs text-slate-500">
                  Tahun Ajaran {teacher.tahunAjaran || '2025/2026'} · Semester {teacher.semester || 'Ganjil'}
                </div>
              </div>

              {/* Student Identity Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500">Nama Siswa:</span>{' '}
                  <strong className="text-slate-900">{passbookStudent.nama}</strong>
                </div>
                <div>
                  <span className="text-slate-500">NISN:</span>{' '}
                  <strong className="text-slate-900">{passbookStudent.nisn || '-'}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Kelas:</span>{' '}
                  <strong className="text-slate-900">{currentClass.namaKelas}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Wali Kelas:</span>{' '}
                  <strong className="text-slate-900">{teacher.namaGuru || 'Wali Kelas'}</strong>
                </div>
              </div>

              {/* Statement Mutasi Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-2.5">Tanggal</th>
                      <th className="p-2.5">Uraian / Keterangan</th>
                      <th className="p-2.5 text-right text-emerald-700">Setoran (+)</th>
                      <th className="p-2.5 text-right text-rose-600">Penarikan (-)</th>
                      <th className="p-2.5 text-right">Saldo</th>
                      <th className="p-2.5 text-center">Paraf</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const studentTxs = classSavings
                        .filter((t) => t.studentId === passbookStudent.id)
                        .slice()
                        .sort(
                          (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
                        );

                      let runningBalance = 0;
                      if (studentTxs.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} className="text-center py-6 text-slate-400">
                              Belum ada mutasi tabungan tercatat untuk siswa ini.
                            </td>
                          </tr>
                        );
                      }

                      return studentTxs.map((tx) => {
                        if (tx.jenis === 'setor') runningBalance += tx.nominal;
                        else runningBalance -= tx.nominal;

                        return (
                          <tr key={tx.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-mono text-slate-600">{tx.tanggal}</td>
                            <td className="p-2.5">{tx.keterangan || tx.kategori}</td>
                            <td className="p-2.5 text-right text-emerald-700 font-semibold">
                              {tx.jenis === 'setor' ? formatRupiah(tx.nominal) : '-'}
                            </td>
                            <td className="p-2.5 text-right text-rose-600 font-semibold">
                              {tx.jenis === 'tarik' ? formatRupiah(tx.nominal) : '-'}
                            </td>
                            <td className="p-2.5 text-right font-black text-slate-900">
                              {formatRupiah(runningBalance)}
                            </td>
                            <td className="p-2.5 text-center text-[10px] text-slate-400">✓</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setPassbookStudent(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: LAPOR ORANG TUA VIA WHATSAPP */}
      {waReportStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="bg-emerald-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-200" />
                <h3 className="font-bold text-sm sm:text-base">
                  Lapor Tabungan ke Orang Tua
                </h3>
              </div>
              <button
                onClick={() => setWaReportStudent(null)}
                className="text-emerald-200 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs">
                <div className="font-bold text-emerald-950">
                  {waReportStudent.student.nama} ({currentClass.namaKelas})
                </div>
                <div className="text-slate-600 mt-0.5">
                  Saldo Saat Ini:{' '}
                  <strong className="text-emerald-700 font-bold">
                    {formatRupiah(waReportStudent.saldoAkhir)}
                  </strong>
                </div>
                <div className="text-slate-500 mt-0.5">
                  No. HP Wali Murid:{' '}
                  <strong>{waReportStudent.student.noHpOrangTua || 'Belum diisi di data siswa'}</strong>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Isi Pesan WhatsApp yang Akan Dikirim:
                </label>
                <textarea
                  readOnly
                  rows={9}
                  value={buildParentSavingReportMessage(waReportStudent, currentClass, teacher)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                {/* Direct WhatsApp Open Button */}
                <button
                  onClick={() => {
                    const phone = (waReportStudent.student.noHpOrangTua || '').replace(/[^0-9]/g, '');
                    let targetPhone = phone;
                    if (targetPhone.startsWith('0')) {
                      targetPhone = '62' + targetPhone.substring(1);
                    }
                    const msg = encodeURIComponent(
                      buildParentSavingReportMessage(waReportStudent, currentClass, teacher)
                    );
                    const waUrl = targetPhone
                      ? `https://wa.me/${targetPhone}?text=${msg}`
                      : `https://wa.me/?text=${msg}`;
                    window.open(waUrl, '_blank');
                  }}
                  className="w-full sm:flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim via WhatsApp Sekarang</span>
                </button>

                {/* Copy Text Button */}
                <button
                  onClick={() => {
                    const msg = buildParentSavingReportMessage(
                      waReportStudent,
                      currentClass,
                      teacher
                    );
                    navigator.clipboard.writeText(msg);
                    onShowToast('Teks laporan berhasil disalin ke clipboard!', 'success');
                  }}
                  className="w-full sm:w-auto py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Salin Teks
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Public Real-Time Modal for Parents */}
      <SharePublicTabunganModal
        isOpen={isSharePublicModalOpen}
        onClose={() => setIsSharePublicModalOpen(false)}
        currentClass={currentClass}
        teacher={teacher}
        students={students}
        savings={savings}
        onShowToast={onShowToast}
      />
    </div>
  );
};
