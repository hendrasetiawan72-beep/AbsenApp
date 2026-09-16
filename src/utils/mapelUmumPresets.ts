import { JurusanPreset } from './modulGeneratorPresets';

export const MAPEL_UMUM_PRESETS: JurusanPreset[] = [
  // 1. BAHASA INDONESIA
  {
    id: 'preset-bahasa-indonesia',
    jurusan: ['Semua Jurusan'],
    jurusanLabel: 'Bahasa Indonesia (Lintas Jurusan)',
    mataPelajaran: 'Bahasa Indonesia',
    faseKelas: 'Fase E (Kelas X) / Fase F (Kelas XI)',
    topikMateri: 'Penyusunan Teks Laporan Hasil Observasi (LHO) dan Teks Prosedur Operasional Standar (SOP) Industri',
    metodePembelajaran: 'Project Based Learning (PjBL) Riset & Dokumentasi Teknis Vokasi',
    durasiProyek: '2 Pertemuan (8 JP @ 45 Menit)',
    capaianPembelajaran: 'Pada akhir fase, peserta didik mampu mengevaluasi dan mengkreasi informasi berupa gagasan, fakta, dan pesan akurat dari menyimak dan membaca berbagai tipe teks nonfiksi, khususnya teks laporan hasil observasi lingkungan kerja industri serta teks prosedur operasional standar (SOP) kejuruan secara logis, kritis, santun, dan komunikatif.',
    alurTujuanPembelajaran: '1. Mengidentifikasi struktur teks LHO (pernyataan umum, deskripsi bagian, deskripsi manfaat) dan kaidah kebahasaan teknis pada laporan kerja bengkel/kantor.\n2. Melakukan observasi lapangan langsung ke bengkel atau laboratorium SMK Muhammadiyah Bawang Batang dan mencatat data faktual objektif.\n3. Menyusun draf teks LHO dan teks prosedur instruksi kerja (SOP) dengan kosakata baku dan peristilahan kejuruan yang akurat.\n4. Mempresentasikan hasil laporan observasi secara lisan dengan intonasi jelas, percaya diri, dan menanggapi pertanyaan secara santun.',
    tujuanPembelajaran: [
      'Peserta didik mampu menganalisis struktur dan kaidah kebahasaan teks laporan hasil observasi dan teks prosedur kejuruan dengan kritis (Mindful).',
      'Peserta didik mampu melakukan observasi faktual di lingkungan praktik vokasi dan mengorganisasikan data secara sistematis tanpa bias (Meaningful).',
      'Peserta didik mampu menyusun draf laporan kerja dan panduan SOP operasional secara kolaboratif dalam tim dengan bahasa Indonesia yang baik dan benar (Joyful).',
      'Peserta didik mampu menghubungkan etika kejujuran penyampaian data laporan dengan prinsip amanah dan transparansi dunia kerja (Interkoneksi).'
    ],
    sintaksPembelajaran: [
      {
        tahap: '1. Orientasi Masalah Komunikasi Teknis (Mindful Awareness)',
        fokusDeepLearning: 'Mindful',
        aktivitasKonkret: 'Guru menyajikan contoh miskomunikasi di tempat kerja akibat laporan teknis yang rancu dan tidak akurat. Siswa diajak hening merenungkan pentingnya kejujuran kata dan objektivitas data bagi keselamatan dan efisiensi kerja.'
      },
      {
        tahap: '2. Perancangan Instrumen Observasi Bengkel/Lab (Meaningful Context)',
        fokusDeepLearning: 'Meaningful',
        aktivitasKonkret: 'Siswa berkelompok 3-4 orang merancang lembar pengamatan objek observasi (alat kerja, alur pelayanan, atau sanitasi kerja) sesuai jurusan masing-masing (otomotif, jaringan, perbankan, akuntansi).'
      },
      {
        tahap: '3. Observasi Lapangan & Penyusunan Laporan (Joyful Collaboration)',
        fokusDeepLearning: 'Joyful',
        aktivitasKonkret: 'Siswa melakukan observasi nyata di bengkel TKR/TSM/Lab TJAT/TKJ atau Mini Bank sekolah, mendokumentasikan foto, menyusun teks LHO dan prosedur kerja secara ceria dan saling melengkapi.'
      },
      {
        tahap: '4. Uji Keterbacaan & Validasi Silang Antar-Kelompok (Interkoneksi)',
        fokusDeepLearning: 'Interkoneksi',
        aktivitasKonkret: 'Kelompok saling menukar draf laporan, menguji apakah prosedur yang ditulis dapat dipraktikkan oleh rekan jurusan lain, serta mengkoreksi ejaan (PUEBI/EYD V) dan keefektifan kalimat.'
      },
      {
        tahap: '5. Presentasi Laporan & Gelar Wicara Reflektif',
        fokusDeepLearning: 'Meaningful & Mindful',
        aktivitasKonkret: 'Perwakilan tim mempresentasikan laporan hasil observasi di depan kelas dengan bahasa santun, menerima tanggapan, dan merumuskan komitmen berbahasa Indonesia yang bermartabat di tempat kerja.'
      }
    ],
    integrasiSkillsPractice: {
      hardSkills: 'Teknik wawancara observasi, penulisan laporan teknis formal (EYD V), penyusunan SOP alur kerja, pengoperasian aplikasi pengolah kata/digital publishing.',
      softSkills: 'Komunikasi lisan formal, ketelitian mencatat fakta empiris, apresiasi kritik rekan kerja, objektivitas bersikap.',
      praktikNyata: 'Penyusunan Berita Acara Kerusakan Alat atau Dokumentasi SOP Resmi Bengkel/Lab SMK Muhammadiyah Bawang.',
      keselamatanKerjaK3: 'Mematuhi tata tertib observasi di zona bahaya bengkel, menggunakan safety vest/sepatu tertutup saat observasi lapangan.'
    },
    refleksi: {
      refleksiSiswa: 'Apakah saya sudah menyajikan fakta apa adanya tanpa rekayasa dalam laporan saya? Bagaimana ketepatan pilihan kata saya mempengaruhi pemahaman pembaca teknis?',
      refleksiGuru: 'Apakah siswa mampu membedakan opini subjektif dengan fakta teknis yang terukur? Bagaimana strategi mendampingi siswa yang masih canggung berbicara di depan publik?'
    },
    karakterKemuhammadiyahan: [
      'Shiddiq: Menyampaikan data faktual secara jujur tanpa manipulasi angka atau kondisi alat.',
      'Tabligh: Keterampilan menyampaikan informasi dan pesan kebaikan secara lugas, santun, dan mencerahkan.',
      'Etos Fastabiqul Khairat dalam menghasilkan karya tulis bermutu tinggi yang bermanfaat bagi sekolah.'
    ],
    tujuhKebiasaanAnakHebat: [
      { kebiasaan: '1. Bangun Pagi', implementasi: 'Membiasakan membaca artikel berita atau buku teks 15 menit setelah shalat Subuh untuk memperkaya kosakata.' },
      { kebiasaan: '2. Beribadah', implementasi: 'Memulai penyusunan tulisan dengan basmalah dan menjaga niat berbagi ilmu yang berkah.' },
      { kebiasaan: '3. Berolahraga', implementasi: 'Menjaga postur duduk yang ergonomis saat mengetik laporan agar punggung dan mata tidak tegang.' },
      { kebiasaan: '4. Gemar Belajar', implementasi: 'Aktif membuka Kamus Besar Bahasa Indonesia (KBBI) daring untuk mencari padanan istilah teknis asing.' },
      { kebiasaan: '5. Makan Sehat & Bergizi', implementasi: 'Minum air putih yang cukup untuk menjaga konsentrasi daya ingat dan kefokusan saat menganalisis teks.' },
      { kebiasaan: '6. Bermasyarakat', implementasi: 'Menggunakan bahasa santun yang tidak menyinggung perasaan teman saat memberikan saran koreksi tulisan.' },
      { kebiasaan: '7. Istirahat Cukup', implementasi: 'Mengatur waktu penulisan tugas agar tidak sistem kebut semalam demi kesehatan daya pikir.' }
    ],
    lkpd: {
      judulProyek: 'LKPD Bahasa Indonesia: Observasi dan Dokumentasi SOP Alur Kerja Bengkel / Laboratorium Vokasi',
      petunjukKerja: [
        'Kunjungi salah satu laboratorium / bengkel praktik kejuruan di SMK Muhammadiyah Bawang.',
        'Lakukan observasi cermat selama 30 menit terhadap suatu alur kerja atau pengoperasian alat utama.',
        'Wawancarai teknisi/toolman terkait kendala teknis dan prosedur keselamatan kerja.',
        'Susun teks Laporan Hasil Observasi (LHO) 3 bagian dan 1 teks Prosedur Operasional Standar (SOP) ringkas.'
      ],
      tugasProyek: 'Buatlah 1 bundel Laporan Hasil Observasi (LHO) digital dilengkapi foto dokumentasi nyata bengkel/lab sekolah, diagram alir prosedur (flowchart SOP), dan presentasikan dalam format infografis atau slide ringkas.',
      alatBahan: [
        'Lembar Panduan Observasi & Papan Ujian',
        'Kamera Smartphone untuk Dokumentasi Visual',
        'Perangkat Laptop / Komputer Lab dengan Google Docs atau WPS Office',
        'Aplikasi KBBI Daring Kemendikbudristek'
      ],
      rubrikPenilaian: 'Struktur Teks LHO (30%), Ketepatan Kaidah Bahasa & PUEBI (30%), Kedalaman Fakta Observasi Vokasi (25%), Sikap Santun & Kerjasama Tim (15%). Total Skor 100.'
    }
  },

  // 2. BAHASA INGGRIS (BERBASIS JURUSAN & 4 SKILLS: LISTENING, SPEAKING, READING, WRITING)
  {
    id: 'preset-bahasa-inggris',
    jurusan: ['Semua Jurusan', 'TKR', 'TSM', 'Akuntansi', 'Perbankan Syari\'ah', 'TJAT', 'TKJ'],
    jurusanLabel: 'Bahasa Inggris (4 Skills & Berbasis Jurusan)',
    mataPelajaran: 'Bahasa Inggris (English for Specific Purposes - Vocational)',
    faseKelas: 'Fase E (Kelas X) / Fase F (Kelas XI)',
    topikMateri: 'Vocational Technical Communication: 4 Language Skills (Listening, Speaking, Reading, Writing) for Technical Manuals & Customer Service',
    metodePembelajaran: 'Project Based Learning (PjBL) & Communicative Language Teaching (4 Skills)',
    durasiProyek: '2 Pertemuan (8 JP @ 45 Menit)',
    capaianPembelajaran: 'By the end of Phase E/F, students communicate effectively in English within vocational workplace situations. Students master 4 integrated language skills: (1) Listening to technical spoken instructions and international customer inquiries; (2) Speaking in vocational presentations, workplace roleplay, and technical explanations; (3) Reading authentic workshop repair manuals, technical datasheets, and safety signs; and (4) Writing formal work orders, technical incident logs, and business emails accurately and professionally.',
    alurTujuanPembelajaran: '1. Listening Skill: Menyimak audio instruksi teknis dari supervisor DUDI dan menangkap detail instruksi troubleshooting alat.\n2. Reading Skill: Membaca dan menganalisis authentic technical manual book, wiring diagrams, dan safety hazard warning signs dalam bahasa Inggris.\n3. Speaking Skill: Mempraktikkan percakapan profesional pelayanan pelanggan (Customer Service / Service Advisor dialogue) dan presentasi prosedur kerja teknis secara percaya diri.\n4. Writing Skill: Menyusun lembar laporan kerja kejuruan (Work Order / Technical Incident Report / Business Email Inquiry) dengan tata bahasa (simple present & imperative) yang tepat.',
    tujuanPembelajaran: [
      'Students are able to actively listen (Listening Skill) and accurately extract key points from spoken vocational instructions and customer requests (Mindful).',
      'Students are able to fluently speak (Speaking Skill) in professional dialogues, technical explanations, and service interactions using polite expressions (Joyful).',
      'Students are able to critically comprehend (Reading Skill) authentic English workshop manuals, equipment specifications, and safety signs (Meaningful).',
      'Students are able to professionally write (Writing Skill) standard work orders, technical incident summaries, and professional emails aligned with global industry standards (Interkoneksi).'
    ],
    sintaksPembelajaran: [
      {
        tahap: '1. Mindful Listening to Authentic Workplace Scenarios (Listening Focus)',
        fokusDeepLearning: 'Mindful',
        aktivitasKonkret: 'Guru memutarkan rekaman audio otentik percakapan teknisi dan pelanggan asing atau instruksi supervisor bengkel/kantor. Siswa menyimak dengan penuh konsentrasi, mencatat kata kunci teknis (technical vocabulary), dan merenungkan pentingnya bahasa Inggris sebagai sarana silaturahmi global dan dakwah berkemajuan.'
      },
      {
        tahap: '2. Meaningful Reading of Workshop Manuals & Safety Signs (Reading Focus)',
        fokusDeepLearning: 'Meaningful',
        aktivitasKonkret: 'Siswa dalam kelompok membaca dokumen manual operasional berbahasa Inggris (sesuai jurusan TKR/TSM/TKJ/TJAT/AKL/PBS). Siswa menganalisis teks prosedur, tanda bahaya (Caution/Danger/Warning), serta mengidentifikasi kalimat perintah (imperative verbs) dan kosakata teknis.'
      },
      {
        tahap: '3. Joyful Speaking & Roleplay Simulation (Speaking Focus)',
        fokusDeepLearning: 'Joyful',
        aktivitasKonkret: 'Siswa melakukan simulasi peran berpasangan secara menyenangkan: satu berperan sebagai Teknisi / Customer Service Officer, satu sebagai pelanggan internasional. Mereka mempraktikkan dialog greeting, troubleshooting explanation, dan closing dengan intonasi ramah dan percaya diri.'
      },
      {
        tahap: '4. Interconnected Technical Writing (Writing Focus)',
        fokusDeepLearning: 'Interkoneksi',
        aktivitasKonkret: 'Siswa menuliskan laporan kerja resmi (Work Order / Repair Summary / Customer Service Log) berbahasa Inggris berdasarkan hasil simulasi tadi, menghubungkan data teknis kejuruan dengan format standar industri internasional.'
      },
      {
        tahap: '5. Reflective Showcase & Peer Feedback',
        fokusDeepLearning: 'Meaningful & Mindful',
        aktivitasKonkret: 'Masing-masing kelompok menampilkan mini roleplay 2 menit di depan kelas, menerima umpan balik positif dari guru dan rekan, serta mencatat kosakata baru ke dalam Vocational English Vocabulary Journal.'
      }
    ],
    integrasiSkillsPractice: {
      hardSkills: '4 Core Skills (Listening comprehension, Speaking fluency, Technical reading skimming/scanning, Formal work order writing), Technical Glossary Mastery (automotive/networking/banking terms), Grammar in context (Imperatives & Passive voice).',
      softSkills: 'Active listening empathy, cross-cultural communication confidence, polite greetings (courtesy phrases), teamwork.',
      praktikNyata: 'Simulasi Front-Desk International Customer Service dan penerjemahan Technical Service Bulletin di bengkel/lab SMK Muhammadiyah Bawang.',
      keselamatanKerjaK3: 'Membaca dan menaati simbol K3 internasional (Safety hazard symbols: flammable, high voltage, eye protection required).'
    },
    refleksi: {
      refleksiSiswa: 'How confident do I feel when speaking English in front of others? Which of the 4 skills (Listening, Speaking, Reading, Writing) do I need to practice more to be ready for global industry standards?',
      refleksiGuru: 'Did the 4-skill integration engage both visual and auditory learners? How effectively did the vocational context lower students\' anxiety in practicing spoken English?'
    },
    karakterKemuhammadiyahan: [
      'Wawasan Berkemajuan & Global: Menjadikan penguasaan bahasa internasional sebagai jalan menebar kemanfaatan Islam ke seluruh penjuru dunia (rahmatan lil alamin).',
      'Sopan Santun Islami: Menerapkan adab berbicara lemah lembut (qaulan layyina) dan menghormati lawan bicara dalam setiap percakapan profesional.',
      'Fastabiqul Khairat: Semangat meningkatkan kompetensi diri bersaing di kancah industri nasional dan global.'
    ],
    tujuhKebiasaanAnakHebat: [
      { kebiasaan: '1. Bangun Pagi', implementasi: 'Mendengarkan podcast pendek berbahasa Inggris (BBC Learning English) 10 menit setelah shalat Subuh.' },
      { kebiasaan: '2. Beribadah', implementasi: 'Berdoa memohon kemudahan lisan dan ketajaman pemahaman sebelum memulai pelajaran bahasa asing.' },
      { kebiasaan: '3. Berolahraga', implementasi: 'Melakukan senam artikulasi wajah dan latihan pernapasan diafragma sebelum latihan speaking.' },
      { kebiasaan: '4. Gemar Belajar', implementasi: 'Menuliskan 5 kosakata teknis bahasa Inggris baru setiap hari di buku catatan saku.' },
      { kebiasaan: '5. Makan Sehat & Bergizi', implementasi: 'Menjaga kesehatan pita suara dan tenggorokan dengan rutin meminum air hangat.' },
      { kebiasaan: '6. Bermasyarakat', implementasi: 'Membantu teman yang merasa malu atau terbata-bata dalam berbicara tanpa menertawakan kesalahan.' },
      { kebiasaan: '7. Istirahat Cukup', implementasi: 'Memberikan jeda istirahat yang cukup untuk memproses ingatan kosakata baru ke dalam memori jangka panjang.' }
    ],
    lkpd: {
      judulProyek: 'LKPD Vocational English: Integrated 4 Language Skills (Listening, Speaking, Reading, Writing) Project',
      petunjukKerja: [
        'Station 1 (Listening): Dengarkan audio panduan teknis melalui barcode yang disediakan, jawab 5 pertanyaan pemahaman fakta.',
        'Station 2 (Reading): Baca lembar manual teknis otentik (Authentic Manual Sheet), tandai kata kerja imperatif dan instruksi K3.',
        'Station 3 (Speaking): Lakukan roleplay percakapan teknisi & pelanggan berbahasa Inggris selama 3 menit bersama pasangan kelompok.',
        'Station 4 (Writing): Tulis lembar Work Order resmi berbahasa Inggris merangkum hasil perbaikan/layanan yang diselesaikan.'
      ],
      tugasProyek: 'Ciptakan rekaman video simulasi dialog pelayanan teknis bahasa Inggris (Speaking & Listening) berdurasi 3 menit, disertai lembar dokumen Work Order resmi berbahasa Inggris yang ditulis dengan rapi (Reading & Writing).',
      alatBahan: [
        'Audio Track & Headphone untuk Listening Station',
        'Buku Manual Servis Berbahasa Inggris (Honda/Toyota/MikroTik/Financial Accounting Manuals)',
        'Smartphone untuk Perekaman Video Roleplay Dialog',
        'Format Blanko Work Order & Technical Vocabulary Glossary'
      ],
      rubrikPenilaian: 'Listening Comprehension (20%), Speaking Fluency & Pronunciation (30%), Reading Accuracy & Manual Interpretation (25%), Writing Mechanics & Grammar (25%). Total Skor 100.'
    }
  },

  // 3. MATEMATIKA
  {
    id: 'preset-matematika',
    jurusan: ['Semua Jurusan'],
    jurusanLabel: 'Matematika Terapan Vokasi (Lintas Jurusan)',
    mataPelajaran: 'Matematika Terapan Vokasi',
    faseKelas: 'Fase E (Kelas X) / Fase F (Kelas XI)',
    topikMateri: 'Statistika Pengendalian Mutu Produksi, Perhitungan Biaya Proyek (HPP), dan Geometri Presisi',
    metodePembelajaran: 'Project Based Learning (PjBL) Analisis Data Terapan',
    durasiProyek: '2 Pertemuan (8 JP @ 45 Menit)',
    capaianPembelajaran: 'Pada akhir fase, peserta didik mampu memodelkan dan menyelesaikan masalah nyata di dunia kerja kejuruan dengan menggunakan konsep matematika: menganalisis data empiris produksi menggunakan ukuran pemusatan dan penyebaran (mean, median, standar deviasi), menginterpretasikan diagram kendali mutu (quality control chart), serta menghitung estimasi kebutuhan bahan dan efisiensi biaya secara presisi.',
    alurTujuanPembelajaran: '1. Mengumpulkan data empiris hasil pengukuran komponen bengkel (ketebalan, celah katup, redaman serat optik, atau transaksi kas).\n2. Menghitung ukuran pemusatan (mean, median, modus) dan penyebaran (jangkauan, varians, standar deviasi) secara manual dan spreadsheet.\n3. Membuat diagram kendali (Control Chart) untuk menentukan batas toleransi kelayakan produk standar industri.\n4. Merumuskan rekomendasi optimasi biaya bahan baku dan pencegahan pemborosan produksi berbasis bukti matematis.',
    tujuanPembelajaran: [
      'Peserta didik mampu mengumpulkan data numerik riil dan mengidentifikasi variabel pengukuran dengan penuh ketelitian (Mindful).',
      'Peserta didik mampu mengolah data statistika deskriptif dan batas toleransi mutu menggunakan formula matematika yang tepat (Meaningful).',
      'Peserta didik mampu menyajikan visualisasi data grafik dan diagram secara kolaboratif menggunakan aplikasi digital (Joyful).',
      'Peserta didik mampu menghubungkan kebenaran kalkulasi matematis dengan integritas moral timbangan yang adil dalam pandangan Islam (Interkoneksi).'
    ],
    sintaksPembelajaran: [
      {
        tahap: '1. Pemantik Masalah: Kerugian Akibat Deviasi Ukuran (Mindful)',
        fokusDeepLearning: 'Mindful',
        aktivitasKonkret: 'Guru menyajikan kasus riil komponen mesin yang macet atau pembengkakan anggaran proyek akibat salah perhitungan 1%. Siswa diajak merenungkan perintah Al-Qur\'an untuk menegakkan timbangan dengan adil (QS. Ar-Rahman: 9).'
      },
      {
        tahap: '2. Pengumpulan Data Pengukuran Lapangan (Meaningful)',
        fokusDeepLearning: 'Meaningful',
        aktivitasKonkret: 'Siswa mengambil 30 sampel data empiris (misal celah busi kendaraan, pengukuran redaman kabel optik dBm, atau fluktuasi setoran kas harian).'
      },
      {
        tahap: '3. Analisis Statistika Komputasi (Joyful)',
        fokusDeepLearning: 'Joyful',
        aktivitasKonkret: 'Siswa bekerja dalam kelompok menghitung nilai rata-rata, simpangan baku, dan menggambar grafik histogram distribusi frekuensi di spreadsheet dengan antusiasme saling menguji rumus.'
      },
      {
        tahap: '4. Penetapan Batas Toleransi Mutu & Evaluasi Biaya (Interkoneksi)',
        fokusDeepLearning: 'Interkoneksi',
        aktivitasKonkret: 'Menentukan sampel mana yang berada di luar batas toleransi spesifikasi pabrikan (Upper/Lower Control Limit), serta menghitung persentase scrap/reject dan dampaknya terhadap biaya finansial.'
      },
      {
        tahap: '5. Presentasi Solusi Matematis & Komitmen Presisi',
        fokusDeepLearning: 'Meaningful & Mindful',
        aktivitasKonkret: 'Kelompok mempresentasikan dashboard analisis data mereka, merumuskan rekomendasi teknis perbaikan, dan menyimpulkan nilai etos ketelitian bekerja.'
      }
    ],
    integrasiSkillsPractice: {
      hardSkills: 'Perhitungan statistika deskriptif (Mean, Median, Standar Deviasi), aplikasi formula spreadsheet (Excel/Google Sheets), pembuatan grafik kendali kualitas (QC Chart), kalkulasi toleransi geometri.',
      softSkills: 'Ketelitian angka, kejujuran input data mentah, analisis logis rasional, kerja tim pembagian beban hitung.',
      praktikNyata: 'Quality Control (QC) inspeksi suku cadang bengkel atau audit selisih kas pembukuan mini bank SMK Muhammadiyah Bawang.',
      keselamatanKerjaK3: 'Pengukuran aman saat mengambil data alat berputar atau bertegangan listrik.'
    },
    refleksi: {
      refleksiSiswa: 'Apakah saya sudah teliti memeriksa setiap angka desimal? Mengapa presisi matematis sangat menentukan reputasi dan keselamatan di industri nyata?',
      refleksiGuru: 'Bagaimana membuat konsep statistika terasa konkret dan tidak menakutkan bagi siswa? Apakah penggunaan konteks alat bengkel nyata berhasil memotivasi siswa?'
    },
    karakterKemuhammadiyahan: [
      'Integritas Timbangan: Meneladani ajaran Islam dalam menyempurnakan takaran dan timbangan tanpa kecurangan.',
      'Etos Keilmuan: Mengembangkan nalar ilmiah dan rasionalitas matematika sebagai amanah akal pikiran karunia Allah SWT.',
      'Tertib Administrasi: Membiasakan kerapian pencatatan data dan ketertiban sistematis (tanzhim).'
    ],
    tujuhKebiasaanAnakHebat: [
      { kebiasaan: '1. Bangun Pagi', implementasi: 'Melatih konsentrasi otak dengan latihan berhitung cepat 5 menit setelah sarapan pagi.' },
      { kebiasaan: '2. Beribadah', implementasi: 'Memahami bahwa matematika mengajarkan kepastian dan keteraturan alam ciptaan Allah (Sunnatullah).' },
      { kebiasaan: '3. Berolahraga', implementasi: 'Melakukan peregangan jemari tangan dan mata setelah menatap layar kalkulasi angka.' },
      { kebiasaan: '4. Gemar Belajar', implementasi: 'Mencari cara alternatif paling efisien dalam memecahkan soal aljabar dan statistika.' },
      { kebiasaan: '5. Makan Sehat & Bergizi', implementasi: 'Makan sarapan bergizi untuk menyuplai glukosa bagi metabolisme sel-sel otak saat berpikir logis.' },
      { kebiasaan: '6. Bermasyarakat', implementasi: 'Membantu rekan sekelompok yang mengalami kendala memahami rumus dengan sabar.' },
      { kebiasaan: '7. Istirahat Cukup', implementasi: 'Tidur cukup 7 jam agar pikiran tetap jernih dan terhindar dari kekeliruan perhitungan (human error).' }
    ],
    lkpd: {
      judulProyek: 'LKPD Matematika Terapan: Analisis Data Statistika Pengendalian Mutu & Toleransi Produksi Vokasi',
      petunjukKerja: [
        'Kumpulkan 20-30 data ukuran fisik komponen atau nominal data transaksi sesuai instruksi guru.',
        'Input data ke tabel pengamatan, hitung nilai Mean (Rata-rata), Simpangan Baku (SD), dan Rentang.',
        'Plot data ke grafik garis dan tentukan garis batas kontrol atas (UCL) dan batas bawah (LCL).',
        'Analisis berapa persen produk yang memenuhi standar industri dan buat kesimpulan tertulis.'
      ],
      tugasProyek: 'Susun laporan infografis satu halaman berjudul "Analisis Matematis Pengendalian Mutu Komponen Kejuruan", lengkapi dengan grafik sebaran data dan estimasi kerugian jika toleransi diabaikan.',
      alatBahan: [
        'Alat Ukur Presisi (Jangka Sorong / Multimeter / Alat Ukur Redaman)',
        'Lembar Kerja Pengamatan Angka Mentah',
        'Laptop / Komputer dengan Program Microsoft Excel / Google Sheets',
        'Kalkulator Saintifik'
      ],
      rubrikPenilaian: 'Ketelitian Pengambilan Data (25%), Ketepatan Rumus Statistika (35%), Kualitas Visualisasi Grafik Kendali (25%), Rekomendasi Solutif (15%). Total 100.'
    }
  },

  // 4. SEJARAH INDONESIA
  {
    id: 'preset-sejarah',
    jurusan: ['Semua Jurusan'],
    jurusanLabel: 'Sejarah Indonesia (Lintas Jurusan)',
    mataPelajaran: 'Sejarah Indonesia',
    faseKelas: 'Fase E (Kelas X)',
    topikMateri: 'Dinamika Revolusi Industri di Indonesia, Jalur Sejarah Industri Batang, dan Pelopor Pendidikan Vokasi K.H. Ahmad Dahlan',
    metodePembelajaran: 'Project Based Learning (PjBL) Riset Historis & Pembuatan Timeline Digital',
    durasiProyek: '2 Pertemuan (8 JP @ 45 Menit)',
    capaianPembelajaran: 'Pada akhir fase, peserta didik mampu memahami konsep dasar ilmu sejarah dan menghubungkan peristiwa masa lampau dengan kondisi kekinian: menganalisis dampak Revolusi Industri sejak masa kolonial di Nusantara, menelusuri sejarah kebangkitan ekonomi dan industri lokal Kabupaten Batang, serta meneladani peran transformatif K.H. Ahmad Dahlan dalam mendirikan sekolah modern dan melatih kemandirian vokasi bagi pribumi.',
    alurTujuanPembelajaran: '1. Menganalisis gelombang Revolusi Industri 1.0 hingga 4.0 dan dampaknya terhadap perubahan struktur sosial-ekonomi di Indonesia.\n2. Menggali bukti-bukti sejarah perkembangan transportasi dan pabrik industri di pesisir Batang (Jawa Tengah).\n3. Menelaah pemikiran berkemajuan K.H. Ahmad Dahlan dalam membebaskan umat dari keterbelakangan melalui pendidikan keterampilan nyata (vokasi awal).\n4. Menyajikan narasi sejarah inspiratif tentang peran generasi muda vokasi Muhammadiyah dalam mengisi kemandirian industri bangsa.',
    tujuanPembelajaran: [
      'Peserta didik mampu menelaah kausalitas sejarah transformasi industri dan dampaknya terhadap masyarakat secara kritis (Mindful).',
      'Peserta didik mampu mengidentifikasi jejak sejarah kejuruan dan etos kemandirian KH. Ahmad Dahlan secara kontekstual (Meaningful).',
      'Peserta didik mampu menyusun narasi sejarah visual atau linimasa digital secara kreatif dan menggembirakan bersama tim (Joyful).',
      'Peserta didik mampu menghubungkan semangat perjuangan masa lalu dengan kesiapan menghadapi persaingan Kawasan Industri Batang masa kini (Interkoneksi).'
    ],
    sintaksPembelajaran: [
      {
        tahap: '1. Stimulus: Foto Kuno Pabrik Batang vs Kawasan Industri Terpadu Modern (Mindful)',
        fokusDeepLearning: 'Mindful',
        aktivitasKonkret: 'Guru menampilkan arsip foto tempo dulu jalur kereta api dan perkebunan teh/karet Bawang serta peta Kawasan Industri Terpadu Batang (KITB) hari ini. Siswa diajak merenungkan peran generasi muda sebagai pelaku sejarah baru.'
      },
      {
        tahap: '2. Eksplorasi Arsip & Wawancara Tokoh Sejarah (Meaningful)',
        fokusDeepLearning: 'Meaningful',
        aktivitasKonkret: 'Siswa berkelompok membedah dokumen sejarah, artikel digital, serta biografi KH Ahmad Dahlan yang memelopori integrasi ilmu agama dan keahlian profesi (intelektual ulama yang terampil).'
      },
      {
        tahap: '3. Pembuatan Linimasa Sejarah Digital (Joyful)',
        fokusDeepLearning: 'Joyful',
        aktivitasKonkret: 'Siswa merancang infografis linimasa interaktif (Canva/Padlet) yang merangkum tonggak sejarah industri nasional dan gerakan pencerahan Muhammadiyah secara kreatif dan riang.'
      },
      {
        tahap: '4. Diskusi Kontekstual & Relevansi Masa Depan (Interkoneksi)',
        fokusDeepLearning: 'Interkoneksi',
        aktivitasKonkret: 'Menghubungkan nilai perjuangan masa penjajahan dengan tantangan masa depan: bagaimana siswa SMK Muhammadiyah Bawang menjadi tuan di negeri sendiri menghadapi industri modern.'
      },
      {
        tahap: '5. Refleksi Ibrah Sejarah & Komitmen Kebangsaan',
        fokusDeepLearning: 'Meaningful & Mindful',
        aktivitasKonkret: 'Setiap siswa menuliskan satu komitmen pribadi tentang kontribusi nyata yang ingin dipersembahkan bagi Indonesia melalui keahlian kejuruan yang sedang dipelajari.'
      }
    ],
    integrasiSkillsPractice: {
      hardSkills: 'Metodologi penelitian sejarah ringkas (heuristik, verifikasi, interpretasi, historiografi), pembuatan media presentasi multimedia digital, analisis sumber arsip otentik.',
      softSkills: 'Kesadaran historis (historical empathy), rasa nasionalisme, penghargaan terhadap jasa pahlawan, kemampuan bernalar kritis.',
      praktikNyata: 'Pameran Mini "Sejarah Industri & Pergerakan Vokasi Batang" di perpustakaan atau aula sekolah SMK Muhammadiyah Bawang.',
      keselamatanKerjaK3: 'Etika menjaga keutuhan dokumen arsip dan kelestarian peninggalan bersejarah cagar budaya.'
    },
    refleksi: {
      refleksiSiswa: 'Pelajaran berharga apa yang saya dapatkan dari kegigihan KH Ahmad Dahlan dalam mendirikan sekolah di tengah keterbatasan? Apa makna kemerdekaan sejati bagi seorang siswa SMK hari ini?',
      refleksiGuru: 'Apakah pembelajaran sejarah berhasil memantik rasa bangga siswa terhadap tanah airnya dan memotivasi mereka untuk giat belajar di bengkel/lab?'
    },
    karakterKemuhammadiyahan: [
      'Etos Pembaharu (Tajdid): Meneladani keberanian KH Ahmad Dahlan dalam mendobrak kejumudan berpikir dan menghadirkan solusi nyata bagi bangsa.',
      'Cinta Tanah Air & Bangsa: Menyadari bahwa Muhammadiyah berjuang melahirkan kemerdekaan RI dan berkewajiban merawatnya dengan karya nyata.',
      'Fastabiqul Khairat: Semangat berlomba mencetak prestasi demi mengharumkan nama persyarikatan dan Republik Indonesia.'
    ],
    tujuhKebiasaanAnakHebat: [
      { kebiasaan: '1. Bangun Pagi', implementasi: 'Menghargai waktu dan disiplin pagi hari sebagaimana teladan para pejuang kemerdekaan bangsa.' },
      { kebiasaan: '2. Beribadah', implementasi: 'Mendoakan para pahlawan kusuma bangsa dan tokoh pendiri Muhammadiyah dalam setiap doa.' },
      { kebiasaan: '3. Berolahraga', implementasi: 'Meneladani fisik bugar dan daya tahan para pendahulu bangsa dengan menjaga kebugaran jasmani.' },
      { kebiasaan: '4. Gemar Belajar', implementasi: 'Gemar membaca biografi tokoh-tokoh besar bangsa untuk memetik hikmah kehidupan.' },
      { kebiasaan: '5. Makan Sehat & Bergizi', implementasi: 'Menghargai kedaulatan pangan lokal nusantara dengan mengonsumsi hasil bumi petani negeri sendiri.' },
      { kebiasaan: '6. Bermasyarakat', implementasi: 'Mempelajari kearifan lokal masyarakat Batang dan menjaga kerukunan antar elemen bangsa.' },
      { kebiasaan: '7. Istirahat Cukup', implementasi: 'Menghargai kesehatan raga agar siap melanjutkan estafet pembangunan bangsa di masa depan.' }
    ],
    lkpd: {
      judulProyek: 'LKPD Sejarah: Linimasa Perkembangan Industri Batang & Semangat Berkemajuan K.H. Ahmad Dahlan',
      petunjukKerja: [
        'Kaji artikel sejarah tentang masuknya mekanisasi industri di tanah Jawa dan sejarah berdirinya Muhammadiyah tahun 1912.',
        'Telusuri jejak industri di Kabupaten Batang (pabrik gula, perkebunan, rel kereta api, hingga Kawasan Industri Terpadu Batang).',
        'Buatlah garis waktu (timeline) berisi minimal 6 peristiwa penting disertai gambar dan narasi penjelasan ringkas.',
        'Tuliskan satu paragraf sintesis: "Bagaimana Semangat KH Ahmad Dahlan Menjadi Modal Menghadapi Industri 4.0".'
      ],
      tugasProyek: 'Ciptakan karya infografis linimasa sejarah ukuran A3 atau slide presentasi interaktif Canva bertema "Dari Bawang untuk Peradaban Bangsa: Sejarah Vokasi dan Spirit Berkemajuan Muhammadiyah".',
      alatBahan: [
        'Kutipan Sumber Buku Sejarah Indonesia & Sejarah Muhammadiyah',
        'Akses Internet untuk Penelusuran Sumber Arsip Digital Balai Pelestarian Kebudayaan',
        'Aplikasi Desain Canva / PowerPoint / Kertas Plano dan Spidol Warna'
      ],
      rubrikPenilaian: 'Akurasi Fakta Sejarah (30%), Kualitas Analisis Kausalitas (30%), Kreativitas Visualisasi Linimasa (25%), Refleksi Nilai Kejuangan (15%). Total 100.'
    }
  },

  // 5. PAI (PENDIDIKAN AGAMA ISLAM & BUDI PEKERTI)
  {
    id: 'preset-pai',
    jurusan: ['Semua Jurusan'],
    jurusanLabel: 'Pendidikan Agama Islam (PAI & Budi Pekerti)',
    mataPelajaran: 'Pendidikan Agama Islam dan Budi Pekerti',
    faseKelas: 'Fase E (Kelas X) / Fase F (Kelas XI)',
    topikMateri: 'Etos Kerja Islami, Fiqih Muamalah Kontemporer, Nilai Kejujuran Transaksi, dan Tanggung Jawab Sosial',
    metodePembelajaran: 'Project Based Learning (PjBL) Kajian Kontekstual & Studi Kasus Muamalah',
    durasiProyek: '2 Pertemuan (6 JP @ 45 Menit)',
    capaianPembelajaran: 'Pada akhir fase, peserta didik mampu meyakini bahwa bekerja dan berikhtiar secara profesional adalah manifestasi ibadah kepada Allah SWT; menganalisis dalil naqli dan prinsip fiqih muamalah tentang transaksi yang sah, halal, terhindar dari riba, gharar, dan maisir; serta membiasakan akhlak mulia (amanah, shiddiq, adil) dalam kehidupan sehari-hari dan dunia industri.',
    alurTujuanPembelajaran: '1. Mengkaji dalil Al-Qur\'an (QS. At-Taubah: 105, QS. Al-Jumu\'ah: 10) dan hadits tentang kewajiban bekerja keras mencari rezeki halal.\n2. Menganalisis macam-macam akad muamalah (murabahah, mudharabah, ijarah) dan membedakannya dari praktik riba serta penipuan.\n3. Mengidentifikasi dilema etika di dunia kerja bengkel/kantor (kejujuran suku cadang, ketepatan waktu kerja, anti-korupsi).\n4. Merancang pedoman kode etik perilaku kerja Islami (Islamic Workplace Code of Ethics) dan mempraktikkannya dalam simulasi interaksi kerja.',
    tujuanPembelajaran: [
      'Peserta didik mampu menghayati nilai transendental bahwa setiap keringat dan ketekunan belajar di sekolah adalah bernilai ibadah di sisi Allah (Mindful).',
      'Peserta didik mampu membedah hukum fiqih muamalah dan akad-akad syariah modern secara kontekstual dengan dunia kerja (Meaningful).',
      'Peserta didik mampu mendemonstrasikan simulasi transaksi jual beli dan pelayanan jasa yang bersih dari kecurangan secara kolaboratif (Joyful).',
      'Peserta didik mampu mengintegrasikan integritas syariat Islam ke dalam budaya mutu kerja industri berstandar tinggi (Interkoneksi).'
    ],
    sintaksPembelajaran: [
      {
        tahap: '1. Tadabbur Ayat Etos Kerja & Perenungan Hening (Mindful)',
        fokusDeepLearning: 'Mindful',
        aktivitasKonkret: 'Membaca bersama QS. At-Taubah: 105 dengan tartil. Siswa diajak hening merenungkan bahwa Allah, Rasul-Nya, dan orang-orang beriman akan melihat hasil pekerjaan mereka. Menanamkan niat suci bekerja mencari nafkah halal demi ridha Allah.'
      },
      {
        tahap: '2. Eksplorasi Kasus Muamalah & Dilema Kejujuran (Meaningful)',
        fokusDeepLearning: 'Meaningful',
        aktivitasKonkret: 'Siswa membedah kasus nyata: montir yang mengganti onderdil palsu tapi menagih harga asli, atau teller bank yang tergoda memanipulasi buku tabungan. Siswa menganalisis konsekuensi akhirat dan sanksi duniawinya.'
      },
      {
        tahap: '3. Simulasi Praktik Akad Muamalah Syariah (Joyful)',
        fokusDeepLearning: 'Joyful',
        aktivitasKonkret: 'Siswa mempraktikkan simulasi transaksi jual beli barang/jasa yang berkah dengan ijab qabul jelas, transparan mengenai kondisi cacat barang (khiyar), dan saling mendoakan keberkahan dengan wajah berseri-seri.'
      },
      {
        tahap: '4. Penyusunan Piagam Etika Kerja Muslim (Interkoneksi)',
        fokusDeepLearning: 'Interkoneksi',
        aktivitasKonkret: 'Menghubungkan syariat Islam dengan SOP kerja modern: bagaimana shalat tepat waktu justru mendisiplinkan jam kerja, dan bagaimana zakat/infaq menyucikan rezeki hasil kerja.'
      },
      {
        tahap: '5. Refleksi Diri & Doa Bersama untuk Keberkahan Rezeki',
        fokusDeepLearning: 'Meaningful & Mindful',
        aktivitasKonkret: 'Siswa menuliskan muhasabah diri tentang kebiasaan shalat dan kejujurannya, dilanjutkan doa bersama memohon agar dijauhkan dari rezeki haram dan sifat malas.'
      }
    ],
    integrasiSkillsPractice: {
      hardSkills: 'Kajian dalil Al-Qur\'an & Hadits tematik muamalah, pemahaman skema akad fiqih (Murabahah, Ijarah, Mudharabah), perumusan kode etik kerja Islami.',
      softSkills: 'Amanah (dapat dipercaya), shiddiq (jujur), qana\'ah, empati sosial kepada dhuafa, adab berbicara sopan santun.',
      praktikNyata: 'Penyusunan Standar Etika Pelayanan Islami untuk Bengkel Motor & Mini Bank SMK Muhammadiyah Bawang.',
      keselamatanKerjaK3: 'Menjaga keselamatan diri dan rekan kerja sebagai bentuk menjaga titipan nyawa dari Sang Pencipta (Hifdzun Nafs).'
    },
    refleksi: {
      refleksiSiswa: 'Apakah saya selalu mengingat Allah saat sedang bekerja di bengkel/lab? Apakah saya berani menolak jika diajak berbuat curang atau malas-malasan oleh rekan kerja?',
      refleksiGuru: 'Bagaimana membimbing siswa agar agama tidak sekadar menjadi hafalan teori ujian, melainkan mendarah daging menjadi karakter moral saat memegang perkakas atau uang?'
    },
    karakterKemuhammadiyahan: [
      'Memurnikan Tauhid dan menjauhi segala bentuk kemusyrikan dalam mencari rezeki.',
      'Menjadikan tempat kerja sebagai ladang dakwah bil hal (dakwah melalui keteladanan akhlak mulia).',
      'Filantropi Al-Ma\'un: Membiasakan gemar bersedekah dan membantu rekan yang sedang tertimpa kesulitan ekonomi.'
    ],
    tujuhKebiasaanAnakHebat: [
      { kebiasaan: '1. Bangun Pagi', implementasi: 'Melaksanakan shalat Subuh berjamaah dan bersiap mencari rezeki ilmu di pagi hari penuh berkah.' },
      { kebiasaan: '2. Beribadah', implementasi: 'Menjaga shalat fardhu lima waktu tepat waktu dan istiqomah shalat Dhuha sebelum jam praktik.' },
      { kebiasaan: '3. Berolahraga', implementasi: 'Menjaga fisik yang kuat karena mukmin yang kuat lebih dicintai Allah daripada mukmin yang lemah.' },
      { kebiasaan: '4. Gemar Belajar', implementasi: 'Mempelajari hukum-hukum fiqih muamalah kontemporer agar terhindar dari perkara syubhat.' },
      { kebiasaan: '5. Makan Sehat & Bergizi', implementasi: 'Hanya memakan makanan yang halal dan thayyib (baik gizinya) untuk menjaga kesucian hati.' },
      { kebiasaan: '6. Bermasyarakat', implementasi: 'Tebar salam, senyum, dan santun kepada guru, satpam, teman, dan warga sekitar madrasah.' },
      { kebiasaan: '7. Istirahat Cukup', implementasi: 'Tidur dengan adab Rasulullah SAW agar bangun segar beribadah dan giat berkarya.' }
    ],
    lkpd: {
      judulProyek: 'LKPD PAI: Studi Kasus Fiqih Muamalah & Panduan Etika Profesi Teknisi / Pekerja Muslim',
      petunjukKerja: [
        'Diskusikan bersama kelompok mengenai salah satu fenomena transaksi muamalah di era modern (COD, paylater, pinjol, servis kendaraan, atau timbangan dagang).',
        'Analisis hukum syariah berdasarkan ayat Al-Qur\'an dan Hadits yang relevan.',
        'Identifikasi titik kritis potensi terjadinya riba, gharar, atau penipuan hak konsumen.',
        'Rumuskan 7 Butir Pedoman Perilaku Kerja Islami (Islamic Workplace Ethics) yang konkret.'
      ],
      tugasProyek: 'Susun poster infografis edukasi ukuran A3 atau buku saku digital bertema: "Etika Muamalah & Profesionalisme Kerja Teknisi Muslim: Berkah di Dunia, Mulia di Akhirat".',
      alatBahan: [
        'Mushaf Al-Qur\'an Terjemah & Kitab Hadits Bulughul Maram / Fiqih Muamalah',
        'Lembar Analisis Studi Kasus Transaksi',
        'Komputer / Gadget dengan Aplikasi Desain Grafis Canva'
      ],
      rubrikPenilaian: 'Kedalaman Dalil & Analisis Syariah (35%), Relevansi Solusi dengan Dunia Kerja Vokasi (30%), Kreativitas Desain Poster/Buku Saku (20%), Sikap & Adab Diskusi (15%). Total 100.'
    }
  },

  // 6. KEMUHAMMADIYAHAN
  {
    id: 'preset-kemuhammadiyahan',
    jurusan: ['Semua Jurusan'],
    jurusanLabel: 'Kemuhammadiyahan (Lintas Jurusan)',
    mataPelajaran: 'Kemuhammadiyahan (Muatan Lokal Pendidikan Muhammadiyah)',
    faseKelas: 'Fase E (Kelas X) / Fase F (Kelas XI)',
    topikMateri: 'Matan Keyakinan dan Cita-Cita Hidup Muhammadiyah (MKCH), Kepribadian Kader, dan Teologi Al-Ma\'un dalam AUM',
    metodePembelajaran: 'Project Based Learning (PjBL) Aksi Sosial & Penguatan Ideologi Berkemajuan',
    durasiProyek: '2 Pertemuan (6 JP @ 45 Menit)',
    capaianPembelajaran: 'Pada akhir fase, peserta didik mampu memahami, menghayati, dan mengimplementasikan ideologi persyarikatan Muhammadiyah yang bersumber pada Al-Qur\'an dan Sunnah shahihah: menguasai rumusan pokok MKCH, meneladani kepribadian Muhammadiyah, memahami eksistensi Amal Usaha Muhammadiyah (AUM) sebagai wujud dakwah bil hal teologi Al-Ma\'un, serta menunjukkan identitas kader pelajar yang tangguh, cerdas, berakhlak mulia, dan siap memajukan umat dan bangsa.',
    alurTujuanPembelajaran: '1. Membedah butir-butir pokok pikiran Matan Keyakinan dan Cita-Cita Hidup Muhammadiyah (MKCH) dan kepribadian Muhammadiyah.\n2. Menelusuri sejarah perjuangan dakwah kultural Muhammadiyah di wilayah Bawang Batang dan jaringan Amal Usaha Muhammadiyah (AUM).\n3. Mengkaji implementasi teologi Al-Ma\'un KH Ahmad Dahlan dalam mengatasi kemiskinan dan kebodohan melalui keahlian vokasi.\n4. Merancang proyek pengabdian masyarakat (social project) berbasis kejuruan yang membawa kemaslahatan nyata bagi warga sekitar ranting sekolah.',
    tujuanPembelajaran: [
      'Peserta didik mampu menghayati hakikat hidup bermuhammadiyah sebagai sarana pengabdian murni untuk kejayaan Islam (Mindful).',
      'Peserta didik mampu menganalisis butir-butir MKCH dan mengaitkannya dengan tantangan generasi muda Islam di era digital (Meaningful).',
      'Peserta didik mampu merancang aksi kepedulian sosial berbasis keahlian kejuruan secara antusias dan menggembirakan (Joyful).',
      'Peserta didik mampu mengintegrasikan nilai Fastabiqul Khairat dan etos berkemajuan ke dalam keterampilan kerja industri yang profesional (Interkoneksi).'
    ],
    sintaksPembelajaran: [
      {
        tahap: '1. Refleksi Spirit Dahlan & Pemutaran Mars Sang Surya (Mindful)',
        fokusDeepLearning: 'Mindful',
        aktivitasKonkret: 'Siswa menyanyikan lagu Sang Surya dengan penuh khidmat. Guru mengulas kilas balik KH Ahmad Dahlan mengajarkan surat Al-Ma\'un berbulan-bulan hingga para santrinya benar-benar turun ke jalan menyantuni anak yatim dan fakir miskin.'
      },
      {
        tahap: '2. Kajian Tematik MKCH & Diskusi Kelompok Kader (Meaningful)',
        fokusDeepLearning: 'Meaningful',
        aktivitasKonkret: 'Siswa berkelompok mengkaji rumusan MKCH: aqidah, ibadah, akhlak, dan muamalah duniawiyah. Siswa mendiskusikan bagaimana seorang calon mekanik, administrator, atau teknisi jaringan menerapkan MKCH saat bekerja di dunia industri.'
      },
      {
        tahap: '3. Perancangan Aksi Bakti Vokasi Berkemajuan (Joyful)',
        fokusDeepLearning: 'Joyful',
        aktivitasKonkret: 'Siswa secara kolaboratif merancang program nyata: misalnya servis motor dhuafa gratis, pelatihan dasar internet aman untuk anak madrasah, atau pembukuan keuangan gratis bagi pedagang kecil sekitar sekolah.'
      },
      {
        tahap: '4. Pelaksanaan Aksi & Kemitraan Ranting/AUM (Interkoneksi)',
        fokusDeepLearning: 'Interkoneksi',
        aktivitasKonkret: 'Menghubungkan keahlian teknik di sekolah dengan kebutuhan riil masyarakat dan bekerjasama dengan Pimpinan Cabang Muhammadiyah (PCM) Bawang atau LazisMu.'
      },
      {
        tahap: '5. Evaluasi Kematangan Ideologi & Ikrar Kader Pelajar',
        fokusDeepLearning: 'Meaningful & Mindful',
        aktivitasKonkret: 'Setiap kelompok menyajikan laporan aksi sosial, mengevaluasi makna keikhlasan beramal, dan mengucapkan ikrar kader Ikatan Pelajar Muhammadiyah (IPM) berkemajuan.'
      }
    ],
    integrasiSkillsPractice: {
      hardSkills: 'Pemahaman teks ideologi resmi Muhammadiyah (MKCH, Pedoman Hidup Islami Warga Muhammadiyah / PHIWM), manajemen program aksi sosial, komunikasi publik keumatan.',
      softSkills: 'Ikhlas beramal tanpa pamrih pujian, jiwa kepemimpinan (leadership), kepekaan filantropi, solidaritas ukhuwah Islamiyah.',
      praktikNyata: 'Program "Bakti Vokasi Muhammadiyah untuk Umat" di lingkungan Cabang & Ranting Muhammadiyah Bawang Batang.',
      keselamatanKerjaK3: 'Menjaga ketertiban, kebersihan, dan keselamatan warga selama pelaksanaan aksi sosial lapangan.'
    },
    refleksi: {
      refleksiSiswa: 'Sudahkah saya bangga menjadi bagian dari keluarga besar Muhammadiyah? Apakah keahlian yang saya pelajari di SMK ini sudah saya baktikan untuk menolong orang yang membutuhkan?',
      refleksiGuru: 'Bagaimana menumbuhkan militansi kader yang berwawasan luas, santun, dan tidak eksklusif di tengah masyarakat majemuk?'
    },
    karakterKemuhammadiyahan: [
      'Tauhid murni yang melahirkan amal saleh nyata di tengah masyarakat.',
      'Ikhlas dan Istiqomah dalam berjuang di persyarikatan: "Hidup-hidupilah Muhammadiyah dan jangan mencari hidup di Muhammadiyah".',
      'Etos Berkemajuan: Selalu berada di garda terdepan dalam inovasi ilmu pengetahuan dan teknologi demi kejayaan umat Islam.'
    ],
    tujuhKebiasaanAnakHebat: [
      { kebiasaan: '1. Bangun Pagi', implementasi: 'Menghidupkan shalat Tahajud dan Subuh berjamaah sebagai sumber energi spiritual kader persyarikatan.' },
      { kebiasaan: '2. Beribadah', implementasi: 'Ibadah tertib sesuai Himpunan Putusan Tarjih (HPT) Muhammadiyah berlandaskan dalil yang kuat.' },
      { kebiasaan: '3. Berolahraga', implementasi: 'Aktif mengikuti kegiatan kepanduan Hizbul Wathan (HW) atau bela diri Tapak Suci Putera Muhammadiyah.' },
      { kebiasaan: '4. Gemar Belajar', implementasi: 'Mengkaji majalah Suara Muhammadiyah dan buku pemikiran Islam berkemajuan.' },
      { kebiasaan: '5. Makan Sehat & Bergizi', implementasi: 'Menjaga kehalalan rezeki makanan keluarga sebagai kunci terkabulnya doa.' },
      { kebiasaan: '6. Bermasyarakat', implementasi: 'Aktif memakmurkan masjid, pengajian ranting Muhammadiyah, dan kegiatan kepemudaan.' },
      { kebiasaan: '7. Istirahat Cukup', implementasi: 'Menghindari begadang yang tidak ada maslahatnya agar siap aktif berdakwah di pagi hari.' }
    ],
    lkpd: {
      judulProyek: 'LKPD Kemuhammadiyahan: Bedah MKCH dan Perancangan Proposal Bakti Sosial Vokasi Al-Ma\'un',
      petunjukKerja: [
        'Kaji teks Matan Keyakinan dan Cita-cita Hidup Muhammadiyah (MKCH) butir 1 sampai 5.',
        'Diskusikan bagaimana nilai tauhid dan etos amal usaha diterapkan dalam profesi kejuruan kelompokmu.',
        'Rancang 1 proposal kegiatan sosial riil berskala kecil "Bakti Vokasi Al-Ma\'un" untuk warga sekitar sekolah.',
        'Uraikan pembagian tugas, estimasi kebutuhan dana, dan indikator keberhasilan program.'
      ],
      tugasProyek: 'Susun dokumen Proposal Program "Bakti Teknisi Berkemajuan SMK Muhammadiyah Bawang" berformat PDF siap serah ke PCM/LazisMu dan presentasikan di depan kelas.',
      alatBahan: [
        'Buku Teks Kemuhammadiyahan & Buku Himpunan Putusan Tarjih',
        'Dokumen Format Proposal Baku Sekolah',
        'Laptop / Komputer untuk Pengetikan dan Tata Letak Dokumen'
      ],
      rubrikPenilaian: 'Pemahaman Konsep MKCH & Ideologi (30%), Orisinalitas & Kemanfaatan Proposal Aksi (35%), Kelayakan Teknis Eksekusi (20%), Presentasi & Etika Kader (15%). Total 100.'
    }
  },

  // 7. PENDIDIKAN PANCASILA
  {
    id: 'preset-pendidikan-pancasila',
    jurusan: ['Semua Jurusan'],
    jurusanLabel: 'Pendidikan Pancasila (Lintas Jurusan)',
    mataPelajaran: 'Pendidikan Pancasila',
    faseKelas: 'Fase E (Kelas X) / Fase F (Kelas XI)',
    topikMateri: 'Internalisasi Nilai-Nilai Pancasila dalam Budaya Kerja Industri, Penegakan Regulasi Ketenagakerjaan & K3, dan Integritas Anti-Korupsi',
    metodePembelajaran: 'Project Based Learning (PjBL) Kampanye Integritas & Simulasi Musyawarah Kerja',
    durasiProyek: '2 Pertemuan (6 JP @ 45 Menit)',
    capaianPembelajaran: 'Pada akhir fase, peserta didik mampu menganalisis cara pandang para pendiri bangsa tentang dasar negara Pancasila, mengidentifikasi kedudukan Pancasila sebagai pandangan hidup dan ideologi negara dalam tata kelola ketenagakerjaan: menerapkan nilai gotong royong dan musyawarah mufakat di lingkungan kerja, menghormati hak asasi pekerja dan keadilan sosial, mematuhi hukum regulasi keselamatan kerja (K3LH), serta membiasakan sikap integritas anti-korupsi di dunia industri.',
    alurTujuanPembelajaran: '1. Menganalisis keterkaitan lima sila Pancasila dengan budaya kerja industri modern (contoh: Sila ke-2 hak asasi pekerja, Sila ke-5 upah adil).\n2. Membedah studi kasus sengketa hubungan industrial, pelanggaran keselamatan kerja K3, atau pemerasan upah buruh di Indonesia.\n3. Mempraktikkan simulasi musyawarah mufakat bipartit (antara manajemen perusahaan dan serikat pekerja teknisi) untuk mufakat adil.\n4. Menyusun deklarasi komitmen bersama integritas budaya kerja bebas pungli dan korupsi di lingkungan SMK Muhammadiyah Bawang.',
    tujuanPembelajaran: [
      'Peserta didik mampu menghayati nilai ketuhanan dan kemanusiaan yang adil dan beradab dalam setiap tindakan di tempat kerja (Mindful).',
      'Peserta didik mampu menganalisis peraturan perundang-undangan ketenagakerjaan dan K3 berbasis nilai-nilai Pancasila secara kritis (Meaningful).',
      'Peserta didik mampu berpartisipasi aktif dalam simulasi musyawarah kerja yang demokratis dan saling menghargai perbedaan pendapat (Joyful).',
      'Peserta didik mampu menghubungkan tegaknya keadilan sosial di tempat kerja dengan ketahanan nasional dan martabat bangsa (Interkoneksi).'
    ],
    sintaksPembelajaran: [
      {
        tahap: '1. Pemantik: Menatap Buruh dan Keadilan Sosial (Mindful)',
        fokusDeepLearning: 'Mindful',
        aktivitasKonkret: 'Guru menayangkan video dokumenter tentang perjuangan pekerja pabrik dan pentingnya keselamatan kerja. Siswa diajak merenungkan Sila ke-5: "Keadilan Sosial bagi Seluruh Rakyat Indonesia" sebagai cita-cita luhur bangsa.'
      },
      {
        tahap: '2. Analisis Kasus Regulasi K3 & Hak Pekerja (Meaningful)',
        fokusDeepLearning: 'Meaningful',
        aktivitasKonkret: 'Siswa berkelompok mengkaji UU Keselamatan Kerja No. 1 Tahun 1970 dan UU Ketenagakerjaan, mencermati pasal perlindungan pekerja muda, jaminan BPJS Ketenagakerjaan, dan standar APD.'
      },
      {
        tahap: '3. Simulasi Forum Musyawarah Bipartit (Joyful)',
        fokusDeepLearning: 'Joyful',
        aktivitasKonkret: 'Siswa bermain peran dalam suasana riang dan berbobot: satu pihak sebagai perwakilan Manajemen DUDI, satu pihak sebagai perwakilan Serikat Pekerja Bengkel, berunding secara musyawarah mufakat (Sila ke-4) mencari solusi jam kerja dan bonus kinerja.'
      },
      {
        tahap: '4. Perumusan Piagam Integritas Anti-Korupsi Vokasi (Interkoneksi)',
        fokusDeepLearning: 'Interkoneksi',
        aktivitasKonkret: 'Siswa merumuskan pasal-pasal komitmen anti-korupsi di sekolah: tidak mencuri alat bengkel, tidak menitip presensi kawan, jujur dalam nota pembelian bahan praktik.'
      },
      {
        tahap: '5. Deklarasi Bersama & Refleksi Kebangsaan',
        fokusDeepLearning: 'Meaningful & Mindful',
        aktivitasKonkret: 'Seluruh kelompok menandatangani Piagam Integritas Kerja Pancasila di selembar kanvas kain dan membacakan ikrar bersama dengan khidmat.'
      }
    ],
    integrasiSkillsPractice: {
      hardSkills: 'Kajian yuridis normatif undang-undang ketenagakerjaan, teknik perundingan musyawarah mufakat (negosiasi bipartit), pembuatan poster kampanye anti-korupsi.',
      softSkills: 'Toleransi keberagaman suku/agama rekan kerja, kepemimpinan demokratis, keberanian bersuara menegakkan kebenaran, integritas kejujuran moral.',
      praktikNyata: 'Penyusunan Pakta Integritas Praktik Kerja Industri (Prakerin/PKL) SMK Muhammadiyah Bawang Batang.',
      keselamatanKerjaK3: 'Penerapan hak dasar pekerja atas lingkungan kerja yang aman dan bebas dari bahaya kecelakaan kerja.'
    },
    refleksi: {
      refleksiSiswa: 'Apakah saya sudah memperlakukan rekan kerja saya secara adil tanpa membeda-bedakan latar belakangnya? Sudahkah saya menjunjung musyawarah daripada memaksakan kehendak?',
      refleksiGuru: 'Bagaimana memastikan nilai-nilai luhur Pancasila dihayati siswa sebagai pedoman hidup praktis di bengkel kerja, bukan sekadar hafalan butir-butir sila?'
    },
    karakterKemuhammadiyahan: [
      'Pancasila sebagai Darul Ahdi Wasy-Syahadah (Negara Konsensus dan Pembuktian Karya Nyata).',
      'Mengisi kemerdekaan dengan memperkuat keadilan sosial dan mengentaskan kemiskinan.',
      'Sikap toleran, cinta damai, dan mengutamakan kemaslahatan umum di atas kepentingan golongan.'
    ],
    tujuhKebiasaanAnakHebat: [
      { kebiasaan: '1. Bangun Pagi', implementasi: 'Mendisiplinkan diri bangun pagi untuk menghormati hak waktu orang lain dalam bekerja tim.' },
      { kebiasaan: '2. Beribadah', implementasi: 'Menjalankan ibadah sesuai keyakinan sebagai pengamalan murni Sila Pertama: Ketuhanan Yang Maha Esa.' },
      { kebiasaan: '3. Berolahraga', implementasi: 'Menjaga kesehatan tubuh agar selalu siap bergotong royong membantu masyarakat.' },
      { kebiasaan: '4. Gemar Belajar', implementasi: 'Mempelajari hak dan kewajiban warga negara yang tertuang dalam konstitusi UUD NRI 1945.' },
      { kebiasaan: '5. Makan Sehat & Bergizi', implementasi: 'Mensyukuri rezeki karunia Tuhan dan tidak membuang-buang makanan (mubadzir).' },
      { kebiasaan: '6. Bermasyarakat', implementasi: 'Menjunjung tinggi budaya gotong royong, kerja bakti, dan tepa slira di lingkungan tempat tinggal.' },
      { kebiasaan: '7. Istirahat Cukup', implementasi: 'Menjaga keseimbangan hak tubuh untuk beristirahat agar stamina kerja esok hari tetap optimal.' }
    ],
    lkpd: {
      judulProyek: 'LKPD Pendidikan Pancasila: Simulasi Musyawarah Kerja Bipartit & Piagam Integritas Anti-Korupsi Vokasi',
      petunjukKerja: [
        'Kaji lembar skenario sengketa lingkungan kerja (misal: tuntutan kelayakan APD bengkel dan transparansi insentif lembur).',
        'Bagi kelompok menjadi 2 kubu: Tim Manajemen Perusahaan dan Tim Delegasi Teknisi.',
        'Lakukan simulasi perundingan musyawarah mufakat selama 15 menit dengan adab santun dan argumentasi berbasis regulasi hukum.',
        'Tuliskan naskah Kesepakatan Bersama yang adil bagi kedua belah pihak.'
      ],
      tugasProyek: 'Hasilkan 1 naskah "Perjanjian Kerja Bersama Berbasis Pancasila" dan 1 poster kampanye bertema "Keluarga Besar SMK Muhammadiyah Bawang Berani Jujur: Tolak Korupsi dan Pungli di Tempat Kerja!".',
      alatBahan: [
        'Ringkasan UU Ketenagakerjaan No. 13/2003 & UU Cipta Kerja Klaster Ketenagakerjaan',
        'Lembar Skenario Negosiasi Musyawarah Bipartit',
        'Kertas Manila / Plano, Spidol Warna, dan Software Desain Grafis'
      ],
      rubrikPenilaian: 'Kedalaman Penerapan Sila Pancasila (30%), Kualitas Argumen Musyawarah Mufakat (30%), Kerapian & Kejelasan Naskah Kesepakatan (25%), Sikap Demokratis & Sopan Santun (15%). Total 100.'
    }
  },

  // 8. BAHASA JAWA
  {
    id: 'preset-bahasa-jawa',
    jurusan: ['Semua Jurusan'],
    jurusanLabel: 'Bahasa Jawa (Muatan Lokal Jawa Tengah)',
    mataPelajaran: 'Bahasa Jawa (Muatan Lokal Jawa Tengah)',
    faseKelas: 'Fase E (Kelas X) / Fase F (Kelas XI)',
    topikMateri: 'Unggah-Ungguh Basa Jawa (Ngoko lan Krama Alus), Komunikasi Santun Pelayanan Pelanggan ing Lingkungan Kerja, lan Kearifan Budaya Batang',
    metodePembelajaran: 'Project Based Learning (PjBL) Roleplay Pacelathon & Pembuatan Video Layanan Santun',
    durasiProyek: '2 Pertemuan (6 JP @ 45 Menit)',
    capaianPembelajaran: 'Wonten ing pungkasan fase, para peserta didik saged mangertosi, ngecakaken, lan ngembangaken unggah-ungguh basa Jawa (basa ngoko lugu, ngoko alus, krama lugu, lan krama alus) kanthi trep manut empan papan lan tata krama: saged matur santun kaliyan guru, pimpinan industri, lan para konsumen nalika nindakaken pakaryan kejuruan, sarta saged ngandharaken teks informasi babagan kearifan lokal lan potensi budaya Kabupaten Batang kanthi basa ingkang luwes lan trapsila.',
    alurTujuanPembelajaran: '1. Mbedakaken paugeran undha-usuk basa Jawa (ngoko vs krama alus) ingkang leres miturut unggah-ungguh Jawa.\n2. Gladhen micara (roleplay pacelathon) nglayani tamu/pelanggan bengkel utawi kantor kanthi basa krama alus ingkang trapsila.\n3. Nelaah pitutur luhur saking sesanti Jawa (ajining diri gumantung ing lathi, aja dumeh, tepa slira) ingkang selaras kaliyan etos kerja industri modern.\n4. Mrodhuksi video ringkes pariwara utawi pacelathon pelayanan jasa kejuruan kanthi nengenaken basa krama ingkang santun lan mranani ati.',
    tujuanPembelajaran: [
      'Para siswa saged ngraosaken wigatosipun budi pakerti lan trapsila basa Jawa minangka jati dhiri tiyang Jawa ingkang remen kurmat-kinurmatan (Mindful).',
      'Para siswa saged nelaah undha-usuk basa Jawa kanthi trep manut konteks pacelathon formal kaliyan pimpinan lan konsumen (Meaningful).',
      'Para siswa saged nglampahi pacelathon basa Jawa kanthi bingah, grapyak, lan luwes tanpa rumaos rikuh (Joyful).',
      'Para siswa saged nyambungaken kautaman unggah-ungguh basa kaliyan kaprigelan profesi industri modhern ing Kabupaten Batang (Interkoneksi).'
    ],
    sintaksPembelajaran: [
      {
        tahap: '1. Nalar Kautaman: Ajining Diri Gumantung ing Lathi (Mindful)',
        fokusDeepLearning: 'Mindful',
        aktivitasKonkret: 'Bapak/Ibu guru maringi tuladha pacelathon ingkang boten nengenaken unggah-ungguh saengga ndadosaken tamu kuciwa. Para siswa kaajak ngeningaken cipta, ngakeni bilih tembung ingkang santun punika wujud amal kasaenan (sedekah lesan).'
      },
      {
        tahap: '2. Nintingi Basa Krama Alus ing Donya Kerja (Meaningful)',
        fokusDeepLearning: 'Meaningful',
        aktivitasKonkret: 'Para siswa sinau mbedakaken tembung: mangan - nedha - dhahar, lunga - kesah - tindak, ngomong - sanjang - matur. Siswa nyusun ukara krama alus nalika matur kaliyan pimpinan bengkel utawi konsumen ingkang rawuh.'
      },
      {
        tahap: '3. Gladhen Pacelathon Pelayanan ing Lab/Bengkel (Joyful)',
        fokusDeepLearning: 'Joyful',
        aktivitasKonkret: 'Para siswa sami gladhen pacelathon adhep-adhepan kanthi gayeng: setunggal dados mekanik/frontliner ingkang ngaturi pambage harja ("Sugeng rawuh Bapak/Ibu, wonten ingkang saged kula biyantu?"), setunggal dados konsumen.'
      },
      {
        tahap: '4. Rekaman Video Layanan Prima Basa Jawa (Interkoneksi)',
        fokusDeepLearning: 'Interkoneksi',
        aktivitasKonkret: 'Siswa ngrekam video cekak 2 menit ngginakaken smartphone ing bengkel/lab SMK Muhammadiyah Bawang, nyambungaken keahlian teknik kaliyan kaluhuran basa Jawa Batangan.'
      },
      {
        tahap: '5. Pagelaran Video & Paring Panyaruwe Reflektif',
        fokusDeepLearning: 'Meaningful & Mindful',
        aktivitasKonkret: 'Video dipunputer sesarengan ing kelas, para kanca paring panyaruwe (apresiasi lan koreksi tembung), dipuntutup kanthi komitmen nguri-uri basa Jawa ing saben dinten.'
      }
    ],
    integrasiSkillsPractice: {
      hardSkills: 'Pangecakan undha-usuk basa Jawa (Krama Lugu & Krama Alus), panulisan naskah drama pacelathon kejuruan, produksi rekaman video edukatif.',
      softSkills: 'Tata krama trapsila, andhap asor (rendah hati), keprigelan ngrungokaken kanthi sabar, grapyak semanak marang tiyang sanes.',
      praktikNyata: 'SOP Pelayanan Tamu Basa Krama ing bengkel servis sepeda motor lan unit mini bank syariah SMK Muhammadiyah Bawang.',
      keselamatanKerjaK3: 'Sopan santun nalika maringi pènget bebaya kerja ngginakaken basa ingkang mranani nanging cetha.'
    },
    refleksi: {
      refleksiSiswa: 'Punapa kula taksih rumaos kangelan nalika matur basa krama alus kaliyan tiyang ingkang langkung sepuh? Kados pundi caranipun kula saged kulina micara basa Jawa kanthi sae lan trapsila?',
      refleksiGuru: 'Kados pundi mbiyantu para siswa supados boten isin micara basa Jawa? Punapa simulasi donya kerja saged ndadosaken pasinaon basa Jawa langkung kontekstual lan gayeng?'
    },
    karakterKemuhammadiyahan: [
      'Dakwah Kultural ingkang luwes: Ngurmati kearifan budaya lokal Jawa minangka sarana ngraketaken silaturahmi umat.',
      'Akhlak Karimah: Ngetrapaken budi pakerti ingkang luhur, andhap asor, lan tebih saking sipat gumunggung utawi kumaluhur.',
      'Fastabiqul Khairat: Semangat nglestarekaken warisan budaya luhur nusantara kanthi karya nyata.'
    ],
    tujuhKebiasaanAnakHebat: [
      { kebiasaan: '1. Bangun Pagi', implementasi: 'Tangi enjang kanthi manah bungah, nyuwun donga pangestu dhateng tiyang sepuh ngginakaken basa krama alus.' },
      { kebiasaan: '2. Beribadah', implementasi: 'Njagi shalat fardhu kanthi khusyuk minangka wujud bekti dhumateng Gusti Allah SWT.' },
      { kebiasaan: '3. Berolahraga', implementasi: 'Njagi kasarasan raga kanthi obahing badan supados seger sumyah nalika sinau.' },
      { kebiasaan: '4. Gemar Belajar', implementasi: 'Kersa maos bausastra (kamus) Jawa online kagem nambah seserepan tembung krama.' },
      { kebiasaan: '5. Makan Sehat & Bergizi', implementasi: 'Dhahat tetedhan ingkang halal lan thayyib, ngunjuk toya bening ingkang cekap.' },
      { kebiasaan: '6. Bermasyarakat', implementasi: 'Urip rukun kaliyan tangga teparo, gotong royong, lan nengenaken rembag musyawarah.' },
      { kebiasaan: '7. Istirahat Cukup', implementasi: 'Sare ing wekdal ingkang trep, boten begadang supados mbenjang enjang saged makarya kanthi rancag.' }
    ],
    lkpd: {
      judulProyek: 'LKPD Basa Jawa: Naskah Pacelathon lan Rekaman Video Layanan Prima Berbasis Unggah-Ungguh Basa Jawa',
      petunjukKerja: [
        'Damela kelompok ingkang isinipun 2-3 siswa.',
        'Piliha salah satunggaling tema pacelathon: (a) Nglayani servis motor, (b) Nglayani pambikakan rekening bank, (c) Masang jaringan internet.',
        'Serata naskah pacelathon ngginakaken basa Ngoko lan Krama Alus ingkang leres.',
        'Rekam simulasi pacelathon kasebat dados video cekak kanthi durasi 2-3 menit ing bengkel/lab sekolah.'
      ],
      tugasProyek: 'Ngasilaken 1 lembar Naskah Pacelathon Pelayanan Kejuruan basa Krama Alus lan 1 file video simulasi rekaman smartphone ingkang dipununggah ing Google Drive kelas.',
      alatBahan: [
        'Kamus Bausastra Jawa / Aplikasi Pepak Basa Jawa Daring',
        'Piranti Praktik Kejuruan ing Bengkel utawi Lab Sekolah',
        'Kamera Smartphone kagem ngrekam video pacelathon'
      ],
      rubrikPenilaian: 'Pangecakan Basa Krama Alus (35%), Tata Krama lan Solah Bawa Trapsila (25%), Kreativitas Skenario Pelayanan Vokasi (25%), Kualitas Rekaman Video (15%). Gunggung biji 100.'
    }
  },

  // 9. INFORMATIKA
  {
    id: 'preset-informatika',
    jurusan: ['Semua Jurusan', 'TKJ', 'TJAT', 'Akuntansi'],
    jurusanLabel: 'Informatika (Lintas Jurusan)',
    mataPelajaran: 'Informatika',
    faseKelas: 'Fase E (Kelas X)',
    topikMateri: 'Berpikir Komputasional (Computational Thinking), Analisis Data Terapan, Pemrograman Algoritma, dan Keamanan Siber',
    metodePembelajaran: 'Project Based Learning (PjBL) Otomasi Solusi Digital & Koding Vokasi',
    durasiProyek: '2 Pertemuan (8 JP @ 45 Menit)',
    capaianPembelajaran: 'Pada akhir fase, peserta didik mampu menerapkan berpikir komputasional (dekomposisi, pola, abstraksi, algoritma) untuk memecahkan persoalan sehari-hari dan kejuruan; memanfaatkan aplikasi perkantoran terintegrasi dan analisis data untuk memvisualisasikan informasi; merancang algoritma pemrograman visual/tekstual sederhana; serta memahami dampak sosial informatika, keamanan siber (cybersecurity), dan etika pemanfaatan kecerdasan artifisial (AI) secara bijak.',
    alurTujuanPembelajaran: '1. Menguraikan masalah kompleks di lingkungan sekolah/bengkel menggunakan 4 pilar computational thinking (dekomposisi, pengenalan pola, abstraksi, algoritma).\n2. Mengolah dataset mentah (data penjualan, inventaris alat, atau log teknis) menggunakan perkakas analisis data dan visualisasi grafik interaktif.\n3. Merancang pseudocode dan program sederhana (menggunakan Python atau Blockly) untuk otomasi kalkulasi biaya atau diagnosis malfungsi alat.\n4. Menganalisis ancaman kejahatan siber (phishing, malware, kebocoran sandi) dan merumuskan protokol keamanan informasi pribadi serta organisasi.',
    tujuanPembelajaran: [
      'Peserta didik mampu membiasakan cara berpikir komputasional yang runtut, terstruktur, dan solutif dengan kesadaran analitis (Mindful).',
      'Peserta didik mampu mengolah data empiris dan menginterpretasikan grafik informasi digital secara kontekstual (Meaningful).',
      'Peserta didik mampu merancang algoritma koding otomasi secara kolaboratif dalam suasana belajar yang kreatif dan menggembirakan (Joyful).',
      'Peserta didik mampu menghubungkan etika siber dengan tanggung jawab moral digital citizenship Islam dalam menjaga privasi data (Interkoneksi).'
    ],
    sintaksPembelajaran: [
      {
        tahap: '1. Pemantik Masalah: Fenomena Phishing & Bahaya Jejak Digital (Mindful)',
        fokusDeepLearning: 'Mindful',
        aktivitasKonkret: 'Guru menyajikan simulasi serangan rekayasa sosial (social engineering) dan kebocoran sandi. Siswa diajak hening merenungkan amanah menjaga kerahasiaan informasi orang lain dan etika bermedia digital (amar ma\'ruf siber).'
      },
      {
        tahap: '2. Penerapan 4 Pilar Berpikir Komputasional (Meaningful)',
        fokusDeepLearning: 'Meaningful',
        aktivitasKonkret: 'Siswa membedah masalah kerja nyata (misal: antrean panjang servis motor atau pencatatan stok alat bengkel yang sering hilang) menggunakan dekomposisi, pencarian pola, dan abstraksi menyusun alur flowchart.'
      },
      {
        tahap: '3. Eksekusi Koding & Analisis Data Otomasi (Joyful)',
        fokusDeepLearning: 'Joyful',
        aktivitasKonkret: 'Siswa bekerja berpasangan (pair programming) menyusun skrip koding ringkas (Python/Spreadsheet automation) untuk menghitung estimasi biaya atau mencatat database alat dengan antusiasme saling mengoreksi sintaks bug.'
      },
      {
        tahap: '4. Uji Coba Keamanan Sistem & Stress Test (Interkoneksi)',
        fokusDeepLearning: 'Interkoneksi',
        aktivitasKonkret: 'Melakukan pengujian validasi input data, menguji ketahanan program dari input error, serta memastikan data tersimpan aman dengan otentikasi kata sandi terenkripsi.'
      },
      {
        tahap: '5. Presentasi Proyek Solusi Digital & Refleksi Etika AI',
        fokusDeepLearning: 'Meaningful & Mindful',
        aktivitasKonkret: 'Masing-masing tim mendemonstrasikan aplikasi/dashboard data mereka, memaparkan nilai kepraktisannya, dan mendiskusikan batasan etis penggunaan AI dalam belajar.'
      }
    ],
    integrasiSkillsPractice: {
      hardSkills: 'Penerapan 4 pilar Computational Thinking, Flowcharting, Dasar Pemrograman Python/Spreadsheet Macro, Data Cleaning & Charting, Keamanan Password & Two-Factor Authentication (2FA).',
      softSkills: 'Logical deduction, persistence dalam mengatasi syntax error (debugging mindset), kerja tim kolaboratif, kesadaran privasi digital.',
      praktikNyata: 'Pembuatan Dashboard Inventaris Peralatan Bengkel / Lab Komputer SMK Muhammadiyah Bawang berbasis Spreadsheet / Python sederhana.',
      keselamatanKerjaK3: 'K3 penggunaan komputer: postur duduk 90 derajat, pencahayaan layar cukup, istirahat mata setiap 20 menit (aturan 20-20-20).'
    },
    refleksi: {
      refleksiSiswa: 'Bagaimana computational thinking membantu saya memecahkan masalah rumit menjadi bagian-bagian sederhana? Apakah saya sudah mengamankan akun digital saya dengan sandi yang kuat?',
      refleksiGuru: 'Apakah metode pair programming berhasil meningkatkan keberanian siswa yang belum pernah belajar koding sebelumnya? Bagaimana memastikan pemahaman logika algoritma tercapai dengan baik?'
    },
    karakterKemuhammadiyahan: [
      'Menjadi agen pencerahan digital (Mujahid Siber Berkemajuan) yang memproduksi konten positif dan solusi teknologi bermanfaat.',
      'Sikap jujur: Menghindari plagiarisme koding, tidak meretas sistem sekolah, dan menghormati hak cipta perangkat lunak.',
      'Fastabiqul Khairat: Terus mempelajari kecakapan digital masa depan (AI, Cloud, Big Data) demi kemajuan persyarikatan dan umat.'
    ],
    tujuhKebiasaanAnakHebat: [
      { kebiasaan: '1. Bangun Pagi', implementasi: 'Membuka hari dengan mengecek jadwal tugas digital dan membatasi konsumsi media sosial tanpa faedah.' },
      { kebiasaan: '2. Beribadah', implementasi: 'Menjadikan internet sebagai media mencari ilmu agama dari ulama terpercaya dan menjaga pandangan mata.' },
      { kebiasaan: '3. Berolahraga', implementasi: 'Senam peregangan leher, pergelangan tangan, dan mata setelah berjam-jam koding di depan monitor.' },
      { kebiasaan: '4. Gemar Belajar', implementasi: 'Mempelajari bahasa pemrograman baru dan dokumentasi teknologi open-source secara mandiri.' },
      { kebiasaan: '5. Makan Sehat & Bergizi', implementasi: 'Banyak minum air putih di meja komputer untuk mencegah kelelahan otak dan dehidrasi.' },
      { kebiasaan: '6. Bermasyarakat', implementasi: 'Membantu warga sekitar yang kesulitan mengoperasikan aplikasi layanan publik pemerintah.' },
      { kebiasaan: '7. Istirahat Cukup', implementasi: 'Menerapkan digital detox: mematikan layar gadget minimal 45 menit sebelum tidur malam.' }
    ],
    lkpd: {
      judulProyek: 'LKPD Informatika: Berpikir Komputasional dan Otomasi Pengolahan Data Kejuruan Berbasis Spreadsheet / Python',
      petunjukKerja: [
        'Pahami studi kasus pengelolaan data operasional kejuruan yang dibagikan guru.',
        'Uraikan masalah menjadi 4 pilar Berpikir Komputasional: Dekomposisi, Pengenalan Pola, Abstraksi, dan Desain Algoritma (Flowchart).',
        'Buatlah lembar kerja spreadsheet / skrip Python sederhana yang secara otomatis menghitung rekapitulasi data dan mendeteksi anomali.',
        'Sertakan grafik visualisasi tren data dan kesimpulan analisis.'
      ],
      tugasProyek: 'Ciptakan 1 file prototype sistem inventaris mini atau kalkulator biaya operasional bengkel/lab sekolah yang bekerja otomatis dan siap digunakan.',
      alatBahan: [
        'Komputer / Laptop Lab Informatika dengan Browser Web dan Aplikasi Spreadsheet (Excel/Google Sheets)',
        'Platform Koding Daring (Google Colab / Replit Python)',
        'Kertas HVS untuk Merancang Sketsa Diagram Alir (Flowchart)'
      ],
      rubrikPenilaian: 'Penerapan 4 Pilar Computational Thinking (30%), Kebenaran Logika Algoritma & Formula (30%), Desain Tampilan & Grafik Visualisasi (25%), Presentasi & Etika Digital (15%). Total 100.'
    }
  }
];
