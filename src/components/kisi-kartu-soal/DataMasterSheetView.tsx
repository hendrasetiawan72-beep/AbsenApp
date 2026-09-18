import React, { useState } from 'react';
import { MasterSoalItem, SheetTab, SchoolIdentity } from '../../types/kisiKartuSoal';
import { ArrowLeft, Plus, Trash2, Search, RotateCcw, Sparkles } from 'lucide-react';
import { DEFAULT_MASTER_DATA } from '../../data/kisiKartuSoalDefaultData';

interface DataMasterSheetViewProps {
  masterData: MasterSoalItem[];
  onChangeMasterData: (updated: MasterSoalItem[]) => void;
  onNavigateTab: (tab: SheetTab) => void;
  onShowToast: (msg: string, type: 'success' | 'info' | 'error') => void;
  identitas?: SchoolIdentity;
}

export const DataMasterSheetView: React.FC<DataMasterSheetViewProps> = ({
  masterData,
  onChangeMasterData,
  onNavigateTab,
  onShowToast,
  identitas,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleCellChange = (index: number, field: keyof MasterSoalItem, value: string | number) => {
    const next = [...masterData];
    next[index] = {
      ...next[index],
      [field]: value,
    };
    onChangeMasterData(next);
  };

  const handleAddRow = () => {
    const nextNo = masterData.length + 1;
    const last = masterData[masterData.length - 1];
    const newRow: MasterSoalItem = {
      no: nextNo,
      elemen: last ? last.elemen : 'Membaca - Memirsa',
      capaianPembelajaran: last ? last.capaianPembelajaran : '',
      ipk: '',
      materi: last ? last.materi : '',
      indikatorSoal: '',
      bentukTes: 'pilihan ganda',
      elemen2: last ? last.elemen : 'Membaca - Memirsa',
    };
    onChangeMasterData([...masterData, newRow]);
    onShowToast(`Baris baru no #${nextNo} ditambahkan ke Data Master`, 'success');
  };

  const handleDeleteRow = (index: number) => {
    if (confirm(`Hapus baris nomor ${masterData[index].no}?`)) {
      const next = masterData.filter((_, i) => i !== index).map((row, idx) => ({
        ...row,
        no: idx + 1,
      }));
      onChangeMasterData(next);
      onShowToast('Baris berhasil dihapus', 'info');
    }
  };

  const handleReset = () => {
    if (confirm('Kembalikan Data Master ke 50 data contoh bawaan?')) {
      onChangeMasterData(DEFAULT_MASTER_DATA);
      onShowToast('Data Master berhasil direset ke contoh', 'info');
    }
  };

  const filtered = masterData.filter(
    (m) =>
      m.elemen.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.materi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.ipk.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.indikatorSoal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(m.no).includes(searchQuery)
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      {/* Action Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          id="btn-back-menu-master"
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
              placeholder="Cari materi / elemen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
            />
          </div>

          <button
            onClick={handleAddRow}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Baris</span>
          </button>

          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg border border-slate-300 transition-colors cursor-pointer"
            title="Reset ke Contoh"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border-2 border-cyan-400 rounded-xl overflow-hidden shadow-sm">
        {/* Banner Title as in Excel */}
        <div className="bg-cyan-500 text-white px-4 py-2.5 text-center border-b-2 border-cyan-600">
          <h2 className="text-sm sm:text-base font-black tracking-wider uppercase drop-shadow-2xs">
            INPUT DATA UNTUK KARTU SOAL (DATA MASTER)
          </h2>
        </div>

        {/* Synchronized Identity Information Bar */}
        {identitas && (
          <div className="bg-cyan-50/80 border-b border-cyan-200 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-cyan-950">Mata Pelajaran:</span>
              <span className="bg-white px-2 py-0.5 rounded font-bold text-slate-900 border border-cyan-300">
                {identitas.mataPelajaran}
              </span>
              <span className="font-bold text-cyan-950 ml-1">Kelas/Semester:</span>
              <span className="bg-white px-2 py-0.5 rounded font-bold text-slate-900 border border-cyan-300">
                {identitas.kelasSemester}
              </span>
              <span className="font-bold text-cyan-950 ml-1">Bentuk Tes:</span>
              <span className="bg-white px-2 py-0.5 rounded font-bold text-slate-900 border border-cyan-300">
                {identitas.bentukTes}
              </span>
              <span className="font-bold text-cyan-950 ml-1">Kurikulum:</span>
              <span className="bg-white px-2 py-0.5 rounded font-bold text-slate-900 border border-cyan-300">
                {identitas.kurikulum}
              </span>
            </div>
            <div className="text-[11px] text-cyan-900 font-semibold">
              Penyusun: <strong className="text-slate-950">{identitas.penyusun}</strong> (NBM: {identitas.nbmPenyusun || '-'})
            </div>
          </div>
        )}

        {/* Scrollable Spreadsheet Table */}
        <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-cyan-100/90 text-cyan-950 font-black sticky top-0 z-10 border-b-2 border-cyan-300">
              <tr>
                <th className="p-2 border border-cyan-300 text-center w-12 shrink-0">No</th>
                <th className="p-2 border border-cyan-300 min-w-[150px]">Elemen</th>
                <th className="p-2 border border-cyan-300 min-w-[320px]">Capaian Pembelajaran</th>
                <th className="p-2 border border-cyan-300 min-w-[220px]">IPK</th>
                <th className="p-2 border border-cyan-300 min-w-[170px]">Materi</th>
                <th className="p-2 border border-cyan-300 min-w-[220px]">Indikator Soal</th>
                <th className="p-2 border border-cyan-300 min-w-[110px] text-center">Bentuk Tes</th>
                <th className="p-2 border border-cyan-300 w-12 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((item) => {
                const originalIndex = masterData.findIndex((m) => m.no === item.no);
                return (
                  <tr
                    key={item.no}
                    className="hover:bg-cyan-50/40 odd:bg-white even:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-2 border border-slate-200 text-center font-bold text-slate-800 bg-slate-100/60">
                      {item.no}
                    </td>

                    {/* Elemen */}
                    <td className="p-1 border border-slate-200">
                      <input
                        type="text"
                        value={item.elemen || ''}
                        onChange={(e) => handleCellChange(originalIndex, 'elemen', e.target.value)}
                        className="w-full p-1.5 text-xs bg-transparent focus:bg-white focus:ring-1 focus:ring-cyan-500 rounded border border-transparent hover:border-slate-300 font-semibold"
                      />
                    </td>

                    {/* Capaian Pembelajaran */}
                    <td className="p-1 border border-slate-200">
                      <textarea
                        rows={3}
                        value={item.capaianPembelajaran || ''}
                        onChange={(e) =>
                          handleCellChange(originalIndex, 'capaianPembelajaran', e.target.value)
                        }
                        className="w-full p-1.5 text-xs bg-transparent focus:bg-white focus:ring-1 focus:ring-cyan-500 rounded border border-transparent hover:border-slate-300 resize-y"
                      />
                    </td>

                    {/* IPK */}
                    <td className="p-1 border border-slate-200">
                      <textarea
                        rows={2}
                        value={item.ipk || ''}
                        onChange={(e) => handleCellChange(originalIndex, 'ipk', e.target.value)}
                        className="w-full p-1.5 text-xs bg-transparent focus:bg-white focus:ring-1 focus:ring-cyan-500 rounded border border-transparent hover:border-slate-300 resize-y"
                      />
                    </td>

                    {/* Materi */}
                    <td className="p-1 border border-slate-200">
                      <input
                        type="text"
                        value={item.materi || ''}
                        onChange={(e) => handleCellChange(originalIndex, 'materi', e.target.value)}
                        className="w-full p-1.5 text-xs bg-transparent focus:bg-white focus:ring-1 focus:ring-cyan-500 rounded border border-transparent hover:border-slate-300 font-medium"
                      />
                    </td>

                    {/* Indikator Soal */}
                    <td className="p-1 border border-slate-200">
                      <textarea
                        rows={2}
                        value={item.indikatorSoal || ''}
                        onChange={(e) =>
                          handleCellChange(originalIndex, 'indikatorSoal', e.target.value)
                        }
                        className="w-full p-1.5 text-xs bg-transparent focus:bg-white focus:ring-1 focus:ring-cyan-500 rounded border border-transparent hover:border-slate-300 resize-y"
                      />
                    </td>

                    {/* Bentuk Tes */}
                    <td className="p-1 border border-slate-200 text-center">
                      <input
                        type="text"
                        value={item.bentukTes || ''}
                        onChange={(e) => handleCellChange(originalIndex, 'bentukTes', e.target.value)}
                        className="w-full p-1.5 text-xs bg-transparent text-center focus:bg-white focus:ring-1 focus:ring-cyan-500 rounded border border-transparent hover:border-slate-300"
                      />
                    </td>

                    {/* Action */}
                    <td className="p-1 border border-slate-200 text-center">
                      <button
                        onClick={() => handleDeleteRow(originalIndex)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        title="Hapus baris"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="bg-cyan-50/50 p-2.5 border-t border-cyan-200 flex items-center justify-between text-xs text-slate-600">
          <span>Total Baris Master: <strong>{masterData.length}</strong></span>
          <span>Menampilkan: <strong>{filtered.length}</strong> baris</span>
        </div>
      </div>
    </div>
  );
};
