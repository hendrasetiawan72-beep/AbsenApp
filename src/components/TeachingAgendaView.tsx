import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  Layers,
  FileText,
  Download,
  Printer,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Search,
  Filter,
  CheckSquare,
  Square,
  ChevronDown,
  Sparkles,
  School,
  X,
  ArrowRight,
} from 'lucide-react';
import { TeachingAgenda, ClassRoom, TeacherProfile } from '../types';
import {
  formatIndonesianDate,
  getDayName,
  formatJamKeDisplay,
  exportAgendasToExcel,
  exportSingleAgendaToWord,
  exportAllAgendasToWord,
} from '../utils/agendaExport';

interface TeachingAgendaViewProps {
  agendas: TeachingAgenda[];
  classes: ClassRoom[];
  activeClassId: string;
  teacher: TeacherProfile;
  onSaveAgenda: (agenda: TeachingAgenda) => Promise<void> | void;
  onDeleteAgenda: (agendaId: string) => Promise<void> | void;
}

// 12 Jam Mengajar list as shown in the schedule
const JAM_LIST = [
  { jam: 1, label: '1. (07:15 - 07:45)', time: '07:15 - 07:45' },
  { jam: 2, label: '2. (07:45 - 08:15)', time: '07:45 - 08:15' },
  { jam: 3, label: '3. (08:15 - 08:45)', time: '08:15 - 08:45' },
  { jam: 4, label: '4. (08:45 - 09:15)', time: '08:45 - 09:15' },
  { jam: 5, label: '5. (09:30 - 10:00)', time: '09:30 - 10:00' },
  { jam: 6, label: '6. (10:00 - 10:30)', time: '10:00 - 10:30' },
  { jam: 7, label: '7. (10:30 - 11:00)', time: '10:30 - 11:00' },
  { jam: 8, label: '8. (11:00 - 11:30)', time: '11:00 - 11:30' },
  { jam: 9, label: '9. (11:30 - 12:00)', time: '11:30 - 12:00' },
  { jam: 10, label: '10. (13:00 - 13:40)', time: '13:00 - 13:40' },
  { jam: 11, label: '11. (13:40 - 14:20)', time: '13:40 - 14:20' },
  { jam: 12, label: '12. (14:20 - 15:00)', time: '14:20 - 15:00' },
];

export const TeachingAgendaView: React.FC<TeachingAgendaViewProps> = ({
  agendas,
  classes,
  activeClassId,
  teacher,
  onSaveAgenda,
  onDeleteAgenda,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedJam, setSelectedJam] = useState<number[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(activeClassId || classes[0]?.id || '');
  const [tanggal, setTanggal] = useState<string>(todayStr);
  const [materiAjar, setMateriAjar] = useState<string>('');
  const [kegiatan, setKegiatan] = useState<string>('');
  const [catatan, setCatatan] = useState<string>('');

  // Form validation errors
  const [touched, setTouched] = useState(false);
  const [jamError, setJamError] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Filter & Search in Table
  const [filterClass, setFilterClass] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Print Preview Modal State
  const [previewAgenda, setPreviewAgenda] = useState<TeachingAgenda | null>(null);
  const [isConsolidatedPrint, setIsConsolidatedPrint] = useState(false);

  // Derived selected class name
  const currentSelectedClass = classes.find((c) => c.id === selectedClassId);

  // Calculate time span string from selected jamKe
  const calculateJamRentang = (jamArray: number[]): string => {
    if (jamArray.length === 0) return '';
    const sorted = [...jamArray].sort((a, b) => a - b);
    const first = JAM_LIST.find((j) => j.jam === sorted[0]);
    const last = JAM_LIST.find((j) => j.jam === sorted[sorted.length - 1]);
    if (first && last) {
      const startTime = first.time.split('-')[0].trim();
      const endTime = last.time.split('-')[1].trim();
      return `${startTime} - ${endTime}`;
    }
    return '';
  };

  const handleToggleJam = (jamNumber: number) => {
    setJamError(false);
    setSelectedJam((prev) => {
      if (prev.includes(jamNumber)) {
        return prev.filter((j) => j !== jamNumber);
      } else {
        return [...prev, jamNumber].sort((a, b) => a - b);
      }
    });
  };

  const handleSelectJamPreset = (type: 'pagi' | 'siang' | 'sore' | 'all' | 'clear') => {
    setJamError(false);
    if (type === 'pagi') setSelectedJam([1, 2, 3, 4]);
    else if (type === 'siang') setSelectedJam([5, 6, 7, 8]);
    else if (type === 'sore') setSelectedJam([9, 10, 11, 12]);
    else if (type === 'all') setSelectedJam(JAM_LIST.map((j) => j.jam));
    else if (type === 'clear') setSelectedJam([]);
  };

  const handleStartEdit = (agenda: TeachingAgenda) => {
    setEditingId(agenda.id);
    setSelectedJam(agenda.jamKe || []);
    setSelectedClassId(agenda.classId);
    setTanggal(agenda.tanggal);
    setMateriAjar(agenda.materiAjar);
    setKegiatan(agenda.kegiatan);
    setCatatan(agenda.catatan || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setSelectedJam([]);
    setMateriAjar('');
    setKegiatan('');
    setCatatan('');
    setTanggal(todayStr);
    setJamError(false);
    setTouched(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (selectedJam.length === 0) {
      setJamError(true);
      return;
    }

    if (!selectedClassId || !materiAjar.trim() || !kegiatan.trim()) {
      return;
    }

    const cls = classes.find((c) => c.id === selectedClassId);
    const className = cls?.namaKelas || 'Kelas SMK';
    const hari = getDayName(tanggal);
    const jamRentang = calculateJamRentang(selectedJam);

    const agendaData: TeachingAgenda = {
      id: editingId || 'agenda-' + Date.now(),
      tanggal,
      hari,
      jamKe: [...selectedJam].sort((a, b) => a - b),
      jamRentang,
      classId: selectedClassId,
      className,
      materiAjar: materiAjar.trim(),
      kegiatan: kegiatan.trim(),
      catatan: catatan.trim(),
      createdAt: new Date().toISOString(),
    };

    await onSaveAgenda(agendaData);

    setSaveSuccessMsg(
      editingId
        ? 'Perubahan agenda mengajar berhasil disimpan!'
        : 'Agenda mengajar baru berhasil disimpan!'
    );

    // Reset Form
    handleCancelEdit();

    setTimeout(() => {
      setSaveSuccessMsg(null);
    }, 4000);
  };

  // Filtered Agendas
  const filteredAgendas = useMemo(() => {
    return agendas
      .filter((a) => {
        if (filterClass !== 'all' && a.classId !== filterClass) return false;
        if (searchKeyword.trim()) {
          const q = searchKeyword.toLowerCase();
          const matchMateri = (a.materiAjar || '').toLowerCase().includes(q);
          const matchKegiatan = (a.kegiatan || '').toLowerCase().includes(q);
          const matchKelas = (a.className || '').toLowerCase().includes(q);
          const matchTanggal = (a.tanggal || '').includes(q);
          return matchMateri || matchKegiatan || matchKelas || matchTanggal;
        }
        return true;
      })
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  }, [agendas, filterClass, searchKeyword]);

  const activeClassNameForFilter =
    filterClass === 'all'
      ? 'Semua Kelas'
      : classes.find((c) => c.id === filterClass)?.namaKelas || 'Kelas Terpilih';

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-blue-800 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-indigo-100 backdrop-blur-md mb-2">
              <BookOpen className="w-3.5 h-3.5 text-yellow-300" />
              <span>Jurnal Harian Guru • SMK Muhammadiyah Bawang</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Agenda & Jurnal Mengajar
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100/90 mt-1 max-w-2xl leading-relaxed">
              Catat jam mengajar, kelas, materi pembelajaran, dan rincian kegiatan mengajar harian.
              File agenda yang sudah selesai diisi dapat langsung diunduh dalam format <strong>Word (.doc)</strong>, <strong>Excel (.xlsx)</strong>, atau dicetak/PDF resmi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsConsolidatedPrint(true);
                setPreviewAgenda(null);
              }}
              disabled={filteredAgendas.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white text-indigo-900 hover:bg-indigo-50 active:bg-indigo-100 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4 text-indigo-700" />
              <span>Cetak / PDF Rekap</span>
            </button>
            <button
              type="button"
              onClick={() => exportAllAgendasToWord(filteredAgendas, teacher, activeClassNameForFilter)}
              disabled={filteredAgendas.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-950/60 hover:bg-indigo-950 text-white border border-white/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-4 h-4 text-blue-300" />
              <span>Download Word (.doc)</span>
            </button>
            <button
              type="button"
              onClick={() => exportAgendasToExcel(filteredAgendas, teacher, activeClassNameForFilter)}
              disabled={filteredAgendas.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
              <span>Download Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5 font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid: Left Column = Form (Structured like screenshot), Right Column = Summary / Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* FORM SECTION (Exactly like attachment) */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header of the Form */}
            <div className="bg-white rounded-2xl border-t-8 border-t-indigo-600 border-x border-b border-slate-200 p-6 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    {editingId ? 'Edit Agenda Mengajar' : 'Formulir Agenda Mengajar'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Silakan lengkapi jam ke, kelas, tanggal, materi ajar, dan kegiatan pembelajaran di bawah ini.
                  </p>
                </div>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl border border-rose-200"
                  >
                    Batal Edit
                  </button>
                )}
              </div>
              <div className="mt-3 text-xs text-rose-600 font-medium">
                * Menunjukkan pertanyaan wajib diisi
              </div>
            </div>

            {/* CARD 1: Jam ke * (Exact from screenshot) */}
            <div
              className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-xs transition-all ${
                jamError
                  ? 'border-rose-300 ring-2 ring-rose-100 bg-rose-50/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <label className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-1.5">
                  <span>Jam ke</span>
                  <span className="text-rose-500 font-bold">*</span>
                  {selectedJam.length > 0 && (
                    <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                      {selectedJam.length} jam terpilih ({calculateJamRentang(selectedJam)})
                    </span>
                  )}
                </label>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-slate-400 font-medium mr-1">Pilih cepat:</span>
                  <button
                    type="button"
                    onClick={() => handleSelectJamPreset('pagi')}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded-md font-medium border border-slate-200 cursor-pointer"
                  >
                    1-4
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectJamPreset('siang')}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded-md font-medium border border-slate-200 cursor-pointer"
                  >
                    5-8
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectJamPreset('sore')}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded-md font-medium border border-slate-200 cursor-pointer"
                  >
                    9-12
                  </button>
                  {selectedJam.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleSelectJamPreset('clear')}
                      className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-md font-medium border border-rose-200 cursor-pointer hover:bg-rose-100"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Checkboxes List matching the 12 options in screenshot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {JAM_LIST.map((item) => {
                  const isChecked = selectedJam.includes(item.jam);
                  return (
                    <button
                      type="button"
                      key={item.jam}
                      onClick={() => handleToggleJam(item.jam)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-indigo-50/80 border-indigo-300 text-indigo-900 font-medium'
                          : 'bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 ${
                          isChecked
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <span className="text-xs sm:text-sm font-sans tracking-wide">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Red validation message from screenshot */}
              {jamError && (
                <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>This is a required question (Pilih minimal satu jam mengajar)</span>
                </div>
              )}
            </div>

            {/* CARD 2: Kelas * (Exact from screenshot) */}
            <div className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 p-5 sm:p-6 shadow-xs transition-all">
              <label className="block text-sm sm:text-base font-semibold text-slate-900 mb-2">
                <span>Kelas</span>
                <span className="text-rose-500 font-bold ml-1">*</span>
              </label>

              <div className="relative max-w-sm">
                <select
                  required
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full appearance-none px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 pr-10 cursor-pointer shadow-2xs"
                >
                  <option value="" disabled>
                    Choose
                  </option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.namaKelas} — {cls.mataPelajaran}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {currentSelectedClass && (
                <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                  <span>
                    Mata Pelajaran: <strong>{currentSelectedClass.mataPelajaran}</strong> • KKM: {currentSelectedClass.kkm}
                  </span>
                </div>
              )}
            </div>

            {/* CARD 3: Hari/ Tanggal * (Exact from screenshot) */}
            <div className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 p-5 sm:p-6 shadow-xs transition-all">
              <label className="block text-sm sm:text-base font-semibold text-slate-900 mb-1">
                <span>Hari/ Tanggal</span>
                <span className="text-rose-500 font-bold ml-1">*</span>
              </label>
              <p className="text-xs text-slate-400 mb-2">Date</p>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative max-w-xs">
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs cursor-pointer"
                  />
                </div>
                {tanggal && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>
                      {getDayName(tanggal)}, {formatIndonesianDate(tanggal)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* CARD 4: Materi Ajar * (Exact from screenshot) */}
            <div className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 p-5 sm:p-6 shadow-xs transition-all">
              <label className="block text-sm sm:text-base font-semibold text-slate-900 mb-2">
                <span>Materi Ajar</span>
                <span className="text-rose-500 font-bold ml-1">*</span>
              </label>

              <textarea
                required
                rows={3}
                value={materiAjar}
                onChange={(e) => setMateriAjar(e.target.value)}
                placeholder="Your answer"
                className="w-full px-4 py-3 bg-white border-b-2 border-b-slate-300 border-x-0 border-t-0 focus:border-b-indigo-600 focus:outline-none text-sm text-slate-800 transition-all placeholder:text-slate-400 placeholder:italic resize-y"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Contoh: Instalasi dan Konfigurasi Jaringan LAN, Desain Antarmuka Figma, Algoritma Percabangan.
              </p>
            </div>

            {/* CARD 5: Kegiatan * (Exact from screenshot) */}
            <div className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 p-5 sm:p-6 shadow-xs transition-all">
              <label className="block text-sm sm:text-base font-semibold text-slate-900 mb-2">
                <span>Kegiatan</span>
                <span className="text-rose-500 font-bold ml-1">*</span>
              </label>

              <textarea
                required
                rows={4}
                value={kegiatan}
                onChange={(e) => setKegiatan(e.target.value)}
                placeholder="Your answer"
                className="w-full px-4 py-3 bg-white border-b-2 border-b-slate-300 border-x-0 border-t-0 focus:border-b-indigo-600 focus:outline-none text-sm text-slate-800 transition-all placeholder:text-slate-400 placeholder:italic resize-y"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Contoh: Guru memaparkan materi slide PPT, dilanjutkan praktikum instalasi kabel UTP oleh siswa, dan diakhiri kuis evaluasi pemahaman.
              </p>
            </div>

            {/* CARD 6: Catatan / Refleksi Tambahan (Opsional) */}
            <div className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 p-5 sm:p-6 shadow-xs transition-all">
              <label className="block text-sm sm:text-base font-semibold text-slate-900 mb-1">
                <span>Catatan Tambahan / Kehadiran Siswa</span>
                <span className="text-slate-400 font-normal text-xs ml-2">(Opsional)</span>
              </label>

              <input
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Catatan kendala, tindak lanjut, atau keterangan siswa yang tidak hadir..."
                className="w-full px-4 py-3 bg-white border-b-2 border-b-slate-300 border-x-0 border-t-0 focus:border-b-indigo-600 focus:outline-none text-sm text-slate-800 transition-all placeholder:text-slate-400 placeholder:italic"
              />
            </div>

            {/* Form Submit & Reset Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingId ? 'Simpan Perubahan Agenda' : 'Kirim / Simpan Agenda'}</span>
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 underline underline-offset-4 cursor-pointer"
              >
                Kosongkan formulir
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: Summary & Quick Download Hub */}
        <div className="lg:col-span-4 space-y-5">
          {/* Quick Info Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
              <School className="w-4 h-4 text-indigo-600" />
              <span>Identitas Guru Pengampu</span>
            </h3>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Guru</span>
                <span className="font-semibold text-slate-800">{teacher.namaGuru || 'Guru SMK'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">NBM</span>
                <span className="font-mono text-slate-800">{teacher.nbm || teacher.nip || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Sekolah</span>
                <span className="font-semibold text-slate-800">{teacher.namaSekolah}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Tahun Ajaran</span>
                <span className="font-semibold text-slate-800">{teacher.tahunAjaran} ({teacher.semester})</span>
              </div>
            </div>
          </div>

          {/* Download Center Card */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
              <Download className="w-4 h-4 text-yellow-400" />
              <span>Download File Agenda Mengajar</span>
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Unduh seluruh berkas agenda yang sudah selesai Anda isi untuk keperluan arsip kurikulum, laporan supervisi, atau bukti kinerja mengajar.
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => exportAllAgendasToWord(filteredAgendas, teacher, activeClassNameForFilter)}
                disabled={filteredAgendas.length === 0}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/15 transition-colors cursor-pointer disabled:opacity-40"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-300" />
                  <span>Download Dokumen Word (.doc)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
              </button>

              <button
                type="button"
                onClick={() => exportAgendasToExcel(filteredAgendas, teacher, activeClassNameForFilter)}
                disabled={filteredAgendas.length === 0}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600/90 hover:bg-emerald-600 text-white transition-colors cursor-pointer disabled:opacity-40"
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                  <span>Download Excel (.xlsx)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-100" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsConsolidatedPrint(true);
                  setPreviewAgenda(null);
                }}
                disabled={filteredAgendas.length === 0}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40"
              >
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-indigo-700" />
                  <span>Cetak / Simpan PDF Resmi</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Total agenda tersimpan:</span>
              <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded-md">
                {agendas.length} Entri
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* COMPLETED AGENDAS TABLE SECTION ("terdapat download file yang sudah selesai diisi") */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Daftar Agenda Mengajar Yang Sudah Selesai Diisi
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Setiap berkas agenda dapat diunduh per pertemuan atau diunduh secara rekapitulasi semester.
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari materi, kegiatan..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48 sm:w-56"
              />
            </div>

            <div className="relative">
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="all">Semua Kelas ({agendas.length})</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.namaKelas}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredAgendas.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-indigo-600">
              <FileText className="w-7 h-7 opacity-70" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Belum Ada Agenda Mengajar</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
              Isi formulir agenda mengajar di atas untuk mulai mencatat jurnal harian dan mengunduh berkasnya.
            </p>
          </div>
        ) : (
          /* Table View of Filled Agendas */
          <div className="overflow-x-auto mt-4 -mx-6 sm:mx-0">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-slate-50/80 border-y border-slate-200 text-slate-700 text-xs font-semibold">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4 w-32">Hari / Tanggal</th>
                  <th className="py-3 px-4 w-36">Jam Pelajaran</th>
                  <th className="py-3 px-4 w-32">Kelas</th>
                  <th className="py-3 px-4">Materi Ajar</th>
                  <th className="py-3 px-4">Kegiatan Pembelajaran</th>
                  <th className="py-3 px-4 text-center w-36">Aksi & Unduh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                {filteredAgendas.map((item, index) => {
                  const targetClass = classes.find((c) => c.id === item.classId);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 text-center font-medium text-slate-400">
                        {index + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {item.hari || getDayName(item.tanggal)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {formatIndonesianDate(item.tanggal)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-50/90 px-2 py-0.5 rounded-md text-[11px]">
                          <Clock className="w-3 h-3" />
                          <span>{formatJamKeDisplay(item.jamKe)}</span>
                        </div>
                        {item.jamRentang && (
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            {item.jamRentang}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {item.className || targetClass?.namaKelas || '-'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 leading-snug">
                          {item.materiAjar}
                        </div>
                        {item.catatan && (
                          <div className="text-[11px] text-slate-400 mt-1 italic">
                            Catatan: {item.catatan}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-slate-600 line-clamp-2 leading-relaxed">
                          {item.kegiatan}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Download Single Word Doc */}
                          <button
                            type="button"
                            onClick={() => exportSingleAgendaToWord(item, teacher, targetClass)}
                            title="Download berkas Word (.doc)"
                            className="p-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {/* Print / PDF Single Agenda */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsConsolidatedPrint(false);
                              setPreviewAgenda(item);
                            }}
                            title="Cetak / Simpan PDF format resmi"
                            className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Item */}
                          <button
                            type="button"
                            onClick={() => handleStartEdit(item)}
                            title="Edit agenda"
                            className="p-1.5 text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Item */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Hapus agenda tanggal ${formatIndonesianDate(item.tanggal)}?`)) {
                                onDeleteAgenda(item.id);
                              }
                            }}
                            title="Hapus agenda"
                            className="p-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PRINT / PDF OFFICIAL PREVIEW MODAL */}
      {(previewAgenda || isConsolidatedPrint) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Actions Bar (hidden when printing) */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 no-print">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                  {isConsolidatedPrint
                    ? 'Cetak Buku Jurnal & Rekap Agenda Mengajar'
                    : 'Cetak Lembar Agenda Harian Mengajar'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Save as PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewAgenda(null);
                    setIsConsolidatedPrint(false);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="overflow-y-auto p-6 sm:p-10 font-serif text-slate-900 leading-normal">
              {isConsolidatedPrint ? (
                /* Consolidated Report */
                <div>
                  <div className="text-center mb-6">
                    <h2 className="text-base sm:text-lg font-bold uppercase tracking-wide underline">
                      BUKU JURNAL & AGENDA HARIAN MENGAJAR GURU
                    </h2>
                    <p className="text-xs font-sans text-slate-600 mt-0.5">
                      Tahun Pelajaran {teacher.tahunAjaran} • Semester {teacher.semester}
                    </p>
                  </div>

                  <table className="w-full text-xs font-sans mb-4">
                    <tbody>
                      <tr>
                        <td className="w-28 font-semibold">Nama Guru</td>
                        <td className="w-3">:</td>
                        <td className="font-bold">{teacher.namaGuru || '-'}</td>
                        <td className="w-28 font-semibold">Mata Pelajaran</td>
                        <td className="w-3">:</td>
                        <td>{teacher.mataPelajaranUtama || '-'}</td>
                      </tr>
                      <tr>
                        <td className="font-semibold">NBM</td>
                        <td>:</td>
                        <td>{teacher.nbm || teacher.nip || '-'}</td>
                        <td className="font-semibold">Target Kelas</td>
                        <td>:</td>
                        <td className="font-bold">{activeClassNameForFilter}</td>
                      </tr>
                    </tbody>
                  </table>

                  <table className="w-full border-collapse border border-slate-900 text-[11px] font-sans">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-900 p-1.5 text-center w-8">No</th>
                        <th className="border border-slate-900 p-1.5 text-center w-28">Hari, Tanggal</th>
                        <th className="border border-slate-900 p-1.5 text-center w-24">Jam Ke</th>
                        <th className="border border-slate-900 p-1.5 text-center w-20">Kelas</th>
                        <th className="border border-slate-900 p-1.5">Materi Ajar</th>
                        <th className="border border-slate-900 p-1.5">Kegiatan Pembelajaran</th>
                        <th className="border border-slate-900 p-1.5 w-24">Catatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAgendas.map((ag, idx) => (
                        <tr key={ag.id}>
                          <td className="border border-slate-900 p-1.5 text-center">{idx + 1}</td>
                          <td className="border border-slate-900 p-1.5">
                            {ag.hari || getDayName(ag.tanggal)},<br />
                            {formatIndonesianDate(ag.tanggal)}
                          </td>
                          <td className="border border-slate-900 p-1.5 text-center">
                            {formatJamKeDisplay(ag.jamKe)}
                            <br />
                            <span className="text-[10px] text-slate-500">{ag.jamRentang}</span>
                          </td>
                          <td className="border border-slate-900 p-1.5 text-center font-semibold">
                            {ag.className}
                          </td>
                          <td className="border border-slate-900 p-1.5 font-semibold">
                            {ag.materiAjar}
                          </td>
                          <td className="border border-slate-900 p-1.5">{ag.kegiatan}</td>
                          <td className="border border-slate-900 p-1.5 text-[10px]">
                            {ag.catatan || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : previewAgenda ? (
                /* Single Agenda Sheet */
                <div>
                  <div className="text-center mb-6">
                    <h2 className="text-base sm:text-lg font-bold uppercase tracking-wide underline">
                      AGENDA & JURNAL HARIAN MENGAJAR
                    </h2>
                    <p className="text-xs font-sans text-slate-600 mt-0.5">
                      Tahun Pelajaran {teacher.tahunAjaran} • Semester {teacher.semester}
                    </p>
                  </div>

                  <table className="w-full text-xs font-sans mb-6 border-collapse">
                    <tbody>
                      <tr className="border-b border-slate-100 py-1">
                        <td className="w-40 font-semibold py-1">Nama Guru Pengampu</td>
                        <td className="w-3">:</td>
                        <td className="font-bold">{teacher.namaGuru || '-'}</td>
                      </tr>
                      <tr className="border-b border-slate-100 py-1">
                        <td className="font-semibold py-1">NBM</td>
                        <td>:</td>
                        <td>{teacher.nbm || teacher.nip || '-'}</td>
                      </tr>
                      <tr className="border-b border-slate-100 py-1">
                        <td className="font-semibold py-1">Kelas</td>
                        <td>:</td>
                        <td className="font-bold">{previewAgenda.className}</td>
                      </tr>
                      <tr className="border-b border-slate-100 py-1">
                        <td className="font-semibold py-1">Hari / Tanggal</td>
                        <td>:</td>
                        <td>
                          {previewAgenda.hari || getDayName(previewAgenda.tanggal)},{' '}
                          {formatIndonesianDate(previewAgenda.tanggal)}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-100 py-1">
                        <td className="font-semibold py-1">Jam Ke / Waktu</td>
                        <td>:</td>
                        <td>
                          {formatJamKeDisplay(previewAgenda.jamKe)} ({previewAgenda.jamRentang || '-'})
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="space-y-4 font-sans text-xs">
                    <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/50">
                      <h4 className="font-bold uppercase tracking-wider text-slate-800 mb-1 border-b border-slate-200 pb-1">
                        I. Materi Ajar
                      </h4>
                      <p className="text-slate-800 mt-2 text-sm leading-relaxed">
                        {previewAgenda.materiAjar}
                      </p>
                    </div>

                    <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/50">
                      <h4 className="font-bold uppercase tracking-wider text-slate-800 mb-1 border-b border-slate-200 pb-1">
                        II. Uraian Kegiatan Pembelajaran
                      </h4>
                      <p className="text-slate-800 mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                        {previewAgenda.kegiatan}
                      </p>
                    </div>

                    {previewAgenda.catatan && (
                      <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/50">
                        <h4 className="font-bold uppercase tracking-wider text-slate-800 mb-1 border-b border-slate-200 pb-1">
                          III. Catatan / Evaluasi / Refleksi
                        </h4>
                        <p className="text-slate-800 mt-2 text-sm leading-relaxed">
                          {previewAgenda.catatan}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Tanda Tangan Guru & Kepala Sekolah */}
              <div className="grid grid-cols-2 gap-8 text-center text-xs font-sans mt-10 pt-4">
                <div>
                  <p>Mengetahui,</p>
                  <p>Kepala SMK Muhammadiyah Bawang</p>
                  <div className="h-20" />
                  <p className="font-bold underline">Imam Pamungkas, S.Pd., M.Si.</p>
                  <p className="text-[11px] text-slate-600">NBM. 1102.7909.1069421</p>
                </div>
                <div>
                  <p>Bawang, {formatIndonesianDate(previewAgenda ? previewAgenda.tanggal : todayStr)}</p>
                  <p>Guru Mata Pelajaran</p>
                  <div className="h-20" />
                  <p className="font-bold underline">{teacher.namaGuru || 'Guru Pendidik'}</p>
                  <p className="text-[11px] text-slate-600">NBM. {teacher.nbm || teacher.nip || '..............................'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
