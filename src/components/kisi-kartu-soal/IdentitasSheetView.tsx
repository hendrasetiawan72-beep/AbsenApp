import React, { useState } from 'react';
import { SchoolIdentity, SheetTab, OPSI_JENIS_TES } from '../../types/kisiKartuSoal';
import {
  ArrowLeft,
  Save,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  FileSpreadsheet,
  Award,
  Sparkles,
} from 'lucide-react';
import { DEFAULT_SCHOOL_IDENTITY } from '../../data/kisiKartuSoalDefaultData';

interface IdentitasSheetViewProps {
  identitas: SchoolIdentity;
  onChangeIdentitas: (updated: SchoolIdentity) => void;
  onNavigateTab: (tab: SheetTab) => void;
  onShowToast: (msg: string, type: 'success' | 'info' | 'error') => void;
  onSaveIdentitas?: () => void;
}

export const IdentitasSheetView: React.FC<IdentitasSheetViewProps> = ({
  identitas,
  onChangeIdentitas,
  onNavigateTab,
  onShowToast,
  onSaveIdentitas,
}) => {
  const [isCustomJenisTes, setIsCustomJenisTes] = useState(() => {
    if (!identitas.jenisTes) return false;
    return !OPSI_JENIS_TES.some((opt) => opt.value === identitas.jenisTes);
  });
  const [savedRecently, setSavedRecently] = useState(false);

  const handleFieldChange = (field: keyof SchoolIdentity, value: string | number) => {
    onChangeIdentitas({
      ...identitas,
      [field]: value,
    });
  };

  const handleSave = () => {
    if (onSaveIdentitas) {
      onSaveIdentitas();
    }
    setSavedRecently(true);
    onShowToast('Data Identitas Guru & Sekolah berhasil disimpan!', 'success');
    setTimeout(() => {
      setSavedRecently(false);
    }, 3000);
  };

  const handleReset = () => {
    if (confirm('Kembalikan data identitas sekolah/guru ke contoh bawaan?')) {
      onChangeIdentitas(DEFAULT_SCHOOL_IDENTITY);
      setIsCustomJenisTes(false);
      onShowToast('Data identitas berhasil direset ke format contoh', 'info');
    }
  };

  const handleSelectJenisTes = (value: string) => {
    if (value === '__custom__') {
      setIsCustomJenisTes(true);
      return;
    }
    setIsCustomJenisTes(false);
    handleFieldChange('jenisTes', value);
  };

  // Quick preset shortcuts for Penilaian Tengah Semester & Akhir Semester
  const quickTestPills = [
    { label: 'PTS', title: 'Penilaian Tengah Semester (PTS)', val: 'Penilaian Tengah Semester (PTS)', color: 'bg-sky-100 text-sky-800 border-sky-300' },
    { label: 'PSTS', title: 'Penilaian Tengah Semester (PSTS)', val: 'Penilaian Tengah Semester (PSTS)', color: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
    { label: 'STS', title: 'Sumatif Tengah Semester (STS)', val: 'Sumatif Tengah Semester (STS)', color: 'bg-teal-100 text-teal-800 border-teal-300' },
    { label: 'PAS', title: 'Penilaian Akhir Semester (PAS)', val: 'Penilaian Akhir Semester (PAS)', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
    { label: 'PSAS', title: 'Penilaian Sumatif Akhir Semester (PSAS)', val: 'Penilaian Sumatif Akhir Semester (PSAS)', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    { label: 'SAS', title: 'Sumatif Akhir Semester (SAS)', val: 'Sumatif Akhir Semester (SAS)', color: 'bg-purple-100 text-purple-800 border-purple-300' },
    { label: 'PAT', title: 'Penilaian Akhir Tahun (PAT)', val: 'Penilaian Akhir Tahun (PAT)', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Top Action Bar */}
      <div className="no-print flex items-center justify-between gap-3 flex-wrap bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
        <button
          id="btn-back-menu-identitas"
          onClick={() => onNavigateTab('menu')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Menu</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {savedRecently && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Tersimpan
            </span>
          )}

          <button
            id="btn-save-identitas-top"
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all cursor-pointer"
            title="Simpan perubahan data identitas"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Identitas</span>
          </button>

          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors cursor-pointer"
            title="Kembalikan data ke contoh bawaan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Contoh</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border-2 border-sky-400 rounded-2xl overflow-hidden shadow-sm">
        {/* Header as in Excel */}
        <div className="bg-gradient-to-r from-sky-700 via-sky-600 to-indigo-700 text-white px-4 py-3.5 border-b-2 border-sky-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-amber-300" />
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-wider uppercase drop-shadow-2xs">
                INPUT DATA SEKOLAH / IDENTITAS GURU
              </h2>
              <p className="text-[11px] text-sky-100 font-medium">
                Data yang diisi otomatis disinkronkan ke Data Master, Data Soal, Kartu Soal, Kisi-Kisi, dan Lampiran.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[10px] font-black bg-white/20 text-white border border-white/30">
            Kumer Form
          </span>
        </div>

        {/* Form / Table */}
        <div className="divide-y divide-slate-200 text-xs sm:text-sm">
          {/* 1. Nama Sekolah */}
          <div className="flex flex-col sm:flex-row sm:items-center bg-white hover:bg-sky-50/50 transition-colors">
            <div className="w-full sm:w-1/3 px-4 py-2.5 font-bold text-slate-800 flex items-center justify-between sm:border-r border-slate-200">
              <span>Nama Sekolah</span>
              <span className="text-slate-400 sm:hidden">:</span>
            </div>
            <div className="w-full sm:w-2/3 px-3 py-1.5">
              <input
                id="input-identitas-namaSekolah"
                type="text"
                value={identitas.namaSekolah || ''}
                onChange={(e) => handleFieldChange('namaSekolah', e.target.value)}
                placeholder="SMK Muhammadiyah Bawang"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none font-semibold text-slate-900 bg-white"
              />
            </div>
          </div>

          {/* 2. Alamat Sekolah */}
          <div className="flex flex-col sm:flex-row sm:items-center bg-sky-50/20 hover:bg-sky-50/50 transition-colors">
            <div className="w-full sm:w-1/3 px-4 py-2.5 font-bold text-slate-800 flex items-center justify-between sm:border-r border-slate-200">
              <span>Alamat Sekolah</span>
              <span className="text-slate-400 sm:hidden">:</span>
            </div>
            <div className="w-full sm:w-2/3 px-3 py-1.5">
              <input
                id="input-identitas-alamatSekolah"
                type="text"
                value={identitas.alamatSekolah || ''}
                onChange={(e) => handleFieldChange('alamatSekolah', e.target.value)}
                placeholder="Jalan Sukorejo - Bawang km 01"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none font-semibold text-slate-900 bg-white"
              />
            </div>
          </div>

          {/* 3. Kepala Sekolah */}
          <div className="flex flex-col sm:flex-row sm:items-center bg-white hover:bg-sky-50/50 transition-colors">
            <div className="w-full sm:w-1/3 px-4 py-2.5 font-bold text-slate-800 flex items-center justify-between sm:border-r border-slate-200">
              <span>Kepala Sekolah</span>
              <span className="text-slate-400 sm:hidden">:</span>
            </div>
            <div className="w-full sm:w-2/3 px-3 py-1.5">
              <input
                id="input-identitas-kepalaSekolah"
                type="text"
                value={identitas.kepalaSekolah || ''}
                onChange={(e) => handleFieldChange('kepalaSekolah', e.target.value)}
                placeholder="Nama Kepala Sekolah beserta gelar"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none font-semibold text-slate-900 bg-white"
              />
            </div>
          </div>

          {/* 4. NBM Kepala Sekolah */}
          <div className="flex flex-col sm:flex-row sm:items-center bg-sky-50/20 hover:bg-sky-50/50 transition-colors">
            <div className="w-full sm:w-1/3 px-4 py-2.5 font-bold text-slate-800 flex items-center justify-between sm:border-r border-slate-200">
              <span>NBM Kepala Sekolah</span>
              <span className="text-slate-400 sm:hidden">:</span>
            </div>
            <div className="w-full sm:w-2/3 px-3 py-1.5">
              <input
                id="input-identitas-nbmKepalaSekolah"
                type="text"
                value={identitas.nbmKepalaSekolah || ''}
                onChange={(e) => handleFieldChange('nbmKepalaSekolah', e.target.value)}
                placeholder="Contoh: 1069421"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none font-semibold text-slate-900 bg-white font-mono text-xs"
              />
            </div>
          </div>

          {/* 5. Mata Pelajaran */}
          <div className="flex flex-col sm:flex-row sm:items-center bg-white hover:bg-sky-50/50 transition-colors">
            <div className="w-full sm:w-1/3 px-4 py-2.5 font-bold text-slate-800 flex items-center justify-between sm:border-r border-slate-200">
              <span>Mata Pelajaran</span>
              <span className="text-slate-400 sm:hidden">:</span>
            </div>
            <div className="w-full sm:w-2/3 px-3 py-1.5">
              <input
                id="input-identitas-mataPelajaran"
                type="text"
                value={identitas.mataPelajaran || ''}
                onChange={(e) => handleFieldChange('mataPelajaran', e.target.value)}
                placeholder="Bahasa Inggris / Konsentrasi Keahlian..."
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none font-semibold text-slate-900 bg-white"
              />
            </div>
          </div>

          {/* 6. Kurikulum */}
          <div className="flex flex-col sm:flex-row sm:items-center bg-sky-50/20 hover:bg-sky-50/50 transition-colors">
            <div className="w-full sm:w-1/3 px-4 py-2.5 font-bold text-slate-800 flex items-center justify-between sm:border-r border-slate-200">
              <span>Kurikulum</span>
              <span className="text-slate-400 sm:hidden">:</span>
            </div>
            <div className="w-full sm:w-2/3 px-3 py-1.5 flex items-center gap-2">
              <select
                id="input-identitas-kurikulum"
                value={identitas.kurikulum || 'Merdeka Belajar'}
                onChange={(e) => handleFieldChange('kurikulum', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none font-semibold text-slate-900 bg-white"
              >
                <option value="Merdeka Belajar">Merdeka Belajar</option>
                <option value="Kurikulum Merdeka (SMK PK)">Kurikulum Merdeka (SMK PK)</option>
                <option value="Kurikulum Merdeka">Kurikulum Merdeka</option>
                <option value="Kurikulum 2013 Revisi">Kurikulum 2013 Revisi</option>
              </select>
            </div>
          </div>

          {/* 7. Kelas / Semester */}
          <div className="flex flex-col sm:flex-row sm:items-center bg-white hover:bg-sky-50/50 transition-colors">
            <div className="w-full sm:w-1/3 px-4 py-2.5 font-bold text-slate-800 flex items-center justify-between sm:border-r border-slate-200">
              <span>Kelas / Semester</span>
              <span className="text-slate-400 sm:hidden">:</span>
            </div>
            <div className="w-full sm:w-2/3 px-3 py-1.5 flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                id="input-identitas-kelasSemester"
                type="text"
                list="preset-kelas-semester"
                value={identitas.kelasSemester || ''}
                onChange={(e) => handleFieldChange('kelasSemester', e.target.value)}
                placeholder="XI/Gasal atau X/Genap"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none font-semibold text-slate-900 bg-white"
              />
              <datalist id="preset-kelas-semester">
                <option value="X/Gasal" />
                <option value="X/Genap" />
                <option value="XI/Gasal" />
                <option value="XI/Genap" />
                <option value="XII/Gasal" />
                <option value="XII/Genap" />
              </datalist>
            </div>
          </div>

          {/* 8. Kelas / Kompetensi */}
          <div className="flex flex-col sm:flex-row sm:items-center bg-sky-50/20 hover:bg-sky-50/50 transition-colors">
            <div className="w-full sm:w-1/3 px-4 py-2.5 font-bold text-slate-800 flex items-center justify-between sm:border-r border-slate-200">
              <span>Kelas / Kompetensi</span>
              <span className="text-slate-400 sm:hidden">:</span>
            </div>
            <div className="w-full sm:w-2/3 px-3 py-1.5">
              <input
                id="input-identitas-kelasKompetensi"
                type="text"
                value={identitas.kelasKompetensi || ''}
                onChange={(e) => handleFieldChange('kelasKompetensi', e.target.value)}
                placeholder="XI/ Semua Kompetensi atau XI TKR / TBSM / TKJ / AKL / DKV"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none font-semibold text-slate-900 bg-white"
              />
            </div>
          </div>

          {/* 9. Bentuk Tes */}
          <div className="flex flex-col sm:flex-row sm:items-center bg-white hover:bg-sky-50/50 transition-colors">
            <div className="w-full sm:w-1/3 px-4 py-2.5 font-bold text-slate-800 flex items-center justify-between sm:border-r border-slate-200">
              <span>Bentuk Tes</span>
              <span className="text-slate-400 sm:hidden">:</span>
            </div>
            <div className="w-full sm:w-2/3 px-3 py-1.5">
              <select
                id="input-identitas-bentukTes"
                value={identitas.bentukTes || 'Pilihan Ganda'}
                onChange={(e) => handleFieldChange('bentukTes', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none font-semibold text-slate-900 bg-white"
              >
                <option value="Pilihan Ganda">Pilihan Ganda</option>
                <option value="Uraian / Esai">Uraian / Esai</option>
                <option value="Pilihan Ganda Kompleks">Pilihan Ganda Kompleks</option>
                <option value="Menjodohkan">Menjodohkan</option>
                <option value="Campuran (Pilihan Ganda & Uraian)">Campuran (Pilihan Ganda & Uraian)</option>
              </select>
            </div>
          </div>

          {/* 10. JENIS TES / ASESMEN (Pilihan Penilaian Tengah & Akhir Semester Lengkap) */}
          <div className="flex flex-col bg-amber-50/30 border-y-2 border-amber-300/80 p-3 sm:p-4 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span className="font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wide">
                  Jenis Tes / Asesmen (Pilihan PTS & PAS)
                </span>
              </div>
              <span className="text-[11px] text-amber-800 font-bold">
                Pilih atau ketik untuk penilaian tengah/akhir semester
              </span>
            </div>

            {/* Selector Dropdown with Optgroups */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
              <div className="sm:col-span-8">
                <select
                  id="select-identitas-jenisTes"
                  value={isCustomJenisTes ? '__custom__' : (identitas.jenisTes || 'Penilaian Tengah Semester (PSTS)')}
                  onChange={(e) => handleSelectJenisTes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border-2 border-amber-400 bg-white font-bold text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer"
                >
                  <optgroup label="— PENILAIAN TENGAH SEMESTER (PTS / STS) —">
                    <option value="Penilaian Tengah Semester (PTS)">Penilaian Tengah Semester (PTS)</option>
                    <option value="Penilaian Tengah Semester (PSTS)">Penilaian Tengah Semester (PSTS)</option>
                    <option value="Sumatif Tengah Semester (STS)">Sumatif Tengah Semester (STS)</option>
                    <option value="Asesmen Sumatif Tengah Semester (ASTS)">Asesmen Sumatif Tengah Semester (ASTS)</option>
                  </optgroup>

                  <optgroup label="— PENILAIAN AKHIR SEMESTER (PAS / SAS) —">
                    <option value="Penilaian Akhir Semester (PAS)">Penilaian Akhir Semester (PAS)</option>
                    <option value="Penilaian Sumatif Akhir Semester (PSAS)">Penilaian Sumatif Akhir Semester (PSAS)</option>
                    <option value="Sumatif Akhir Semester (SAS)">Sumatif Akhir Semester (SAS)</option>
                    <option value="Asesmen Sumatif Akhir Semester (ASAS)">Asesmen Sumatif Akhir Semester (ASAS)</option>
                  </optgroup>

                  <optgroup label="— PENILAIAN AKHIR TAHUN (PAT / SAT) —">
                    <option value="Penilaian Akhir Tahun (PAT)">Penilaian Akhir Tahun (PAT)</option>
                    <option value="Sumatif Akhir Tahun (SAT)">Sumatif Akhir Tahun (SAT)</option>
                    <option value="Asesmen Sumatif Akhir Tahun (ASAT)">Asesmen Sumatif Akhir Tahun (ASAT)</option>
                  </optgroup>

                  <optgroup label="— ASESMEN FORMATIF & UJIAN LAINNYA —">
                    <option value="Penilaian Harian / Formatif (PH)">Penilaian Harian / Formatif (PH)</option>
                    <option value="Asesmen Sumatif Akhir Jenjang (ASAJ)">Asesmen Sumatif Akhir Jenjang (ASAJ)</option>
                    <option value="Ujian Sekolah (US)">Ujian Sekolah (US)</option>
                    <option value="Tes Kemampuan Akademik (TKA)">Tes Kemampuan Akademik (TKA)</option>
                  </optgroup>

                  <optgroup label="— KUSTOM —">
                    <option value="__custom__">Ketik Kustom / Nama Lainnya...</option>
                  </optgroup>
                </select>
              </div>

              {/* Custom Input Field if Custom is active */}
              {isCustomJenisTes && (
                <div className="sm:col-span-4">
                  <input
                    id="input-identitas-jenisTes-custom"
                    type="text"
                    value={identitas.jenisTes || ''}
                    onChange={(e) => handleFieldChange('jenisTes', e.target.value)}
                    placeholder="Ketik nama tes custom..."
                    className="w-full px-3 py-2 rounded-xl border-2 border-amber-500 bg-white font-bold text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}
            </div>

            {/* Quick 1-Click Shortcut Pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] font-bold text-slate-500 mr-1">Pilihan Cepat:</span>
              {quickTestPills.map((p) => {
                const isActive = identitas.jenisTes === p.val;
                return (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => {
                      setIsCustomJenisTes(false);
                      handleFieldChange('jenisTes', p.val);
                    }}
                    title={p.title}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-500 text-white border-amber-600 shadow-2xs scale-105 ring-2 ring-amber-300'
                        : `${p.color} hover:opacity-80 active:scale-95`
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 11. Jumlah Soal */}
          <div className="flex flex-col sm:flex-row sm:items-center bg-white hover:bg-sky-50/50 transition-colors">
            <div className="w-full sm:w-1/3 px-4 py-2.5 font-bold text-slate-800 flex items-center justify-between sm:border-r border-slate-200">
              <span>Jumlah Soal</span>
              <span className="text-slate-400 sm:hidden">:</span>
            </div>
            <div className="w-full sm:w-2/3 px-3 py-1.5">
              <input
                id="input-identitas-jumlahSoal"
                type="number"
                min="1"
                max="100"
                value={identitas.jumlahSoal ?? 50}
                onChange={(e) => handleFieldChange('jumlahSoal', parseInt(e.target.value) || 0)}
                className="w-32 px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none font-bold text-slate-900 bg-white"
              />
            </div>
          </div>

          {/* 12. Alokasi Waktu */}
          <div className="flex flex-col sm:flex-row sm:items-center bg-sky-50/20 hover:bg-sky-50/50 transition-colors">
            <div className="w-full sm:w-1/3 px-4 py-2.5 font-bold text-slate-800 flex items-center justify-between sm:border-r border-slate-200">
              <span>Alokasi Waktu</span>
              <span className="text-slate-400 sm:hidden">:</span>
            </div>
            <div className="w-full sm:w-2/3 px-3 py-1.5">
              <input
                id="input-identitas-alokasiWaktu"
                type="text"
                value={identitas.alokasiWaktu || ''}
                onChange={(e) => handleFieldChange('alokasiWaktu', e.target.value)}
                placeholder="90 Menit / 120 Menit"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none font-semibold text-slate-900 bg-white"
              />
            </div>
          </div>

          {/* 13. Tahun Ajaran */}
          <div className="flex flex-col sm:flex-row sm:items-center bg-white hover:bg-sky-50/50 transition-colors">
            <div className="w-full sm:w-1/3 px-4 py-2.5 font-bold text-slate-800 flex items-center justify-between sm:border-r border-slate-200">
              <span>Tahun Ajaran</span>
              <span className="text-slate-400 sm:hidden">:</span>
            </div>
            <div className="w-full sm:w-2/3 px-3 py-1.5">
              <input
                id="input-identitas-tahunAjaran"
                type="text"
                value={identitas.tahunAjaran || ''}
                onChange={(e) => handleFieldChange('tahunAjaran', e.target.value)}
                placeholder="2025/2026"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none font-semibold text-slate-900 bg-white"
              />
            </div>
          </div>

          {/* 14. Penyusun (Nama Guru) */}
          <div className="flex flex-col sm:flex-row sm:items-center bg-sky-50/20 hover:bg-sky-50/50 transition-colors">
            <div className="w-full sm:w-1/3 px-4 py-2.5 font-bold text-slate-800 flex items-center justify-between sm:border-r border-slate-200">
              <span>Guru Penyusun</span>
              <span className="text-slate-400 sm:hidden">:</span>
            </div>
            <div className="w-full sm:w-2/3 px-3 py-1.5">
              <input
                id="input-identitas-penyusun"
                type="text"
                value={identitas.penyusun || ''}
                onChange={(e) => handleFieldChange('penyusun', e.target.value)}
                placeholder="Hendra Setiawan, S.Pd."
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none font-semibold text-slate-900 bg-white"
              />
            </div>
          </div>

          {/* 15. NBM Penyusun */}
          <div className="flex flex-col sm:flex-row sm:items-center bg-white hover:bg-sky-50/50 transition-colors">
            <div className="w-full sm:w-1/3 px-4 py-2.5 font-bold text-slate-800 flex items-center justify-between sm:border-r border-slate-200">
              <span>NBM Penyusun</span>
              <span className="text-slate-400 sm:hidden">:</span>
            </div>
            <div className="w-full sm:w-2/3 px-3 py-1.5">
              <input
                id="input-identitas-nbmPenyusun"
                type="text"
                value={identitas.nbmPenyusun || ''}
                onChange={(e) => handleFieldChange('nbmPenyusun', e.target.value)}
                placeholder="1102.7909.1069421"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none font-semibold text-slate-900 bg-white font-mono text-xs"
              />
            </div>
          </div>

          {/* 16. Buku Sumber */}
          <div className="flex flex-col sm:flex-row sm:items-center bg-sky-50/20 hover:bg-sky-50/50 transition-colors">
            <div className="w-full sm:w-1/3 px-4 py-2.5 font-bold text-slate-800 flex items-center justify-between sm:border-r border-slate-200">
              <span>Buku Sumber</span>
              <span className="text-slate-400 sm:hidden">:</span>
            </div>
            <div className="w-full sm:w-2/3 px-3 py-1.5">
              <input
                id="input-identitas-bukuSumber"
                type="text"
                value={identitas.bukuSumber || ''}
                onChange={(e) => handleFieldChange('bukuSumber', e.target.value)}
                placeholder="Modul, internet, buku teks..."
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none font-semibold text-slate-900 bg-white"
              />
            </div>
          </div>

          {/* 17. Tanggal Penyusunan */}
          <div className="flex flex-col sm:flex-row sm:items-center bg-white hover:bg-sky-50/50 transition-colors">
            <div className="w-full sm:w-1/3 px-4 py-2.5 font-bold text-slate-800 flex items-center justify-between sm:border-r border-slate-200">
              <span>Tanggal Penyusunan</span>
              <span className="text-slate-400 sm:hidden">:</span>
            </div>
            <div className="w-full sm:w-2/3 px-3 py-1.5">
              <input
                id="input-identitas-tanggalPenyusunan"
                type="text"
                value={identitas.tanggalPenyusunan || ''}
                onChange={(e) => handleFieldChange('tanggalPenyusunan', e.target.value)}
                placeholder="Bawang, 10 Maret 2026"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none font-semibold text-slate-900 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Bottom Save Bar & Next Tab Shortcuts */}
        <div className="bg-slate-50 border-t-2 border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              id="btn-save-identitas-bottom"
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Identitas Guru</span>
            </button>
            {savedRecently && (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Tersimpan!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onNavigateTab('master')}
              className="inline-flex items-center gap-1 px-3 py-2 bg-sky-100 hover:bg-sky-200 text-sky-900 font-bold text-xs rounded-xl border border-sky-300 transition-colors cursor-pointer"
            >
              <span>Ke Data Master</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigateTab('kartu')}
              className="inline-flex items-center gap-1 px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs rounded-xl border border-amber-300 transition-colors cursor-pointer"
            >
              <span>Ke Kartu Soal</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigateTab('kisi')}
              className="inline-flex items-center gap-1 px-3 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-950 font-bold text-xs rounded-xl border border-indigo-300 transition-colors cursor-pointer"
            >
              <span>Ke Kisi-Kisi</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
