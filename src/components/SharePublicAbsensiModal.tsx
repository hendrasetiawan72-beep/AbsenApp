import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Globe,
  Lock,
  Unlock,
  RefreshCw,
  Search,
  CheckCircle2,
  Calendar,
  Users,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  QrCode,
} from 'lucide-react';
import { ClassRoom, Student, TeacherProfile, AttendanceSession } from '../types';
import { FirestoreService, PublicAbsensiData } from '../services/firestoreService';
import { auth } from '../lib/firebase';
import { QRCodeModal } from './QRCodeModal';

interface SharePublicAbsensiModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClass: ClassRoom;
  teacher: TeacherProfile;
  students: Student[];
  sessions: AttendanceSession[];
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const SharePublicAbsensiModal: React.FC<SharePublicAbsensiModalProps> = ({
  isOpen,
  onClose,
  currentClass,
  teacher,
  students,
  sessions,
  onShowToast,
}) => {
  const [copiedClassLink, setCopiedClassLink] = useState(false);
  const [copiedStudentId, setCopiedStudentId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublicEnabled, setIsPublicEnabled] = useState(true);
  const [allowClassRecap, setAllowClassRecap] = useState(true);
  const [pinRequired, setPinRequired] = useState(false);
  const [accessPin, setAccessPin] = useState('');
  const [searchStudent, setSearchStudent] = useState('');
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
  const [lastPublishedAt, setLastPublishedAt] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && currentClass?.id) {
      return localStorage.getItem(`absensi_last_pub_${currentClass.id}`) || null;
    }
    return null;
  });

  const currentUid = auth.currentUser?.uid || teacher.googleId || teacher.id || 'guru';
  const shareId = currentClass?.id
    ? FirestoreService.getPublicAbsensiShareId(currentUid, currentClass.id)
    : 'abs_default';

  // Load existing published status on modal open or class change
  useEffect(() => {
    if (!isOpen || !currentClass?.id) return;

    // Check localStorage cache first
    const cachedTime = localStorage.getItem(`absensi_last_pub_${currentClass.id}`);
    if (cachedTime) {
      setLastPublishedAt(cachedTime);
    }

    // Check Firestore to populate settings and real cloud status
    FirestoreService.getPublicAbsensi(shareId)
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
            localStorage.setItem(`absensi_last_pub_${currentClass.id}`, timeStr);
          }
        }
      })
      .catch(() => {});
  }, [isOpen, currentClass?.id, shareId]);

  if (!isOpen) return null;

  // Generate clean public base URL
  const baseUrl = window.location.origin + window.location.pathname;
  const classPublicUrl = `${baseUrl}?absen_share=${encodeURIComponent(shareId)}`;

  const getStudentPublicUrl = (student: Student) => {
    const param = student.nisn
      ? `&nisn=${encodeURIComponent(student.nisn)}`
      : `&studentId=${encodeURIComponent(student.id)}`;
    return `${classPublicUrl}${param}`;
  };

  // Calculate quick attendance rate per student
  const getStudentAttendanceStats = (studentId: string) => {
    const classSessions = sessions.filter((s) => s.classId === currentClass.id);
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alfa = 0;
    let total = classSessions.length;

    classSessions.forEach((ses) => {
      const record: any = Array.isArray(ses.records)
        ? (ses.records as any[]).find((r) => r.studentId === studentId)
        : ses.records?.[studentId];
      if (record) {
        if (record.status === 'H') hadir++;
        else if (record.status === 'S') sakit++;
        else if (record.status === 'I') izin++;
        else if (record.status === 'A') alfa++;
      }
    });

    const percent = total > 0 ? Math.round((hadir / total) * 100) : 100;
    return { hadir, sakit, izin, alfa, total, percent };
  };

  // Copy class link to clipboard
  const handleCopyClassLink = () => {
    navigator.clipboard.writeText(classPublicUrl);
    setCopiedClassLink(true);
    onShowToast('Tautan presensi kelas berhasil disalin!', 'success');
    setTimeout(() => setCopiedClassLink(false), 2500);
  };

  // Copy student individual link
  const handleCopyStudentLink = (student: Student) => {
    const url = getStudentPublicUrl(student);
    navigator.clipboard.writeText(url);
    setCopiedStudentId(student.id);
    onShowToast(`Tautan presensi ${student.nama} berhasil disalin!`, 'success');
    setTimeout(() => setCopiedStudentId(null), 2500);
  };

  // Send WhatsApp to Class Parent Group
  const handleShareToClassGroupWA = () => {
    const classSessions = sessions.filter((s) => s.classId === currentClass.id);
    const lastSession = classSessions[classSessions.length - 1];
    const lastDate = lastSession ? lastSession.tanggal : 'Terbaru';

    const msg =
      `*PORTAL PEMANTAUAN PRESENSI SISWA REAL-TIME*\n` +
      `*${teacher.namaSekolah || 'SMK Muhammadiyah Bawang'}*\n\n` +
      `Assalamu'alaikum Wr. Wb.\n` +
      `Yth. Bapak/Ibu Orang Tua / Wali Murid Kelas *${currentClass.namaKelas}*,\n\n` +
      `Berikut kami bagikan tautan resmi portal pemantauan presensi dan kehadiran siswa yang dapat diakses secara *real-time* tanpa perlu login:\n\n` +
      `🔗 *Link Pantau Presensi Siswa:*\n${classPublicUrl}\n\n` +
      `Melalui tautan ini, Bapak/Ibu dapat:\n` +
      `1. Memantau kehadiran ananda secara *real-time* pada setiap pertemuan pelajaran.\n` +
      `2. Melihat *rekapitulasi absensi* (Hadir, Sakit, Izin, Alfa) sepanjang semester.\n` +
      `3. Membuka dan mencetak *kartu riwayat presensi digital* ananda secara mandiri.\n\n` +
      `Mata Pelajaran: *${currentClass.mataPelajaran || teacher.mataPelajaranUtama || '-'}*\n` +
      `Guru Pengampu / Wali Kelas: *${teacher.namaGuru || 'Guru'}*\n` +
      `Update Terakhir: ${lastDate}\n\n` +
      `Terima kasih atas kerja sama dan perhatian Bapak/Ibu dalam mendukung kedisiplinan ananda.`;

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  // Send WhatsApp to Individual Parent
  const handleShareToStudentParentWA = (student: Student) => {
    const stats = getStudentAttendanceStats(student.id);
    const studentUrl = getStudentPublicUrl(student);

    const predikat =
      stats.percent < 80 || stats.alfa >= 3
        ? 'Butuh Pembinaan'
        : stats.percent < 85 || stats.alfa >= 2
        ? 'Cukup'
        : stats.percent < 95 || stats.alfa >= 1
        ? 'Baik'
        : 'Sangat Baik';

    const msg =
      `*INFORMASI PRESENSI SISWA*\n` +
      `*${teacher.namaSekolah || 'SMK Muhammadiyah Bawang'}*\n\n` +
      `Assalamu'alaikum Wr. Wb.\n` +
      `Yth. Orang Tua / Wali dari ananda *${student.nama}* (NISN: ${student.nisn || '-'}), Kelas *${currentClass.namaKelas}*:\n\n` +
      `Berikut kami sampaikan ringkasan kehadiran ananda:\n` +
      `• Total Pertemuan: ${stats.total}\n` +
      `• Hadir (H): ${stats.hadir} kali\n` +
      `• Sakit (S): ${stats.sakit} kali\n` +
      `• Izin (I): ${stats.izin} kali\n` +
      `• Alfa (A): ${stats.alfa} kali\n` +
      `• Persentase Kehadiran: *${stats.percent}%*\n` +
      `• Predikat Kehadiran: *${predikat}*` +
      (stats.percent < 80
        ? `\n⚠️ *Perhatian:* Tingkat kehadiran ananda saat ini membutuhkan pembinaan (< 80%). Mohon bantuan Bapak/Ibu untuk memotivasi kehadiran dan kedisiplinan ananda.\n\n`
        : `\n\n`) +
      `🔗 *Buka Kartu Riwayat Presensi Digital Lengkap:*\n${studentUrl}\n\n` +
      `Mata Pelajaran: ${currentClass.mataPelajaran || teacher.mataPelajaranUtama || '-'}\n` +
      `Guru Pengampu: ${teacher.namaGuru || 'Guru'}\n` +
      `Wassalamu'alaikum Wr. Wb.`;

    const rawPhone = student.noHpOrangTua || (student as any).whatsappOrtu || '';
    const targetPhone = rawPhone.replace(/[^0-9]/g, '');
    const cleanPhone = targetPhone.startsWith('0')
      ? '62' + targetPhone.slice(1)
      : targetPhone;

    const waUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;

    window.open(waUrl, '_blank');
  };

  // Publish / Sync data snapshot to Firestore public_absensi collection
  const handlePublishToCloud = async () => {
    if (!currentClass?.id) return;
    setIsPublishing(true);

    try {
      const classSessions = sessions.filter((s) => s.classId === currentClass.id);
      const classStudents = students.map((st) => ({
        id: st.id,
        no: st.no,
        nisn: st.nisn || '',
        nama: st.nama,
        gender: st.gender,
      }));

      const payload: PublicAbsensiData = {
        shareId,
        classId: currentClass.id,
        className: currentClass.namaKelas,
        mataPelajaran: currentClass.mataPelajaran || teacher.mataPelajaranUtama || 'Pelajaran Umum',
        schoolName: teacher.namaSekolah || 'SMK Muhammadiyah Bawang',
        waliKelas: teacher.namaGuru || 'Guru Pengampu',
        nip: teacher.nip || '',
        academicYear: teacher.tahunAjaran || '2025/2026',
        semester: teacher.semester || 'Ganjil',
        teacherUid: currentUid,
        updatedAt: new Date().toISOString(),
        students: classStudents,
        sessions: classSessions,
        isPublicEnabled,
        pinRequired,
        accessPin: pinRequired ? accessPin : undefined,
        allowClassRecap,
      };

      await FirestoreService.publishPublicAbsensi(payload);

      const nowStr = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setLastPublishedAt(nowStr);
      localStorage.setItem(`absensi_last_pub_${currentClass.id}`, nowStr);

      onShowToast(
        'Data presensi harian & rekap kelas berhasil disinkronkan ke tautan publik orang tua!',
        'success'
      );
    } catch (err: any) {
      console.error('Error publishing public absensi:', err);
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
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-xs border border-white/20">
              <UserCheck className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white">
                  Link Preview Orang Tua (Presensi)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30">
                  Real-Time
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-medium">
                Kelas {currentClass.namaKelas} • {currentClass.mataPelajaran || teacher.mataPelajaranUtama || 'Mapel'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 text-slate-800">
          {/* Status Alert Banner */}
          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-emerald-900">
                Akses Langsung Tanpa Perlu Login
              </p>
              <p className="text-emerald-700 leading-relaxed">
                Orang tua cukup mengklik link ini untuk melihat <strong>absen harian</strong> dan <strong>rekap kehadiran</strong> secara real-time. Setiap kali Bapak/Ibu guru memperbarui presensi, data akan otomatis ter-update di layar orang tua.
              </p>
            </div>
          </div>

          {/* Primary Class Link Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Link Utama Kelas (Semua Siswa)
                </span>
              </div>
              {lastPublishedAt && (
                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Tersinkron: {lastPublishedAt}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={classPublicUrl}
                className="w-full text-xs font-mono text-slate-700 bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopyClassLink}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  copiedClassLink
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-900 text-white'
                }`}
                title="Salin Tautan"
              >
                {copiedClassLink ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Salin</span>
                  </>
                )}
              </button>
              <a
                href={classPublicUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer shrink-0"
                title="Buka Preview di Tab Baru"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Buka</span>
              </a>
              <button
                type="button"
                onClick={() =>
                  setQrModalData({
                    isOpen: true,
                    url: classPublicUrl,
                    title: `QR Rekap Presensi - Kelas ${currentClass.namaKelas || currentClass.name || ''}`,
                    subtitle: 'Pindai kode QR untuk membuka rekap kehadiran kelas ini secara online.',
                    badgeText: 'Presensi Kelas',
                    badgeColor: 'blue',
                  })
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-colors cursor-pointer shrink-0"
                title="Tampilkan Kode QR Kelas"
              >
                <QrCode className="w-4 h-4" />
                <span>QR Code</span>
              </button>
            </div>

            {/* Quick Share to WhatsApp Group */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleShareToClassGroupWA}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Bagikan ke Grup WhatsApp Wali Murid</span>
              </button>
            </div>
          </div>

          {/* Settings & Privacy Controls */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
              Pengaturan Akses & Keamanan
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
                <span className="font-semibold text-slate-800">
                  Status Publikasi Aktif
                </span>
                <input
                  type="checkbox"
                  checked={isPublicEnabled}
                  onChange={(e) => setIsPublicEnabled(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
                <span className="font-semibold text-slate-800">
                  Izinkan Lihat Rekap Kelas
                </span>
                <input
                  type="checkbox"
                  checked={allowClassRecap}
                  onChange={(e) => setAllowClassRecap(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500 cursor-pointer"
                />
              </label>
            </div>

            {/* PIN Code Protection */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pinRequired}
                    onChange={(e) => setPinRequired(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded-sm focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>Proteksi dengan PIN Akses (Opsional)</span>
                </label>
              </div>

              {pinRequired && (
                <div className="flex items-center gap-2 max-w-xs mt-1">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    maxLength={8}
                    placeholder="Contoh: 1234"
                    value={accessPin}
                    onChange={(e) => setAccessPin(e.target.value)}
                    className="text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-500">
                    Hanya orang tua yang punya PIN ini yang dapat melihat data.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Student Specific Direct Links */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                  Link Khusus Per Siswa ({students.length} Siswa)
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tautan khusus langsung membuka riwayat kehadiran putra/putri yang bersangkutan.
                </p>
              </div>

              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama atau NISN..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1.5 divide-y divide-slate-100 pr-1">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 font-medium">
                  Siswa tidak ditemukan.
                </div>
              ) : (
                filteredStudents.map((st) => {
                  const stats = getStudentAttendanceStats(st.id);
                  const isCopied = copiedStudentId === st.id;

                  return (
                    <div
                      key={st.id}
                      className="pt-2 first:pt-0 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/80 p-2 rounded-xl transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                            #{st.no}
                          </span>
                          <span className="font-bold text-slate-900 truncate">
                            {st.nama}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 flex-wrap">
                          <span>NISN: {st.nisn || '-'}</span>
                          <span>•</span>
                          <span className={`font-semibold px-1.5 py-0.2 rounded-md ${
                            stats.percent < 80 ? 'text-rose-700 bg-rose-50 font-bold' : 'text-emerald-700 bg-emerald-50'
                          }`}>
                            Hadir: {stats.hadir}/{stats.total} ({stats.percent}%)
                          </span>
                          {stats.percent < 80 && (
                            <span className="text-[10px] font-black text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-md border border-rose-200">
                              Butuh Pembinaan
                            </span>
                          )}
                          {stats.alfa > 0 && (
                            <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded-md">
                              Alfa: {stats.alfa}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyStudentLink(st)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer ${
                            isCopied
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                          title="Salin Tautan Siswa"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShareToStudentParentWA(st)}
                          className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                          title="Kirim Pesan WA ke Orang Tua"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={getStudentPublicUrl(st)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
                          title="Buka Halaman Siswa"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            setQrModalData({
                              isOpen: true,
                              url: getStudentPublicUrl(st),
                              title: `QR Presensi - ${st.nama}`,
                              subtitle: `Pindai kode QR untuk membuka rekap riwayat presensi ananda ${st.nama} (NISN: ${st.nisn || '-'}).`,
                              badgeText: 'Presensi Siswa',
                              badgeColor: 'blue',
                            })
                          }
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                          title="Tampilkan Kode QR Siswa Ini"
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
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium">
            {sessions.filter((s) => s.classId === currentClass.id).length} pertemuan tersimpan untuk kelas ini.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePublishToCloud}
              disabled={isPublishing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPublishing ? 'animate-spin' : ''}`} />
              <span>{isPublishing ? 'Menyinkronkan...' : 'Perbarui & Sinkronkan Sekarang'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
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
