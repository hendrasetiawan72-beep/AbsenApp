import fs from 'fs';

const classes = [
  { id: "class-1789205246114", legacy_id: "class-1789205246114", namaKelas: "XI AKL 1", mataPelajaran: "Bahasa Inggris", jurusan: "Akuntansi", kkm: 60, count: 32 },
  { id: "class-1789208856652", legacy_id: "class-1789208856652", namaKelas: "X TJKT 5", mataPelajaran: "Bahasa Inggris", jurusan: "Komputer", kkm: 60, count: 32 },
  { id: "class-1789209291202", legacy_id: "class-1789209291202", namaKelas: "XI TSM 1", mataPelajaran: "Bahasa Inggris", jurusan: "Teknik otomotif", kkm: 60, count: 32 },
  { id: "class-1789209313461", legacy_id: "class-1789209313461", namaKelas: "XI TSM 2", mataPelajaran: "Bahasa Inggris", jurusan: "Teknik otomotif", kkm: 60, count: 31 },
  { id: "class-1789209607830", legacy_id: "class-1789209607830", namaKelas: "XI TKR 2", mataPelajaran: "Bahasa Inggris", jurusan: "Teknik otomotif", kkm: 60, count: 32 },
  { id: "class-1789209732952", legacy_id: "class-1789209732952", namaKelas: "XII TJAT 1", mataPelajaran: "Bahasa Inggris", jurusan: "TKJ", kkm: 60, count: 31 },
  { id: "class-1789209827631", legacy_id: "class-1789209827631", namaKelas: "XII TJAT 2", mataPelajaran: "Bahasa Inggris", jurusan: "Komputer", kkm: 60, count: 31 },
  { id: "class-1789209918181", legacy_id: "class-1789209918181", namaKelas: "XII TKJ 1", mataPelajaran: "Bahasa Inggris", jurusan: "Komputer", kkm: 60, count: 31 },
  { id: "class-1789210025061", legacy_id: "class-1789210025061", namaKelas: "XII TKJ 3", mataPelajaran: "Bahasa Inggris", jurusan: "Komputer", kkm: 60, count: 32 },
  { id: "class-1789210175363", legacy_id: "class-1789210175363", namaKelas: "XII TSM 3", mataPelajaran: "Bahasa Inggris", jurusan: "Teknik otomotif", kkm: 60, count: 31 },
  { id: "class-1789370839198", legacy_id: "class-1789370839198", namaKelas: "X TO 4 harian", mataPelajaran: "Rekap absen harian", jurusan: "Teknik otomotif", kkm: 75, count: 31 },
  { id: "class-2", legacy_id: "class-2", namaKelas: "X TO 4", mataPelajaran: "Informatika", jurusan: "Teknik otomotif", kkm: 60, count: 31 }
];

const firstNamesL = ["Ahmad", "Bagus", "Bayu", "Dimas", "Fajar", "Hafiz", "Ilham", "Kevin", "Muhammad", "Rafi", "Rizky", "Satria", "Wahyu", "Yoga", "Zack", "Aditya", "Budi", "Danang", "Eko", "Farhan", "Gilang", "Hadi", "Irfan", "Joko", "Krisna", "Lukman", "Maulana", "Naufal", "Oki", "Pandu", "Rian", "Surya"];
const firstNamesP = ["Aisyah", "Annisa", "Cantika", "Dewi", "Dinda", "Fadilla", "Gita", "Indah", "Larasati", "Nadia", "Putri", "Rani", "Siti", "Tiara", "Vina", "Winda", "Yulia", "Zahra", "Alfi", "Bunga", "Citra", "Dian", "Elsa", "Fitri", "Gisela", "Hana", "Intan", "Jihan", "Kartika", "Lestari", "Maya", "Nurul"];
const lastNames = ["Pratama", "Nugraha", "Saputra", "Ramadhan", "Siregar", "Arifin", "Putra", "Kusuma", "Hidayat", "Setiawan", "Utomo", "Kurniawan", "Wijaya", "Susanto", "Wibowo", "Permana", "Santoso", "Firmansyah", "Gunawan", "Mahendra", "Wahyudi", "Nugroho", "Purnomo", "Syahputra", "Subagyo", "Suhendra", "Haryanto", "Widodo", "Triyono", "Sudrajat", "Kuncoro", "Budiman"];

let stdCounter = 1;
const students = [];
const grades = [];
const sessions = [];

classes.forEach((cls, clsIdx) => {
  const isAkl = cls.jurusan === 'Akuntansi';
  const isOto = cls.jurusan === 'Teknik otomotif';

  for (let i = 1; i <= cls.count; i++) {
    const isP = isAkl ? (i % 4 !== 0) : (isOto ? (i % 8 === 0) : (i % 2 === 0));
    const gender = isP ? 'P' : 'L';
    const fList = isP ? firstNamesP : firstNamesL;
    const fName = fList[(stdCounter + i) % fList.length];
    const lName = lastNames[(stdCounter * 3 + i) % lastNames.length];
    const nama = `${fName} ${lName}`;
    const stdId = `std-${cls.id.slice(-6)}-${String(i).padStart(3, '0')}`;
    const nisn = `008${String(1000000 + stdCounter).slice(1)}`;

    students.push({
      id: stdId,
      legacy_id: stdId,
      classId: cls.id,
      no: i,
      nisn: nisn,
      nama: nama,
      gender: gender,
      catatanUmum: i === 1 ? 'Ketua Kelas' : (i === 2 ? 'Sekretaris' : (i === 3 ? 'Bendahara' : ''))
    });

    // Grade for student (up to 338 total grades across students)
    if (grades.length < 338) {
      const f1 = 70 + ((i * 7) % 26);
      const f2 = 72 + ((i * 5) % 24);
      const f3 = 75 + ((i * 3) % 22);
      const f4 = 68 + ((i * 9) % 28);
      const sts = 74 + ((i * 4) % 23);
      const sas = 76 + ((i * 6) % 21);

      grades.push({
        id: `grd-${cls.id.slice(-6)}-${String(i).padStart(3, '0')}`,
        legacy_id: `grd-${cls.id.slice(-6)}-${String(i).padStart(3, '0')}`,
        studentId: stdId,
        classId: cls.id,
        formatif1: f1,
        formatif2: f2,
        formatif3: f3,
        formatif4: f4,
        sumatifTengah: sts,
        sumatifAkhir: sas,
        catatan: f1 >= cls.kkm ? 'Kompeten' : 'Perlu bimbingan remedi'
      });
    }

    stdCounter++;
  }

  // Create 4-5 sessions per class to reach 53 total sessions
  const sessionsForThisClass = clsIdx < 5 ? 5 : 4;
  for (let s = 1; s <= sessionsForThisClass; s++) {
    if (sessions.length >= 53) break;
    const sesId = `ses-${cls.id.slice(-6)}-${s}`;
    const records = {};
    const clsStudents = students.filter(st => st.classId === cls.id);
    
    clsStudents.forEach((st, idx) => {
      let status = 'H';
      let catatan = 'Hadir';
      if ((idx + s) % 17 === 0) {
        status = 'I';
        catatan = 'Izin urusan keluarga';
      } else if ((idx + s) % 23 === 0) {
        status = 'S';
        catatan = 'Sakit';
      }
      records[st.id] = { status, catatan };
    });

    const day = String(10 + s * 3).padStart(2, '0');
    sessions.push({
      id: sesId,
      legacy_id: sesId,
      classId: cls.id,
      tanggal: `2026-08-${day}`,
      pertemuanKe: s,
      topikMateri: s === 1 ? 'Introduction & Classroom Agreement' : (s === 2 ? 'Expressing Intentions & Plans' : (s === 3 ? 'Descriptive Text in Technical Context' : 'Analytical Exposition Text')),
      records
    });
  }
});

// Agendas (12 total agendas, 1 for each class)
const agendas = classes.map((cls, idx) => ({
  id: `agd-2026-${String(idx + 1).padStart(2, '0')}`,
  legacy_id: `agd-2026-${String(idx + 1).padStart(2, '0')}`,
  tanggal: `2026-08-${String(10 + idx).padStart(2, '0')}`,
  jamKe: [1, 2, 3],
  jamRentang: "07:15 - 09:30",
  classId: cls.id,
  className: cls.namaKelas,
  materiAjar: `Bahasa Inggris Vokasi: Modul ${idx + 1} (${cls.namaKelas})`,
  kegiatan: "Apersepsi, eksplorasi materi praktis, latihan dialog dan evaluasi formatif.",
  catatan: "Pembelajaran berlangsung tertib dan interaktif.",
  jumlahHadir: cls.count - 1,
  jumlahTidakHadir: 1,
  createdAt: `2026-08-${String(10 + idx).padStart(2, '0')}`
}));

// Savings (14 total transactions)
const savings = [
  { id: "tx-2026-01", legacy_id: "tx-2026-01", classId: classes[8].id, studentId: students[0]?.id || "std-1", studentName: students[0]?.nama || "Siswa 1", nisn: students[0]?.nisn || "0081234", tanggal: "2026-08-01", jenis: "setor", nominal: 25000, kategori: "harian", keterangan: "Setoran tabungan mingguan", petugas: "Wali Kelas", createdAt: "2026-08-01T07:30:00.000Z" },
  { id: "tx-2026-02", legacy_id: "tx-2026-02", classId: classes[8].id, studentId: students[1]?.id || "std-2", studentName: students[1]?.nama || "Siswa 2", nisn: students[1]?.nisn || "0081235", tanggal: "2026-08-01", jenis: "setor", nominal: 50000, kategori: "study_tour", keterangan: "Tabungan kunjungan industri", petugas: "Bendahara", createdAt: "2026-08-01T07:35:00.000Z" },
  { id: "tx-2026-03", legacy_id: "tx-2026-03", classId: classes[8].id, studentId: students[2]?.id || "std-3", studentName: students[2]?.nama || "Siswa 3", nisn: students[2]?.nisn || "0081236", tanggal: "2026-08-02", jenis: "setor", nominal: 20000, kategori: "harian", keterangan: "Setor saku", petugas: "Wali Kelas", createdAt: "2026-08-02T07:40:00.000Z" },
  { id: "tx-2026-04", legacy_id: "tx-2026-04", classId: classes[8].id, studentId: students[3]?.id || "std-4", studentName: students[3]?.nama || "Siswa 4", nisn: students[3]?.nisn || "0081237", tanggal: "2026-08-03", jenis: "setor", nominal: 15000, kategori: "harian", keterangan: "Setoran rutin", petugas: "Bendahara", createdAt: "2026-08-03T07:20:00.000Z" },
  { id: "tx-2026-05", legacy_id: "tx-2026-05", classId: classes[0].id, studentId: students[4]?.id || "std-5", studentName: students[4]?.nama || "Siswa 5", nisn: students[4]?.nisn || "0081238", tanggal: "2026-08-04", jenis: "setor", nominal: 30000, kategori: "harian", keterangan: "Tabungan awal semester", petugas: "Wali Kelas", createdAt: "2026-08-04T08:00:00.000Z" },
  { id: "tx-2026-06", legacy_id: "tx-2026-06", classId: classes[0].id, studentId: students[5]?.id || "std-6", studentName: students[5]?.nama || "Siswa 6", nisn: students[5]?.nisn || "0081239", tanggal: "2026-08-05", jenis: "setor", nominal: 40000, kategori: "study_tour", keterangan: "Cicilan study tour", petugas: "Bendahara", createdAt: "2026-08-05T08:15:00.000Z" },
  { id: "tx-2026-07", legacy_id: "tx-2026-07", classId: classes[1].id, studentId: students[6]?.id || "std-7", studentName: students[6]?.nama || "Siswa 7", nisn: students[6]?.nisn || "0081240", tanggal: "2026-08-06", jenis: "setor", nominal: 10000, kategori: "harian", keterangan: "Tabungan harian", petugas: "Wali Kelas", createdAt: "2026-08-06T07:45:00.000Z" },
  { id: "tx-2026-08", legacy_id: "tx-2026-08", classId: classes[1].id, studentId: students[7]?.id || "std-8", studentName: students[7]?.nama || "Siswa 8", nisn: students[7]?.nisn || "0081241", tanggal: "2026-08-07", jenis: "tarik", nominal: 15000, kategori: "lks_buku", keterangan: "Beli modul kejuruan", petugas: "Wali Kelas", createdAt: "2026-08-07T09:00:00.000Z" },
  { id: "tx-2026-09", legacy_id: "tx-2026-09", classId: classes[2].id, studentId: students[8]?.id || "std-9", studentName: students[8]?.nama || "Siswa 9", nisn: students[8]?.nisn || "0081242", tanggal: "2026-08-08", jenis: "setor", nominal: 25000, kategori: "harian", keterangan: "Setor tabungan", petugas: "Bendahara", createdAt: "2026-08-08T07:30:00.000Z" },
  { id: "tx-2026-10", legacy_id: "tx-2026-10", classId: classes[3].id, studentId: students[9]?.id || "std-10", studentName: students[9]?.nama || "Siswa 10", nisn: students[9]?.nisn || "0081243", tanggal: "2026-08-09", jenis: "setor", nominal: 35000, kategori: "harian", keterangan: "Tabungan saku", petugas: "Wali Kelas", createdAt: "2026-08-09T07:30:00.000Z" },
  { id: "tx-2026-11", legacy_id: "tx-2026-11", classId: classes[4].id, studentId: students[10]?.id || "std-11", studentName: students[10]?.nama || "Siswa 11", nisn: students[10]?.nisn || "0081244", tanggal: "2026-08-10", jenis: "setor", nominal: 20000, kategori: "harian", keterangan: "Tabungan harian", petugas: "Bendahara", createdAt: "2026-08-10T07:50:00.000Z" },
  { id: "tx-2026-12", legacy_id: "tx-2026-12", classId: classes[5].id, studentId: students[11]?.id || "std-12", studentName: students[11]?.nama || "Siswa 12", nisn: students[11]?.nisn || "0081245", tanggal: "2026-08-11", jenis: "setor", nominal: 50000, kategori: "study_tour", keterangan: "Setoran study tour", petugas: "Wali Kelas", createdAt: "2026-08-11T08:00:00.000Z" },
  { id: "tx-2026-13", legacy_id: "tx-2026-13", classId: classes[6].id, studentId: students[12]?.id || "std-13", studentName: students[12]?.nama || "Siswa 13", nisn: students[12]?.nisn || "0081246", tanggal: "2026-08-12", jenis: "setor", nominal: 15000, kategori: "harian", keterangan: "Setor rutin", petugas: "Bendahara", createdAt: "2026-08-12T07:30:00.000Z" },
  { id: "tx-2026-14", legacy_id: "tx-2026-14", classId: classes[7].id, studentId: students[13]?.id || "std-14", studentName: students[13]?.nama || "Siswa 14", nisn: students[13]?.nisn || "0081247", tanggal: "2026-08-13", jenis: "setor", nominal: 30000, kategori: "harian", keterangan: "Setor rutin", petugas: "Wali Kelas", createdAt: "2026-08-13T07:45:00.000Z" }
];

const fullBackup = {
  app: "SIM Presensi, Nilai & Tabungan Siswa SMK Muhammadiyah Bawang",
  version: "2.2.0",
  exportedAt: "2026-09-24T07:13:39.116Z",
  exportedAtFormatted: "24 September 2026 pukul 14.13",
  exportedBy: {
    namaGuru: "Hendra Setiawan",
    nip: "-",
    nbm: "-",
    namaSekolah: "SMK Muhammadiyah Bawang",
    email: "hendra.alkindi@gmail.com"
  },
  summary: {
    totalClasses: classes.length,
    totalStudents: students.length,
    totalAttendanceSessions: sessions.length,
    totalGrades: grades.length,
    totalAgendas: agendas.length,
    totalSavingsTransactions: savings.length
  },
  data: {
    teacher: {
      tahunAjaran: "2026/2027",
      namaSekolah: "SMK Muhammadiyah Bawang",
      email: "hendra.alkindi@gmail.com",
      mataPelajaranUtama: "Bahasa Inggris",
      isLoggedIn: true,
      nbm: "-",
      semester: "Ganjil",
      activeClassId: "class-1789210025061",
      id: "t-jDMULvPfg1SkElZX41jKzEGm7Ck1",
      namaGuru: "Hendra Setiawan",
      nip: "-",
      avatarUrl: "https://lh3.googleusercontent.com/a/ACg8ocIAuM6OhVOeWqPsb2tK0Razda8oE4MZ7-Dh4ZFVixzGQY7ocGEV=s96-c",
      role: "admin"
    },
    classes: classes.map(({ count, ...c }) => ({
      ...c,
      teacherUid: "jDMULvPfg1SkElZX41jKzEGm7Ck1",
      createdAt: "2026-09-12",
      keterangan: c.keterangan || ""
    })),
    activeClassId: "class-1789210025061",
    students: students,
    sessions: sessions,
    grades: grades,
    agendas: agendas,
    savings: savings
  }
};

fs.writeFileSync('./src/data/hendraInitialData.json', JSON.stringify(fullBackup, null, 2), 'utf8');

const tsExport = `// Auto-generated master seed data SMK Muhammadiyah Bawang
import { FullDatabaseBackup } from '../types';

export const HENDRA_MASTER_DATA: FullDatabaseBackup = ${JSON.stringify(fullBackup, null, 2)};
`;

fs.writeFileSync('./src/data/seedData.ts', tsExport, 'utf8');
console.log(`Generated master data! Classes: ${classes.length}, Students: ${students.length}, Sessions: ${sessions.length}, Grades: ${grades.length}, Agendas: ${agendas.length}, Savings: ${savings.length}`);
