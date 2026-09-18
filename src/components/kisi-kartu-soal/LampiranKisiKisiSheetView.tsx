import React from 'react';
import { SoalItem, SheetTab, SchoolIdentity } from '../../types/kisiKartuSoal';
import { ArrowLeft, Printer, FileText } from 'lucide-react';
import { KurikulumMerdekaLogo } from './KurikulumMerdekaLogo';

interface LampiranKisiKisiSheetViewProps {
  identitas: SchoolIdentity;
  soalData: SoalItem[];
  onNavigateTab: (tab: SheetTab) => void;
}

export const LampiranKisiKisiSheetView: React.FC<LampiranKisiKisiSheetViewProps> = ({
  identitas,
  soalData,
  onNavigateTab,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const jenisTesLabel = identitas.jenisTes || 'Penilaian Tengah Semester (PSTS)';

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* Top Controls Toolbar */}
      <div className="no-print bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3 flex-wrap">
        <button
          id="btn-back-menu-lampiran"
          onClick={() => onNavigateTab('menu')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO MAIN MENU</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Instrumen Soal (PDF)</span>
          </button>
        </div>
      </div>

      {/* Main Lampiran Document Container */}
      <div className="bg-white border-2 border-slate-900 rounded-xl p-5 sm:p-8 shadow-sm text-slate-900">
        {/* Document Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-4 gap-4">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-black tracking-wide uppercase text-slate-950">
              LAMPIRAN INSTRUMEN / BUTIR SOAL
            </h2>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
              {jenisTesLabel.toUpperCase()}
            </h3>
            <p className="text-xs font-bold text-slate-600">
              TAHUN AJARAN {identitas.tahunAjaran}
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-end gap-1">
            <KurikulumMerdekaLogo size="sm" />
            <span className="text-[10px] font-bold text-slate-500 text-right">
              {identitas.namaSekolah}
            </span>
          </div>
        </div>

        {/* Identity Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 mb-5 text-xs font-semibold bg-slate-50/70 p-3 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-36 text-slate-600">Satuan Pendidikan</span>
            <span className="text-slate-900 font-bold">: {identitas.namaSekolah}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-36 text-slate-600">Bentuk Soal</span>
            <span className="text-slate-900 font-bold">: {identitas.bentukTes}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-36 text-slate-600">Mata Pelajaran</span>
            <span className="text-slate-900 font-bold">: {identitas.mataPelajaran}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-36 text-slate-600">Jenis Asesmen</span>
            <span className="text-slate-900 font-bold">: {jenisTesLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-36 text-slate-600">Kelas / Semester</span>
            <span className="text-slate-900 font-bold">: {identitas.kelasSemester}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-36 text-slate-600">Guru Penyusun</span>
            <span className="text-slate-900 font-bold">: {identitas.penyusun}</span>
          </div>
        </div>

        {/* Instruments Table matching Page 13 */}
        <div className="overflow-x-auto border-2 border-slate-900">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-200 text-slate-950 font-black border-b-2 border-slate-900 text-center">
              <tr>
                <th className="p-2.5 border border-slate-900 w-12 shrink-0">No.</th>
                <th className="p-2.5 border border-slate-900 min-w-[380px]">Butir Soal & Pilihan Jawaban</th>
                <th className="p-2.5 border border-slate-900 w-24 text-center shrink-0">
                  Kunci Jawaban
                </th>
                <th className="p-2.5 border border-slate-900 w-20 text-center shrink-0">
                  Tingkat
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-xs">
              {soalData.map((item) => (
                <tr key={item.noSoal} className="hover:bg-slate-50 align-top">
                  <td className="p-2.5 border border-slate-900 text-center font-bold">
                    {item.noSoal}
                  </td>
                  <td className="p-2.5 border border-slate-900 leading-relaxed">
                    <p className="font-semibold text-slate-900 mb-2 whitespace-pre-line">
                      {item.rumusanButirSoal || `(Butir soal #${item.noSoal})`}
                    </p>
                    <div className="space-y-1 pl-2 text-slate-800">
                      {item.pilihanA && (
                        <p className={item.kunci === 'A' ? 'font-bold text-emerald-800' : ''}>
                          A. {item.pilihanA}
                        </p>
                      )}
                      {item.pilihanB && (
                        <p className={item.kunci === 'B' ? 'font-bold text-emerald-800' : ''}>
                          B. {item.pilihanB}
                        </p>
                      )}
                      {item.pilihanC && (
                        <p className={item.kunci === 'C' ? 'font-bold text-emerald-800' : ''}>
                          C. {item.pilihanC}
                        </p>
                      )}
                      {item.pilihanD && (
                        <p className={item.kunci === 'D' ? 'font-bold text-emerald-800' : ''}>
                          D. {item.pilihanD}
                        </p>
                      )}
                      {item.pilihanE && (
                        <p className={item.kunci === 'E' ? 'font-bold text-emerald-800' : ''}>
                          E. {item.pilihanE}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="p-2.5 border border-slate-900 text-center font-black text-sm bg-slate-50">
                    <span className="inline-block px-2.5 py-1 bg-amber-500 text-white rounded font-mono">
                      {item.kunci}
                    </span>
                  </td>
                  <td className="p-2.5 border border-slate-900 text-center font-semibold text-[11px] text-slate-700">
                    {item.tingkatKesukaran || 'Sedang'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signature Box matching Kisi-Kisi */}
        <div className="mt-8 flex justify-between items-start text-xs font-semibold px-4 pt-4">
          <div className="text-center">
            <p className="mb-16">Mengetahui,<br />Kepala Sekolah</p>
            <p className="font-bold underline">{identitas.kepalaSekolah}</p>
            <p className="text-[11px] text-slate-500">NBM: {identitas.nbmKepalaSekolah}</p>
          </div>

          <div className="text-center">
            <p className="mb-16">{identitas.tanggalPenyusunan}<br />Guru Mata Pelajaran</p>
            <p className="font-bold underline">{identitas.penyusun}</p>
            <p className="text-[11px] text-slate-600 font-semibold">NBM: {identitas.nbmPenyusun || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
