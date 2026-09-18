import React from 'react';
import { SchoolIdentity, MasterSoalItem, SheetTab } from '../../types/kisiKartuSoal';
import { ArrowLeft, Printer } from 'lucide-react';

interface KisiKisiSheetViewProps {
  identitas: SchoolIdentity;
  masterData: MasterSoalItem[];
  onNavigateTab: (tab: SheetTab) => void;
}

export const KisiKisiSheetView: React.FC<KisiKisiSheetViewProps> = ({
  identitas,
  masterData,
  onNavigateTab,
}) => {
  const handlePrint = () => {
    window.print();
  };

  // Group master data by common CP, IPK, and Materi for elegant official Kisi-Kisi layout
  // As shown in Page 12: 01-22, 23-36, 37-50
  const groupedKisiKisi = [
    {
      rangeNo: '01 -- 22',
      cp: `By the end of Phase F, students use English to communicate with teachers, peers and others in a range of settings and for a range of purposes. They use and respond to open-ended questions and use strategies to initiate, sustain and conclude conversations and discussion. They understand and identify the main ideas and relevant details of discussions or presentations on a wide range of topics. They use English to express opinions on social issues and to discuss youth-related interests, behaviours and values across cultural contexts. They opinions, make comparisons and evaluate perspectives. They employ self-correction and repair strategies, and use non-verbal elements such as gestures, speed and pitch to be understood in most contexts.`,
      ipk: 'Menganalisis unsur kebahasaan dialog opinion',
      materi: 'opinion and thoughts',
      indikator: 'Memahami dialog percakapan sehari-hari dalam konteks meminta informasi terkait pendapat',
      bentukSoal: 'Pilihan Ganda',
    },
    {
      rangeNo: '23 - 36',
      cp: `By the end of Phase F, students independently read and respond to a wide range of texts such as narratives, descriptives, expositions, procedures, argumentatives and discussions. They read to learn and read for pleasure. They locate, synthesize and evaluate specific details and gist from a range of text genres. These texts may be in the form of print or digital texts, including visual, multimodal or interactive texts. They demonstrate an understanding of the main ideas, issues or plot development in a range of texts. They identify the author’s purpose and make inference to comprehend implicit information in the text.`,
      ipk: 'Menganalisis unsur kebahasaan dialog penawaran dan saran',
      materi: 'Suggestion and Offering',
      indikator: 'Memahami dialog percakapan sehari-hari dalam konteks meminta informasi terkait pendapat',
      bentukSoal: 'Pilihan Ganda',
    },
    {
      rangeNo: '37 - 50',
      cp: `By the end of Phase F, students independently write an extensive range of fictional and factual text types, showing an awareness of purpose and audience. They plan, write, review and redraft a range of text types with some evidence of self- correction strategies, including punctuation, capitalization and tenses. They express complex ideas and use a wide range of vocabulary and verb tenses in their writing. They include topic sentences in their paragraphs and use time markers for sequencing, also conjunctions, connectives and pronoun references for linking or contrasting ideas between and within paragraphs. They present information using different modes of presentation to suit different audiences and to achieve different purposes, in print and digital forms.`,
      ipk: 'Menganalisis unsur kebahasaan dialog opinion',
      materi: 'opinion and thoughts',
      indikator: 'Menganalisa dialog percakapan sehari-hari dalam konteks meminta informasi terkait pendapat',
      bentukSoal: 'Pilihan Ganda',
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* Top Controls Toolbar */}
      <div className="no-print bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3 flex-wrap">
        <button
          id="btn-back-menu-kisi"
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
          <span>Cetak Kisi-Kisi (PDF)</span>
        </button>
      </div>

      {/* Main Kisi-Kisi Document Container */}
      <div className="bg-white border-2 border-slate-900 rounded-xl p-5 sm:p-8 shadow-sm text-slate-900">
        {/* Document Title Header */}
        <div className="text-center space-y-1 mb-6 border-b-2 border-slate-900 pb-4">
          <h2 className="text-base sm:text-lg font-black tracking-wider uppercase text-slate-950">
            KISI-KISI DAN SOAL
          </h2>
          <h3 className="text-sm sm:text-base font-black tracking-wide uppercase text-slate-800">
            {identitas.jenisTes ? identitas.jenisTes.toUpperCase() : 'PENILAIAN TENGAH SEMESTER'}
          </h3>
          <p className="text-sm font-bold text-slate-700">
            TAHUN AJARAN {identitas.tahunAjaran}
          </p>
        </div>

        {/* Identity Metadata Table */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 mb-6 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="w-36 text-slate-700">Satuan Pendidikan</span>
            <span>: {identitas.namaSekolah}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-36 text-slate-700">Alamat Sekolah</span>
            <span>: {identitas.alamatSekolah || 'Jalan Sukorejo - Bawang km 01'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-36 text-slate-700">Kelas / Semester</span>
            <span>: {identitas.kelasSemester}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-36 text-slate-700">Kompetensi Keahlian</span>
            <span>: {identitas.kelasKompetensi}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-36 text-slate-700">Mata Pelajaran</span>
            <span>: {identitas.mataPelajaran}</span>
          </div>
        </div>

        {/* Kisi-Kisi Table */}
        <div className="overflow-x-auto border-2 border-slate-900">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-200 text-slate-950 font-black border-b-2 border-slate-900 text-center">
              <tr>
                <th className="p-2 border border-slate-900 w-12">No</th>
                <th className="p-2 border border-slate-900 min-w-[250px]">CP/ ATP</th>
                <th className="p-2 border border-slate-900 min-w-[150px]">IPK</th>
                <th className="p-2 border border-slate-900 min-w-[130px]">Materi</th>
                <th className="p-2 border border-slate-900 min-w-[180px]">Indikator Soal</th>
                <th className="p-2 border border-slate-900 w-24">Bentuk Soal</th>
                <th className="p-2 border border-slate-900 w-24">Nomor Soal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-[11px]">
              {groupedKisiKisi.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 align-top">
                  <td className="p-2.5 border border-slate-900 text-center font-bold">
                    {idx + 1}
                  </td>
                  <td className="p-2.5 border border-slate-900 leading-relaxed text-justify">
                    {item.cp}
                  </td>
                  <td className="p-2.5 border border-slate-900 font-semibold">
                    {item.ipk}
                  </td>
                  <td className="p-2.5 border border-slate-900 font-bold">
                    {item.materi}
                  </td>
                  <td className="p-2.5 border border-slate-900 leading-relaxed">
                    {item.indikator}
                  </td>
                  <td className="p-2.5 border border-slate-900 text-center font-semibold">
                    {item.bentukSoal}
                  </td>
                  <td className="p-2.5 border border-slate-900 text-center font-black text-xs text-sky-900 whitespace-nowrap">
                    {item.rangeNo}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signature Box */}
        <div className="mt-8 flex justify-between items-start text-xs font-semibold px-4">
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
