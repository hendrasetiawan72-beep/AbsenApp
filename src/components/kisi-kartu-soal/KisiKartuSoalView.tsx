import React, { useState, useEffect, useRef } from 'react';
import {
  SchoolIdentity,
  MasterSoalItem,
  SoalItem,
  SheetTab,
} from '../../types/kisiKartuSoal';
import {
  DEFAULT_SCHOOL_IDENTITY,
  DEFAULT_MASTER_DATA,
  DEFAULT_SOAL_DATA,
} from '../../data/kisiKartuSoalDefaultData';
import {
  exportCurrentDataToExcel,
  downloadSampleTemplateExcel,
  parseUploadedExcel,
} from '../../utils/kisiKartuSoalExcel';
import { MenuSheetView } from './MenuSheetView';
import { IdentitasSheetView } from './IdentitasSheetView';
import { DataMasterSheetView } from './DataMasterSheetView';
import { DataSoalSheetView } from './DataSoalSheetView';
import { KartuSoalSheetView } from './KartuSoalSheetView';
import { KisiKisiSheetView } from './KisiKisiSheetView';
import { LampiranKisiKisiSheetView } from './LampiranKisiKisiSheetView';
import {
  Upload,
  Download,
  FileSpreadsheet,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  ChevronRight,
} from 'lucide-react';

const STORAGE_KEY = 'sim_kisi_kartu_soal_v1';

export const KisiKartuSoalView: React.FC = () => {
  // State Initialization with LocalStorage fallback
  const [identitas, setIdentitas] = useState<SchoolIdentity>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_identitas`);
      return saved ? JSON.parse(saved) : DEFAULT_SCHOOL_IDENTITY;
    } catch {
      return DEFAULT_SCHOOL_IDENTITY;
    }
  });

  const [masterData, setMasterData] = useState<MasterSoalItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_master`);
      return saved ? JSON.parse(saved) : DEFAULT_MASTER_DATA;
    } catch {
      return DEFAULT_MASTER_DATA;
    }
  });

  const [soalData, setSoalData] = useState<SoalItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_soal`);
      return saved ? JSON.parse(saved) : DEFAULT_SOAL_DATA;
    } catch {
      return DEFAULT_SOAL_DATA;
    }
  });

  const [activeTab, setActiveTab] = useState<SheetTab>('menu');
  const [activeSoalNo, setActiveSoalNo] = useState<number>(30); // Defaults to question 30 like screenshot 4!
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_identitas`, JSON.stringify(identitas));
      localStorage.setItem(`${STORAGE_KEY}_master`, JSON.stringify(masterData));
      localStorage.setItem(`${STORAGE_KEY}_soal`, JSON.stringify(soalData));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  }, [identitas, masterData, soalData]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Handle Excel File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const parsed = await parseUploadedExcel(file);
      let updatedCount = 0;

      if (parsed.identitas && Object.keys(parsed.identitas).length > 0) {
        setIdentitas((prev) => ({ ...prev, ...parsed.identitas }));
      }

      if (parsed.masterData && parsed.masterData.length > 0) {
        setMasterData(parsed.masterData);
        updatedCount += parsed.masterData.length;
      }

      if (parsed.soalData && parsed.soalData.length > 0) {
        setSoalData(parsed.soalData);
        setActiveSoalNo(parsed.soalData[0].noSoal);
        showToast(
          `Berhasil memuat ${parsed.soalData.length} butir soal dari spreadsheet "${file.name}"!`,
          'success'
        );
      } else {
        showToast(
          `File "${file.name}" berhasil diunggah. Pastikan kolom sesuai format contoh.`,
          'info'
        );
      }
    } catch (err: any) {
      console.error(err);
      showToast(`Gagal membaca spreadsheet: ${err.message || 'Format tidak valid'}`, 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Export Excel
  const handleExportExcel = () => {
    try {
      exportCurrentDataToExcel(identitas, masterData, soalData);
      showToast('Seluruh data berhasil diekspor ke format Excel (.xlsx)', 'success');
    } catch (err: any) {
      showToast(`Gagal mengekspor data: ${err.message}`, 'error');
    }
  };

  // Handle Download Template Excel
  const handleDownloadTemplate = () => {
    try {
      downloadSampleTemplateExcel();
      showToast('Template Excel berisi 50 soal contoh berhasil diunduh', 'success');
    } catch (err: any) {
      showToast(`Gagal mengunduh template: ${err.message}`, 'error');
    }
  };

  // Sheet Tabs Config (Matches the bottom tabs in the screenshot)
  const tabsList: { id: SheetTab; label: string; color: string }[] = [
    { id: 'menu', label: 'MENU', color: 'bg-sky-600' },
    { id: 'identitas', label: 'IDENTITAS GURU', color: 'bg-emerald-600' },
    { id: 'master', label: 'DATA MASTER', color: 'bg-cyan-600' },
    { id: 'soal', label: 'DATA SOAL', color: 'bg-rose-600' },
    { id: 'kartu', label: 'KARTU SOAL', color: 'bg-amber-600' },
    { id: 'kisi', label: 'KISI-KISI', color: 'bg-indigo-600' },
    { id: 'lampiran', label: 'LAMP KISI_KISI', color: 'bg-purple-600' },
  ];

  return (
    <div className="space-y-4 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`no-print fixed bottom-14 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 transition-all text-xs font-bold ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : toast.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-300'
              : 'bg-sky-50 text-sky-900 border-sky-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <HelpCircle className="w-4 h-4 text-sky-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Application Header & Action Controls Bar */}
      <div className="no-print bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                Aplikasi Kisi-Kisi & Kartu Soal
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                Kumer Edited
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Sesuai contoh format spreadsheet SMK Muhammadiyah Bawang
            </p>
          </div>
        </div>

        {/* Action Buttons: Upload Spreadsheet, Download Template, Export Excel */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />

          {/* Upload Button */}
          <button
            id="btn-upload-spreadsheet-soal"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            title="Unggah file spreadsheet soal (.xlsx, .xls, .csv)"
          >
            <Upload className="w-4 h-4" />
            <span>{isUploading ? 'Memproses...' : 'Upload Spreadsheet'}</span>
          </button>

          {/* Download Template Button */}
          <button
            id="btn-download-template-soal"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer shadow-2xs"
            title="Unduh contoh template spreadsheet (.xlsx) dengan 50 soal"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Unduh Template</span>
          </button>

          {/* Export Full Excel */}
          <button
            id="btn-export-excel-kisi"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 transition-colors cursor-pointer shadow-2xs"
            title="Ekspor seluruh lembar ke file Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            <span>Ekspor Excel</span>
          </button>
        </div>
      </div>

      {/* Main Sheet Viewport */}
      <div className="min-h-[600px] transition-all">
        {activeTab === 'menu' && (
          <MenuSheetView onNavigateTab={(tab) => setActiveTab(tab)} />
        )}

        {activeTab === 'identitas' && (
          <IdentitasSheetView
            identitas={identitas}
            onChangeIdentitas={setIdentitas}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'master' && (
          <DataMasterSheetView
            masterData={masterData}
            onChangeMasterData={setMasterData}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'soal' && (
          <DataSoalSheetView
            soalData={soalData}
            onChangeSoalData={setSoalData}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onSelectSoalForCard={(no) => {
              setActiveSoalNo(no);
              setActiveTab('kartu');
            }}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'kartu' && (
          <KartuSoalSheetView
            identitas={identitas}
            masterData={masterData}
            soalData={soalData}
            currentSoalNo={activeSoalNo}
            onSelectSoalNo={setActiveSoalNo}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onUpdateSoal={(updated) => {
              setSoalData((prev) =>
                prev.map((s) => (s.noSoal === updated.noSoal ? updated : s))
              );
              showToast(`Kartu soal no #${updated.noSoal} diperbarui`, 'success');
            }}
          />
        )}

        {activeTab === 'kisi' && (
          <KisiKisiSheetView
            identitas={identitas}
            masterData={masterData}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'lampiran' && (
          <LampiranKisiKisiSheetView
            soalData={soalData}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}
      </div>

      {/* SPREADSHEET BOTTOM TABS BAR (Exact feel of Excel & Google Sheets) */}
      <div className="no-print sticky bottom-0 z-20 bg-slate-200/95 backdrop-blur-md border-t-2 border-slate-300 shadow-md px-3 py-1.5 rounded-t-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="text-[11px] font-black text-slate-500 uppercase px-1.5 hidden md:inline">
              SHEETS:
            </span>

            {tabsList.map((t) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  id={`sheet-tab-${t.id}`}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-3 py-1.5 rounded-t-lg font-black text-xs transition-all cursor-pointer whitespace-nowrap border-b-2 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-white text-slate-900 border-b-amber-500 shadow-xs ring-1 ring-slate-300/60 -translate-y-0.5'
                      : 'bg-slate-100 text-slate-600 hover:bg-white/70 hover:text-slate-900 border-b-transparent'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isActive ? t.color : 'bg-slate-400'
                    }`}
                  />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-500 font-bold hidden lg:block">
            KiSi kartu soal Kumer Edited • SMK MUHIBA
          </div>
        </div>
      </div>
    </div>
  );
};
