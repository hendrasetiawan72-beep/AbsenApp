import React, { useState, useRef } from 'react';
import {
  SchoolIdentity,
  MasterSoalItem,
  SoalItem,
  SheetTab,
  OPSI_JENIS_TES,
} from '../../types/kisiKartuSoal';
import { KurikulumMerdekaLogo } from './KurikulumMerdekaLogo';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Printer,
  Download,
  Loader2,
  FileText,
  Edit3,
  Check,
  Sparkles,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface KartuSoalSheetViewProps {
  identitas: SchoolIdentity;
  masterData: MasterSoalItem[];
  soalData: SoalItem[];
  currentSoalNo: number;
  onSelectSoalNo: (no: number) => void;
  onNavigateTab: (tab: SheetTab) => void;
  onUpdateSoal: (soal: SoalItem) => void;
  onUpdateIdentitas?: (identitas: SchoolIdentity) => void;
}

const JENIS_TES_PRESETS = [
  'Penilaian Tengah Semester (PTS)',
  'Penilaian Tengah Semester (PSTS)',
  'Sumatif Tengah Semester (STS)',
  'Asesmen Sumatif Tengah Semester (ASTS)',
  'Penilaian Akhir Semester (PAS)',
  'Penilaian Sumatif Akhir Semester (PSAS)',
  'Sumatif Akhir Semester (SAS)',
  'Asesmen Sumatif Akhir Semester (ASAS)',
  'Penilaian Akhir Tahun (PAT)',
  'Sumatif Akhir Tahun (SAT)',
  'Asesmen Sumatif Akhir Tahun (ASAT)',
  'Penilaian Harian / Formatif (PH)',
  'Asesmen Sumatif Akhir Jenjang (ASAJ)',
  'Ujian Sekolah (US)',
  'Tes Kemampuan Akademik (TKA)',
];

export const KartuSoalSheetView: React.FC<KartuSoalSheetViewProps> = ({
  identitas,
  masterData,
  soalData,
  currentSoalNo,
  onSelectSoalNo,
  onNavigateTab,
  onUpdateSoal,
  onUpdateIdentitas,
}) => {
  const [printAllMode, setPrintAllMode] = useState(false);
  const [paperSize, setPaperSize] = useState<'f4' | 'a4'>('f4');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgressText, setPdfProgressText] = useState('');
  const [isEditingSoalModal, setIsEditingSoalModal] = useState(false);
  const [isCustomJenisTes, setIsCustomJenisTes] = useState(false);
  const [customJenisTesInput, setCustomJenisTesInput] = useState('');

  const cardContainerRef = useRef<HTMLDivElement>(null);

  // Find active soal and corresponding master data
  const activeSoal =
    soalData.find((s) => s.noSoal === currentSoalNo) ||
    soalData[0] || {
      noSoal: 1,
      kunci: 'A',
      rumusanButirSoal: '',
      pilihanA: '',
      pilihanB: '',
      pilihanC: '',
      pilihanD: '',
      catatanManual: '',
      jumlahSiswa: 144,
      tingkatKesukaran: 'Sedang',
      digunakanUntuk: 'PSTS',
      tanggal: '11 Maret 2026',
      keputusanValidasi: 'Diterima',
    };

  const totalSoal = soalData.length;

  const currentJenisTes =
    identitas.jenisTes || activeSoal.digunakanUntuk || 'Penilaian Tengah Semester (PSTS)';

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

  const handleValidationDecision = (
    soalTarget: SoalItem,
    decision: 'Diterima' | 'Revisi' | 'Ditolak'
  ) => {
    onUpdateSoal({
      ...soalTarget,
      keputusanValidasi: decision,
    });
  };

  const handleChangeJenisTes = (newJenis: string) => {
    if (newJenis === 'custom') {
      setIsCustomJenisTes(true);
      return;
    }
    setIsCustomJenisTes(false);
    if (onUpdateIdentitas) {
      onUpdateIdentitas({
        ...identitas,
        jenisTes: newJenis,
      });
    }
    onUpdateSoal({
      ...activeSoal,
      digunakanUntuk: newJenis,
    });
  };

  const handleApplyCustomJenisTes = () => {
    if (!customJenisTesInput.trim()) return;
    if (onUpdateIdentitas) {
      onUpdateIdentitas({
        ...identitas,
        jenisTes: customJenisTesInput.trim(),
      });
    }
    onUpdateSoal({
      ...activeSoal,
      digunakanUntuk: customJenisTesInput.trim(),
    });
    setIsCustomJenisTes(false);
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

  // Direct PDF Download functionality
  const handleDownloadPdf = async (singleOnly: boolean) => {
    try {
      setIsGeneratingPdf(true);
      setPdfProgressText(
        singleOnly
          ? `Menyiapkan PDF Kartu Soal #${activeSoal.noSoal}...`
          : `Menyiapkan PDF Seluruh Kartu Soal (1-${totalSoal})...`
      );

      // If downloading all, ensure printAllMode is true temporarily
      const wasPrintAll = printAllMode;
      if (!singleOnly && !printAllMode) {
        setPrintAllMode(true);
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      await new Promise((resolve) => setTimeout(resolve, 200));

      const container = cardContainerRef.current;
      if (!container) {
        throw new Error('Container kartu soal tidak ditemukan');
      }

      const pdfFormat: [number, number] | 'a4' = paperSize === 'f4' ? [215, 330] : 'a4';

      if (singleOnly) {
        // Target just the single card element
        const targetElement = container.querySelector<HTMLElement>('.kartu-soal-box') || container;

        const canvas = await html2canvas(targetElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: pdfFormat,
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const marginX = 8;
        const marginY = 8;
        const maxImgWidth = pdfWidth - marginX * 2;
        const maxImgHeight = pdfHeight - marginY * 2;

        let imgWidth = maxImgWidth;
        let imgHeight = (canvas.height * imgWidth) / canvas.width;

        // If height exceeds 1 page, scale down to fit strictly on 1 page
        if (imgHeight > maxImgHeight) {
          imgHeight = maxImgHeight;
          imgWidth = (canvas.width * imgHeight) / canvas.height;
        }

        // Center on page
        const posX = (pdfWidth - imgWidth) / 2;
        const posY = marginY;

        pdf.addImage(imgData, 'JPEG', posX, posY, imgWidth, imgHeight);
        pdf.save(`Kartu_Soal_No_${activeSoal.noSoal}_${paperSize.toUpperCase()}_${identitas.mataPelajaran.replace(/\s+/g, '_')}.pdf`);
      } else {
        // Multi-card PDF export
        const cardElements = container.querySelectorAll<HTMLElement>('.kartu-soal-box');
        if (cardElements.length === 0) {
          throw new Error('Tidak ada kartu soal yang ditemukan');
        }

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: pdfFormat,
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const marginX = 8;
        const marginY = 8;
        const maxImgWidth = pdfWidth - marginX * 2;
        const maxImgHeight = pdfHeight - marginY * 2;

        for (let i = 0; i < cardElements.length; i++) {
          setPdfProgressText(`Memproses kartu soal ${i + 1} dari ${cardElements.length} (${paperSize.toUpperCase()})...`);
          const cardEl = cardElements[i];

          const canvas = await html2canvas(cardEl, {
            scale: 1.8,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.92);
          let imgWidth = maxImgWidth;
          let imgHeight = (canvas.height * imgWidth) / canvas.width;

          if (imgHeight > maxImgHeight) {
            imgHeight = maxImgHeight;
            imgWidth = (canvas.width * imgHeight) / canvas.height;
          }

          if (i > 0) {
            pdf.addPage();
          }

          const posX = (pdfWidth - imgWidth) / 2;
          const posY = marginY;

          pdf.addImage(imgData, 'JPEG', posX, posY, imgWidth, imgHeight);
        }

        setPdfProgressText('Menyimpan file PDF...');
        pdf.save(`Kartu_Soal_Lengkap_${paperSize.toUpperCase()}_${identitas.mataPelajaran.replace(/\s+/g, '_')}.pdf`);

        // Revert mode if needed
        if (!wasPrintAll) {
          setPrintAllMode(false);
        }
      }
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      alert('Gagal membuat PDF otomatis. Mengalihkan ke dialog Cetak/Simpan PDF...');
      window.print();
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgressText('');
    }
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
        className={`kartu-soal-box bg-white border-2 border-slate-800 rounded-lg p-3 sm:p-5 shadow-sm text-slate-900 ${
          isBatch ? 'page-break-after mb-8' : ''
        }`}
      >
        {/* Top Header Grid */}
        <div className="flex items-start justify-between border-b-2 border-slate-800 pb-3 mb-3 gap-3">
          <div className="flex-1">
            <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-950 leading-tight">
              KARTU SOAL - {currentJenisTes.toUpperCase()}
            </h1>

            {/* School & Subject info columns - NBM is used, NIP is removed */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-2 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-36 text-slate-700">Satuan Pendidikan</span>
                <span>: {identitas.namaSekolah}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-32 text-slate-700">Bentuk Soal</span>
                <span>: {identitas.bentukTes}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-36 text-slate-700">Alamat Sekolah</span>
                <span>: {identitas.alamatSekolah || 'Jalan Sukorejo - Bawang km 01'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-32 text-slate-700">Jenis Tes / Asesmen</span>
                <span>: {currentJenisTes}</span>
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
              <div className="flex items-center gap-1.5">
                <span className="w-36 text-slate-700">Tahun Ajaran</span>
                <span>: {identitas.tahunAjaran}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-32 text-slate-700">NBM Penyusun</span>
                <span className="text-slate-900 font-bold">: {identitas.nbmPenyusun || '-'}</span>
              </div>
            </div>
          </div>

          {/* Logo Kurikulum Merdeka */}
          <div className="shrink-0 flex flex-col items-end gap-1">
            <KurikulumMerdekaLogo size="md" />
            <span className="text-[10px] font-bold text-slate-500 text-right">
              SMK Muhammadiyah Bawang
            </span>
          </div>
        </div>

        {/* Number Badge Row + Quick Edit Action Button */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-12 h-9 bg-amber-500 text-white font-black text-base flex items-center justify-center border-2 border-slate-800 rounded-xs shadow-2xs">
              {soal.noSoal}
            </div>
            <span className="text-xs font-bold text-slate-700">
              Soal Nomor #{soal.noSoal} &bull; Kunci: <strong className="text-amber-700">{soal.kunci}</strong>
            </span>
          </div>

          {!isBatch && (
            <div className="no-print flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditingSoalModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg cursor-pointer transition-colors shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Manual Soal & Kunci</span>
              </button>
            </div>
          )}
        </div>

        {/* Main 2-Column Table Grid (Exact layout) */}
        <div className="kartu-soal-main-grid grid grid-cols-1 lg:grid-cols-12 border-2 border-slate-800 text-xs">
          {/* LEFT COLUMN (5 cols) */}
          <div className="kartu-soal-col-left lg:col-span-5 border-b-2 lg:border-b-0 lg:border-r-2 border-slate-800 flex flex-col justify-between">
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
              <div className="p-2.5 text-[11px] leading-relaxed text-slate-800 border-b-2 border-slate-800 bg-white max-h-[190px] overflow-y-auto">
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
                  {soal.digunakanUntuk || currentJenisTes}
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
                      onClick={() => handleValidationDecision(soal, dec)}
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

          {/* RIGHT COLUMN (7 cols) */}
          <div className="kartu-soal-col-right lg:col-span-7 flex flex-col justify-between">
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

              {/* Question Content Box */}
              <div className="p-3 bg-emerald-100/60 border-b-2 border-slate-800 min-h-[70px]">
                <p className="text-xs sm:text-[13px] font-bold text-slate-900 leading-relaxed whitespace-pre-wrap">
                  {soal.rumusanButirSoal || '(Belum ada rumusan butir soal)'}
                </p>
              </div>

              {/* Choices a, b, c, d, e */}
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
      {/* Dynamic Print Styles for F4 / A4 page sizing */}
      <style>{`
        @media print {
          @page {
            size: ${paperSize === 'f4' ? '215mm 330mm' : '210mm 297mm'} portrait !important;
            margin: 5mm 6mm !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #kartu-soal-print-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .kartu-soal-box {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: always !important;
            break-after: page !important;
            box-shadow: none !important;
            border: 2px solid #0f172a !important;
            margin: 0 !important;
            padding: 8px 10px !important;
            box-sizing: border-box !important;
            width: 100% !important;
          }
          .kartu-soal-box:last-of-type {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          /* Enforce side-by-side 2-column layout in print for clean single-page fit */
          .kartu-soal-main-grid {
            display: grid !important;
            grid-template-columns: 5fr 7fr !important;
          }
          .kartu-soal-col-left {
            border-right: 2px solid #0f172a !important;
            border-bottom: none !important;
          }
          .kartu-soal-col-right {
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Controls Toolbar (Hidden on Print) */}
      <div className="no-print bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Back Button */}
          <button
            id="btn-back-menu-kartu"
            onClick={() => onNavigateTab('menu')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>MENU UTAMA</span>
          </button>

          {/* Green "Navigate Here" Control */}
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-xl">
            <span className="text-xs font-black text-emerald-950 uppercase">Navigasi:</span>

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

          {/* Paper Size Selector & PDF Download / Print Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Paper Size Selector (F4 vs A4) */}
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 px-2.5 py-1.5 rounded-lg shadow-2xs">
              <span className="text-xs font-black text-amber-950">Kertas:</span>
              <select
                aria-label="Pilihan Ukuran Kertas Cetak"
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as 'f4' | 'a4')}
                className="text-xs font-black bg-white text-slate-900 border border-amber-400 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-2xs"
              >
                <option value="f4">F4 / Folio (215 × 330 mm) - 1 Hal Pas</option>
                <option value="a4">A4 (210 × 297 mm)</option>
              </select>
            </div>

            {/* Direct PDF Download Single */}
            <button
              id="btn-download-pdf-kartu"
              onClick={() => handleDownloadPdf(true)}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Download Kartu Soal Ini sebagai file PDF"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Download PDF ({paperSize.toUpperCase()})</span>
            </button>

            {/* Direct PDF Download All */}
            <button
              id="btn-download-all-pdf-kartu"
              onClick={() => handleDownloadPdf(false)}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Download Semua Kartu Soal 1 s.d. 50 sebagai file PDF"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Download Semua ({paperSize.toUpperCase()})</span>
            </button>

            {/* Print Single Button */}
            <button
              onClick={handlePrintSingle}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Cetak via Print Dialog"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak ({paperSize.toUpperCase()})</span>
            </button>
          </div>
        </div>

        {/* Row 2: Jenis Tes Switcher & Custom Input (Requirement: Bisa diganti tidak hanya penilaian tengah semester) */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 p-2.5 rounded-lg">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Jenis Asesmen / Tes:
            </span>

            <select
              value={
                JENIS_TES_PRESETS.includes(currentJenisTes)
                  ? currentJenisTes
                  : isCustomJenisTes
                  ? 'custom'
                  : 'custom-saved'
              }
              onChange={(e) => handleChangeJenisTes(e.target.value)}
              className="px-2.5 py-1 text-xs font-bold bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              <optgroup label="— PENILAIAN TENGAH SEMESTER (PTS) —">
                <option value="Penilaian Tengah Semester (PTS)">Penilaian Tengah Semester (PTS)</option>
                <option value="Penilaian Tengah Semester (PSTS)">Penilaian Tengah Semester (PSTS)</option>
                <option value="Sumatif Tengah Semester (STS)">Sumatif Tengah Semester (STS)</option>
                <option value="Asesmen Sumatif Tengah Semester (ASTS)">Asesmen Sumatif Tengah Semester (ASTS)</option>
              </optgroup>
              <optgroup label="— PENILAIAN AKHIR SEMESTER (PAS) —">
                <option value="Penilaian Akhir Semester (PAS)">Penilaian Akhir Semester (PAS)</option>
                <option value="Penilaian Sumatif Akhir Semester (PSAS)">Penilaian Sumatif Akhir Semester (PSAS)</option>
                <option value="Sumatif Akhir Semester (SAS)">Sumatif Akhir Semester (SAS)</option>
                <option value="Asesmen Sumatif Akhir Semester (ASAS)">Asesmen Sumatif Akhir Semester (ASAS)</option>
              </optgroup>
              <optgroup label="— PENILAIAN AKHIR TAHUN (PAT) —">
                <option value="Penilaian Akhir Tahun (PAT)">Penilaian Akhir Tahun (PAT)</option>
                <option value="Sumatif Akhir Tahun (SAT)">Sumatif Akhir Tahun (SAT)</option>
                <option value="Asesmen Sumatif Akhir Tahun (ASAT)">Asesmen Sumatif Akhir Tahun (ASAT)</option>
              </optgroup>
              <optgroup label="— ASESMEN FORMATIF & LAINNYA —">
                <option value="Penilaian Harian / Formatif (PH)">Penilaian Harian / Formatif (PH)</option>
                <option value="Asesmen Sumatif Akhir Jenjang (ASAJ)">Asesmen Sumatif Akhir Jenjang (ASAJ)</option>
                <option value="Ujian Sekolah (US)">Ujian Sekolah (US)</option>
                <option value="Tes Kemampuan Akademik (TKA)">Tes Kemampuan Akademik (TKA)</option>
              </optgroup>
              <option value="custom">-- Ketik Manual Jenis Tes... --</option>
              {!JENIS_TES_PRESETS.includes(currentJenisTes) && (
                <option value="custom-saved">{currentJenisTes} (Tersimpan)</option>
              )}
            </select>

            {isCustomJenisTes && (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Ketik nama tes/asesmen..."
                  value={customJenisTesInput}
                  onChange={(e) => setCustomJenisTesInput(e.target.value)}
                  className="px-2 py-1 text-xs bg-white border border-indigo-400 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 min-w-[200px]"
                />
                <button
                  onClick={handleApplyCustomJenisTes}
                  className="px-2.5 py-1 bg-indigo-600 text-white font-bold text-xs rounded-md hover:bg-indigo-700 cursor-pointer"
                >
                  Terapkan
                </button>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            Format: NBM Penyusun &bull; Alamat: {identitas.alamatSekolah || 'Jalan Sukorejo - Bawang km 01'}
          </div>
        </div>

        {/* PDF Generation Progress Bar if active */}
        {isGeneratingPdf && (
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center gap-3 text-xs text-indigo-900 font-bold animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600 shrink-0" />
            <span>{pdfProgressText}</span>
          </div>
        )}
      </div>

      {/* Modal Edit Soal Manual */}
      {isEditingSoalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-600" />
                <span>Edit Manual Soal Nomor #{activeSoal.noSoal}</span>
              </h3>
              <button
                onClick={() => setIsEditingSoalModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Rumusan Butir Soal:
                </label>
                <textarea
                  rows={4}
                  value={activeSoal.rumusanButirSoal || ''}
                  onChange={(e) =>
                    onUpdateSoal({ ...activeSoal, rumusanButirSoal: e.target.value })
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilihan A:</label>
                  <input
                    type="text"
                    value={activeSoal.pilihanA || ''}
                    onChange={(e) =>
                      onUpdateSoal({ ...activeSoal, pilihanA: e.target.value })
                    }
                    className="w-full p-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilihan B:</label>
                  <input
                    type="text"
                    value={activeSoal.pilihanB || ''}
                    onChange={(e) =>
                      onUpdateSoal({ ...activeSoal, pilihanB: e.target.value })
                    }
                    className="w-full p-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilihan C:</label>
                  <input
                    type="text"
                    value={activeSoal.pilihanC || ''}
                    onChange={(e) =>
                      onUpdateSoal({ ...activeSoal, pilihanC: e.target.value })
                    }
                    className="w-full p-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilihan D:</label>
                  <input
                    type="text"
                    value={activeSoal.pilihanD || ''}
                    onChange={(e) =>
                      onUpdateSoal({ ...activeSoal, pilihanD: e.target.value })
                    }
                    className="w-full p-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kunci Jawaban:
                  </label>
                  <select
                    value={activeSoal.kunci || 'A'}
                    onChange={(e) =>
                      onUpdateSoal({ ...activeSoal, kunci: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg font-black text-amber-900 bg-amber-50 cursor-pointer"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tingkat Kesukaran:
                  </label>
                  <select
                    value={activeSoal.tingkatKesukaran || 'Sedang'}
                    onChange={(e) =>
                      onUpdateSoal({ ...activeSoal, tingkatKesukaran: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg font-bold cursor-pointer"
                  >
                    <option value="Mudah">Mudah</option>
                    <option value="Sedang">Sedang</option>
                    <option value="HOTS">HOTS</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setIsEditingSoalModal(false)}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 cursor-pointer"
              >
                Selesai & Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENDER VIEW: Single Mode or Batch Mode */}
      <div ref={cardContainerRef} id="kartu-soal-print-container">
        {printAllMode ? (
          <div className="space-y-6">
            <div className="no-print bg-amber-50 border border-amber-300 p-3 rounded-lg flex items-center justify-between text-xs text-amber-900">
              <span>Menampilkan seluruh {soalData.length} kartu soal siap cetak / unduh PDF.</span>
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
    </div>
  );
};
