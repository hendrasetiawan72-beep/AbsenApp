import React from 'react';
import { SchoolIdentity, SheetTab } from '../../types/kisiKartuSoal';
import { ArrowLeft, Save, RotateCcw } from 'lucide-react';
import { DEFAULT_SCHOOL_IDENTITY } from '../../data/kisiKartuSoalDefaultData';

interface IdentitasSheetViewProps {
  identitas: SchoolIdentity;
  onChangeIdentitas: (updated: SchoolIdentity) => void;
  onNavigateTab: (tab: SheetTab) => void;
  onShowToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export const IdentitasSheetView: React.FC<IdentitasSheetViewProps> = ({
  identitas,
  onChangeIdentitas,
  onNavigateTab,
  onShowToast,
}) => {
  const handleFieldChange = (field: keyof SchoolIdentity, value: string | number) => {
    onChangeIdentitas({
      ...identitas,
      [field]: value,
    });
  };

  const handleReset = () => {
    if (confirm('Kembalikan data identitas sekolah/guru ke contoh bawaan?')) {
      onChangeIdentitas(DEFAULT_SCHOOL_IDENTITY);
      onShowToast('Data identitas berhasil direset ke format contoh', 'info');
    }
  };

  const fields: { key: keyof SchoolIdentity; label: string; type?: string }[] = [
    { key: 'namaSekolah', label: 'Nama Sekolah' },
    { key: 'kepalaSekolah', label: 'Kepala Sekolah' },
    { key: 'nbmKepalaSekolah', label: 'NBM Kepala Sekolah' },
    { key: 'mataPelajaran', label: 'Mata Pelajaran' },
    { key: 'kurikulum', label: 'Kurikulum' },
    { key: 'kelasSemester', label: 'Kelas / Semester' },
    { key: 'kelasKompetensi', label: 'Kelas / Komptensi' },
    { key: 'bentukTes', label: 'Bentuk Tes' },
    { key: 'jumlahSoal', label: 'Jumlah Soal', type: 'number' },
    { key: 'alokasiWaktu', label: 'Alokasi Waktu' },
    { key: 'tahunAjaran', label: 'Tahun Ajaran' },
    { key: 'penyusun', label: 'Penyusun' },
    { key: 'nipPenyusun', label: 'NIP Penyusun' },
    { key: 'bukuSumber', label: 'Buku Sumber' },
    { key: 'tanggalPenyusunan', label: 'Tanggal Penyusunan' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button
          id="btn-back-menu-identitas"
          onClick={() => onNavigateTab('menu')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO MAIN MENU</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg border border-slate-300 transition-colors cursor-pointer"
            title="Reset ke Contoh Bawaan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Contoh</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border-2 border-sky-400 rounded-xl overflow-hidden shadow-sm">
        {/* Blue Header as in Excel */}
        <div className="bg-sky-600 text-white px-4 py-3 text-center border-b-2 border-sky-700">
          <h2 className="text-base sm:text-lg font-black tracking-wider uppercase drop-shadow-2xs">
            INPUT DATA SEKOLAH / GURU
          </h2>
        </div>

        {/* Form / Table */}
        <div className="divide-y divide-slate-200 text-xs sm:text-sm">
          {fields.map((f, idx) => (
            <div
              key={f.key}
              className={`flex flex-col sm:flex-row sm:items-center ${
                idx % 2 === 0 ? 'bg-white' : 'bg-sky-50/30'
              } hover:bg-sky-50/60 transition-colors`}
            >
              <div className="w-full sm:w-1/3 px-4 py-2.5 font-bold text-slate-800 flex items-center justify-between sm:border-r border-slate-200">
                <span>{f.label}</span>
                <span className="text-slate-400 sm:hidden">:</span>
              </div>
              <div className="w-full sm:w-2/3 px-3 py-1.5">
                <input
                  id={`input-identitas-${f.key}`}
                  type={f.type || 'text'}
                  value={identitas[f.key] as string | number}
                  onChange={(e) =>
                    handleFieldChange(
                      f.key,
                      f.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value
                    )
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none font-semibold text-slate-900 bg-white"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
