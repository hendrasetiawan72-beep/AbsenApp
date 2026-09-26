import React, { useState, useEffect } from 'react';
import {
  Menu,
  X,
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
  ShieldCheck,
  ChevronRight,
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const activeClass = classes.find((c) => c.id === activeClassId);

  // Close sidebar on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  const handleSelectTabFromSidebar = (tab: ActiveTab) => {
    onSelectTab(tab);
    setIsSidebarOpen(false);
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-xs no-print backdrop-blur-md bg-white/95">
        {/* Primary Brand & Actions Bar */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-[58px] py-2 gap-2 sm:gap-4">
            {/* Brand & School Logo + 3-line Hamburger Button */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
              {/* Hamburger Button (Garis 3) */}
              <button
                id="btn-navbar-menu-hamburger"
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                title="Buka Bilah Sisi Garis 3 (Menu & Pengaturan)"
                aria-label="Buka Menu Garis 3"
                className="p-1.5 sm:p-2 -ml-1 text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 border border-slate-200/80 shadow-2xs"
              >
                <Menu className="w-5 h-5 text-slate-800" />
              </button>

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

            {/* Right Action Tools: Class Switcher & 3-line Menu Button */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 ml-auto shrink-0 justify-end">
              {/* Clean Class Selector Pill */}
              <div className="flex items-center gap-1 bg-slate-100/90 hover:bg-slate-200/70 p-0.5 sm:p-1 rounded-xl border border-slate-200/90 transition-colors">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600 ml-1.5 shrink-0 hidden sm:block" />
                <div className="relative">
                  <select
                    id="navbar-class-select"
                    value={activeClassId}
                    onChange={(e) => onSelectClass(e.target.value)}
                    aria-label="Pilih Kelas"
                    className="appearance-none bg-transparent text-slate-900 font-bold text-xs sm:text-sm pl-2 pr-6 py-1 cursor-pointer focus:outline-none max-w-[125px] sm:max-w-[190px] truncate"
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

              {/* Status Penyimpanan Cloud Langsung (Compact indicator on navbar) */}
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                title="Penyimpanan Cloud Langsung (Tanpa Jeda) Aktif. Klik untuk membuka Bilah Sisi Garis 3."
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-[11px] font-bold text-slate-700 shadow-2xs cursor-pointer transition-all"
              >
                {syncStatus === 'syncing' || isCloudSaving ? (
                  <>
                    <RefreshCw className="w-3 h-3 text-amber-500 animate-spin shrink-0" />
                    <span className="text-amber-700 font-semibold hidden sm:inline">Menyimpan...</span>
                  </>
                ) : isCloudLoading ? (
                  <>
                    <RefreshCw className="w-3 h-3 text-indigo-600 animate-spin shrink-0" />
                    <span className="text-indigo-600 font-semibold hidden sm:inline">Memuat...</span>
                  </>
                ) : syncStatus === 'offline' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                    <span className="text-sky-700 font-semibold hidden sm:inline">Offline</span>
                  </>
                ) : (
                  <>
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-emerald-800 font-bold hidden sm:inline">Cloud Langsung</span>
                  </>
                )}
              </button>

              {/* Dedicated 3-Line Menu Button on Right */}
              <button
                id="btn-navbar-menu-right"
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                title="Buka Bilah Sisi Garis 3 (Menu & Pengaturan)"
                aria-label="Buka Menu"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/90 text-indigo-700 font-bold text-xs transition-all cursor-pointer shadow-2xs"
              >
                <Menu className="w-4 h-4 text-indigo-700 shrink-0" />
                <span className="hidden sm:inline">Menu</span>
                {pendingCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                )}
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

      {/* BILAH SISI GARIS 3 NAVBAR (Slide-over Sidebar Drawer) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden no-print" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Drawer Container */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <aside className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full transform transition-all duration-300 ease-in-out border-l border-slate-200">
              {/* Drawer Top Header */}
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-indigo-600 text-white rounded-xl shadow-xs">
                    <Menu className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 leading-tight">
                      Bilah Sisi Menu & Pengaturan
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">
                      SMK Muhammadiyah Bawang
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  title="Tutup Menu"
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Scrollable Body */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                {/* 1. TEACHER PROFILE CARD */}
                <div className="bg-gradient-to-br from-indigo-50/70 to-slate-50 border border-indigo-100 rounded-2xl p-4 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <button
                      id="btn-teacher-profile"
                      type="button"
                      onClick={() => {
                        setIsSidebarOpen(false);
                        onOpenLoginModal();
                      }}
                      className="shrink-0 cursor-pointer rounded-full ring-2 ring-indigo-500/30 hover:ring-indigo-500 transition-all text-left"
                      title="Profil Guru & Pengaturan Akun"
                    >
                      {teacher.avatarUrl ? (
                        <img
                          src={teacher.avatarUrl}
                          alt={teacher.namaGuru || 'Foto Profil'}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-full object-cover shadow-2xs ring-1 ring-slate-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center font-bold text-base shadow-2xs">
                          {teacher.namaGuru?.charAt(0) || teacher.email?.charAt(0).toUpperCase() || 'G'}
                        </div>
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-slate-900 text-sm truncate">
                        {teacher.namaGuru || 'Guru SMK'}
                      </h4>
                      <p className="text-xs text-slate-600 truncate">{teacher.email || 'Email belum diatur'}</p>
                      <p className="text-[11px] font-semibold text-indigo-700 truncate mt-0.5">
                        {teacher.namaSekolah || 'SMK Muhammadiyah Bawang'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-indigo-100/80 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">
                      NIP: <span className="font-mono text-slate-700 font-semibold">{teacher.nip || '-'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSidebarOpen(false);
                        onOpenLoginModal();
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                    >
                      Ubah Profil &rarr;
                    </button>
                  </div>
                </div>

                {/* 2. DIRECT CLOUD SYNC STATUS (Koneksi Cloud Langsung Tanpa Jeda) */}
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="text-xs font-extrabold text-emerald-950">
                        Koneksi Cloud Langsung (Tanpa Jeda)
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200/80">
                      Real-Time
                    </span>
                  </div>
                  <p className="text-xs text-emerald-900/90 leading-relaxed font-medium">
                    Setiap perubahan data presensi, nilai, agenda, dan siswa otomatis tersimpan langsung ke database Cloud Supabase seketika tanpa jeda.
                  </p>
                  <div className="pt-1 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-emerald-800">
                    <span>Status Server:</span>
                    <span className="font-bold text-emerald-900">
                      {syncStatus === 'offline' ? 'Mode Offline' : 'Terhubung & Sinkron'}
                    </span>
                  </div>
                  {lastSyncedTime && (
                    <div className="text-[10px] text-emerald-700 font-medium">
                      Terakhir tersinkron: <span className="font-bold">{lastSyncedTime}</span>
                    </div>
                  )}
                </div>

                {/* 3. CLOUD ACTIONS: Tarik Cloud & Sinkronkan Cloud */}
                <div>
                  <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                    Aksi Sinkronisasi Cloud
                  </h5>
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Tarik Cloud */}
                    {onPullCloudData && (
                      <button
                        type="button"
                        onClick={() => {
                          onPullCloudData();
                        }}
                        disabled={isCloudLoading || isCloudSaving}
                        title="Tarik & ambil data terbaru dari Cloud Supabase ke browser"
                        className="flex flex-col items-center justify-center p-3 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200 transition-all cursor-pointer shadow-2xs disabled:opacity-50 gap-1.5 text-center"
                      >
                        <CloudDownload className={`w-5 h-5 text-indigo-600 ${isCloudLoading ? 'animate-bounce' : ''}`} />
                        <span>Tarik Cloud</span>
                      </button>
                    )}

                    {/* Sinkronkan Cloud */}
                    {onForceSync && (
                      <button
                        type="button"
                        onClick={() => {
                          onForceSync();
                        }}
                        disabled={isCloudLoading || isCloudSaving}
                        title="Sinkronkan data yang tersimpan di browser ke Cloud Supabase"
                        className={`flex flex-col items-center justify-center p-3 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-50 gap-1.5 text-center ${
                          pendingCount > 0
                            ? 'text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300'
                            : 'text-emerald-800 bg-emerald-50/90 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        <CloudUpload className={`w-5 h-5 ${isCloudSaving ? 'animate-bounce' : ''}`} />
                        <span>
                          Sinkronkan Cloud
                          {pendingCount > 0 && <span className="text-[10px] block font-normal">({pendingCount} pending)</span>}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 4. DATABASE & MIGRATION MANAGEMENT */}
                <div className="space-y-2.5">
                  <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    Manajemen & Cadangan Database
                  </h5>

                  {/* Backup & Restore Database JSON Button */}
                  {onOpenBackupModal && (
                    <button
                      id="btn-backup-restore-nav"
                      type="button"
                      onClick={() => {
                        setIsSidebarOpen(false);
                        onOpenBackupModal();
                      }}
                      title="Cadangkan & Pulihkan Seluruh Database ke File JSON Lokal (Kendali Penuh Guru)"
                      className="w-full flex items-center justify-between p-3 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl transition-all cursor-pointer shadow-2xs group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                          <CloudUpload className="w-4 h-4 text-slate-700" />
                        </div>
                        <div className="text-left">
                          <div className="text-slate-900 font-bold">Backup Database JSON</div>
                          <div className="text-[10px] text-slate-500 font-normal">Cadangkan & pulihkan file JSON lokal</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}

                  {/* Admin Migration / JSON Import Button */}
                  {onOpenAdminImportModal && (
                    <button
                      id="btn-admin-import-nav"
                      type="button"
                      onClick={() => {
                        setIsSidebarOpen(false);
                        onOpenAdminImportModal();
                      }}
                      title="Migrasi & Import Data JSON (Admin Only: Relasi ID, Dry Run, Proteksi Duplikat)"
                      className="w-full flex items-center justify-between p-3 text-xs font-bold text-indigo-700 bg-indigo-50/60 hover:bg-indigo-100/80 border border-indigo-200/80 rounded-xl transition-all cursor-pointer shadow-2xs group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                          <Database className="w-4 h-4 text-indigo-700" />
                        </div>
                        <div className="text-left">
                          <div className="text-indigo-950 font-bold">Migrasi Data JSON</div>
                          <div className="text-[10px] text-indigo-700/80 font-normal">Import data lama & relasi Supabase</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}
                </div>

                {/* 5. QUICK NAVIGATION TO MODULES */}
                <div>
                  <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                    Navigasi Cepat Modul
                  </h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleSelectTabFromSidebar('absensi')}
                      className={`flex items-center gap-2 p-2.5 rounded-xl font-bold transition-all text-left cursor-pointer ${
                        activeTab === 'absensi'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                      }`}
                    >
                      <CalendarCheck2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Presensi Siswa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectTabFromSidebar('agenda')}
                      className={`flex items-center gap-2 p-2.5 rounded-xl font-bold transition-all text-left cursor-pointer ${
                        activeTab === 'agenda'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Agenda Mengajar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectTabFromSidebar('nilai')}
                      className={`flex items-center gap-2 p-2.5 rounded-xl font-bold transition-all text-left cursor-pointer ${
                        activeTab === 'nilai'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                      }`}
                    >
                      <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Rekap Nilai</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectTabFromSidebar('tabungan')}
                      className={`flex items-center gap-2 p-2.5 rounded-xl font-bold transition-all text-left cursor-pointer ${
                        activeTab === 'tabungan'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/70'
                      }`}
                    >
                      <Wallet className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Tabungan Siswa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectTabFromSidebar('statistik')}
                      className={`flex items-center gap-2 p-2.5 rounded-xl font-bold transition-all text-left cursor-pointer ${
                        activeTab === 'statistik'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                      }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Statistik & Resume</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectTabFromSidebar('impor')}
                      className={`flex items-center gap-2 p-2.5 rounded-xl font-bold transition-all text-left cursor-pointer ${
                        activeTab === 'impor'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                      }`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Data Siswa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectTabFromSidebar('peta')}
                      className={`flex items-center gap-2 p-2.5 rounded-xl font-bold transition-all text-left cursor-pointer ${
                        activeTab === 'peta'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-emerald-50/60 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Peta & Zonasi</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectTabFromSidebar('laporan-ortu')}
                      className={`flex items-center gap-2 p-2.5 rounded-xl font-bold transition-all text-left cursor-pointer ${
                        activeTab === 'laporan-ortu'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-emerald-50/60 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Laporan Ortu WA</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectTabFromSidebar('generator-modul')}
                      className={`flex items-center gap-2 p-2.5 rounded-xl font-bold transition-all text-left cursor-pointer col-span-2 ${
                        activeTab === 'generator-modul'
                          ? 'bg-gradient-to-r from-indigo-600 to-emerald-600 text-white shadow-xs'
                          : 'bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900 border border-indigo-200/70'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">Generator Modul & LKPD</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectTabFromSidebar('kisi-kartu-soal')}
                      className={`flex items-center gap-2 p-2.5 rounded-xl font-bold transition-all text-left cursor-pointer col-span-2 ${
                        activeTab === 'kisi-kartu-soal'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-amber-100/80 hover:bg-amber-200 text-amber-950 border border-amber-300/80'
                      }`}
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">Kisi-Kisi & Kartu Soal</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Drawer Footer with Logout Button */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 mt-auto">
                <button
                  id="btn-logout"
                  type="button"
                  onClick={() => {
                    setIsSidebarOpen(false);
                    onLogout();
                  }}
                  title="Keluar / Ganti Akun Google"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/90 rounded-xl transition-all cursor-pointer shadow-2xs"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar / Ganti Akun Google</span>
                </button>
              </div>
            </aside>
          </div>
        </div>
      )}
    </>
  );
};
