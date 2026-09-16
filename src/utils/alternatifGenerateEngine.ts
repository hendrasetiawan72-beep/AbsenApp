import { AlternatifGenerateModul, AlternatifSkenarioKurikulum, ModulAjarPromptData, SMKJurusan } from '../types';

export const SEPULUH_ALTERNATIF_GENERATE: AlternatifSkenarioKurikulum[] = [
  {
    id: 'pjbl-tefa',
    nomor: 1,
    judul: '1. PjBL & Teaching Factory (TEFA)',
    subjudul: 'Produksi Nyata Standar Industri DUDI Batang',
    deskripsi: 'Pendekatan berbasis proyek nyata yang mengacu pada alur kerja, standar mutu, dan budaya kerja riil bengkel / kantor industri mitra Kabupaten Batang.',
    fokusPedagogi: 'Work-Based Learning & Produksi Barang/Jasa Riil',
    badge: 'Industri TEFA',
    color: 'from-emerald-600 to-teal-700'
  },
  {
    id: 'pbl-investigasi',
    nomor: 2,
    judul: '2. Problem-Based Learning (PBL) Investigatif',
    subjudul: 'Troubleshooting & Analisis Kasus Lapangan Konkret',
    deskripsi: 'Pendekatan berbasis investigasi masalah autentik, diagnosis kegagalan sistem/alat, analisis akar penyebab (root cause), dan formulasi solusi kritis.',
    fokusPedagogi: 'Critical Thinking & Root-Cause Troubleshooting',
    badge: 'Studi Kasus',
    color: 'from-blue-600 to-indigo-700'
  },
  {
    id: 'skills-bahasa',
    nomor: 3,
    judul: '3. 4 Skills Bahasa & Komunikasi Vokasi',
    subjudul: 'Listening, Speaking, Reading, Writing Terintegrasi',
    deskripsi: 'Khusus mengintegrasikan 4 keterampilan bahasa dalam konteks kerja: menyimak instruksi supervisor, presentasi lisan, membaca manual kerja/SOP, dan menulis laporan teknis.',
    fokusPedagogi: 'Listening, Speaking, Reading, Writing Kejuruan',
    badge: '4 Language Skills',
    color: 'from-amber-500 to-orange-600'
  },
  {
    id: 'deep-learning',
    nomor: 4,
    judul: '4. Deep Learning Reflektif-Spiritual',
    subjudul: 'Mindful, Meaningful, Joyful & Interkoneksi Berkemajuan',
    deskripsi: 'Menekankan kesadaran hening (mindful awareness), kebermaknaan ilmu bagi kehidupan, kegembiraan proses belajar (joyful), dan keterhubungan lintas disiplin.',
    fokusPedagogi: 'Mindful • Meaningful • Joyful • Interkoneksi',
    badge: 'Deep Learning',
    color: 'from-indigo-600 to-violet-700'
  },
  {
    id: 'kemuhammadiyahan',
    nomor: 5,
    judul: '5. Penguatan Karakter Kemuhammadiyahan & Al-Islam',
    subjudul: 'Fastabiqul Khairat, Etos Kerja Ibadah & Keteladanan Dahlan',
    deskripsi: 'Menanamkan tauhid murni, nilai keikhlasan bekerja, dakwah bil hal melalui karya kejuruan, dan etos berkemajuan yang mencerahkan masyarakat.',
    fokusPedagogi: 'Tauhid Murni, Amanah & Etos Berkemajuan',
    badge: 'Karakter Islami',
    color: 'from-teal-600 to-emerald-700'
  },
  {
    id: 'diferensiasi',
    nomor: 6,
    judul: '6. Pembelajaran Berdiferensiasi Inklusif',
    subjudul: 'Diferensiasi Konten, Proses & Produk (Multi-Gaya Belajar)',
    deskripsi: 'Menyesuaikan pembelajaran dengan kesiapan dan modalitas belajar siswa (Visual, Auditori, Kinestetik) melalui scaffolding bertingkat dan produk beragam.',
    fokusPedagogi: 'Profil Belajar & Diferensiasi Konten-Proses-Produk',
    badge: 'Berdiferensiasi',
    color: 'from-purple-600 to-pink-600'
  },
  {
    id: 'stem-komputasi',
    nomor: 7,
    judul: '7. STEM & Komputasi Presisi Vokasi',
    subjudul: 'Sains, Teknologi, Engineering, Seni & Matematika Terapan',
    deskripsi: 'Mengintegrasikan data kuantitatif, rumus kalkulasi matematis presisi, logika komputasional algoritma, dan pembuktian ilmiah dalam praktik kejuruan.',
    fokusPedagogi: 'Computational Thinking & Precision Measurement',
    badge: 'STEM & Presisi',
    color: 'from-cyan-600 to-blue-700'
  },
  {
    id: 'technopreneurship',
    nomor: 8,
    judul: '8. Technopreneurship & Wirausaha Kreatif',
    subjudul: 'Kalkulasi HPP, Pemasaran Digital & Solusi Bisnis Berkah',
    deskripsi: 'Menumbuhkan jiwa saudagar mandiri meneladani KH. Ahmad Dahlan: merancang produk komersial, menghitung harga pokok penjualan (HPP), dan strategi pemasaran beretika.',
    fokusPedagogi: 'Wirausaha Mandiri & Validasi Pasar Lokal Batang',
    badge: 'Wirausaha Kreatif',
    color: 'from-rose-600 to-red-700'
  },
  {
    id: 'k3lh-green-skills',
    nomor: 9,
    judul: '9. K3LH, Green Skills & Eco-Vokasi Berkelanjutan',
    subjudul: 'Budaya 5S/5R, Keselamatan Zero Accident & Kelestarian Alam',
    deskripsi: 'Berfokus pada budaya K3LH industri, efisiensi energi, pengelolaan limbah bengkel ramah lingkungan, dan tanggung jawab manusia sebagai khalifah penjaga bumi.',
    fokusPedagogi: 'Zero Accident, Budaya 5S & Kelestarian Lingkungan',
    badge: 'Green Skills & K3',
    color: 'from-emerald-700 to-green-800'
  },
  {
    id: 'pancasila-7kebiasaan',
    nomor: 10,
    judul: '10. Profil Pelajar Pancasila & 7 Kebiasaan Hebat',
    subjudul: 'Habituasi 7 Kebiasaan Anak Indonesia Hebat & Karakter Bangsa',
    deskripsi: 'Menginternalisasi kebiasaan bangun pagi, beribadah, berolahraga, gemar belajar, makan sehat, bermasyarakat, dan istirahat cukup dalam etos kerja Pancasila.',
    fokusPedagogi: 'Habituasi 7 Kebiasaan & Gotong Royong Pancasila',
    badge: 'Karakter Hebat',
    color: 'from-orange-500 to-amber-600'
  }
];

export function generateFieldsFromCpAndAtpWithAlternatif(
  cp: string,
  atp: string,
  selectedJurusan: SMKJurusan[],
  faseKelas: string,
  namaGuru: string,
  existingData?: Partial<ModulAjarPromptData>,
  alternatifId: AlternatifGenerateModul = 'pjbl-tefa'
): Partial<ModulAjarPromptData> {
  const text = `${cp} ${atp} ${existingData?.topikMateri || ''} ${existingData?.mataPelajaran || ''}`.toLowerCase();

  // 1. Detect Subject Domain
  const isEnglish = text.includes('inggris') || text.includes('english') || text.includes('listening') || text.includes('speaking') || text.includes('reading') || text.includes('writing');
  const isIndo = text.includes('indonesia') || text.includes('teks laporan') || text.includes('lho') || text.includes('observasi') || text.includes('prosedur') || text.includes('kaidah bahasa');
  const isMath = text.includes('matematika') || text.includes('statistika') || text.includes('geometri') || text.includes('aljabar') || text.includes('toleransi') || text.includes('perhitungan') || text.includes('kalkulasi');
  const isSejarah = text.includes('sejarah') || text.includes('revolusi industri') || text.includes('kolonial') || text.includes('kebangkitan nasional') || text.includes('perjuangan');
  const isPai = text.includes('pendidikan agama islam') || text.includes('pai') || text.includes('muamalah') || text.includes('fiqih') || text.includes('akhlak') || text.includes('ibadah') || text.includes('riba');
  const isKemuhammadiyahan = text.includes('kemuhammadiyahan') || text.includes('mkch') || text.includes('amal usaha') || text.includes('aum') || text.includes('ahmad dahlan') || text.includes('sang surya');
  const isPancasila = text.includes('pancasila') || text.includes('kewarganegaraan') || text.includes('musyawarah') || text.includes('uud') || text.includes('hak asasi') || text.includes('gotong royong');
  const isJawa = text.includes('jawa') || text.includes('unggah-ungguh') || text.includes('krama') || text.includes('ngoko') || text.includes('pacelathon') || text.includes('basa jawa');
  const isInformatika = text.includes('informatika') || text.includes('komputasional') || text.includes('koding') || text.includes('algoritma') || text.includes('python') || text.includes('keamanan siber');

  // Vocational Detection
  const isTkr = selectedJurusan.includes('TKR') || text.includes('tkr') || text.includes('mobil') || text.includes('kendaraan ringan') || text.includes('efi');
  const isTsm = selectedJurusan.includes('TSM') || text.includes('tsm') || text.includes('motor') || text.includes('cvt') || text.includes('pgm-fi');
  const isAkl = selectedJurusan.includes('Akuntansi') || text.includes('akuntansi') || text.includes('jurnal') || text.includes('neraca') || text.includes('keuangan');
  const isPbs = selectedJurusan.includes('Perbankan Syari\'ah') || text.includes('perbankan') || text.includes('syariah') || text.includes('teller') || text.includes('murabahah');
  const isTjat = selectedJurusan.includes('TJAT') || text.includes('tjat') || text.includes('fiber') || text.includes('splicing') || text.includes('ftth') || text.includes('optik');
  const isTkj = selectedJurusan.includes('TKJ') || text.includes('tkj') || text.includes('jaringan') || text.includes('mikrotik') || text.includes('vlan') || text.includes('routing');

  // Helper to extract clean manual topic from user's manual CP or ATP
  const extractManualTopic = (rawText: string): string => {
    if (!rawText) return '';
    const cleaned = rawText
      .replace(/^pada akhir fase\s+[a-f]\s*,?\s*/i, '')
      .replace(/^peserta didik (mampu|dapat|terampil|memahami|menganalisis|mengidentifikasi|mempraktikkan)\s+/i, '')
      .replace(/^siswa (mampu|dapat|terampil|memahami|menganalisis)\s+/i, '')
      .trim();
    const firstSentence = cleaned.split(/[.\n;]/)[0].trim();
    if (firstSentence.length > 6) {
      return firstSentence.charAt(0).toUpperCase() + firstSentence.slice(1);
    }
    return '';
  };

  // Contextual Name of Topic
  let baseTopic = existingData?.topikMateri || '';
  if (!baseTopic) {
    baseTopic = extractManualTopic(atp) || extractManualTopic(cp);
  }
  if (!baseTopic) {
    if (isEnglish) baseTopic = 'Vocational Technical Communication & 4 Language Skills (Listening, Speaking, Reading, Writing)';
    else if (isIndo) baseTopic = 'Penyusunan Teks Laporan Hasil Observasi dan Dokumen Prosedur Teknis Kerja Industri';
    else if (isMath) baseTopic = 'Statistika Pengendalian Mutu Produksi, Toleransi Geometri, dan Kalkulasi Biaya Proyek';
    else if (isSejarah) baseTopic = 'Dinamika Sejarah Revolusi Industri dan Spirit Kemandirian Vokasi K.H. Ahmad Dahlan';
    else if (isPai) baseTopic = 'Etos Kerja Islami, Fiqih Muamalah Kontemporer, dan Tanggung Jawab Sosial Khalifah fil Ardh';
    else if (isKemuhammadiyahan) baseTopic = 'Matan Keyakinan Cita-Cita Hidup Muhammadiyah (MKCH), Kepribadian Kader, dan Amal Usaha (AUM)';
    else if (isPancasila) baseTopic = 'Internalisasi Nilai Pancasila dalam Budaya Kerja, Penegakan Regulasi K3, dan Integritas Anti-Korupsi';
    else if (isJawa) baseTopic = 'Unggah-Ungguh Basa Jawa (Krama Alus), Pelayanan Prima, lan Pitutur Luhur Kearifan Batang';
    else if (isInformatika) baseTopic = 'Berpikir Komputasional, Analisis Data Terapan, Algoritma Pemrograman, dan Keamanan Digital';
    else if (isTkr) baseTopic = 'Perawatan dan Diagnosis Terpadu Sistem Kelistrikan dan Injeksi EFI Kendaraan Ringan';
    else if (isTsm) baseTopic = 'Troubleshooting Sistem CVT dan Injeksi PGM-FI Sepeda Motor Berstandar AHASS';
    else if (isAkl) baseTopic = 'Penyusunan Laporan Keuangan Perusahaan Jasa/Dagang Berbasis Komputer Akuntansi';
    else if (isPbs) baseTopic = 'Simulasi Pelayanan Frontliner dan Administrasi Pembiayaan Akad Syariah Perbankan';
    else if (isTjat) baseTopic = 'Instalasi, Penyambungan Fusion Splicer, dan Pengukuran Redaman Kabel Serat Optik FTTH';
    else if (isTkj) baseTopic = 'Konfigurasi Jaringan Berbasis VLAN, Routing OSPF, dan Firewall Keamanan MikroTik';
    else baseTopic = 'Penerapan Praktik Terpadu Kejuruan SMK Muhammadiyah Bawang Berbasis Deep Learning';
  }

  // Find info of the chosen alternative
  const altInfo = SEPULUH_ALTERNATIF_GENERATE.find(a => a.id === alternatifId) || SEPULUH_ALTERNATIF_GENERATE[0];

  // 2. Derive Tujuan Pembelajaran based on Subject & Alternative
  const tujuanPembelajaran: string[] = [];

  if (alternatifId === 'skills-bahasa' || isEnglish) {
    tujuanPembelajaran.push(
      `Peserta didik terampil mendengarkan dan menyimak (Listening Skill) instruksi teknis lisan dan kebutuhan pelanggan terkait ${baseTopic} dengan konsentrasi penuh (Mindful).`,
      `Peserta didik mampu membaca dan membedah (Reading Skill) teks manual book, diagram SOP, atau regulasi teknis berbahasa baku/Inggris secara cermat (Meaningful).`,
      `Peserta didik fasih dan percaya diri berbicara (Speaking Skill) mempresentasikan alur kerja dan berdialog profesional secara kolaboratif (Joyful).`,
      `Peserta didik mampu menyusun (Writing Skill) laporan resmi, berita acara, atau dokumen lembar kerja teknis terstandar industri global (Interkoneksi).`
    );
  } else if (alternatifId === 'pjbl-tefa') {
    tujuanPembelajaran.push(
      `Peserta didik mampu merencanakan alur kerja produksi barang/jasa terkait ${baseTopic} mengacu pada SOP bengkel Teaching Factory industri (Mindful).`,
      `Peserta didik mampu mengeksekusi pengerjaan produk riil sesuai spesifikasi teknis dan toleransi mutu dunia usaha/dunia industri (Meaningful).`,
      `Peserta didik mampu berkolaborasi aktif dalam pembagian peran divisi kerja dengan semangat saling melengkapi (Joyful).`,
      `Peserta didik mampu melakukan kendali mutu (quality control) dan mengaitkan produk akhir dengan kepuasan pelanggan serta etika bisnis Islami (Interkoneksi).`
    );
  } else if (alternatifId === 'pbl-investigasi') {
    tujuanPembelajaran.push(
      `Peserta didik mampu mengidentifikasi gejala malfungsi atau masalah nyata terkait ${baseTopic} secara metodis dan teliti (Mindful).`,
      `Peserta didik mampu menganalisis akar penyebab permasalahan (root cause analysis) menggunakan data empiris dan kajian literatur teknis (Meaningful).`,
      `Peserta didik mampu merumuskan alternatif solusi solutif dan menguji coba perbaikan secara kolaboratif tanpa rasa takut gagal (Joyful).`,
      `Peserta didik mampu mengevaluasi dampak preventif dari perbaikan sistem guna mencegah masalah berulang di industri (Interkoneksi).`
    );
  } else if (alternatifId === 'kemuhammadiyahan') {
    tujuanPembelajaran.push(
      `Peserta didik mampu menghayati nilai tauhid dan niat ibadah dalam mempelajari ${baseTopic} untuk kemaslahatan sesama manusia (Mindful).`,
      `Peserta didik mampu meneladani integritas moral, amanah, dan kejujuran tokoh K.H. Ahmad Dahlan dalam konteks pekerjaan vokasi (Meaningful).`,
      `Peserta didik mampu mempraktikkan semangat Fastabiqul Khairat (berlomba dalam kebaikan mutu karya) secara antusias bersama tim (Joyful).`,
      `Peserta didik mampu menghubungkan keahlian teknis dengan misi dakwah pencerahan dan pengabdian persyarikatan Muhammadiyah (Interkoneksi).`
    );
  } else if (alternatifId === 'diferensiasi') {
    tujuanPembelajaran.push(
      `Peserta didik mampu mengeksplorasi materi ${baseTopic} melalui berbagai modalitas pilihan konten (teks, video tutorial, demonstrasi fisik) sesuai kesiapan diri (Mindful).`,
      `Peserta didik mampu memilih strategi pemecahan masalah dengan tingkat tantangan bertingkat (scaffolding) sesuai minat dan keahlian (Meaningful).`,
      `Peserta didik mampu berkreasi menghasilkan karya atau unjuk kerja terbaik tanpa diskriminasi kemampuan (Joyful).`,
      `Peserta didik mampu saling mengapresiasi keragaman potensi rekan sejawat sebagai anugerah keberagaman profil pelajar (Interkoneksi).`
    );
  } else if (alternatifId === 'stem-komputasi') {
    tujuanPembelajaran.push(
      `Peserta didik mampu mengumpulkan data numerik presisi dan merumuskan variabel sains-teknis seputar ${baseTopic} (Mindful).`,
      `Peserta didik mampu menerapkan formula matematis dan pemikiran algoritmik untuk memodelkan solusi optimasi kerja (Meaningful).`,
      `Peserta didik mampu melakukan uji coba empiris dan memvisualisasikan data grafik secara kolaboratif menggunakan aplikasi digital (Joyful).`,
      `Peserta didik mampu menghubungkan bukti matematis dengan efisiensi rekayasa teknologi dan keberlanjutan sistem (Interkoneksi).`
    );
  } else if (alternatifId === 'technopreneurship') {
    tujuanPembelajaran.push(
      `Peserta didik mampu mengidentifikasi peluang pasar dan kebutuhan masyarakat Kabupaten Batang terkait produk/layanan ${baseTopic} (Mindful).`,
      `Peserta didik mampu menghitung biaya produksi, menentukan harga pokok penjualan (HPP), dan merancang model bisnis beretika syariah (Meaningful).`,
      `Peserta didik mampu mempraktikkan simulasi promosi dan pelayanan prima kepada calon pembeli dengan ramah dan percaya diri (Joyful).`,
      `Peserta didik mampu mengaitkan kesuksesan wirausaha mandiri dengan zakat perniagaan dan filantropi pemberdayaan umat (Interkoneksi).`
    );
  } else if (alternatifId === 'k3lh-green-skills') {
    tujuanPembelajaran.push(
      `Peserta didik mampu menerapkan inspeksi potensi bahaya kerja dan disiplin APD pada praktik ${baseTopic} demi keselamatan tanpa kompromi (Mindful).`,
      `Peserta didik mampu mematuhi regulasi K3LH serta mengelola limbah kerja dan efisiensi energi secara terukur (Meaningful).`,
      `Peserta didik mampu membudayakan etos kerja 5S/5R (Ringkas, Rapi, Resik, Rawat, Rajin) dengan atmosfer bengkel yang positif dan kompak (Joyful).`,
      `Peserta didik mampu menghayati peran manusia sebagai khalifah penjaga kelestarian lingkungan hidup dan keselamatan sesama pekerja (Interkoneksi).`
    );
  } else if (alternatifId === 'pancasila-7kebiasaan') {
    tujuanPembelajaran.push(
      `Peserta didik mampu mengamalkan kebiasaan bangun pagi dan ibadah tertib sebagai fondasi kedisiplinan mempelajari ${baseTopic} (Mindful).`,
      `Peserta didik mampu menerapkan prinsip musyawarah mufakat, keadilan, dan kejujuran anti-kecurangan dalam alur kerja kelompok (Meaningful).`,
      `Peserta didik mampu membudayakan gotong royong dan saling tolong-menolong dalam menyelesaikan tugas praktik yang menantang (Joyful).`,
      `Peserta didik mampu menghubungkan integritas etika Pancasila dengan komitmen kebangsaan memajukan vokasi Indonesia (Interkoneksi).`
    );
  } else {
    // Deep Learning Murni
    tujuanPembelajaran.push(
      `Peserta didik mampu menganalisis konsep inti ${baseTopic} dengan kesadaran hening dan penghayatan makna yang mendalam (Mindful).`,
      `Peserta didik mampu menghubungkan materi ajar dengan pengalaman hidup sehari-hari serta kebutuhan riil masyarakat (Meaningful).`,
      `Peserta didik mampu melaksanakan eksplorasi belajar yang menggembirakan tanpa tekanan, didasari rasa ingin tahu yang tinggi (Joyful).`,
      `Peserta didik mampu menyintesiskan keterhubungan antardisiplin ilmu, nilai keimanan, dan tanggung jawab sosial kemanusiaan (Interkoneksi).`
    );
  }

  // 3. Derive Sintaks Pembelajaran Deep Learning (5 Tahap Konkret)
  const sintaksPembelajaran = [
    {
      tahap: `1. Orientasi Makna & Kesadaran Penuh (${altInfo.badge} - Mindful)`,
      fokusDeepLearning: 'Mindful',
      aktivitasKonkret: `Guru memantik rasa ingin tahu dengan menghadirkan fenomena nyata seputar ${baseTopic} dalam perspektif ${altInfo.subjudul}. Peserta didik diajak jeda hening sejenak merenungi tujuan belajar dan menata niat bahwa penguasaan ilmu ini adalah bentuk amanah ibadah serta kontribusi bagi masyarakat.`
    },
    {
      tahap: `2. Perencanaan Proyek & Pembagian Peran (${altInfo.badge} - Meaningful)`,
      fokusDeepLearning: 'Meaningful',
      aktivitasKonkret: `Peserta didik membentuk tim kerja mandiri, membedah manual instruksi kerja, mengidentifikasi tantangan ${altInfo.fokusPedagogi}, menyusun jadwal pengerjaan, dan membagi tugas secara adil sesuai potensi masing-masing anggota.`
    },
    {
      tahap: `3. Eksekusi Kolaboratif & Praktik Nyata (${altInfo.badge} - Joyful)`,
      fokusDeepLearning: 'Joyful',
      aktivitasKonkret: `Peserta didik melaksanakan tahapan praktik langsung di lab/bengkel atau ruang kelas. Suasana dibangun secara menggembirakan, saling mendukung, dan guru memberikan apresiasi berkala terhadap proses kreasi siswa tanpa penghakiman.`
    },
    {
      tahap: `4. Verifikasi Mutu, Uji Coba & Interkoneksi Sistem (${altInfo.badge} - Interkoneksi)`,
      fokusDeepLearning: 'Interkoneksi',
      aktivitasKonkret: `Peserta didik melakukan pengujian hasil, membandingkan kualitas karya dengan standar operasional industri (DUDI Batang), serta menganalisis kaitan materi dengan disiplin ilmu lain, dampak lingkungan hidup, dan etika profesi.`
    },
    {
      tahap: `5. Gelar Karya, Refleksi Bermakna & Tindak Lanjut (${altInfo.badge} - Mindful & Meaningful)`,
      fokusDeepLearning: 'Meaningful & Mindful',
      aktivitasKonkret: `Peserta didik menyajikan hasil proyek, melakukan refleksi mendalam mengenai nilai perjuangan, kejujuran data, dan kerjasama yang dirasakan, serta menerima umpan balik apresiatif dari guru dan rekan sejawat.`
    }
  ];

  // 4. Derive Integrasi Skills Practice
  let hardSkills = '';
  if (isEnglish) {
    hardSkills = 'Penguasaan 4 Skills Bahasa (Listening comprehension, Pronunciation & Speaking fluency, Technical skimming/scanning Reading, Formal Writing), kosakata teknik (Vocational English Terminology), struktur kalimat SOP (Imperative sentences & passive voice).';
  } else if (isIndo) {
    hardSkills = 'Teknik observasi faktual, penyusunan struktur teks LHO (pernyataan umum, deskripsi bagian, manfaat), kaidah ejaan PUEBI/EYD V, penulisan kalimat instruksi kerja SOP baku.';
  } else if (isMath) {
    hardSkills = 'Statistika deskriptif terapan (Mean, Median, Standar Deviasi), pembuatan Quality Control Chart di Spreadsheet, kalkulasi toleransi geometri dan sudut, perhitungan HPP & margin laba.';
  } else if (isSejarah) {
    hardSkills = 'Metodologi analisis sumber sejarah, penelusuran arsip perkembangan industri, penyusunan linimasa digital (timeline infografis), historiografi kontekstual.';
  } else if (isPai) {
    hardSkills = 'Kajian dalil Al-Qur\'an dan Hadits tematik muamalah, pemahaman skema akad fiqih syariah (Murabahah, Ijarah, Mudharabah), perumusan kode etik kerja Islami.';
  } else if (isKemuhammadiyahan) {
    hardSkills = 'Pemahaman naskah ideologi MKCH dan Kepribadian Muhammadiyah, manajemen program aksi filantropi Al-Ma\'un, penyusunan proposal pengabdian masyarakat vokasi.';
  } else if (isPancasila) {
    hardSkills = 'Analisis yuridis regulasi ketenagakerjaan dan K3 (UU No. 1/1970), teknik musyawarah mufakat perundingan kerja (bipartit), perumusan pakta integritas anti-korupsi.';
  } else if (isJawa) {
    hardSkills = 'Pangecakan undha-usuk basa Jawa (ngoko vs krama alus), tata krama micara pacelathon formal pelayanan industri, panyusunan naskah lan video edukatif basa Jawa.';
  } else if (isInformatika) {
    hardSkills = 'Penerapan 4 pilar Computational Thinking, perancangan algoritma flowchart, pemrograman dasar otomasi (Spreadsheet / Python), keamanan siber & Two-Factor Authentication.';
  } else if (isTkr) {
    hardSkills = 'Pengoperasian Scanner OBD-II, multimeter digital, set kunci bengkel, analisis sirkuit kelistrikan body dan sistem injeksi EFI kendaraan ringan.';
  } else if (isTsm) {
    hardSkills = 'Penggunaan Special Service Tools (SST CVT), jangka sorong presisi 0.02mm, kunci torsi, dan diagnostic scanner HIDS motor matic.';
  } else if (isAkl) {
    hardSkills = 'Aplikasi formula spreadsheet tingkat lanjut, software komputer akuntansi, verifikasi bukti transaksi, dan penyusunan laporan keuangan neraca/laba-rugi.';
  } else if (isPbs) {
    hardSkills = 'Pengoperasian core banking mini bank, teknik hitung cepat uang tunai, deteksi uang palsu sinar UV, dan administrasi akad pembiayaan Murabahah.';
  } else if (isTjat) {
    hardSkills = 'Pengoperasian mesin Fusion Splicer serat optik, precision cleaver, OPM, laser VFL, dan instalasi jalur kabel drop core FTTH.';
  } else if (isTkj) {
    hardSkills = 'Konfigurasi MikroTik RouterOS (VLAN, OSPF, NAT, Firewall Rules), subnetting IP, bandwidth management, dan uji keamanan penetrasi jaringan.';
  } else {
    hardSkills = 'Kombinasi keterampilan teknis vokasi spesifik, pengoperasian alat bengkel/lab industri terstandar, dan dokumentasi digital hasil kerja.';
  }

  const integrasiSkillsPractice = {
    hardSkills,
    softSkills: alternatifId === 'skills-bahasa'
      ? 'Active listening empathy, kelancaran komunikasi lisan, keberanian berbicara di depan umum, ketelitian menyimak intonasi dan ejaan.'
      : alternatifId === 'kemuhammadiyahan'
      ? 'Kejujuran (amanah), keikhlasan beramal, etos kerja keras (Fastabiqul Khairat), rendah hati (tawadhu\'), dan kepedulian sosial.'
      : alternatifId === 'technopreneurship'
      ? 'Kreativitas inovasi produk, negosiasi ramah, kepemimpinan tim bisnis, resiliensi menghadapi penolakan, dan etika transaksi jujur.'
      : 'Komunikasi profesional, kerja sama tim solid (teamwork), pemecahan masalah (problem solving), ketelitian membaca SOP, dan sikap santun.',
    praktikNyata: `Penerapan skenario nyata ${altInfo.subjudul} di lingkungan bengkel, laboratorium, atau ruang kelas SMK Muhammadiyah Bawang Batang.`,
    keselamatanKerjaK3: alternatifId === 'k3lh-green-skills'
      ? 'Penerapan standar Zero Accident K3LH: wajib mengenakan APD lengkap, inspeksi berkala kabel dan peralatan, penataan limbah sesuai kategori, dan budaya 5S/5R (Ringkas, Rapi, Resik, Rawat, Rajin).'
      : 'Wajib menggunakan APD keselamatan kerja yang sesuai, memperhatikan ergonomi tubuh saat bekerja, mematuhi SOP alat, dan menjaga kebersihan area kerja.'
  };

  // 5. Derive Refleksi
  const refleksi = {
    refleksiSiswa: alternatifId === 'skills-bahasa'
      ? 'Keterampilan bahasa mana (Listening, Speaking, Reading, Writing) yang paling meningkat hari ini? Apakah saya merasa lebih percaya diri berkomunikasi di lingkungan kerja?'
      : alternatifId === 'kemuhammadiyahan'
      ? 'Apakah saya sudah menyertakan niat ibadah dan kejujuran dalam menyelesaikan pekerjaan hari ini? Bagaimana saya menerapkan semangat KH. Ahmad Dahlan dalam karya nyata saya?'
      : 'Apakah saya telah memahami sepenuhnya esensi pembelajaran ini? Nilai kebaikan dan keterampilan baru apa yang saya dapatkan selama bekerja bersama tim? Apa yang perlu saya perbaiki pada sesi berikutnya?',
    refleksiGuru: 'Apakah pendekatan Deep Learning berhasil menciptakan suasana belajar yang mindful, bermakna, dan menggembirakan? Bagaimana efektivitas diferensiasi bagi siswa yang memerlukan pendampingan khusus?'
  };

  // 6. Derive Karakter Kemuhammadiyahan
  const karakterKemuhammadiyahan = [
    'Tauhid Murni & Nilai Ibadah: Meyakini bahwa bekerja dengan tekun dan belajar sungguh-sungguh adalah bentuk peribadatan kepada Allah SWT.',
    'Fastabiqul Khairat: Semangat berlomba-lomba dalam kebaikan, keahlian, dan menghasilkan karya terbaik untuk kemaslahatan umat.',
    'Amanah & Shiddiq: Menjunjung tinggi kejujuran intelektual, tidak memalsukan data teknis/keuangan, dan menjaga peralatan sekolah dengan penuh tanggung jawab.',
    'Etos Berkemajuan: Berpikir terbuka, mencintai ilmu dan inovasi teknologi, serta siap memberikan kontribusi nyata bagi masyarakat Kabupaten Batang.'
  ];

  // 7. Derive 7 Kebiasaan Anak Indonesia Hebat
  const tujuhKebiasaanAnakHebat = [
    { kebiasaan: '1. Bangun Pagi', implementasi: 'Disiplin hadir tepat waktu di sekolah/bengkel sebelum jam pembelajaran dimulai untuk membiasakan ritme kerja industri.' },
    { kebiasaan: '2. Beribadah', implementasi: 'Membuka dan menutup kegiatan pembelajaran dengan berdoa bersama serta menjaga shalat fardhu berjamaah di masjid sekolah.' },
    { kebiasaan: '3. Berolahraga', implementasi: 'Melakukan peregangan fisik ringan sebelum memulai kegiatan praktik untuk menjaga kebugaran jasmani dan mencegah cedera kerja.' },
    { kebiasaan: '4. Gemar Belajar', implementasi: 'Memiliki rasa ingin tahu tinggi untuk membaca buku manual kerja, artikel teknologi baru, dan referensi keilmuan terkini.' },
    { kebiasaan: '5. Makan Sehat & Bergizi', implementasi: 'Menjaga asupan gizi seimbang dan cukup minum air putih untuk menopang ketahanan konsentrasi selama sesi pembelajaran.' },
    { kebiasaan: '6. Bermasyarakat', implementasi: 'Membudayakan gotong royong, saling membantu rekan yang mengalami kesulitan, dan membersihkan area kerja bersama (budaya 5S).' },
    { kebiasaan: '7. Istirahat Cukup', implementasi: 'Mengatur waktu istirahat malam dengan bijak agar fokus, daya ingat, dan stamina kerja di sekolah selalu dalam kondisi prima.' }
  ];

  // 8. Derive LKPD Proyek
  const lkpd = {
    judulProyek: `Lembar Kerja Peserta Didik (LKPD) - Proyek ${baseTopic} [Model ${altInfo.badge}]`,
    petunjukKerja: [
      'Berdoalah bersama anggota kelompok sebelum memulai kegiatan.',
      'Periksa kelengkapan peralatan dan keselamatan kerja (K3LH) sebelum memulai.',
      `Cermati panduan kerja berbasis model ${altInfo.judul}, diskusikan pembagian peran kerja secara adil.`,
      'Catat setiap data pengamatan, hasil pengukuran, atau dokumentasi bahasa secara jujur dan akurat.',
      'Susun laporan akhir proyek dan siapkan bahan presentasi untuk gelar karya di depan kelas.'
    ],
    tugasProyek: `Rencanakan, eksekusi, dan evaluasi pengerjaan proyek terkait ${baseTopic} dengan mengintegrasikan pendekatan ${altInfo.subjudul}. Buatlah laporan portofolio kerja yang terstruktur dan aplikatif.`,
    alatBahan: [
      'Alat Pelindung Diri (APD) dan Standar K3 Sesuai Ruang Praktik',
      'Modul Ajar, Lembar Instruksi Kerja (SOP), atau Workshop Repair Manual',
      'Perangkat Praktik Utama (Peralatan Bengkel / Lab Komputer / Dokumen Kasus / Bahan Referensi)',
      'Lembar Pengamatan Data Empiris & Instrumen Rubrik Penilaian Diri'
    ],
    rubrikPenilaian: `Penilaian Proses & Keselamatan K3 (25%), Mutu Hasil Teknis Proyek [Model ${altInfo.badge}] (40%), Sikap Kolaborasi & Nilai Karakter Islami (35%). Skor maksimal 100.`
  };

  return {
    topikMateri: baseTopic,
    tujuanPembelajaran,
    sintaksPembelajaran,
    integrasiSkillsPractice,
    refleksi,
    karakterKemuhammadiyahan,
    tujuhKebiasaanAnakHebat,
    lkpd,
    alternatifTerpilih: alternatifId
  };
}
