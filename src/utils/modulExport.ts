import { ModulAjarPromptData } from '../types';

export function exportModulToWord(data: ModulAjarPromptData): void {
  const cleanName = (data.namaGuru || 'Guru').replace(/[^a-zA-Z0-9]/g, '_');
  const safeTopic = (data.topikMateri || 'Modul_Ajar').substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
  const jurusanStr = data.selectedJurusan.join(', ');

  const tpRows = data.tujuanPembelajaran.map((tp, i) => `<li>${tp}</li>`).join('');

  const sintaksRows = data.sintaksPembelajaran.map((s) => `
    <div style="margin-bottom: 12px; padding: 10px; background-color: #f8fafc; border-left: 4px solid #4f46e5;">
      <strong style="color: #1e1b4b;">${s.tahap}</strong> 
      <span style="background-color: #e0e7ff; color: #3730a3; padding: 2px 6px; font-size: 11px; border-radius: 4px; margin-left: 6px;">${s.fokusDeepLearning}</span>
      <p style="margin: 6px 0 0 0; color: #334155; font-size: 13px;">${s.aktivitasKonkret}</p>
    </div>
  `).join('');

  const muhammadiyahRows = data.karakterKemuhammadiyahan.map((k) => `<li>${k}</li>`).join('');

  const kebiasaanRows = data.tujuhKebiasaanAnakHebat.map((k) => `
    <tr>
      <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; width: 30%;">${k.kebiasaan}</td>
      <td style="padding: 6px; border: 1px solid #cbd5e1;">${k.implementasi}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Modul Ajar Deep Learning - ${data.topikMateri}</title>
      <style>
        body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; line-height: 1.6; color: #1e293b; padding: 20px; font-size: 13px; }
        .header { text-align: center; border-bottom: 3px double #1e3a8a; padding-bottom: 14px; margin-bottom: 20px; }
        .kop-sekolah { font-size: 18px; font-weight: bold; color: #1e3a8a; text-transform: uppercase; }
        .subkop { font-size: 13px; color: #475569; }
        .judul-dokumen { font-size: 15px; font-weight: bold; margin-top: 10px; color: #047857; text-decoration: underline; }
        .section-title { font-size: 14px; font-weight: bold; background-color: #f1f5f9; padding: 6px 10px; border-left: 4px solid #0284c7; margin-top: 20px; margin-bottom: 10px; color: #0f172a; }
        table.identitas { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 13px; }
        table.identitas td { padding: 4px 8px; vertical-align: top; }
        table.identitas td.label { width: 25%; font-weight: bold; color: #334155; }
        table.tabel-data { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
        table.tabel-data th { background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
        ul { margin-top: 4px; padding-left: 20px; }
        li { margin-bottom: 4px; }
        .box-highlight { background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 6px; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="kop-sekolah">SMK MUHAMMADIYAH BAWANG, BATANG</div>
        <div class="subkop">Kompetensi Keahlian: TKR, TSM, Akuntansi, Perbankan Syari'ah, TJAT, dan TKJ</div>
        <div class="subkop">Jl. Raya Bawang - Sukorejo KM 01, Bawang, Kabupaten Batang, Jawa Tengah</div>
        <div class="judul-dokumen">MODUL AJAR KURIKULUM MERDEKA BERPENDEKATAN DEEP LEARNING</div>
      </div>

      <div class="section-title">1. IDENTITAS MATERI & MATA PELAJARAN</div>
      <table class="identitas">
        <tr>
          <td class="label">Kurikulum</td>
          <td>: ${data.kurikulum}</td>
          <td class="label">Mata Pelajaran</td>
          <td>: ${data.mataPelajaran || 'Kejuruan'}</td>
        </tr>
        <tr>
          <td class="label">Fase / Kelas</td>
          <td>: ${data.faseKelas}</td>
          <td class="label">Nama Kelas / Jurusan</td>
          <td>: ${data.namaKelasJurusan} (${jurusanStr})</td>
        </tr>
        <tr>
          <td class="label">Topik / Materi</td>
          <td colspan="3">: <strong>${data.topikMateri}</strong></td>
        </tr>
        <tr>
          <td class="label">Pendekatan Pembelajaran</td>
          <td>: ${data.pendekatan}</td>
          <td class="label">Metode Pembelajaran</td>
          <td>: ${data.metodePembelajaran}</td>
        </tr>
        <tr>
          <td class="label">Durasi Proyek</td>
          <td>: ${data.durasiProyek}</td>
          <td class="label">Nama Guru Pengampu</td>
          <td>: <strong>${data.namaGuru}</strong></td>
        </tr>
      </table>

      <div class="section-title">2. CAPAIAN PEMBELAJARAN (CP) & ALUR TUJUAN PEMBELAJARAN (ATP)</div>
      <div style="margin-bottom: 10px;">
        <strong>Capaian Pembelajaran (CP) Fase:</strong>
        <p style="margin: 4px 0; padding: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px;">${data.capaianPembelajaran}</p>
      </div>
      <div>
        <strong>Alur Tujuan Pembelajaran (ATP):</strong>
        <p style="margin: 4px 0; padding: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; white-space: pre-line;">${data.alurTujuanPembelajaran}</p>
      </div>

      <div class="section-title">3. TUJUAN PEMBELAJARAN (PENJABARAN ATP & KKTP)</div>
      <ul>
        ${tpRows}
      </ul>

      <div class="section-title">4. SINTAKS METODE PEMBELAJARAN (AKTIVITAS KONKRET DEEP LEARNING)</div>
      ${sintaksRows}

      <div class="section-title">8. INTEGRASI SKILLS + PRACTICE (DUNIA INDUSTRI / DUDI)</div>
      <table class="identitas" style="border: 1px solid #e2e8f0; padding: 6px;">
        <tr>
          <td class="label" style="width: 25%;">Hard Skills Vokasi</td>
          <td>: ${data.integrasiSkillsPractice.hardSkills}</td>
        </tr>
        <tr>
          <td class="label">Soft Skills</td>
          <td>: ${data.integrasiSkillsPractice.softSkills}</td>
        </tr>
        <tr>
          <td class="label">Praktik Nyata Vokasi</td>
          <td>: ${data.integrasiSkillsPractice.praktikNyata}</td>
        </tr>
        <tr>
          <td class="label">K3LH & Budaya Kerja</td>
          <td>: ${data.integrasiSkillsPractice.keselamatanKerjaK3}</td>
        </tr>
      </table>

      <div class="section-title">10. REFLEKSI SISWA & GURU</div>
      <div style="margin-bottom: 8px;">
        <strong>Refleksi Peserta Didik:</strong>
        <p style="font-style: italic; color: #475569; margin: 4px 0 10px 0;">"${data.refleksi.refleksiSiswa}"</p>
      </div>
      <div>
        <strong>Refleksi Pendidik:</strong>
        <p style="font-style: italic; color: #475569; margin: 4px 0;">"${data.refleksi.refleksiGuru}"</p>
      </div>

      <div class="section-title">PENGUATAN KARAKTER KEMUHAMMADIYAHAN</div>
      <ul>
        ${muhammadiyahRows}
      </ul>

      <div class="section-title">PETA KONSEP KARAKTER 7 KEBIASAAN ANAK INDONESIA HEBAT</div>
      <table class="tabel-data">
        <thead>
          <tr>
            <th>Karakter Kebiasaan</th>
            <th>Bentuk Implementasi Nyata di SMK Muhammadiyah Bawang</th>
          </tr>
        </thead>
        <tbody>
          ${kebiasaanRows}
        </tbody>
      </table>

      <br><br>
      <table style="width: 100%; margin-top: 30px; font-size: 13px;">
        <tr>
          <td style="width: 60%;">
            Mengetahui,<br>
            Kepala SMK Muhammadiyah Bawang<br><br><br><br>
            <strong>Imam Santoso, S.Pd.I., M.Pd.</strong><br>
            NBM: 1085 412
          </td>
          <td style="width: 40%; text-align: left;">
            Bawang, Batang, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br>
            Guru Mata Pelajaran,<br><br><br><br>
            <strong>${data.namaGuru}</strong>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Modul_Ajar_${safeTopic}_${cleanName}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportLkpdToWord(data: ModulAjarPromptData): void {
  const cleanName = (data.namaGuru || 'Guru').replace(/[^a-zA-Z0-9]/g, '_');
  const safeTopic = (data.lkpd.judulProyek || 'LKPD').substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
  const jurusanStr = data.selectedJurusan.join(', ');

  const petunjukRows = data.lkpd.petunjukKerja.map((p, i) => `<li>${p}</li>`).join('');
  const alatRows = data.lkpd.alatBahan.map((a) => `<li>${a}</li>`).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${data.lkpd.judulProyek}</title>
      <style>
        body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; line-height: 1.6; color: #1e293b; padding: 20px; font-size: 13px; }
        .header { text-align: center; border-bottom: 3px double #047857; padding-bottom: 12px; margin-bottom: 15px; }
        .kop-sekolah { font-size: 17px; font-weight: bold; color: #047857; text-transform: uppercase; }
        .subkop { font-size: 12px; color: #64748b; }
        .doc-title { font-size: 16px; font-weight: bold; margin-top: 8px; color: #0f172a; text-transform: uppercase; }
        .table-id { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .table-id td { padding: 4px; border: 1px solid #cbd5e1; }
        .section-box { border: 1px solid #cbd5e1; border-radius: 4px; padding: 10px; margin-bottom: 14px; background: #f8fafc; }
        .section-header { font-weight: bold; color: #0f172a; margin-bottom: 6px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
        table.observation { width: 100%; border-collapse: collapse; margin-top: 10px; }
        table.observation th, table.observation td { border: 1px solid #334155; padding: 8px; }
        table.observation th { background: #e2e8f0; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="kop-sekolah">SMK MUHAMMADIYAH BAWANG, BATANG</div>
        <div class="subkop">Teknik Kendaraan Ringan • Teknik Sepeda Motor • Akuntansi • Perbankan Syari'ah • TJAT • TKJ</div>
        <div class="doc-title">${data.lkpd.judulProyek}</div>
      </div>

      <table class="table-id">
        <tr>
          <td style="width: 20%; font-weight: bold; background: #f1f5f9;">Mata Pelajaran</td>
          <td style="width: 30%;">${data.mataPelajaran || 'Kejuruan'}</td>
          <td style="width: 20%; font-weight: bold; background: #f1f5f9;">Nama Kelompok</td>
          <td style="width: 30%;">Kelompok: ..................</td>
        </tr>
        <tr>
          <td style="font-weight: bold; background: #f1f5f9;">Fase / Kelas</td>
          <td>${data.faseKelas}</td>
          <td style="font-weight: bold; background: #f1f5f9;">Anggota Tim</td>
          <td>1. .....................................<br>2. .....................................<br>3. .....................................<br>4. .....................................</td>
        </tr>
        <tr>
          <td style="font-weight: bold; background: #f1f5f9;">Jurusan</td>
          <td>${jurusanStr}</td>
          <td style="font-weight: bold; background: #f1f5f9;">Tanggal Praktik</td>
          <td>...........................................</td>
        </tr>
      </table>

      <div class="section-box">
        <div class="section-header">A. PETUNJUK KESELAMATAN KERJA & INSTRUKSI PRAKTIK (K3LH)</div>
        <ol style="margin-top: 4px; padding-left: 20px;">
          ${petunjukRows}
        </ol>
      </div>

      <div class="section-box">
        <div class="section-header">B. ALAT DAN BAHAN YANG DIPERLUKAN</div>
        <ul style="margin-top: 4px; padding-left: 20px;">
          ${alatRows}
        </ul>
      </div>

      <div class="section-box" style="background: #ffffff; border-color: #047857;">
        <div class="section-header" style="color: #047857;">C. TUGAS PROYEK UTAMA (DEEP LEARNING VOCATIONAL PRACTICE)</div>
        <p style="margin: 6px 0; font-size: 13px; line-height: 1.6;">${data.lkpd.tugasProyek}</p>
      </div>

      <div class="section-box" style="background: #ffffff;">
        <div class="section-header">D. TABEL HASIL OBSERVASI, PENGUKURAN & CATATAN PRAKTIK</div>
        <table class="observation">
          <thead>
            <tr>
              <th style="width: 8%;">No</th>
              <th style="width: 35%;">Item Pengujian / Komponen yang Diamati</th>
              <th style="width: 25%;">Spesifikasi / Standar SOP</th>
              <th style="width: 20%;">Hasil Pengukuran / Kondisi</th>
              <th style="width: 12%;">Kesimpulan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="text-align: center;">1</td>
              <td>Pemeriksaan Awal & Kelengkapan K3</td>
              <td>Sesuai APD Standar Industri</td>
              <td>&nbsp;</td>
              <td>[ ] Baik [ ] Perlu Perbaikan</td>
            </tr>
            <tr>
              <td style="text-align: center;">2</td>
              <td>Identifikasi Parameter / Komponen Kunci</td>
              <td>Manual Book / Dokumen Teknis</td>
              <td>&nbsp;</td>
              <td>[ ] Baik [ ] Perlu Perbaikan</td>
            </tr>
            <tr>
              <td style="text-align: center;">3</td>
              <td>Pengujian Fungsional / Diagnostik</td>
              <td>Tidak ada malfungsi / error</td>
              <td>&nbsp;</td>
              <td>[ ] Baik [ ] Perlu Perbaikan</td>
            </tr>
            <tr>
              <td style="text-align: center;">4</td>
              <td>Penerapan Budaya Kerja 5S / Kebersihan</td>
              <td>Area kerja bersih & alat ditata rapi</td>
              <td>&nbsp;</td>
              <td>[ ] Baik [ ] Perlu Perbaikan</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section-box">
        <div class="section-header">E. LEMBAR REFLEKSI DIRI SISWA (DEEP LEARNING REFLECTION)</div>
        <p>1. Apa pengalaman paling bermakna (meaningful) yang saya peroleh hari ini?</p>
        <p style="border-bottom: 1px dotted #94a3b8; height: 30px;"></p>
        <p>2. Bagaimana saya menerapkan nilai amanah, ketelitian, dan kejujuran selama kegiatan praktik?</p>
        <p style="border-bottom: 1px dotted #94a3b8; height: 30px;"></p>
      </div>

      <div class="section-box">
        <div class="section-header">F. KRITERIA RUBRIK PENILAIAN</div>
        <p style="margin: 4px 0;">${data.lkpd.rubrikPenilaian}</p>
      </div>

      <br>
      <table style="width: 100%; margin-top: 20px;">
        <tr>
          <td style="width: 50%; text-align: center;">
            Peserta Didik (Ketua Kelompok),<br><br><br><br>
            ( ..................................................... )
          </td>
          <td style="width: 50%; text-align: center;">
            Guru Pengampu / Instruktur,<br><br><br><br>
            <strong>${data.namaGuru}</strong>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `LKPD_${safeTopic}_${cleanName}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
