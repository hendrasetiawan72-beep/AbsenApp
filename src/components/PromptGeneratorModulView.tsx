import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  BookOpen,
  Copy,
  Check,
  Download,
  Printer,
  RefreshCw,
  Layers,
  Award,
  HeartHandshake,
  Compass,
  FileText,
  Building2,
  Wrench,
  Cpu,
  GraduationCap,
  Users,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Info,
  Calendar,
  Clock,
  Send,
  Zap,
  RotateCcw,
  Trash2,
  Plus,
  X,
  AlertTriangle,
  Eraser,
} from 'lucide-react';
import { TeacherProfile, ClassRoom, ModulAjarPromptData, SMKJurusan, AlternatifGenerateModul } from '../types';
import {
  LIST_JURUSAN,
  SEPULUH_ALTERNATIF_GENERATE,
  generateFieldsFromCpAndAtp,
  buildMasterPromptText,
} from '../utils/modulGeneratorPresets';
import { exportModulToWord, exportLkpdToWord } from '../utils/modulExport';

interface PromptGeneratorModulViewProps {
  teacher: TeacherProfile;
  classes: ClassRoom[];
  activeClassId: string;
}

export const PromptGeneratorModulView: React.FC<PromptGeneratorModulViewProps> = ({
  teacher,
  classes,
  activeClassId,
}) => {
  // Current active class name fallback
  const currentClass = classes.find((c) => c.id === activeClassId);

  // Jurusan Selection State (Multi-select)
  const [selectedJurusan, setSelectedJurusan] = useState<SMKJurusan[]>(['TKR']);

  // Active View Tab: 'form' | 'prompt' | 'modul-preview' | 'lkpd'
  const [activeSubTab, setActiveSubTab] = useState<'form' | 'prompt' | 'modul-preview' | 'lkpd'>('form');

  // 10 Alternatif Kurikulum Merdeka Selection State
  const [selectedAlternatif, setSelectedAlternatif] = useState<AlternatifGenerateModul>('pjbl-tefa');

  // Form States - Mode Bersih Manual (Semua preset dihapus):
  // 1. Identitas Materi Mata Pelajaran
  const [kurikulum, setKurikulum] = useState<string>('Kurikulum Merdeka Belajar (SMK PK)');
  const [faseKelas, setFaseKelas] = useState<string>('Fase F (Kelas XI)');
  const [topikMateri, setTopikMateri] = useState<string>('');
  const [pendekatan, setPendekatan] = useState<string>('Deep Learning (meaningful – mindful – joyful, interkoneksi)');
  const [metodePembelajaran, setMetodePembelajaran] = useState<string>('Project Based Learning (PjBL) terintegrasi Teaching Factory');
  const [durasiProyek, setDurasiProyek] = useState<string>('3 Pertemuan (18 JP @ 45 Menit)');
  const [namaGuru, setNamaGuru] = useState<string>(teacher.namaGuru || 'Hendra Alkindi, S.Pd.');
  const [namaKelasJurusan, setNamaKelasJurusan] = useState<string>('XI TKR 1');
  const [mataPelajaran, setMataPelajaran] = useState<string>('');

  // 2. Capaian Pembelajaran Fase dan ATP (Input Manual Guru)
  const [capaianPembelajaran, setCapaianPembelajaran] = useState<string>('');
  const [alurTujuanPembelajaran, setAlurTujuanPembelajaran] = useState<string>('');

  // 3. Tujuan Pembelajaran (ATP yang dijabarkan) - Terisi otomatis oleh AI atau manual
  const [tujuanPembelajaran, setTujuanPembelajaran] = useState<string[]>([]);

  // 4. Sintaks Metode Pembelajaran (PjBL / PBL aktivitas konkret) - Terisi otomatis oleh AI atau manual
  const [sintaksPembelajaran, setSintaksPembelajaran] = useState<
    Array<{ tahap: string; fokusDeepLearning: 'Mindful' | 'Meaningful' | 'Joyful' | 'Interkoneksi'; aktivitasKonkret: string }>
  >([]);

  // 8. Integrasi Skills + Practice - Terisi otomatis oleh AI atau manual
  const [integrasiSkillsPractice, setIntegrasiSkillsPractice] = useState({
    hardSkills: '',
    softSkills: '',
    praktikNyata: '',
    keselamatanKerjaK3: '',
  });

  // 10. Refleksi - Terisi otomatis oleh AI atau manual
  const [refleksi, setRefleksi] = useState({
    refleksiSiswa: '',
    refleksiGuru: '',
  });

  // Penguatan Karakter Kemuhammadiyahan - Terisi otomatis oleh AI atau manual
  const [karakterKemuhammadiyahan, setKarakterKemuhammadiyahan] = useState<string[]>([]);

  // Peta Konsep Karakter 7 Kebiasaan Anak Indonesia Hebat - Terisi otomatis oleh AI atau manual
  const [tujuhKebiasaanAnakHebat, setTujuhKebiasaanAnakHebat] = useState<
    Array<{ kebiasaan: string; implementasi: string }>
  >([]);

  // LKPD State - Terisi otomatis oleh AI atau manual
  const [lkpd, setLkpd] = useState({
    judulProyek: '',
    petunjukKerja: [] as string[],
    tugasProyek: '',
    alatBahan: [] as string[],
    rubrikPenilaian: '',
  });

  // UI status states
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [autoFillSuccessNotice, setAutoFillSuccessNotice] = useState(false);
  const [generationSource, setGenerationSource] = useState<'gemini-ai' | 'local-engine' | null>(null);
  const [aiGenerationStatus, setAiGenerationStatus] = useState<string>('');
  const [highlightGeneratedFields, setHighlightGeneratedFields] = useState<boolean>(false);

  // Keep teacher name synced if changed from outside
  useEffect(() => {
    if (teacher.namaGuru) {
      setNamaGuru(teacher.namaGuru);
    }
  }, [teacher.namaGuru]);

  // Handle Jurusan Multi-select
  const handleToggleJurusan = (jurusanId: SMKJurusan) => {
    if (jurusanId === 'Semua Jurusan') {
      if (selectedJurusan.includes('Semua Jurusan')) {
        setSelectedJurusan(['TKR']);
        setNamaKelasJurusan('XI TKR 1');
      } else {
        setSelectedJurusan(['Semua Jurusan', 'TKR', 'TSM', 'Akuntansi', 'Perbankan Syari\'ah', 'TJAT', 'TKJ']);
        setNamaKelasJurusan('X - XII Semua Jurusan (Lintas Vokasi)');
      }
      return;
    }

    let updated: SMKJurusan[];
    if (selectedJurusan.includes(jurusanId)) {
      updated = selectedJurusan.filter((j) => j !== jurusanId && j !== 'Semua Jurusan');
      if (updated.length === 0) updated = [jurusanId];
    } else {
      updated = [...selectedJurusan.filter((j) => j !== 'Semua Jurusan'), jurusanId];
    }
    setSelectedJurusan(updated);
    setNamaKelasJurusan(`XI ${updated.join(' & ')}`);
  };

  // Modal & Clear States
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [clearedNotice, setClearedNotice] = useState(false);
  const [previousDataSnapshot, setPreviousDataSnapshot] = useState<ModulAjarPromptData | null>(null);

  // Clear all form input fields completely
  const handleClearAllFields = () => {
    // Save snapshot of current data for Undo capability
    setPreviousDataSnapshot({
      kurikulum,
      faseKelas,
      topikMateri,
      pendekatan,
      metodePembelajaran,
      durasiProyek,
      namaGuru,
      namaKelasJurusan,
      selectedJurusan,
      mataPelajaran,
      capaianPembelajaran,
      alurTujuanPembelajaran,
      tujuanPembelajaran,
      sintaksPembelajaran,
      integrasiSkillsPractice,
      refleksi,
      karakterKemuhammadiyahan,
      tujuhKebiasaanAnakHebat,
      lkpd,
    });

    // 1. Identitas Materi Mata Pelajaran
    setKurikulum('');
    setFaseKelas('');
    setTopikMateri('');
    setPendekatan('');
    setMetodePembelajaran('');
    setDurasiProyek('');
    setNamaGuru('');
    setNamaKelasJurusan('');
    setMataPelajaran('');

    // 2. CP & ATP
    setCapaianPembelajaran('');
    setAlurTujuanPembelajaran('');

    // 3. Tujuan Pembelajaran (3 empty input fields ready for typing)
    setTujuanPembelajaran(['', '', '']);

    // 4. Sintaks Metode Pembelajaran (5 stages with empty concrete activities)
    setSintaksPembelajaran([
      { tahap: '1. Penentuan Pertanyaan Mendasar (Mindful Awareness)', fokusDeepLearning: 'Mindful', aktivitasKonkret: '' },
      { tahap: '2. Mendesain Perencanaan Proyek (Meaningful Context)', fokusDeepLearning: 'Meaningful', aktivitasKonkret: '' },
      { tahap: '3. Menyusun Jadwal & Eksekusi Proyek (Joyful Collaboration)', fokusDeepLearning: 'Joyful', aktivitasKonkret: '' },
      { tahap: '4. Menguji Mutu Hasil & Dampak (Interkoneksi Sistem)', fokusDeepLearning: 'Interkoneksi', aktivitasKonkret: '' },
      { tahap: '5. Evaluasi Pengalaman & Refleksi Bermakna', fokusDeepLearning: 'Mindful', aktivitasKonkret: '' },
    ]);

    // 8. Integrasi Skills + Practice
    setIntegrasiSkillsPractice({
      hardSkills: '',
      softSkills: '',
      praktikNyata: '',
      keselamatanKerjaK3: '',
    });

    // 10. Refleksi
    setRefleksi({
      refleksiSiswa: '',
      refleksiGuru: '',
    });

    // Penguatan Karakter Kemuhammadiyahan (4 empty inputs)
    setKarakterKemuhammadiyahan(['', '', '', '']);

    // 7 Kebiasaan Anak Indonesia Hebat (7 empty implementasi)
    setTujuhKebiasaanAnakHebat([
      { kebiasaan: '1. Bangun Pagi', implementasi: '' },
      { kebiasaan: '2. Beribadah', implementasi: '' },
      { kebiasaan: '3. Berolahraga', implementasi: '' },
      { kebiasaan: '4. Gemar Belajar', implementasi: '' },
      { kebiasaan: '5. Makan Sehat & Bergizi', implementasi: '' },
      { kebiasaan: '6. Bermasyarakat (Gotong Royong & Peduli)', implementasi: '' },
      { kebiasaan: '7. Istirahat Cukup', implementasi: '' },
    ]);

    // LKPD
    setLkpd({
      judulProyek: '',
      petunjukKerja: ['', ''],
      tugasProyek: '',
      alatBahan: ['', ''],
      rubrikPenilaian: '',
    });

    setSelectedJurusan([]);
    setShowClearConfirmModal(false);
    setClearedNotice(true);
    setActiveSubTab('form'); // Switch to form tab so all cleared fields are visible
    setTimeout(() => setClearedNotice(false), 6000);
  };

  const handleUndoClear = () => {
    if (!previousDataSnapshot) return;
    setKurikulum(previousDataSnapshot.kurikulum);
    setFaseKelas(previousDataSnapshot.faseKelas);
    setTopikMateri(previousDataSnapshot.topikMateri);
    setPendekatan(previousDataSnapshot.pendekatan);
    setMetodePembelajaran(previousDataSnapshot.metodePembelajaran);
    setDurasiProyek(previousDataSnapshot.durasiProyek);
    setNamaGuru(previousDataSnapshot.namaGuru);
    setNamaKelasJurusan(previousDataSnapshot.namaKelasJurusan);
    setMataPelajaran(previousDataSnapshot.mataPelajaran);
    setCapaianPembelajaran(previousDataSnapshot.capaianPembelajaran);
    setAlurTujuanPembelajaran(previousDataSnapshot.alurTujuanPembelajaran);
    setTujuanPembelajaran(previousDataSnapshot.tujuanPembelajaran);
    setSintaksPembelajaran(previousDataSnapshot.sintaksPembelajaran);
    setIntegrasiSkillsPractice(previousDataSnapshot.integrasiSkillsPractice);
    setRefleksi(previousDataSnapshot.refleksi);
    setKarakterKemuhammadiyahan(previousDataSnapshot.karakterKemuhammadiyahan);
    setTujuhKebiasaanAnakHebat(previousDataSnapshot.tujuhKebiasaanAnakHebat);
    setLkpd(previousDataSnapshot.lkpd);
    setSelectedJurusan(previousDataSnapshot.selectedJurusan);
    setClearedNotice(false);
    setPreviousDataSnapshot(null);
  };

  const handleAddTujuanPembelajaran = () => {
    setTujuanPembelajaran([...tujuanPembelajaran, '']);
  };

  const handleRemoveTujuanPembelajaran = (index: number) => {
    if (tujuanPembelajaran.length <= 1) {
      setTujuanPembelajaran(['']);
      return;
    }
    setTujuanPembelajaran(tujuanPembelajaran.filter((_, i) => i !== index));
  };

  const handleAddKarakterKemuhammadiyahan = () => {
    setKarakterKemuhammadiyahan([...karakterKemuhammadiyahan, '']);
  };

  const handleRemoveKarakterKemuhammadiyahan = (index: number) => {
    if (karakterKemuhammadiyahan.length <= 1) {
      setKarakterKemuhammadiyahan(['']);
      return;
    }
    setKarakterKemuhammadiyahan(karakterKemuhammadiyahan.filter((_, i) => i !== index));
  };

  // Generate Otomatis: Mengisi seluruh kolom dari CP & ATP dengan Gemini AI (atau Fallback Lokal Cerdas)
  const handleGenerateOtomatis = async (altId?: AlternatifGenerateModul) => {
    const targetAlt = altId || selectedAlternatif;
    
    // Validasi apakah CP atau ATP sudah diisi
    if (!capaianPembelajaran.trim() && !alurTujuanPembelajaran.trim()) {
      alert('Silakan ketik atau tempel Capaian Pembelajaran (CP) atau Alur Tujuan Pembelajaran (ATP) terlebih dahulu untuk menjalankan auto-generator.');
      return;
    }

    setIsAutoFilling(true);
    setAiGenerationStatus('Menghubungi Gemini AI (gemini-3.8-flash)... Menganalisis CP & ATP dan menyusun seluruh kolom');

    try {
      // 1. Panggil backend server-side Gemini AI
      const response = await fetch('/api/ai/generate-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          capaianPembelajaran,
          alurTujuanPembelajaran,
          mataPelajaran,
          topikMateri,
          faseKelas,
          selectedJurusan,
          namaGuru,
          alternatif: targetAlt,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const aiData = result.data;
          if (aiData.topikMateri) setTopikMateri(aiData.topikMateri);
          if (aiData.mataPelajaran) setMataPelajaran(aiData.mataPelajaran);
          if (Array.isArray(aiData.tujuanPembelajaran) && aiData.tujuanPembelajaran.length > 0) {
            setTujuanPembelajaran(aiData.tujuanPembelajaran);
          }
          if (Array.isArray(aiData.sintaksPembelajaran) && aiData.sintaksPembelajaran.length > 0) {
            setSintaksPembelajaran(aiData.sintaksPembelajaran);
          }
          if (aiData.integrasiSkillsPractice) {
            setIntegrasiSkillsPractice({
              hardSkills: aiData.integrasiSkillsPractice.hardSkills || '',
              softSkills: aiData.integrasiSkillsPractice.softSkills || '',
              praktikNyata: aiData.integrasiSkillsPractice.praktikNyata || '',
              keselamatanKerjaK3: aiData.integrasiSkillsPractice.keselamatanKerjaK3 || '',
            });
          }
          if (aiData.refleksi) {
            setRefleksi({
              refleksiSiswa: aiData.refleksi.refleksiSiswa || '',
              refleksiGuru: aiData.refleksi.refleksiGuru || '',
            });
          }
          if (Array.isArray(aiData.karakterKemuhammadiyahan) && aiData.karakterKemuhammadiyahan.length > 0) {
            setKarakterKemuhammadiyahan(aiData.karakterKemuhammadiyahan);
          }
          if (Array.isArray(aiData.tujuhKebiasaanAnakHebat) && aiData.tujuhKebiasaanAnakHebat.length > 0) {
            setTujuhKebiasaanAnakHebat(aiData.tujuhKebiasaanAnakHebat);
          }
          if (aiData.lkpd) {
            setLkpd({
              judulProyek: aiData.lkpd.judulProyek || '',
              petunjukKerja: Array.isArray(aiData.lkpd.petunjukKerja) ? aiData.lkpd.petunjukKerja : [],
              tugasProyek: aiData.lkpd.tugasProyek || '',
              alatBahan: Array.isArray(aiData.lkpd.alatBahan) ? aiData.lkpd.alatBahan : [],
              rubrikPenilaian: aiData.lkpd.rubrikPenilaian || '',
            });
          }
          if (altId) setSelectedAlternatif(altId);

          setGenerationSource(result.source === 'gemini-ai' ? 'gemini-ai' : 'local-engine');
          setAiGenerationStatus(
            result.notice ||
              (result.source === 'gemini-ai'
                ? 'Berhasil digenerate oleh Gemini AI (gemini-3.8-flash)'
                : 'Berhasil digenerate oleh Mesin Kurikulum Vokasi')
          );
          setAutoFillSuccessNotice(true);
          setHighlightGeneratedFields(true);
          setTimeout(() => setHighlightGeneratedFields(false), 5000);
          setTimeout(() => setAutoFillSuccessNotice(false), 6000);
          return;
        }
      }

      // 2. Fallback cerdas: Gunakan rule-based engine kurikulum SMK Muhammadiyah Bawang jika server AI mengindikasikan ketiadaan API key
      const generated = generateFieldsFromCpAndAtp(
        capaianPembelajaran,
        alurTujuanPembelajaran,
        selectedJurusan,
        faseKelas,
        namaGuru,
        { topikMateri, mataPelajaran },
        targetAlt
      );

      if (generated.topikMateri) setTopikMateri(generated.topikMateri);
      if (generated.mataPelajaran) setMataPelajaran(generated.mataPelajaran);
      if (generated.tujuanPembelajaran) setTujuanPembelajaran(generated.tujuanPembelajaran);
      if (generated.sintaksPembelajaran) setSintaksPembelajaran(generated.sintaksPembelajaran);
      if (generated.integrasiSkillsPractice) setIntegrasiSkillsPractice(generated.integrasiSkillsPractice);
      if (generated.refleksi) setRefleksi(generated.refleksi);
      if (generated.karakterKemuhammadiyahan) setKarakterKemuhammadiyahan(generated.karakterKemuhammadiyahan);
      if (generated.tujuhKebiasaanAnakHebat) setTujuhKebiasaanAnakHebat(generated.tujuhKebiasaanAnakHebat);
      if (generated.lkpd) setLkpd(generated.lkpd);
      if (altId) setSelectedAlternatif(altId);

      setGenerationSource('local-engine');
      setAiGenerationStatus('Berhasil disusun otomatis sesuai struktur kurikulum SMK Muhammadiyah Bawang');
      setAutoFillSuccessNotice(true);
      setHighlightGeneratedFields(true);
      setTimeout(() => setHighlightGeneratedFields(false), 4000);
      setTimeout(() => setAutoFillSuccessNotice(false), 5000);
    } catch (error) {
      console.warn('Gemini API call failed, falling back to local curriculum engine:', error);
      const generated = generateFieldsFromCpAndAtp(
        capaianPembelajaran,
        alurTujuanPembelajaran,
        selectedJurusan,
        faseKelas,
        namaGuru,
        { topikMateri, mataPelajaran },
        targetAlt
      );

      if (generated.topikMateri) setTopikMateri(generated.topikMateri);
      if (generated.tujuanPembelajaran) setTujuanPembelajaran(generated.tujuanPembelajaran);
      if (generated.sintaksPembelajaran) setSintaksPembelajaran(generated.sintaksPembelajaran);
      if (generated.integrasiSkillsPractice) setIntegrasiSkillsPractice(generated.integrasiSkillsPractice);
      if (generated.refleksi) setRefleksi(generated.refleksi);
      if (generated.karakterKemuhammadiyahan) setKarakterKemuhammadiyahan(generated.karakterKemuhammadiyahan);
      if (generated.tujuhKebiasaanAnakHebat) setTujuhKebiasaanAnakHebat(generated.tujuhKebiasaanAnakHebat);
      if (generated.lkpd) setLkpd(generated.lkpd);
      if (altId) setSelectedAlternatif(altId);

      setGenerationSource('local-engine');
      setAutoFillSuccessNotice(true);
      setTimeout(() => setAutoFillSuccessNotice(false), 4000);
    } finally {
      setIsAutoFilling(false);
      setAiGenerationStatus('');
    }
  };

  // Cycle to next alternative variation among 10 options
  const handleCycleNextAlternatif = () => {
    const currentIndex = SEPULUH_ALTERNATIF_GENERATE.findIndex((a) => a.id === selectedAlternatif);
    const nextIndex = (currentIndex + 1) % SEPULUH_ALTERNATIF_GENERATE.length;
    const nextAlt = SEPULUH_ALTERNATIF_GENERATE[nextIndex];
    setSelectedAlternatif(nextAlt.id);
    handleGenerateOtomatis(nextAlt.id);
  };

  // Re-trigger auto fill whenever CP or ATP changes
  const triggerAutoFillFromCpAtp = (newCp: string, newAtp: string, altId?: AlternatifGenerateModul) => {
    setIsAutoFilling(true);
    try {
      const generated = generateFieldsFromCpAndAtp(
        newCp,
        newAtp,
        selectedJurusan,
        faseKelas,
        namaGuru,
        { topikMateri, mataPelajaran },
        altId || selectedAlternatif
      );

      if (generated.topikMateri && !topikMateri) setTopikMateri(generated.topikMateri);
      if (generated.tujuanPembelajaran) setTujuanPembelajaran(generated.tujuanPembelajaran);
      if (generated.sintaksPembelajaran) setSintaksPembelajaran(generated.sintaksPembelajaran);
      if (generated.integrasiSkillsPractice) setIntegrasiSkillsPractice(generated.integrasiSkillsPractice);
      if (generated.refleksi) setRefleksi(generated.refleksi);
      if (generated.karakterKemuhammadiyahan) setKarakterKemuhammadiyahan(generated.karakterKemuhammadiyahan);
      if (generated.tujuhKebiasaanAnakHebat) setTujuhKebiasaanAnakHebat(generated.tujuhKebiasaanAnakHebat);
      if (generated.lkpd) setLkpd(generated.lkpd);

      setAutoFillSuccessNotice(true);
      setTimeout(() => setAutoFillSuccessNotice(false), 3500);
    } finally {
      setIsAutoFilling(false);
    }
  };

  // Current Full Data Object
  const currentModulData: ModulAjarPromptData = useMemo(() => {
    return {
      kurikulum,
      faseKelas,
      topikMateri,
      pendekatan,
      metodePembelajaran,
      durasiProyek,
      namaGuru,
      namaKelasJurusan,
      selectedJurusan,
      mataPelajaran,
      capaianPembelajaran,
      alurTujuanPembelajaran,
      tujuanPembelajaran,
      sintaksPembelajaran,
      integrasiSkillsPractice,
      refleksi,
      karakterKemuhammadiyahan,
      tujuhKebiasaanAnakHebat,
      lkpd,
    };
  }, [
    kurikulum,
    faseKelas,
    topikMateri,
    pendekatan,
    metodePembelajaran,
    durasiProyek,
    namaGuru,
    namaKelasJurusan,
    selectedJurusan,
    mataPelajaran,
    capaianPembelajaran,
    alurTujuanPembelajaran,
    tujuanPembelajaran,
    sintaksPembelajaran,
    integrasiSkillsPractice,
    refleksi,
    karakterKemuhammadiyahan,
    tujuhKebiasaanAnakHebat,
    lkpd,
  ]);

  // Master Prompt String
  const masterPromptText = useMemo(() => {
    return buildMasterPromptText(currentModulData);
  }, [currentModulData]);

  // Copy Prompt to Clipboard
  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(masterPromptText);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch {
      // fallback
      const textArea = document.createElement('textarea');
      textArea.value = masterPromptText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner - Modern Minimalist with Soft Emerald & Indigo Gradient */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 p-6 sm:p-8 text-white shadow-lg border border-indigo-900/40">
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-64 h-64 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SMK Muhammadiyah Bawang • Batang</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Generator Prompt Modul Ajar & LKPD
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Penyusun otomatis perangkat ajar Kurikulum Merdeka dengan pendekatan <strong className="text-emerald-300">Deep Learning (Meaningful, Mindful, Joyful, Interkoneksi)</strong>, penguatan karakter Kemuhammadiyahan, dan 7 Kebiasaan Anak Indonesia Hebat.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              id="btn-kosongkan-semua-top"
              onClick={() => setShowClearConfirmModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-200 bg-rose-500/20 hover:bg-rose-500/30 hover:text-white border border-rose-400/30 transition-all shadow-sm cursor-pointer"
              title="Kosongkan seluruh kolom isian formulir"
            >
              <RotateCcw className="w-4 h-4 text-rose-300" />
              <span>Kosongkan Semua Kolom</span>
            </button>

            <button
              type="button"
              onClick={handleCopyPrompt}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                copiedPrompt
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-slate-900 hover:bg-slate-100'
              }`}
            >
              {copiedPrompt ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 text-indigo-600" />}
              <span>{copiedPrompt ? 'Prompt Disalin!' : 'Salin Master Prompt'}</span>
            </button>

            <button
              type="button"
              onClick={() => exportModulToWord(currentModulData)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600/90 hover:bg-indigo-600 text-white transition-all shadow-sm cursor-pointer border border-indigo-500/40"
              title="Unduh Modul Ajar Lengkap format Word .doc"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Modul (.doc)</span>
            </button>

            <button
              type="button"
              onClick={() => exportLkpdToWord(currentModulData)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600/90 hover:bg-emerald-600 text-white transition-all shadow-sm cursor-pointer border border-emerald-500/40"
              title="Unduh LKPD format Word .doc"
            >
              <FileText className="w-4 h-4" />
              <span>Unduh LKPD (.doc)</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
            <button
              type="button"
              id="subtab-form"
              onClick={() => setActiveSubTab('form')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'form'
                  ? 'bg-white text-indigo-950 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Form & Input Parameter</span>
            </button>

            <button
              type="button"
              id="subtab-prompt"
              onClick={() => setActiveSubTab('prompt')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'prompt'
                  ? 'bg-white text-indigo-950 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Master Prompt AI (ChatGPT/Gemini)</span>
            </button>

            <button
              type="button"
              id="subtab-modul-preview"
              onClick={() => setActiveSubTab('modul-preview')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'modul-preview'
                  ? 'bg-white text-indigo-950 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>Pratinjau Modul Ajar</span>
            </button>

            <button
              type="button"
              id="subtab-lkpd"
              onClick={() => setActiveSubTab('lkpd')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'lkpd'
                  ? 'bg-white text-indigo-950 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Lembar Kerja Siswa (LKPD)</span>
            </button>
          </div>

          {/* Tombol Navigasi Kosongkan Semua Kolom */}
          <button
            type="button"
            id="nav-btn-kosongkan-semua"
            onClick={() => setShowClearConfirmModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-200 bg-rose-500/20 hover:bg-rose-500/35 hover:text-white border border-rose-400/30 shadow-xs transition-all cursor-pointer whitespace-nowrap ml-auto"
            title="Kosongkan seluruh kolom formulir"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-300" />
            <span>Kosongkan Semua Kolom</span>
          </button>
        </div>
      </div>

      {/* Cleared Notification Notice */}
      {clearedNotice && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Semua kolom isian telah dikosongkan!</strong> Seluruh formulir parameter kini bersih dan siap diisi dari awal. Anda juga dapat memilih salah satu Preset Cepat Kejuruan kapan saja.
            </span>
          </div>
          {previousDataSnapshot && (
            <button
              type="button"
              onClick={handleUndoClear}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-200 hover:bg-amber-300 text-amber-950 transition-all cursor-pointer shrink-0 ml-2 shadow-2xs"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Urungkan (Pulihkan Data)</span>
            </button>
          )}
        </div>
      )}

      {/* Modal Konfirmasi Kosongkan Semua Kolom */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Kosongkan Semua Kolom Isian?
                </h3>
                <p className="text-xs text-slate-500">
                  Seluruh isian formulir akan dibersihkan
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              Apakah Anda yakin ingin mengosongkan seluruh kolom parameter? Data identitas, Capaian Pembelajaran (CP), Alur Tujuan Pembelajaran (ATP), tujuan pembelajaran, sintaks aktivitas konkret, integrasi skills, refleksi, karakter Kemuhammadiyahan, 7 kebiasaan anak hebat, dan LKPD akan <strong>dikosongkan secara menyeluruh</strong>.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-confirm-clear-all"
                onClick={handleClearAllFields}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ya, Kosongkan Semua Kolom</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto Fill Notification Notice */}
      {autoFillSuccessNotice && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Otomatis Terisi!</strong> Seluruh kolom tujuan, sintaks Deep Learning konkret, integrasi skills, refleksi, karakter Kemuhammadiyahan & 7 Kebiasaan Anak Hebat telah diselaraskan dengan CP dan ATP.
            </span>
          </div>
          <span className="text-[11px] text-emerald-600 hidden sm:inline">Siap digunakan</span>
        </div>
      )}

      {/* SUB TAB 1: FORM & PARAMETERS */}
      {activeSubTab === 'form' && (
        <div className="space-y-6">
          {/* SECTION: PEMILIHAN JURUSAN SMK MUHAMMADIYAH BAWANG */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>Pilih Konsentrasi Keahlian / Jurusan</span>
                  <span className="text-[11px] font-normal text-slate-500">(Bisa pilih lebih dari satu atau Semua Jurusan)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  SMK Muhammadiyah Bawang, Batang memiliki 6 kompetensi keahlian unggulan.
                </p>
              </div>

              {/* Action Controls & Clear Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-kosongkan-kolom-preset"
                  onClick={() => setShowClearConfirmModal(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  title="Kosongkan seluruh kolom formulir untuk input manual baru"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                  <span>Kosongkan Formulir</span>
                </button>
              </div>
            </div>

            {/* Mode Manual & AI Ready Info Banner */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2.5 text-indigo-950 font-medium">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  <strong>Mode Input Manual & AI:</strong> Preset data telah dinonaktifkan. Silakan isi data mata pelajaran, CP, dan ATP di bawah secara mandiri, lalu tekan tombol <strong>✨ Generate Otomatis (Gemini AI)</strong> untuk menyusun seluruh komponen modul ajar secara otomatis.
                </span>
              </div>
            </div>

            {/* Jurusan Selection Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 pt-1">
              {LIST_JURUSAN.map((j) => {
                const isSelected = selectedJurusan.includes(j.id);
                return (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => handleToggleJurusan(j.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-br from-indigo-50 to-emerald-50 border-indigo-300 shadow-2xs ring-1 ring-indigo-400'
                        : 'bg-slate-50/70 border-slate-200/80 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {j.singkatan}
                      </span>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                        isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-800 leading-tight">
                      {j.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION: 1. IDENTITAS MATERI MATA PELAJARAN */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-extrabold flex items-center justify-center">
                  1
                </span>
                <span>Identitas Materi Mata Pelajaran</span>
              </h3>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                {kurikulum || 'Kurikulum Merdeka'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kurikulum
                </label>
                <input
                  type="text"
                  value={kurikulum}
                  onChange={(e) => setKurikulum(e.target.value)}
                  placeholder="e.g. Kurikulum Merdeka Belajar"
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fase / Kelas
                </label>
                <select
                  value={faseKelas}
                  onChange={(e) => setFaseKelas(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Pilih / Kosongkan --</option>
                  <option value="Fase E (Kelas X)">Fase E (Kelas X)</option>
                  <option value="Fase F (Kelas XI)">Fase F (Kelas XI)</option>
                  <option value="Fase F (Kelas XII)">Fase F (Kelas XII)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mata Pelajaran
                </label>
                <input
                  type="text"
                  value={mataPelajaran}
                  onChange={(e) => setMataPelajaran(e.target.value)}
                  placeholder="e.g. Konsentrasi Keahlian TKR / Akuntansi"
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Kelas / Jurusan
                </label>
                <input
                  type="text"
                  value={namaKelasJurusan}
                  onChange={(e) => setNamaKelasJurusan(e.target.value)}
                  placeholder="e.g. XI TKR 1, XI TKJ, dll"
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Topik / Materi Terintegrasi
                </label>
                <input
                  type="text"
                  value={topikMateri}
                  onChange={(e) => setTopikMateri(e.target.value)}
                  placeholder="Masukkan judul topik/materi..."
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-900 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Guru Pengampu
                </label>
                <input
                  type="text"
                  value={namaGuru}
                  onChange={(e) => setNamaGuru(e.target.value)}
                  placeholder="Nama lengkap guru & gelar..."
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pendekatan Pembelajaran
                </label>
                <input
                  type="text"
                  value={pendekatan}
                  onChange={(e) => setPendekatan(e.target.value)}
                  placeholder="e.g. Deep Learning (meaningful – mindful – joyful, interkoneksi)"
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Metode Pembelajaran
                </label>
                <select
                  value={metodePembelajaran}
                  onChange={(e) => setMetodePembelajaran(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Pilih / Kosongkan --</option>
                  <option value="Project Based Learning (PjBL) terintegrasi Teaching Factory">
                    Project Based Learning (PjBL) - Teaching Factory
                  </option>
                  <option value="Problem Based Learning (PBL) berbasis Studi Kasus DUDI">
                    Problem Based Learning (PBL) - Kasus Industri
                  </option>
                  <option value="Inquiry-Discovery Learning & Observasi Lapangan">
                    Inquiry-Discovery Learning
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Durasi Proyek (Pertemuan & JP)
                </label>
                <input
                  type="text"
                  value={durasiProyek}
                  onChange={(e) => setDurasiProyek(e.target.value)}
                  placeholder="e.g. 3 Pertemuan (18 JP @ 45 Menit)"
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION: 2. CAPAIAN PEMBELAJARAN (CP) & ATP - THE MAIN TRIGGER */}
          <div className="bg-gradient-to-br from-indigo-50/60 via-white to-emerald-50/50 p-5 sm:p-6 rounded-3xl border-2 border-indigo-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-indigo-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center">
                  2
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <span>Capaian Pembelajaran (CP) Fase & ATP</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                      Gemini AI Ready
                    </span>
                  </h3>
                  <p className="text-[11px] text-indigo-700 font-medium">
                    ⚡ Setelah CP & ATP dimasukkan, klik <strong>Generate Otomatis</strong> untuk mengisi seluruh kolom di bawahnya melalui Gemini AI.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-generate-otomatis-header"
                  onClick={() => handleGenerateOtomatis()}
                  disabled={isAutoFilling}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-violet-600 via-indigo-600 to-emerald-600 hover:from-violet-700 hover:to-emerald-700 text-white transition-all shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
                  title="Generate otomatis seluruh kolom dari CP dan ATP dengan Gemini AI"
                >
                  <Sparkles className={`w-4 h-4 text-amber-300 ${isAutoFilling ? 'animate-spin' : ''}`} />
                  <span>{isAutoFilling ? 'Gemini AI Memproses...' : '✨ Generate Otomatis (Gemini AI)'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span>Capaian Pembelajaran (CP) Fase</span>
                  <span className="text-[10px] text-slate-400 font-normal">Ketik atau paste CP</span>
                </label>
                <textarea
                  rows={4}
                  value={capaianPembelajaran}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCapaianPembelajaran(val);
                  }}
                  placeholder="Ketik capaian pembelajaran fase yang dituju (misal: Pada akhir fase E/F peserta didik mampu...)"
                  className="w-full px-3.5 py-2.5 text-xs text-slate-800 font-sans rounded-2xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span>Alur Tujuan Pembelajaran (ATP) yang Dituju</span>
                  <span className="text-[10px] text-slate-400 font-normal">Urutan tahapan materi</span>
                </label>
                <textarea
                  rows={4}
                  value={alurTujuanPembelajaran}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAlurTujuanPembelajaran(val);
                  }}
                  placeholder="Ketik alur tujuan pembelajaran (ATP)..."
                  className="w-full px-3.5 py-2.5 text-xs text-slate-800 font-sans rounded-2xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed shadow-2xs"
                />
              </div>
            </div>

            {/* DEDICATED PANEL: GENERATE OTOMATIS TERINTEGRASI GEMINI AI & 10 ALTERNATIF SKENARIO KURIKULUM */}
            <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-white border-2 border-indigo-200/90 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    <h4 className="text-sm font-extrabold text-slate-900">
                      Auto-Generator Terintegrasi Gemini AI & 10 Alternatif Kurikulum
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-200">
                      gemini-3.8-flash
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                    Setelah CP dan ATP dimasukkan di atas, klik tombol <strong>Generate Otomatis dengan Gemini AI</strong>. Gemini AI akan menganalisis kompetensi dan otomatis menyusun seluruh kolom di bawah (Tujuan Pembelajaran, Sintaks 5 Tahap, Skills DUDI Batang & K3LH, Refleksi, Karakter Kemuhammadiyahan, 7 Kebiasaan Anak Hebat, dan LKPD).
                  </p>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    id="btn-generate-otomatis-main"
                    onClick={() => handleGenerateOtomatis()}
                    disabled={isAutoFilling}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-violet-600 via-indigo-600 to-emerald-600 hover:from-violet-700 hover:to-emerald-700 text-white transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 tracking-wide uppercase"
                  >
                    <Sparkles className={`w-4 h-4 text-amber-300 ${isAutoFilling ? 'animate-spin' : ''}`} />
                    <span>{isAutoFilling ? 'Gemini AI Memproses...' : '✨ Generate Otomatis dengan Gemini AI'}</span>
                  </button>

                  <button
                    type="button"
                    id="btn-cycle-alternatif"
                    onClick={handleCycleNextAlternatif}
                    disabled={isAutoFilling}
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all cursor-pointer disabled:opacity-50"
                    title="Ganti ke variasi skenario kurikulum berikutnya dari 10 alternatif"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isAutoFilling ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Ganti Variasi</span>
                  </button>
                </div>
              </div>

              {/* Status Indicator Saat Loading */}
              {isAutoFilling && (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-50 via-purple-50 to-emerald-50 border border-indigo-200 flex items-center gap-3 animate-pulse">
                  <div className="w-5 h-5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin shrink-0" />
                  <div className="text-xs text-indigo-950 font-medium">
                    <strong>Sedang Memproses:</strong> {aiGenerationStatus || 'Gemini AI sedang membaca CP & ATP dan menjabarkan ke seluruh kolom di bawah...'}
                  </div>
                </div>
              )}

              {/* Success Notification Banner */}
              {autoFillSuccessNotice && !isAutoFilling && (
                <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs animate-fadeIn ${
                  generationSource === 'gemini-ai'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-indigo-50 border-indigo-300 text-indigo-950'
                }`}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {generationSource === 'gemini-ai' ? (
                        <>
                          <strong>✨ Berhasil Digenerate oleh Gemini AI (gemini-3.8-flash)!</strong> Seluruh 8 kolom di bawah (Tujuan Pembelajaran, Sintaks 5 Tahap, Skills DUDI Batang & K3LH, Refleksi, Karakter Kemuhammadiyahan, 7 Kebiasaan Anak Hebat, dan LKPD) telah otomatis berubah dan disinkronkan.
                        </>
                      ) : (
                        <>
                          <strong>⚡ Berhasil Digenerate Otomatis!</strong> Seluruh kolom di bawah telah terisi otomatis sesuai CP & ATP dengan pendekatan Kurikulum Merdeka SMK Muhammadiyah Bawang.
                        </>
                      )}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 border border-current shrink-0">
                    Kolom Terbarui
                  </span>
                </div>
              )}

              {/* Active Skenario Highlight Ribbon */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-gradient-to-r from-indigo-50 via-slate-50 to-emerald-50 border border-indigo-100/80 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-indigo-600 text-white font-extrabold text-[10px] uppercase tracking-wider">
                    Alternatif Terpilih
                  </span>
                  <span className="font-bold text-slate-800">
                    {SEPULUH_ALTERNATIF_GENERATE.find((a) => a.id === selectedAlternatif)?.judul}
                  </span>
                  <span className="text-slate-400 hidden sm:inline">•</span>
                  <span className="text-slate-600 hidden sm:inline">
                    {SEPULUH_ALTERNATIF_GENERATE.find((a) => a.id === selectedAlternatif)?.fokusPedagogi}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  10 Skenario Kurikulum Merdeka Tersedia
                </span>
              </div>

              {/* 10 Alternatif Grid Cards */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-2">
                  Pilih Salah Satu dari 10 Alternatif Pendekatan Kurikulum (Klik kartu untuk langsung menghasilkan dengan Gemini AI):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                  {SEPULUH_ALTERNATIF_GENERATE.map((alt) => {
                    const isSelected = selectedAlternatif === alt.id;
                    return (
                      <button
                        key={alt.id}
                        type="button"
                        onClick={() => {
                          setSelectedAlternatif(alt.id);
                          handleGenerateOtomatis(alt.id);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 relative group ${
                          isSelected
                            ? 'bg-gradient-to-br from-indigo-50 via-white to-emerald-50/70 border-indigo-500 shadow-xs ring-2 ring-indigo-400'
                            : 'bg-slate-50/80 hover:bg-white border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-200 text-slate-700 group-hover:bg-indigo-100 group-hover:text-indigo-700'
                          }`}>
                            #{alt.nomor}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {alt.badge}
                          </span>
                        </div>

                        <div>
                          <div className="text-xs font-extrabold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                            {alt.judul.replace(/^\d+\.\s*/, '')}
                          </div>
                          <div className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                            {alt.subjudul}
                          </div>
                        </div>

                        <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          <span className={`font-semibold ${isSelected ? 'text-indigo-700' : 'text-slate-400'}`}>
                            {isSelected ? '✓ Aktif Digenerate' : 'Pilih Skenario'}
                          </span>
                          <ChevronRight className={`w-3 h-3 ${isSelected ? 'text-indigo-600' : 'text-slate-300 group-hover:text-indigo-400'}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: 3. TUJUAN PEMBELAJARAN (ATP YANG DIJABARKAN) */}
          <div className={`bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3 transition-all duration-700 ${highlightGeneratedFields ? 'ring-2 ring-indigo-400/80 shadow-md' : ''}`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-extrabold flex items-center justify-center">
                    3
                  </span>
                  <span>Tujuan Pembelajaran (ATP yang dijabarkan & KKTP)</span>
                </h3>
                {generationSource === 'gemini-ai' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200">
                    <Sparkles className="w-3 h-3 text-violet-600" />
                    <span>Terisi Gemini AI</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTujuanPembelajaran([...tujuanPembelajaran, ''])}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/70 transition-all cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Tujuan</span>
                </button>
              </div>
            </div>

            {tujuanPembelajaran.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
                <p className="text-xs text-slate-500">
                  Belum ada butir Tujuan Pembelajaran. Ketik CP & ATP di atas atau klik tombol di bawah untuk menambah butir baru.
                </p>
                <button
                  type="button"
                  onClick={() => setTujuanPembelajaran(['Peserta didik mampu '])}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tambah Butir Tujuan Pembelajaran</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {tujuanPembelajaran.map((tp, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-white transition-colors">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={tp}
                      placeholder={`Tulis tujuan pembelajaran ke-${idx + 1}...`}
                      onChange={(e) => {
                        const updated = [...tujuanPembelajaran];
                        updated[idx] = e.target.value;
                        setTujuanPembelajaran(updated);
                      }}
                      className="w-full text-xs text-slate-800 font-medium bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1.5 py-0.5"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = tujuanPembelajaran.filter((_, i) => i !== idx);
                        setTujuanPembelajaran(updated);
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                      title="Hapus butir tujuan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION: 4. SINTAKS METODE PEMBELAJARAN (DEEP LEARNING AKTIVITAS KONKRET) */}
          <div className={`bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 transition-all duration-700 ${highlightGeneratedFields ? 'ring-2 ring-indigo-400/80 shadow-md' : ''}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-extrabold flex items-center justify-center">
                    4
                  </span>
                  <span>Sintaks Metode Pembelajaran (PjBL / PBL dengan Aktivitas Konkret)</span>
                </h3>
                {generationSource === 'gemini-ai' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200">
                    <Sparkles className="w-3 h-3 text-violet-600" />
                    <span>Terisi Gemini AI</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                  Mindful • Meaningful • Joyful • Interkoneksi
                </span>
                <button
                  type="button"
                  onClick={() => setSintaksPembelajaran([
                    ...sintaksPembelajaran,
                    { tahap: `Langkah ${sintaksPembelajaran.length + 1}: Tindak Lanjut Konkret`, fokusDeepLearning: 'Interkoneksi', aktivitasKonkret: '' }
                  ])}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/70 transition-all cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Langkah</span>
                </button>
              </div>
            </div>

            {sintaksPembelajaran.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
                <p className="text-xs text-slate-500">
                  Kolom sintaks kosong. Klik tombol di bawah untuk menambahkan langkah pembelajaran.
                </p>
                <button
                  type="button"
                  onClick={() => setSintaksPembelajaran([
                    { tahap: 'Tahap 1: Penentuan Pertanyaan Mendasar & Mindful Observation', fokusDeepLearning: 'Mindful', aktivitasKonkret: '' },
                    { tahap: 'Tahap 2: Merancang Proyek & Meaningful Industry Standards', fokusDeepLearning: 'Meaningful', aktivitasKonkret: '' },
                    { tahap: 'Tahap 3: Jadwal & Eksekusi Proyek Joyful Collaboration', fokusDeepLearning: 'Joyful', aktivitasKonkret: '' },
                    { tahap: 'Tahap 4: Monitoring, Pengujian & Interkoneksi Keahlian', fokusDeepLearning: 'Interkoneksi', aktivitasKonkret: '' },
                  ])}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Isi Sintaks Standar Deep Learning</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {sintaksPembelajaran.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/70 hover:bg-white transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={item.tahap}
                          placeholder="Nama tahapan/sintaks..."
                          onChange={(e) => {
                            const updated = [...sintaksPembelajaran];
                            updated[idx].tahap = e.target.value;
                            setSintaksPembelajaran(updated);
                          }}
                          className="text-xs font-bold text-slate-900 bg-transparent focus:bg-white px-1.5 py-0.5 rounded border border-transparent focus:border-slate-300"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={item.fokusDeepLearning}
                          onChange={(e) => {
                            const updated = [...sintaksPembelajaran];
                            updated[idx].fokusDeepLearning = e.target.value as 'Mindful' | 'Meaningful' | 'Joyful' | 'Interkoneksi';
                            setSintaksPembelajaran(updated);
                          }}
                          className="text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider bg-white border border-slate-300 text-slate-800 focus:outline-none"
                        >
                          <option value="Mindful">Deep Learning: Mindful</option>
                          <option value="Meaningful">Deep Learning: Meaningful</option>
                          <option value="Joyful">Deep Learning: Joyful</option>
                          <option value="Interkoneksi">Deep Learning: Interkoneksi</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => {
                            const updated = sintaksPembelajaran.filter((_, i) => i !== idx);
                            setSintaksPembelajaran(updated);
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus langkah ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      value={item.aktivitasKonkret}
                      placeholder="Uraikan aktivitas konkret peserta didik dan guru pada sintaks ini..."
                      onChange={(e) => {
                        const updated = [...sintaksPembelajaran];
                        updated[idx].aktivitasKonkret = e.target.value;
                        setSintaksPembelajaran(updated);
                      }}
                      className="w-full text-xs text-slate-700 font-sans rounded-xl border border-slate-200 bg-white p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed shadow-2xs"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION: 8. INTEGRASI SKILLS + PRACTICE */}
          <div className={`bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 transition-all duration-700 ${highlightGeneratedFields ? 'ring-2 ring-indigo-400/80 shadow-md' : ''}`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-extrabold flex items-center justify-center">
                    8
                  </span>
                  <span>Integrasi Skills + Practice (Dunia Usaha & Industri / DUDI)</span>
                </h3>
                {generationSource === 'gemini-ai' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200">
                    <Sparkles className="w-3 h-3 text-violet-600" />
                    <span>Terisi Gemini AI</span>
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold text-slate-500">Standar Bengkel & Lab Vokasi Batang</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Hard Skills Kejuruan Vokasi</span>
                </label>
                <textarea
                  rows={2}
                  value={integrasiSkillsPractice.hardSkills}
                  placeholder="Keterampilan teknis, SOP, alat ukur/mesin/software..."
                  onChange={(e) => setIntegrasiSkillsPractice({ ...integrasiSkillsPractice, hardSkills: e.target.value })}
                  className="w-full text-xs text-slate-700 bg-white p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>Soft Skills & Komunikasi Kerja</span>
                </label>
                <textarea
                  rows={2}
                  value={integrasiSkillsPractice.softSkills}
                  placeholder="Kerja tim, etos industri, komunikasi pelanggan, problem solving..."
                  onChange={(e) => setIntegrasiSkillsPractice({ ...integrasiSkillsPractice, softSkills: e.target.value })}
                  className="w-full text-xs text-slate-700 bg-white p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Praktik Nyata Vokasi DUDI (Batang)</span>
                </label>
                <textarea
                  rows={2}
                  value={integrasiSkillsPractice.praktikNyata}
                  placeholder="Kasus riil DUDI / Teaching factory di wilayah Batang/Jateng..."
                  onChange={(e) => setIntegrasiSkillsPractice({ ...integrasiSkillsPractice, praktikNyata: e.target.value })}
                  className="w-full text-xs text-slate-700 bg-white p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                  <span>Keselamatan Kerja (K3LH) & 5S</span>
                </label>
                <textarea
                  rows={2}
                  value={integrasiSkillsPractice.keselamatanKerjaK3}
                  placeholder="APD, SOP keselamatan, pembuangan limbah, 5S (Seiri, Seiton, Seiso, Seiketsu, Shitsuke)..."
                  onChange={(e) => setIntegrasiSkillsPractice({ ...integrasiSkillsPractice, keselamatanKerjaK3: e.target.value })}
                  className="w-full text-xs text-slate-700 bg-white p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION: 10. REFLEKSI SISWA & GURU */}
          <div className={`bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 transition-all duration-700 ${highlightGeneratedFields ? 'ring-2 ring-indigo-400/80 shadow-md' : ''}`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-extrabold flex items-center justify-center">
                    10
                  </span>
                  <span>Refleksi Peserta Didik & Pendidik</span>
                </h3>
                {generationSource === 'gemini-ai' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200">
                    <Sparkles className="w-3 h-3 text-violet-600" />
                    <span>Terisi Gemini AI</span>
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold text-slate-500">Evaluasi Pembelajaran Bermakna</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Pertanyaan Refleksi Peserta Didik (Siswa)
                </label>
                <textarea
                  rows={3}
                  value={refleksi.refleksiSiswa}
                  placeholder="Pertanyaan pemantik refleksi mindful & joyful bagi peserta didik..."
                  onChange={(e) => setRefleksi({ ...refleksi, refleksiSiswa: e.target.value })}
                  className="w-full text-xs text-slate-700 rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Panduan Refleksi Pendidik (Guru)
                </label>
                <textarea
                  rows={3}
                  value={refleksi.refleksiGuru}
                  placeholder="Evaluasi guru mengenai ketercapaian tujuan, diferensiasi, dan ketuntasan siswa..."
                  onChange={(e) => setRefleksi({ ...refleksi, refleksiGuru: e.target.value })}
                  className="w-full text-xs text-slate-700 rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* SECTION: PENGUATAN KARAKTER KEMUHAMMADIYAHAN */}
          <div className={`bg-emerald-50/50 p-5 sm:p-6 rounded-3xl border border-emerald-200 shadow-xs space-y-3 transition-all duration-700 ${highlightGeneratedFields ? 'ring-2 ring-emerald-400/80 shadow-md' : ''}`}>
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-emerald-950 flex items-center gap-2">
                  <HeartHandshake className="w-5 h-5 text-emerald-600" />
                  <span>Penguatan Karakter Kemuhammadiyahan</span>
                </h3>
                {generationSource === 'gemini-ai' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300">
                    <Sparkles className="w-3 h-3 text-emerald-700" />
                    <span>Terisi Gemini AI</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Fastabiqul Khairat & Amanah
                </span>
                <button
                  type="button"
                  onClick={() => setKarakterKemuhammadiyahan([...karakterKemuhammadiyahan, ''])}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 transition-all cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Karakter</span>
                </button>
              </div>
            </div>

            {karakterKemuhammadiyahan.length === 0 ? (
              <div className="p-4 rounded-2xl bg-white border border-dashed border-emerald-200 text-center space-y-2">
                <p className="text-xs text-emerald-800">
                  Kolom karakter Kemuhammadiyahan kosong.
                </p>
                <button
                  type="button"
                  onClick={() => setKarakterKemuhammadiyahan([
                    'Meneladani nilai Fastabiqul Khairat (berlomba-lomba dalam kebaikan vokasi)',
                    'Menjunjung tinggi Amanah, Ikhlas, dan Tanggung Jawab Profesional',
                    'Mengamalkan adab Islami dan etos kerja Islam berkemajuan di bengkel/lab'
                  ])}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Isi Karakter Kemuhammadiyahan Standar</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {karakterKemuhammadiyahan.map((karakter, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 sm:p-3 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <input
                      type="text"
                      value={karakter}
                      placeholder="Nilai karakter Kemuhammadiyahan..."
                      onChange={(e) => {
                        const updated = [...karakterKemuhammadiyahan];
                        updated[idx] = e.target.value;
                        setKarakterKemuhammadiyahan(updated);
                      }}
                      className="w-full text-xs text-slate-800 font-medium bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = karakterKemuhammadiyahan.filter((_, i) => i !== idx);
                        setKarakterKemuhammadiyahan(updated);
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                      title="Hapus karakter ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION: PETA KONSEP 7 KEBIASAAN ANAK INDONESIA HEBAT */}
          <div className={`bg-indigo-50/50 p-5 sm:p-6 rounded-3xl border border-indigo-200 shadow-xs space-y-3 transition-all duration-700 ${highlightGeneratedFields ? 'ring-2 ring-indigo-400/80 shadow-md' : ''}`}>
            <div className="flex items-center justify-between pb-2 border-b border-indigo-200/60 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-indigo-950 flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  <span>Peta Konsep Karakter 7 Kebiasaan Anak Indonesia Hebat</span>
                </h3>
                {generationSource === 'gemini-ai' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-800 bg-indigo-100/90 px-2 py-0.5 rounded-full border border-indigo-300">
                    <Sparkles className="w-3 h-3 text-indigo-700" />
                    <span>Terisi Gemini AI</span>
                  </span>
                )}
              </div>
              <span className="text-[11px] font-bold text-indigo-800 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                7 Kebiasaan Karakter Vokasi
              </span>
            </div>

            {tujuhKebiasaanAnakHebat.length === 0 ? (
              <div className="p-4 rounded-2xl bg-white border border-dashed border-indigo-200 text-center space-y-2">
                <p className="text-xs text-indigo-800">
                  Kolom 7 Kebiasaan Anak Indonesia Hebat kosong.
                </p>
                <button
                  type="button"
                  onClick={() => setTujuhKebiasaanAnakHebat([
                    { kebiasaan: '1. Bangun Pagi', implementasi: 'Datang tepat waktu dan siap mengikuti briefing kerja pagi.' },
                    { kebiasaan: '2. Beribadah', implementasi: 'Menjalankan sholat dhuha dan dhuhur berjamaah di sekolah.' },
                    { kebiasaan: '3. Berolahraga', implementasi: 'Pemanasan fisik (senam 5S) sebelum masuk bengkel/lab.' },
                    { kebiasaan: '4. Makan Sehat & Bergizi', implementasi: 'Menjaga stamina dan fokus saat pengerjaan praktik.' },
                    { kebiasaan: '5. Gemar Membaca & Belajar', implementasi: 'Membaca SOP, manual book, dan buku servis/modul secara mandiri.' },
                    { kebiasaan: '6. Bermasyarakat', implementasi: 'Gotong royong merawat peralatan dan membantu teman satu tim.' },
                    { kebiasaan: '7. Istirahat Cukup', implementasi: 'Menjaga kebugaran dan keselamatan kerja (safety first).' },
                  ])}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Isi 7 Kebiasaan Standar</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {tujuhKebiasaanAnakHebat.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-white border border-indigo-100 shadow-2xs space-y-1">
                    <div className="text-xs font-bold text-indigo-900">{item.kebiasaan}</div>
                    <textarea
                      rows={2}
                      value={item.implementasi}
                      placeholder="Uraian implementasi di sekolah/bengkel..."
                      onChange={(e) => {
                        const updated = [...tujuhKebiasaanAnakHebat];
                        updated[idx].implementasi = e.target.value;
                        setTujuhKebiasaanAnakHebat(updated);
                      }}
                      className="w-full text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-200 focus:outline-none focus:bg-white"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION: FORMAT LEMBAR KERJA PESERTA DIDIK (LKPD) */}
          <div className={`bg-emerald-50/40 p-5 sm:p-6 rounded-3xl border-2 border-emerald-200 shadow-xs space-y-4 transition-all duration-700 ${highlightGeneratedFields ? 'ring-2 ring-emerald-400/80 shadow-md' : ''}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-emerald-200">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-emerald-950 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <span>Format Lembar Kerja Peserta Didik (LKPD)</span>
                </h3>
                {generationSource === 'gemini-ai' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300">
                    <Sparkles className="w-3 h-3 text-emerald-700" />
                    <span>Terisi Gemini AI</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Berbasis Proyek Konkret & DUDI
                </span>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('lkpd')}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all cursor-pointer shadow-2xs"
                >
                  <span>Buka Lembar LKPD</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Judul Proyek / Lembar Kerja (LKPD)
                </label>
                <input
                  type="text"
                  value={lkpd.judulProyek}
                  onChange={(e) => setLkpd({ ...lkpd, judulProyek: e.target.value })}
                  placeholder="Masukkan judul proyek konkret peserta didik..."
                  className="w-full px-3.5 py-2.5 text-xs font-bold text-slate-900 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
              </div>

              {/* Petunjuk Kerja */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Petunjuk Pengerjaan LKPD
                  </label>
                  <button
                    type="button"
                    onClick={() => setLkpd({
                      ...lkpd,
                      petunjukKerja: [...lkpd.petunjukKerja, '']
                    })}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah Petunjuk</span>
                  </button>
                </div>
                {lkpd.petunjukKerja.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Belum ada petunjuk kerja.</p>
                ) : (
                  <div className="space-y-1.5">
                    {lkpd.petunjukKerja.map((petunjuk, pIdx) => (
                      <div key={pIdx} className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {pIdx + 1}
                        </span>
                        <input
                          type="text"
                          value={petunjuk}
                          placeholder={`Petunjuk langkah ${pIdx + 1}...`}
                          onChange={(e) => {
                            const updated = [...lkpd.petunjukKerja];
                            updated[pIdx] = e.target.value;
                            setLkpd({ ...lkpd, petunjukKerja: updated });
                          }}
                          className="w-full text-xs text-slate-700 bg-slate-50 focus:bg-white p-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = lkpd.petunjukKerja.filter((_, i) => i !== pIdx);
                            setLkpd({ ...lkpd, petunjukKerja: updated });
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tugas Proyek */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Deskripsi Tugas Proyek
                </label>
                <textarea
                  rows={3}
                  value={lkpd.tugasProyek}
                  onChange={(e) => setLkpd({ ...lkpd, tugasProyek: e.target.value })}
                  placeholder="Uraikan tugas proyek utama yang harus diselesaikan siswa..."
                  className="w-full text-xs text-slate-700 rounded-xl border border-slate-300 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
              </div>

              {/* Alat & Bahan */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Daftar Alat dan Bahan Praktik
                  </label>
                  <button
                    type="button"
                    onClick={() => setLkpd({
                      ...lkpd,
                      alatBahan: [...lkpd.alatBahan, '']
                    })}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah Alat/Bahan</span>
                  </button>
                </div>
                {lkpd.alatBahan.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Belum ada daftar alat/bahan.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {lkpd.alatBahan.map((item, abIdx) => (
                      <div key={abIdx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <input
                          type="text"
                          value={item}
                          placeholder="Nama alat / bahan..."
                          onChange={(e) => {
                            const updated = [...lkpd.alatBahan];
                            updated[abIdx] = e.target.value;
                            setLkpd({ ...lkpd, alatBahan: updated });
                          }}
                          className="w-full text-xs text-slate-700 bg-slate-50 focus:bg-white p-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = lkpd.alatBahan.filter((_, i) => i !== abIdx);
                            setLkpd({ ...lkpd, alatBahan: updated });
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rubrik Penilaian */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Rubrik Penilaian Proyek & Praktik
                </label>
                <textarea
                  rows={3}
                  value={lkpd.rubrikPenilaian}
                  onChange={(e) => setLkpd({ ...lkpd, rubrikPenilaian: e.target.value })}
                  placeholder="Kriteria dan indikator penilaian (Persiapan, Proses, Hasil, Sikap Kerja)..."
                  className="w-full text-xs text-slate-700 rounded-xl border border-slate-300 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 2: MASTER PROMPT AI DISPLAY & COPY */}
      {activeSubTab === 'prompt' && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span>Master Prompt AI Siap Pakai (ChatGPT / Gemini / Claude)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Salin prompt terstruktur di bawah ini ke ChatGPT, Google Gemini, atau Claude untuk menghasilkan naskah Modul Ajar dan Rubrik LKPD secara komprehensif.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyPrompt}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  copiedPrompt
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {copiedPrompt ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedPrompt ? 'Berhasil Disalin!' : 'Salin Seluruh Prompt'}</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <pre className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto border border-slate-800 select-all">
              {masterPromptText}
            </pre>
          </div>
        </div>
      )}

      {/* SUB TAB 3: MODUL AJAR PREVIEW */}
      {activeSubTab === 'modul-preview' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 flex-wrap gap-3">
            <div>
              <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wide">
                Pratinjau Dokumen Cetak
              </span>
              <h2 className="text-xl font-extrabold text-slate-900">
                MODUL AJAR KURIKULUM MERDEKA - DEEP LEARNING
              </h2>
              <p className="text-xs text-slate-500">SMK Muhammadiyah Bawang, Batang</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => exportModulToWord(currentModulData)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Word (.doc)</span>
              </button>
            </div>
          </div>

          {/* Document Content View */}
          <div className="space-y-6 text-slate-800 text-xs sm:text-sm">
            {/* Table Identitas */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full border-collapse">
                <tbody>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    <td className="p-2.5 font-bold text-slate-700 w-1/4">Kurikulum</td>
                    <td className="p-2.5">{currentModulData.kurikulum}</td>
                    <td className="p-2.5 font-bold text-slate-700 w-1/4">Mata Pelajaran</td>
                    <td className="p-2.5">{currentModulData.mataPelajaran}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2.5 font-bold text-slate-700">Fase / Kelas</td>
                    <td className="p-2.5">{currentModulData.faseKelas}</td>
                    <td className="p-2.5 font-bold text-slate-700">Kelas / Jurusan</td>
                    <td className="p-2.5">{currentModulData.namaKelasJurusan}</td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    <td className="p-2.5 font-bold text-slate-700">Topik / Materi</td>
                    <td className="p-2.5 font-bold text-indigo-900" colSpan={3}>
                      {currentModulData.topikMateri}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2.5 font-bold text-slate-700">Pendekatan</td>
                    <td className="p-2.5">{currentModulData.pendekatan}</td>
                    <td className="p-2.5 font-bold text-slate-700">Metode</td>
                    <td className="p-2.5">{currentModulData.metodePembelajaran}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-slate-700">Durasi Proyek</td>
                    <td className="p-2.5">{currentModulData.durasiProyek}</td>
                    <td className="p-2.5 font-bold text-slate-700">Guru Pengampu</td>
                    <td className="p-2.5 font-bold text-emerald-800">{currentModulData.namaGuru}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* CP & ATP */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-sm border-l-4 border-indigo-600 pl-2">
                2. Capaian Pembelajaran & Alur Tujuan Pembelajaran
              </h4>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs leading-relaxed">
                <strong>Capaian Pembelajaran:</strong>
                <p className="mt-1 text-slate-700">{currentModulData.capaianPembelajaran}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs leading-relaxed">
                <strong>Alur Tujuan Pembelajaran:</strong>
                <p className="mt-1 text-slate-700 whitespace-pre-line">{currentModulData.alurTujuanPembelajaran}</p>
              </div>
            </div>

            {/* Tujuan Pembelajaran */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-sm border-l-4 border-indigo-600 pl-2">
                3. Tujuan Pembelajaran (ATP yang Dijabarkan)
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700">
                {currentModulData.tujuanPembelajaran.map((tp, i) => (
                  <li key={i}>{tp}</li>
                ))}
              </ul>
            </div>

            {/* Sintaks Deep Learning */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-sm border-l-4 border-indigo-600 pl-2">
                4. Sintaks Metode Pembelajaran (Aktivitas Konkret Deep Learning)
              </h4>
              <div className="space-y-2">
                {currentModulData.sintaksPembelajaran.map((s, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{s.tahap}</span>
                      <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                        {s.fokusDeepLearning}
                      </span>
                    </div>
                    <p className="text-slate-700">{s.aktivitasKonkret}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Integrasi Skills */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-sm border-l-4 border-indigo-600 pl-2">
                8. Integrasi Skills + Practice
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <strong>Hard Skills Vokasi:</strong> {currentModulData.integrasiSkillsPractice.hardSkills}
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <strong>Soft Skills:</strong> {currentModulData.integrasiSkillsPractice.softSkills}
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <strong>Praktik Nyata Vokasi DUDI:</strong> {currentModulData.integrasiSkillsPractice.praktikNyata}
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <strong>K3LH & Budaya Kerja:</strong> {currentModulData.integrasiSkillsPractice.keselamatanKerjaK3}
                </div>
              </div>
            </div>

            {/* Refleksi */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-sm border-l-4 border-indigo-600 pl-2">
                10. Refleksi
              </h4>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <p><strong>Refleksi Siswa:</strong> <em>"{currentModulData.refleksi.refleksiSiswa}"</em></p>
                <p><strong>Refleksi Guru:</strong> <em>"{currentModulData.refleksi.refleksiGuru}"</em></p>
              </div>
            </div>

            {/* Kemuhammadiyahan */}
            <div className="space-y-2">
              <h4 className="font-bold text-emerald-900 text-sm border-l-4 border-emerald-600 pl-2">
                Penguatan Karakter Kemuhammadiyahan
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700">
                {currentModulData.karakterKemuhammadiyahan.map((k, i) => (
                  <li key={i}>{k}</li>
                ))}
              </ul>
            </div>

            {/* 7 Kebiasaan */}
            <div className="space-y-2">
              <h4 className="font-bold text-indigo-900 text-sm border-l-4 border-indigo-600 pl-2">
                Peta Konsep Karakter 7 Kebiasaan Anak Indonesia Hebat
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {currentModulData.tujuhKebiasaanAnakHebat.map((k, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100">
                    <span className="font-bold text-indigo-900">{k.kebiasaan}:</span>{' '}
                    <span className="text-slate-700">{k.implementasi}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 4: LKPD PREVIEW */}
      {activeSubTab === 'lkpd' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 flex-wrap gap-3">
            <div>
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">
                Lembar Kerja Peserta Didik Vokasi
              </span>
              <h2 className="text-xl font-extrabold text-slate-900">
                {currentModulData.lkpd.judulProyek}
              </h2>
              <p className="text-xs text-slate-500">
                SMK Muhammadiyah Bawang, Batang • {currentModulData.namaKelasJurusan}
              </p>
            </div>

            <button
              type="button"
              onClick={() => exportLkpdToWord(currentModulData)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh LKPD (.doc)</span>
            </button>
          </div>

          <div className="space-y-5 text-slate-800 text-xs sm:text-sm">
            {/* Box Petunjuk */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>A. Petunjuk Keselamatan Kerja & Prosedur Praktik</span>
              </h4>
              <ol className="list-decimal pl-5 space-y-1 text-xs text-slate-700">
                {currentModulData.lkpd.petunjukKerja.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ol>
            </div>

            {/* Box Alat & Bahan */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-emerald-600" />
                <span>B. Alat dan Bahan Praktik</span>
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700">
                {currentModulData.lkpd.alatBahan.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>

            {/* Box Tugas Proyek */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <h4 className="font-bold text-emerald-950 text-xs sm:text-sm flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-700" />
                <span>C. Tugas Proyek Nyata (Deep Learning Practice)</span>
              </h4>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {currentModulData.lkpd.tugasProyek}
              </p>
            </div>

            {/* Box Rubrik */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                D. Rubrik Asesmen & Penilaian
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                {currentModulData.lkpd.rubrikPenilaian}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
