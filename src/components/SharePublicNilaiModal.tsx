import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Globe,
  ExternalLink,
  MessageCircle,
  QrCode,
  ShieldCheck,
  Search,
  Lock,
  Eye,
  RefreshCw,
  Users,
  Award,
  AlertTriangle,
  GraduationCap,
} from 'lucide-react';
import { ClassRoom, Student, TeacherProfile, StudentGrade } from '../types';
import { FirestoreService, PublicNilaiData } from '../services/firestoreService';
import { calculateStudentGrade } from '../utils/gradeCalculations';
import { Storage } from '../utils/storage';
import { getDefaultGradeHeaders } from '../utils/gradeHeaders';
import { QRCodeModal } from './QRCodeModal';

interface SharePublicNilaiModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClass: ClassRoom;
  teacher: TeacherProfile;
  students: Student[];
  grades: StudentGrade[];
  kkm?: number;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  currentUid: string;
}

export const SharePublicNilaiModal: React.FC<SharePublicNilaiModalProps> = ({
  isOpen,
  onClose,
  currentClass,
  teacher,
  students,
  grades,
  kkm = 75,
  onShowToast,
  currentUid,
}) => {
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [lastPublishedAt, setLastPublishedAt] = useState<string | null>(null);
  const [copiedClassLink, setCopiedClassLink] = useState<boolean>(false);
  const [copiedStudentId, setCopiedStudentId] = useState<string | null>(null);
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [showQrCode, setShowQrCode] = useState<boolean>(false);
  const [qrModalData, setQrModalData] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
    subtitle?: string;
    badgeText?: string;
    badgeColor?: 'emerald' | 'blue' | 'teal' | 'indigo' | 'purple';
  }>({
    isOpen: false,
    url: '',
    title: '',
  });

  // Settings for public access
  const [isPublicEnabled, setIsPublicEnabled] = useState<boolean>(true);
  const [allowClassRecap, setAllowClassRecap] = useState<boolean>(true);
  const [pinRequired, setPinRequired] = useState<boolean>(false);
  const [accessPin, setAccessPin] = useState<string>('1234');

  const shareId = currentClass?.id
    ? FirestoreService.getPublicNilaiShareId(currentUid, currentClass.id)
    : 'nil_default';

  // Load existing published status on modal open or class change
  useEffect(() => {
    if (!isOpen || !currentClass?.id) return;

    // Check localStorage cache first
    const cachedTime = localStorage.getItem(`nilai_last_pub_${currentClass.id}`);
    if (cachedTime) {
      setLastPublishedAt(cachedTime);
    }

    // Check Firestore to populate settings and real cloud status
    FirestoreService.getPublicNilai(shareId)
      .then((existing) => {
        if (existing) {
          setIsPublicEnabled(existing.isPublicEnabled !== false);
          setAllowClassRecap(existing.allowClassRecap !== false);
          setPinRequired(!!existing.pinRequired);
          if (existing.accessPin) setAccessPin(existing.accessPin);
          if (existing.updatedAt) {
            const dateObj = new Date(existing.updatedAt);
            const timeStr = isNaN(dateObj.getTime())
              ? existing.updatedAt
              : dateObj.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });
            setLastPublishedAt(timeStr);
            localStorage.setItem(`nilai_last_pub_${currentClass.id}`, timeStr);
          }
        }
      })
      .catch(() => {});
  }, [isOpen, currentClass?.id, shareId]);

  if (!isOpen) return null;

  // Generate clean public base URL
  const baseUrl = window.location.origin + window.location.pathname;
  const classPublicUrl = `${baseUrl}?nilai_share=${encodeURIComponent(shareId)}`;

  const getStudentPublicUrl = (student: Student) => {
    const param = student.nisn
      ? `&nisn=${encodeURIComponent(student.nisn)}`
      : `&studentId=${encodeURIComponent(student.id)}`;
    return `${classPublicUrl}${param}`;
  };

  // Get student grade quick calculation
  const getStudentCalculated = (studentId: string) => {
    const g = grades.find((gr) => gr.studentId === studentId);
    return calculateStudentGrade(g, kkm);
  };

  // Copy class link to clipboard
  const handleCopyClassLink = () => {
    navigator.clipboard.writeText(classPublicUrl);
    setCopiedClassLink(true);
    onShowToast('Tautan nilai kelas berhasil disalin!', 'success');
    setTimeout(() => setCopiedClassLink(false), 2500);
  };

  // Copy student individual link
  const handleCopyStudentLink = (student: Student) => {
    const url = getStudentPublicUrl(student);
    navigator.clipboard.writeText(url);
    setCopiedStudentId(student.id);
    onShowToast(`Tautan nilai ${student.nama} berhasil disalin!`, 'success');
    setTimeout(() => setCopiedStudentId(null), 2500);
  };

  // Send WhatsApp to Class Group
  const handleShareToClassGroupWA = () => {
    const tuntasCount = students.filter((st) => getStudentCalculated(st.id).isTuntas).length;
    const persenTuntas = students.length > 0 ? Math.round((tuntasCount / students.length) * 100) : 100;

    const msg =
      `*PEMBERITAHUAN HASIL BELAJAR & NILAI KELAS*\n` +
      `*${teacher.namaSekolah || 'SMK Muhammadiyah Bawang'}*\n\n` +
      `Yth. Bapak/Ibu Orang Tua & Siswa Kelas *${currentClass.namaKelas}*,\n\n` +
      `Berikut kami sampaikan rekapan hasil belajar Asesmen Formatif & Sumatif:\n` +
      `• Mata Pelajaran: *${currentClass.mataPelajaran || teacher.mataPelajaranUtama || 'Pelajaran Umum'}*\n` +
      `• Semester / TA: ${teacher.semester || 'Ganjil'} ${teacher.tahunAjaran || '2025/2026'}\n` +
      `• KKM: *${kkm}*\n` +
      `• Tingkat Ketuntasan Kelas: *${persenTuntas}%* (${tuntasCount} dari ${students.length} siswa)\n\n` +
      `🔗 *Buka Kartu & Rekap Nilai Siswa Secara Digital:*\n${classPublicUrl}\n` +
      (pinRequired
        ? `🔐 _(Gunakan Kode PIN Akses: *${accessPin}* saat diminta)_\n\n`
        : `\n`) +
      `Orang tua dan siswa dapat langsung memeriksa capaian asesmen formatif, sumatif, predikat, dan catatan guru secara transparan.\n\n` +
      `Guru Pengampu:\n*${teacher.namaGuru || 'Guru'}*`;

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  // Send WhatsApp to Individual Student / Parent
  const handleShareToStudentWA = (student: Student) => {
    const calc = getStudentCalculated(student.id);
    const studentUrl = getStudentPublicUrl(student);

    const msg =
      `*INFORMASI HASIL BELAJAR & NILAI SISWA*\n` +
      `*${teacher.namaSekolah || 'SMK Muhammadiyah Bawang'}*\n\n` +
      `Nama Siswa: *${student.nama}*\n` +
      `NISN: ${student.nisn || '-'}\n` +
      `Kelas: ${currentClass.namaKelas}\n` +
      `Mata Pelajaran: *${currentClass.mataPelajaran || teacher.mataPelajaranUtama || '-'}*\n` +
      `KKM: *${kkm}*\n\n` +
      `📊 *Rincian Capaian Hasil Belajar:*\n` +
      `• Rata-rata Formatif: ${calc.rataFormatif}\n` +
      `• Sumatif Tengah Semester (STS): ${calc.sumatifTengah ?? '-'}\n` +
      `• Sumatif Akhir Semester (SAS): ${calc.sumatifAkhir ?? '-'}\n` +
      `• *NILAI AKHIR: ${calc.nilaiAkhir}*\n` +
      `• Predikat: *${calc.predikat}*\n` +
      `• Status: *${calc.status.toUpperCase()}*` +
      (!calc.isTuntas
        ? `\n⚠️ *Catatan:* Nilai ananda masih di bawah KKM (${kkm}). Mohon bantuan Bapak/Ibu untuk memotivasi ananda mengikuti kegiatan remedial.\n\n`
        : `\n\n`) +
      `🔗 *Buka Kartu Rapor Nilai Digital Lengkap:*\n${studentUrl}\n` +
      (pinRequired ? `🔐 _(PIN Akses: *${accessPin}*)_\n\n` : `\n`) +
      `Guru Pengampu: ${teacher.namaGuru || 'Guru'}\n` +
      `Terima kasih.`;

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  // Publish / Sync data snapshot to Firestore public_nilai collection
  const handlePublishToCloud = async () => {
    if (!currentClass?.id) return;
    setIsPublishing(true);

    try {
      const classStudents = students.map((st) => ({
        id: st.id,
        no: st.no,
        nisn: st.nisn || '',
        nama: st.nama,
        gender: st.gender,
      }));

      // Retrieve grade column headers for custom formative descriptions and dates
      const columnHeaders =
        Storage.getGradeHeaders(currentClass.id) ||
        getDefaultGradeHeaders(
          (teacher.semester as 'Ganjil' | 'Genap') || 'Ganjil',
          teacher.tahunAjaran || '2025/2026'
        );

      const normalizedGrades = grades
        .filter((g) => g.classId === currentClass.id)
        .map((g) => {
          const m = g.monthlyGrades || {};
          return {
            ...g,
            formatif1: g.formatif1 ?? (m['m0_c0'] !== undefined ? Number(m['m0_c0']) : null),
            formatif2: g.formatif2 ?? (m['m0_c1'] !== undefined ? Number(m['m0_c1']) : null),
            formatif3: g.formatif3 ?? (m['m0_c2'] !== undefined ? Number(m['m0_c2']) : null),
            formatif4: g.formatif4 ?? (m['m0_c3'] !== undefined ? Number(m['m0_c3']) : null),
            formatif5: g.formatif5 ?? (m['m1_c0'] !== undefined ? Number(m['m1_c0']) : null),
            formatif6: g.formatif6 ?? (m['m1_c1'] !== undefined ? Number(m['m1_c1']) : null),
            formatif7: g.formatif7 ?? (m['m1_c2'] !== undefined ? Number(m['m1_c2']) : null),
            formatif8: g.formatif8 ?? (m['m1_c3'] !== undefined ? Number(m['m1_c3']) : null),
            sumatifTengah:
              g.sumatifTengah ??
              (m['sumatif_tengah'] !== undefined ? Number(m['sumatif_tengah']) : null),
            sumatifAkhir:
              g.sumatifAkhir ??
              (m['sumatif_akhir'] !== undefined ? Number(m['sumatif_akhir']) : null),
            monthlyGrades: m,
          };
        });

      const payload: PublicNilaiData = {
        shareId,
        classId: currentClass.id,
        className: currentClass.namaKelas,
        mataPelajaran: currentClass.mataPelajaran || teacher.mataPelajaranUtama || 'Pelajaran Umum',
        schoolName: teacher.namaSekolah || 'SMK Muhammadiyah Bawang',
        waliKelas: teacher.namaGuru || 'Guru Pengampu',
        nip: teacher.nip || '',
        academicYear: teacher.tahunAjaran || '2025/2026',
        semester: teacher.semester || 'Ganjil',
        kkm,
        teacherUid: currentUid,
        updatedAt: new Date().toISOString(),
        students: classStudents,
        grades: normalizedGrades,
        columnHeaders,
        isPublicEnabled,
        pinRequired,
        accessPin: pinRequired ? accessPin : undefined,
        allowClassRecap,
      };

      await FirestoreService.publishPublicNilai(payload);

      const nowStr = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setLastPublishedAt(nowStr);
      localStorage.setItem(`nilai_last_pub_${currentClass.id}`, nowStr);

      onShowToast(
        'Data nilai formatif & sumatif kelas berhasil disinkronkan ke tautan publik siswa!',
        'success'
      );
    } catch (err: any) {
      console.error('Error publishing public nilai:', err);
      onShowToast(
        'Gagal menyinkronkan data: ' + (err?.message || 'Koneksi Firestore gagal'),
        'error'
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.nama.toLowerCase().includes(searchStudent.toLowerCase()) ||
      (s.nisn && s.nisn.includes(searchStudent))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-700 via-indigo-800 to-teal-700 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-xs border border-white/20">
              <Globe className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                Bagikan Link Preview Nilai & Rekap Siswa
              </h3>
              <p className="text-xs text-indigo-100">
                Kelas {currentClass.namaKelas} • {currentClass.mataPelajaran || teacher.mataPelajaranUtama || 'Pelajaran Umum'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* Cloud Sync Status Banner */}
          <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <RefreshCw className={`w-4 h-4 ${isPublishing ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                  Status Publikasi Cloud Nilai
                </h4>
                <p className="text-xs text-indigo-800">
                  {lastPublishedAt
                    ? `Terakhir disinkronkan ke Cloud: ${lastPublishedAt}`
                    : 'Belum pernah disinkronkan ke cloud publik'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePublishToCloud}
              disabled={isPublishing}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPublishing ? 'animate-spin' : ''}`} />
              <span>{isPublishing ? 'Menyinkronkan...' : 'Sinkronkan / Update Nilai'}</span>
            </button>
          </div>

          {/* Section 1: Main Class Link */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                <span>Tautan Rekap Nilai Seluruh Kelas</span>
              </label>
              <span className="text-[11px] text-slate-400">Dapat dibuka tanpa login</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-700 truncate select-all">
                {classPublicUrl}
              </div>

              <button
                type="button"
                onClick={handleCopyClassLink}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
              >
                {copiedClassLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedClassLink ? 'Tersalin' : 'Salin'}</span>
              </button>

              <a
                href={classPublicUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors shrink-0"
                title="Buka preview di tab baru"
              >
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={() =>
                  setQrModalData({
                    isOpen: true,
                    url: classPublicUrl,
                    title: `QR Rekap Nilai - Kelas ${currentClass.namaKelas || ''}`,
                    subtitle: 'Pindai kode QR untuk membuka rekap nilai & rapor kelas ini secara online.',
                    badgeText: 'Nilai Kelas',
                    badgeColor: 'indigo',
                  })
                }
                className="p-2.5 rounded-xl transition-colors shrink-0 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 cursor-pointer"
                title="Tampilkan QR Code Kelas"
              >
                <QrCode className="w-4 h-4" />
              </button>
            </div>

            {/* QR Code Container */}
            {showQrCode && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-150">
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm mb-2">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                      classPublicUrl
                    )}`}
                    alt="QR Code Rekap Nilai"
                    className="w-40 h-40"
                  />
                </div>
                <p className="text-xs font-bold text-slate-700">Scan QR Code untuk Membuka Rapor & Rekap Nilai</p>
                <p className="text-[11px] text-slate-400">Bisa ditempel di ruang kelas atau dibagikan saat rapat wali murid</p>
              </div>
            )}

            {/* WhatsApp Share Button for Class Group */}
            <button
              type="button"
              onClick={handleShareToClassGroupWA}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Bagikan Pengumuman Nilai ke WhatsApp Grup Kelas</span>
            </button>
          </div>

          {/* Section 2: Privacy & Security Controls */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Pengaturan Privasi & Akses Siswa</span>
            </h4>

            <div className="space-y-2.5 text-xs">
              {/* Toggle Public Access */}
              <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-white transition-colors">
                <div>
                  <span className="font-bold text-slate-800 block">Aktifkan Akses Link Publik</span>
                  <span className="text-slate-500 text-[11px]">
                    Jika dinonaktifkan, siswa dan orang tua tidak dapat membuka tautan ini.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isPublicEnabled}
                  onChange={(e) => setIsPublicEnabled(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded-md focus:ring-indigo-500 cursor-pointer"
                />
              </label>

              {/* Toggle Allow Class Recap */}
              <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-white transition-colors border-t border-slate-200/60 pt-2.5">
                <div>
                  <span className="font-bold text-slate-800 block">Izinkan Siswa Melihat Rekap Seluruh Kelas</span>
                  <span className="text-slate-500 text-[11px]">
                    Jika dimatikan, siswa hanya dapat melihat kartu nilai individual milik masing-masing.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={allowClassRecap}
                  onChange={(e) => setAllowClassRecap(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded-md focus:ring-indigo-500 cursor-pointer"
                />
              </label>

              {/* Toggle PIN Code */}
              <div className="border-t border-slate-200/60 pt-2.5">
                <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-white transition-colors">
                  <div>
                    <span className="font-bold text-slate-800 block">Kunci dengan Kode PIN Akses</span>
                    <span className="text-slate-500 text-[11px]">
                      Siswa/orang tua wajib memasukkan PIN untuk membuka rekap nilai.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={pinRequired}
                    onChange={(e) => setPinRequired(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded-md focus:ring-indigo-500 cursor-pointer"
                  />
                </label>

                {pinRequired && (
                  <div className="mt-2 pl-2 flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">Kode PIN:</span>
                    <input
                      type="text"
                      maxLength={6}
                      value={accessPin}
                      onChange={(e) => setAccessPin(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-indigo-700 w-28 text-center"
                      placeholder="e.g. 1234"
                    />
                    <span className="text-[11px] text-slate-400">Ingat untuk menekan tombol "Sinkronkan" di atas setelah mengubah PIN</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Personalized Student Links */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>Tautan Personal Per Siswa ({students.length} Siswa)</span>
              </label>

              {/* Search Student Input */}
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  placeholder="Cari nama / NISN..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {filteredStudents.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  Tidak ada siswa yang cocok dengan pencarian.
                </div>
              ) : (
                filteredStudents.map((st) => {
                  const calc = getStudentCalculated(st.id);
                  const isCopied = copiedStudentId === st.id;

                  return (
                    <div
                      key={st.id}
                      className="p-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {st.no}. {st.nama}
                          </span>
                          <span
                            className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                              calc.predikat === 'A'
                                ? 'bg-emerald-100 text-emerald-800'
                                : calc.predikat === 'B'
                                ? 'bg-sky-100 text-sky-800'
                                : calc.predikat === 'C'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            NA: {calc.nilaiAkhir} ({calc.predikat})
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-md ${
                              calc.isTuntas ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {calc.isTuntas ? 'Tuntas' : 'Remedial'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          NISN: {st.nisn || '-'} • Rata Formatif: {calc.rataFormatif}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Copy Link Button */}
                        <button
                          type="button"
                          onClick={() => handleCopyStudentLink(st)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          title="Salin tautan rapor siswa"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* WhatsApp Button */}
                        <button
                          type="button"
                          onClick={() => handleShareToStudentWA(st)}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          title="Kirim pesan nilai ke WhatsApp Orang Tua"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>

                        {/* Direct Preview Link */}
                        <a
                          href={getStudentPublicUrl(st)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors"
                          title="Buka preview rapor siswa di tab baru"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        {/* Student QR Code Button */}
                        <button
                          type="button"
                          onClick={() =>
                            setQrModalData({
                              isOpen: true,
                              url: getStudentPublicUrl(st),
                              title: `QR Rapor - ${st.nama}`,
                              subtitle: `Pindai kode QR untuk membuka rapor nilai mandiri ananda ${st.nama} (NISN: ${st.nisn || '-'}).`,
                              badgeText: 'Rapor Siswa',
                              badgeColor: 'indigo',
                            })
                          }
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          title="Tampilkan Kode QR Rapor Siswa Ini"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Perubahan nilai guru akan otomatis terbarui di tautan publik saat tombol sinkronkan ditekan.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* QR Code Modal Dialog */}
      <QRCodeModal
        isOpen={qrModalData.isOpen}
        onClose={() => setQrModalData((prev) => ({ ...prev, isOpen: false }))}
        url={qrModalData.url}
        title={qrModalData.title}
        subtitle={qrModalData.subtitle}
        badgeText={qrModalData.badgeText}
        badgeColor={qrModalData.badgeColor}
      />
    </div>
  );
};
