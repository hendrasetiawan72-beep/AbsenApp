import React from 'react';
import { SheetTab } from '../../types/kisiKartuSoal';
import { KurikulumMerdekaLogo } from './KurikulumMerdekaLogo';
import { DeepLearningLogo } from './DeepLearningLogo';
import { School, Database, FileText, CheckSquare, Layers, Award } from 'lucide-react';

interface MenuSheetViewProps {
  onNavigateTab: (tab: SheetTab) => void;
}

export const MenuSheetView: React.FC<MenuSheetViewProps> = ({ onNavigateTab }) => {
  return (
    <div className="w-full max-w-5xl mx-auto bg-sky-100/70 border-4 border-sky-300/80 rounded-2xl p-3 sm:p-6 shadow-md transition-all">
      {/* 1. TOP HEADER BANNER (Kantor Guru & SMK Muhiba Building) */}
      <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 rounded-xl overflow-hidden shadow-sm border border-sky-600 mb-5 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between p-3 sm:p-4 gap-4">
          {/* Left Title & Logo */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-full p-1.5 shrink-0 shadow-md ring-2 ring-sky-300">
              <img
                src="/logo-smk.png"
                alt="Logo SMK Muhammadiyah Bawang"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded tracking-wide shadow-2xs mb-0.5">
                KANTOR GURU
              </span>
              <h2 className="text-base sm:text-xl font-black tracking-tight text-white drop-shadow-xs">
                SMK MUHAMMADIYAH BAWANG - BATANG
              </h2>
              <p className="text-[11px] sm:text-xs text-sky-200 font-semibold tracking-wider">
                SMK MUHIBA • BILINGUAL BOARDING SCHOOL
              </p>
            </div>
          </div>

          {/* Right Pillar Architecture Illustration / Tag */}
          <div className="hidden lg:flex items-center gap-3 bg-sky-950/60 border border-sky-500/40 px-4 py-2 rounded-xl backdrop-blur-xs">
            <School className="w-8 h-8 text-amber-400 shrink-0" />
            <div className="text-right">
              <p className="text-xs font-bold text-sky-100">Sistem Pembuat Kisi-Kisi</p>
              <p className="text-[11px] text-amber-300 font-medium">& Kartu Soal Otomatis</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TWO MAIN ACTION BOXES (INPUT DATA & KISI-KISI DAN KARTU SOAL) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-5">
        {/* Left Box: INPUT DATA */}
        <div className="bg-white rounded-xl shadow-xs border-2 border-amber-300 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-amber-300 px-4 py-2.5 text-center border-b border-amber-400">
            <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-wider uppercase">
              INPUT DATA
            </h3>
          </div>

          {/* Buttons Area */}
          <div className="p-4 sm:p-5 flex flex-col gap-3 flex-1 justify-center bg-amber-50/20">
            <button
              id="btn-menu-identitas-guru"
              onClick={() => onNavigateTab('identitas')}
              className="w-full py-2.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm text-cyan-950 bg-gradient-to-r from-cyan-200 to-sky-300 hover:from-cyan-300 hover:to-sky-400 active:scale-[0.98] border border-cyan-400/80 shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <School className="w-4 h-4 text-cyan-900 shrink-0" />
              <span>IDENTITAS GURU</span>
            </button>

            <button
              id="btn-menu-data-master"
              onClick={() => onNavigateTab('master')}
              className="w-full py-2.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm text-cyan-950 bg-gradient-to-r from-cyan-200 to-sky-300 hover:from-cyan-300 hover:to-sky-400 active:scale-[0.98] border border-cyan-400/80 shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Database className="w-4 h-4 text-cyan-900 shrink-0" />
              <span>DATA MASTER</span>
            </button>

            <button
              id="btn-menu-data-soal"
              onClick={() => onNavigateTab('soal')}
              className="w-full py-2.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm text-cyan-950 bg-gradient-to-r from-cyan-200 to-sky-300 hover:from-cyan-300 hover:to-sky-400 active:scale-[0.98] border border-cyan-400/80 shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4 text-cyan-900 shrink-0" />
              <span>DATA SOAL</span>
            </button>
          </div>
        </div>

        {/* Right Box: KISI-KISI DAN KARTU SOAL */}
        <div className="bg-white rounded-xl shadow-xs border-2 border-orange-400 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-orange-500 px-4 py-2.5 text-center border-b border-orange-600">
            <h3 className="text-sm sm:text-base font-black text-white tracking-wider uppercase drop-shadow-xs">
              KISI-KISI DAN KARTU SOAL
            </h3>
          </div>

          {/* Buttons Area */}
          <div className="p-4 sm:p-5 flex flex-col gap-3 flex-1 justify-center bg-orange-50/20">
            <button
              id="btn-menu-kartu-soal"
              onClick={() => onNavigateTab('kartu')}
              className="w-full py-2.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm text-cyan-950 bg-gradient-to-r from-cyan-200 to-sky-300 hover:from-cyan-300 hover:to-sky-400 active:scale-[0.98] border border-cyan-400/80 shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckSquare className="w-4 h-4 text-cyan-900 shrink-0" />
              <span>KARTU SOAL</span>
            </button>

            <button
              id="btn-menu-kisi-kisi"
              onClick={() => onNavigateTab('kisi')}
              className="w-full py-2.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm text-cyan-950 bg-gradient-to-r from-cyan-200 to-sky-300 hover:from-cyan-300 hover:to-sky-400 active:scale-[0.98] border border-cyan-400/80 shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Layers className="w-4 h-4 text-cyan-900 shrink-0" />
              <span>KISI KISI</span>
            </button>

            <button
              id="btn-menu-lampiran-kisi"
              onClick={() => onNavigateTab('lampiran')}
              className="w-full py-2.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm text-cyan-950 bg-gradient-to-r from-cyan-200 to-sky-300 hover:from-cyan-300 hover:to-sky-400 active:scale-[0.98] border border-cyan-400/80 shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4 text-cyan-900 shrink-0" />
              <span>LAMPIRAN KISI-KISI</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. MIDDLE BANNER: Kurikulum Merdeka + Geometric Badge by hndx07 + Deep Learning Logo */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 border-b-4 border-b-rose-600 p-3 sm:p-4 mb-5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Kurikulum Merdeka */}
        <div className="flex items-center">
          <KurikulumMerdekaLogo size="md" />
        </div>

        {/* Center: Geometric App Banner */}
        <div className="flex-1 min-w-[240px] text-center px-2 py-1.5 bg-gradient-to-r from-orange-100 via-emerald-50 to-sky-100 rounded-lg border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-center gap-2 mb-0.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
            <h4 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
              Aplikasi KISI-KISI & KARTU SOAL
            </h4>
          </div>
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-600">
            Kurikulum Merdeka Belajar • SMK Muhammadiyah Bawang
          </p>
          <span className="inline-block mt-0.5 px-2 py-0.5 text-[9px] font-black text-amber-900 bg-amber-200/80 rounded">
            By hndx07
          </span>
        </div>

        {/* Right: Deep Learning */}
        <div className="flex items-center justify-end">
          <DeepLearningLogo size="md" />
        </div>
      </div>

      {/* 4. BOTTOM AREA: LARGE OFFICIAL LOGO SMK MUHAMMADIYAH BAWANG - BATANG */}
      <div className="bg-white/80 backdrop-blur-xs rounded-xl border border-sky-200 p-6 sm:p-10 flex flex-col items-center justify-center text-center shadow-xs">
        <div className="relative max-w-[280px] sm:max-w-[340px] aspect-square flex items-center justify-center mb-3">
          <img
            src="/logo-smk.png"
            alt="Logo SMK Muhammadiyah Bawang"
            className="w-full h-full object-contain drop-shadow-md hover:scale-102 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
        </div>
        <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase">
          SMK MUHAMMADIYAH BAWANG - BATANG
        </h3>
      </div>
    </div>
  );
};
