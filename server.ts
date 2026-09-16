import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getDb } from './src/db/index.ts';
import { cloudClasses, cloudActivityLogs } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import { generateFieldsFromCpAndAtpWithAlternatif } from './src/utils/alternatifGenerateEngine.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      cloudSqlConfigured: Boolean(process.env.SQL_HOST),
      timestamp: new Date().toISOString(),
    });
  });

  // AI Gemini API - Generate Modul Deep Learning (Full Prompt)
  app.post('/api/ai/generate-modul', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(200).json({
          hasApiKey: false,
          message: 'API Key Gemini belum terpasang. Menggunakan generator lokal otomatis SMK Muhammadiyah Bawang.',
        });
      }

      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      return res.json({
        hasApiKey: true,
        text: response.text,
      });
    } catch (error: any) {
      console.error('Error generating modul via Gemini:', error);
      return res.status(500).json({ error: error.message || 'Gemini API Error' });
    }
  });

  // AI Gemini API - Generate Form Fields from CP & ATP
  app.post('/api/ai/generate-fields', async (req, res) => {
    const {
      capaianPembelajaran = '',
      alurTujuanPembelajaran = '',
      mataPelajaran = '',
      topikMateri = '',
      faseKelas = 'Fase F (Kelas XI)',
      selectedJurusan = ['TKR'],
      namaGuru = 'Guru SMK Muhammadiyah Bawang',
      alternatif = 'pjbl-tefa',
      customApiKey,
    } = req.body;

    if (!capaianPembelajaran && !alurTujuanPembelajaran && !topikMateri) {
      return res.status(400).json({
        success: false,
        error: 'Capaian Pembelajaran (CP) atau Alur Tujuan Pembelajaran (ATP) harus diisi terlebih dahulu.',
      });
    }

    const LEAKED_KEY = 'AIzaSyCPvX8jf3oTUnyPmv-2E8UoAi9XxreNmEQ';
    const rawApiKey = (customApiKey || (req.headers['x-gemini-api-key'] as string) || process.env.GEMINI_API_KEY || '').trim();
    const isLeaked = rawApiKey === LEAKED_KEY;
    const hasUsableKey = Boolean(rawApiKey) && !isLeaked;

    if (hasUsableKey) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({
          apiKey: rawApiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const jurusanList = Array.isArray(selectedJurusan) ? selectedJurusan.join(', ') : 'Semua Jurusan';
        const promptText = `
Sebagai pakar kurikulum vokasi SMK Muhammadiyah Bawang (Kabupaten Batang, Jawa Tengah) dan perancang modul ajar Kurikulum Merdeka Belajar (SMK PK) dengan pendekatan Deep Learning (Mindful, Meaningful, Joyful, Interkoneksi), analisis CP dan ATP berikut ini lalu buat rincian lengkap untuk mengisi modul ajar dan LKPD.

INFORMASI DASAR:
- Satuan Pendidikan: SMK Muhammadiyah Bawang (Batang, Jateng - dekat kawasan industri KITB)
- Guru Pengampu: ${namaGuru || 'Guru SMK Muhammadiyah Bawang'}
- Fase/Kelas: ${faseKelas || 'Fase F (Kelas XI)'}
- Konsentrasi Jurusan: ${jurusanList}
- Mata Pelajaran: ${mataPelajaran || 'Otomatis ditentukan dari CP/ATP'}
- Topik/Materi Eksisting: ${topikMateri || 'Otomatis disimpulkan'}
- Variasi Pendekatan Skenario: ${alternatif || 'PjBL / Teaching Factory TEFA'}

CAPAIAN PEMBELAJARAN (CP):
"""${capaianPembelajaran || '(Analisis dari ATP)'}"""

ALUR TUJUAN PEMBELAJARAN (ATP):
"""${alurTujuanPembelajaran || '(Analisis dari CP)'}"""

INSTRUKSI WAJIB:
Hasilkan sebuah objek JSON valid dengan struktur yang persis seperti berikut (tanpa pembungkus teks tambahan, langsung JSON):
{
  "topikMateri": "string judul topik pembelajaran yang ringkas, presisi dan aplikatif",
  "mataPelajaran": "string nama mata pelajaran spesifik",
  "tujuanPembelajaran": [
    "Indikator 1: Peserta didik mampu ... dengan kriteria ...",
    "Indikator 2: Peserta didik dapat ...",
    "Indikator 3: Peserta didik terampil ...",
    "Indikator 4: Peserta didik menunjukkan sikap ..."
  ],
  "sintaksPembelajaran": [
    {
      "tahap": "Tahap 1: Orientasi Bermakna & Apersepsi (Kegiatan Awal)",
      "fokusDeepLearning": "Mindful",
      "aktivitasKonkret": "deskripsi aktivitas awal kontekstual yang membangkitkan kesadaran penuh dan rasa ingin tahu siswa"
    },
    {
      "tahap": "Tahap 2: Investigasi Masalah & Bedah Konsep (Kegiatan Inti 1)",
      "fokusDeepLearning": "Meaningful",
      "aktivitasKonkret": "deskripsi investigasi mendalam mengaitkan teori dengan studi kasus riil industri/bengkel"
    },
    {
      "tahap": "Tahap 3: Eksplorasi Praktik / PjBL Kolaboratif (Kegiatan Inti 2)",
      "fokusDeepLearning": "Joyful",
      "aktivitasKonkret": "deskripsi pelaksanaan praktik nyata secara kolaboratif, interaktif dan menyenangkan"
    },
    {
      "tahap": "Tahap 4: Pengujian, Presentasi & Validasi Industri (Kegiatan Inti 3)",
      "fokusDeepLearning": "Joyful",
      "aktivitasKonkret": "deskripsi pengujian hasil kerja, presentasi kelompok dan pemberian umpan balik konstruktif"
    },
    {
      "tahap": "Tahap 5: Refleksi Bermakna, Asesmen & Interkoneksi (Kegiatan Penutup)",
      "fokusDeepLearning": "Interkoneksi",
      "aktivitasKonkret": "deskripsi penarikan kesimpulan holistik, refleksi diri, kuis penguatan dan doa penutup"
    }
  ],
  "integrasiSkillsPractice": {
    "hardSkills": "rincian keterampilan teknis (alat, instrumen, prosedur, software/hardware)",
    "softSkills": "rincian keterampilan non-teknis (komunikasi kerja, kolaborasi tim, ketelitian, etos mandiri)",
    "praktikNyata": "rincian studi kasus / job sheet riil relevan bengkel/lab SMK dan standar industri DUDI Batang",
    "keselamatanKerjaK3": "rincian SOP K3LH, budaya industri 5S/5R, penggunaan APD dan pencegahan bahaya kerja"
  },
  "refleksi": {
    "refleksiSiswa": "3 butir pertanyaan refleksi mindful untuk siswa menilai pemahaman dan perasaan mereka",
    "refleksiGuru": "panduan refleksi evaluasi bagi guru untuk perbaikan pembelajaran pertemuan berikutnya"
  },
  "karakterKemuhammadiyahan": [
    "Fastabiqul Khairat: berlomba-lomba dalam kebaikan dan kualitas kerja profesional",
    "Etos Pencerahan KH. Ahmad Dahlan: gemar berkarya nyata dan berilmu amaliah",
    "Kejujuran & Amanah: menjaga integritas data kerja, keselamatan alat, dan tanggung jawab",
    "Islam Berkemajuan: inovatif, adaptif terhadap perkembangan teknologi dan peduli lingkungan"
  ],
  "tujuhKebiasaanAnakHebat": [
    { "kebiasaan": "Bangun Pagi", "implementasi": "Hadir tepat waktu dan menyiapkan perlengkapan praktik secara mandiri" },
    { "kebiasaan": "Beribadah", "implementasi": "Membuka dan menutup kegiatan belajar dengan doa, shalat dhuha/dzuhur berjamaah" },
    { "kebiasaan": "Berolahraga", "implementasi": "Peregangan ergonomi kerja sebelum aktivitas bengkel/lab" },
    { "kebiasaan": "Makan Sehat & Bergizi", "implementasi": "Menjaga stamina fisik dan membawa bekal nutrisi seimbang" },
    { "kebiasaan": "Gemar Membaca", "implementasi": "Literasi manual book industri, SOP teknis, dan referensi terpercaya" },
    { "kebiasaan": "Bermasyarakat", "implementasi": "Gotong royong membersihkan area bengkel (5S) dan berkolaborasi ramah" },
    { "kebiasaan": "Istirahat Cukup", "implementasi": "Manajemen waktu belajar seimbang demi fokus kerja yang aman dan terjaga" }
  ],
  "lkpd": {
    "judulProyek": "Judul LKPD Proyek / Praktikum Kontekstual",
    "petunjukKerja": [
      "1. Berdoa sebelum memulai dan pastikan APD terpasang lengkap",
      "2. Pelajari jobsheet dan periksa kelaikan alat/bahan",
      "3. Laksanakan langkah kerja secara runtut dan catat data hasil observasi",
      "4. Lakukan evaluasi mandiri dan bersihkan area kerja (5S)"
    ],
    "tugasProyek": "Uraian tugas atau skenario masalah industri yang harus diselesaikan peserta didik",
    "alatBahan": [
      "Alat ukur dan perkakas kerja spesifik",
      "Bahan praktik habis pakai",
      "Manual book / modul referensi",
      "Lembar kerja dan alat tulis"
    ],
    "rubrikPenilaian": "Sikap (K3 & 5S): 20% | Proses & Keterampilan Teknis: 50% | Hasil Akhir & Laporan: 30%"
  }
}
`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: promptText,
          config: {
            systemInstruction:
              'Anda adalah perancang modul ajar profesional SMK Muhammadiyah Bawang Batang (Kurikulum Merdeka SMK PK). Output Anda HANYA berupa JSON valid yang lengkap dan mendalam sesuai struktur yang diminta.',
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });

        const responseText = response.text || '';
        const cleaned = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsedData = JSON.parse(cleaned);

        return res.json({
          success: true,
          source: 'gemini-ai',
          model: 'gemini-3.8-flash',
          data: parsedData,
        });
      } catch (geminiError: any) {
        console.warn('Gemini live call error, using vocational curriculum engine:', geminiError.message);
      }
    }

    // Fallback cerdas: Rule-based vocational engine SMK Muhammadiyah Bawang
    try {
      const generated = generateFieldsFromCpAndAtpWithAlternatif(
        capaianPembelajaran,
        alurTujuanPembelajaran,
        selectedJurusan,
        faseKelas,
        namaGuru,
        { topikMateri, mataPelajaran },
        alternatif
      );

      return res.json({
        success: true,
        source: hasUsableKey ? 'gemini-fallback' : 'local-engine',
        model: hasUsableKey ? 'gemini-3.8-flash' : 'curriculum-engine',
        notice: isLeaked
          ? 'Kunci API lama dilaporkan dicabut (revoked). Silakan daftarkan GEMINI_API_KEY baru Anda di Secrets AI Studio. Kolom otomatis digenerate dengan mesin kurikulum vokasi SMK Muhammadiyah Bawang.'
          : !rawApiKey
          ? 'GEMINI_API_KEY belum disetel pada runtime. Kolom otomatis digenerate dengan mesin kurikulum vokasi SMK Muhammadiyah Bawang.'
          : undefined,
        data: generated,
      });
    } catch (engineError: any) {
      console.error('Curriculum engine error:', engineError);
      return res.status(500).json({
        success: false,
        error: 'Gagal mengolah kurikulum: ' + (engineError.message || 'Unknown error'),
      });
    }
  });

  // Cloud SQL instance status
  app.get('/api/cloudsql/status', (req, res) => {
    const isConfigured = Boolean(process.env.SQL_HOST);
    res.json({
      configured: isConfigured,
      host: process.env.SQL_HOST ? '***.***.***.***' : null,
      database: process.env.SQL_DB_NAME || 'postgres',
      message: isConfigured
        ? 'Cloud SQL terhubung aktif'
        : 'Cloud SQL instance ai-studio-09636d11 telah di-provision di asia-southeast1. Menunggu konfigurasi credential lingkungan.',
    });
  });

  // Cloud SQL API - Sync Class
  app.post('/api/cloudsql/sync-class', requireAuth, async (req: AuthRequest, res) => {
    try {
      const db = getDb();
      if (!db) {
        return res.status(503).json({
          error: 'Cloud SQL database belum dikonfigurasi pada environment runtime ini',
        });
      }

      const userUid = req.user?.uid || 'anonymous';
      const { classId, namaKelas, mataPelajaran, kkm, totalStudents } = req.body;

      if (!classId || !namaKelas || !mataPelajaran) {
        return res.status(400).json({ error: 'Data kelas tidak lengkap' });
      }

      await db
        .insert(cloudClasses)
        .values({
          classId,
          userUid,
          namaKelas,
          mataPelajaran,
          kkm: kkm || 75,
          totalStudents: totalStudents || 0,
        })
        .onConflictDoUpdate({
          target: cloudClasses.classId,
          set: {
            namaKelas,
            mataPelajaran,
            kkm: kkm || 75,
            totalStudents: totalStudents || 0,
          },
        });

      await db.insert(cloudActivityLogs).values({
        userUid,
        action: 'SYNC_CLASS',
        details: `Sinkronisasi kelas ${namaKelas} (${classId})`,
      });

      return res.json({ success: true, message: 'Kelas berhasil disinkronkan ke Cloud SQL' });
    } catch (error: any) {
      console.error('Error syncing class to Cloud SQL:', error);
      return res.status(500).json({ error: error.message || 'Internal database error' });
    }
  });

  // Cloud SQL API - List Classes
  app.get('/api/cloudsql/classes', requireAuth, async (req: AuthRequest, res) => {
    try {
      const db = getDb();
      if (!db) {
        return res.status(503).json({
          error: 'Cloud SQL database belum dikonfigurasi',
        });
      }

      const userUid = req.user?.uid;
      if (!userUid) {
        return res.status(401).json({ error: 'User tidak teridentifikasi' });
      }

      const results = await db
        .select()
        .from(cloudClasses)
        .where(eq(cloudClasses.userUid, userUid));

      return res.json({ classes: results });
    } catch (error: any) {
      console.error('Error querying classes from Cloud SQL:', error);
      return res.status(500).json({ error: error.message || 'Internal database error' });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
