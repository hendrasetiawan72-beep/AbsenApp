import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import {
  ActiveTab,
  ClassRoom,
  TeacherProfile,
  Student,
  AttendanceSession,
  StudentGrade,
  AttendanceStatus,
  CalculatedGrade,
} from './types';
import { Storage } from './utils/storage';
import { Navbar } from './components/Navbar';
import { AttendanceView } from './components/AttendanceView';
import { GradesView } from './components/GradesView';
import { StatisticsResumeView } from './components/StatisticsResumeView';
import { ParentDailyReportView } from './components/ParentDailyReportView';
import { LoginModal } from './components/LoginModal';
import { ClassModal } from './components/ClassModal';
import { StudentModal } from './components/StudentModal';
import { SpreadsheetImportModal } from './components/SpreadsheetImportModal';
import { GoogleLoginScreen } from './components/GoogleLoginScreen';
import { DeleteClassModal } from './components/DeleteClassModal';
import { GoogleWorkspaceView } from './components/GoogleWorkspaceView';
import { SchoolMapView } from './components/SchoolMapView';

export default function App() {
  // Load State from persistent storage
  const [teacher, setTeacher] = useState<TeacherProfile>(() => Storage.getTeacher());
  const [classes, setClasses] = useState<ClassRoom[]>(() => Storage.getClasses());
  const [activeClassId, setActiveClassId] = useState<string>(() => Storage.getActiveClassId());
  const [allStudents, setAllStudents] = useState<Student[]>(() => Storage.getAllStudents());
  const [allSessions, setAllSessions] = useState<AttendanceSession[]>(() =>
    Storage.getAllSessions()
  );
  const [allGrades, setAllGrades] = useState<StudentGrade[]>(() => Storage.getAllGrades());

  // Google Authentication Gate (as explicitly requested: "Awali dengan form login dengan akun google bagi user")
  const [isGoogleLoggedIn, setIsGoogleLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('sim_google_auth_active') === 'true';
  });

  // Active Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('absensi');

  // Modals state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isSpreadsheetImportOpen, setIsSpreadsheetImportOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Delete Class Modal state
  const [isDeleteClassModalOpen, setIsDeleteClassModalOpen] = useState(false);
  const [classToDeleteId, setClassToDeleteId] = useState<string | null>(null);

  // Sync to Storage whenever state updates
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

  const classGrades = allGrades.filter((g) => g.classId === activeClassId);

  const calculatedGrades: CalculatedGrade[] = classStudents.map((std) => {
    const g = classGrades.find((grade) => grade.studentId === std.id);
    const validTugas = [g?.tugas1, g?.tugas2, g?.tugas3].filter(
      (v): v is number => typeof v === 'number' && !isNaN(v)
    );
    const rataTugas =
      validTugas.length > 0
        ? Math.round(validTugas.reduce((a, b) => a + b, 0) / validTugas.length)
        : 0;
    const uts = g?.uts ?? 0;
    const uas = g?.uas ?? 0;
    const praktik = g?.praktik ?? 0;
    const nilaiAkhir = Math.round(
      rataTugas * 0.3 + uts * 0.25 + uas * 0.25 + praktik * 0.2
    );
    let predikat: 'A' | 'B' | 'C' | 'D' = 'D';
    if (nilaiAkhir >= 88) predikat = 'A';
    else if (nilaiAkhir >= 76) predikat = 'B';
    else if (nilaiAkhir >= 60) predikat = 'C';
    const status: 'Tuntas' | 'Belum Tuntas' =
      nilaiAkhir >= currentClass.kkm ? 'Tuntas' : 'Belum Tuntas';
    return {
      studentId: std.id,
      rataTugas,
      nilaiAkhir,
      predikat,
      status,
    };
  });

  // Handlers for Teacher & Classes
  const handleSaveTeacher = (updatedTeacher: TeacherProfile, newClasses?: ClassRoom[]) => {
    setTeacher(updatedTeacher);
    if (newClasses && newClasses.length > 0) {
      setClasses(newClasses);
      if (!newClasses.some((c) => c.id === activeClassId)) {
        setActiveClassId(newClasses[0].id);
      }
    }
  };

  const handleSaveNewClass = (newClass: ClassRoom) => {
    const updated = [...classes, newClass];
    setClasses(updated);
    setActiveClassId(newClass.id);

    // Also initialize an initial attendance session for this class if empty
    const initialSession: AttendanceSession = {
      id: 'ses-' + Date.now(),
      classId: newClass.id,
      tanggal: new Date().toISOString().split('T')[0],
      pertemuanKe: 1,
      topikMateri: 'Pengenalan Mata Pelajaran & Kontrak Belajar',
      records: {},
    };
    setAllSessions((prev) => [...prev, initialSession]);
  };

  const handleSelectClass = (classId: string) => {
    setActiveClassId(classId);
  };

  // Google Login Handlers
  const handleGoogleLoginSuccess = (
    updatedTeacher: TeacherProfile,
    selectedClassId?: string,
    newClass?: ClassRoom
  ) => {
    sessionStorage.setItem('sim_google_auth_active', 'true');
    setIsGoogleLoggedIn(true);
    setTeacher(updatedTeacher);

    if (newClass) {
      const updatedClasses = [...classes, newClass];
      setClasses(updatedClasses);
      setActiveClassId(newClass.id);

      // Create initial attendance session for new class
      const initialSession: AttendanceSession = {
        id: 'ses-' + Date.now(),
        classId: newClass.id,
        tanggal: new Date().toISOString().split('T')[0],
        pertemuanKe: 1,
        topikMateri: 'Pengenalan Mata Pelajaran & Kontrak Belajar',
        records: {},
      };
      setAllSessions((prev) => [...prev, initialSession]);
    } else if (selectedClassId) {
      setActiveClassId(selectedClassId);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('sim_google_auth_active');
    setIsGoogleLoggedIn(false);
    setTeacher((prev) => ({ ...prev, isLoggedIn: false }));
  };

  // Delete Class Handlers
  const handleRequestDeleteClass = (classId: string) => {
    setClassToDeleteId(classId);
    setIsDeleteClassModalOpen(true);
  };

  const handleConfirmDeleteClass = (classId: string) => {
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
  };

  // Handlers for Attendance
  const handleUpdateStatus = (
    sessionId: string,
    studentId: string,
    status: AttendanceStatus
  ) => {
    setAllSessions((prev) =>
      prev.map((ses) => {
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
      })
    );
  };

  const handleUpdateCatatan = (
    sessionId: string,
    studentId: string,
    catatan: string
  ) => {
    setAllSessions((prev) =>
      prev.map((ses) => {
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
      })
    );
  };

  const handleMarkAllPresent = (sessionId: string) => {
    setAllSessions((prev) =>
      prev.map((ses) => {
        if (ses.id !== sessionId) return ses;
        const newRecords = { ...ses.records };
        classStudents.forEach((std) => {
          if (!newRecords[std.id] || !newRecords[std.id].status) {
            newRecords[std.id] = { status: 'H', catatan: '' };
          }
        });
        return { ...ses, records: newRecords };
      })
    );
  };

  const handleResetSession = (sessionId: string) => {
    setAllSessions((prev) =>
      prev.map((ses) => {
        if (ses.id !== sessionId) return ses;
        return { ...ses, records: {} };
      })
    );
  };

  const handleAddSession = (tanggal: string, pertemuanKe: number, topikMateri: string) => {
    const newSession: AttendanceSession = {
      id: 'ses-' + Date.now(),
      classId: activeClassId,
      tanggal,
      pertemuanKe,
      topikMateri,
      records: {},
    };
    setAllSessions((prev) => [...prev, newSession]);
  };

  const handleDeleteSession = (sessionId: string) => {
    setAllSessions((prev) => prev.filter((s) => s.id !== sessionId));
  };

  // Handlers for Students
  const handleSaveStudent = (student: Student) => {
    setAllStudents((prev) => {
      const exists = prev.some((s) => s.id === student.id);
      if (exists) {
        return prev.map((s) => (s.id === student.id ? student : s));
      }
      return [...prev, student];
    });
  };

  const handleDeleteStudent = (studentId: string) => {
    setAllStudents((prev) => prev.filter((s) => s.id !== studentId));
    // Clean up grades
    setAllGrades((prev) => prev.filter((g) => g.studentId !== studentId));
  };

  const handleImportStudents = (newStudents: Student[], mode: 'replace' | 'append') => {
    setAllStudents((prev) => {
      if (mode === 'replace') {
        const others = prev.filter((s) => s.classId !== activeClassId);
        return [...others, ...newStudents];
      }
      return [...prev, ...newStudents];
    });

    // Auto-create blank grade rows for new students
    setAllGrades((prev) => {
      const existingIds = new Set(prev.map((g) => g.studentId));
      const addedGrades: StudentGrade[] = newStudents
        .filter((s) => !existingIds.has(s.id))
        .map((s) => ({
          id: 'grd-' + s.id,
          studentId: s.id,
          classId: activeClassId,
          tugas1: null,
          tugas2: null,
          tugas3: null,
          uts: null,
          uas: null,
          praktik: null,
          catatan: '',
        }));
      return [...prev, ...addedGrades];
    });
  };

  // Handlers for Grades
  const handleUpdateGrade = (
    studentId: string,
    field: keyof StudentGrade,
    value: number | string | null
  ) => {
    setAllGrades((prev) => {
      const existing = prev.find(
        (g) => g.studentId === studentId && g.classId === activeClassId
      );
      if (existing) {
        return prev.map((g) => {
          if (g.studentId === studentId && g.classId === activeClassId) {
            return { ...g, [field]: value };
          }
          return g;
        });
      }
      // Create new row
      const newGrade: StudentGrade = {
        id: 'grd-' + Date.now(),
        studentId,
        classId: activeClassId,
        tugas1: null,
        tugas2: null,
        tugas3: null,
        uts: null,
        uas: null,
        praktik: null,
        catatan: '',
        [field]: value,
      };
      return [...prev, newGrade];
    });
  };

  const handleResetData = () => {
    if (confirm('Apakah Anda yakin ingin memuat ulang seluruh data contoh bawaan?')) {
      Storage.resetToDefault();
      setTeacher(Storage.getTeacher());
      setClasses(Storage.getClasses());
      setActiveClassId(Storage.getActiveClassId());
      setAllStudents(Storage.getAllStudents());
      setAllSessions(Storage.getAllSessions());
      setAllGrades(Storage.getAllGrades());
      setActiveTab('absensi');
    }
  };

  // Google Login Gate (as explicitly requested: "Awali dengan form login dengan akun google bagi user")
  if (!isGoogleLoggedIn) {
    return (
      <GoogleLoginScreen
        initialTeacher={teacher}
        existingClasses={classes}
        onLoginSuccess={handleGoogleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        teacher={teacher}
        classes={classes}
        activeClassId={activeClassId}
        activeTab={activeTab}
        onSelectClass={handleSelectClass}
        onSelectTab={setActiveTab}
        onOpenClassModal={() => setIsClassModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
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
            onUpdateStatus={handleUpdateStatus}
            onUpdateCatatan={handleUpdateCatatan}
            onMarkAllPresent={handleMarkAllPresent}
            onResetSession={handleResetSession}
            onAddSession={handleAddSession}
            onDeleteSession={handleDeleteSession}
            onEditStudent={(s) => {
              setEditingStudent(s);
              setIsStudentModalOpen(true);
            }}
            onDeleteStudent={handleDeleteStudent}
            onOpenAddStudent={() => {
              setEditingStudent(null);
              setIsStudentModalOpen(true);
            }}
            onOpenSpreadsheetImport={() => setIsSpreadsheetImportOpen(true)}
            onOpenWorkspaceTab={() => setActiveTab('workspace')}
            onOpenParentReportTab={() => setActiveTab('laporan-ortu')}
          />
        )}

        {/* TAB 2: INPUT & REKAP NILAI */}
        {activeTab === 'nilai' && (
          <GradesView
            students={classStudents}
            grades={classGrades}
            kkm={currentClass.kkm}
            className={currentClass.namaKelas}
            mataPelajaran={currentClass.mataPelajaran}
            onUpdateGrade={handleUpdateGrade}
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
        defaultMapel={teacher.mataPelajaranUtama}
        onSaveClass={handleSaveNewClass}
        onClose={() => setIsClassModalOpen(false)}
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
