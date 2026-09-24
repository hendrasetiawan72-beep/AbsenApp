import React, { useState, useRef } from 'react';
import {
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
  ShieldAlert,
  ArrowRight,
  Download,
  Trash2,
  FileSpreadsheet,
  FileCheck2,
  Eye,
  Info,
} from 'lucide-react';
import {
  TeacherProfile,
  ClassRoom,
  Student,
  AttendanceSession,
  StudentGrade,
  TeachingAgenda,
  SavingTransaction,
} from '../types';
import {
  MigrationDryRunResult,
  MigrationImportRecord,
  MigrationDuplicateStrategy,
} from '../types/migration';
import {
  validateAndDryRunJson,
  executeMigrationImport,
  getMigrationHistory,
  clearMigrationHistory,
} from '../utils/jsonMigrationEngine';
import { HENDRA_MASTER_DATA } from '../data/seedData';
import { downloadBackupJson, buildDatabaseBackup } from '../utils/backupRestore';

interface AdminImportModalProps {
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
}

export const AdminImportModal: React.FC<AdminImportModalProps> = ({
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
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'history' | 'export'>('import');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jsonText, setJsonText] = useState<string>('');
  const [isDryRunning, setIsDryRunning] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<MigrationDryRunResult | null>(null);
  const [duplicateStrategy, setDuplicateStrategy] = useState<MigrationDuplicateStrategy>('skip');
  const [isImporting, setIsImporting] = useState(false);
  const [finalImportRecord, setFinalImportRecord] = useState<MigrationImportRecord | null>(null);
  const [historyLogs, setHistoryLogs] = useState<MigrationImportRecord[]>(() => getMigrationHistory());
  const [previewFilter, setPreviewFilter] = useState<'all' | 'duplicate' | 'valid' | 'invalid'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Authorization check: User must be admin or teacher
  const isAdmin =
    teacher.email === 'hendra.alkindi@gmail.com' ||
    teacher.role === 'admin' ||
    (teacher.email && teacher.email.endsWith('@smkmuhbawang.sch.id')) ||
    teacher.isLoggedIn;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      onShowToast('Hanya file berformat .json yang didukung.', 'error');
      return;
    }

    setSelectedFile(file);
    setFinalImportRecord(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonText(content);
      runDryRun(content, file.name);
    };
    reader.onerror = () => {
      onShowToast('Gagal membaca file JSON.', 'error');
    };
    reader.readAsText(file);
  };

  const runDryRun = (content: string, fileName: string = 'data.json') => {
    setIsDryRunning(true);
    setTimeout(() => {
      try {
        const result = validateAndDryRunJson(
          content,
          fileName,
          { id: teacher.id, email: teacher.email },
          {
            classes,
            students: allStudents,
            sessions: allSessions,
            grades: allGrades,
            agendas: allAgendas,
            savings: allSavings,
          }
        );
        setDryRunResult(result);
        if (result.isValid) {
          onShowToast(
            `Dry Run selesai: ${result.summary.validCount} valid, ${result.summary.duplicateCount} duplikat ditemukan.`,
            'info'
          );
        } else {
          onShowToast('Format data memiliki kesalahan yang perlu diperiksa.', 'error');
        }
      } catch (err: any) {
        onShowToast('Gagal memproses validasi JSON: ' + err.message, 'error');
      } finally {
        setIsDryRunning(false);
      }
    }, 150);
  };

  const handleLoadSeedData = () => {
    const jsonString = JSON.stringify(HENDRA_MASTER_DATA, null, 2);
    setJsonText(jsonString);
    setSelectedFile(new File([jsonString], 'Master_Data_Hendra_Setiawan.json', { type: 'application/json' }));
    setFinalImportRecord(null);
    runDryRun(jsonString, 'Master_Data_Hendra_Setiawan.json');
  };

  const handleExecuteImport = () => {
    if (!dryRunResult) {
      onShowToast('Lakukan validasi Dry Run terlebih dahulu.', 'error');
      return;
    }

    if (duplicateStrategy === 'cancel') {
      onShowToast('Import dibatalkan.', 'info');
      setDryRunResult(null);
      setSelectedFile(null);
      setJsonText('');
      return;
    }

    setIsImporting(true);
    setTimeout(() => {
      try {
        const { success, importRecord, updatedWorkspace } = executeMigrationImport(
          dryRunResult,
          duplicateStrategy,
          { id: teacher.id, email: teacher.email },
          {
            teacher,
            classes,
            students: allStudents,
            sessions: allSessions,
            grades: allGrades,
            agendas: allAgendas,
            savings: allSavings,
          }
        );

        if (success) {
          setFinalImportRecord(importRecord);
          setHistoryLogs(getMigrationHistory());
          onApplyRestoredData(updatedWorkspace);
          onShowToast(
            `Import Berhasil: ${importRecord.success_count} data tersimpan, ${importRecord.duplicate_count} duplikat diproses.`,
            'success'
          );
        } else {
          onShowToast('Import gagal atau dibatalkan.', 'error');
        }
      } catch (err: any) {
        onShowToast('Terjadi kesalahan saat import: ' + err.message, 'error');
      } finally {
        setIsImporting(false);
      }
    }, 300);
  };

  const handleClearHistory = () => {
    if (confirm('Hapus seluruh riwayat log audit import?')) {
      clearMigrationHistory();
      setHistoryLogs([]);
      onShowToast('Riwayat audit import berhasil dihapus.', 'info');
    }
  };

  const handleDownloadBackup = () => {
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
    onShowToast('File cadangan database berhasil diunduh.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">Migrasi & Import Data JSON</h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                  Role: Admin
                </span>
              </div>
              <p className="text-xs text-indigo-100 font-medium">
                Validasi struktur, mapping relasi legacy ID, dan proteksi duplikasi data
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setActiveTab('import')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'import'
                  ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-xl shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import & Migrasi JSON</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('history');
                setHistoryLogs(getMigrationHistory());
              }}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-xl shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Riwayat Audit Log ({historyLogs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'export'
                  ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-xl shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor / Backup Database</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700">
          
          {/* TAB 1: IMPORT & MIGRATION */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              {/* Info Banner */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-900 leading-relaxed">
                  <p className="font-bold">Alur Kerja Migrasi Aman (Safe Local-First & Cloud Upsert)</p>
                  <p className="text-indigo-700 mt-0.5">
                    Data JSON diproses bertahap: <strong>1. Validasi Sintaks</strong> &rarr; <strong>2. Dry Run & Deteksi Duplikat</strong> &rarr; <strong>3. Relasional Mapping (Kelas &rarr; Siswa &rarr; Sesi &rarr; Nilai)</strong> &rarr; <strong>4. Konfirmasi & Simpan</strong>.
                  </p>
                </div>
              </div>

              {/* Upload Zone */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="md:col-span-2 border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/60 hover:bg-indigo-50/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform mb-3">
                    <FileJson className="w-6 h-6 text-indigo-600" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    {selectedFile ? selectedFile.name : 'Pilih File JSON (.json) untuk Diimport'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Mendukung backup utuh (full export) maupun array siswa / kelas / absensi.
                  </p>
                </div>

                {/* Preset Quick Load */}
                <div className="border border-slate-200 bg-white rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Data Master Sekolah</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Muat langsung data lengkap guru Hendra Setiawan (12 Kelas, 377 Siswa, 53 Absensi, 338 Nilai, 14 Tabungan).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadSeedData}
                    className="w-full mt-3 px-3 py-2 text-xs font-bold rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Muat Data Master Hendra</span>
                  </button>
                </div>
              </div>

              {/* DRY RUN RESULTS VIEW */}
              {isDryRunning && (
                <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-center">
                  <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
                  <p className="text-xs font-bold text-slate-700">Menjalankan Dry Run Validasi...</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Memeriksa struktur relasi ID dan membandingkan duplikat.</p>
                </div>
              )}

              {dryRunResult && !isDryRunning && (
                <div className="space-y-5 animate-in fade-in">
                  {/* Summary Bar */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hasil Validasi Dry Run</span>
                        <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                          <span>{dryRunResult.fileName}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Format: {dryRunResult.formatDetected}
                          </span>
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Valid & Siap Diimport</span>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Total Record</p>
                        <p className="text-lg font-black text-slate-900 mt-0.5">{dryRunResult.summary.totalRecords}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                        <p className="text-[10px] font-bold text-emerald-700 uppercase">Data Baru (Valid)</p>
                        <p className="text-lg font-black text-emerald-800 mt-0.5">{dryRunResult.summary.validCount}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80">
                        <p className="text-[10px] font-bold text-amber-700 uppercase">Duplikat Terdeteksi</p>
                        <p className="text-lg font-black text-amber-800 mt-0.5">{dryRunResult.summary.duplicateCount}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/80">
                        <p className="text-[10px] font-bold text-rose-700 uppercase">Tidak Valid / Eror</p>
                        <p className="text-lg font-black text-rose-800 mt-0.5">{dryRunResult.summary.invalidCount}</p>
                      </div>
                    </div>

                    {/* Warnings / Missing fields if any */}
                    {dryRunResult.summary.missingFields.length > 0 && (
                      <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                        <p className="font-bold flex items-center gap-1.5 mb-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Peringatan Relasi / Kolom:</span>
                        </p>
                        <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                          {dryRunResult.summary.missingFields.map((warn, idx) => (
                            <li key={idx}>{warn}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Entity Breakdown Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <Layers className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                      <p className="text-[10px] text-slate-500 font-bold">Kelas</p>
                      <p className="text-sm font-black text-slate-800">{dryRunResult.breakdown.classes.total}</p>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <Users className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                      <p className="text-[10px] text-slate-500 font-bold">Siswa</p>
                      <p className="text-sm font-black text-slate-800">{dryRunResult.breakdown.students.total}</p>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <CalendarCheck2 className="w-4 h-4 text-teal-600 mx-auto mb-1" />
                      <p className="text-[10px] text-slate-500 font-bold">Sesi Absensi</p>
                      <p className="text-sm font-black text-slate-800">{dryRunResult.breakdown.sessions.total}</p>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <GraduationCap className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                      <p className="text-[10px] text-slate-500 font-bold">Nilai Siswa</p>
                      <p className="text-sm font-black text-slate-800">{dryRunResult.breakdown.grades.total}</p>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <BookOpen className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                      <p className="text-[10px] text-slate-500 font-bold">Agenda</p>
                      <p className="text-sm font-black text-slate-800">{dryRunResult.breakdown.agendas.total}</p>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <Wallet className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                      <p className="text-[10px] text-slate-500 font-bold">Tabungan</p>
                      <p className="text-sm font-black text-slate-800">{dryRunResult.breakdown.savings.total}</p>
                    </div>
                  </div>

                  {/* DUPLICATE STRATEGY SELECTION */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <p className="text-xs font-bold text-slate-800">
                      Pilihan Penanganan Data Duplikat ({dryRunResult.summary.duplicateCount} terdeteksi):
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <label
                        className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2 transition-all ${
                          duplicateStrategy === 'skip'
                            ? 'bg-indigo-50/80 border-indigo-400 text-indigo-950 font-bold shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="radio"
                          name="dupStrategy"
                          value="skip"
                          checked={duplicateStrategy === 'skip'}
                          onChange={() => setDuplicateStrategy('skip')}
                          className="mt-0.5 text-indigo-600"
                        />
                        <div className="text-[11px] leading-tight">
                          <p className="font-bold">Lewati Duplikat (Skip)</p>
                          <p className="text-slate-500 font-normal mt-0.5">Pertahankan data lama, hanya masukkan record baru.</p>
                        </div>
                      </label>

                      <label
                        className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2 transition-all ${
                          duplicateStrategy === 'update'
                            ? 'bg-indigo-50/80 border-indigo-400 text-indigo-950 font-bold shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="radio"
                          name="dupStrategy"
                          value="update"
                          checked={duplicateStrategy === 'update'}
                          onChange={() => setDuplicateStrategy('update')}
                          className="mt-0.5 text-indigo-600"
                        />
                        <div className="text-[11px] leading-tight">
                          <p className="font-bold">Perbarui Yang Ada (Update)</p>
                          <p className="text-slate-500 font-normal mt-0.5">Timpa data lama dengan data dari file JSON.</p>
                        </div>
                      </label>

                      <label
                        className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2 transition-all ${
                          duplicateStrategy === 'cancel'
                            ? 'bg-rose-50/80 border-rose-400 text-rose-950 font-bold shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="radio"
                          name="dupStrategy"
                          value="cancel"
                          checked={duplicateStrategy === 'cancel'}
                          onChange={() => setDuplicateStrategy('cancel')}
                          className="mt-0.5 text-rose-600"
                        />
                        <div className="text-[11px] leading-tight">
                          <p className="font-bold">Batalkan Import</p>
                          <p className="text-slate-500 font-normal mt-0.5">Batalkan seluruh proses migrasi.</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* ACTION BUTTON */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDryRunResult(null);
                        setSelectedFile(null);
                        setJsonText('');
                      }}
                      className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl cursor-pointer"
                    >
                      Batal / Reset
                    </button>
                    <button
                      type="button"
                      disabled={isImporting}
                      onClick={handleExecuteImport}
                      className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                    >
                      {isImporting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )}
                      <span>Terapkan & Simpan ke Database</span>
                    </button>
                  </div>
                </div>
              )}

              {/* FINAL REPORT */}
              {finalImportRecord && (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-emerald-800 font-black text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Laporan Hasil Import Selesai</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2 bg-white/80 rounded-lg">
                      <span className="text-slate-500 block text-[10px]">ID Import:</span>
                      <span className="font-bold text-slate-800">{finalImportRecord.id}</span>
                    </div>
                    <div className="p-2 bg-white/80 rounded-lg">
                      <span className="text-slate-500 block text-[10px]">Berhasil Masuk:</span>
                      <span className="font-bold text-emerald-700">{finalImportRecord.success_count}</span>
                    </div>
                    <div className="p-2 bg-white/80 rounded-lg">
                      <span className="text-slate-500 block text-[10px]">Duplikat Diproses:</span>
                      <span className="font-bold text-amber-700">{finalImportRecord.duplicate_count} ({finalImportRecord.strategy})</span>
                    </div>
                    <div className="p-2 bg-white/80 rounded-lg">
                      <span className="text-slate-500 block text-[10px]">Gagal:</span>
                      <span className="font-bold text-rose-700">{finalImportRecord.failed_count}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                    Data telah disinkronkan ke ruang kerja lokal dan siap dipublikasikan atau diakses di seluruh menu aplikasi.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AUDIT LOGS */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900">Riwayat Audit Migrasi & Import</h4>
                  <p className="text-xs text-slate-500">Mencatat user, nama file, tanggal, jumlah data, dan status import.</p>
                </div>
                {historyLogs.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Log</span>
                  </button>
                )}
              </div>

              {historyLogs.length === 0 ? (
                <div className="p-10 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <Database className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-500">Belum ada riwayat import yang tercatat.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                  {historyLogs.map((log) => (
                    <div key={log.id} className="p-4 hover:bg-slate-50 flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{log.file_name}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              log.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : log.status === 'cancelled'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {new Date(log.started_at).toLocaleString('id-ID')} • Admin: {log.admin_email}
                        </p>
                        <p className="text-[11px] text-slate-600">{log.error_summary}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-slate-800 block">
                          +{log.success_count} / {log.total_records}
                        </span>
                        <span className="text-[10px] text-slate-400">Strategi: {log.strategy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EXPORT JSON */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-900 text-xs flex items-start gap-3">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Format Ekspor Terstandarisasi dengan Legacy ID</p>
                  <p className="text-indigo-700 mt-0.5">
                    File JSON yang dihasilkan menyertakan seluruh <code>legacy_id</code> dan relasi tabel (kelas, siswa, sesi, nilai, tabungan) sehingga dapat dipindahkan ke server database atau diimport kembali tanpa resiko duplikasi.
                  </p>
                </div>
              </div>

              <div className="p-6 border border-slate-200 rounded-2xl bg-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                <div>
                  <h4 className="text-sm font-black text-slate-900">Ekspor Seluruh Database ({classes.length} Kelas, {allStudents.length} Siswa)</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Unduh file cadangan format JSON standar SMK Muhammadiyah Bawang.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh JSON Backup</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Sistem Informasi Presensi & Nilai • SMK Muhammadiyah Bawang</span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
