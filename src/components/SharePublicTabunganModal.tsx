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
  Wallet,
  ShieldCheck,
  Users,
  QrCode,
} from 'lucide-react';
import { ClassRoom, Student, TeacherProfile, SavingTransaction } from '../types';
import { FirestoreService, PublicTabunganData } from '../services/firestoreService';
import { auth } from '../lib/firebase';
import { QRCodeModal } from './QRCodeModal';

interface SharePublicTabunganModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClass: ClassRoom;
  teacher: TeacherProfile;
  students: Student[];
  savings: SavingTransaction[];
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const SharePublicTabunganModal: React.FC<SharePublicTabunganModalProps> = ({
  isOpen,
  onClose,
  currentClass,
  teacher,
  students,
  savings,
  onShowToast,
}) => {
  const [copiedClassLink, setCopiedClassLink] = useState(false);
  const [copiedStudentId, setCopiedStudentId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isTogglingAccess, setIsTogglingAccess] = useState(false);
  const [isPublicEnabled, setIsPublicEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && currentClass?.id) {
      return localStorage.getItem(`pub_access_tb_${currentClass.id}`) === 'true';
    }
    return false;
  });
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
      return localStorage.getItem(`tabungan_last_pub_${currentClass.id}`) || null;
    }
    return null;
  });

  const currentUid = auth.currentUser?.uid || teacher.googleId || teacher.id || 'guru';
  const shareId = currentClass?.id
    ? FirestoreService.getPublicTabunganShareId(currentUid, currentClass.id)
    : 'tb_default';

  // Load existing published status and auto-sync on modal open
  useEffect(() => {
    if (!isOpen || !currentClass?.id) return;

    // Fast non-blocking auto-sync to ensure the public preview snapshot is 100% up-to-date
    handlePublishToCloud({ silent: true });

    // Check localStorage cache first
    const cachedTime = localStorage.getItem(`tabungan_last_pub_${currentClass.id}`);
    if (cachedTime) {
      setLastPublishedAt(cachedTime);
    }

    // Check Firestore to populate settings and real cloud status
    FirestoreService.getPublicTabungan(shareId)
      .then((existing) => {
        if (existing) {
          const isOpenState = existing.isPublicEnabled === true;
          setIsPublicEnabled(isOpenState);
          localStorage.setItem(`pub_access_tb_${currentClass.id}`, String(isOpenState));
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
            localStorage.setItem(`tabungan_last_pub_${currentClass.id}`, timeStr);
          }
        }
      })
      .catch(() => {});
  }, [isOpen, currentClass?.id, shareId]);

  if (!isOpen) return null;

  // Generate clean public base URL
  const baseUrl = window.location.origin + window.location.pathname;
  const classPublicUrl = `${baseUrl}?tabungan_share=${encodeURIComponent(shareId)}`;

  const getStudentPublicUrl = (student: Student) => {
    const param = student.nisn ? `&nisn=${encodeURIComponent(student.nisn)}` : `&studentId=${encodeURIComponent(student.id)}`;
    return `${classPublicUrl}${param}`;
  };

  // Calculate per student balance for quick preview
  const getStudentBalance = (studentId: string) => {
    const studentTxs = savings.filter(
      (tx) => tx.classId === currentClass.id && tx.studentId === studentId
    );
    const totalSetor = studentTxs
      .filter((tx) => tx.jenis === 'setor')
      .reduce((sum, tx) => sum + tx.nominal, 0);
    const totalTarik = studentTxs
      .filter((tx) => tx.jenis === 'tarik')
      .reduce((sum, tx) => sum + tx.nominal, 0);
    return totalSetor - totalTarik;
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Copy class link
  const handleCopyClassLink = async () => {
    try {
      await navigator.clipboard.writeText(classPublicUrl);
      setCopiedClassLink(true);
      onShowToast('Tautan publik tabungan kelas berhasil disalin ke clipboard!', 'success');
      setTimeout(() => setCopiedClassLink(false), 2500);
    } catch {
      onShowToast('Gagal menyalin tautan.', 'error');
    }
  };

  // Copy student link
  const handleCopyStudentLink = async (student: Student) => {
    try {
      const url = getStudentPublicUrl(student);
      await navigator.clipboard.writeText(url);
      setCopiedStudentId(student.id);
      onShowToast(`Tautan buku tabungan ${student.nama} berhasil disalin!`, 'success');
      setTimeout(() => setCopiedStudentId(null), 2500);
    } catch {
      onShowToast('Gagal menyalin tautan.', 'error');
    }
  };

  // Send WhatsApp to Class Parent Group
  const handleShareToClassGroupWA = () => {
    const msg =
      `*INFORMASI RESMI DATA HARIAN TABUNGAN SISWA & KAS KELAS*\n` +
      `*${teacher.namaSekolah || 'SMK Muhammadiyah Bawang'}*\n\n` +
      `Assalamu'alaikum Wr. Wb.\n` +
      `Yth. Bapak/Ibu Wali Murid Kelas *${currentClass.namaKelas}*,\n\n` +
      `Berikut kami bagikan tautan resmi portal pemantauan tabungan siswa dan kas kelas yang dapat diakses secara *real-time* tanpa perlu login:\n\n` +
      `🔗 *Link Pantau Tabungan Orang Tua:*\n${classPublicUrl}\n\n` +
      `Melalui tautan ini, Bapak/Ibu dapat:\n` +
      `1. Memantau seluruh *data transaksi harian* tabungan siswa per tanggal & per pos.\n` +
      `2. Melihat *rekapitulasi saldo tabungan* ananda dan seluruh siswa sekelas.\n` +
      `3. Membuka dan mencetak *buku tabungan digital* ananda secara mandiri.\n\n` +
      `Wali Kelas: *${teacher.namaGuru || 'Guru Pengampu'}*\n` +
      `Terima kasih atas kerja sama dan kepercayaannya.`;

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  // Send WhatsApp Direct to Student's Parent
  const handleShareToParentWA = (student: Student) => {
    const balance = getStudentBalance(student.id);
    const studentUrl = getStudentPublicUrl(student);

    const msg =
      `*BUKU TABUNGAN SISWA DIGITAL - ${teacher.namaSekolah || 'SMK Muhammadiyah Bawang'}*\n\n` +
      `Assalamu'alaikum Wr. Wb.\n` +
      `Yth. Orang Tua/Wali dari *${student.nama}* (Kelas ${currentClass.namaKelas}),\n\n` +
      `Berikut adalah rincian saldo tabungan ananda per hari ini:\n` +
      `• *Nama Siswa:* ${student.nama}\n` +
      `• *NISN:* ${student.nisn || '-'}\n` +
      `• *Saldo Tabungan Aktif:* ${formatRupiah(balance)}\n\n` +
      `Bapak/Ibu dapat memantau mutasi buku tabungan secara lengkap dan real-time melalui tautan berikut:\n` +
      `🔗 ${studentUrl}\n\n` +
      `Wali Kelas: ${teacher.namaGuru || 'Guru Pengampu'}\n` +
      `Terima kasih.`;

    const phone = student.noHpOrangTua ? student.noHpOrangTua.replace(/[^0-9]/g, '') : '';
    const target = phone ? (phone.startsWith('0') ? '62' + phone.slice(1) : phone) : '';

    const waUrl = target
      ? `https://api.whatsapp.com/send?phone=${target}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;

    window.open(waUrl, '_blank');
  };

  // Publish / Sync snapshot to Cloud Firestore
  const handlePublishToCloud = async (options?: { silent?: boolean }) => {
    if (!options?.silent) setIsPublishing(true);
    try {
      const publicPayload: PublicTabunganData = {
        shareId,
        classId: currentClass.id,
        className: currentClass.namaKelas,
        mataPelajaran: currentClass.mataPelajaran,
        jurusan: currentClass.jurusan,
        schoolName: teacher.namaSekolah || 'SMK Muhammadiyah Bawang',
        waliKelas: teacher.namaGuru || 'Wali Kelas',
        nip: teacher.nip,
        academicYear: teacher.tahunAjaran,
        semester: teacher.semester,
        teacherUid: currentUid,
        updatedAt: new Date().toISOString(),
        students: students.map((s) => ({
          id: s.id,
          no: s.no,
          nisn: s.nisn,
          nama: s.nama,
          gender: s.gender,
        })),
        savings: savings.filter((tx) => tx.classId === currentClass.id),
        isPublicEnabled,
        allowClassRecap,
        pinRequired,
        accessPin: pinRequired ? accessPin : undefined,
      };

      await FirestoreService.publishPublicTabungan(publicPayload);
      const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastPublishedAt(now);
      localStorage.setItem(`tabungan_last_pub_${currentClass.id}`, now);
      if (!options?.silent) {
        onShowToast('Data tabungan publik kelas berhasil diterbitkan & disinkronkan ke Cloud Firestore!', 'success');
      }
    } catch (err: any) {
      console.error('[SharePublicTabunganModal] Publish error:', err);
      if (!options?.silent) {
        onShowToast('Gagal menerbitkan data ke cloud: ' + (err?.message || 'Koneksi error'), 'error');
      }
    } finally {
      if (!options?.silent) setIsPublishing(false);
    }
  };

  // Toggle Buka / Tutup Akses Publik Tabungan Secara Manual (Hemat Kuota Cloud)
  const handleTogglePublicAccess = async () => {
    const nextState = !isPublicEnabled;
    setIsPublicEnabled(nextState);
    if (typeof window !== 'undefined' && currentClass?.id) {
      localStorage.setItem(`pub_access_tb_${currentClass.id}`, String(nextState));
    }
    setIsTogglingAccess(true);

    try {
      const publicPayload: PublicTabunganData = {
        shareId,
        classId: currentClass.id,
        className: currentClass.namaKelas,
        schoolName: teacher.namaSekolah || 'SMK Muhammadiyah Bawang',
        waliKelas: teacher.namaGuru || 'Wali Kelas',
        academicYear: teacher.tahunAjaran || '2025/2026',
        semester: teacher.semester || 'Ganjil',
        teacherUid: currentUid,
        updatedAt: new Date().toISOString(),
        students: nextState ? students.map((s) => ({
          id: s.id,
          no: s.no,
          nisn: s.nisn || '',
          nama: s.nama,
          gender: s.gender,
        })) : [],
        savings: nextState ? savings.filter((tx) => tx.classId === currentClass.id) : [],
        isPublicEnabled: nextState,
        allowClassRecap,
        pinRequired,
        accessPin: pinRequired ? accessPin : undefined,
      };

      await FirestoreService.publishPublicTabungan(publicPayload);

      if (nextState) {
        onShowToast('Tautan tabungan berhasil DIBUKA. Orang tua dapat memeriksa saldo tabungan.', 'success');
      } else {
        onShowToast('Tautan tabungan berhasil DITUTUP. Akses luar dinonaktifkan (Hemat Kuota Cloud).', 'info');
      }
    } catch (err: any) {
      console.error('Error toggling tabungan access:', err);
      onShowToast('Gagal mengubah status akses tabungan: ' + (err?.message || 'Koneksi error'), 'error');
    } finally {
      setIsTogglingAccess(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.nama.toLowerCase().includes(searchStudent.toLowerCase()) ||
      (s.nisn && s.nisn.includes(searchStudent))
  );

  return (
    <div
      id="modal-share-public-tabungan"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs border border-white/20 flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
                <span>Link Publik Tabungan Orang Tua</span>
                <span className="text-[11px] font-semibold bg-emerald-500/40 text-emerald-100 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Real-Time
                </span>
              </h2>
              <p className="text-xs text-teal-100">
                Kelas {currentClass.namaKelas} • Akses mandiri wali murid tanpa perlu login
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* Status Real-Time Cloud Banner */}
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-emerald-950 flex items-center gap-2">
                  <span>Sinkronisasi Data Real-Time Cloud</span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-extrabold bg-emerald-100 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    Aktif
                  </span>
                </div>
                <p className="text-emerald-800 mt-0.5">
                  Setiap kali Bapak/Ibu mencatat setoran/penarikan, orang tua yang membuka link ini akan melihat saldo terupdate secara otomatis dan seketika.
                  {lastPublishedAt && (
                    <span className="block text-[11px] text-emerald-700 font-medium mt-1">
                      Terakhir diterbitkan: {lastPublishedAt}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={handlePublishToCloud}
              disabled={isPublishing}
              className="shrink-0 py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPublishing ? 'animate-spin' : ''}`} />
              <span>{isPublishing ? 'Menerbitkan...' : 'Terbitkan / Sinkronkan Cloud'}</span>
            </button>
          </div>

          {/* Quick Control: Buka / Tutup Akses Publik Tabungan Manual (Hemat Kuota Cloud) */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isPublicEnabled
                ? 'bg-emerald-50/90 border-emerald-300/80 shadow-xs'
                : 'bg-rose-50/90 border-rose-300/80 shadow-xs'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2.5 rounded-xl shrink-0 ${
                    isPublicEnabled
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {isPublicEnabled ? <Globe className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm text-slate-800">
                      Status Akses Tabungan:
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                        isPublicEnabled
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      {isPublicEnabled ? 'Dibuka (Online)' : 'Ditutup (Hemat Kuota)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {isPublicEnabled
                      ? 'Tautan tabungan sedang aktif dan dapat diakses orang tua. Tutup tautan jika sesi tabungan selesai untuk membatasi kuota harian Cloud.'
                      : 'Tautan sedang ditutup. Orang tua yang membuka link ini akan melihat halaman offline sehingga hemat kuota Firestore 100%.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTogglePublicAccess}
                disabled={isTogglingAccess || isPublishing}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 shrink-0 ${
                  isPublicEnabled
                    ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white'
                } disabled:opacity-50`}
              >
                {isTogglingAccess ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : isPublicEnabled ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Tutup Tautan Sekarang</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    <span>Buka Tautan Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section 1: Main Class Link */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>1. Tautan Portal Tabungan Seluruh Kelas</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Cocok untuk dibagikan di Grup WhatsApp Paguyuban
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                readOnly
                value={classPublicUrl}
                className="grow bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 select-all focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopyClassLink}
                  className="grow sm:grow-0 py-2 px-3.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedClassLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Link</span>
                    </>
                  )}
                </button>

                <a
                  href={classPublicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handlePublishToCloud({ silent: true })}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  title="Buka pratinjau publik di tab baru"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Pratinjau</span>
                </a>

                <button
                  type="button"
                  onClick={() =>
                    setQrModalData({
                      isOpen: true,
                      url: classPublicUrl,
                      title: `QR Tabungan - Kelas ${currentClass.namaKelas || currentClass.name || ''}`,
                      subtitle: 'Pindai kode QR untuk membuka buku tabungan kelas ini secara online.',
                      badgeText: 'Tabungan Kelas',
                      badgeColor: 'emerald',
                    })
                  }
                  className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Tampilkan Kode QR Kelas"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>QR Code</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={handleShareToClassGroupWA}
                className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-extrabold rounded-lg shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Bagikan ke Grup WhatsApp Kelas</span>
              </button>

              <div className="flex items-center gap-4 text-xs text-slate-600">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublicEnabled}
                    onChange={(e) => setIsPublicEnabled(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Akses Link Dibuka</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowClassRecap}
                    onChange={(e) => setAllowClassRecap(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Izinkan Lihat Kas Kelas</span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 2: Direct Student Link (Buku Tabungan Khusus Anak) */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Users className="w-4 h-4 text-teal-600" />
                  <span>2. Tautan Pribadi Buku Tabungan per Siswa</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Orang tua yang membuka link ini akan langsung melihat buku tabungan ananda tanpa perlu mencari nama.
                </p>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari siswa / NISN..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  Tidak ada siswa yang sesuai pencarian.
                </div>
              ) : (
                filteredStudents.map((std) => {
                  const balance = getStudentBalance(std.id);
                  const isCopied = copiedStudentId === std.id;

                  return (
                    <div
                      key={std.id}
                      className="p-2.5 sm:px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {std.no}. {std.nama}
                          </span>
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {std.nisn || 'No NISN'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>Saldo Terkini:</span>
                          <span className="font-bold text-emerald-700">
                            {formatRupiah(balance)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => handleCopyStudentLink(std)}
                          className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                          title="Salin link langsung buku tabungan siswa ini"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">Disalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Salin Link</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleShareToParentWA(std)}
                          className="py-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                          title="Kirim pesan rincian saldo & link ke WhatsApp Orang Tua"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>Kirim WA</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setQrModalData({
                              isOpen: true,
                              url: getStudentPublicUrl(std),
                              title: `QR Tabungan - ${std.nama}`,
                              subtitle: `Pindai kode QR untuk membuka buku tabungan digital ananda ${std.nama} (NISN: ${std.nisn || '-'}).`,
                              badgeText: 'Buku Tabungan Siswa',
                              badgeColor: 'emerald',
                            })
                          }
                          className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                          title="Tampilkan Kode QR Buku Tabungan Siswa Ini"
                        >
                          <QrCode className="w-3 h-3" />
                          <span>QR</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Tips Info Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Keamanan & Transparansi Data:</span>
            </div>
            <p>
              • Halaman ini bersifat <strong>hanya baca (read-only)</strong>. Orang tua tidak dapat mengubah atau menghapus data transaksi tabungan.
            </p>
            <p>
              • Orang tua dapat mencetak bukti buku rekening tabungan resmi yang memuat rincian tanggal, pos tabungan, catatan keperluan, dan nama petugas/wali kelas penerima.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
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
