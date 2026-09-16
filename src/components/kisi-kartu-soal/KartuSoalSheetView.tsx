import React, { useState } from 'react';
import { SchoolIdentity, MasterSoalItem, SoalItem, SheetTab } from '../../types/kisiKartuSoal';
import { KurikulumMerdekaLogo } from './KurikulumMerdekaLogo';
import { ArrowLeft, ChevronLeft, ChevronRight, Printer, Check } from 'lucide-react';

interface KartuSoalSheetViewProps {
  identitas: SchoolIdentity;
  masterData: MasterSoalItem[];
  soalData: SoalItem[];
  currentSoalNo: number;
  onSelectSoalNo: (no: number) => void;
  onNavigateTab: (tab: SheetTab) => void;
  onUpdateSoal: (soal: SoalItem) => void;
}

export const KartuSoalSheetView: React.FC<KartuSoalSheetViewProps> = ({
  identitas,
  masterData,
  soalData,
  currentSoalNo,
  onSelectSoalNo,
  onNavigateTab,
  onUpdateSoal,
}) => {
  const [printAllMode, setPrintAllMode] = useState(false);

  // Find active soal and corresponding master data
  const activeSoal = soalData.find((s) => s.noSoal === currentSoalNo) || soalData[0] || {
    noSoal: 1,
    kunci: 'A',
    rumusanButirSoal: '',
    pilihanA: '',
    pilihanB: '',
    pilihanC: '',
    pilihanD: '',
    jumlahSiswa: 144,
    tingkatKesukaran: 'Sedang',
    digunakanUntuk: 'PSTS',
    tanggal: '11 Maret 2026',
    keputusanValidasi: 'Diterima',
  };

  const activeMaster = masterData.find((m) => m.no === activeSoal.noSoal) || masterData[0] || {
    no: 1,
    elemen: 'Membaca - Memirsa',
    capaianPembelajaran: '',
    ipk: '',
    materi: '',
    indikatorSoal: '',
    bentukTes: 'pilihan ganda',
  };

  const totalSoal = soalData.length;

  const handlePrev = () => {
    if (activeSoal.noSoal > 1) {
      onSelectSoalNo(activeSoal.noSoal - 1);
    }
  };

  const handleNext = () => {
    if (activeSoal.noSoal < totalSoal) {
      onSelectSoalNo(activeSoal.noSoal + 1);
    }
  };

  const handleValidationDecision = (decision: 'Diterima' | 'Revisi' | 'Ditolak') => {
    onUpdateSoal({
      ...activeSoal,
      keputusanValidasi: decision,
    });
  };

  const handlePrintSingle = () => {
    setPrintAllMode(false);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintAll = () => {
    setPrintAllMode(true);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  // Render a single question card
  const renderCard = (soal: SoalItem, isBatch = false) => {
    const master = masterData.find((m) => m.no === soal.noSoal) || masterData[0];
    const elemenVal = master ? master.elemen : 'Membaca - Memirsa';
    const cpVal = master ? master.capaianPembelajaran : '';
    const materiVal = master ? master.materi : '';
    const ipkVal = master ? master.ipk : '';

    return (
      <div
        key={soal.noSoal}
        className={`bg-white border-2 border-slate-800 rounded-lg p-3 sm:p-5 shadow-sm text-slate-900 ${
          isBatch ? 'page-break-after mb-8' : ''
        }`}
      >
        {/* Top Header Grid */}
        <div className="flex items-start justify-between border-b-2 border-slate-800 pb-3 mb-3 gap-3">
          <div className="flex-1">
            <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-950 leading-tight">
              Kartu Soal Penilaian Tengah Semester
            </h1>

            {/* School & Subject info columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5 mt-2 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-36 text-slate-700">Satuan Pendidikan</span>
                <span>: {identitas.namaSekolah}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-32 text-slate-700">Bentuk Soal</span>
                <span>: {identitas.bentukTes}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-36 text-slate-700">Mata Pelajaran</span>
                <span>: {identitas.mataPelajaran}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-32 text-slate-700">Jumlah Soal</span>
                <span>: {identitas.jumlahSoal}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-36 text-slate-700">Kurikulum</span>
                <span>: {identitas.kurikulum}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-32 text-slate-700">Penyusun</span>
                <span>: {identitas.penyusun}</span>
              </div>
            </div>
          </div>

          {/* Logo Kurikulum Merdeka */}
          <div className="shrink-0">
            <KurikulumMerdekaLogo size="md" />
          </div>
        </div>

        {/* Number Badge Row */}
        <div className="flex items-center mb-2">
          <div className="w-12 h-9 bg-amber-500 text-white font-black text-base flex items-center justify-center border-2 border-slate-800 rounded-xs shadow-2xs">
            {soal.noSoal}
          </div>
        </div>

        {/* Main 2-Column Table Grid (Exact layout from Screenshot 4) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 border-2 border-slate-800 text-xs">
          {/* LEFT COLUMN (approx 5 cols) */}
          <div className="lg:col-span-5 border-b-2 lg:border-b-0 lg:border-r-2 border-slate-800 flex flex-col justify-between">
            <div>
              {/* Header Elemen */}
              <div className="bg-slate-300 px-3 py-1 font-black text-slate-900 border-b border-slate-400">
                Elemen
              </div>
              <div className="p-2.5 font-bold text-slate-800 border-b-2 border-slate-800 bg-white min-h-[38px] flex items-center">
                {elemenVal}
              </div>

              {/* Header CP / ATP Fase F */}
              <div className="bg-slate-300 px-3 py-1 font-black text-slate-900 border-b border-slate-400">
                CP/ATP Fase F
              </div>
              <div className="p-2.5 text-[11px] leading-relaxed text-slate-800 border-b-2 border-slate-800 bg-white max-h-[220px] overflow-y-auto">
                {cpVal}
              </div>

              {/* Header Materi */}
              <div className="bg-slate-300 px-3 py-1 font-black text-slate-900 border-b border-slate-400">
                Materi
              </div>
              <div className="p-2.5 font-bold text-slate-800 border-b-2 border-slate-800 bg-white min-h-[38px] flex items-center">
                {materiVal}
              </div>
            </div>

            {/* Bottom Meta in Left Column: Digunakan Untuk, Tanggal, Validator */}
            <div className="border-t-2 border-slate-800 divide-y divide-slate-800">
              <div className="grid grid-cols-3">
                <div className="bg-sky-200 px-2 py-1.5 font-black text-sky-950 border-r border-slate-800">
                  Digunakan Untuk
                </div>
                <div className="col-span-2 px-2 py-1.5 font-bold text-slate-900 bg-white flex items-center">
                  {soal.digunakanUntuk || 'PSTS'}
                </div>
              </div>

              <div className="grid grid-cols-3">
                <div className="bg-amber-200 px-2 py-1.5 font-black text-amber-950 border-r border-slate-800">
                  Tanggal
                </div>
                <div className="col-span-2 px-2 py-1.5 font-bold text-slate-900 bg-white flex items-center">
                  {soal.tanggal || '11 Maret 2026'}
                </div>
              </div>

              <div className="grid grid-cols-3">
                <div className="bg-sky-200 px-2 py-1.5 font-black text-sky-950 border-r border-slate-800">
                  Validator
                </div>
                <div className="col-span-2 px-2 py-1.5 font-bold text-slate-900 bg-white flex items-center">
                  {soal.validator || '-'}
                </div>
              </div>

              {/* Keputusan Validasi */}
              <div className="bg-rose-100 p-2 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
                <span className="font-black text-slate-900 text-[11px]">Keputusan Validasi :</span>
                <div className="flex items-center gap-3">
                  {(['Diterima', 'Revisi', 'Ditolak'] as const).map((dec) => (
                    <label
                      key={dec}
                      onClick={() => handleValidationDecision(dec)}
                      className="flex items-center gap-1 cursor-pointer font-bold text-[11px]"
                    >
                      <input
                        type="radio"
                        name={`validasi-${soal.noSoal}`}
                        checked={(soal.keputusanValidasi || 'Diterima') === dec}
                        onChange={() => {}}
                        className="accent-rose-600 cursor-pointer"
                      />
                      <span>{dec}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (approx 7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              {/* Buku Sumber & Nomor Soal Header */}
              <div className="grid grid-cols-12 border-b-2 border-slate-800 bg-slate-200">
                <div className="col-span-8 p-1.5 font-bold flex items-center gap-1 border-r border-slate-400">
                  <span className="text-slate-600">Buku Sumber :</span>
                  <span className="text-slate-900 font-extrabold">{identitas.bukuSumber}</span>
                </div>
                <div className="col-span-4 p-1.5 font-black flex items-center justify-between bg-slate-300">
                  <span>Nomor Soal</span>
                  <span className="text-sm font-black text-slate-950">{soal.noSoal}</span>
                </div>
              </div>

              {/* Rumusan Butir Soal Header */}
              <div className="bg-slate-300 px-3 py-1 font-black text-slate-900 border-b border-slate-400">
                Rumusan Butir Soal
              </div>

              {/* Question Content Box (Green Box as in Screenshot 4) */}
              <div className="p-3 bg-emerald-100/60 border-b-2 border-slate-800 min-h-[70px]">
                <p className="text-xs sm:text-[13px] font-bold text-slate-900 leading-relaxed whitespace-pre-wrap">
                  {soal.rumusanButirSoal || '(Belum ada rumusan butir soal)'}
                </p>
              </div>

              {/* Choices a, b, c, d (Light blue rows as in Screenshot 4) */}
              <div className="divide-y divide-slate-300 border-b-2 border-slate-800 bg-sky-50/50">
                <div className="p-2 flex items-start gap-2 hover:bg-sky-100/50 transition-colors">
                  <span className="font-black text-slate-800 shrink-0 w-4">a.</span>
                  <span className="text-slate-900 font-medium">{soal.pilihanA || '-'}</span>
                </div>
                <div className="p-2 flex items-start gap-2 hover:bg-sky-100/50 transition-colors">
                  <span className="font-black text-slate-800 shrink-0 w-4">b.</span>
                  <span className="text-slate-900 font-medium">{soal.pilihanB || '-'}</span>
                </div>
                <div className="p-2 flex items-start gap-2 hover:bg-sky-100/50 transition-colors">
                  <span className="font-black text-slate-800 shrink-0 w-4">c.</span>
                  <span className="text-slate-900 font-medium">{soal.pilihanC || '-'}</span>
                </div>
                <div className="p-2 flex items-start gap-2 hover:bg-sky-100/50 transition-colors">
                  <span className="font-black text-slate-800 shrink-0 w-4">d.</span>
                  <span className="text-slate-900 font-medium">{soal.pilihanD || '-'}</span>
                </div>
                {soal.pilihanE && (
                  <div className="p-2 flex items-start gap-2 hover:bg-sky-100/50 transition-colors">
                    <span className="font-black text-slate-800 shrink-0 w-4">e.</span>
                    <span className="text-slate-900 font-medium">{soal.pilihanE}</span>
                  </div>
                )}
              </div>

              {/* Kunci Jawaban Orange Bar */}
              <div className="grid grid-cols-12 bg-amber-500 text-white font-black text-sm border-b-2 border-slate-800">
                <div className="col-span-8 p-1.5 px-3 border-r border-amber-600">
                  Kunci
                </div>
                <div className="col-span-4 p-1.5 px-3 text-center bg-amber-600 text-base">
                  {soal.kunci || 'A'}
                </div>
              </div>

              {/* Indikator Pencapaian Kompetensi */}
              <div className="bg-slate-300 px-3 py-1 font-black text-slate-900 border-b border-slate-400">
                Indikator Pencapaian Kompetensi
              </div>
              <div className="p-2.5 font-bold text-slate-800 border-b-2 border-slate-800 bg-white min-h-[44px] flex items-center">
                {ipkVal || '-'}
              </div>
            </div>

            {/* Bottom Analysis Stats Grid */}
            <div className="divide-y divide-slate-800 bg-white">
              <div className="grid grid-cols-3 sm:grid-cols-5 text-center divide-x divide-slate-800 border-b border-slate-800">
                <div className="p-1">
                  <div className="bg-slate-200 text-[10px] font-bold p-0.5">Jumlah Siswa</div>
                  <div className="font-bold text-xs p-1">{soal.jumlahSiswa || 144}</div>
                </div>
                <div className="p-1">
                  <div className="bg-slate-200 text-[10px] font-bold p-0.5">Tingkat Kesukaran</div>
                  <div className="font-black text-xs p-1 text-rose-700">{soal.tingkatKesukaran || 'HOTS'}</div>
                </div>
                <div className="p-1">
                  <div className="bg-slate-200 text-[10px] font-bold p-0.5">Daya Pembeda</div>
                  <div className="font-bold text-xs p-1">{soal.dayaPembeda || '-'}</div>
                </div>
                <div className="col-span-2 p-1">
                  <div className="bg-slate-200 text-[10px] font-bold p-0.5">Proporsi Jawaban Benar</div>
                  <div className="font-semibold text-[10px] p-1 flex justify-around">
                    <span>A: -</span>
                    <span>B: -</span>
                    <span>C: -</span>
                    <span>D: -</span>
                  </div>
                </div>
              </div>

              {/* Tanggapan Validator */}
              <div className="p-2 bg-slate-50 flex items-center gap-2">
                <span className="font-black text-[11px] text-slate-800 whitespace-nowrap">
                  Tanggapan Validator :
                </span>
                <span className="text-xs text-slate-600 italic">
                  {soal.tanggapanValidator || 'Sesuai dengan capaian pembelajaran dan indikator soal.'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* Top Controls Toolbar (Hidden on Print) */}
      <div className="no-print bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Back Button */}
        <button
          id="btn-back-menu-kartu"
          onClick={() => onNavigateTab('menu')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO MAIN MENU</span>
        </button>

        {/* Green "Navigate Here" Control as in Screenshot 4 */}
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-xl">
          <span className="text-xs font-black text-emerald-950 uppercase">Navigate Here:</span>
          
          <button
            onClick={handlePrev}
            disabled={activeSoal.noSoal <= 1}
            className="p-1 rounded-lg bg-emerald-600 text-white disabled:opacity-30 hover:bg-emerald-700 cursor-pointer"
            title="Soal Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <select
            value={activeSoal.noSoal}
            onChange={(e) => onSelectSoalNo(parseInt(e.target.value))}
            className="px-2 py-1 text-xs font-black bg-white text-emerald-900 border border-emerald-400 rounded-md cursor-pointer focus:outline-none"
          >
            {soalData.map((s) => (
              <option key={s.noSoal} value={s.noSoal}>
                No. {s.noSoal} ({s.kunci})
              </option>
            ))}
          </select>

          <button
            onClick={handleNext}
            disabled={activeSoal.noSoal >= totalSoal}
            className="p-1 rounded-lg bg-emerald-600 text-white disabled:opacity-30 hover:bg-emerald-700 cursor-pointer"
            title="Soal Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="text-xs text-emerald-700 font-bold ml-1">
            dari {totalSoal}
          </span>
        </div>

        {/* Print Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintSingle}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
            title="Cetak Kartu Soal Ini (No. {activeSoal.noSoal})"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Kartu Ini</span>
          </button>

          <button
            onClick={handlePrintAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
            title="Cetak Seluruh Kartu Soal 1 s.d. 50"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Semua (1-{totalSoal})</span>
          </button>
        </div>
      </div>

      {/* RENDER VIEW: Single Mode (Screen & Single Print) or Batch Mode */}
      {printAllMode ? (
        <div className="space-y-6">
          <div className="no-print bg-amber-50 border border-amber-300 p-3 rounded-lg flex items-center justify-between text-xs text-amber-900">
            <span>Menampilkan seluruh {soalData.length} kartu soal siap cetak.</span>
            <button
              onClick={() => setPrintAllMode(false)}
              className="font-bold underline text-amber-950 cursor-pointer"
            >
              Kembali ke Tampilan Tunggal
            </button>
          </div>
          {soalData.map((s) => renderCard(s, true))}
        </div>
      ) : (
        renderCard(activeSoal, false)
      )}
    </div>
  );
};
