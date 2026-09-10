import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  HardDrive,
  FileText,
  Mail,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  Send,
  UploadCloud,
  DownloadCloud,
  AlertTriangle,
  FolderPlus,
  Trash2,
  FileCheck,
  ShieldCheck,
  Sparkles,
  Info,
  ChevronRight,
  LogOut,
  User,
  Calendar as CalendarIcon,
  CheckSquare,
  Database,
} from 'lucide-react';
import { GoogleCalendarPanel } from './GoogleCalendarPanel';
import { GoogleTasksPanel } from './GoogleTasksPanel';
import { CloudSqlFirebasePanel } from './CloudSqlFirebasePanel';
import {
  ClassRoom,
  Student,
  AttendanceSession,
  StudentGrade,
  TeacherProfile,
  CalculatedGrade,
} from '../types';
import {
  signInWithGoogleWorkspace,
  signOutGoogleWorkspace,
  getCachedAccessToken,
  getCachedUser,
  initGoogleWorkspaceAuth,
  listDriveFiles,
  uploadFileToDrive,
  deleteDriveFile,
  createGoogleSheet,
  updateGoogleSheetValues,
  readGoogleSheetValues,
  createGoogleDoc,
  insertTextToGoogleDoc,
  sendGmailMessage,
  DriveFileItem,
  CreateSpreadsheetResult,
  CreateDocResult,
} from '../utils/googleWorkspace';
import { SchoolLogo } from './SchoolLogo';

interface GoogleWorkspaceViewProps {
  currentClass: ClassRoom;
  students: Student[];
  sessions: AttendanceSession[];
  grades: StudentGrade[];
  calculatedGrades: CalculatedGrade[];
  teacher: TeacherProfile;
  onImportStudents?: (newStudents: Student[]) => void;
}

type WorkspaceSubTab = 'sheets' | 'calendar' | 'tasks' | 'drive' | 'docs' | 'gmail' | 'cloudsql';

export const GoogleWorkspaceView: React.FC<GoogleWorkspaceViewProps> = ({
  currentClass,
  students,
  sessions,
  grades,
  calculatedGrades,
  teacher,
  onImportStudents,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<WorkspaceSubTab>('sheets');
  const [accessToken, setAccessToken] = useState<string | null>(() => getCachedAccessToken());
  const [googleUser, setGoogleUser] = useState<any>(() => getCachedUser());
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Status banners & feedback
  const [actionStatus, setActionStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    linkUrl?: string;
    linkLabel?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Drive state
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);

  // Confirmation Modal state for mutating/destructive operations
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionLabel: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    actionLabel: 'Konfirmasi',
    onConfirm: () => {},
  });

  // Google Sheets Export Results
  const [lastSheetResult, setLastSheetResult] = useState<CreateSpreadsheetResult | null>(null);
  const [importSheetUrl, setImportSheetUrl] = useState('');
  const [importSheetRange, setImportSheetRange] = useState('A2:D50');

  // Google Docs Export Results
  const [lastDocResult, setLastDocResult] = useState<CreateDocResult | null>(null);
  const [selectedStudentForDoc, setSelectedStudentForDoc] = useState<string>(students[0]?.id || '');
  const [docTemplateType, setDocTemplateType] = useState<'rekap' | 'sp'>('rekap');

  // Gmail State
  const [emailRecipient, setEmailRecipient] = useState(teacher.email || 'kepsek@smkmuhbawang.sch.id');
  const [emailSubject, setEmailSubject] = useState(
    `[SIM SMK Muhammadiyah Bawang] Laporan Presensi Kelas ${currentClass.namaKelas}`
  );
  const [emailBody, setEmailBody] = useState('');

  // Watch for auth changes
  useEffect(() => {
    const unsubscribe = initGoogleWorkspaceAuth(
      (user, token) => {
        setGoogleUser(user);
        setAccessToken(token);
        setAuthError(null);
      },
      () => {
        // Fallback
      }
    );
    return () => unsubscribe();
  }, []);

  // Update default email body when class or sessions change
  useEffect(() => {
    const totalPertemuan = sessions.length;
    let totalHadir = 0;
    let totalSakit = 0;
    let totalIzin = 0;
    let totalAlfa = 0;

    sessions.forEach((ses) => {
      Object.values(ses.records).forEach((r: any) => {
        if (r?.status === 'H') totalHadir++;
        if (r?.status === 'S') totalSakit++;
        if (r?.status === 'I') totalIzin++;
        if (r?.status === 'A') totalAlfa++;
      });
    });

    const body = `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n\nBerikut terlampir resume presensi dan perkembangan belajar siswa SMK Muhammadiyah Bawang:\n\n• Sekolah: ${teacher.namaSekolah}\n• Kelas: ${currentClass.namaKelas} (${currentClass.jurusan || 'Semua Jurusan'})\n• Mata Pelajaran: ${currentClass.mataPelajaran}\n• Guru Pengampu: ${teacher.namaGuru} (${teacher.nip || '-'})\n• Jumlah Siswa: ${students.length} Orang\n• Total Pertemuan: ${totalPertemuan} Sesi\n• Rincian Kehadiran Keseluruhan:\n  - Hadir: ${totalHadir}\n  - Sakit: ${totalSakit}\n  - Izin: ${totalIzin}\n  - Alpa: ${totalAlfa}\n\nLaporan ini diekspor secara otomatis melalui Sistem Informasi Manajemen Presensi & Nilai Siswa SMK Muhammadiyah Bawang.\n\nWassalamu'alaikum Warahmatullahi Wabarakatuh.\n\n${teacher.namaGuru}`;
    setEmailBody(body);
  }, [currentClass, sessions, students, teacher]);

  // Handle Google Workspace Sign In
  const handleConnectWorkspace = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const { user, accessToken: token } = await signInWithGoogleWorkspace();
      setGoogleUser(user);
      setAccessToken(token);
      setActionStatus({
        type: 'success',
        message: `Berhasil terhubung ke Akun Google: ${user.email}`,
      });
      fetchDriveFiles(token);
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Gagal menyambungkan akun Google Workspace.');
      setActionStatus({
        type: 'error',
        message: 'Gagal mengautentikasi akun Google. Pastikan popup tidak diblokir oleh browser.',
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDisconnect = async () => {
    await signOutGoogleWorkspace();
    setAccessToken(null);
    setGoogleUser(null);
    setDriveFiles([]);
    setActionStatus({
      type: 'info',
      message: 'Koneksi Google Workspace telah ditutup.',
    });
  };

  const fetchDriveFiles = async (token = accessToken) => {
    if (!token) return;
    setIsLoadingDrive(true);
    try {
      const files = await listDriveFiles(token);
      setDriveFiles(files);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  // -------------------------------------------------------------
  // 1. GOOGLE SHEETS HANDLERS
  // -------------------------------------------------------------
  const handleExportAttendanceToSheets = async () => {
    if (!accessToken) {
      alert('Silakan hubungkan akun Google Workspace terlebih dahulu.');
      return;
    }

    setIsLoading(true);
    setActionStatus(null);
    try {
      const title = `Rekap Presensi - ${currentClass.namaKelas} - ${teacher.namaSekolah} (${new Date().toLocaleDateString('id-ID')})`;
      const sheetResult = await createGoogleSheet(accessToken, title, ['Rekap Presensi', 'Statistik']);

      // Build Attendance Matrix
      const headerRow = [
        'No',
        'NISN',
        'Nama Lengkap',
        'L/P',
        ...sessions.map((s) => `Pertemuan ${s.pertemuanKe} (${s.tanggal})`),
        'Hadir (H)',
        'Sakit (S)',
        'Izin (I)',
        'Alpa (A)',
        '% Kehadiran',
      ];

      const dataRows = students.map((std, idx) => {
        let h = 0;
        let s = 0;
        let i = 0;
        let a = 0;
        const sessionStatuses = sessions.map((ses) => {
          const rec = ses.records[std.id]?.status || '-';
          if (rec === 'H') h++;
          else if (rec === 'S') s++;
          else if (rec === 'I') i++;
          else if (rec === 'A') a++;
          return rec;
        });

        const totalSes = sessions.length;
        const pct = totalSes > 0 ? Math.round((h / totalSes) * 100) : 100;

        return [
          idx + 1,
          std.nisn || '-',
          std.nama,
          std.gender,
          ...sessionStatuses,
          h,
          s,
          i,
          a,
          `${pct}%`,
        ];
      });

      const allValues = [
        [`REKAPITULASI PRESENSI SISWA - ${teacher.namaSekolah.toUpperCase()}`],
        [`Kelas: ${currentClass.namaKelas}`, `Mata Pelajaran: ${currentClass.mataPelajaran}`],
        [`Guru Pengampu: ${teacher.namaGuru}`, `Tahun Ajaran: ${teacher.tahunAjaran} (${teacher.semester})`],
        [],
        headerRow,
        ...dataRows,
      ];

      await updateGoogleSheetValues(
        accessToken,
        sheetResult.spreadsheetId,
        'Rekap Presensi!A1:Z' + (allValues.length + 2),
        allValues
      );

      setLastSheetResult(sheetResult);
      setActionStatus({
        type: 'success',
        message: `Berhasil mengekspor rekap presensi ke Google Sheets: "${sheetResult.title}"`,
        linkUrl: sheetResult.spreadsheetUrl,
        linkLabel: 'Buka di Google Sheets',
      });
      fetchDriveFiles();
    } catch (err: any) {
      console.error(err);
      setActionStatus({
        type: 'error',
        message: err.message || 'Gagal mengekspor ke Google Sheets.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportGradesToSheets = async () => {
    if (!accessToken) {
      alert('Silakan hubungkan akun Google Workspace terlebih dahulu.');
      return;
    }

    setIsLoading(true);
    setActionStatus(null);
    try {
      const title = `Daftar Nilai Siswa - ${currentClass.namaKelas} - ${teacher.namaSekolah} (${new Date().toLocaleDateString('id-ID')})`;
      const sheetResult = await createGoogleSheet(accessToken, title, ['Daftar Nilai']);

      const headerRow = [
        'No',
        'NISN',
        'Nama Lengkap',
        'L/P',
        'Tugas 1',
        'Tugas 2',
        'Tugas 3',
        'Rata-rata Tugas',
        'UTS',
        'UAS',
        'Nilai Akhir',
        'Predikat',
        'Status Ketuntasan (KKM: ' + currentClass.kkm + ')',
      ];

      const dataRows = students.map((std, idx) => {
        const grade = grades.find((g) => g.studentId === std.id);
        const calc = calculatedGrades.find((c) => c.studentId === std.id);

        return [
          idx + 1,
          std.nisn || '-',
          std.nama,
          std.gender,
          grade?.tugas1 ?? '-',
          grade?.tugas2 ?? '-',
          grade?.tugas3 ?? '-',
          calc?.rataTugas ?? '-',
          grade?.uts ?? '-',
          grade?.uas ?? '-',
          calc?.nilaiAkhir ?? '-',
          calc?.predikat ?? '-',
          calc?.status ?? '-',
        ];
      });

      const allValues = [
        [`DAFTAR NILAI DAN KETUNTASAN BELAJAR - ${teacher.namaSekolah.toUpperCase()}`],
        [`Kelas: ${currentClass.namaKelas}`, `Mata Pelajaran: ${currentClass.mataPelajaran}`, `KKM: ${currentClass.kkm}`],
        [`Guru: ${teacher.namaGuru}`, `Tahun Ajaran: ${teacher.tahunAjaran}`],
        [],
        headerRow,
        ...dataRows,
      ];

      await updateGoogleSheetValues(
        accessToken,
        sheetResult.spreadsheetId,
        'Daftar Nilai!A1:N' + (allValues.length + 2),
        allValues
      );

      setLastSheetResult(sheetResult);
      setActionStatus({
        type: 'success',
        message: `Berhasil mengekspor daftar nilai ke Google Sheets: "${sheetResult.title}"`,
        linkUrl: sheetResult.spreadsheetUrl,
        linkLabel: 'Buka di Google Sheets',
      });
      fetchDriveFiles();
    } catch (err: any) {
      console.error(err);
      setActionStatus({
        type: 'error',
        message: err.message || 'Gagal mengekspor nilai ke Google Sheets.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportFromGoogleSheet = async () => {
    if (!accessToken) {
      alert('Silakan hubungkan akun Google Workspace terlebih dahulu.');
      return;
    }

    if (!importSheetUrl.trim()) {
      alert('Silakan masukkan URL atau ID Google Spreadsheet.');
      return;
    }

    // Extract sheet ID from URL if full URL is pasted
    let sheetId = importSheetUrl.trim();
    const match = sheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      sheetId = match[1];
    }

    setIsLoading(true);
    try {
      const rows = await readGoogleSheetValues(accessToken, sheetId, importSheetRange);
      if (!rows || rows.length === 0) {
        throw new Error('Tidak ada data yang ditemukan pada rentang lembar yang ditentukan.');
      }

      // Map rows to students
      const newStudents: Student[] = rows
        .filter((row) => row && row[1]) // has name
        .map((row, idx) => ({
          id: 'std-' + Date.now() + '-' + idx,
          classId: currentClass.id,
          no: idx + 1,
          nisn: String(row[0] || '').trim(),
          nama: String(row[1] || '').trim(),
          gender: (String(row[2] || 'L').toUpperCase().startsWith('P') ? 'P' : 'L') as 'L' | 'P',
          catatanUmum: String(row[3] || '').trim(),
        }));

      if (onImportStudents && newStudents.length > 0) {
        onImportStudents(newStudents);
        setActionStatus({
          type: 'success',
          message: `Berhasil mengimpor ${newStudents.length} peserta didik langsung dari Google Sheets!`,
        });
        setImportSheetUrl('');
      } else {
        throw new Error('Format data tidak sesuai atau tidak ada baris yang valid.');
      }
    } catch (err: any) {
      console.error(err);
      setActionStatus({
        type: 'error',
        message: err.message || 'Gagal mengimpor dari Google Sheets.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 2. GOOGLE DRIVE HANDLERS
  // -------------------------------------------------------------
  const handleBackupClassToDrive = async () => {
    if (!accessToken) {
      alert('Silakan hubungkan akun Google Workspace terlebih dahulu.');
      return;
    }

    setIsLoading(true);
    setActionStatus(null);
    try {
      const backupData = {
        app: 'SIM Absensi & Nilai Siswa SMK Muhammadiyah Bawang',
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        teacher,
        classRoom: currentClass,
        students,
        sessions,
        grades,
      };

      const fileName = `Backup_${currentClass.namaKelas}_${new Date().toISOString().split('T')[0]}.json`;
      const result = await uploadFileToDrive(
        accessToken,
        fileName,
        'application/json',
        JSON.stringify(backupData, null, 2),
        `Cadangan data absensi dan nilai kelas ${currentClass.namaKelas}`
      );

      setActionStatus({
        type: 'success',
        message: `Cadangan data kelas berhasil diunggah ke Google Drive: "${result.name}"`,
        linkUrl: result.webViewLink,
        linkLabel: 'Buka di Google Drive',
      });
      fetchDriveFiles();
    } catch (err: any) {
      console.error(err);
      setActionStatus({
        type: 'error',
        message: err.message || 'Gagal mencadangkan data ke Google Drive.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestDeleteDriveFile = (file: DriveFileItem) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus File dari Google Drive?',
      description: `Apakah Anda yakin ingin menghapus file "${file.name}" secara permanen dari Google Drive Anda? Tindakan ini tidak dapat dibatalkan.`,
      actionLabel: 'Hapus Permanen',
      isDestructive: true,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        if (!accessToken) return;
        setIsLoading(true);
        try {
          await deleteDriveFile(accessToken, file.id);
          setActionStatus({
            type: 'success',
            message: `File "${file.name}" berhasil dihapus dari Google Drive.`,
          });
          fetchDriveFiles();
        } catch (err: any) {
          setActionStatus({
            type: 'error',
            message: err.message || 'Gagal menghapus file dari Drive.',
          });
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  // -------------------------------------------------------------
  // 3. GOOGLE DOCS HANDLERS
  // -------------------------------------------------------------
  const handleGenerateGoogleDoc = async () => {
    if (!accessToken) {
      alert('Silakan hubungkan akun Google Workspace terlebih dahulu.');
      return;
    }

    setIsLoading(true);
    setActionStatus(null);
    try {
      let docTitle = '';
      let docContent = '';

      if (docTemplateType === 'rekap') {
        docTitle = `Laporan Presensi - ${currentClass.namaKelas} - SMK Muhammadiyah Bawang`;
        
        let hadirCount = 0;
        let sakitCount = 0;
        let izinCount = 0;
        let alpaCount = 0;
        sessions.forEach((s) => {
          Object.values(s.records).forEach((r: any) => {
            if (r?.status === 'H') hadirCount++;
            if (r?.status === 'S') sakitCount++;
            if (r?.status === 'I') izinCount++;
            if (r?.status === 'A') alpaCount++;
          });
        });

        const studentsText = students
          .map(
            (s, idx) =>
              `${idx + 1}. ${s.nama} (${s.gender}) - NISN: ${s.nisn || '-'}`
          )
          .join('\n');

        docContent = `
MAJELIS PENDIDIKAN DASAR DAN MENENGAH PIMPINAN DAERAH MUHAMMADIYAH BATANG
SMK MUHAMMADIYAH BAWANG
TERAKREDITASI "A"
Alamat: Jl. Raya Bawang No. 12, Kec. Bawang, Kab. Batang, Jawa Tengah 51274
Website: smkmuhbawang.sch.id | Email: info@smkmuhbawang.sch.id
================================================================================

LAPORAN REKAPITULASI PRESENSI & KEGIATAN BELAJAR MENGAJAR
Semester ${teacher.semester} Tahun Ajaran ${teacher.tahunAjaran}

I. IDENTITAS KELAS DAN PENGAJAR
• Nama Sekolah   : ${teacher.namaSekolah}
• Kelas          : ${currentClass.namaKelas}
• Jurusan        : ${currentClass.jurusan || 'Semua Kompetensi Keahlian'}
• Mata Pelajaran : ${currentClass.mataPelajaran}
• Guru Pengampu  : ${teacher.namaGuru}
• NIP / NUPTK    : ${teacher.nip || '-'}
• Jumlah Peserta : ${students.length} Siswa
• Total Pertemuan: ${sessions.length} Kali

II. REKAPITULASI KEHADIRAN KESELURUHAN
• Hadir (H)      : ${hadirCount} akumulasi
• Sakit (S)      : ${sakitCount} akumulasi
• Izin (I)       : ${izinCount} akumulasi
• Alpa (A)       : ${alpaCount} akumulasi

III. DAFTAR PESERTA DIDIK
${studentsText}

IV. PENGESAHAN
Mengetahui,
Kepala SMK Muhammadiyah Bawang                Guru Mata Pelajaran



.......................................       ${teacher.namaGuru}
NIP. -                                        NIP. ${teacher.nip || '-'}
`;
      } else {
        // Surat Panggilan / Peringatan Siswa
        const targetStudent = students.find((s) => s.id === selectedStudentForDoc) || students[0];
        docTitle = `Surat Panggilan Orang Tua - ${targetStudent?.nama || 'Siswa'} - SMK Muhammadiyah Bawang`;

        docContent = `
MAJELIS PENDIDIKAN DASAR DAN MENENGAH PIMPINAN DAERAH MUHAMMADIYAH BATANG
SMK MUHAMMADIYAH BAWANG
TERAKREDITASI "A"
Alamat: Jl. Raya Bawang No. 12, Kec. Bawang, Kab. Batang, Jawa Tengah 51274
================================================================================

Nomor       : 042/SP-BK/SMK-MB/${new Date().getFullYear()}
Lampiran    : -
Perihal     : Panggilan Orang Tua / Wali Peserta Didik

Kepada Yth.
Bapak / Ibu Orang Tua / Wali dari:
Nama Siswa   : ${targetStudent?.nama || '-'}
Kelas        : ${currentClass.namaKelas}
NISN         : ${targetStudent?.nisn || '-'}
Mata Pelajaran: ${currentClass.mataPelajaran}

Di Tempat

Assalamu'alaikum Warahmatullahi Wabarakatuh,

Dengan hormat, sehubungan dengan hasil evaluasi pemantauan kehadiran belajar peserta didik pada semester ini, kami mengharapkan kehadiran Bapak/Ibu pada:

Hari / Tanggal : Senin, ${new Date(Date.now() + 86400000 * 3).toLocaleDateString('id-ID', { dateStyle: 'full' })}
Waktu          : Pukul 09.00 WIB - Selesai
Tempat         : Ruang Bimbingan Konseling (BK) SMK Muhammadiyah Bawang
Keperluan      : Konsultasi perkembangan kehadiran & belajar peserta didik

Demikian surat ini kami sampaikan. Atas perhatian dan kerja sama yang baik dari Bapak/Ibu, kami ucapkan terima kasih.

Wassalamu'alaikum Warahmatullahi Wabarakatuh.

Bawang, ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}
Mengetahui,
Guru Pengampu / Wali Kelas                   Waka Kesiswaan / BK SMK Muhammadiyah Bawang



${teacher.namaGuru}                          .......................................
NIP. ${teacher.nip || '-'}
`;
      }

      const docResult = await createGoogleDoc(accessToken, docTitle);
      await insertTextToGoogleDoc(accessToken, docResult.documentId, docContent);

      setLastDocResult(docResult);
      setActionStatus({
        type: 'success',
        message: `Dokumen resmi Google Docs berhasil dibuat: "${docResult.title}"`,
        linkUrl: docResult.documentUrl,
        linkLabel: 'Buka di Google Docs',
      });
      fetchDriveFiles();
    } catch (err: any) {
      console.error(err);
      setActionStatus({
        type: 'error',
        message: err.message || 'Gagal membuat Google Doc.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 4. GMAIL HANDLERS
  // -------------------------------------------------------------
  const handleRequestSendGmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      alert('Silakan hubungkan akun Google Workspace terlebih dahulu.');
      return;
    }

    if (!emailRecipient.trim()) {
      alert('Silakan masukkan alamat email tujuan.');
      return;
    }

    // MANDATORY confirmation dialog as required by workspace-integration skill
    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Pengiriman Email Gmail',
      description: `Apakah Anda yakin ingin mengirim email ini ke "${emailRecipient}" atas nama akun Anda dengan subjek "${emailSubject}"?`,
      actionLabel: 'Kirim Email Sekarang',
      isDestructive: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setIsLoading(true);
        setActionStatus(null);
        try {
          const res = await sendGmailMessage(accessToken, {
            to: emailRecipient.trim(),
            subject: emailSubject.trim(),
            messageText: emailBody,
            fromName: `${teacher.namaGuru} - SMK Muhammadiyah Bawang`,
          });

          setActionStatus({
            type: 'success',
            message: `Email berhasil dikirim via Gmail ke ${emailRecipient}! (ID Pesan: ${res.id})`,
          });
        } catch (err: any) {
          console.error(err);
          setActionStatus({
            type: 'error',
            message: err.message || 'Gagal mengirim email via Gmail.',
          });
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Official School & Google Workspace Integration */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl text-white p-6 sm:p-8 shadow-xl relative overflow-hidden border border-indigo-700/50">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <SchoolLogo size="xl" className="bg-white/10 p-2 rounded-2xl ring-2 ring-white/20 shrink-0" />
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 border border-white/20 text-indigo-200 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Google Workspace Cloud Integration
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
                Google Drive • Sheets • Docs • Gmail
              </h2>
              <p className="text-xs sm:text-sm text-indigo-200 mt-1 max-w-xl">
                Sinkronisasi langsung data absensi dan penilaian kelas {currentClass.namaKelas} dengan ekosistem Google Workspace resmi SMK Muhammadiyah Bawang.
              </p>
            </div>
          </div>

          {/* Connection Status Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 shrink-0 flex flex-col sm:items-end justify-center">
            {accessToken ? (
              <div className="space-y-2 text-right">
                <div className="flex items-center sm:justify-end gap-2 text-xs font-bold text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Google Workspace Terhubung</span>
                </div>
                <div className="text-xs text-white font-mono truncate max-w-[200px]">
                  {googleUser?.email || teacher.email}
                </div>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="text-[11px] text-rose-300 hover:text-white underline cursor-pointer inline-flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  Putuskan Sambungan
                </button>
              </div>
            ) : (
              <div className="space-y-2 sm:text-right">
                <div className="text-xs text-indigo-200">
                  Belum terhubung ke Akun Google
                </div>
                <button
                  type="button"
                  onClick={handleConnectWorkspace}
                  disabled={isAuthenticating}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-indigo-50 text-indigo-900 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isAuthenticating ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>Hubungkan Google Workspace</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionStatus && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm animate-in fade-in duration-200 ${
            actionStatus.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : actionStatus.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionStatus.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : actionStatus.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-blue-600 shrink-0" />
            )}
            <span>{actionStatus.message}</span>
          </div>

          {actionStatus.linkUrl && (
            <a
              href={actionStatus.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-indigo-700 font-bold text-xs rounded-xl shadow-xs border border-indigo-200 shrink-0 cursor-pointer"
            >
              <span>{actionStatus.linkLabel || 'Buka Link'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* Workspace Feature Navigation Tabs */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-1.5 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setActiveSubTab('sheets')}
          className={`flex-1 min-w-[110px] inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'sheets'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Sheets</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('calendar')}
          className={`flex-1 min-w-[110px] inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'calendar'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>Calendar</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('tasks')}
          className={`flex-1 min-w-[110px] inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'tasks'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Tasks</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubTab('drive');
            if (accessToken) fetchDriveFiles();
          }}
          className={`flex-1 min-w-[110px] inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'drive'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Drive</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('docs')}
          className={`flex-1 min-w-[110px] inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'docs'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Docs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('gmail')}
          className={`flex-1 min-w-[110px] inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'gmail'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Gmail</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('cloudsql')}
          className={`flex-1 min-w-[110px] inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'cloudsql'
              ? 'bg-violet-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Cloud SQL / DB</span>
        </button>
      </div>

      {/* TAB CONTENT: 1. GOOGLE SHEETS */}
      {activeSubTab === 'sheets' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card: Export to Google Sheets */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Ekspor ke Google Sheets
                </h3>
                <p className="text-xs text-slate-500">
                  Buat spreadsheet cloud baru dengan format kisi resmi lengkap rumus & persentase
                </p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl space-y-2 text-xs text-slate-700">
              <div className="font-semibold text-emerald-900">Data Yang Akan Disinkronkan:</div>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>Daftar {students.length} peserta didik kelas {currentClass.namaKelas}</li>
                <li>{sessions.length} sesi pertemuan absensi lengkap status Hadir/Sakit/Izin/Alfa</li>
                <li>Kop resmi SMK Muhammadiyah Bawang & data guru pengampu</li>
              </ul>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleExportAttendanceToSheets}
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <UploadCloud className="w-4 h-4" />
                )}
                <span>Ekspor Rekap Absensi ke Google Sheets</span>
              </button>

              <button
                type="button"
                onClick={handleExportGradesToSheets}
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                )}
                <span>Ekspor Daftar Nilai & KKM ke Google Sheets</span>
              </button>
            </div>

            {lastSheetResult && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 truncate max-w-[200px]">
                  Terakhir dibuat: {lastSheetResult.title}
                </span>
                <a
                  href={lastSheetResult.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
                >
                  <span>Buka Sheet</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Card: Import from Google Sheets */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <DownloadCloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Impor Siswa dari Google Sheets
                </h3>
                <p className="text-xs text-slate-500">
                  Tarik data nama siswa dan NISN dari spreadsheet Google yang sudah ada
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL / ID Google Spreadsheet:
                </label>
                <input
                  type="text"
                  value={importSheetUrl}
                  onChange={(e) => setImportSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rentang Baris (Range):
                </label>
                <input
                  type="text"
                  value={importSheetRange}
                  onChange={(e) => setImportSheetRange(e.target.value)}
                  placeholder="Contoh: Sheet1!A2:D50 atau A2:D50"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  Urutan kolom: Kolom A (NISN), Kolom B (Nama), Kolom C (L/P), Kolom D (Catatan)
                </span>
              </div>

              <button
                type="button"
                onClick={handleImportFromGoogleSheet}
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <DownloadCloud className="w-4 h-4" />
                )}
                <span>Tarik Data Siswa ke Kelas Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. GOOGLE DRIVE */}
      {activeSubTab === 'drive' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Action Card: Backup */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 md:col-span-1 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Cadangkan Kelas ke Drive
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Simpan cadangan lengkap (Siswa, Rekap Sesi Absensi, Catatan Nilai) ke Google Drive Anda.
                </p>
              </div>

              <button
                type="button"
                onClick={handleBackupClassToDrive}
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <UploadCloud className="w-4 h-4" />
                )}
                <span>Simpan File Cadangan ke Drive</span>
              </button>
            </div>

            {/* List Files in Google Drive */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 md:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Berkas Aplikasi di Google Drive
                  </h3>
                  <p className="text-xs text-slate-500">
                    File spreadsheet, dokumen, dan cadangan yang dibuat melalui SIM SMK Muhammadiyah Bawang
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fetchDriveFiles()}
                  disabled={isLoadingDrive}
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  title="Segarkan daftar file"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingDrive ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {isLoadingDrive ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
                  Memuat daftar berkas dari Google Drive...
                </div>
              ) : driveFiles.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-4">
                  Belum ada file aplikasi yang tersimpan di Google Drive. Ekspor data ke Google Sheets atau Docs untuk melihatnya di sini.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
                  {driveFiles.map((file) => (
                    <div
                      key={file.id}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {file.mimeType.includes('spreadsheet') ? (
                          <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : file.mimeType.includes('document') ? (
                          <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                        ) : (
                          <FileCheck className="w-5 h-5 text-blue-600 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                            {file.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {file.modifiedTime
                              ? new Date(file.modifiedTime).toLocaleDateString('id-ID', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })
                              : 'Tersimpan di Drive'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg inline-flex items-center gap-1"
                            title="Buka di tab baru"
                          >
                            <span>Buka</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRequestDeleteDriveFile(file)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus file dari Google Drive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. GOOGLE DOCS */}
      {activeSubTab === 'docs' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                Pembuat Dokumen Resmi Google Docs
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Buat surat resmi dan dokumen rekapitulasi KBM langsung ke Google Docs dengan Kop Surat SMK Muhammadiyah Bawang
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setDocTemplateType('rekap')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                docTemplateType === 'rekap'
                  ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-200'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="font-bold text-slate-900 text-sm mb-1">
                1. Laporan Rekapitulasi Presensi Semester
              </div>
              <p className="text-xs text-slate-500">
                Format resmi mencakup rekap jumlah kehadiran, daftar nama peserta didik, mata pelajaran, dan pengesahan Kepala Sekolah & Guru.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setDocTemplateType('sp')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                docTemplateType === 'sp'
                  ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-200'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="font-bold text-slate-900 text-sm mb-1">
                2. Surat Panggilan / Peringatan Orang Tua (SP)
              </div>
              <p className="text-xs text-slate-500">
                Surat dinas resmi untuk memanggil orang tua / wali siswa terkait ketidakhadiran atau pembinaan belajar peserta didik.
              </p>
            </button>
          </div>

          {docTemplateType === 'sp' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Pilih Peserta Didik Yang Dituju:
              </label>
              <select
                value={selectedStudentForDoc}
                onChange={(e) => setSelectedStudentForDoc(e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900"
              >
                {students.map((std) => (
                  <option key={std.id} value={std.id}>
                    {std.no}. {std.nama} ({std.gender}) — NISN: {std.nisn || '-'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={handleGenerateGoogleDoc}
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              <span>Buat & Simpan Dokumen ke Google Docs</span>
            </button>
          </div>

          {lastDocResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div className="text-xs text-emerald-900 font-semibold truncate max-w-sm">
                Dokumen Tersedia: {lastDocResult.title}
              </div>
              <a
                href={lastDocResult.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                <span>Buka di Google Docs</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 4. GMAIL */}
      {activeSubTab === 'gmail' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                Kirim Laporan & Notifikasi via Gmail
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Kirimkan rekapitulasi kehadiran dan catatan nilai ke pihak sekolah, kepala sekolah, atau orang tua siswa
              </p>
            </div>
          </div>

          <form onSubmit={handleRequestSendGmail} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Email Penerima <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                placeholder="kepsek@smkmuhbawang.sch.id / ortu.siswa@gmail.com"
                className="w-full text-xs sm:text-sm p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subjek Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full text-xs sm:text-sm p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Isi Pesan Email:
              </label>
              <textarea
                rows={8}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="w-full text-xs sm:text-sm p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none font-sans"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-2xl shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Kirim Email Sekarang Melalui Gmail</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB CONTENT: 5. GOOGLE CALENDAR */}
      {activeSubTab === 'calendar' && (
        <GoogleCalendarPanel
          accessToken={accessToken}
          currentClass={currentClass}
          sessions={sessions}
          teacher={teacher}
          onOpenConfirmModal={setConfirmModal}
          onShowStatus={setActionStatus}
        />
      )}

      {/* TAB CONTENT: 6. GOOGLE TASKS */}
      {activeSubTab === 'tasks' && (
        <GoogleTasksPanel
          accessToken={accessToken}
          currentClass={currentClass}
          teacher={teacher}
          onOpenConfirmModal={setConfirmModal}
          onShowStatus={setActionStatus}
        />
      )}

      {/* TAB CONTENT: 7. CLOUD SQL & FIREBASE INFRASTRUCTURE */}
      {activeSubTab === 'cloudsql' && (
        <CloudSqlFirebasePanel
          currentClass={currentClass}
          students={students}
          teacher={teacher}
          onShowStatus={setActionStatus}
        />
      )}

      {/* Confirmation Dialog for Destructive / Mutating Operations */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  confirmModal.isDestructive
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-indigo-100 text-indigo-700'
                }`}
              >
                {confirmModal.isDestructive ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <ShieldCheck className="w-5 h-5" />
                )}
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                {confirmModal.title}
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-600">
              {confirmModal.description}
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs cursor-pointer transition-all ${
                  confirmModal.isDestructive
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {confirmModal.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
