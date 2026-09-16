import React from 'react';
import { SoalItem, SheetTab } from '../../types/kisiKartuSoal';
import { ArrowLeft, Printer } from 'lucide-react';

interface LampiranKisiKisiSheetViewProps {
  soalData: SoalItem[];
  onNavigateTab: (tab: SheetTab) => void;
}

export const LampiranKisiKisiSheetView: React.FC<LampiranKisiKisiSheetViewProps> = ({
  soalData,
  onNavigateTab,
}) => {
  const handlePrint = () => {
    window.print();
  };

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

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Instrumen Soal (PDF)</span>
        </button>
      </div>

      {/* Main Lampiran Document Container */}
      <div className="bg-white border-2 border-slate-900 rounded-xl p-5 sm:p-8 shadow-sm text-slate-900">
        <h2 className="text-base sm:text-lg font-black tracking-wide uppercase text-slate-950 mb-4 border-b-2 border-slate-900 pb-2">
          A. INSTRUMEN / BUTIR SOAL
        </h2>

        {/* Instruments Table matching Page 13 */}
        <div className="overflow-x-auto border-2 border-slate-900">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-200 text-slate-950 font-black border-b-2 border-slate-900 text-center">
              <tr>
                <th className="p-2.5 border border-slate-900 w-12 shrink-0">No.</th>
                <th className="p-2.5 border border-slate-900 min-w-[380px]">Soal</th>
                <th className="p-2.5 border border-slate-900 w-24 text-center shrink-0">
                  Kunci Jawaban
                </th>
                <th className="p-2.5 border border-slate-900 w-16 text-center shrink-0">
                  Skor
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-xs">
              {soalData.map((s) => (
                <tr key={s.noSoal} className="hover:bg-slate-50 align-top">
                  <td className="p-2.5 border border-slate-900 text-center font-bold text-slate-900">
                    {s.noSoal}
                  </td>
                  <td className="p-2.5 border border-slate-900 space-y-1.5">
                    <p className="font-bold text-slate-950 leading-relaxed whitespace-pre-wrap">
                      {s.rumusanButirSoal}
                    </p>
                    <div className="pl-2 space-y-0.5 text-slate-800 text-[11px]">
                      <p>a. {s.pilihanA}</p>
                      <p>b. {s.pilihanB}</p>
                      <p>c. {s.pilihanC}</p>
                      <p>d. {s.pilihanD}</p>
                      {s.pilihanE && <p>e. {s.pilihanE}</p>}
                    </div>
                  </td>
                  <td className="p-2.5 border border-slate-900 text-center font-black text-sm text-slate-950">
                    {s.kunci}
                  </td>
                  <td className="p-2.5 border border-slate-900 text-center font-bold">
                    1
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
