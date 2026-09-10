import {
  TeacherProfile,
  ClassRoom,
  Student,
  AttendanceSession,
  StudentGrade,
} from '../types';

const STORAGE_KEYS = {
  TEACHER: 'absensi_teacher_profile',
  CLASSES: 'absensi_classes',
  ACTIVE_CLASS: 'absensi_active_class_id',
  STUDENTS: 'absensi_students',
  ATTENDANCE: 'absensi_sessions',
  GRADES: 'absensi_grades',
};

// Initial Sample Data
const DEFAULT_TEACHER: TeacherProfile = {
  id: 'teacher-1',
  namaGuru: 'Hendra Al Kindi, S.Pd., M.Kom.',
  nip: '19870914 201101 1 009',
  namaSekolah: 'SMK Muhammadiyah Bawang',
  mataPelajaranUtama: 'Pemrograman Web & Perangkat Bergerak',
  tahunAjaran: '2025/2026',
  semester: 'Ganjil',
  isLoggedIn: true,
  email: 'guru.hendra@smkmuhbawang.sch.id',
  avatarUrl: '',
};

const DEFAULT_CLASSES: ClassRoom[] = [
  {
    id: 'class-1',
    namaKelas: 'X PPLG 1 (RPL)',
    mataPelajaran: 'Dasar-Dasar Pemrograman & Informatika',
    kkm: 75,
    jurusan: 'Pengembangan Perangkat Lunak & Gim',
    keterangan: 'Ruang Lab Komputer 2 (Senin & Rabu)',
    createdAt: '2025-07-15',
  },
  {
    id: 'class-2',
    namaKelas: 'XI RPL 2',
    mataPelajaran: 'Pemrograman Web Client & Server',
    kkm: 78,
    jurusan: 'Rekayasa Perangkat Lunak',
    keterangan: 'Ruang Lab Multimedia 1 (Selasa & Kamis)',
    createdAt: '2025-07-15',
  },
  {
    id: 'class-3',
    namaKelas: 'XII RPL 1',
    mataPelajaran: 'Produk Kreatif & Aplikasi Mobile',
    kkm: 80,
    jurusan: 'Rekayasa Perangkat Lunak',
    keterangan: 'Lab IoT & Mobile (Jumat)',
    createdAt: '2025-07-15',
  },
];

const DEFAULT_STUDENTS_CLASS_1: Student[] = [
  { id: 'std-101', classId: 'class-1', no: 1, nisn: '0071234001', nama: 'Achmad Fauzan Pratama', gender: 'L', catatanUmum: 'Ketua Kelas, aktif' },
  { id: 'std-102', classId: 'class-1', no: 2, nisn: '0071234002', nama: 'Aisyah Putri Azzahra', gender: 'P', catatanUmum: 'Sekretaris' },
  { id: 'std-103', classId: 'class-1', no: 3, nisn: '0071234003', nama: 'Bayu Aditya Nugraha', gender: 'L', catatanUmum: 'Anggota OSIS' },
  { id: 'std-104', classId: 'class-1', no: 4, nisn: '0071234004', nama: 'Cantika Dewi Maharani', gender: 'P', catatanUmum: 'Bendahara kelas' },
  { id: 'std-105', classId: 'class-1', no: 5, nisn: '0071234005', nama: 'Dimas Bagus Saputra', gender: 'L', catatanUmum: 'Perlu bimbingan algoritma' },
  { id: 'std-106', classId: 'class-1', no: 6, nisn: '0071234006', nama: 'Fadilla Nur Hasanah', gender: 'P', catatanUmum: 'Sangat rajin' },
  { id: 'std-107', classId: 'class-1', no: 7, nisn: '0071234007', nama: 'Fajar Rizky Ramadhan', gender: 'L', catatanUmum: 'Bakat desain UI' },
  { id: 'std-108', classId: 'class-1', no: 8, nisn: '0071234008', nama: 'Gita Anindya Saraswati', gender: 'P', catatanUmum: 'Wakil ketua kelas' },
  { id: 'std-109', classId: 'class-1', no: 9, nisn: '0071234009', nama: 'Hafiz Danendra', gender: 'L', catatanUmum: 'Atlet futsal sekolah' },
  { id: 'std-110', classId: 'class-1', no: 10, nisn: '0071234010', nama: 'Indah Kusuma Wardani', gender: 'P', catatanUmum: 'Tertib & teliti' },
  { id: 'std-111', classId: 'class-1', no: 11, nisn: '0071234011', nama: 'Kevin Jonathan Siregar', gender: 'L', catatanUmum: 'Kompetensi logika bagus' },
  { id: 'std-112', classId: 'class-1', no: 12, nisn: '0071234012', nama: 'Larasati Wahyu Ningrum', gender: 'P', catatanUmum: 'Aktif bertanya' },
  { id: 'std-113', classId: 'class-1', no: 13, nisn: '0071234013', nama: 'Muhammad Ilham Arifin', gender: 'L', catatanUmum: 'Sering bantu teman' },
  { id: 'std-114', classId: 'class-1', no: 14, nisn: '0071234014', nama: 'Nadia Salsabila Putri', gender: 'P', catatanUmum: 'Kreatif' },
  { id: 'std-115', classId: 'class-1', no: 15, nisn: '0071234015', nama: 'Rafi Alamsyah Putra', gender: 'L', catatanUmum: 'Perlu pengawasan kehadiran' },
  { id: 'std-116', classId: 'class-1', no: 16, nisn: '0071234016', nama: 'Siti Rahmawati', gender: 'P', catatanUmum: 'Tuntas semua tugas' },
];

const DEFAULT_SESSIONS_CLASS_1: AttendanceSession[] = [
  {
    id: 'ses-1',
    classId: 'class-1',
    tanggal: '2025-08-04',
    pertemuanKe: 1,
    topikMateri: 'Pengenalan Logika & Algoritma Pemrograman Dasar',
    records: {
      'std-101': { status: 'H', catatan: 'Hadir tepat waktu' },
      'std-102': { status: 'H', catatan: 'Hadir' },
      'std-103': { status: 'H', catatan: 'Hadir' },
      'std-104': { status: 'H', catatan: 'Hadir' },
      'std-105': { status: 'S', catatan: 'Demam, ada surat dokter' },
      'std-106': { status: 'H', catatan: 'Hadir' },
      'std-107': { status: 'H', catatan: 'Hadir' },
      'std-108': { status: 'H', catatan: 'Hadir' },
      'std-109': { status: 'I', catatan: 'Izin seleksi popda' },
      'std-110': { status: 'H', catatan: 'Hadir' },
      'std-111': { status: 'H', catatan: 'Hadir' },
      'std-112': { status: 'H', catatan: 'Hadir' },
      'std-113': { status: 'H', catatan: 'Hadir' },
      'std-114': { status: 'H', catatan: 'Hadir' },
      'std-115': { status: 'A', catatan: 'Tanpa kabar / konfirmasi' },
      'std-116': { status: 'H', catatan: 'Hadir' },
    },
  },
  {
    id: 'ses-2',
    classId: 'class-1',
    tanggal: '2025-08-11',
    pertemuanKe: 2,
    topikMateri: 'Variabel, Tipe Data, dan Struktur Percabangan (If-Else)',
    records: {
      'std-101': { status: 'H', catatan: 'Aktif saat sesi tanya jawab' },
      'std-102': { status: 'H', catatan: 'Hadir' },
      'std-103': { status: 'I', catatan: 'Izin urusan keluarga' },
      'std-104': { status: 'H', catatan: 'Hadir' },
      'std-105': { status: 'H', catatan: 'Sudah sembuh' },
      'std-106': { status: 'H', catatan: 'Hadir' },
      'std-107': { status: 'H', catatan: 'Hadir' },
      'std-108': { status: 'H', catatan: 'Hadir' },
      'std-109': { status: 'H', catatan: 'Hadir' },
      'std-110': { status: 'H', catatan: 'Hadir' },
      'std-111': { status: 'H', catatan: 'Hadir' },
      'std-112': { status: 'S', catatan: 'Flu batuk, orang tua telepon' },
      'std-113': { status: 'H', catatan: 'Hadir' },
      'std-114': { status: 'H', catatan: 'Hadir' },
      'std-115': { status: 'A', catatan: 'Tidak ada surat keterangan' },
      'std-116': { status: 'H', catatan: 'Hadir' },
    },
  },
  {
    id: 'ses-3',
    classId: 'class-1',
    tanggal: '2025-08-18',
    pertemuanKe: 3,
    topikMateri: 'Struktur Perulangan (For, While) dan Array 1 Dimensi',
    records: {
      'std-101': { status: 'H', catatan: 'Hadir' },
      'std-102': { status: 'H', catatan: 'Hadir' },
      'std-103': { status: 'H', catatan: 'Hadir' },
      'std-104': { status: 'H', catatan: 'Hadir' },
      'std-105': { status: 'H', catatan: 'Mengerjakan tugas lab' },
      'std-106': { status: 'H', catatan: 'Hadir' },
      'std-107': { status: 'H', catatan: 'Hadir' },
      'std-108': { status: 'H', catatan: 'Hadir' },
      'std-109': { status: 'H', catatan: 'Hadir' },
      'std-110': { status: 'H', catatan: 'Hadir' },
      'std-111': { status: 'H', catatan: 'Hadir' },
      'std-112': { status: 'H', catatan: 'Hadir' },
      'std-113': { status: 'H', catatan: 'Hadir' },
      'std-114': { status: 'I', catatan: 'Izin menghadiri pernikahan saudara' },
      'std-115': { status: 'H', catatan: 'Hadir, ditegur wali kelas' },
      'std-116': { status: 'H', catatan: 'Hadir' },
    },
  },
];

const DEFAULT_GRADES_CLASS_1: StudentGrade[] = [
  { id: 'grd-101', studentId: 'std-101', classId: 'class-1', tugas1: 88, tugas2: 92, tugas3: 90, uts: 89, uas: 94, praktik: 95, catatan: 'Sangat memuaskan, calon asisten lab' },
  { id: 'grd-102', studentId: 'std-102', classId: 'class-1', tugas1: 85, tugas2: 88, tugas3: 86, uts: 84, uas: 88, praktik: 90, catatan: 'Tugas rapi & sistematis' },
  { id: 'grd-103', studentId: 'std-103', classId: 'class-1', tugas1: 80, tugas2: 78, tugas3: 82, uts: 80, uas: 82, praktik: 85, catatan: 'Perlu latihan algoritma loop' },
  { id: 'grd-104', studentId: 'std-104', classId: 'class-1', tugas1: 86, tugas2: 84, tugas3: 88, uts: 85, uas: 87, praktik: 88, catatan: 'Hasil belajar stabil' },
  { id: 'grd-105', studentId: 'std-105', classId: 'class-1', tugas1: 72, tugas2: 74, tugas3: 75, uts: 70, uas: 74, praktik: 76, catatan: 'Perlu remidi materi array' },
  { id: 'grd-106', studentId: 'std-106', classId: 'class-1', tugas1: 90, tugas2: 92, tugas3: 94, uts: 92, uas: 95, praktik: 96, catatan: 'Prestasi istimewa' },
  { id: 'grd-107', studentId: 'std-107', classId: 'class-1', tugas1: 84, tugas2: 86, tugas3: 88, uts: 82, uas: 85, praktik: 92, catatan: 'Karya antarmuka sangat apik' },
  { id: 'grd-108', studentId: 'std-108', classId: 'class-1', tugas1: 85, tugas2: 87, tugas3: 85, uts: 84, uas: 86, praktik: 89, catatan: 'Komunikatif dan teliti' },
  { id: 'grd-109', studentId: 'std-109', classId: 'class-1', tugas1: 78, tugas2: 76, tugas3: 80, uts: 76, uas: 78, praktik: 84, catatan: 'Bagus di praktik mandiri' },
  { id: 'grd-110', studentId: 'std-110', classId: 'class-1', tugas1: 88, tugas2: 86, tugas3: 89, uts: 86, uas: 88, praktik: 90, catatan: 'Tuntas memuaskan' },
  { id: 'grd-111', studentId: 'std-111', classId: 'class-1', tugas1: 92, tugas2: 90, tugas3: 95, uts: 94, uas: 96, praktik: 98, catatan: 'Peringkat 1 penguasaan kode' },
  { id: 'grd-112', studentId: 'std-112', classId: 'class-1', tugas1: 82, tugas2: 80, tugas3: 84, uts: 81, uas: 83, praktik: 85, catatan: 'Tuntas' },
  { id: 'grd-113', studentId: 'std-113', classId: 'class-1', tugas1: 86, tugas2: 88, tugas3: 87, uts: 85, uas: 89, praktik: 90, catatan: 'Kerja tim solid' },
  { id: 'grd-114', studentId: 'std-114', classId: 'class-1', tugas1: 84, tugas2: 82, tugas3: 86, uts: 82, uas: 85, praktik: 87, catatan: 'Tuntas' },
  { id: 'grd-115', studentId: 'std-115', classId: 'class-1', tugas1: 65, tugas2: 68, tugas3: 70, uts: 62, uas: 66, praktik: 72, catatan: 'Remedial wajib UTS & UAS' },
  { id: 'grd-116', studentId: 'std-116', classId: 'class-1', tugas1: 88, tugas2: 89, tugas3: 90, uts: 87, uas: 91, praktik: 92, catatan: 'Prestasi baik' },
];

export const Storage = {
  getTeacher(): TeacherProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TEACHER);
      if (!data) return DEFAULT_TEACHER;
      const parsed = JSON.parse(data);
      // Migrate old default school name to SMK Muhammadiyah Bawang if needed
      if (!parsed.namaSekolah || parsed.namaSekolah.includes('Teladan Nusantara')) {
        parsed.namaSekolah = 'SMK Muhammadiyah Bawang';
      }
      if (!parsed.email) {
        parsed.email = 'guru.hendra@smkmuhbawang.sch.id';
      }
      return parsed;
    } catch {
      return DEFAULT_TEACHER;
    }
  },

  setTeacher(teacher: TeacherProfile): void {
    localStorage.setItem(STORAGE_KEYS.TEACHER, JSON.stringify(teacher));
  },

  getClasses(): ClassRoom[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLASSES);
      return data ? JSON.parse(data) : DEFAULT_CLASSES;
    } catch {
      return DEFAULT_CLASSES;
    }
  },

  setClasses(classes: ClassRoom[]): void {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  },

  getActiveClassId(): string {
    const classes = this.getClasses();
    const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_CLASS);
    if (stored && classes.some((c) => c.id === stored)) {
      return stored;
    }
    return classes[0]?.id || '';
  },

  setActiveClassId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CLASS, id);
  },

  getAllStudents(): Student[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      return data ? JSON.parse(data) : DEFAULT_STUDENTS_CLASS_1;
    } catch {
      return DEFAULT_STUDENTS_CLASS_1;
    }
  },

  setAllStudents(students: Student[]): void {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  },

  getStudentsByClass(classId: string): Student[] {
    const all = this.getAllStudents();
    return all.filter((s) => s.classId === classId).sort((a, b) => a.no - b.no);
  },

  getAllSessions(): AttendanceSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      return data ? JSON.parse(data) : DEFAULT_SESSIONS_CLASS_1;
    } catch {
      return DEFAULT_SESSIONS_CLASS_1;
    }
  },

  setAllSessions(sessions: AttendanceSession[]): void {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(sessions));
  },

  getSessionsByClass(classId: string): AttendanceSession[] {
    const all = this.getAllSessions();
    return all.filter((s) => s.classId === classId).sort((a, b) => a.pertemuanKe - b.pertemuanKe);
  },

  getAllGrades(): StudentGrade[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GRADES);
      return data ? JSON.parse(data) : DEFAULT_GRADES_CLASS_1;
    } catch {
      return DEFAULT_GRADES_CLASS_1;
    }
  },

  setAllGrades(grades: StudentGrade[]): void {
    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(grades));
  },

  getGradesByClass(classId: string): StudentGrade[] {
    const all = this.getAllGrades();
    return all.filter((g) => g.classId === classId);
  },

  // Reset to default demo data
  resetToDefault(): void {
    localStorage.setItem(STORAGE_KEYS.TEACHER, JSON.stringify(DEFAULT_TEACHER));
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(DEFAULT_CLASSES));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CLASS, DEFAULT_CLASSES[0].id);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(DEFAULT_STUDENTS_CLASS_1));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(DEFAULT_SESSIONS_CLASS_1));
    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(DEFAULT_GRADES_CLASS_1));
  },
};
