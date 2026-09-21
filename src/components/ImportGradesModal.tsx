import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  ClipboardPaste,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck,
  Check,
} from 'lucide-react';
import { Student, StudentGrade, GradeColumnHeader } from '../types';
import {
  parseGradesExcelFile,
  parseGradesSpreadsheetText,
  downloadGradesTemplate,
} from '../utils/excel';

interface ImportGradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  headers?: GradeColumnHeader[];
  currentGrades: StudentGrade[];
  classId: string;
  className: string;
  onApplyGrades: (updatedGrades: StudentGrade[]) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const ImportGradesModal: React.FC<ImportGradesModalProps> = ({
  isOpen,
  onClose,
  students,
  headers,
  currentGrades,
  classId,
  className,
  onApplyGrades,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fileName, setFileName] = useState('');
  const [parsedResult, setParsedResult] = useState<{
    updatedGrades: StudentGrade[];
    matchedCount: number;
    unmatchedNames: string[];
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsLoadingFile(true);
    setErrorMessage('');

    try {
      const result = await parseGradesExcelFile(file, students, classId, currentGrades, headers);
      if (result.matchedCount === 0) {
        setErrorMessage(
          'Tidak ada nilai siswa yang cocok. Pastikan terdapat kolom Nama Siswa atau NISN yang sesuai dengan daftar siswa di kelas ini.'
        );
      } else {
        setParsedResult(result);
      }
    } catch (err: any) {
      console.error('Error parsing grades file:', err);
      setErrorMessage(
        'Gagal membaca file Excel/CSV: ' + (err.message || 'Format tidak didukung.')
      );
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleTextChange = (text: string) => {
    setPastedText(text);
    setErrorMessage('');
    if (!text.trim()) {
      setParsedResult(null);
      return;
    }
    try {
      const result = parseGradesSpreadsheetText(text, students, classId, currentGrades, headers);
      if (result.matchedCount === 0) {
        setErrorMessage(
          'Format tidak cocok. Pastikan baris pertama berisi judul kolom (Nama, Formatif 1, dst).'
        );
      } else {
        setParsedResult(result);
      }
    } catch {
      setErrorMessage('Format spreadsheet tidak terbaca dengan benar.');
    }
  };

  const handleApply = () => {
    if (!parsedResult || parsedResult.matchedCount === 0) return;
    onApplyGrades(parsedResult.updatedGrades);
    onShowToast(
      `Berhasil mengimpor nilai untuk ${parsedResult.matchedCount} siswa. Klik "Simpan Penilaian ke Cloud" untuk menyinkronkan.`,
      'success'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">
                Upload / Import Nilai Formatif & Sumatif
              </h3>
              <p className="text-xs text-slate-500">
                Kelas: <span className="font-bold text-indigo-700">{className}</span> ({students.length} Siswa)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Unggah File Excel/CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'paste'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Tempel / Paste Spreadsheet</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => downloadGradesTemplate(students, className, headers)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold rounded-xl transition-colors"
            title="Unduh format spreadsheet siap isi dengan daftar siswa kelas ini"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Format Template</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'upload' ? (
            <div>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-indigo-50/20 transition-all cursor-pointer group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  {isLoadingFile ? (
                    <div className="w-6 h-6 border-2 border-indigo-700 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <UploadCloud className="w-6 h-6" />
                  )}
                </div>
                <p className="font-bold text-slate-800 text-sm">
                  {fileName ? fileName : 'Pilih atau Tarik File Excel / CSV ke Sini'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Mendukung file .xlsx, .xls, atau .csv dari Excel, Google Sheets, atau Dapodik
                </p>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Salin & Tempel Kolom dari Excel / Google Sheets
              </label>
              <textarea
                rows={6}
                value={pastedText}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="No&#9;NISN&#9;Nama Siswa&#9;Formatif 1&#9;Formatif 2&#9;Formatif 3&#9;STS&#9;SAS&#10;1&#9;007123&#9;Ahmad Siswa&#9;85&#9;90&#9;88&#9;80&#9;85"
                className="w-full text-xs font-mono p-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50/50 leading-relaxed"
              />
            </div>
          )}

          {/* Error notice */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Preview of Matched Scores */}
          {parsedResult && parsedResult.matchedCount > 0 && (
            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    Ditemukan nilai untuk <strong>{parsedResult.matchedCount} dari {students.length} siswa</strong>.
                  </span>
                </div>
                <span className="text-[11px] bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                  Siap Diterapkan
                </span>
              </div>

              {parsedResult.unmatchedNames.length > 0 && (
                <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  <span className="font-bold">Perhatian:</span> Terdapat {parsedResult.unmatchedNames.length} nama pada file yang tidak cocok dengan kelas ini:{' '}
                  {parsedResult.unmatchedNames.slice(0, 3).join(', ')}
                  {parsedResult.unmatchedNames.length > 3 ? '...' : ''}
                </div>
              )}

              {/* Sample extracted preview */}
              <div className="max-h-40 overflow-y-auto rounded-xl border border-emerald-200 bg-white">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-emerald-100/50 text-emerald-900 font-bold border-b border-emerald-200">
                    <tr>
                      <th className="p-2">Siswa</th>
                      <th className="p-2 text-center">F1</th>
                      <th className="p-2 text-center">F2</th>
                      <th className="p-2 text-center">F3</th>
                      <th className="p-2 text-center">F4</th>
                      <th className="p-2 text-center">STS</th>
                      <th className="p-2 text-center">SAS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50">
                    {parsedResult.updatedGrades.slice(0, 5).map((g) => {
                      const st = students.find((s) => s.id === g.studentId);
                      return (
                        <tr key={g.studentId}>
                          <td className="p-2 font-medium text-slate-800 truncate max-w-[140px]">
                            {st?.nama || g.studentId}
                          </td>
                          <td className="p-2 text-center font-bold text-slate-700">
                            {g.monthlyGrades?.['m0_c0'] ?? g.formatif1 ?? '-'}
                          </td>
                          <td className="p-2 text-center font-bold text-slate-700">
                            {g.monthlyGrades?.['m0_c1'] ?? g.formatif2 ?? '-'}
                          </td>
                          <td className="p-2 text-center font-bold text-slate-700">
                            {g.monthlyGrades?.['m0_c2'] ?? g.formatif3 ?? '-'}
                          </td>
                          <td className="p-2 text-center font-bold text-slate-700">
                            {g.monthlyGrades?.['m0_c3'] ?? g.formatif4 ?? '-'}
                          </td>
                          <td className="p-2 text-center font-bold text-amber-700">
                            {g.monthlyGrades?.['sumatif_tengah'] ?? g.sumatifTengah ?? '-'}
                          </td>
                          <td className="p-2 text-center font-bold text-emerald-700">
                            {g.monthlyGrades?.['sumatif_akhir'] ?? g.sumatifAkhir ?? '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!parsedResult || parsedResult.matchedCount === 0}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Terapkan Nilai ({parsedResult?.matchedCount || 0} Siswa)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
