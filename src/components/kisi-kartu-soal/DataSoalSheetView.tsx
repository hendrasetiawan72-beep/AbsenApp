import React, { useState } from 'react';
import { SoalItem, SheetTab, SchoolIdentity } from '../../types/kisiKartuSoal';
import { ArrowLeft, Plus, Trash2, Search, RotateCcw, Eye } from 'lucide-react';
import { DEFAULT_SOAL_DATA } from '../../data/kisiKartuSoalDefaultData';

interface DataSoalSheetViewProps {
  soalData: SoalItem[];
  onChangeSoalData: (updated: SoalItem[]) => void;
  onNavigateTab: (tab: SheetTab) => void;
  onSelectSoalForCard: (soalNo: number) => void;
  onShowToast: (msg: string, type: 'success' | 'info' | 'error') => void;
  identitas?: SchoolIdentity;
}

export const DataSoalSheetView: React.FC<DataSoalSheetViewProps> = ({
  soalData,
  onChangeSoalData,
  onNavigateTab,
  onSelectSoalForCard,
  onShowToast,
  identitas,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleCellChange = (index: number, field: keyof SoalItem, value: any) => {
    const next = [...soalData];
    next[index] = {
      ...next[index],
      [field]: value,
    };
    onChangeSoalData(next);
  };

  const handleAddSoal = () => {
    const nextNo = soalData.length + 1;
    const newSoal: SoalItem = {
      noSoal: nextNo,
      kunci: 'A',
      rumusanButirSoal: '',
      pilihanA: '',
      pilihanB: '',
      pilihanC: '',
      pilihanD: '',
      jumlahSiswa: 144,
      tingkatKesukaran: 'Sedang',
      digunakanUntuk: identitas?.jenisTes || 'Penilaian Tengah Semester (PSTS)',
      tanggal: identitas?.tanggalPenyusunan || '11 Maret 2026',
      keputusanValidasi: 'Diterima',
    };
    onChangeSoalData([...soalData, newSoal]);
    onShowToast(`Soal baru nomor #${nextNo} berhasil ditambahkan`, 'success');
  };

  const handleDeleteSoal = (index: number) => {
    if (confirm(`Hapus soal nomor ${soalData[index].noSoal}?`)) {
      const next = soalData
        .filter((_, i) => i !== index)
        .map((s, idx) => ({ ...s, noSoal: idx + 1 }));
      onChangeSoalData(next);
      onShowToast('Soal berhasil dihapus', 'info');
    }
  };

  const handleReset = () => {
    if (confirm('Kembalikan Data Soal ke 50 soal contoh bawaan?')) {
      onChangeSoalData(DEFAULT_SOAL_DATA);
      onShowToast('Data Soal berhasil direset ke 50 soal contoh bawaan', 'info');
    }
  };

  const filtered = soalData.filter(
    (s) =>
      s.rumusanButirSoal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.pilihanA.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.pilihanB.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.pilihanC.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.pilihanD.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(s.noSoal).includes(searchQuery)
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          id="btn-back-menu-soal"
          onClick={() => onNavigateTab('menu')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO MAIN MENU</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari rumusan butir soal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white min-w-[220px]"
            />
          </div>

          <button
            onClick={handleAddSoal}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Butir Soal</span>
          </button>

          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg border border-slate-300 transition-colors cursor-pointer"
            title="Reset ke 50 Soal Contoh"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Contoh</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border-2 border-rose-400 rounded-xl overflow-hidden shadow-sm">
        {/* Banner Title as in Excel */}
        <div className="bg-rose-600 text-white px-4 py-2.5 text-center border-b-2 border-rose-700 flex items-center justify-between">
          <div className="w-16 hidden sm:block" />
          <h2 className="text-sm sm:text-base font-black tracking-wider uppercase drop-shadow-2xs">
            DATA SOAL (INPUT BUTIR SOAL & KUNCI JAWABAN)
          </h2>
          <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded">
            {soalData.length} Soal
          </span>
        </div>

        {/* Synchronized Identity Information Bar */}
        {identitas && (
          <div className="bg-rose-50/70 border-b border-rose-200 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-rose-950">Mata Pelajaran:</span>
              <span className="bg-white px-2 py-0.5 rounded font-bold text-slate-900 border border-rose-300">
                {identitas.mataPelajaran}
              </span>
              <span className="font-bold text-rose-950 ml-1">Jenis Tes:</span>
              <span className="bg-rose-600 text-white px-2.5 py-0.5 rounded font-black shadow-2xs">
                {identitas.jenisTes || 'Penilaian Tengah Semester'}
              </span>
              <span className="font-bold text-rose-950 ml-1">Target:</span>
              <span className="bg-white px-2 py-0.5 rounded font-bold text-slate-900 border border-rose-300">
                {soalData.length} / {identitas.jumlahSoal || 50} Soal
              </span>
            </div>
            <div className="text-[11px] text-rose-900 font-semibold">
              Penyusun: <strong className="text-slate-950">{identitas.penyusun}</strong> | Tanggal: <strong className="text-slate-950">{identitas.tanggalPenyusunan}</strong>
            </div>
          </div>
        )}

        {/* Scrollable Spreadsheet Table with exact RED headers */}
        <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-rose-600 text-white font-black sticky top-0 z-10 border-b-2 border-rose-700">
              <tr>
                <th className="p-2.5 border border-rose-500 text-center w-14 shrink-0">No. Soal</th>
                <th className="p-2.5 border border-rose-500 text-center w-16 shrink-0">Kunci</th>
                <th className="p-2.5 border border-rose-500 min-w-[340px]">Rumusan Butir Soal</th>
                <th className="p-2.5 border border-rose-500 min-w-[180px]">Pilihan A</th>
                <th className="p-2.5 border border-rose-500 min-w-[180px]">Pilihan B</th>
                <th className="p-2.5 border border-rose-500 min-w-[180px]">Pilihan C</th>
                <th className="p-2.5 border border-rose-500 min-w-[180px]">Pilihan D</th>
                <th className="p-2.5 border border-rose-500 w-24 text-center">Kartu / Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((item) => {
                const originalIndex = soalData.findIndex((s) => s.noSoal === item.noSoal);
                return (
                  <tr
                    key={item.noSoal}
                    className="hover:bg-rose-50/30 odd:bg-white even:bg-slate-50/60 transition-colors"
                  >
                    {/* No. Soal */}
                    <td className="p-2 border border-slate-200 text-center font-bold text-slate-900 bg-slate-100/60">
                      {item.noSoal}
                    </td>

                    {/* Kunci */}
                    <td className="p-1 border border-slate-200 text-center bg-amber-50/50">
                      <select
                        value={item.kunci || 'A'}
                        onChange={(e) => handleCellChange(originalIndex, 'kunci', e.target.value)}
                        className="w-full p-1 font-black text-center text-amber-900 bg-transparent rounded focus:bg-white focus:outline-none cursor-pointer"
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                        <option value="E">E</option>
                      </select>
                    </td>

                    {/* Rumusan Butir Soal */}
                    <td className="p-1 border border-slate-200">
                      <textarea
                        rows={3}
                        value={item.rumusanButirSoal || ''}
                        onChange={(e) =>
                          handleCellChange(originalIndex, 'rumusanButirSoal', e.target.value)
                        }
                        placeholder="Ketik soal di sini..."
                        className="w-full p-1.5 text-xs bg-transparent focus:bg-white focus:ring-1 focus:ring-rose-500 rounded border border-transparent hover:border-slate-300 resize-y font-medium text-slate-900"
                      />
                    </td>

                    {/* Pilihan A */}
                    <td className="p-1 border border-slate-200">
                      <textarea
                        rows={2}
                        value={item.pilihanA || ''}
                        onChange={(e) => handleCellChange(originalIndex, 'pilihanA', e.target.value)}
                        placeholder="Opsi A..."
                        className="w-full p-1.5 text-xs bg-transparent focus:bg-white focus:ring-1 focus:ring-rose-500 rounded border border-transparent hover:border-slate-300 resize-y"
                      />
                    </td>

                    {/* Pilihan B */}
                    <td className="p-1 border border-slate-200">
                      <textarea
                        rows={2}
                        value={item.pilihanB || ''}
                        onChange={(e) => handleCellChange(originalIndex, 'pilihanB', e.target.value)}
                        placeholder="Opsi B..."
                        className="w-full p-1.5 text-xs bg-transparent focus:bg-white focus:ring-1 focus:ring-rose-500 rounded border border-transparent hover:border-slate-300 resize-y"
                      />
                    </td>

                    {/* Pilihan C */}
                    <td className="p-1 border border-slate-200">
                      <textarea
                        rows={2}
                        value={item.pilihanC || ''}
                        onChange={(e) => handleCellChange(originalIndex, 'pilihanC', e.target.value)}
                        placeholder="Opsi C..."
                        className="w-full p-1.5 text-xs bg-transparent focus:bg-white focus:ring-1 focus:ring-rose-500 rounded border border-transparent hover:border-slate-300 resize-y"
                      />
                    </td>

                    {/* Pilihan D */}
                    <td className="p-1 border border-slate-200">
                      <textarea
                        rows={2}
                        value={item.pilihanD || ''}
                        onChange={(e) => handleCellChange(originalIndex, 'pilihanD', e.target.value)}
                        placeholder="Opsi D..."
                        className="w-full p-1.5 text-xs bg-transparent focus:bg-white focus:ring-1 focus:ring-rose-500 rounded border border-transparent hover:border-slate-300 resize-y"
                      />
                    </td>

                    {/* Quick Preview in Kartu & Delete */}
                    <td className="p-1 border border-slate-200 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            onSelectSoalForCard(item.noSoal);
                            onNavigateTab('kartu');
                          }}
                          className="p-1.5 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded transition-colors cursor-pointer"
                          title={`Lihat Kartu Soal #${item.noSoal}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSoal(originalIndex)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Hapus soal ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="bg-rose-50/60 p-2.5 border-t border-rose-200 flex items-center justify-between text-xs text-slate-600">
          <span>Total Butir Soal: <strong>{soalData.length}</strong></span>
          <span>Menampilkan: <strong>{filtered.length}</strong> soal</span>
        </div>
      </div>
    </div>
  );
};
