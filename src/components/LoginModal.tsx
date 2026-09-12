import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  School,
  BookOpen,
  GraduationCap,
  Plus,
  X,
  Layers,
  Edit3,
  Check,
  ShieldCheck,
  MessageCircle,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { TeacherProfile, ClassRoom } from '../types';
import {
  getRegisteredEmails,
  addRegisteredEmail,
  removeRegisteredEmail,
  DEFAULT_ADMIN_WHATSAPP,
  DEFAULT_ADMIN_WHATSAPP_LINK,
} from '../utils/whitelist';

interface LoginModalProps {
  isOpen: boolean;
  teacher: TeacherProfile;
  classes: ClassRoom[];
  onSave: (teacher: TeacherProfile, newClasses?: ClassRoom[]) => void;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  teacher,
  classes,
  onSave,
  onClose,
}) => {
  const [namaGuru, setNamaGuru] = useState(teacher.namaGuru);
  const [nip, setNip] = useState(teacher.nip);
  const [namaSekolah, setNamaSekolah] = useState(teacher.namaSekolah);
  const [mapel, setMapel] = useState(teacher.mataPelajaranUtama);
  const [tahunAjaran, setTahunAjaran] = useState(teacher.tahunAjaran);
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>(teacher.semester);

  // Initial class input in login modal
  const [newClassName, setNewClassName] = useState('');
  const [newClassMapel, setNewClassMapel] = useState('');
  const [newClassKkm, setNewClassKkm] = useState(75);
  const [localClasses, setLocalClasses] = useState<ClassRoom[]>(classes);

  // Editing existing class inline in modal
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editClassName, setEditClassName] = useState('');
  const [editClassMapel, setEditClassMapel] = useState('');
  const [editClassKkm, setEditClassKkm] = useState(75);

  // Whitelist of registered Google emails
  const [whitelistedEmails, setWhitelistedEmails] = useState<string[]>([]);
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [emailStatusMsg, setEmailStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    setLocalClasses(classes);
  }, [classes, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setWhitelistedEmails(getRegisteredEmails());
    }
  }, [isOpen]);

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherEmail.trim() || !newTeacherEmail.includes('@')) {
      setEmailStatusMsg('Masukkan format email Google yang valid.');
      return;
    }
    const updated = addRegisteredEmail(newTeacherEmail.trim());
    setWhitelistedEmails(updated);
    setEmailStatusMsg(`Email ${newTeacherEmail.trim()} berhasil didaftarkan ke sistem.`);
    setNewTeacherEmail('');
    setTimeout(() => setEmailStatusMsg(null), 3000);
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    if (emailToRemove === 'hendra.alkindi@gmail.com') {
      alert('Email admin utama (hendra.alkindi@gmail.com) tidak dapat dihapus.');
      return;
    }
    const updated = removeRegisteredEmail(emailToRemove);
    setWhitelistedEmails(updated);
  };

  if (!isOpen) return null;

  const handleStartEditClass = (cls: ClassRoom) => {
    setEditingClassId(cls.id);
    setEditClassName(cls.namaKelas);
    setEditClassMapel(cls.mataPelajaran);
    setEditClassKkm(cls.kkm || 75);
  };

  const handleSaveEditClass = (id: string) => {
    if (!editClassName.trim()) return;
    setLocalClasses(
      localClasses.map((c) =>
        c.id === id
          ? {
              ...c,
              namaKelas: editClassName.trim(),
              mataPelajaran: editClassMapel.trim() || 'Umum',
              kkm: Number(editClassKkm) || 75,
            }
          : c
      )
    );
    setEditingClassId(null);
  };

  const handleCancelEditClass = () => {
    setEditingClassId(null);
  };

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    const newClass: ClassRoom = {
      id: 'class-' + Date.now(),
      namaKelas: newClassName.trim(),
      mataPelajaran: newClassMapel.trim() || mapel || 'Umum',
      kkm: Number(newClassKkm) || 75,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setLocalClasses([...localClasses, newClass]);
    setNewClassName('');
    setNewClassMapel('');
  };

  const handleRemoveClass = (id: string) => {
    if (localClasses.length <= 1) {
      alert('Guru harus memiliki setidaknya satu kelas.');
      return;
    }
    setLocalClasses(localClasses.filter((c) => c.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaGuru.trim()) {
      alert('Silakan masukkan nama guru.');
      return;
    }

    const updatedTeacher: TeacherProfile = {
      ...teacher,
      namaGuru: namaGuru.trim(),
      nip: nip.trim(),
      namaSekolah: namaSekolah.trim() || 'Sekolah',
      mataPelajaranUtama: mapel.trim() || 'Mata Pelajaran',
      tahunAjaran,
      semester,
      isLoggedIn: true,
    };

    onSave(updatedTeacher, localClasses);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Profil Guru & Manajemen Kelas</h2>
              <p className="text-xs text-indigo-200 mt-0.5">
                Konfigurasi identitas pendidik, mata pelajaran yang diampu, dan daftar kelas Anda
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Section 1: Identitas Guru & Sekolah */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <School className="w-4 h-4 text-indigo-600" />
              Identitas Guru & Lembaga
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Guru Lengkap & Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={namaGuru}
                  onChange={(e) => setNamaGuru(e.target.value)}
                  placeholder="Contoh: Drs. Hendra Al Kindi, M.Pd"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                  placeholder="Contoh: 19850714 201001 1 012"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Sekolah / Madrasah
                </label>
                <input
                  type="text"
                  value={namaSekolah}
                  onChange={(e) => setNamaSekolah(e.target.value)}
                  placeholder="Contoh: SMK Negeri 1 Teladan"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mata Pelajaran Utama Yang Diampu
                </label>
                <input
                  type="text"
                  value={mapel}
                  onChange={(e) => setMapel(e.target.value)}
                  placeholder="Contoh: Pemrograman Web / Informatika"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                  placeholder="2025/2026"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Semester
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value as 'Ganjil' | 'Genap')}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  <option value="Ganjil">Semester Ganjil</option>
                  <option value="Genap">Semester Genap</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Manajemen Kelas Guru (Satu guru bisa punya banyak kelas) */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                Daftar Kelas Yang Diampu ({localClasses.length} Kelas)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Anda dapat mengajar di banyak kelas sekaligus dengan mata pelajaran dan KKM masing-masing.
            </p>

            {/* List of existing classes */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 mb-3">
              {localClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  {editingClassId === cls.id ? (
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-indigo-700 flex items-center justify-between">
                        <span>Edit Kelas & Mapel</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleSaveEditClass(cls.id)}
                            className="text-emerald-700 hover:text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            <span>Simpan</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEditClass}
                            className="text-slate-600 hover:text-slate-800 bg-slate-200 hover:bg-slate-300 px-2 py-0.5 rounded cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                        <input
                          type="text"
                          value={editClassName}
                          onChange={(e) => setEditClassName(e.target.value)}
                          placeholder="Nama Kelas"
                          className="px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <input
                          type="text"
                          value={editClassMapel}
                          onChange={(e) => setEditClassMapel(e.target.value)}
                          placeholder="Mata Pelajaran"
                          className="px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-500 shrink-0">KKM:</span>
                          <input
                            type="number"
                            value={editClassKkm}
                            onChange={(e) => setEditClassKkm(Number(e.target.value))}
                            className="px-2 py-1 bg-white border border-slate-300 rounded text-xs w-16 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                          {cls.namaKelas.charAt(0)}
                        </div>
                        <div className="truncate">
                          <span className="font-semibold text-slate-900">{cls.namaKelas}</span>
                          <span className="text-slate-500 ml-2">({cls.mataPelajaran})</span>
                          <span className="text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded ml-2 font-medium">
                            KKM: {cls.kkm}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={() => handleStartEditClass(cls)}
                          className="text-slate-400 hover:text-amber-700 p-1 rounded cursor-pointer"
                          title="Edit Kelas & Mapel"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveClass(cls.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded cursor-pointer"
                          title="Hapus Kelas"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Add Class inside login */}
            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2">
              <span className="text-xs font-semibold text-indigo-900 block">
                + Tambah Kelas Cepat:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Nama Kelas (misal: X RPL 2)"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  placeholder={`Mapel (${mapel || 'Sesuai Guru'})`}
                  value={newClassMapel}
                  onChange={(e) => setNewClassMapel(e.target.value)}
                  className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="KKM (75)"
                    value={newClassKkm}
                    onChange={(e) => setNewClassKkm(Number(e.target.value))}
                    className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white w-20 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddClass}
                    className="grow inline-flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Whitelist Google Accounts (Admin Management) */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Daftar Akun Google Yang Diizinkan (Whitelist)
              </span>
              <a
                href={DEFAULT_ADMIN_WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md"
              >
                <MessageCircle className="w-3 h-3 text-emerald-600" />
                <span>wa.me/{DEFAULT_ADMIN_WHATSAPP}</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-70" />
              </a>
            </div>

            <p className="text-[11px] text-slate-500 mb-3">
              Hanya akun Google yang terdaftar di bawah ini yang dapat masuk ke SIM Presensi SMK Muhammadiyah Bawang.
            </p>

            {emailStatusMsg && (
              <div className="mb-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                {emailStatusMsg}
              </div>
            )}

            {/* List of Allowed Emails */}
            <div className="max-h-36 overflow-y-auto space-y-1.5 mb-3 pr-1">
              {whitelistedEmails.map((wEmail) => {
                const isAdmin = wEmail === 'hendra.alkindi@gmail.com';
                return (
                  <div
                    key={wEmail}
                    className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="font-mono text-slate-800 truncate">{wEmail}</span>
                      {isAdmin && (
                        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded shrink-0">
                          Admin Utama
                        </span>
                      )}
                    </div>
                    {!isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(wEmail)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded cursor-pointer shrink-0 ml-2"
                        title="Hapus dari daftar izin"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Form to Add New Email */}
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Tambah email Google baru (misal: guru@gmail.com)..."
                value={newTeacherEmail}
                onChange={(e) => setNewTeacherEmail(e.target.value)}
                className="grow text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddEmail}
                className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Daftarkan</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              Simpan & Masuk Aplikasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
