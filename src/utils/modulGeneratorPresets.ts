import { AlternatifGenerateModul, ModulAjarPromptData, SMKJurusan } from '../types';
import { MAPEL_UMUM_PRESETS } from './mapelUmumPresets';
import { generateFieldsFromCpAndAtpWithAlternatif, SEPULUH_ALTERNATIF_GENERATE } from './alternatifGenerateEngine';

export { MAPEL_UMUM_PRESETS } from './mapelUmumPresets';
export { SEPULUH_ALTERNATIF_GENERATE, generateFieldsFromCpAndAtpWithAlternatif } from './alternatifGenerateEngine';

export interface JurusanPreset {
  id: string;
  jurusan: SMKJurusan[];
  jurusanLabel: string;
  mataPelajaran: string;
  faseKelas: string;
  topikMateri: string;
  metodePembelajaran: string;
  durasiProyek: string;
  capaianPembelajaran: string;
  alurTujuanPembelajaran: string;
  tujuanPembelajaran: string[];
  sintaksPembelajaran: {
    tahap: string;
    fokusDeepLearning: string;
    aktivitasKonkret: string;
  }[];
  integrasiSkillsPractice: {
    hardSkills: string;
    softSkills: string;
    praktikNyata: string;
    keselamatanKerjaK3: string;
  };
  refleksi: {
    refleksiSiswa: string;
    refleksiGuru: string;
  };
  karakterKemuhammadiyahan: string[];
  tujuhKebiasaanAnakHebat: {
    kebiasaan: string;
    implementasi: string;
  }[];
  lkpd: {
    judulProyek: string;
    petunjukKerja: string[];
    tugasProyek: string;
    alatBahan: string[];
    rubrikPenilaian: string;
  };
}

export const LIST_JURUSAN: { id: SMKJurusan; label: string; singkatan: string; color: string }[] = [
  { id: 'TKR', label: 'Teknik Kendaraan Ringan (TKR)', singkatan: 'TKR', color: 'from-amber-500 to-orange-600' },
  { id: 'TSM', label: 'Teknik Sepeda Motor (TSM)', singkatan: 'TSM', color: 'from-red-500 to-rose-600' },
  { id: 'Akuntansi', label: 'Akuntansi dan Keuangan Lembaga', singkatan: 'AKL', color: 'from-blue-600 to-indigo-700' },
  { id: 'Perbankan Syari\'ah', label: 'Perbankan Syari\'ah (PBS)', singkatan: 'PBS', color: 'from-emerald-600 to-teal-700' },
  { id: 'TJAT', label: 'Teknik Jaringan Akses Telekomunikasi', singkatan: 'TJAT', color: 'from-cyan-600 to-blue-700' },
  { id: 'TKJ', label: 'Teknik Komputer dan Jaringan (TKJ)', singkatan: 'TKJ', color: 'from-violet-600 to-purple-700' },
  { id: 'Semua Jurusan', label: 'Semua Jurusan (Lintas Vokasi / Umum)', singkatan: 'SEMUA', color: 'from-indigo-600 to-emerald-600' },
];

export const JURUSAN_PRESETS: JurusanPreset[] = [
  // 1. TKR (Teknik Kendaraan Ringan)
  {
    id: 'preset-tkr',
    jurusan: ['TKR'],
    jurusanLabel: 'TKR (Teknik Kendaraan Ringan)',
    mataPelajaran: 'Konsentrasi Keahlian Teknik Kendaraan Ringan',
    faseKelas: 'Fase F (Kelas XI)',
    topikMateri: 'Perawatan dan Analisis Gangguan Sistem Kelistrikan Body dan EFI Mobil',
    metodePembelajaran: 'Project Based Learning (PjBL) terintegrasi Teaching Factory',
    durasiProyek: '3 Pertemuan (18 JP @ 45 Menit)',
    capaianPembelajaran: 'Pada akhir Fase F, peserta didik mampu melakukan perawatan, perbaikan, dan analisis gangguan (troubleshooting) sistem kelistrikan body, sistem starter, pengisian, serta sistem injeksi bahan bakar elektronik (Electronic Fuel Injection - EFI) pada kendaraan ringan sesuai prosedur operasional standar (SOP) dan K3LH bengkel.',
    alurTujuanPembelajaran: '1. Mengidentifikasi komponen dan diagram kelistrikan body serta sensor EFI.\n2. Melakukan diagnosis malfungsi sensor dan sirkuit kelistrikan menggunakan Scanner OBD-II & Multimeter digital.\n3. Melaksanakan perawatan berkala dan perbaikan sistem EFI serta kelistrikan body sesuai SOP DUDI Astra/Nasmoco.\n4. Menguji performa kendaraan setelah perbaikan dan membuat laporan servis digital beretika Islami.',
    tujuanPembelajaran: [
      'Peserta didik mampu menelaah diagram wiring kelistrikan otomotif dan cara kerja sensor-sensor EFI dengan teliti dan cermat.',
      'Peserta didik mampu mendiagnosis DTC (Diagnostic Trouble Code) menggunakan scanner OBD-II secara mandiri dan akurat.',
      'Peserta didik mampu melakukan perbaikan gangguan sirkuit kelistrikan dan kalibrasi sensor EFI sesuai standar bengkel resmi (SOP Astra).',
      'Peserta didik mampu mengintegrasikan etos kerja Fastabiqul Khairat dan K3 dalam setiap tahapan pengerjaan proyek servis kendaraan.'
    ],
    sintaksPembelajaran: [
      {
        tahap: '1. Penentuan Pertanyaan Mendasar (Mindful Awareness)',
        fokusDeepLearning: 'Mindful',
        aktivitasKonkret: 'Guru menampilkan problem riil kendaraan pelanggan bengkel sekolah (lampu Check Engine menyala dan konsumsi BBM boros). Peserta didik diajak hening sejenak menyadari tanggung jawab profesi mekanik muslim dalam menjaga keselamatan pengguna jalan.'
      },
      {
        tahap: '2. Mendesain Perencanaan Proyek Servis (Meaningful Context)',
        fokusDeepLearning: 'Meaningful',
        aktivitasKonkret: 'Peserta didik berkelompok (4 siswa) membedah manual service book, merancang alur diagnosis kelistrikan, membagi peran (Service Advisor, Toolman, Diagnostic Technician, Quality Control), dan menghitung estimasi pengerjaan sesuai standar industri otomotif Batang.'
      },
      {
        tahap: '3. Menyusun Jadwal & Eksekusi Praktik Bengkel (Joyful Collaboration)',
        fokusDeepLearning: 'Joyful',
        aktivitasKonkret: 'Peserta didik mengeksekusi pengukuran tegangan sensor MAF, O2 sensor, dan injektor menggunakan multimeter dan scanner engine dengan suasana bengkel yang suportif, saling mengoreksi secara santun, dan saling menyemangati.'
      },
      {
        tahap: '4. Menguji Hasil & Validasi Emisi (Interkoneksi Sistemik)',
        fokusDeepLearning: 'Interkoneksi',
        aktivitasKonkret: 'Melakukan road test dan uji emisi gas buang untuk menghubungkan hasil servis mekanik dengan dampak lingkungan hidup (ramah lingkungan sesuai prinsip amanah khalifah fil ardh). Hasil dicocokkan dengan standar emisi nasional.'
      },
      {
        tahap: '5. Evaluasi Pengalaman & Presentasi Work Order',
        fokusDeepLearning: 'Meaningful & Mindful',
        aktivitasKonkret: 'Kelompok mempresentasikan lembar Work Order (WO), menganalisis kendala teknik yang dihadapi, serta menyimpulkan pelajaran integritas (kejujuran dalam penggantian suku cadang kepada konsumen).'
      }
    ],
    integrasiSkillsPractice: {
      hardSkills: 'Penggunaan Engine Scanner OBD-II, Multimeter Digital, Oscilloscope Otomotif, wiring jumper test, pembongkaran sensor EFI, dan uji emisi gas buang.',
      softSkills: 'Komunikasi Service Advisor ke pelanggan, kejujuran (amanah) nota onderdil, kerja sama tim bengkel, dan manajemen waktu (takt time servis).',
      praktikNyata: 'Penerapan SOP bengkel DUDI resmi, penataan toolset berstandar 5S/5R (Ringkas, Rapi, Resik, Rawat, Rajin) di bengkel otomotif SMK Muhammadiyah Bawang.',
      keselamatanKerjaK3: 'Penggunaan APD lengkap (wearpack, safety shoes, sarung tangan nitril), fender cover mobil, pemadam kebakaran APAR siap pakai, dan ventilasi pembuangan gas CO/HC.'
    },
    refleksi: {
      refleksiSiswa: 'Bagaimana perasaan saya ketika berhasil mendeteksi dan menyelesaikan kerusakan mesin? Apakah saya sudah bersikap jujur dan teliti tanpa meninggalkan baut atau soket yang kendor? Apa yang akan saya tingkatkan pada sesi bengkel berikutnya?',
      refleksiGuru: 'Apakah seluruh kelompok aktif menggunakan scanner tanpa didominasi satu siswa? Apakah pendekatan Deep Learning membuat siswa menghayati tanggung jawab moral keselamatan berkendara? Bagaimana tindak lanjut bagi siswa yang butuh penguatan membaca diagram wiring?'
    },
    karakterKemuhammadiyahan: [
      'Amanah dalam merawat kendaraan pelanggan tanpa melebih-lebihkan estimasi kerusakan.',
      'Fastabiqul Khairat: Berlomba-lomba memberikan hasil servis paling presisi dan berkualitas.',
      'Etos Kerja Keras & Ikhlas: Menjadikan keringat di bengkel sebagai amal ibadah yang berpahala.',
      'Menjaga Kebersihan Bengkel sebagai cerminan iman (Thaharah aplikatif bengkel).'
    ],
    tujuhKebiasaanAnakHebat: [
      { kebiasaan: '1. Bangun Pagi', implementasi: 'Datang tepat waktu pukul 06.45 WIB, siap fisik dan mental mengikuti apel pagi bengkel.' },
      { kebiasaan: '2. Beribadah', implementasi: 'Berdoa sebelum menyalakan mesin uji coba dan shalat Dzuhur berjamaah di masjid sekolah.' },
      { kebiasaan: '3. Berolahraga', implementasi: 'Melakukan senam peregangan otot sebelum mengangkat komponen transmisi/mesin berat.' },
      { kebiasaan: '4. Gemar Belajar', implementasi: 'Membaca workshop manual elektrikal dan update teknologi hybrid/electric vehicle.' },
      { kebiasaan: '5. Makan Sehat & Bergizi', implementasi: 'Membawa bekal sehat dan cukup minum air putih untuk menjaga stamina prima selama 6 jam di bengkel.' },
      { kebiasaan: '6. Bermasyarakat', implementasi: 'Gotong royong membersihkan ceceran oli bersama rekan, ramah melayani pelanggan servis.' },
      { kebiasaan: '7. Istirahat Cukup', implementasi: 'Tidur teratur pukul 21.30 WIB agar tidak mengantuk saat mengoperasikan mesin bertenaga tinggi.' }
    ],
    lkpd: {
      judulProyek: 'LKPD Proyek Diagnosis dan Tune-Up Sistem EFI Kendaraan Ringan Berbasis K3LH',
      petunjukKerja: [
        'Pastikan mengenakan wearpack dan safety shoes sebelum memasuki area bay servis bengkel.',
        'Pasang fender cover dan steering cover pada unit kendaraan praktik.',
        'Lakukan pengecekan visual pada soket kabel dan grounding kelistrikan sebelum menghubungkan scanner.',
        'Catat setiap kode DTC yang muncul, interpretasikan sesuai manual book, dan konsultasikan ke guru pembimbing.'
      ],
      tugasProyek: 'Lakukan proses diagnosis menyeluruh pada kendaraan yang mengalami limp-mode/brebet, cari 2 komponen sensor yang bermasalah, lakukan perbaikan kalibrasi, hapus DTC (clear code), dan lakukan verifikasi emisi gas buang.',
      alatBahan: [
        '1 Unit Trainer/Mobil Standar EFI (Toyota/Daihatsu)',
        '1 Unit Diagnostic Scanner OBD-II',
        'Digital Multimeter Auto-range & Test Pen DC',
        '1 Set Tool Box Mekanik (Kunci Pas, Ring, Sok, Obeng)',
        'Buku Manual Servis (Workshop Repair Manual) & Wiring Diagram'
      ],
      rubrikPenilaian: 'Aspek Penilaian: 1. Penerapan K3 & APD (20%), 2. Ketepatan Diagnosis Scan Tool (30%), 3. Keterampilan Perbaikan & SOP Wiring (30%), 4. Sikap Kerja Islami & 5S (20%). Skor maksimal 100.'
    }
  },

  // 2. TSM (Teknik Sepeda Motor)
  {
    id: 'preset-tsm',
    jurusan: ['TSM'],
    jurusanLabel: 'TSM (Teknik Sepeda Motor)',
    mataPelajaran: 'Konsentrasi Keahlian Teknik Sepeda Motor (AHASS Standard)',
    faseKelas: 'Fase F (Kelas XI)',
    topikMateri: 'Analisis dan Perawatan Sistem Transmisi Otomatis (CVT) dan Injeksi PGM-FI',
    metodePembelajaran: 'Project Based Learning (PjBL) Berbasis Standar Industri AHASS Honda',
    durasiProyek: '2 Pertemuan (12 JP @ 45 Menit)',
    capaianPembelajaran: 'Pada akhir Fase F, peserta didik mampu melakukan analisis gangguan, perawatan berkala, serta perbaikan sistem Continuously Variable Transmission (CVT) dan sistem PGM-FI sepeda motor matic sesuai standar operasional industri sepeda motor.',
    alurTujuanPembelajaran: '1. Menjelaskan prinsip kerja komponen CVT (drive pulley, driven pulley, v-belt, roller weight) dan sensor PGM-FI.\n2. Mendeteksi gejala getaran (gredek), slip v-belt, dan penurunan akselerasi.\n3. Melakukan pembongkaran, pengukuran toleransi keausan, pembersihan, dan pelumasan grease CVT tahan panas sesuai spesifikasi pabrikan.\n4. Meriset throttle position sensor (TPS) dan altitude setting menggunakan Honda Diagnostic Tool (HIDS).',
    tujuanPembelajaran: [
      'Peserta didik mampu mendiagnosis penyebab getar dan hilang daya pada motor matik dengan sistematis.',
      'Peserta didik mampu mengukur ketebalan v-belt, diameter roller, dan ketebalan kampas ganda dengan vernier caliper secara presisi.',
      'Peserta didik mampu merakit kembali sistem CVT dengan torsi pengencangan baut yang tepat menggunakan kunci momen.',
      'Peserta didik menghayati etos kerja amanah dan ketelitian teknisi Muslim dalam melayani masyarakat.'
    ],
    sintaksPembelajaran: [
      {
        tahap: '1. Orientasi Masalah Nyata (Mindful)',
        fokusDeepLearning: 'Mindful',
        aktivitasKonkret: 'Guru menyajikan motor matik yang bergetar keras saat tarikan awal. Siswa mendengarkan bunyi mesin dengan saksama dan merenungkan pentingnya kenyamanan berkendara konsumen sebagai wujud amal kebaikan.'
      },
      {
        tahap: '2. Perencanaan Proyek & Pembagian Peran (Meaningful)',
        fokusDeepLearning: 'Meaningful',
        aktivitasKonkret: 'Siswa membentuk tim bengkel 3 orang, membaca kartu kerja AHASS, memilih tools khusus (flywheel holder, clutch spring compressor, torque wrench) sesuai buku manual.'
      },
      {
        tahap: '3. Eksekusi Pembongkaran & Pengukuran (Joyful)',
        fokusDeepLearning: 'Joyful',
        aktivitasKonkret: 'Siswa membongkar blok CVT dengan riang gembira, membersihkan partikel debu kampas dengan cleaner ramah lingkungan, dan mengukur keausan roller secara teliti.'
      },
      {
        tahap: '4. Pengujian & Reset ECM (Interkoneksi)',
        fokusDeepLearning: 'Interkoneksi',
        aktivitasKonkret: 'Menghubungkan HIDS tool ke DLC connector, meriset MIL code, melakukan kalibrasi TPS, dan menguji motor di atas dyno/standar ganda untuk mengonfirmasi getaran telah hilang sempurna.'
      },
      {
        tahap: '5. Refleksi & Penyerahan Unit Kerja',
        fokusDeepLearning: 'Meaningful & Mindful',
        aktivitasKonkret: 'Menyusun laporan checklist 14 poin servis berkala dan melakukan serah terima unit dengan prinsip ramah 3S (Senyum, Salam, Sapa).'
      }
    ],
    integrasiSkillsPractice: {
      hardSkills: 'Penggunaan Special Service Tools (SST CVT), Kunci Torsi/Momen, Jangka Sorong Ketelitian 0.02mm, Diagnostic Tool HIDS, dan Kompresor Udara.',
      softSkills: 'Ketelitian membaca skala nonius, komunikasi antar mekanik, etika pelayanan Islami, kerapian penempatan baut.',
      praktikNyata: 'Standard operating procedure bengkel resmi AHASS Honda, manajemen limbah cair oli dan grease bekas.',
      keselamatanKerjaK3: 'Kacamata pelindung debu partikel, sarung tangan kain/karet, penahan roda belakang, dan larangan memutar gas berlebihan di dalam ruang tertutup.'
    },
    refleksi: {
      refleksiSiswa: 'Apakah saya sudah menggunakan kunci momen saat mengencangkan mur pulley agar tidak lepas di jalan? Bagaimana saya menyeimbangkan kecepatan dan kehati-hatian dalam bekerja?',
      refleksiGuru: 'Apakah siswa memahami bahwa getaran pada motor berakar pada fisika gesekan dan kebersihan permukaan? Bagaimana menumbuhkan rasa bangga sebagai calon teknisi sepeda motor andal?'
    },
    karakterKemuhammadiyahan: [
      'Disiplin waktu dan menjaga wudhu agar selalu tenang dalam menghadapi baut yang aus atau macet.',
      'Sikap jujur: Menginfokan kondisi riil v-belt ke pelanggan tanpa memaksakan penggantian jika masih layak pakai.',
      'Ta\'awun (tolong-menolong): Membantu rekan mekanik saat menahan pulley torsi tinggi.'
    ],
    tujuhKebiasaanAnakHebat: [
      { kebiasaan: '1. Bangun Pagi', implementasi: 'Bangun sebelum azan subuh, shalat berjamaah, dan siap di bengkel TSM tepat jam 07.00 WIB.' },
      { kebiasaan: '2. Beribadah', implementasi: 'Melafalkan basmalah sebelum menyentuh kunci perkakas bengkel.' },
      { kebiasaan: '3. Berolahraga', implementasi: 'Pemanasan sendi pergelangan tangan dan pinggang sebelum membongkar roda sepeda motor.' },
      { kebiasaan: '4. Gemar Belajar', implementasi: 'Mempelajari teknologi sepeda motor listrik (EV) yang mulai masuk pasar.' },
      { kebiasaan: '5. Makan Sehat & Bergizi', implementasi: 'Sarapan pagi bergizi seimbang untuk menunjang aktivitas fisik bengkel.' },
      { kebiasaan: '6. Bermasyarakat', implementasi: 'Melaksanakan bakti sosial servis motor gratis bagi masyarakat sekitar Bawang, Batang.' },
      { kebiasaan: '7. Istirahat Cukup', implementasi: 'Menjaga jam istirahat malam agar refleks motorik dan konsentrasi kerja tetap tajam.' }
    ],
    lkpd: {
      judulProyek: 'LKPD Praktik Analisis Keausan Komponen CVT & Reset PGM-FI Matic',
      petunjukKerja: [
        'Gunakan nampan khusus untuk menaruh baut dan komponen CVT agar tidak tercecer.',
        'Jangan mencuci v-belt dengan bensin atau cairan pelarut korosif.',
        'Gunakan kunci torsi saat pengencangan akhir baut mur drive pulley (59 Nm) dan driven pulley (49 Nm).'
      ],
      tugasProyek: 'Lakukan overhaul transmisi CVT, ukur ketebalan v-belt dan roller, lakukan pelumasan grease high-temp pada pin guide, rakit kembali, dan lakukan pembacaan sensor TPS dengan scanner.',
      alatBahan: [
        '1 Unit Sepeda Motor Matic (Vario / Beat / Scoopy)',
        'SST Universal Holder & Flywheel Holder',
        'Kunci Torsi & Soket 19mm, 22mm, 8mm',
        'Vernier Caliper (Jangka Sorong) Digital',
        'Special Grease CVT High-Temperature'
      ],
      rubrikPenilaian: 'Kriteria: Ketepatan Pengukuran (25%), Prosedur Bongkar-Pasang (35%), Keselamatan Kerja (20%), Kebersihan & 5S (20%).'
    }
  },

  // 3. AKUNTANSI
  {
    id: 'preset-akuntansi',
    jurusan: ['Akuntansi'],
    jurusanLabel: 'Akuntansi dan Keuangan Lembaga (AKL)',
    mataPelajaran: 'Akuntansi Keuangan & Praktikum Akuntansi Lembaga',
    faseKelas: 'Fase F (Kelas XI / XII)',
    topikMateri: 'Penyusunan Laporan Keuangan UMKM Terkomputerisasi Berbasis SAK EMKM dan Spreadsheet',
    metodePembelajaran: 'Project Based Learning (PjBL) bermitra dengan UMKM Lokal Batang',
    durasiProyek: '3 Pertemuan (15 JP @ 45 Menit)',
    capaianPembelajaran: 'Pada akhir Fase F, peserta didik mampu mengidentifikasi dokumen transaksi, mencatat jurnal umum/khusus, memposting ke buku besar, menyusun neraca saldo, jurnal penyesuaian, serta menyajikan laporan keuangan (Laba Rugi, Perubahan Ekuitas, Posisi Keuangan, Arus Kas, dan Catatan atas Laporan Keuangan) secara manual maupun menggunakan aplikasi spreadsheet terkomputerisasi.',
    alurTujuanPembelajaran: '1. Mengumpulkan dan menganalisis keabsahan bukti transaksi nyata UMKM sekitar Batang.\n2. Merancang format buku besar pembantu dan spreadsheet akuntansi otomatis menggunakan rumus VLOOKUP, SUMIFS, dan IF.\n3. Menghitung penyusutan aktiva tetap, beban akrual, dan penyesuaian persediaan barang dagang.\n4. Menghasilkan laporan keuangan komprehensif dan menyajikan rekomendasi kesehatan finansial usaha.',
    tujuanPembelajaran: [
      'Peserta didik mampu memvalidasi bukti transaksi dengan integritas tinggi dan teliti.',
      'Peserta didik mampu membangun siklus akuntansi otomatis pada aplikasi spreadsheet secara mandiri.',
      'Peserta didik mampu menganalisis kinerja keuangan UMKM dan memberikan saran perbaikan berbasis data finansial.',
      'Peserta didik meneladani sifat Shiddiq (jujur) dan Fathonah (cerdas) akuntan Muslim dalam menyajikan angka tanpa manipulasi.'
    ],
    sintaksPembelajaran: [
      {
        tahap: '1. Orientasi Konteks Ekonomi Nyata (Mindful)',
        fokusDeepLearning: 'Mindful',
        aktivitasKonkret: 'Guru menyajikan realitas UMKM pengolahan kopi/teh khas Bawang Batang yang sulit mengakses modal bank karena belum memiliki pencatatan keuangan rapi. Siswa diajak merenungkan peran profesi akuntan sebagai penegak keadilan muamalah.'
      },
      {
        tahap: '2. Perancangan Sistem Pencatatan (Meaningful)',
        fokusDeepLearning: 'Meaningful',
        aktivitasKonkret: 'Peserta didik merancang bagan akun (Chart of Accounts), format kartu persediaan, dan spreadsheet input transaksi yang user-friendly bagi pemilik usaha mikro.'
      },
      {
        tahap: '3. Input Transaksi & Otomasi Rumus (Joyful)',
        fokusDeepLearning: 'Joyful',
        aktivitasKonkret: 'Siswa bekerja berpasangan menginput puluhan transaksi riil, merumuskan fungsi otomatisasi tabel, saling mengoreksi jika terjadi selisih balance dengan suasana saling mendukung.'
      },
      {
        tahap: '4. Penyajian Laporan & Analisis Rasio (Interkoneksi)',
        fokusDeepLearning: 'Interkoneksi',
        aktivitasKonkret: 'Menghubungkan angka laba bersih dengan potensi zakat perniagaan 2.5%, pajak PPh Final UMKM 0.5%, dan proyeksi arus kas operasional untuk bulan berikutnya.'
      },
      {
        tahap: '5. Gelar Karya Laporan Keuangan & Refleksi',
        fokusDeepLearning: 'Meaningful & Mindful',
        aktivitasKonkret: 'Kelompok mempresentasikan dashboard keuangan kepada perwakilan mitra usaha/guru, menyampaikan hikmah akuntansi sebagai pencatat amanah ilahi (QS Al-Baqarah: 282).'
      }
    ],
    integrasiSkillsPractice: {
      hardSkills: 'Mastery Microsoft Excel/Google Sheets akuntansi tingkat lanjut (Nested IF, VLOOKUP, INDEX MATCH, Pivot Table), Software Akuntansi (Accurate/MYOB), penyusunan Laporan Keuangan SAK EMKM.',
      softSkills: 'Ketelitian tingkat tinggi (zero tolerance error), integritas anti-fraud, komunikasi konsultatif dengan pengusaha, dan manajemen arsip digital.',
      praktikNyata: 'Penyusunan laporan keuangan riil unit produksi sekolah dan UMKM lokal di Kecamatan Bawang, Batang.',
      keselamatanKerjaK3: 'Ergonomi bekerja di depan komputer (sikap duduk tegak, jarak pandang 50 cm, aturan 20-20-20 untuk kesehatan mata).'
    },
    refleksi: {
      refleksiSiswa: 'Apakah setiap transaksi yang saya catat didukung bukti sah? Apakah saya tergoda mengubah angka demi hasil balance instan? Bagaimana saya menjaga kejujuran akuntansi saya?',
      refleksiGuru: 'Apakah siswa sudah melihat akuntansi bukan sekadar rumus debit-kredit mekanis, melainkan instrumen transparansi dan keadilan ekonomi syiar Muhammadiyah?'
    },
    karakterKemuhammadiyahan: [
      'Menjunjung tinggi prinsip Ash-Shidqu (Kejujuran mutlak dalam pelaporan angka).',
      'Mengamalkan spirit QS. Al-Baqarah ayat 282 tentang pentingnya mencatat muamalah secara adil dan transparan.',
      'Anti terhadap praktik manipulasi pembukuan (Creative Accounting yang merugikan orang lain).'
    ],
    tujuhKebiasaanAnakHebat: [
      { kebiasaan: '1. Bangun Pagi', implementasi: 'Disiplin mengawali aktivitas belajar pembukuan dengan pikiran jernih di pagi hari.' },
      { kebiasaan: '2. Beribadah', implementasi: 'Menghitung zakat dan sedekah dari laba usaha sebagai pengingat hak dhuafa.' },
      { kebiasaan: '3. Berolahraga', implementasi: 'Melakukan senam mata dan stretching punggung di sela-sela mengoperasikan komputer akuntansi.' },
      { kebiasaan: '4. Gemar Belajar', implementasi: 'Mempelajari peraturan perpajakan terbaru dan standar akuntansi internasional.' },
      { kebiasaan: '5. Makan Sehat & Bergizi', implementasi: 'Mengonsumsi nutrisi yang baik untuk daya konsentrasi otak dalam membaca tabel angka.' },
      { kebiasaan: '6. Bermasyarakat', implementasi: 'Membantu pembukuan keuangan masjid atau ranting IPM/Muhammadiyah setempat.' },
      { kebiasaan: '7. Istirahat Cukup', implementasi: 'Tidur cukup agar tidak kehilangan fokus dan ketelitian dalam melakukan rekonsiliasi data.' }
    ],
    lkpd: {
      judulProyek: 'LKPD Proyek Audit Bukti Transaksi dan Penyusunan Laporan Keuangan SAK EMKM Berbasis Spreadsheet',
      petunjukKerja: [
        'Lakukan verifikasi stempel dan tanda tangan pada setiap bukti memorial dan faktur.',
        'Terapkan bagan akun (COA) standar 5 digit.',
        'Gunakan rumus terproteksi untuk mencegah ketidaksengajaan terhapusnya formula perhitungan neraca.'
      ],
      tugasProyek: 'Selesaikan siklus akuntansi dari 35 transaksi usaha dagang lokal Batang selama 1 bulan periode, cetak laporan Laba Rugi dan Neraca, serta buat ringkasan eksekutif kesehatan likuiditas usaha.',
      alatBahan: [
        'Komputer Lab Akuntansi dengan Microsoft Excel / Google Sheets',
        'Bundel Bukti Transaksi Usaha (Kuitansi, Nota, Cek, Faktur)',
        'Kalkulator Finansial & Flashdisk Arsip Portofolio'
      ],
      rubrikPenilaian: 'Ketepatan Jurnal (30%), Otomasi Rumus Spreadsheet (25%), Kerapian & Format Laporan (25%), Kejujuran & Presentasi (20%).'
    }
  },

  // 4. PERBANKAN SYARIAH
  {
    id: 'preset-perbankan-syariah',
    jurusan: ['Perbankan Syari\'ah'],
    jurusanLabel: 'Perbankan Syari\'ah (PBS)',
    mataPelajaran: 'Pengelolaan Kas, Simpanan, dan Pembiayaan Syariah',
    faseKelas: 'Fase F (Kelas XI)',
    topikMateri: 'Simulasi Pelayanan Customer Service & Teller Syariah serta Akad Pembiayaan Murabahah',
    metodePembelajaran: 'Role Playing & Project Based Learning (Mini Bank Syariah Sekolah)',
    durasiProyek: '2 Pertemuan (10 JP @ 45 Menit)',
    capaianPembelajaran: 'Pada akhir Fase F, peserta didik mampu mengelola transaksi penerimaan kas (teller), pembukaan rekening tabungan/deposito syariah (customer service), serta verifikasi berkas pengajuan akad pembiayaan syariah (Murabahah, Mudharabah, Musyarakah) sesuai regulasi OJK dan Dewan Syariah Nasional (DSN-MUI).',
    alurTujuanPembelajaran: '1. Mengidentifikasi rukun dan syarat akad-akad muamalah syariah tanpa riba, gharar, dan maysir.\n2. Melaksanakan role-play pelayanan teller (setoran tunai, kliring) dan customer service dengan etika perbankan syariah.\n3. Melakukan simulasi skema akad pembiayaan jual beli Murabahah dan pembuatan tabel angsuran margin keuntungan.\n4. Menyusun berkas administrasi pembiayaan mikro syariah dan pelaporan kas harian.',
    tujuanPembelajaran: [
      'Peserta didik mampu membedakan karakteristik akad syariah dengan bunga konvensional secara fasih dan meyakinkan.',
      'Peserta didik mampu mempraktikkan service excellence perbankan syariah dengan senyum tulus, salam Islami, dan sopan santun.',
      'Peserta didik mampu mengoperasikan aplikasi core banking mini bank dan menghitung marjin keuntungan pembiayaan syariah.',
      'Peserta didik memiliki dedikasi untuk memajukan ekonomi umat yang berkeadilan dan bebas riba.'
    ],
    sintaksPembelajaran: [
      {
        tahap: '1. Penghayatan Nilai Rahmatan Lil Alamin (Mindful)',
        fokusDeepLearning: 'Mindful',
        aktivitasKonkret: 'Guru membuka dengan ayat-ayat larangan riba (QS Al-Baqarah: 275). Siswa mendiskusikan secara mendalam bagaimana perbankan syariah hadir sebagai solusi kemakmuran umat yang adil dan menentang eksploitasi bunga.'
      },
      {
        tahap: '2. Perancangan Prosedur Front-liner & Akad (Meaningful)',
        fokusDeepLearning: 'Meaningful',
        aktivitasKonkret: 'Siswa merancang skenario pelayanan nasabah: petani sayur Bawang yang ingin mengajukan pembiayaan traktor dengan akad Murabahah. Disiapkan form aplikasi pembiayaan, slip setoran, dan surat persetujuan nasabah.'
      },
      {
        tahap: '3. Simulasi Praktik Mini Bank Sekolah (Joyful)',
        fokusDeepLearning: 'Joyful',
        aktivitasKonkret: 'Siswa bergantian bertindak sebagai Teller, Customer Service, Branch Manager, dan Nasabah dalam setting Mini Bank Syariah SMK Muhammadiyah Bawang. Transaksi disimulasikan menggunakan software perbankan.'
      },
      {
        tahap: '4. Rekonsiliasi Kas & Kepatuhan Syariah (Interkoneksi)',
        fokusDeepLearning: 'Interkoneksi',
        aktivitasKonkret: 'Siswa melakukan balancing kas fisik vs sistem di akhir hari (closing kasir teller) dan memastikan seluruh klausul perjanjian tidak melanggar fatwa DSN-MUI.'
      },
      {
        tahap: '5. Refleksi Spiritual & Profesional',
        fokusDeepLearning: 'Meaningful & Mindful',
        aktivitasKonkret: 'Setiap siswa mengungkapkan refleksi mengenai pentingnya menjaga kerahasiaan data nasabah (amanah) dan menjaga lisan dalam melayani masyarakat dengan ramah.'
      }
    ],
    integrasiSkillsPractice: {
      hardSkills: 'Pengoperasian Aplikasi Core Banking Mini Bank, Teknik Menghitung Uang Kertas Cepat dengan 3 Jari, Deteksi Keaslian Uang Rupiah (3D: Dilihat, Diraba, Diterawang), Pembuatan Akad Murabahah.',
      softSkills: 'Komunikasi persuasif dan empati nasabah, body language profesional syariah, pengendalian emosi (sabar), dan kerapian berpakaian syar\'i.',
      praktikNyata: 'Operasional Mini Bank Syariah SMK Muhammadiyah Bawang melayani tabungan siswa dan guru.',
      keselamatanKerjaK3: 'Sistem pengamanan loket teller, tombol darurat (panic button simulation), ergonomi meja counter, dan manajemen slip kertas tanpa bahaya robekan.'
    },
    refleksi: {
      refleksiSiswa: 'Apakah senyum dan keramahan saya tadi ikhlas karena Allah? Apakah saya telah teliti dalam menghitung jumlah uang tunai agar tidak terjadi selisih kas minus?',
      refleksiGuru: 'Apakah siswa telah menangkap ruh perbankan syariah yang mengutamakan tolong menolong, bukan sekadar mengganti istilah bunga dengan margin?'
    },
    karakterKemuhammadiyahan: [
      'Ghirah muamalah Islam: Semangat membebaskan masyarakat Batang dari jeratan rentenir/pinjaman riba.',
      'Sikap Tabligh: Menyampaikan edukasi literasi keuangan syariah kepada keluarga dan lingkungan.',
      'Integritas tanpa kompromi: Menjaga saldo titipan nasabah tanpa ada yang terpakai sedikit pun.'
    ],
    tujuhKebiasaanAnakHebat: [
      { kebiasaan: '1. Bangun Pagi', implementasi: 'Tiba di laboratorium Mini Bank 15 menit sebelum jam buka layanan untuk briefing pagi.' },
      { kebiasaan: '2. Beribadah', implementasi: 'Membuka hari dengan tadarus bersama dan mempraktikkan doa pembuka rezeki berkah.' },
      { kebiasaan: '3. Berolahraga', implementasi: 'Latihan kelenturan jari jemari tangan untuk kecepatan menghitung lembaran uang fisik.' },
      { kebiasaan: '4. Gemar Belajar', implementasi: 'Mempelajari fatwa-fatwa terbaru Dewan Syariah Nasional MUI terkait fintech syariah.' },
      { kebiasaan: '5. Makan Sehat & Bergizi', implementasi: 'Menjaga asupan gizi agar vokal suara saat melayani nasabah tetap prima dan bersemangat.' },
      { kebiasaan: '6. Bermasyarakat', implementasi: 'Edukasi gerakan menabung syariah di pengajian ranting Aisyiyah/Muhammadiyah.' },
      { kebiasaan: '7. Istirahat Cukup', implementasi: 'Menjaga kesegaran wajah dan daya konsentrasi melalui pola istirahat teratur.' }
    ],
    lkpd: {
      judulProyek: 'LKPD Simulasi Layanan Frontliner Bank Syariah dan Analisis Pembiayaan Murabahah',
      petunjukKerja: [
        'Kenakan atribut perbankan lengkap (ID Card, pin syariah, pakaian rapi).',
        'Terapkan 5S (Senyum, Sapa, Salam, Sopan, Santun) sejak nasabah melangkah masuk.',
        'Lakukan verifikasi keaslian uang dengan mesin detektor UV dan hitung nominal di depan nasabah.'
      ],
      tugasProyek: 'Lakukan simulasi penerimaan setoran tabungan wadiah Rp 5.000.000, pembukaan rekening baru, dan verifikasi berkas pengajuan akad Murabahah pembelian sepeda motor dengan marjin 12% per tahun selama 24 bulan.',
      alatBahan: [
        'Ruang Laboratorium Mini Bank Syariah',
        'Mesin Penghitung Uang & Money Detector Sinar Ultra Violet',
        'Komputer Client Core Banking Simulator & Printer Validasi',
        'Format Akad Murabahah, Blanko Aplikasi Pembiayaan, & Slip Setoran/Penarikan'
      ],
      rubrikPenilaian: 'Penampilan & Grooming (20%), Keramahan & Komunikasi (30%), Akurasi Transaksi Kas (30%), Kepatuhan Fiqih Muamalah (20%).'
    }
  },

  // 5. TJAT (Teknik Jaringan Akses Telekomunikasi)
  {
    id: 'preset-tjat',
    jurusan: ['TJAT'],
    jurusanLabel: 'Teknik Jaringan Akses Telekomunikasi (TJAT)',
    mataPelajaran: 'Jaringan Akses Fiber Optik (FTTH) dan Telekomunikasi Nirkabel',
    faseKelas: 'Fase F (Kelas XI)',
    topikMateri: 'Instalasi, Penyambungan (Splicing), dan Pengujian Redaman Kabel Fiber Optic FTTH',
    metodePembelajaran: 'Project Based Learning (PjBL) Standar Telkom Akses',
    durasiProyek: '3 Pertemuan (18 JP @ 45 Menit)',
    capaianPembelajaran: 'Pada akhir Fase F, peserta didik mampu merencanakan jalur kabel optik, melakukan penarikan kabel drop core, penyambungan core serat optik menggunakan fusion splicer, terminasi pada Optical Distribution Point (ODP) dan Optical Termination Box (OTB), serta melakukan pengukuran redaman link optik menggunakan Optical Power Meter (OPM) dan OTDR sesuai standar PT Telkom.',
    alurTujuanPembelajaran: '1. Memahami karakteristik serat optik single mode, struktur kabel duct/aerial, dan rugi-rugi redaman (attenuation).\n2. Mempraktikkan pengupasan (stripping), pembersihan (cleaning), dan pemotongan (cleaving) serat optik dengan presisi.\n3. Melakukan penyambungan fusi serat optik dengan target loss di bawah 0.03 dB/splice.\n4. Mengukur daya terima (Rx) pada modem ONT dan menganalisis grafik pantulan event menggunakan OTDR.',
    tujuanPembelajaran: [
      'Peserta didik mampu menerapkan prosedur K3 bahaya pecahan serat kaca dan radiasi sinar laser optik secara disiplin.',
      'Peserta didik terampil melakukan fusion splicing dengan hasil sambungan sempurna dan loss minimal.',
      'Peserta didik mampu mengoperasikan OPM dan OTDR untuk melokalisir titik putus kabel (fiber cut) secara mandiri.',
      'Peserta didik menghargai teknologi komunikasi sebagai sarana penyambung silaturahmi umat dan dakwah Islam.'
    ],
    sintaksPembelajaran: [
      {
        tahap: '1. Refleksi Pentingnya Konektivitas Umat (Mindful)',
        fokusDeepLearning: 'Mindful',
        aktivitasKonkret: 'Guru memaparkan dampak terputusnya kabel internet di pelosok desa pegunungan Batang terhadap layanan kesehatan dan pendidikan. Siswa menyadari peran mulia teknisi telekomunikasi sebagai pembawa kemaslahatan.'
      },
      {
        tahap: '2. Perencanaan Proyek Jaringan FTTH (Meaningful)',
        fokusDeepLearning: 'Meaningful',
        aktivitasKonkret: 'Siswa membuat topologi link budget dari ODP tiang ke roset rumah pelanggan, menghitung perkiraan loss redaman berdasarkan jarak dan jumlah konektor, serta menyiapkan APD K3 fiber optik.'
      },
      {
        tahap: '3. Eksekusi Stripping, Cleaving & Splicing (Joyful)',
        fokusDeepLearning: 'Joyful',
        aktivitasKonkret: 'Siswa berlatih konsentrasi tinggi memotong fiber dengan precision cleaver dan menyambungkannya pada mesin fusion splicer. Tepuk tangan dan apresiasi mengiringi setiap siswa yang berhasil memperoleh loss 0.00 - 0.02 dB.'
      },
      {
        tahap: '4. Pengujian OPM, OTDR & Live Internet Test (Interkoneksi)',
        fokusDeepLearning: 'Interkoneksi',
        aktivitasKonkret: 'Menguji daya laser dengan OPM (standar -15 dBm s.d -22 dBm), menyalakan modem ONT, dan melakukan speedtest internet untuk memvalidasi bahwa sambungan optik mentransmisikan data berkecepatan tinggi.'
      },
      {
        tahap: '5. Evaluasi & Pengemasan Hasil Kerja',
        fokusDeepLearning: 'Meaningful & Mindful',
        aktivitasKonkret: 'Menata tray kaset OTB, membersihkan sisa serpihan kaca fiber ke wadah khusus limbah tajam, dan mempresentasikan laporan hasil uji redaman.'
      }
    ],
    integrasiSkillsPractice: {
      hardSkills: 'Operasional Fusion Splicer, Fiber Cleaver, Miller Stripper, Optical Power Meter (OPM), Visual Fault Locator (VFL/Laser Pen), Optical Time Domain Reflectometer (OTDR), dan terminasi konektor SC/UPC.',
      softSkills: 'Ketelitian mikro-milimeter, kesabaran dan ketenangan tangan saat handling core kaca, kerja sama tim instalasi lapangan.',
      praktikNyata: 'Pembangunan jaringan FTTH indoor kampus SMK Muhammadiyah Bawang dan simulasi gangguan jaringan ISP lokal.',
      keselamatanKerjaK3: 'Kacamata pelindung laser, larangan melihat langsung ujung fiber yang menyala, wadah buangan pecahan kaca (fiber sharps disposal), dan sarung tangan isolasi.'
    },
    refleksi: {
      refleksiSiswa: 'Apakah saya sudah memastikan tidak ada pecahan kaca serat optik yang tercecer di lantai atau menancap di tangan? Mengapa kesabaran dalam memotong sudut serat optik sangat menentukan kecepatan internet pelanggan?',
      refleksiGuru: 'Bagaimana membimbing siswa yang tangannya masih gemetar saat memasukkan core ke v-groove splicer? Apakah nilai kesabaran dan keikhlasan kerja berhasil dihayati?'
    },
    karakterKemuhammadiyahan: [
      'Menjaga keselamatan sesama: Sangat waspada terhadap bahaya pecahan kaca agar tidak melukai rekan atau orang lain.',
      'Semangat menghubungkan silaturahmi (Al-Waslah): Memandang jaringan telekomunikasi sebagai infrastruktur dakwah kebaikan.',
      'Profesionalisme teknisi Muslim: Memberikan redaman terbaik tanpa manipulasi angka kalibrasi alat.'
    ],
    tujuhKebiasaanAnakHebat: [
      { kebiasaan: '1. Bangun Pagi', implementasi: 'Mempersiapkan peralatan optik di lab sebelum jam praktik dimulai.' },
      { kebiasaan: '2. Beribadah', implementasi: 'Membaca doa agar diberi ketenangan dan ketajaman fokus sebelum proses penyambungan core kaca.' },
      { kebiasaan: '3. Berolahraga', implementasi: 'Peregangan leher dan pundak untuk menjaga kenyamanan saat bekerja di meja splicer.' },
      { kebiasaan: '4. Gemar Belajar', implementasi: 'Mempelajari perkembangan standar kabel serat optik generasi terbaru (G.657 anti-bending).' },
      { kebiasaan: '5. Makan Sehat & Bergizi', implementasi: 'Konsumsi vitamin A dan makanan sehat untuk menunjang ketajaman penglihatan saat melihat serat mikron.' },
      { kebiasaan: '6. Bermasyarakat', implementasi: 'Membantu warga desa sekitar dalam perbaikan instalasi kabel internet pedesaan.' },
      { kebiasaan: '7. Istirahat Cukup', implementasi: 'Istirahat cukup agar tangan tidak tremor saat menempatkan serat optik berdiameter 125 mikron.' }
    ],
    lkpd: {
      judulProyek: 'LKPD Praktik Splicing Serat Optik Drop Cable dan Validasi Redaman Link FTTH',
      petunjukKerja: [
        'Wajib mengenakan kacamata pelindung kerja.',
        'Kupas coating kabel secara bertahap sepanjang 3-4 cm.',
        'Bersihkan cladding dengan alkohol 95% menggunakan tissue optik searah.',
        'Potong menggunakan fiber cleaver pada panjang kupas 10-16 mm.',
        'Masukkan ke v-groove fusion splicer dan tutup cover penutup.'
      ],
      tugasProyek: 'Lakukan penyambungan 2 buah drop core optik dengan target loss splicing <= 0.02 dB, pasang protection sleeve dengan pemanas thermal, dan ukur daya redaman dengan OPM pada panjang gelombang 1310 nm dan 1490 nm.',
      alatBahan: [
        '1 Unit Mesin Fusion Splicer & Fiber Cleaver',
        'Drop Core Cable 1 Core 3 Steel Wire',
        'Protection Sleeve 60mm & Alkohol 95%',
        'Optical Power Meter (OPM) & Laser VFL 20 mW',
        'Tang Stripper 3 Lubang (Miller Stripper)'
      ],
      rubrikPenilaian: 'Kerapian Stripping (20%), Kualitas Cleaving & Loss Splicing (40%), Pengukuran Redaman OPM (20%), K3 & Pembuangan Kaca (20%).'
    }
  },

  // 6. TKJ (Teknik Komputer dan Jaringan)
  {
    id: 'preset-tkj',
    jurusan: ['TKJ'],
    jurusanLabel: 'Teknik Komputer dan Jaringan (TKJ)',
    mataPelajaran: 'Administrasi Infrastruktur Jaringan & Keamanan Komputer',
    faseKelas: 'Fase F (Kelas XI / XII)',
    topikMateri: 'Konfigurasi Jaringan Berbasis VLAN, Routing OSPF, dan Firewall Filter Berbasis RouterOS MikroTik',
    metodePembelajaran: 'Project Based Learning (PjBL) Simulasi Jaringan Enterprise SMK',
    durasiProyek: '3 Pertemuan (15 JP @ 45 Menit)',
    capaianPembelajaran: 'Pada akhir Fase F, peserta didik mampu merencanakan topologi, memasang perangkat jaringan, mengkonfigurasi Virtual Local Area Network (VLAN), routing dinamis (OSPF/BGP), manajemen bandwidth (Queue Tree), serta mengamankan gateway jaringan menggunakan firewall filtering dan NAT pada perangkat router manajemen.',
    alurTujuanPembelajaran: '1. Menganalisis kebutuhan segmentasi trafik antar laboratorium dan kantor menggunakan VLAN.\n2. Mengkonfigurasi VLAN Trunking, VLAN Access, dan Inter-VLAN Routing pada RouterOS MikroTik.\n3. Mengimplementasikan dynamic routing OSPF untuk redundansi jalur koneksi internet.\n4. Menerapkan firewall filter rules untuk mencegah serangan brute force dan memblokir konten negatif pornografi/judi online demi keamanan moral siswa.',
    tujuanPembelajaran: [
      'Peserta didik mampu mendesain topologi jaringan enterprise yang aman, efisien, dan terkelola dengan baik.',
      'Peserta didik terampil mengkonfigurasi VLAN dan routing inter-VLAN pada perangkat MikroTik secara mandiri.',
      'Peserta didik mampu membangun benteng pertahanan firewall untuk melindungi pengguna dari kejahatan siber dan konten berbahaya.',
      'Peserta didik menghayati adab bermedia digital dan integritas etika profesi IT muslim.'
    ],
    sintaksPembelajaran: [
      {
        tahap: '1. Kesadaran Ruang Siber yang Bersih (Mindful)',
        fokusDeepLearning: 'Mindful',
        aktivitasKonkret: 'Guru menyajikan fenomena maraknya kebocoran data dan bahaya judi online yang merusak generasi muda. Siswa diajak merenungkan peran strategis teknisi jaringan sebagai penjaga gerbang moral dan keamanan siber masyarakat.'
      },
      {
        tahap: '2. Perancangan Arsitektur Jaringan (Meaningful)',
        fokusDeepLearning: 'Meaningful',
        aktivitasKonkret: 'Siswa merancang skema pengalamatan IP VLSM, menentukan ID VLAN untuk Lab Komputer, Guru, dan Siswa, serta menyusun tabel routing dan rule firewall proteksi.'
      },
      {
        tahap: '3. Konfigurasi Hands-On & Troubleshooting (Joyful)',
        fokusDeepLearning: 'Joyful',
        aktivitasKonkret: 'Siswa mengonfigurasi routerboard MikroTik menggunakan aplikasi Winbox secara kolaboratif dalam tim 3 orang, saling membantu mengatasi error IP conflict dan routing loop.'
      },
      {
        tahap: '4. Pengujian Penetrasi & Simulasi Beban (Interkoneksi)',
        fokusDeepLearning: 'Interkoneksi',
        aktivitasKonkret: 'Melakukan stress-test bandwidth, uji isolasi antar VLAN, serta pengujian pemblokiran domain berbahaya. Memastikan jaringan stabil mendukung kelancaran kegiatan belajar mengajar sekolah.'
      },
      {
        tahap: '5. Dokumentasi Topologi & Refleksi Etika Siber',
        fokusDeepLearning: 'Meaningful & Mindful',
        aktivitasKonkret: 'Siswa mempresentasikan rancangan konfigurasi, menyerahkan file backup router, dan merumuskan komitmen bersama etika "White Hat Hacker" berlandaskan nilai-nilai Islam.'
      }
    ],
    integrasiSkillsPractice: {
      hardSkills: 'Konfigurasi MikroTik RouterOS (Winbox & CLI), VLAN 802.1Q, DHCP Server/Relay, Dynamic Routing OSPF, Firewall Filter Rules, Web Proxy Blocking, Bandwidth Queue Tree, Wireshark Packet Analysis.',
      softSkills: 'Logical thinking, troubleshooting metodis (bottom-up OSI layer), kerja sama tim, dokumentasi teknis yang rapi.',
      praktikNyata: 'Manajemen jaringan Wi-Fi publik dan segregasi jaringan laboratorium komputer di lingkungan SMK Muhammadiyah Bawang.',
      keselamatanKerjaK3: 'K3 kelistrikan rack server, penggunaan gelang antistatik (antistatic wrist strap), kabel manajemen rapi (cable management ties), dan ventilasi pendingin ruang server.'
    },
    refleksi: {
      refleksiSiswa: 'Apakah saya menggunakan ilmu jaringan ini untuk kemaslahatan dan perlindungan, bukan untuk meretas akun orang lain? Bagaimana saya memastikan konfigurasi firewall saya benar-benar menutup celah kerentanan?',
      refleksiGuru: 'Apakah siswa memahami filosofi di balik pembagian subnet dan VLAN sebagai bentuk keteraturan (tanzhim) dalam Islam? Bagaimana memastikan seluruh siswa berkesempatan mengonfigurasi perangkat riil?'
    },
    karakterKemuhammadiyahan: [
      'Menjadi benteng amar ma\'ruf nahi munkar di dunia siber dengan memblokir akses ke situs-situs haram dan merusak.',
      'Sikap jujur: Menjaga kerahasiaan password admin dan tidak menyalahgunakan akses jaringan internal.',
      'Fastabiqul Khairat: Terus memperbarui wawasan sertifikasi kompetensi (MTCNA, Cisco CCNA).'
    ],
    tujuhKebiasaanAnakHebat: [
      { kebiasaan: '1. Bangun Pagi', implementasi: 'Hadir awal untuk memastikan server lab sekolah menyala dan terkoneksi sebelum siswa lain login.' },
      { kebiasaan: '2. Beribadah', implementasi: 'Menjaga shalat tepat waktu dan memanfaatkan jaringan internet untuk mengakses kajian Islam bermanfaat.' },
      { kebiasaan: '3. Berolahraga', implementasi: 'Peregangan tangan dan mata untuk mencegah cedera sindrom terowongan karpal (CTS).' },
      { kebiasaan: '4. Gemar Belajar', implementasi: 'Mempelajari dokumentasi resmi MikroTik Wiki dan teknologi cloud container.' },
      { kebiasaan: '5. Makan Sehat & Bergizi', implementasi: 'Minum air putih teratur untuk mencegah dehidrasi saat berjam-jam melakukan remote konfigurasi router.' },
      { kebiasaan: '6. Bermasyarakat', implementasi: 'Membantu pemasangan jaringan internet gratis di madrasah atau masjid sekitar.' },
      { kebiasaan: '7. Istirahat Cukup', implementasi: 'Menghindari begadang yang sia-sia di depan layar agar daya analisis logika tetap tajam.' }
    ],
    lkpd: {
      judulProyek: 'LKPD Implementasi Segmentasi Jaringan VLAN dan Keamanan Firewall MikroTik',
      petunjukKerja: [
        'Reset konfigurasi default routerboard ke kondisi kosong (No Default Configuration).',
        'Pastikan port ether1 dialokasikan sebagai WAN/Internet Gateway.',
        'Gunakan penamaan interface dan comment yang jelas pada setiap rule konfigurasi.'
      ],
      tugasProyek: 'Bangun jaringan dengan 2 VLAN berbeda (VLAN 10: Guru, VLAN 20: Siswa), terapkan inter-VLAN routing, buat rule firewall yang memblokir akses VLAN Siswa ke server nilai Guru, dan blokir domain situs judi/pornografi.',
      alatBahan: [
        '1 Unit MikroTik Routerboard (RB750/RB951/hAP series)',
        '2 Unit PC / Laptop Client',
        'Kabel LAN UTP Cat 6 dengan konektor RJ-45 & Crimping Tool',
        'Aplikasi Winbox v3.x dan Wireshark Network Analyzer'
      ],
      rubrikPenilaian: 'Desain Pengalamatan IP (20%), Konfigurasi VLAN & Trunking (30%), Implementasi Firewall & Keamanan (30%), Troubleshooting & Presentasi (20%).'
    }
  },

  // 7. SEMUA JURUSAN (LINTAS VOKASI / PROYEK KOLABORASI / KEWIRAUSAHAAN)
  {
    id: 'preset-semua-jurusan',
    jurusan: ['Semua Jurusan', 'TKR', 'TSM', 'Akuntansi', 'Perbankan Syari\'ah', 'TJAT', 'TKJ'],
    jurusanLabel: 'Semua Jurusan (Kolaborasi Lintas Disiplin Vokasi SMK)',
    mataPelajaran: 'Projek Kreatif dan Kewirausahaan (PKK) Terintegrasi',
    faseKelas: 'Fase F (Kelas XI / XII)',
    topikMateri: 'Pengembangan Usaha Rintisan (Startup) Berbasis Potensi Lokal Batang Mengintegrasikan Teknologi, Finansial, dan Layanan Jasa Vokasi',
    metodePembelajaran: 'Project Based Learning (PjBL) Kolaborasi Multi-Jurusan',
    durasiProyek: '4 Pertemuan (24 JP @ 45 Menit)',
    capaianPembelajaran: 'Pada akhir Fase F, peserta didik dari berbagai bidang keahlian mampu merencanakan, memproduksi, memasarkan, dan mengevaluasi produk barang atau layanan jasa yang mengintegrasikan kompetensi keahlian teknis (TKR, TSM, TJAT, TKJ) dengan manajemen keuangan akuntansi dan perbankan syariah sesuai potensi agrobisnis dan industri Kabupaten Batang.',
    alurTujuanPembelajaran: '1. Mengidentifikasi peluang usaha sinergi antar jurusan (contoh: bengkel keliling digital berbasis aplikasi web, layanan internet desa cerdas, atau pengolahan hasil perkebunan Bawang).\n2. Membagi peran divisi: Divisi Teknis Mesin/Jaringan (TKR/TSM/TJAT/TKJ) dan Divisi Keuangan/Pemasaran (AKL/PBS).\n3. Merancang purwarupa produk/layanan jasa, analisis kelayakan usaha (BEP), dan strategi pemasaran digital.\n4. Melaksanakan pameran karya (Expo Vokasi) dan mengevaluasi kepuasan konsumen dengan etika bisnis Islam.',
    tujuanPembelajaran: [
      'Peserta didik mampu berkolaborasi lintas keilmuan secara harmonis dan saling menghargai keahlian bidang lain.',
      'Peserta didik mampu menghasilkan prototype produk/jasa inovatif yang memecahkan masalah riil masyarakat Batang.',
      'Peserta didik mampu menyusun proyeksi keuangan syariah dan laporan pertanggungjawaban usaha yang akuntabel.',
      'Peserta didik menginternalisasi karakter wirausahawan Muhammadiyah: mandiri, inovatif, dan berjiwa sosial.'
    ],
    sintaksPembelajaran: [
      {
        tahap: '1. Menemukan Masalah & Peluang Lokal (Mindful)',
        fokusDeepLearning: 'Mindful',
        aktivitasKonkret: 'Peserta didik dari lintas jurusan berkumpul dan merefleksikan potensi geografis Bawang Batang (perkebunan, pariwisata, bengkel pelosok). Menumbuhkan kepekaan nurani bahwa ilmu vokasi adalah sarana memajukan kesejahteraan masyarakat.'
      },
      {
        tahap: '2. Pembentukan Tim Interdisipliner & Desain Solusi (Meaningful)',
        fokusDeepLearning: 'Meaningful',
        aktivitasKonkret: 'Membentuk tim perpaduan (siswa Teknik + siswa Akuntansi/PBS). Siswa teknik merancang spesifikasi alat/layanan, sementara siswa akuntansi/perbankan menyusun anggaran biaya, harga pokok produksi (HPP), dan akad kemitraan syariah.'
      },
      {
        tahap: '3. Pembuatan Prototipe & Uji Coba Lapangan (Joyful)',
        fokusDeepLearning: 'Joyful',
        aktivitasKonkret: 'Masing-masing divisi bekerja dalam suasana bengkel & lab terpadu yang guyub. Terjadi pertukaran wawasan yang menggembirakan antara anak teknik dan anak keuangan.'
      },
      {
        tahap: '4. Peluncuran Layanan & Simulasi Transaksi (Interkoneksi)',
        fokusDeepLearning: 'Interkoneksi',
        aktivitasKonkret: 'Membuka stand simulasi usaha di halaman SMK Muhammadiyah Bawang, melayani pesanan nyata, menerapkan transaksi digital, dan mencatat transaksi ke pembukuan resmi.'
      },
      {
        tahap: '5. Evaluasi Dampak, Laba, & Zakat Perniagaan',
        fokusDeepLearning: 'Meaningful & Mindful',
        aktivitasKonkret: 'Menghitung laba kotor dan laba bersih, menyisihkan 2.5% untuk kas LazisMu sekolah, dan mempresentasikan pembelajaran sinergi tim.'
      }
    ],
    integrasiSkillsPractice: {
      hardSkills: 'Kombinasi keahlian teknis sesuai jurusan (mekanikal otomotif, jaringan komputer/fiber optik) dipadukan dengan pembukuan spreadsheet, desain promosi Canva/sosmed, dan penyusunan proposal bisnis.',
      softSkills: 'Cross-functional leadership, negosiasi, toleransi antar bidang ilmu, kemampuan komunikasi publik, etika transaksi jujur.',
      praktikNyata: 'Penyelenggaraan Business Showcase / Expo Inovasi Terpadu SMK Muhammadiyah Bawang bermitra dengan LazisMu dan UMKM Batang.',
      keselamatanKerjaK3: 'Penerapan K3 terintegrasi (K3 bengkel fisik dan ergonomi digital), sanitasi kebersihan lokasi expo, dan keselamatan pengunjung.'
    },
    refleksi: {
      refleksiSiswa: 'Bagaimana rasanya bekerja sama dengan teman yang jurusannya berbeda? Pelajaran apa yang saya dapatkan mengenai pentingnya saling melengkapi antar keahlian? Apakah usaha kami membawa manfaat bagi orang lain?',
      refleksiGuru: 'Bagaimana memfasilitasi komunikasi antar guru pembimbing kejuruan yang berbeda? Apakah siswa telah menyerap hakikat Deep Learning sebagai keterhubungan antar ilmu pengetahuan?'
    },
    karakterKemuhammadiyahan: [
      'Ukhuwah Islamiyah dan sinergi kolektif (Ta\'awun \'alal birri wat taqwa).',
      'Etos wirausaha mandiri meneladani saudagar besar KH. Ahmad Dahlan.',
      'Filantropi berkemajuan: Mengalokasikan sebagian keuntungan usaha untuk beasiswa pendidikan dan pemberdayaan dhuafa.'
    ],
    tujuhKebiasaanAnakHebat: [
      { kebiasaan: '1. Bangun Pagi', implementasi: 'Menyiapkan stand pameran dan bahan proyek sejak pagi hari dengan penuh antusiasme.' },
      { kebiasaan: '2. Beribadah', implementasi: 'Menyempatkan shalat Dhuha sebelum membuka aktivitas usaha dan berdoa untuk keberkahan tim.' },
      { kebiasaan: '3. Berolahraga', implementasi: 'Menjaga kebugaran jasmani bersama agar stamina tetap terjaga selama masa eksekusi proyek expo.' },
      { kebiasaan: '4. Gemar Belajar', implementasi: 'Belajar saling silang: anak teknik belajar dasar keuangan, anak akuntansi belajar dasar teknologi.' },
      { kebiasaan: '5. Makan Sehat & Bergizi', implementasi: 'Memilih makanan sehat bersama tim kerja untuk menjaga daya tahan tubuh.' },
      { kebiasaan: '6. Bermasyarakat', implementasi: 'Menghadirkan solusi nyata yang dapat dibeli atau dimanfaatkan warga masyarakat Bawang.' },
      { kebiasaan: '7. Istirahat Cukup', implementasi: 'Manajemen target waktu yang baik agar tidak perlu begadang larut malam.' }
    ],
    lkpd: {
      judulProyek: 'LKPD Proyek Kolaborasi Lintas Jurusan: Inkubasi Usaha Kreatif Vokasi Berkemajuan',
      petunjukKerja: [
        'Bentuk kelompok beranggotakan 4-6 siswa perpaduan lintas kejuruan.',
        'Tentukan Chief Executive Officer (CEO), Chief Technology Officer (CTO), dan Chief Financial Officer (CFO).',
        'Buat Business Model Canvas (BMC) 1 halaman dan purwarupa layanan yang siap diuji coba.'
      ],
      tugasProyek: 'Rancang, luncurkan, dan evaluasi 1 unit bisnis rintisan sinergi kejuruan yang berorientasi pada pemecahan masalah lokal di Kabupaten Batang selama durasi 4 minggu proyek.',
      alatBahan: [
        'Peralatan Praktik Kejuruan Masing-Masing (Bengkel TKR/TSM, Lab Komputer TKJ/TJAT, Perbankan/Akuntansi)',
        'Kertas Plano & Spidol Warna untuk Business Model Canvas',
        'Aplikasi Desain Promosi & Smartphone untuk Konten Edukasi/Pemasaran'
      ],
      rubrikPenilaian: 'Kreativitas & Orisinalitas Solusi (25%), Sinergi Tim Lintas Jurusan (25%), Kelayakan Teknis & Finansial (30%), Presentasi & Nilai Kemuhammadiyahan (20%).'
    }
  }
];

export const ALL_PRESETS: JurusanPreset[] = [
  ...JURUSAN_PRESETS,
  ...MAPEL_UMUM_PRESETS
];

/**
 * Intelligent Auto-Fill Engine:
 * Generates all dependent fields whenever CP or ATP is filled or modified by the user.
 * Supports vocational domains, general subjects (Indonesian, English 4 skills, Math, History, PAI, Kemuhammadiyahan, Pancasila, Javanese, Informatics),
 * and 10 curriculum alternatives.
 */
export function generateFieldsFromCpAndAtp(
  cp: string,
  atp: string,
  selectedJurusan: SMKJurusan[],
  faseKelas: string,
  namaGuru: string,
  existingData?: Partial<ModulAjarPromptData>,
  alternatifId: AlternatifGenerateModul = 'pjbl-tefa'
): Partial<ModulAjarPromptData> {
  return generateFieldsFromCpAndAtpWithAlternatif(
    cp,
    atp,
    selectedJurusan,
    faseKelas,
    namaGuru,
    existingData,
    alternatifId
  );
}

/**
 * Builds the Master AI Prompt for ChatGPT/Gemini/Claude
 */
export function buildMasterPromptText(data: ModulAjarPromptData): string {
  const jurusanStr = data.selectedJurusan.join(', ');
  const tpListStr = data.tujuanPembelajaran.map((tp, idx) => `   ${idx + 1}. ${tp}`).join('\n');
  
  const sintaksStr = data.sintaksPembelajaran
    .map((s, idx) => `   - ${s.tahap} [Pendekatan: ${s.fokusDeepLearning}]:\n     Aktivitas Konkret: ${s.aktivitasKonkret}`)
    .join('\n');

  const muhammadiyahStr = data.karakterKemuhammadiyahan.map((k, i) => `   - ${k}`).join('\n');

  const kebiasaanStr = data.tujuhKebiasaanAnakHebat
    .map((k) => `   - ${k.kebiasaan}: ${k.implementasi}`)
    .join('\n');

  return `### PROMPT GENERATOR MODUL AJAR & LKPD KURIKULUM MERDEKA BERBASIS DEEP LEARNING
Instansi: SMK Muhammadiyah Bawang, Batang (Jawa Tengah)
Program Keahlian / Jurusan: ${jurusanStr}

Bertindaklah sebagai Konsultan Pendidikan Vokasi Ahli Kurikulum Merdeka dan Pakar Pedagogi Deep Learning (Meaningful, Mindful, Joyful, Interkoneksi) sekaligus Pengembang Karakter Kemuhammadiyahan dan Budaya Industri.

Tolong buatkan Modul Ajar Lengkap dan Lembar Kerja Peserta Didik (LKPD) yang komprehensif, terstruktur, siap pakai, dan aplikatif sesuai parameter spesifik berikut:

==================================================
1. IDENTITAS MATERI & MATA PELAJARAN
==================================================
- Kurikulum: ${data.kurikulum}
- Satuan Pendidikan: SMK Muhammadiyah Bawang, Batang
- Fase / Kelas: ${data.faseKelas}
- Mata Pelajaran: ${data.mataPelajaran || 'Mata Pelajaran Kejuruan'}
- Nama Kelas / Jurusan: ${data.namaKelasJurusan}
- Topik / Materi Terintegrasi: ${data.topikMateri}
- Pendekatan Pembelajaran: ${data.pendekatan}
- Metode Pembelajaran: ${data.metodePembelajaran}
- Durasi Proyek: ${data.durasiProyek}
- Nama Guru Pengampu: ${data.namaGuru}

==================================================
2. CAPAIAN PEMBELAJARAN (CP) FASE & ALUR TUJUAN PEMBELAJARAN (ATP)
==================================================
Capaian Pembelajaran (CP) yang Dituju:
${data.capaianPembelajaran}

Alur Tujuan Pembelajaran (ATP):
${data.alurTujuanPembelajaran}

==================================================
3. TUJUAN PEMBELAJARAN (PENJABARAN ATP & KKTP)
==================================================
${tpListStr}

==================================================
4. SINTAKS METODE PEMBELAJARAN (AKTIVITAS KONKRET DEEP LEARNING)
==================================================
${sintaksStr}

==================================================
8. INTEGRASI SKILLS + PRACTICE (DUNIA INDUSTRI / DUDI)
==================================================
- Hard Skills Vokasi: ${data.integrasiSkillsPractice.hardSkills}
- Soft Skills Kerja: ${data.integrasiSkillsPractice.softSkills}
- Praktik Nyata Vokasi DUDI: ${data.integrasiSkillsPractice.praktikNyata}
- Keselamatan Kerja (K3LH): ${data.integrasiSkillsPractice.keselamatanKerjaK3}

==================================================
10. REFLEKSI SISWA & GURU
==================================================
- Refleksi Peserta Didik: ${data.refleksi.refleksiSiswa}
- Refleksi Pendidik: ${data.refleksi.refleksiGuru}

==================================================
PENGUATAN KARAKTER KEMUHAMMADIYAHAN
==================================================
${muhammadiyahStr}

==================================================
PETA KONSEP KARAKTER 7 KEBIASAAN ANAK INDONESIA HEBAT
==================================================
${kebiasaanStr}

==================================================
FORMAT LEMBAR KERJA PESERTA DIDIK (LKPD) TERINTEGRASI
==================================================
- Judul Proyek: ${data.lkpd.judulProyek}
- Petunjuk Kerja:
${data.lkpd.petunjukKerja.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}
- Tugas Proyek Nyata: ${data.lkpd.tugasProyek}
- Alat & Bahan Praktik: ${data.lkpd.alatBahan.join(', ')}
- Rubrik Asesmen & Penilaian: ${data.lkpd.rubrikPenilaian}

TUGAS AI:
Kembangkan isi modul di atas menjadi draf lengkap dengan narasi pedagogis yang hidup, detail skenario percakapan guru-siswa dalam fase Mindful, lembar observasi penilaian kinerja siswa, dan rubrik asesmen formatif-sumatif yang siap dicetak!`;
}
