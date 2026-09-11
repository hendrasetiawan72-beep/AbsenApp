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
  RefreshCw,
  ChevronDown,
  Trash2,
  LogOut,
  Cloud,
  MapPin,
} from 'lucide-react';
import { ActiveTab, ClassRoom, TeacherProfile } from '../types';
import { SchoolLogo } from './SchoolLogo';

interface NavbarProps {
  teacher: TeacherProfile;
  classes: ClassRoom[];
  activeClassId: string;
  activeTab: ActiveTab;
  isCloudSaving?: boolean;
  onSelectClass: (classId: string) => void;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenClassModal: () => void;
  onOpenLoginModal: () => void;
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
  onSelectClass,
  onSelectTab,
  onOpenClassModal,
  onOpenLoginModal,
  onResetData,
  onDeleteClass,
  onLogout,
}) => {
  const activeClass = classes.find((c) => c.id === activeClassId);

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs no-print backdrop-blur-md bg-white/95">
      {/* Primary Brand & Actions Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 gap-4">
          {/* Brand & School Logo */}
          <div className="flex items-center gap-3 min-w-0">
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
              <p className="text-[11px] text-slate-500 truncate hidden md:block font-medium">
                TA {teacher.tahunAjaran} ({teacher.semester})
              </p>
            </div>
          </div>

          {/* Center: Clean Integrated Class Selector */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="relative inline-flex items-center rounded-xl bg-slate-100/90 hover:bg-slate-200/70 p-1 border border-slate-200 transition-colors">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600 ml-2 shrink-0" />
              <select
                id="navbar-class-select"
                value={activeClassId}
                onChange={(e) => onSelectClass(e.target.value)}
                aria-label="Pilih Kelas"
                className="appearance-none bg-transparent text-slate-900 font-bold text-xs sm:text-sm pl-2 pr-7 py-1 cursor-pointer focus:outline-none max-w-[140px] sm:max-w-[220px] truncate"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.namaKelas} • {cls.mataPelajaran}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 pointer-events-none" />
            </div>

            {/* Class Management Actions */}
            <button
              id="btn-add-class-nav"
              onClick={onOpenClassModal}
              title="Buat Kelas Baru"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/80 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kelas Baru</span>
            </button>

            {activeClass && (
              <button
                id="btn-delete-class-nav"
                onClick={() => onDeleteClass(activeClass.id)}
                title={`Hapus Kelas ${activeClass.namaKelas}`}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Action: Teacher Profile & Fast Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Cloud Sync Status Indicator */}
            <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] font-medium text-slate-600">
              {isCloudSaving ? (
                <>
                  <RefreshCw className="w-3 h-3 text-amber-500 animate-spin" />
                  <span className="text-amber-600 font-semibold">Menyimpan...</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-slate-600 font-medium">Cloud Aktif</span>
                </>
              )}
            </div>

            {/* Profile Button with Name, Email, and Avatar */}
            <button
              id="btn-teacher-profile"
              onClick={onOpenLoginModal}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-white hover:bg-slate-50/80 transition-all text-left cursor-pointer shadow-2xs"
              title="Profil Guru & Pengaturan Akun"
            >
              {teacher.avatarUrl ? (
                <img
                  src={teacher.avatarUrl}
                  alt={teacher.namaGuru || 'Foto Profil'}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover shadow-2xs shrink-0 ring-1 ring-slate-200"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                  {teacher.namaGuru?.charAt(0) || teacher.email?.charAt(0).toUpperCase() || 'G'}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <div className="font-bold text-slate-800 text-xs truncate max-w-[130px] leading-tight">
                  {teacher.namaGuru || 'Guru SMK'}
                </div>
                {teacher.email && (
                  <div className="text-[10px] text-slate-500 truncate max-w-[130px] leading-none mt-0.5">
                    {teacher.email}
                  </div>
                )}
              </div>
            </button>

            {/* Clear, Prominent Logout Button */}
            <button
              id="btn-logout"
              onClick={onLogout}
              title="Keluar / Ganti Akun Google"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100/90 border border-rose-200/70 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>

            <button
              id="btn-reset-demo"
              onClick={onResetData}
              title="Reset ke data contoh"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer hidden sm:block"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Clean Immersive Navigation Tabs */}
      <div className="border-t border-slate-100 bg-slate-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-1.5 overflow-x-auto py-1.5 no-scrollbar" aria-label="Tabs">
            <button
              id="tab-absensi"
              onClick={() => onSelectTab('absensi')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'absensi'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <CalendarCheck2 className="w-4 h-4" />
              <span>Presensi Siswa</span>
            </button>

            <button
              id="tab-nilai"
              onClick={() => onSelectTab('nilai')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'nilai'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Rekap Nilai</span>
            </button>

            <button
              id="tab-statistik"
              onClick={() => onSelectTab('statistik')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'statistik'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Statistik & Resume</span>
            </button>

            <button
              id="tab-impor"
              onClick={() => onSelectTab('impor')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'impor'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Data Siswa</span>
            </button>

            <button
              id="tab-workspace"
              onClick={() => onSelectTab('workspace')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'workspace'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/90 border border-indigo-200/60'
              }`}
            >
              <Cloud className="w-4 h-4" />
              <span>Workspace & Cloud</span>
            </button>

            <button
              id="tab-peta"
              onClick={() => onSelectTab('peta')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'peta'
                  ? 'bg-emerald-700 text-white shadow-xs font-bold'
                  : 'text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100/90 border border-emerald-200/60'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Peta & Zonasi</span>
            </button>

            <button
              id="tab-laporan-ortu"
              onClick={() => onSelectTab('laporan-ortu')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'laporan-ortu'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200/50'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Laporan Ortu (WA)</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
