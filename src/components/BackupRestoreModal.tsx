import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  X,
  RefreshCw,
  Layers,
  Users,
  CalendarCheck2,
  GraduationCap,
  BookOpen,
  Wallet,
  ShieldCheck,
  HardDrive,
  Cloud,
} from 'lucide-react';
import {
  TeacherProfile,
  ClassRoom,
  Student,
  AttendanceSession,
  StudentGrade,
  TeachingAgenda,
  SavingTransaction,
  FullDatabaseBackup,
} from '../types';
import {
  buildDatabaseBackup,
  downloadBackupJson,
  validateBackupJson,
  processRestoredData,
  BackupValidationResult,
} from '../utils/backupRestore';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: TeacherProfile;
  classes: ClassRoom[];
  activeClassId: string;
  allStudents: Student[];
  allSessions: AttendanceSession[];
  allGrades: StudentGrade[];
  allAgendas: TeachingAgenda[];
  allSavings: SavingTransaction[];
  onApplyRestoredData: (restored: {
    teacher: TeacherProfile;
    classes: ClassRoom[];
    activeClassId: string;
    students: Student[];
    sessions: AttendanceSession[];
    grades: StudentGrade[];
    agendas: TeachingAgenda[];
    savings: SavingTransaction[];
  }) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  isCloudConnected?: boolean;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  teacher,
  classes,
  activeClassId,
  allStudents,
  allSessions,
  allGrades,
  allAgendas,
  allSavings,
  onApplyRestoredData,
  onShowToast,
  isCloudConnected = false,
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'restore'>('backup');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<BackupValidationResult | null>(null);
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle Backup Download
  const handleDownloadBackup = () => {
    try {
      const backup = buildDatabaseBackup(
        teacher,
        classes,
        activeClassId,
        allStudents,
        allSessions,
        allGrades,
        allAgendas,
        allSavings
      );
      downloadBackupJson(backup);
      onShowToast(
        `File cadangan database (${classes.length} kelas, ${allStudents.length} siswa, ${allSavings.length} transaksi tabungan) berhasil diunduh!`,
        'success'
      );
    } catch (e: any) {
      console.error(e);
      onShowToast('Gagal membuat backup database: ' + e.message, 'error');
    }
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      onShowToast('Mohon pilih file dengan format JSON (.json)', 'error');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = validateBackupJson(content);
      setValidationResult(result);

      if (!result.isValid) {
        onShowToast(result.error || 'File JSON tidak valid', 'error');
      } else {
        onShowToast('File cadangan valid dan siap dipulihkan!', 'success');
      }
    };
    reader.onerror = () => {
      onShowToast('Gagal membaca file lokal', 'error');
    };
    reader.readAsText(file);
  };

  // Handle Restore Execution
  const handleExecuteRestore = async () => {
    if (!validationResult || !validationResult.isValid || !validationResult.backup) {
      onShowToast('Silakan pilih file cadangan yang valid terlebih dahulu.', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const current = {
        teacher,
        classes,
        students: allStudents,
        sessions: allSessions,
        grades: allGrades,
        agendas: allAgendas,
        savings: allSavings,
      };

      const restored = processRestoredData(current, validationResult.backup, restoreMode);
      onApplyRestoredData(restored);

      onShowToast(
        `Pemulihan data berhasil! ${restored.classes.length} kelas, ${restored.students.length} siswa, dan ${restored.savings.length} transaksi tabungan siap digunakan.`,
        'success'
      );
      onClose();
    } catch (err: any) {
      console.error('Error executing restore:', err);
      onShowToast('Gagal memulihkan database: ' + (err.message || 'Kesalahan sistem'), 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/30 rounded-xl border border-indigo-400/30">
              <Database className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                Cadangan & Pemulihan Database
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                  JSON Lokal
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Kendali penuh atas data sekolah, presensi, nilai, agenda, dan tabungan siswa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border-b-2 ${
              activeTab === 'backup'
                ? 'border-indigo-600 text-indigo-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>1. Cadangkan ke File JSON (Backup)</span>
          </button>

          <button
            onClick={() => setActiveTab('restore')}
            className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border-b-2 ${
              activeTab === 'restore'
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>2. Pulihkan dari File JSON (Restore)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {activeTab === 'backup' ? (
            <div className="space-y-4">
              {/* Info Box */}
              <div className="p-3.5 bg-indigo-50/80 rounded-xl border border-indigo-200/80 text-xs text-indigo-950 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Keamanan & Otonomi Data Guru</p>
                  <p className="text-slate-600 mt-0.5">
                    File JSON berisi seluruh snapshot database aplikasi saat ini. Anda dapat menyimpannya
                    di flashdisk, laptop, atau Google Drive pribadi. Data sepenuhnya milik Anda dan dapat
                    dipulihkan kembali sewaktu-waktu.
                  </p>
                </div>
              </div>

              {/* Data Summary Grid */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Rincian Data yang Akan Dicadangkan
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-100 text-indigo-700 rounded-md">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-lg font-black text-slate-900">{classes.length}</div>
                      <div className="text-[11px] text-slate-500 font-medium">Ruang Kelas</div>
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 flex items-center gap-2.5">
                    <div className="p-2 bg-blue-100 text-blue-700 rounded-md">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-lg font-black text-slate-900">{allStudents.length}</div>
                      <div className="text-[11px] text-slate-500 font-medium">Data Siswa</div>
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-100 text-emerald-700 rounded-md">
                      <CalendarCheck2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-lg font-black text-slate-900">{allSessions.length}</div>
                      <div className="text-[11px] text-slate-500 font-medium">Sesi Presensi</div>
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 flex items-center gap-2.5">
                    <div className="p-2 bg-purple-100 text-purple-700 rounded-md">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-lg font-black text-slate-900">{allGrades.length}</div>
                      <div className="text-[11px] text-slate-500 font-medium">Rekap Nilai</div>
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 flex items-center gap-2.5">
                    <div className="p-2 bg-amber-100 text-amber-700 rounded-md">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-lg font-black text-slate-900">{allAgendas.length}</div>
                      <div className="text-[11px] text-slate-500 font-medium">Agenda Mengajar</div>
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 flex items-center gap-2.5">
                    <div className="p-2 bg-teal-100 text-teal-700 rounded-md">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-lg font-black text-slate-900">{allSavings.length}</div>
                      <div className="text-[11px] text-slate-500 font-medium">Tabungan Siswa</div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                  <span>Guru: <strong className="text-slate-800">{teacher.namaGuru || 'Guru SMK'}</strong></span>
                  <span>Sekolah: <strong className="text-slate-800">{teacher.namaSekolah || 'SMK Muhammadiyah Bawang'}</strong></span>
                </div>
              </div>

              {/* Action Button */}
              <button
                id="btn-execute-backup-download"
                onClick={handleDownloadBackup}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Download className="w-5 h-5 animate-bounce" />
                <span>UNDUH FILE BACKUP DATABASE (.JSON)</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Selector Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/40 rounded-2xl p-6 text-center transition-all cursor-pointer group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 group-hover:scale-110 flex items-center justify-center mx-auto transition-transform mb-2.5">
                  <FileJson className="w-6 h-6" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800">
                  {selectedFile ? selectedFile.name : 'Klik atau Tarik File Cadangan (.JSON) ke Sini'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Pilih file JSON hasil backup database sebelumnya
                </p>
              </div>

              {/* Validation Result Box */}
              {validationResult && (
                <div
                  className={`p-4 rounded-xl border text-xs ${
                    validationResult.isValid
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50/80 border-rose-200 text-rose-950'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold mb-2">
                    {validationResult.isValid ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>File Cadangan Valid & Terverifikasi</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>File Cadangan Tidak Valid</span>
                      </>
                    )}
                  </div>

                  {validationResult.isValid && validationResult.summary && (
                    <div className="space-y-2 mt-2">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] bg-white p-2.5 rounded-lg border border-emerald-200/80">
                        <div>
                          <span className="text-slate-500">Kelas:</span>{' '}
                          <strong>{validationResult.summary.classesCount}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Siswa:</span>{' '}
                          <strong>{validationResult.summary.studentsCount}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Presensi:</span>{' '}
                          <strong>{validationResult.summary.sessionsCount}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Nilai:</span>{' '}
                          <strong>{validationResult.summary.gradesCount}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Agenda:</span>{' '}
                          <strong>{validationResult.summary.agendasCount}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Tabungan:</span>{' '}
                          <strong>{validationResult.summary.savingsCount}</strong>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-600 flex flex-wrap justify-between gap-1 pt-1">
                        <span>Waktu Backup: <strong>{validationResult.summary.exportedAt}</strong></span>
                        <span>Pemilik: <strong>{validationResult.summary.teacherName}</strong> ({validationResult.summary.schoolName})</span>
                      </div>
                    </div>
                  )}

                  {!validationResult.isValid && (
                    <p className="text-rose-700">{validationResult.error}</p>
                  )}
                </div>
              )}

              {/* Mode Selection */}
              {validationResult?.isValid && (
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">
                    Pilih Metode Pemulihan Data:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                        restoreMode === 'replace'
                          ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-300'
                          : 'bg-white border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="restoreMode"
                        value="replace"
                        checked={restoreMode === 'replace'}
                        onChange={() => setRestoreMode('replace')}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          Ganti Semua Data (Replace)
                        </div>
                        <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                          Menimpa data saat ini dengan data persis dari file cadangan.
                        </div>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                        restoreMode === 'merge'
                          ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-300'
                          : 'bg-white border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="restoreMode"
                        value="merge"
                        checked={restoreMode === 'merge'}
                        onChange={() => setRestoreMode('merge')}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          Gabungkan Data (Merge)
                        </div>
                        <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                          Menyatukan data cadangan tanpa menghapus data baru yang sudah dibuat.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Action Button */}
              {validationResult?.isValid && (
                <button
                  id="btn-execute-restore"
                  onClick={handleExecuteRestore}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>
                    {isProcessing ? 'Sedang Memulihkan...' : 'PULIHKAN DATABASE SEKARANG'}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-slate-400" />
            <span>Penyimpanan Lokal Browser & File JSON</span>
            {isCloudConnected && (
              <span className="flex items-center gap-1 text-indigo-700 font-semibold ml-2">
                <Cloud className="w-3.5 h-3.5" /> Terhubung Cloud
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-semibold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
