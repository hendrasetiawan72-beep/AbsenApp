import React from 'react';
import {
  School,
  User,
  BookOpen,
  CalendarCheck2,
  GraduationCap,
  BarChart3,
  FileSpreadsheet,
  MessageSquare,
  Plus,
  Edit3,
  RefreshCw,
  ChevronDown,
  Trash2,
  LogOut,
  Cloud,
  CloudDownload,
  CloudUpload,
  MapPin,
  Sparkles,
  CheckSquare,
  Wallet,
  Database,
} from 'lucide-react';
import { ActiveTab, ClassRoom, TeacherProfile } from '../types';
import { SchoolLogo } from './SchoolLogo';

interface NavbarProps {
  teacher: TeacherProfile;
  classes: ClassRoom[];
  activeClassId: string;
  activeTab: ActiveTab;
  isCloudSaving?: boolean;
  isCloudLoading?: boolean;
  syncStatus?: 'synced' | 'saving_local' | 'syncing' | 'pending' | 'offline' | 'error' | 'quota_exceeded';
  lastSyncedTime?: string | null;
  pendingCount?: number;
  onForceSync?: () => void;
  onPullCloudData?: () => void;
  onSelectClass: (classId: string) => void;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenClassModal: () => void;
  onOpenEditClass?: (cls?: ClassRoom) => void;
  onOpenLoginModal: () => void;
  onOpenBackupModal?: () => void;
  onOpenAdminImportModal?: () => void;
  onResetData: () => void;
  onDeleteClass: (classId: string) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  teacher,
  classes,
  activeClassId,
  activeTab,
  isCloudSaving = false,
  isCloudLoading = false,
  syncStatus = 'synced',
  lastSyncedTime = null,
  pendingCount = 0,
  onForceSync,
  onPullCloudData,
  onSelectClass,
  onSelectTab,
  onOpenClassModal,
  onOpenEditClass,
  onOpenLoginModal,
  onOpenBackupModal,
  onOpenAdminImportModal,
  onResetData,
  onDeleteClass,
  onLogout,
}) => {
  const activeClass = classes.find((c) => c.id === activeClassId);

  return (
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-xs no-print backdrop-blur-md bg-white/95">
      {/* Primary Brand & Actions Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[58px] py-2 gap-2 sm:gap-4 flex-wrap md:flex-nowrap">
          {/* Brand & School Logo */}
          <div className="flex items-center gap-2.5 min-w-0 shrink-0">
            <SchoolLogo size="md" className="p-1 bg-white rounded-xl shadow-xs shrink-0 ring-1 ring-slate-200/80" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight truncate">
                  SIM Presensi & Nilai
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                  SMK Muh Bawang
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate hidden lg:block font-medium">
                Tahun Ajaran {teacher.tahunAjaran} ({teacher.semester})
              </p>
            </div>
          </div>

          {/* Right Action Tools: Class Switcher, Cloud Badge, Teacher Profile, Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 ml-auto shrink-0 flex-wrap justify-end">
            {/* Clean Class Selector Pill */}
            <div className="flex items-center gap-1 bg-slate-100/90 hover:bg-slate-200/70 p-0.5 sm:p-1 rounded-xl border border-slate-200/90 transition-colors">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600 ml-1.5 shrink-0 hidden sm:block" />
              <div className="relative">
                <select
                  id="navbar-class-select"
                  value={activeClassId}
                  onChange={(e) => onSelectClass(e.target.value)}
                  aria-label="Pilih Kelas"
                  className="appearance-none bg-transparent text-slate-900 font-bold text-xs sm:text-sm pl-2 pr-6 py-1 cursor-pointer focus:outline-none max-w-[130px] sm:max-w-[190px] truncate"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.namaKelas} • {cls.mataPelajaran}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Edit Current Class Button */}
              {activeClass && onOpenEditClass && (
                <button
                  id="btn-edit-class-nav"
                  onClick={() => onOpenEditClass(activeClass)}
                  title={`Edit Nama Kelas & Mapel (${activeClass.namaKelas} - ${activeClass.mataPelajaran})`}
                  className="p-1 sm:px-2 sm:py-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-lg transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline text-[11px]">Edit Kelas</span>
                </button>
              )}

              {/* Add Class Button */}
              <button
                id="btn-add-class-nav"
                onClick={onOpenClassModal}
                title="Buat Kelas Baru"
                className="p-1 sm:px-2 sm:py-1 text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-50 border border-slate-200/80 rounded-lg transition-all cursor-pointer shadow-2xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden xl:inline text-[11px]">Tambah</span>
              </button>

              {activeClass && classes.length > 1 && (
                <button
                  id="btn-delete-class-nav"
                  onClick={() => onDeleteClass(activeClass.id)}
                  title={`Hapus Kelas ${activeClass.namaKelas}`}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer hidden sm:block"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Penyimpanan Browser */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] font-medium text-slate-700 shadow-2xs"
              title={`Status: Data selalu aman di browser Anda lebih dulu. ${
                lastSyncedTime ? `Terakhir disinkronkan ke Cloud: ${lastSyncedTime}` : ''
              }`}
            >
              {syncStatus === 'syncing' || isCloudSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin shrink-0" />
                  <span className="text-amber-700 font-semibold hidden md:inline">
                    Menyimpan ke Cloud...
                  </span>
                </>
              ) : isCloudLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin shrink-0" />
                  <span className="text-indigo-600 font-semibold hidden md:inline">
                    Memuat dari Cloud...
                  </span>
                </>
              ) : syncStatus === 'quota_exceeded' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                  <span className="text-indigo-800 font-semibold hidden md:inline" title="Batas kuota harian Cloud tercapai. Data 100% aman tersimpan di browser Anda.">
                    Tersimpan di Browser (Cloud Kuota Penuh)
                  </span>
                </>
              ) : syncStatus === 'offline' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                  <span className="text-sky-700 font-semibold hidden md:inline">
                    Tersimpan di Browser (Offline)
                  </span>
                </>
              ) : pendingCount > 0 ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  <span className="text-amber-700 font-semibold hidden md:inline">
                    Tersimpan di Browser ({pendingCount} belum disinkron)
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-slate-700 font-medium hidden md:inline">
                    Tersimpan di Browser
                  </span>
                </>
              )}
            </div>

            {/* Tombol Navigasi Cloud: Tarik dari Cloud */}
            {onPullCloudData && (
              <button
                type="button"
                onClick={onPullCloudData}
                disabled={isCloudLoading || isCloudSaving}
                title="Tarik & ambil data terbaru dari Cloud Firestore ke browser"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
              >
                <CloudDownload className={`w-3.5 h-3.5 ${isCloudLoading ? 'animate-bounce' : ''}`} />
                <span className="hidden sm:inline">Tarik Cloud</span>
              </button>
            )}

            {/* Tombol Navigasi Cloud: Sinkronkan ke Cloud */}
            {onForceSync && (
              <button
                type="button"
                onClick={onForceSync}
                disabled={isCloudLoading || isCloudSaving}
                title="Sinkronkan data yang tersimpan di browser ke Cloud Firestore"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs disabled:opacity-50 ${
                  pendingCount > 0
                    ? 'text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300'
                    : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <CloudUpload className={`w-3.5 h-3.5 ${isCloudSaving ? 'animate-bounce' : ''}`} />
                <span>
                  {pendingCount > 0 ? (
                    <>
                      <span className="hidden sm:inline">Sinkronkan Cloud</span>
                      <span className="sm:hidden">Sync</span> ({pendingCount})
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Sinkronkan Cloud</span>
                      <span className="sm:hidden">Sync</span>
                    </>
                  )}
                </span>
              </button>
            )}

            {/* Admin Migration / JSON Import Button */}
            {onOpenAdminImportModal && (
              <button
                id="btn-admin-import-nav"
                onClick={onOpenAdminImportModal}
                title="Migrasi & Import Data JSON (Admin Only: Relasi ID, Dry Run, Proteksi Duplikat)"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200/90 rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                <Database className="w-3.5 h-3.5 text-indigo-600" />
                <span>Migrasi JSON</span>
              </button>
            )}

            {/* Backup & Restore Database JSON Button */}
            {onOpenBackupModal && (
              <button
                id="btn-backup-restore-nav"
                onClick={onOpenBackupModal}
                title="Cadangkan & Pulihkan Seluruh Database ke File JSON Lokal (Kendali Penuh Guru)"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200/90 rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                <CloudUpload className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden lg:inline">Backup Database</span>
              </button>
            )}

            {/* Profile Button with Avatar & Name */}
            <button
              id="btn-teacher-profile"
              onClick={onOpenLoginModal}
              className="flex items-center gap-2 px-2 py-1 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all text-left cursor-pointer shadow-2xs"
              title="Profil Guru & Pengaturan Akun"
            >
              {teacher.avatarUrl ? (
                <img
                  src={teacher.avatarUrl}
                  alt={teacher.namaGuru || 'Foto Profil'}
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover shadow-2xs shrink-0 ring-1 ring-slate-200"
                />
              ) : (
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                  {teacher.namaGuru?.charAt(0) || teacher.email?.charAt(0).toUpperCase() || 'G'}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <div className="font-bold text-slate-800 text-xs truncate max-w-[110px] leading-tight">
                  {teacher.namaGuru || 'Guru SMK'}
                </div>
              </div>
            </button>

            {/* Prominent Logout Button */}
            <button
              id="btn-logout"
              onClick={onLogout}
              title="Keluar / Ganti Akun Google"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Clean Immersive Navigation Tabs */}
      <div className="border-t border-slate-100 bg-slate-50/70">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-1.5 overflow-x-auto py-1.5 scrollbar-none" aria-label="Tabs">
            <button
              id="tab-absensi"
              onClick={() => onSelectTab('absensi')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'absensi'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <CalendarCheck2 className="w-3.5 h-3.5" />
              <span>Presensi Siswa</span>
            </button>

            <button
              id="tab-agenda"
              onClick={() => onSelectTab('agenda')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'agenda'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Agenda Mengajar</span>
            </button>

            <button
              id="tab-nilai"
              onClick={() => onSelectTab('nilai')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'nilai'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Rekap Nilai</span>
            </button>

            <button
              id="tab-tabungan"
              onClick={() => onSelectTab('tabungan')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'tabungan'
                  ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-400'
                  : 'text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tabungan Siswa</span>
            </button>

            <button
              id="tab-statistik"
              onClick={() => onSelectTab('statistik')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'statistik'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Statistik & Resume</span>
            </button>

            <button
              id="tab-impor"
              onClick={() => onSelectTab('impor')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'impor'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Data Siswa</span>
            </button>

            <button
              id="tab-workspace"
              onClick={() => onSelectTab('workspace')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'workspace'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-200/60'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Workspace & Cloud</span>
            </button>

            <button
              id="tab-peta"
              onClick={() => onSelectTab('peta')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'peta'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Peta & Zonasi</span>
            </button>

            <button
              id="tab-laporan-ortu"
              onClick={() => onSelectTab('laporan-ortu')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'laporan-ortu'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-800 bg-emerald-50/60 hover:bg-emerald-100 border border-emerald-200/50'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Laporan Ortu (WA)</span>
            </button>

            <button
              id="tab-generator-modul"
              onClick={() => onSelectTab('generator-modul')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'generator-modul'
                  ? 'bg-gradient-to-r from-indigo-600 to-emerald-600 text-white shadow-xs ring-1 ring-emerald-300/40'
                  : 'text-indigo-900 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200/70 shadow-2xs'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>Generator Modul & LKPD</span>
            </button>

            <button
              id="tab-kisi-kartu-soal"
              onClick={() => onSelectTab('kisi-kartu-soal')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'kisi-kartu-soal'
                  ? 'bg-amber-600 text-white shadow-xs ring-1 ring-amber-400'
                  : 'text-amber-950 bg-amber-100/90 hover:bg-amber-200/80 border border-amber-300/90 shadow-2xs'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
              <span>Kisi-Kisi & Kartu Soal</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
