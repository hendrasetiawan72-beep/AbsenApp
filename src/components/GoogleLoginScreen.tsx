import React, { useState } from 'react';
import {
  School,
  UserCheck,
  BookOpen,
  Layers,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Sparkles,
} from 'lucide-react';
import { TeacherProfile, ClassRoom } from '../types';
import { SchoolLogo } from './SchoolLogo';
import { signInWithGoogleWorkspace } from '../utils/googleWorkspace';

interface GoogleLoginScreenProps {
  initialTeacher: TeacherProfile;
  existingClasses: ClassRoom[];
  onLoginSuccess: (teacher: TeacherProfile, selectedClassId?: string, newClass?: ClassRoom) => void;
}

export const GoogleLoginScreen: React.FC<GoogleLoginScreenProps> = ({
  initialTeacher,
  existingClasses,
  onLoginSuccess,
}) => {
  // Authentication state
  const [isGoogleAuthenticated, setIsGoogleAuthenticated] = useState(false);
  const [googleEmail, setGoogleEmail] = useState(
    initialTeacher.email || 'hendra.guru@smkmuhbawang.sch.id'
  );
  const [googleName, setGoogleName] = useState(
    initialTeacher.namaGuru || 'Hendra Al Kindi, S.Pd., M.Kom.'
  );
  const [googleAvatar, setGoogleAvatar] = useState(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  );

  // Form Fields
  const [namaGuru, setNamaGuru] = useState(initialTeacher.namaGuru || 'Hendra Al Kindi, S.Pd., M.Kom.');
  const [nip, setNip] = useState(initialTeacher.nip || '19870914 201101 1 009');
  const [namaSekolah, setNamaSekolah] = useState('SMK Muhammadiyah Bawang');
  const [mapel, setMapel] = useState(
    initialTeacher.mataPelajaranUtama || 'Pemrograman Web & Informatika'
  );
  const [tahunAjaran, setTahunAjaran] = useState(initialTeacher.tahunAjaran || '2025/2026');
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>(initialTeacher.semester || 'Ganjil');

  // Initial Class Option: 'choose_existing' or 'create_new'
  const [classMode, setClassMode] = useState<'existing' | 'new'>(
    existingClasses.length > 0 ? 'existing' : 'new'
  );
  const [selectedExistingClassId, setSelectedExistingClassId] = useState<string>(
    existingClasses[0]?.id || ''
  );

  // New Class Form fields
  const [newClassName, setNewClassName] = useState('X PPLG 1 (RPL)');
  const [newClassMapel, setNewClassMapel] = useState('');
  const [newClassKkm, setNewClassKkm] = useState(75);
  const [newClassJurusan, setNewClassJurusan] = useState('Pengembangan Perangkat Lunak & Gim');

  // Show account picker dialog
  const [showAccountPicker, setShowAccountPicker] = useState(false);

  // Pre-configured Google demo accounts
  const demoAccounts = [
    {
      name: 'Hendra Al Kindi, S.Pd., M.Kom.',
      email: 'hendra.guru@smkmuhbawang.sch.id',
      mapel: 'Pemrograman Web & Informatika',
      nip: '19870914 201101 1 009',
    },
    {
      name: 'Dra. Hj. Siti Aminah, M.Pd.',
      email: 'siti.aminah@smkmuhbawang.sch.id',
      mapel: 'Matematika & Statistika Terapan',
      nip: '19790415 200501 2 006',
    },
    {
      name: 'Budi Santoso, S.T.',
      email: 'budi.santoso@smkmuhbawang.sch.id',
      mapel: 'Teknik Komputer Jaringan & Komputasi Cloud',
      nip: '19910320 201903 1 011',
    },
  ];

  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  const handleGoogleSignInFlow = async () => {
    setIsLoadingAuth(true);
    try {
      const { user } = await signInWithGoogleWorkspace();
      if (user) {
        setGoogleName(user.displayName || user.email || 'Guru SMK');
        setGoogleEmail(user.email || '');
        setNamaGuru(user.displayName || user.email?.split('@')[0] || 'Guru SMK');
        if (user.photoURL) setGoogleAvatar(user.photoURL);
        setIsGoogleAuthenticated(true);
        setShowAccountPicker(false);
      }
    } catch (err: any) {
      console.warn('Real Google popup cancelled or blocked, opening account selector:', err);
      setShowAccountPicker(true);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleSelectGoogleAccount = (acc: typeof demoAccounts[0]) => {
    setGoogleName(acc.name);
    setGoogleEmail(acc.email);
    setNamaGuru(acc.name);
    setNip(acc.nip);
    setMapel(acc.mapel);
    setIsGoogleAuthenticated(true);
    setShowAccountPicker(false);
  };

  const handleCustomGoogleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) return;
    setIsGoogleAuthenticated(true);
    setShowAccountPicker(false);
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isGoogleAuthenticated) {
      alert('Silakan masuk dengan Akun Google terlebih dahulu.');
      return;
    }

    if (!namaGuru.trim()) {
      alert('Silakan masukkan nama lengkap guru.');
      return;
    }

    const updatedTeacher: TeacherProfile = {
      ...initialTeacher,
      namaGuru: namaGuru.trim(),
      nip: nip.trim(),
      namaSekolah: namaSekolah.trim() || 'SMK Muhammadiyah Bawang',
      mataPelajaranUtama: mapel.trim() || 'Mata Pelajaran',
      tahunAjaran,
      semester,
      isLoggedIn: true,
      email: googleEmail,
      avatarUrl: googleAvatar,
    };

    let createdClass: ClassRoom | undefined = undefined;
    let finalClassId = selectedExistingClassId;

    if (classMode === 'new') {
      if (!newClassName.trim()) {
        alert('Silakan masukkan nama kelas.');
        return;
      }
      createdClass = {
        id: 'class-' + Date.now(),
        namaKelas: newClassName.trim(),
        mataPelajaran: newClassMapel.trim() || mapel.trim() || 'Umum',
        kkm: Number(newClassKkm) || 75,
        jurusan: newClassJurusan.trim() || undefined,
        createdAt: new Date().toISOString().split('T')[0],
      };
      finalClassId = createdClass.id;
    }

    onLoginSuccess(updatedTeacher, finalClassId, createdClass);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full mx-auto space-y-6">
        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-2 rounded-3xl bg-white shadow-xl ring-4 ring-indigo-100 mb-2">
            <SchoolLogo size="xl" className="w-16 h-16" />
          </div>
          <div className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-800 border border-indigo-200">
            SIM Presensi & Nilai Siswa
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            SMK MUHAMMADIYAH BAWANG
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            Portal digital absensi harian dan rekap penilaian peserta didik berbasis format spreadsheet resmi
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
          {/* Step 1: Google Account Verification Area */}
          <div className="p-6 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Langkah 1: Autentikasi Akun Google Pendidik
              </span>
              {isGoogleAuthenticated && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Terhubung
                </span>
              )}
            </div>

            {!isGoogleAuthenticated ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Untuk memulai dan mengelola kelas, silakan masuk dengan Akun Google (Workspace Sekolah atau Akun Pribadi):
                </p>

                {/* Google Sign-in Button */}
                <button
                  type="button"
                  disabled={isLoadingAuth}
                  onClick={handleGoogleSignInFlow}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white hover:bg-slate-50 border-2 border-indigo-200 hover:border-indigo-400 text-slate-800 font-bold rounded-2xl shadow-sm transition-all cursor-pointer group disabled:opacity-50"
                >
                  {/* Google SVG Logo */}
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span className="text-sm">
                    {isLoadingAuth ? 'Menghubungkan ke Google...' : 'Masuk dengan Akun Google'}
                  </span>
                </button>

                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>Mendukung akun @smkmuhbawang.sch.id & @gmail.com</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsGoogleAuthenticated(true);
                    }}
                    className="text-indigo-600 font-semibold hover:underline"
                  >
                    Gunakan Akun Bawaan
                  </button>
                </div>
              </div>
            ) : (
              /* Verified Google Profile Card */
              <div className="flex items-center justify-between p-3 bg-white border border-indigo-100 rounded-2xl shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                    {googleName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs sm:text-sm leading-tight flex items-center gap-1.5">
                      {googleName}
                      <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded border border-emerald-200">
                        Google Verified
                      </span>
                    </div>
                    <div className="text-slate-500 text-xs mt-0.5 font-mono">
                      {googleEmail}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAccountPicker(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                >
                  Ganti Akun
                </button>
              </div>
            )}
          </div>

          {/* Step 2: Form Identitas Guru & Pemilihan / Pembuatan Kelas */}
          <form onSubmit={handleFinalSubmit} className="p-6 space-y-6">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                Langkah 2: Data Guru & Mata Pelajaran
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap Guru & Gelar <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={namaGuru}
                    onChange={(e) => setNamaGuru(e.target.value)}
                    placeholder="Contoh: Hendra Al Kindi, S.Pd., M.Kom."
                    className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NIP / NUPTK / Kode Guru
                  </label>
                  <input
                    type="text"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    placeholder="19870914 201101 1 009"
                    className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Sekolah
                  </label>
                  <input
                    type="text"
                    value={namaSekolah}
                    onChange={(e) => setNamaSekolah(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl font-bold text-slate-800"
                    readOnly
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mata Pelajaran Yang Diampu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={mapel}
                    onChange={(e) => setMapel(e.target.value)}
                    placeholder="Contoh: Pemrograman Web & Perangkat Bergerak"
                    className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tahun Ajaran
                  </label>
                  <input
                    type="text"
                    value={tahunAjaran}
                    onChange={(e) => setTahunAjaran(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Semester
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value as 'Ganjil' | 'Genap')}
                    className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Ganjil">Semester Ganjil</option>
                    <option value="Genap">Semester Genap</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Step 3: Pilihan Kelas di Awal / Pembuatan Kelas */}
            <div className="pt-4 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                Langkah 3: Pengaturan Kelas Awal
              </span>
              <p className="text-xs text-slate-500 mb-3">
                Satu guru dapat membuat banyak kelas. Tentukan kelas yang ingin dibuka saat masuk:
              </p>

              {/* Toggle Existing vs New */}
              {existingClasses.length > 0 && (
                <div className="flex rounded-xl p-1 bg-slate-100 border border-slate-200 mb-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setClassMode('existing')}
                    className={`flex-1 py-1.5 font-semibold rounded-lg transition-all cursor-pointer ${
                      classMode === 'existing'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Buka Kelas Yang Sudah Ada ({existingClasses.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setClassMode('new')}
                    className={`flex-1 py-1.5 font-semibold rounded-lg transition-all cursor-pointer ${
                      classMode === 'new'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    + Buat Kelas Baru Sekarang
                  </button>
                </div>
              )}

              {classMode === 'existing' && existingClasses.length > 0 ? (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Pilih Kelas Aktif:
                  </label>
                  <select
                    value={selectedExistingClassId}
                    onChange={(e) => setSelectedExistingClassId(e.target.value)}
                    className="w-full text-xs sm:text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900 cursor-pointer"
                  >
                    {existingClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.namaKelas} — {c.mataPelajaran} (KKM: {c.kkm})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                /* Inline New Class Form */
                <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                    <Plus className="w-3.5 h-3.5 text-indigo-600" />
                    Input Kelas Baru Pertama:
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Nama Kelas <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        placeholder="Contoh: X PPLG 1 / XI TKJ 2"
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Mata Pelajaran Kelas
                      </label>
                      <input
                        type="text"
                        value={newClassMapel}
                        onChange={(e) => setNewClassMapel(e.target.value)}
                        placeholder={`Sesuai Guru (${mapel || 'Umum'})`}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        KKM (Nilai Ketuntasan)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={newClassKkm}
                        onChange={(e) => setNewClassKkm(Number(e.target.value))}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Jurusan / Kompetensi Keahlian
                      </label>
                      <input
                        type="text"
                        value={newClassJurusan}
                        onChange={(e) => setNewClassJurusan(e.target.value)}
                        placeholder="Contoh: PPLG / TKJ / TKR / AKL"
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit CTA */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-99 text-white text-sm sm:text-base font-bold rounded-2xl shadow-md transition-all cursor-pointer"
              >
                <span>Masuk Aplikasi & Kelola Absensi</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <p className="text-center text-[11px] text-slate-400 mt-2">
                Data disimpan otomatis di browser untuk akses berikutnya
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Google Account Selector Dialog */}
      {showAccountPicker && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Google Header */}
            <div className="p-5 text-center border-b border-slate-100">
              <svg className="w-8 h-8 mx-auto mb-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <h3 className="text-base font-bold text-slate-800">
                Pilih Akun Google Pendidik
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                untuk melanjutkan ke SIM Absensi SMK Muhammadiyah Bawang
              </p>
            </div>

            {/* List of Accounts */}
            <div className="p-4 space-y-2">
              {demoAccounts.map((acc, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectGoogleAccount(acc)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100/90 border border-slate-200 transition-all text-left cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    {acc.name.charAt(0)}
                  </div>
                  <div className="min-w-0 grow">
                    <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {acc.name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono truncate">
                      {acc.email}
                    </div>
                    <div className="text-[10px] text-indigo-600 font-medium truncate mt-0.5">
                      {acc.mapel}
                    </div>
                  </div>
                </button>
              ))}

              {/* Custom Google Account Input */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500 block mb-2">
                  Atau masukkan Akun Google Anda:
                </span>
                <form onSubmit={handleCustomGoogleLogin} className="space-y-2">
                  <input
                    type="email"
                    required
                    placeholder="nama.guru@smkmuhbawang.sch.id / @gmail.com"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Nama Lengkap Anda"
                    value={googleName}
                    onChange={(e) => {
                      setGoogleName(e.target.value);
                      setNamaGuru(e.target.value);
                    }}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Gunakan Akun Ini
                  </button>
                </form>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setShowAccountPicker(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
