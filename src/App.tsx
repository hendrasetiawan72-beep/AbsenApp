import React, { useState, useEffect, useMemo } from 'react';
import {
  School,
  UserCheck,
  Layers,
  CalendarCheck2,
  GraduationCap,
  BarChart3,
  FileSpreadsheet,
  Printer,
  Plus,
  ArrowRight,
  BookOpen,
  Edit3,
} from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './lib/firebase';
import { FirestoreService, isQuotaExceeded } from './services/firestoreService';
import { ToastContainer, ToastItem } from './components/Toast';
import { CloudLoadingScreen } from './components/CloudLoadingScreen';
import {
  ActiveTab,
  ClassRoom,
  TeacherProfile,
  Student,
  AttendanceSession,
  StudentGrade,
  AttendanceStatus,
  CalculatedGrade,
  TeachingAgenda,
  GradeColumnHeader,
  SavingTransaction,
} from './types';
import { Storage } from './utils/storage';
import { Navbar } from './components/Navbar';
import { AttendanceView } from './components/AttendanceView';
import { TeachingAgendaView } from './components/TeachingAgendaView';
import { GradesView } from './components/GradesView';
import { TabunganView } from './components/TabunganView';
import { StatisticsResumeView } from './components/StatisticsResumeView';
import { ParentDailyReportView } from './components/ParentDailyReportView';
import { LoginModal } from './components/LoginModal';
import { ClassModal } from './components/ClassModal';
import { StudentModal } from './components/StudentModal';
import { SpreadsheetImportModal } from './components/SpreadsheetImportModal';
import { GoogleLoginScreen } from './components/GoogleLoginScreen';
import { DeleteClassModal } from './components/DeleteClassModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { GoogleWorkspaceView } from './components/GoogleWorkspaceView';
import { SchoolMapView } from './components/SchoolMapView';
import { PromptGeneratorModulView } from './components/PromptGeneratorModulView';
import { KisiKartuSoalView } from './components/kisi-kartu-soal/KisiKartuSoalView';
import { PublicTabunganView } from './components/PublicTabunganView';
import { PublicAbsensiView } from './components/PublicAbsensiView';
import { PublicNilaiView } from './components/PublicNilaiView';
import { GradualSyncManager, SyncState } from './services/gradualSyncManager';

export default function App() {
  // Public Tabungan View State (for parents visiting public share link)
  const [publicShareId, setPublicShareId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('tabungan_share') || params.get('shareId') || null;
    }
    return null;
  });
  // Public Absensi View State (for parents visiting public attendance share link)
  const [publicAbsenShareId, setPublicAbsenShareId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('absen_share') || params.get('presensi_share') || null;
    }
    return null;
  });
  // Public Nilai View State (for students & parents visiting public grades preview/recap link)
  const [publicNilaiShareId, setPublicNilaiShareId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('nilai_share') || params.get('grades_share') || null;
    }
    return null;
  });
  const [publicNisn, setPublicNisn] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('nisn') || null;
    }
    return null;
  });
  const [publicStudentId, setPublicStudentId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('studentId') || null;
    }
    return null;
  });

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setPublicShareId(params.get('tabungan_share') || params.get('shareId') || null);
      setPublicAbsenShareId(params.get('absen_share') || params.get('presensi_share') || null);
      setPublicNilaiShareId(params.get('nilai_share') || params.get('grades_share') || null);
      setPublicNisn(params.get('nisn') || null);
      setPublicStudentId(params.get('studentId') || null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Load State from persistent storage as fast initial fallback
  const [teacher, setTeacher] = useState<TeacherProfile>(() => Storage.getTeacher());
  const [classes, setClasses] = useState<ClassRoom[]>(() => Storage.getClasses());
  const [activeClassId, setActiveClassId] = useState<string>(() => Storage.getActiveClassId());
  const [allStudents, setAllStudents] = useState<Student[]>(() => Storage.getAllStudents());
  const [allSessions, setAllSessions] = useState<AttendanceSession[]>(() =>
    Storage.getAllSessions()
  );
  const [allGrades, setAllGrades] = useState<StudentGrade[]>(() => Storage.getAllGrades());
  const [allAgendas, setAllAgendas] = useState<TeachingAgenda[]>(() => Storage.getAllAgendas());
  const [allSavings, setAllSavings] = useState<SavingTransaction[]>(() => Storage.getAllSavings());

  // Cloud State & UX Feedback
  const [isCloudLoading, setIsCloudLoading] = useState<boolean>(false);
  const [cloudStatusMsg, setCloudStatusMsg] = useState<string>('Menghubungkan ke Cloud Firestore...');
  const [isCloudSaving, setIsCloudSaving] = useState<boolean>(false);
  const [isSavingsSavingCloud, setIsSavingsSavingCloud] = useState<boolean>(false);
  const [lastSavingsCloudSavedAt, setLastSavingsCloudSavedAt] = useState<string | null>(null);
  const [hasUnsavedSavingsChanges, setHasUnsavedSavingsChanges] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Google Authentication Gate (persisted across refreshes)
  const [isGoogleLoggedIn, setIsGoogleLoggedIn] = useState<boolean>(() => {
    return (
      sessionStorage.getItem('sim_google_auth_active') === 'true' ||
      localStorage.getItem('sim_google_auth_active') === 'true'
    );
  });

  // Gradual Sync State (Browser persistence + background Cloud sync)
  const [syncState, setSyncState] = useState<SyncState>(() =>
    GradualSyncManager.getSyncState()
  );

  useEffect(() => {
    return GradualSyncManager.subscribe((state) => {
      setSyncState(state);
    });
  }, []);

  // Active Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('absensi');

  // Modals state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isSpreadsheetImportOpen, setIsSpreadsheetImportOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Delete Class Modal state
  const [isDeleteClassModalOpen, setIsDeleteClassModalOpen] = useState(false);
  const [classToDeleteId, setClassToDeleteId] = useState<string | null>(null);

  // Firebase Auth State Listener & Browser-First Data Priority
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setIsGoogleLoggedIn(true);
        sessionStorage.setItem('sim_google_auth_active', 'true');
        localStorage.setItem('sim_google_auth_active', 'true');
        GradualSyncManager.setActiveUid(firebaseUser.uid);

        // Prioritas Browser: Cek data yang sudah tersimpan di browser terlebih dahulu
        const localClasses = Storage.getClasses();
        const hasLocalData = localClasses.length > 0;

        // Jika data sudah ada di browser, gunakan langsung tanpa membuang kuota pembacaan Cloud!
        if (hasLocalData) {
          setIsCloudLoading(false);
          console.log('[App] Data dimuat dari browser lokal. Gunakan tombol navigasi untuk sinkronisasi ke Cloud.');
          return;
        }

        // Hanya jika browser benar-benar kosong, ambil data dari cloud untuk pertama kali
        setIsCloudLoading(true);
        setCloudStatusMsg(`Memeriksa data Cloud untuk ${firebaseUser.email || 'pengguna'}...`);

        try {
          const userData = await FirestoreService.loadUserData(firebaseUser.uid);

          if (userData.isNewUser) {
            setCloudStatusMsg('Menyiapkan ruang kelas & data awal Anda...');
            const seeded = await FirestoreService.seedInitialUserData(
              firebaseUser.uid,
              firebaseUser
            );
            setTeacher(seeded.teacher);
            setClasses(seeded.classes);
            setActiveClassId(seeded.activeClassId);
            setAllStudents(seeded.students);
            setAllSessions(seeded.sessions);
            setAllGrades(seeded.grades);
            if ((seeded as any).savings) {
              setAllSavings((seeded as any).savings);
            }
            showToast('Akun Google terhubung! Data baru disiapkan di browser.', 'success');
          } else {
            setTeacher(userData.teacher);
            setClasses(userData.classes);
            setActiveClassId(userData.activeClassId);
            setAllStudents(userData.students);
            setAllSessions(userData.sessions);
            setAllGrades(userData.grades);
            if (userData.agendas) {
              setAllAgendas(userData.agendas);
            }
            if ((userData as any).savings) {
              setAllSavings((userData as any).savings);
            }
            showToast(
              `Selamat datang, ${userData.teacher.namaGuru || firebaseUser.displayName || 'Guru'}. Data dimuat ke browser.`,
              'success'
            );
          }
        } catch (error: any) {
          console.error('[App] Notice loading from Cloud Firestore:', error);
          showToast('Menggunakan data tersimpan di browser lokal.', 'info');
        } finally {
          setIsCloudLoading(false);
        }
      } else {
        setIsGoogleLoggedIn(false);
        sessionStorage.removeItem('sim_google_auth_active');
        localStorage.removeItem('sim_google_auth_active');
        setIsCloudLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleForceSync = async () => {
    if (!auth.currentUser) {
      showToast('Silakan login dengan akun Google terlebih dahulu untuk menyinkronkan data ke Cloud Firestore.', 'info');
      return;
    }
    if (isQuotaExceeded()) {
      showToast(
        'Batas kuota harian Cloud Firestore sedang penuh. Seluruh data tetap tersimpan 100% aman di browser Anda.',
        'info'
      );
      return;
    }
    const uid = auth.currentUser.uid;
    setIsCloudSaving(true);
    setCloudStatusMsg('Menyinkronkan data browser & memperbarui link preview ke server cloud...');
    try {
      // 1. Direct workspace push to Cloud Firestore
      const ok = await GradualSyncManager.forceSyncNow();

      // 2. Synchronize all public preview snapshots (absensi, nilai, tabungan) for active classes
      const previewSyncResult = await FirestoreService.syncAllPublicSnapshots(uid, {
        teacher: Storage.getTeacher(),
        classes: Storage.getClasses(),
        students: Storage.getAllStudents(),
        sessions: Storage.getAllSessions(),
        grades: Storage.getAllGrades(),
        savings: Storage.getAllSavings(),
      });

      if (ok) {
        showToast(
          `Semua data browser dan ${previewSyncResult.totalSnapshots} link preview langsung terhubung & tersinkronkan ke Cloud!`,
          'success'
        );
      } else {
        showToast('Data tersimpan aman di browser & link preview telah diperbarui.', 'info');
      }
    } catch (err: any) {
      showToast('Data tersimpan di browser. Sinkron ke cloud tertunda: ' + (err?.message || 'koneksi'), 'info');
    } finally {
      setIsCloudSaving(false);
    }
  };

  const handlePullCloudData = async () => {
    if (!auth.currentUser) {
      showToast('Silakan login terlebih dahulu untuk mengambil data dari Cloud Firestore.', 'info');
      return;
    }
    const uid = auth.currentUser.uid;
    setIsCloudLoading(true);
    setCloudStatusMsg('Mengambil data terbaru dari Cloud Firestore...');
    try {
      const userData = await FirestoreService.loadUserData(uid, true);
      if (userData.isNewUser) {
        showToast('Data di Cloud Firestore masih kosong. Data lokal Anda tetap aktif.', 'info');
      } else {
        // Immediate sync to Storage (browser storage)
        if (userData.teacher) Storage.setTeacher(userData.teacher);
        if (Array.isArray(userData.classes)) Storage.setClasses(userData.classes);
        if (userData.activeClassId) Storage.setActiveClassId(userData.activeClassId);
        if (Array.isArray(userData.students)) Storage.setAllStudents(userData.students);
        if (Array.isArray(userData.sessions)) Storage.setAllSessions(userData.sessions);
        if (Array.isArray(userData.grades)) Storage.setAllGrades(userData.grades);
        if (Array.isArray(userData.agendas)) Storage.setAllAgendas(userData.agendas);
        if (Array.isArray((userData as any).savings)) Storage.setAllSavings((userData as any).savings);

        // Immediate React states update so everything shows immediately in UI
        if (userData.teacher) setTeacher(userData.teacher);
        if (Array.isArray(userData.classes)) setClasses(userData.classes);
        if (userData.activeClassId) setActiveClassId(userData.activeClassId);
        if (Array.isArray(userData.students)) setAllStudents(userData.students);
        if (Array.isArray(userData.sessions)) setAllSessions(userData.sessions);
        if (Array.isArray(userData.grades)) setAllGrades(userData.grades);
        if (Array.isArray(userData.agendas)) setAllAgendas(userData.agendas);
        if (Array.isArray((userData as any).savings)) setAllSavings((userData as any).savings);

        // Mark local as completely synced with cloud
        GradualSyncManager.markCloudSynced();

        // Broadcast to all preview tabs/windows so open links show fresh pulled data instantly
        FirestoreService.broadcastAllLocalPreviews(uid);

        showToast('Data dari Cloud Firestore berhasil ditarik & langsung tampil di aplikasi!', 'success');
      }
    } catch (error: any) {
      console.error('[App] Error manual sync from Cloud Firestore:', error);
      showToast('Gagal memuat data dari Cloud: ' + (error?.message || 'Periksa koneksi'), 'error');
    } finally {
      setIsCloudLoading(false);
    }
  };

  // Sync to Storage whenever state updates as secondary offline cache
  useEffect(() => {
    Storage.setTeacher(teacher);
  }, [teacher]);

  useEffect(() => {
    Storage.setClasses(classes);
  }, [classes]);

  useEffect(() => {
    Storage.setActiveClassId(activeClassId);
  }, [activeClassId]);

  useEffect(() => {
    Storage.setAllStudents(allStudents);
  }, [allStudents]);

  useEffect(() => {
    Storage.setAllSessions(allSessions);
  }, [allSessions]);

  useEffect(() => {
    Storage.setAllGrades(allGrades);
  }, [allGrades]);

  useEffect(() => {
    Storage.setAllAgendas(allAgendas);
  }, [allAgendas]);

  useEffect(() => {
    Storage.setAllSavings(allSavings);
  }, [allSavings]);

  // Current Active Class & its filtered data
  const currentClass =
    classes.find((c) => c.id === activeClassId) ||
    classes[0] || {
      id: 'default',
      namaKelas: 'Kelas Belum Dipilih',
      mataPelajaran: teacher.mataPelajaranUtama || 'Umum',
      kkm: 75,
      createdAt: new Date().toISOString(),
    };

  const classStudents = allStudents
    .filter((s) => s.classId === activeClassId)
    .sort((a, b) => a.no - b.no);

  const classSessions = allSessions
    .filter((s) => s.classId === activeClassId)
    .sort((a, b) => a.pertemuanKe - b.pertemuanKe);

  const classGrades = useMemo(() => {
    return allGrades.filter((g) => g.classId === activeClassId);
  }, [allGrades, activeClassId]);

  const calculatedGrades: CalculatedGrade[] = classStudents.map((std) => {
    const g = classGrades.find((grade) => grade.studentId === std.id);
    const validTugas = [
      g?.formatif1,
      g?.formatif2,
      g?.formatif3,
      g?.formatif4,
      g?.formatif5,
      g?.formatif6,
      g?.formatif7,
      g?.formatif8,
      g?.formatif9,
      g?.formatif10,
    ].filter((v): v is number => typeof v === 'number' && !isNaN(v));

    const rataFormatif =
      validTugas.length > 0
        ? Math.round(validTugas.reduce((a, b) => a + b, 0) / validTugas.length)
        : 0;

    const sumatifTengah = g?.sumatifTengah ?? g?.uts ?? 0;
    const sumatifAkhir = g?.sumatifAkhir ?? g?.uas ?? 0;
    const praktik = g?.praktik ?? 0;

    const nilaiAkhir = Math.round(
      rataFormatif * 0.4 + sumatifTengah * 0.25 + sumatifAkhir * 0.25 + praktik * 0.1
    );

    let predikat: 'A' | 'B' | 'C' | 'D' = 'D';
    if (nilaiAkhir >= 88) predikat = 'A';
    else if (nilaiAkhir >= 76) predikat = 'B';
    else if (nilaiAkhir >= 60) predikat = 'C';
    const status: 'Tuntas' | 'Belum Tuntas' =
      nilaiAkhir >= currentClass.kkm ? 'Tuntas' : 'Belum Tuntas';
    return {
      studentId: std.id,
      rataTugas: rataFormatif,
      nilaiAkhir,
      predikat,
      status,
    };
  });

  // Handlers for Teacher & Classes
  const handleSaveTeacher = async (updatedTeacher: TeacherProfile, newClasses?: ClassRoom[]) => {
    setTeacher(updatedTeacher);
    if (newClasses && newClasses.length > 0) {
      setClasses(newClasses);
      if (!newClasses.some((c) => c.id === activeClassId)) {
        setActiveClassId(newClasses[0].id);
      }
    }

    if (auth.currentUser) {
      setIsCloudSaving(true);
      try {
        await FirestoreService.saveTeacherProfile(auth.currentUser.uid, updatedTeacher);
        if (newClasses) {
          for (const cls of newClasses) {
            await FirestoreService.saveClass(auth.currentUser.uid, cls);
          }
        }
        showToast('Profil guru berhasil disimpan ke Cloud Firestore', 'success');
      } catch (err: any) {
        showToast('Gagal menyimpan profil ke Cloud: ' + err.message, 'error');
      } finally {
        setIsCloudSaving(false);
      }
    }
  };

  const handleOpenCreateClass = () => {
    setEditingClass(null);
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (cls?: ClassRoom) => {
    const target = cls || currentClass;
    if (target) {
      setEditingClass(target);
      setIsClassModalOpen(true);
    }
  };

  const handleSaveClass = async (classData: ClassRoom) => {
    const existingIndex = classes.findIndex((c) => c.id === classData.id);

    if (existingIndex >= 0) {
      // Edit / Update existing class
      const updatedClasses = classes.map((c) => (c.id === classData.id ? classData : c));
      setClasses(updatedClasses);

      if (auth.currentUser) {
        setIsCloudSaving(true);
        try {
          await FirestoreService.saveClass(auth.currentUser.uid, classData);
          showToast(
            `Data kelas "${classData.namaKelas}" (Mapel: ${classData.mataPelajaran}) berhasil diperbarui di Cloud Firestore`,
            'success'
          );
        } catch (err: any) {
          showToast('Gagal memperbarui kelas ke Cloud: ' + err.message, 'error');
        } finally {
          setIsCloudSaving(false);
        }
      } else {
        showToast(
          `Data kelas "${classData.namaKelas}" (Mapel: ${classData.mataPelajaran}) berhasil diperbarui`,
          'success'
        );
      }
    } else {
      // Create new class
      await handleSaveNewClass(classData);
    }
  };

  const handleSaveNewClass = async (newClass: ClassRoom) => {
    const updated = [...classes, newClass];
    setClasses(updated);
    setActiveClassId(newClass.id);

    // Also initialize an initial attendance session for this class
    const initialSession: AttendanceSession = {
      id: 'ses-' + Date.now(),
      classId: newClass.id,
      tanggal: new Date().toISOString().split('T')[0],
      pertemuanKe: 1,
      topikMateri: 'Pengenalan Mata Pelajaran & Kontrak Belajar',
      records: {},
    };
    setAllSessions((prev) => [...prev, initialSession]);

    if (auth.currentUser) {
      setIsCloudSaving(true);
      try {
        await FirestoreService.saveClass(auth.currentUser.uid, newClass);
        await FirestoreService.saveAttendanceSession(auth.currentUser.uid, initialSession);
        showToast(`Kelas ${newClass.namaKelas} berhasil disimpan ke Cloud Firestore`, 'success');
      } catch (err: any) {
        showToast('Gagal menyimpan kelas ke Cloud: ' + err.message, 'error');
      } finally {
        setIsCloudSaving(false);
      }
    }
  };

  const handleSelectClass = (classId: string) => {
    setActiveClassId(classId);
    if (auth.currentUser) {
      FirestoreService.saveTeacherProfile(auth.currentUser.uid, {
        ...teacher,
        activeClassId: classId,
      }).catch((e) => console.warn('Sync activeClassId error', e));
    }
  };

  // Google Login Handlers
  const handleGoogleLoginSuccess = async (
    updatedTeacher: TeacherProfile,
    selectedClassId?: string,
    newClass?: ClassRoom
  ) => {
    sessionStorage.setItem('sim_google_auth_active', 'true');
    localStorage.setItem('sim_google_auth_active', 'true');
    setIsGoogleLoggedIn(true);
    setTeacher(updatedTeacher);

    if (newClass) {
      const updatedClasses = [...classes, newClass];
      setClasses(updatedClasses);
      setActiveClassId(newClass.id);

      const initialSession: AttendanceSession = {
        id: 'ses-' + Date.now(),
        classId: newClass.id,
        tanggal: new Date().toISOString().split('T')[0],
        pertemuanKe: 1,
        topikMateri: 'Pengenalan Mata Pelajaran & Kontrak Belajar',
        records: {},
      };
      setAllSessions((prev) => [...prev, initialSession]);

      if (auth.currentUser) {
        setIsCloudSaving(true);
        try {
          await FirestoreService.saveClass(auth.currentUser.uid, newClass);
          await FirestoreService.saveAttendanceSession(auth.currentUser.uid, initialSession);
          await FirestoreService.saveTeacherProfile(auth.currentUser.uid, updatedTeacher);
        } catch (e) {
          console.warn('Sync on login error:', e);
        } finally {
          setIsCloudSaving(false);
        }
      }
    } else if (selectedClassId) {
      setActiveClassId(selectedClassId);
      if (auth.currentUser) {
        FirestoreService.saveTeacherProfile(auth.currentUser.uid, {
          ...updatedTeacher,
          activeClassId: selectedClassId,
        }).catch((e) => console.warn('Sync activeClassId error:', e));
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem('sim_google_auth_active');
      localStorage.removeItem('sim_google_auth_active');
      setIsGoogleLoggedIn(false);
      setTeacher((prev) => ({ ...prev, isLoggedIn: false }));
      showToast('Anda telah keluar dari akun Google.', 'info');
    } catch (error: any) {
      console.error('Error signing out:', error);
      showToast('Gagal keluar: ' + error.message, 'error');
    }
  };

  // Delete Class Handlers
  const handleRequestDeleteClass = (classId: string) => {
    setClassToDeleteId(classId);
    setIsDeleteClassModalOpen(true);
  };

  const handleConfirmDeleteClass = async (classId: string) => {
    if (classes.length <= 1) {
      alert('Tidak dapat menghapus. Minimal harus ada 1 kelas di aplikasi.');
      return;
    }

    const remainingClasses = classes.filter((c) => c.id !== classId);
    setClasses(remainingClasses);

    // Delete associated students, sessions, and grades
    setAllStudents((prev) => prev.filter((s) => s.classId !== classId));
    setAllSessions((prev) => prev.filter((ses) => ses.classId !== classId));
    setAllGrades((prev) => prev.filter((g) => g.classId !== classId));

    if (activeClassId === classId) {
      setActiveClassId(remainingClasses[0]?.id || '');
    }

    setIsDeleteClassModalOpen(false);
    setClassToDeleteId(null);

    if (auth.currentUser) {
      setIsCloudSaving(true);
      try {
        await FirestoreService.deleteClass(auth.currentUser.uid, classId);
        showToast('Kelas dan seluruh data terkait berhasil dihapus dari Cloud Firestore', 'success');
      } catch (err: any) {
        showToast('Gagal menghapus kelas dari Cloud: ' + err.message, 'error');
      } finally {
        setIsCloudSaving(false);
      }
    }
  };

  // Handlers for Attendance
  const handleUpdateStatus = (
    sessionId: string,
    studentId: string,
    status: AttendanceStatus
  ) => {
    setAllSessions((prev) => {
      const next = prev.map((ses) => {
        if (ses.id !== sessionId) return ses;
        return {
          ...ses,
          records: {
            ...ses.records,
            [studentId]: {
              status,
              catatan: ses.records[studentId]?.catatan || '',
            },
          },
        };
      });
      Storage.setAllSessions(next);
      // Real-time debounced cloud streaming in background (instant UI, no wait)
      if (auth.currentUser?.uid) {
        FirestoreService.queueWorkspaceSync(auth.currentUser.uid, { sessions: next });
      }
      return next;
    });
  };

  const handleUpdateCatatan = (
    sessionId: string,
    studentId: string,
    catatan: string
  ) => {
    setAllSessions((prev) => {
      const next = prev.map((ses) => {
        if (ses.id !== sessionId) return ses;
        return {
          ...ses,
          records: {
            ...ses.records,
            [studentId]: {
              status: ses.records[studentId]?.status || 'H',
              catatan,
            },
          },
        };
      });
      Storage.setAllSessions(next);
      if (auth.currentUser?.uid) {
        FirestoreService.queueWorkspaceSync(auth.currentUser.uid, { sessions: next });
      }
      return next;
    });
  };

  const handleMarkAllPresent = (sessionId: string) => {
    setAllSessions((prev) => {
      const next = prev.map((ses) => {
        if (ses.id !== sessionId) return ses;
        const newRecords = { ...ses.records };
        classStudents.forEach((std) => {
          newRecords[std.id] = {
            status: 'H',
            catatan: newRecords[std.id]?.catatan || '',
          };
        });
        return { ...ses, records: newRecords };
      });
      Storage.setAllSessions(next);
      if (auth.currentUser?.uid) {
        FirestoreService.queueWorkspaceSync(auth.currentUser.uid, { sessions: next });
      }
      return next;
    });
    showToast(
      'Semua siswa berhasil diset Masuk (Hadir) & otomatis disinkronisasi.',
      'info'
    );
  };

  const handleResetSession = (sessionId: string) => {
    setAllSessions((prev) => {
      const next = prev.map((ses) => {
        if (ses.id !== sessionId) return ses;
        return { ...ses, records: {} };
      });
      Storage.setAllSessions(next);
      if (auth.currentUser?.uid) {
        FirestoreService.queueWorkspaceSync(auth.currentUser.uid, { sessions: next });
      }
      return next;
    });
    showToast(
      'Status presensi direset & otomatis disinkronisasi.',
      'info'
    );
  };

  // Dedicated Cloud Save Handler for Attendance (triggered on clicking "Save" button)
  const handleSaveAttendanceToCloud = async (sessionId?: string) => {
    // Helper to auto-sync attendance snapshot to public collection for real-time parent monitoring
    const syncPublicAbsensi = (targetSessions: AttendanceSession[]) => {
      if (!currentClass?.id) return Promise.resolve();
      const shareId = FirestoreService.getPublicAbsensiShareId(
        auth.currentUser?.uid || 'guru',
        currentClass.id
      );
      return FirestoreService.publishPublicAbsensi({
        shareId,
        classId: currentClass.id,
        className: currentClass.namaKelas,
        mataPelajaran: currentClass.mataPelajaran,
        jurusan: currentClass.jurusan,
        schoolName: teacher.namaSekolah,
        waliKelas: teacher.namaGuru,
        nip: teacher.nip,
        academicYear: teacher.tahunAjaran,
        semester: teacher.semester,
        teacherUid: auth.currentUser?.uid,
        updatedAt: new Date().toISOString(),
        students: classStudents,
        sessions: targetSessions,
        isPublicEnabled: true,
        allowClassRecap: true,
        pinRequired: false,
      }).catch(() => {});
    };

    // Ensure allSessions are saved to local storage first
    Storage.setAllSessions(allSessions);

    if (!auth.currentUser) {
      showToast(
        'Data presensi tersimpan di memori lokal. Silakan masuk/login jika ingin tersimpan permanen di Cloud Firestore.',
        'info'
      );
      return;
    }

    setIsCloudSaving(true);
    if (sessionId) {
      const targetSession = allSessions.find((s) => s.id === sessionId);
      if (targetSession) {
        showToast(
          `Menyimpan presensi Pertemuan ${targetSession.pertemuanKe} (${currentClass.namaKelas}) ke Cloud...`,
          'info'
        );
        // Execute session write and public sync in parallel
        Promise.all([
          FirestoreService.saveAttendanceSession(
            auth.currentUser.uid,
            targetSession,
            allSessions
          ),
          syncPublicAbsensi(allSessions.filter((s) => s.classId === activeClassId)),
        ])
          .then(() => {
            setIsCloudSaving(false);
            showToast(
              `Presensi Pertemuan ${targetSession.pertemuanKe} (${currentClass.namaKelas}) berhasil tersimpan ke Cloud!`,
              'success'
            );
          })
          .catch((err: any) => {
            console.error('Error saving attendance to Firestore:', err);
            setIsCloudSaving(false);
            showToast('Tersimpan di perangkat lokal (koneksi cloud tertunda)', 'info');
          });
      }
    } else {
      // Save all sessions for active class
      const classSessionsToSave = allSessions.filter(
        (s) => s.classId === activeClassId
      );
      showToast(
        `Menyimpan seluruh rekap presensi (${classSessionsToSave.length} pertemuan) ke Cloud...`,
        'info'
      );
      Promise.all([
        FirestoreService.saveAttendanceSessionsBatch(
          auth.currentUser.uid,
          classSessionsToSave,
          allSessions
        ),
        syncPublicAbsensi(classSessionsToSave),
      ])
        .then(() => {
          setIsCloudSaving(false);
          showToast(
            `Seluruh rekap presensi (${classSessionsToSave.length} pertemuan) berhasil tersimpan ke Cloud!`,
            'success'
          );
        })
        .catch((err: any) => {
          console.error('Error saving attendance batch to Firestore:', err);
          setIsCloudSaving(false);
          showToast('Tersimpan di perangkat lokal (koneksi cloud tertunda)', 'info');
        });
    }
  };

  const handleAddSession = async (tanggal: string, pertemuanKe: number, topikMateri: string) => {
    const newSession: AttendanceSession = {
      id: 'ses-' + Date.now(),
      classId: activeClassId,
      tanggal,
      pertemuanKe,
      topikMateri,
      records: {},
    };
    const updatedSessions = [...allSessions, newSession];
    setAllSessions(updatedSessions);
    Storage.setAllSessions(updatedSessions);
    showToast(`Pertemuan ke-${pertemuanKe} berhasil ditambahkan!`, 'success');

    if (auth.currentUser) {
      setIsCloudSaving(true);
      FirestoreService.saveAttendanceSession(auth.currentUser.uid, newSession, updatedSessions)
        .then(() => setIsCloudSaving(false))
        .catch((err: any) => {
          console.error('Error saving new session to Firestore:', err);
          setIsCloudSaving(false);
        });
    }
  };

  const handleUpdateSession = async (
    sessionId: string,
    updates: { tanggal?: string; pertemuanKe?: number; topikMateri?: string }
  ) => {
    let updatedTarget: AttendanceSession | undefined;
    const updatedSessions = allSessions.map((s) => {
      if (s.id === sessionId) {
        updatedTarget = {
          ...s,
          ...updates,
        };
        return updatedTarget;
      }
      return s;
    });

    setAllSessions(updatedSessions);
    Storage.setAllSessions(updatedSessions);
    showToast(
      `Pertemuan ke-${updates.pertemuanKe || updatedTarget?.pertemuanKe || ''} berhasil diperbarui!`,
      'success'
    );

    if (auth.currentUser && updatedTarget) {
      setIsCloudSaving(true);
      FirestoreService.saveAttendanceSession(auth.currentUser.uid, updatedTarget, updatedSessions)
        .then(() => setIsCloudSaving(false))
        .catch((err: any) => {
          console.error('Error updating session in Firestore:', err);
          setIsCloudSaving(false);
        });
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    const updatedSessions = allSessions.filter((s) => s.id !== sessionId);
    setAllSessions(updatedSessions);
    Storage.setAllSessions(updatedSessions);
    showToast('Sesi presensi berhasil dihapus', 'info');

    if (auth.currentUser) {
      setIsCloudSaving(true);
      FirestoreService.deleteAttendanceSession(auth.currentUser.uid, sessionId, updatedSessions)
        .then(() => setIsCloudSaving(false))
        .catch((err: any) => {
          console.error('Error deleting session from Firestore:', err);
          setIsCloudSaving(false);
        });
    }
  };

  // Handlers for Students
  const handleSaveStudent = async (student: Student) => {
    setAllStudents((prev) => {
      const exists = prev.some((s) => s.id === student.id);
      if (exists) {
        return prev.map((s) => (s.id === student.id ? student : s));
      }
      return [...prev, student];
    });

    if (auth.currentUser) {
      setIsCloudSaving(true);
      try {
        await FirestoreService.saveStudent(auth.currentUser.uid, student);
        showToast(`Data siswa ${student.nama} berhasil disimpan ke Cloud Firestore`, 'success');
      } catch (err: any) {
        showToast('Gagal menyimpan siswa ke Cloud: ' + err.message, 'error');
      } finally {
        setIsCloudSaving(false);
      }
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    setAllStudents((prev) => prev.filter((s) => s.id !== studentId));
    // Clean up grades
    setAllGrades((prev) => prev.filter((g) => g.studentId !== studentId));

    if (auth.currentUser) {
      setIsCloudSaving(true);
      try {
        await FirestoreService.deleteStudent(auth.currentUser.uid, studentId);
        showToast('Siswa berhasil dihapus dari Cloud Firestore', 'success');
      } catch (err: any) {
        showToast('Gagal menghapus siswa dari Cloud: ' + err.message, 'error');
      } finally {
        setIsCloudSaving(false);
      }
    }
  };

  const handleUpdateStudentField = async (
    studentId: string,
    field: keyof Student,
    value: any
  ) => {
    let updatedTargetStudent: Student | null = null;
    setAllStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const updated = { ...s, [field]: value };
          updatedTargetStudent = updated;
          return updated;
        }
        return s;
      })
    );

    if (auth.currentUser && updatedTargetStudent) {
      setIsCloudSaving(true);
      try {
        await FirestoreService.saveStudent(auth.currentUser.uid, updatedTargetStudent);
      } catch (err: any) {
        showToast('Gagal menyimpan perubahan siswa ke Cloud: ' + err.message, 'error');
      } finally {
        setIsCloudSaving(false);
      }
    }
  };

  const handleImportStudents = async (newStudents: Student[], mode: 'replace' | 'append') => {
    let finalStudents: Student[] = [];
    setAllStudents((prev) => {
      if (mode === 'replace') {
        const others = prev.filter((s) => s.classId !== activeClassId);
        finalStudents = [...others, ...newStudents];
        return finalStudents;
      }
      finalStudents = [...prev, ...newStudents];
      return finalStudents;
    });

    let addedGrades: StudentGrade[] = [];
    setAllGrades((prev) => {
      const existingIds = new Set(prev.map((g) => g.studentId));
      addedGrades = newStudents
        .filter((s) => !existingIds.has(s.id))
        .map((s) => ({
          id: 'grd-' + s.id,
          studentId: s.id,
          classId: activeClassId,
          formatif1: null,
          formatif2: null,
          formatif3: null,
          formatif4: null,
          formatif5: null,
          formatif6: null,
          formatif7: null,
          formatif8: null,
          formatif9: null,
          formatif10: null,
          sumatifTengah: null,
          sumatifAkhir: null,
          praktik: null,
          catatan: '',
        }));
      return [...prev, ...addedGrades];
    });

    if (auth.currentUser) {
      setIsCloudSaving(true);
      try {
        await FirestoreService.importStudentsBatch(
          auth.currentUser.uid,
          newStudents,
          addedGrades,
          mode,
          activeClassId
        );
        showToast(`${newStudents.length} siswa berhasil disimpan ke Cloud Firestore`, 'success');
      } catch (err: any) {
        showToast('Gagal menyimpan impor siswa ke Cloud: ' + err.message, 'error');
      } finally {
        setIsCloudSaving(false);
      }
    }
  };

  // Handlers for Grades
  const handleUpdateGrade = async (
    studentId: string,
    field: keyof StudentGrade,
    value: number | string | null
  ) => {
    setAllGrades((prev) => {
      let next: StudentGrade[];
      const existing = prev.find(
        (g) => g.studentId === studentId && g.classId === activeClassId
      );
      if (existing) {
        next = prev.map((g) => {
          if (g.studentId === studentId && g.classId === activeClassId) {
            return { ...g, [field]: value };
          }
          return g;
        });
      } else {
        const newGrade: StudentGrade = {
          id: 'grd-' + studentId,
          studentId,
          classId: activeClassId,
          formatif1: null,
          formatif2: null,
          formatif3: null,
          formatif4: null,
          formatif5: null,
          formatif6: null,
          formatif7: null,
          formatif8: null,
          formatif9: null,
          formatif10: null,
          sumatifTengah: null,
          sumatifAkhir: null,
          praktik: null,
          catatan: '',
          [field]: value,
        };
        next = [...prev, newGrade];
      }
      Storage.setAllGrades(next);
      const effectiveUid =
        auth.currentUser?.uid ||
        teacher.id ||
        localStorage.getItem('smk_active_teacher_uid') ||
        't-guru-muh-bawang';
      FirestoreService.queueWorkspaceSync(effectiveUid, { grades: next });
      return next;
    });
  };

  // Dedicated Cloud Save Handler for Grades (user explicitly presses Save button or debounced auto-sync)
  const handleSaveGradesToCloud = async (
    updatedGrades: StudentGrade[],
    updatedHeaders: GradeColumnHeader[],
    options?: { silent?: boolean }
  ) => {
    // 1. Update allGrades state and local storage immediately (0ms)
    const otherClassGrades = allGrades.filter((g) => g.classId !== activeClassId);
    const combinedAllGrades = [...otherClassGrades, ...updatedGrades];
    setAllGrades(combinedAllGrades);
    Storage.setAllGrades(combinedAllGrades);

    // 2. Save headers to local storage
    Storage.setGradeHeaders(activeClassId, updatedHeaders);

    // 3. Determine effective UID: active Google UID or fallback teacher UID
    const effectiveUid =
      auth.currentUser?.uid ||
      teacher.id ||
      localStorage.getItem('smk_active_teacher_uid') ||
      't-guru-muh-bawang';

    if (!options?.silent) {
      setIsCloudSaving(true);
    }
    const startTime = performance.now();
    try {
      // High-performance single-roundtrip sync with headers bundled
      await FirestoreService.saveGradesBatch(
        effectiveUid,
        updatedGrades,
        combinedAllGrades,
        { classId: activeClassId, headers: updatedHeaders }
      );

      // Auto-update public link preview snapshot in background so formative scores reflect live
      const currentCls = classes.find((c) => c.id === activeClassId);
      if (currentCls) {
        const shareId = FirestoreService.getPublicNilaiShareId(
          effectiveUid,
          activeClassId
        );
        const classStudents = allStudents
          .filter((st) => st.classId === activeClassId)
          .map((st) => ({
            id: st.id,
            no: st.no,
            nisn: st.nisn || '',
            nama: st.nama,
            gender: st.gender,
          }));

        FirestoreService.publishPublicNilai({
          shareId,
          classId: activeClassId,
          className: currentCls.namaKelas,
          mataPelajaran: currentCls.mataPelajaran || teacher.mataPelajaranUtama || 'Pelajaran Umum',
          schoolName: teacher.namaSekolah || 'SMK Muhammadiyah Bawang',
          waliKelas: teacher.namaGuru || 'Guru Pengampu',
          nip: teacher.nip || '',
          academicYear: teacher.tahunAjaran || '2025/2026',
          semester: teacher.semester || 'Ganjil',
          kkm: currentCls.kkm || 75,
          teacherUid: effectiveUid,
          updatedAt: new Date().toISOString(),
          students: classStudents,
          grades: updatedGrades,
          columnHeaders: updatedHeaders,
          isPublicEnabled: true,
          allowClassRecap: true,
        }).catch((e) => console.warn('[AutoSync] Public nilai preview notice:', e));
      }

      const elapsed = Math.round(performance.now() - startTime);
      if (!options?.silent) {
        showToast(
          `Penilaian (${updatedGrades.length} siswa) tersinkron ke Cloud server (${elapsed}ms)!`,
          'success'
        );
      }
    } catch (err: any) {
      console.error('Error saving grades to Cloud Firestore:', err);
      if (!options?.silent) {
        showToast(
          'Tersimpan di perangkat lokal (koneksi cloud: ' + (err?.message || 'offline') + ')',
          'info'
        );
      }
    } finally {
      if (!options?.silent) {
        setIsCloudSaving(false);
      }
    }
  };

  const handleResetData = async () => {
    if (confirm('Apakah Anda yakin ingin memuat ulang seluruh data contoh bawaan di Cloud Firestore?')) {
      if (auth.currentUser) {
        setIsCloudLoading(true);
        setCloudStatusMsg('Mereset dan menyiapkan data contoh di Cloud Firestore...');
        try {
          const freshData = await FirestoreService.resetUserData(
            auth.currentUser.uid,
            auth.currentUser
          );
          setTeacher(freshData.teacher);
          setClasses(freshData.classes);
          setActiveClassId(freshData.activeClassId);
          setAllStudents(freshData.students);
          setAllSessions(freshData.sessions);
          setAllGrades(freshData.grades);
          showToast('Data contoh bawaan berhasil dimuat ke Cloud Firestore', 'success');
        } catch (err: any) {
          showToast('Gagal mereset data cloud: ' + err.message, 'error');
        } finally {
          setIsCloudLoading(false);
        }
      } else {
        Storage.resetToDefault();
        setTeacher(Storage.getTeacher());
        setClasses(Storage.getClasses());
        setActiveClassId(Storage.getActiveClassId());
        setAllStudents(Storage.getAllStudents());
        setAllSessions(Storage.getAllSessions());
        setAllGrades(Storage.getAllGrades());
        setAllAgendas(Storage.getAllAgendas());
        setAllSavings(Storage.getAllSavings());
        setActiveTab('absensi');
      }
    }
  };

  const handleSaveAgenda = async (agenda: TeachingAgenda) => {
    const existingIndex = allAgendas.findIndex((a) => a.id === agenda.id);
    let updated: TeachingAgenda[];
    if (existingIndex >= 0) {
      updated = [...allAgendas];
      updated[existingIndex] = agenda;
    } else {
      updated = [agenda, ...allAgendas];
    }
    // 1. OPTIMISTIC UPDATE: update local state & storage immediately
    setAllAgendas(updated);
    Storage.setAllAgendas(updated);

    const currentUser = auth.currentUser;
    if (currentUser) {
      // 2. Immediate feedback
      showToast('Agenda mengajar berhasil disimpan ke Cloud!', 'success');
      setIsCloudSaving(true);
      // 3. Non-blocking background persistence
      FirestoreService.saveAgenda(currentUser.uid, agenda, updated)
        .then(() => {
          setIsCloudSaving(false);
        })
        .catch((err: any) => {
          console.error('[App] Background save agenda error:', err);
          setIsCloudSaving(false);
          showToast('Tersimpan di perangkat lokal (koneksi cloud tertunda)', 'info');
        });
    } else {
      showToast('Agenda mengajar tersimpan di penyimpanan lokal.', 'success');
    }
  };

  const handleDeleteAgenda = async (agendaId: string) => {
    const updated = allAgendas.filter((a) => a.id !== agendaId);
    // 1. OPTIMISTIC UPDATE: remove from local state immediately
    setAllAgendas(updated);
    Storage.setAllAgendas(updated);
    showToast('Agenda mengajar berhasil dihapus.', 'info');

    const currentUser = auth.currentUser;
    if (currentUser) {
      setIsCloudSaving(true);
      FirestoreService.deleteAgenda(currentUser.uid, agendaId, updated)
        .then(() => setIsCloudSaving(false))
        .catch((err: any) => {
          console.error('[App] Background delete agenda error:', err);
          setIsCloudSaving(false);
        });
    }
  };

  // Handlers for Tabungan Siswa (Fast Real-Time Cloud Sync)
  const handleAddSavingTransaction = (tx: SavingTransaction) => {
    const updated = [tx, ...allSavings];
    setAllSavings(updated);
    Storage.setAllSavings(updated);
    setHasUnsavedSavingsChanges(true);
    showToast(`Transaksi ${tx.jenis === 'setor' ? 'setoran' : 'penarikan'} Rp ${tx.nominal.toLocaleString('id-ID')} berhasil dicatat!`, 'success');

    const syncUid = auth.currentUser?.uid || teacher.googleId || teacher.id || 'guru';
    FirestoreService.saveSavingsBatch(syncUid, [tx], updated)
      .then(() => {
        setHasUnsavedSavingsChanges(false);
        setLastSavingsCloudSavedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      })
      .catch((err) => {
        console.warn('[App] Auto-sync savings to cloud warning:', err);
      });
  };

  const handleAddBatchSavingTransactions = (txs: SavingTransaction[]) => {
    const updated = [...txs, ...allSavings];
    setAllSavings(updated);
    Storage.setAllSavings(updated);
    setHasUnsavedSavingsChanges(true);
    showToast(`${txs.length} transaksi tabungan berhasil dicatat!`, 'success');

    const syncUid = auth.currentUser?.uid || teacher.googleId || teacher.id || 'guru';
    FirestoreService.saveSavingsBatch(syncUid, txs, updated)
      .then(() => {
        setHasUnsavedSavingsChanges(false);
        setLastSavingsCloudSavedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      })
      .catch((err) => {
        console.warn('[App] Auto-sync batch savings warning:', err);
      });
  };

  const handleDeleteSavingTransaction = (txId: string) => {
    const updated = allSavings.filter((t) => t.id !== txId);
    setAllSavings(updated);
    Storage.setAllSavings(updated);
    setHasUnsavedSavingsChanges(true);
    showToast('Transaksi tabungan telah dihapus.', 'info');

    const syncUid = auth.currentUser?.uid || teacher.googleId || teacher.id || 'guru';
    FirestoreService.saveSavingsBatch(syncUid, [], updated)
      .then(() => {
        setHasUnsavedSavingsChanges(false);
        setLastSavingsCloudSavedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      })
      .catch((err) => {
        console.warn('[App] Delete savings cloud warning:', err);
      });
  };

  const handleManualSaveSavingsToCloud = async () => {
    const syncUid = auth.currentUser?.uid || teacher.googleId || teacher.id || 'guru';
    setIsSavingsSavingCloud(true);
    try {
      await FirestoreService.saveSavingsBatch(syncUid, [], allSavings);
      setHasUnsavedSavingsChanges(false);
      const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavingsCloudSavedAt(nowStr);
      showToast('Seluruh data tabungan siswa berhasil disimpan & disinkronkan ke Cloud Firestore!', 'success');
    } catch (err: any) {
      showToast('Gagal menyimpan tabungan ke cloud: ' + (err?.message || 'Error koneksi'), 'error');
    } finally {
      setIsSavingsSavingCloud(false);
    }
  };

  const handleApplyRestoredData = async (restored: {
    teacher: TeacherProfile;
    classes: ClassRoom[];
    activeClassId: string;
    students: Student[];
    sessions: AttendanceSession[];
    grades: StudentGrade[];
    agendas: TeachingAgenda[];
    savings: SavingTransaction[];
  }) => {
    setTeacher(restored.teacher);
    setClasses(restored.classes);
    setActiveClassId(restored.activeClassId);
    setAllStudents(restored.students);
    setAllSessions(restored.sessions);
    setAllGrades(restored.grades);
    setAllAgendas(restored.agendas);
    setAllSavings(restored.savings);

    Storage.setTeacher(restored.teacher);
    Storage.setClasses(restored.classes);
    Storage.setActiveClassId(restored.activeClassId);
    Storage.setAllStudents(restored.students);
    Storage.setAllSessions(restored.sessions);
    Storage.setAllGrades(restored.grades);
    Storage.setAllAgendas(restored.agendas);
    Storage.setAllSavings(restored.savings);

    const currentUser = auth.currentUser;
    if (currentUser) {
      setIsCloudSaving(true);
      try {
        await FirestoreService.saveFullWorkspace(currentUser.uid, {
          teacher: restored.teacher,
          classes: restored.classes,
          activeClassId: restored.activeClassId,
          students: restored.students,
          sessions: restored.sessions,
          grades: restored.grades,
          agendas: restored.agendas,
          savings: restored.savings,
        });
        showToast('Database JSON berhasil dipulihkan dan disinkronkan ke Cloud Firestore!', 'success');
      } catch (err: any) {
        showToast('Data lokal berhasil dipulihkan. Gagal sinkron ke Cloud: ' + (err?.message || 'Koneksi error'), 'error');
      } finally {
        setIsCloudSaving(false);
      }
    } else {
      showToast('Database JSON berhasil dipulihkan ke penyimpanan lokal!', 'success');
    }
  };

  // Public Tabungan Screen for Parents (Bypass teacher login & workspace gate)
  if (publicShareId) {
    return (
      <>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        <PublicTabunganView
          shareId={publicShareId}
          initialNisn={publicNisn || undefined}
          initialStudentId={publicStudentId || undefined}
        />
      </>
    );
  }

  // Public Absensi Screen for Parents (Bypass teacher login & workspace gate)
  if (publicAbsenShareId) {
    return (
      <>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        <PublicAbsensiView
          shareId={publicAbsenShareId}
          initialNisn={publicNisn || undefined}
          initialStudentId={publicStudentId || undefined}
        />
      </>
    );
  }

  // Public Nilai Screen for Students & Parents (Bypass teacher login & workspace gate)
  if (publicNilaiShareId) {
    return (
      <>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        <PublicNilaiView
          shareId={publicNilaiShareId}
          initialNisn={publicNisn || undefined}
          initialStudentId={publicStudentId || undefined}
        />
      </>
    );
  }

  // Cloud Loading Screen Indicator (Requirement 3: UX Indicator Spinner/Skeleton)
  if (isCloudLoading) {
    return (
      <CloudLoadingScreen
        userEmail={teacher.email || auth.currentUser?.email || undefined}
        userName={teacher.namaGuru || auth.currentUser?.displayName || undefined}
        statusMessage={cloudStatusMsg}
        onSkip={() => setIsCloudLoading(false)}
      />
    );
  }

  // Google Login Gate (as explicitly requested: "Awali dengan form login dengan akun google bagi user")
  if (!isGoogleLoggedIn) {
    return (
      <>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        <GoogleLoginScreen
          initialTeacher={teacher}
          existingClasses={classes}
          onLoginSuccess={handleGoogleLoginSuccess}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Top Navigation */}
      <Navbar
        teacher={teacher}
        classes={classes}
        activeClassId={activeClassId}
        activeTab={activeTab}
        isCloudSaving={isCloudSaving}
        isCloudLoading={isCloudLoading}
        syncStatus={syncState.status}
        lastSyncedTime={syncState.lastSyncedTimeStr}
        pendingCount={syncState.pendingCount}
        onForceSync={handleForceSync}
        onPullCloudData={handlePullCloudData}
        onSelectClass={handleSelectClass}
        onSelectTab={setActiveTab}
        onOpenClassModal={handleOpenCreateClass}
        onOpenEditClass={handleOpenEditClass}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onResetData={handleResetData}
        onDeleteClass={handleRequestDeleteClass}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* TAB 1: ABSENSI SISWA */}
        {activeTab === 'absensi' && (
          <AttendanceView
            students={classStudents}
            sessions={classSessions}
            activeClassId={activeClassId}
            activeClassName={currentClass.namaKelas}
            mataPelajaran={currentClass.mataPelajaran}
            teacherName={teacher.namaGuru}
            schoolName={teacher.namaSekolah}
            isCloudSaving={isCloudSaving}
            onSaveAttendanceToCloud={handleSaveAttendanceToCloud}
            onUpdateStatus={handleUpdateStatus}
            onUpdateCatatan={handleUpdateCatatan}
            onMarkAllPresent={handleMarkAllPresent}
            onResetSession={handleResetSession}
            onAddSession={handleAddSession}
            onUpdateSession={handleUpdateSession}
            onDeleteSession={handleDeleteSession}
            onEditStudent={(s) => {
              setEditingStudent(s);
              setIsStudentModalOpen(true);
            }}
            onDeleteStudent={handleDeleteStudent}
            onUpdateStudentField={handleUpdateStudentField}
            onOpenAddStudent={() => {
              setEditingStudent(null);
              setIsStudentModalOpen(true);
            }}
            onOpenSpreadsheetImport={() => setIsSpreadsheetImportOpen(true)}
            onOpenWorkspaceTab={() => setActiveTab('workspace')}
            onOpenParentReportTab={() => setActiveTab('laporan-ortu')}
            onOpenEditClass={() => handleOpenEditClass(currentClass)}
            currentClass={currentClass}
            teacher={teacher}
            onShowToast={showToast}
          />
        )}

        {/* TAB BARU: AGENDA & JURNAL MENGAJAR */}
        {activeTab === 'agenda' && (
          <TeachingAgendaView
            agendas={allAgendas}
            classes={classes}
            activeClassId={activeClassId}
            teacher={teacher}
            onSaveAgenda={handleSaveAgenda}
            onDeleteAgenda={handleDeleteAgenda}
          />
        )}

        {/* TAB BARU: GENERATOR PROMPT MODUL AJAR & LKPD */}
        {activeTab === 'generator-modul' && (
          <PromptGeneratorModulView
            teacher={teacher}
            classes={classes}
            activeClassId={activeClassId}
          />
        )}

        {/* TAB BARU PALING KANAN: APLIKASI KISI-KISI & KARTU SOAL (KUMER EDITED) */}
        {activeTab === 'kisi-kartu-soal' && (
          <KisiKartuSoalView />
        )}

        {/* TAB 2: INPUT & REKAP NILAI */}
        {activeTab === 'nilai' && (
          <GradesView
            students={classStudents}
            grades={classGrades}
            kkm={currentClass.kkm}
            className={currentClass.namaKelas}
            mataPelajaran={currentClass.mataPelajaran}
            classId={activeClassId}
            semester={teacher.semester}
            academicYear={teacher.tahunAjaran}
            onSaveGrades={handleSaveGradesToCloud}
            onUpdateGrade={handleUpdateGrade}
            onUpdateStudentField={handleUpdateStudentField}
            onEditStudent={(s) => {
              setEditingStudent(s);
              setIsStudentModalOpen(true);
            }}
            onOpenEditClass={() => handleOpenEditClass(currentClass)}
            currentClass={currentClass}
            teacher={teacher}
            currentUid={auth.currentUser?.uid || 'demo'}
            onShowToast={showToast}
          />
        )}

        {/* TAB BARU: TABUNGAN SISWA & KAS KELAS */}
        {activeTab === 'tabungan' && (
          <TabunganView
            currentClass={currentClass}
            allClasses={classes}
            onSelectClass={handleSelectClass}
            students={classStudents}
            teacher={teacher}
            savings={allSavings}
            onAddTransaction={handleAddSavingTransaction}
            onAddBatchTransactions={handleAddBatchSavingTransactions}
            onDeleteTransaction={handleDeleteSavingTransaction}
            onSaveToCloud={handleManualSaveSavingsToCloud}
            isSavingCloud={isSavingsSavingCloud}
            hasUnsavedCloudChanges={hasUnsavedSavingsChanges}
            lastCloudSavedAt={lastSavingsCloudSavedAt}
            onShowToast={showToast}
            onOpenBackupModal={() => setIsBackupModalOpen(true)}
          />
        )}

        {/* TAB 3: RESUME & STATISTIK */}
        {activeTab === 'statistik' && (
          <StatisticsResumeView
            students={classStudents}
            sessions={classSessions}
            grades={classGrades}
            kkm={currentClass.kkm}
            className={currentClass.namaKelas}
            mataPelajaran={currentClass.mataPelajaran}
            onOpenEditClass={() => handleOpenEditClass(currentClass)}
          />
        )}

        {/* TAB 4: INPUT SPREADSHEET & MANUAL */}
        {activeTab === 'impor' && (
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold uppercase tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                      {currentClass.namaKelas}
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      {currentClass.mataPelajaran}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenEditClass(currentClass)}
                      title={`Edit nama kelas atau mapel (${currentClass.namaKelas})`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-2 py-0.5 rounded-md transition-colors cursor-pointer shadow-2xs ml-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Kelas & Mapel</span>
                    </button>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                    Manajemen Data Siswa
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Tambah siswa secara manual atau impor massal langsung dari file spreadsheet Excel / Google Sheets
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingStudent(null);
                      setIsStudentModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Siswa Manual</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSpreadsheetImportOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Impor Spreadsheet</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Existing Students Table in this class */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Daftar Siswa Kelas {currentClass.namaKelas} ({classStudents.length} Siswa)
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">No</th>
                      <th className="py-2.5 px-3 w-28">NISN</th>
                      <th className="py-2.5 px-4">Nama Lengkap Siswa</th>
                      <th className="py-2.5 px-3 w-32 text-center">Gender</th>
                      <th className="py-2.5 px-4">Catatan Khusus</th>
                      <th className="py-2.5 px-3 w-24 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {classStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-400">
                          Belum ada siswa di kelas ini. Klik tombol di atas untuk menambah atau impor data.
                        </td>
                      </tr>
                    ) : (
                      classStudents.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 text-center font-medium text-slate-500">{s.no}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{s.nisn}</td>
                          <td className="py-2.5 px-4 font-bold text-slate-900">{s.nama}</td>
                          <td className="py-2.5 px-3 text-center">
                            {s.gender === 'L' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <span>♂</span> Laki-laki
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-pink-50 text-pink-700 border border-pink-200">
                                <span>♀</span> Perempuan
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600">{s.catatanUmum || '-'}</td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingStudent(s);
                                  setIsStudentModalOpen(true);
                                }}
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded cursor-pointer"
                                title="Edit"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Hapus ${s.nama}?`)) handleDeleteStudent(s.id);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                title="Hapus"
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: GOOGLE WORKSPACE (DRIVE, SHEETS, DOCS, GMAIL, CALENDAR, TASKS, CLOUD SQL) */}
        {activeTab === 'workspace' && (
          <GoogleWorkspaceView
            currentClass={currentClass}
            students={classStudents}
            sessions={classSessions}
            grades={classGrades}
            calculatedGrades={calculatedGrades}
            teacher={teacher}
            onImportStudents={handleImportStudents}
          />
        )}

        {/* TAB 6: PETA SEBARAN & ZONASI SISWA (GOOGLE MAPS) */}
        {activeTab === 'peta' && (
          <SchoolMapView
            students={classStudents}
            sessions={classSessions}
            teacher={teacher}
          />
        )}

        {/* TAB 7: FORMAT LAPORAN HARIAN ORANG TUA (WHATSAPP) */}
        {activeTab === 'laporan-ortu' && (
          <ParentDailyReportView
            teacher={teacher}
            classRoom={currentClass}
            students={classStudents}
            sessions={classSessions}
          />
        )}
      </main>

      {/* Global Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        teacher={teacher}
        classes={classes}
        onSave={handleSaveTeacher}
        onClose={() => setIsLoginModalOpen(false)}
      />

      <ClassModal
        isOpen={isClassModalOpen}
        editingClass={editingClass}
        defaultMapel={teacher.mataPelajaranUtama}
        onSaveClass={handleSaveClass}
        onClose={() => {
          setIsClassModalOpen(false);
          setEditingClass(null);
        }}
      />

      <StudentModal
        isOpen={isStudentModalOpen}
        editingStudent={editingStudent}
        nextNo={classStudents.length + 1}
        classId={activeClassId}
        onSave={handleSaveStudent}
        onClose={() => {
          setIsStudentModalOpen(false);
          setEditingStudent(null);
        }}
      />

      <SpreadsheetImportModal
        isOpen={isSpreadsheetImportOpen}
        classId={activeClassId}
        className={currentClass.namaKelas}
        existingStudentsCount={classStudents.length}
        onImportStudents={handleImportStudents}
        onClose={() => setIsSpreadsheetImportOpen(false)}
      />

      {/* Delete Class Confirmation Modal */}
      <DeleteClassModal
        isOpen={isDeleteClassModalOpen}
        classRoom={classes.find((c) => c.id === classToDeleteId) || null}
        studentsCount={allStudents.filter((s) => s.classId === classToDeleteId).length}
        sessionsCount={allSessions.filter((s) => s.classId === classToDeleteId).length}
        totalClassesCount={classes.length}
        onConfirmDelete={handleConfirmDeleteClass}
        onClose={() => {
          setIsDeleteClassModalOpen(false);
          setClassToDeleteId(null);
        }}
      />

      {/* Full Database JSON Backup & Restore Modal (Kendali Penuh Guru) */}
      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        teacher={teacher}
        classes={classes}
        activeClassId={activeClassId}
        allStudents={allStudents}
        allSessions={allSessions}
        allGrades={allGrades}
        allAgendas={allAgendas}
        allSavings={allSavings}
        onApplyRestoredData={handleApplyRestoredData}
        onShowToast={showToast}
      />

      {/* Footer (Hidden on print) */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto no-print">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          <p>
            Aplikasi Presensi Kehadiran & Penilaian Siswa • {teacher.namaSekolah} • Diampu oleh {teacher.namaGuru} ({teacher.mataPelajaranUtama})
          </p>
        </div>
      </footer>
    </div>
  );
}
