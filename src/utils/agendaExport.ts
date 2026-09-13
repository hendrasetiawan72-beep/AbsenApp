import * as XLSX from 'xlsx';
import { TeachingAgenda, TeacherProfile, ClassRoom } from '../types';

/**
 * Format date string (YYYY-MM-DD) into Indonesian standard date format
 */
export function formatIndonesianDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = [
        'Januari',
        'Februari',
        'Maret',
        'April',
        'Mei',
        'Juni',
        'Juli',
        'Agustus',
        'September',
        'Oktober',
        'November',
        'Desember',
      ];
      return `${day} ${months[monthIdx]} ${year}`;
    }
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Get Indonesian day name from date string (YYYY-MM-DD)
 */
export function getDayName(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[date.getDay()] || '';
  } catch {
    return '';
  }
}

/**
 * Format array of jamKe into display string, e.g. "Jam ke 1, 2, 3"
 */
export function formatJamKeDisplay(jamKe: number[]): string {
  if (!jamKe || jamKe.length === 0) return '-';
  const sorted = [...jamKe].sort((a, b) => a - b);
  if (sorted.length === 1) return `Jam ke-${sorted[0]}`;
  const isConsecutive = sorted.every((v, i) => i === 0 || v === sorted[i - 1] + 1);
  if (isConsecutive && sorted.length > 2) {
    return `Jam ke-${sorted[0]} s.d ${sorted[sorted.length - 1]}`;
  }
  return `Jam ke-${sorted.join(', ')}`;
}

/**
 * Exports all completed teaching agendas to Excel (.xlsx)
 */
export function exportAgendasToExcel(
  agendas: TeachingAgenda[],
  teacher: TeacherProfile,
  filterClassName?: string
): void {
  const titleClass = filterClassName || 'Semua Kelas';
  const data = agendas.map((item, index) => ({
    'No': index + 1,
    'Hari': item.hari || getDayName(item.tanggal),
    'Tanggal': formatIndonesianDate(item.tanggal),
    'Jam Ke': formatJamKeDisplay(item.jamKe),
    'Waktu Pelaksanaan': item.jamRentang || '-',
    'Kelas': item.className || '-',
    'Materi Ajar': item.materiAjar,
    'Kegiatan Pembelajaran': item.kegiatan,
    'Catatan / Kehadiran': item.catatan || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 10 }, // Hari
    { wch: 18 }, // Tanggal
    { wch: 16 }, // Jam Ke
    { wch: 20 }, // Waktu
    { wch: 16 }, // Kelas
    { wch: 35 }, // Materi Ajar
    { wch: 45 }, // Kegiatan
    { wch: 25 }, // Catatan
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Agenda Mengajar');

  const cleanName = (teacher.namaGuru || 'Guru').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Agenda_Mengajar_${cleanName}_${titleClass.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

/**
 * Exports a single completed teaching agenda to Word (.doc) format
 */
export function exportSingleAgendaToWord(
  agenda: TeachingAgenda,
  teacher: TeacherProfile,
  classRoom?: ClassRoom
): void {
  const hari = agenda.hari || getDayName(agenda.tanggal);
  const formattedDate = formatIndonesianDate(agenda.tanggal);
  const jamText = formatJamKeDisplay(agenda.jamKe);
  const className = agenda.className || classRoom?.namaKelas || 'Semua Kelas';
  const mapel = classRoom?.mataPelajaran || teacher.mataPelajaranUtama || 'Mata Pelajaran';

  const htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>Agenda Harian Mengajar Guru</title>
  <style>
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.4;
      color: #000;
      margin: 2cm;
    }
    .header-table {
      width: 100%;
      border-bottom: 3px double #000;
      padding-bottom: 8px;
      margin-bottom: 20px;
    }
    .header-center {
      text-align: center;
    }
    .header-title-org {
      font-size: 11pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .header-title-school {
      font-size: 16pt;
      font-weight: bold;
      margin: 4px 0;
    }
    .header-address {
      font-size: 9pt;
      font-style: italic;
    }
    .doc-title {
      text-align: center;
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      text-decoration: underline;
      margin: 15px 0 5px 0;
    }
    .doc-subtitle {
      text-align: center;
      font-size: 11pt;
      margin-bottom: 25px;
    }
    .info-table {
      width: 100%;
      margin-bottom: 20px;
      border-collapse: collapse;
    }
    .info-table td {
      padding: 4px 6px;
      vertical-align: top;
      font-size: 11pt;
    }
    .info-label {
      width: 25%;
      font-weight: bold;
    }
    .info-separator {
      width: 3%;
    }
    .content-box {
      border: 1px solid #333;
      padding: 12px;
      margin-bottom: 16px;
      background-color: #fafafa;
    }
    .content-box-title {
      font-weight: bold;
      font-size: 11pt;
      margin-bottom: 6px;
      text-transform: uppercase;
      color: #111;
      border-bottom: 1px dashed #ccc;
      padding-bottom: 4px;
    }
    .content-box-body {
      font-size: 11pt;
      white-space: pre-wrap;
    }
    .signatures-table {
      width: 100%;
      margin-top: 40px;
      border-collapse: collapse;
    }
    .signatures-table td {
      width: 50%;
      text-align: center;
      vertical-align: top;
      font-size: 11pt;
    }
  </style>
</head>
<body>
  <table class="header-table">
    <tr>
      <td class="header-center">
        <div class="header-title-org">MAJELIS PENDIDIKAN DASAR DAN MENENGAH PNF</div>
        <div class="header-title-org">PIMPINAN CABANG MUHAMMADIYAH BAWANG</div>
        <div class="header-title-school">SMK MUHAMMADIYAH BAWANG</div>
        <div class="header-address">Jl. Bawang-Sukorejo Km. 01, Desa Jlamprang, Kecamatan Bawang, Kabupaten Batang, Jawa Tengah 51274 • Web: www.smkmuhiba.sch.id</div>
      </td>
    </tr>
  </table>

  <div class="doc-title">AGENDA & JURNAL HARIAN MENGAJAR</div>
  <div class="doc-subtitle">Tahun Pelajaran ${teacher.tahunAjaran || '2025/2026'} - Semester ${teacher.semester || 'Ganjil'}</div>

  <table class="info-table">
    <tr>
      <td class="info-label">Nama Guru Pengampu</td>
      <td class="info-separator">:</td>
      <td><strong>${teacher.namaGuru || '-'}</strong></td>
    </tr>
    <tr>
      <td class="info-label">NIP</td>
      <td class="info-separator">:</td>
      <td>${teacher.nip || '-'}</td>
    </tr>
    <tr>
      <td class="info-label">Mata Pelajaran</td>
      <td class="info-separator">:</td>
      <td>${mapel}</td>
    </tr>
    <tr>
      <td class="info-label">Kelas</td>
      <td class="info-separator">:</td>
      <td><strong>${className}</strong></td>
    </tr>
    <tr>
      <td class="info-label">Hari / Tanggal</td>
      <td class="info-separator">:</td>
      <td>${hari}, ${formattedDate}</td>
    </tr>
    <tr>
      <td class="info-label">Jam Ke / Waktu</td>
      <td class="info-separator">:</td>
      <td>${jamText} (${agenda.jamRentang || '-'})</td>
    </tr>
  </table>

  <div class="content-box">
    <div class="content-box-title">I. Materi Ajar / Kompetensi Dasar</div>
    <div class="content-box-body">${agenda.materiAjar || '-'}</div>
  </div>

  <div class="content-box">
    <div class="content-box-title">II. Uraian Kegiatan Pembelajaran</div>
    <div class="content-box-body">${agenda.kegiatan || '-'}</div>
  </div>

  ${
    agenda.catatan
      ? `
  <div class="content-box">
    <div class="content-box-title">III. Catatan / Evaluasi / Refleksi Mengajar</div>
    <div class="content-box-body">${agenda.catatan}</div>
  </div>`
      : ''
  }

  <table class="signatures-table">
    <tr>
      <td>
        Mengetahui,<br>
        Kepala SMK Muhammadiyah Bawang
        <br><br><br><br>
        <strong>Imam Pamungkas, S.Pd., M.Si.</strong><br>
        NIP. -
      </td>
      <td>
        Bawang, ${formattedDate}<br>
        Guru Mata Pelajaran
        <br><br><br><br>
        <strong>${teacher.namaGuru || 'Guru Pendidik'}</strong><br>
        NIP. ${teacher.nip || '..............................'}
      </td>
    </tr>
  </table>
</body>
</html>`;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeTitle = (agenda.materiAjar || 'Agenda').substring(0, 25).replace(/[^a-zA-Z0-9]/g, '_');
  link.download = `Agenda_${className.replace(/[^a-zA-Z0-9]/g, '_')}_${agenda.tanggal}_${safeTitle}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports all completed teaching agendas into a consolidated Word document (.doc)
 */
export function exportAllAgendasToWord(
  agendas: TeachingAgenda[],
  teacher: TeacherProfile,
  filterClassName?: string
): void {
  const titleClass = filterClassName || 'Semua Kelas';

  const rowsHtml = agendas
    .map(
      (item, idx) => `
    <tr>
      <td style="text-align: center; border: 1px solid #333; padding: 6px;">${idx + 1}</td>
      <td style="border: 1px solid #333; padding: 6px;">${item.hari || getDayName(item.tanggal)},<br>${formatIndonesianDate(item.tanggal)}</td>
      <td style="border: 1px solid #333; padding: 6px; text-align: center;">${formatJamKeDisplay(item.jamKe)}<br><small style="color:#555;">${item.jamRentang || ''}</small></td>
      <td style="border: 1px solid #333; padding: 6px; text-align: center; font-weight: bold;">${item.className || '-'}</td>
      <td style="border: 1px solid #333; padding: 6px; font-weight: bold;">${item.materiAjar}</td>
      <td style="border: 1px solid #333; padding: 6px;">${item.kegiatan}</td>
      <td style="border: 1px solid #333; padding: 6px; font-size: 10pt;">${item.catatan || '-'}</td>
    </tr>`
    )
    .join('');

  const htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>Buku Jurnal & Agenda Mengajar Guru</title>
  <style>
    body {
      font-family: 'Times New Roman', serif;
      font-size: 11pt;
      line-height: 1.3;
      color: #000;
      margin: 1.5cm;
    }
    .header-table {
      width: 100%;
      border-bottom: 3px double #000;
      padding-bottom: 8px;
      margin-bottom: 15px;
    }
    .header-center {
      text-align: center;
    }
    .header-title-org {
      font-size: 10pt;
      font-weight: bold;
      text-transform: uppercase;
    }
    .header-title-school {
      font-size: 15pt;
      font-weight: bold;
      margin: 3px 0;
    }
    .header-address {
      font-size: 8.5pt;
      font-style: italic;
    }
    .doc-title {
      text-align: center;
      font-size: 13pt;
      font-weight: bold;
      text-transform: uppercase;
      margin: 10px 0 4px 0;
    }
    .doc-subtitle {
      text-align: center;
      font-size: 10.5pt;
      margin-bottom: 15px;
    }
    .meta-table {
      width: 100%;
      margin-bottom: 15px;
      border-collapse: collapse;
      font-size: 10.5pt;
    }
    .meta-table td {
      padding: 3px 4px;
    }
    .agenda-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 10pt;
    }
    .agenda-table th {
      border: 1px solid #333;
      padding: 6px;
      background-color: #f2f2f2;
      text-align: center;
      font-weight: bold;
    }
    .signatures-table {
      width: 100%;
      margin-top: 30px;
      border-collapse: collapse;
      page-break-inside: avoid;
    }
    .signatures-table td {
      width: 50%;
      text-align: center;
      vertical-align: top;
      font-size: 10.5pt;
    }
  </style>
</head>
<body>
  <table class="header-table">
    <tr>
      <td class="header-center">
        <div class="header-title-org">MAJELIS PENDIDIKAN DASAR DAN MENENGAH PNF</div>
        <div class="header-title-org">PIMPINAN CABANG MUHAMMADIYAH BAWANG</div>
        <div class="header-title-school">SMK MUHAMMADIYAH BAWANG</div>
        <div class="header-address">Jl. Bawang-Sukorejo Km. 01, Desa Jlamprang, Kecamatan Bawang, Kabupaten Batang, Jawa Tengah 51274 • Web: www.smkmuhiba.sch.id</div>
      </td>
    </tr>
  </table>

  <div class="doc-title">BUKU JURNAL & AGENDA HARIAN MENGAJAR GURU</div>
  <div class="doc-subtitle">Tahun Pelajaran ${teacher.tahunAjaran || '2025/2026'} - Semester ${teacher.semester || 'Ganjil'}</div>

  <table class="meta-table">
    <tr>
      <td width="20%"><strong>Nama Guru</strong></td>
      <td width="30%">: ${teacher.namaGuru || '-'}</td>
      <td width="20%"><strong>Mata Pelajaran</strong></td>
      <td width="30%">: ${teacher.mataPelajaranUtama || '-'}</td>
    </tr>
    <tr>
      <td><strong>NIP</strong></td>
      <td>: ${teacher.nip || '-'}</td>
      <td><strong>Target Kelas</strong></td>
      <td>: ${titleClass}</td>
    </tr>
  </table>

  <table class="agenda-table">
    <thead>
      <tr>
        <th style="width: 4%;">No</th>
        <th style="width: 13%;">Hari, Tanggal</th>
        <th style="width: 12%;">Jam Ke</th>
        <th style="width: 11%;">Kelas</th>
        <th style="width: 25%;">Materi Ajar</th>
        <th style="width: 25%;">Uraian Kegiatan</th>
        <th style="width: 10%;">Catatan</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <table class="signatures-table">
    <tr>
      <td>
        Mengetahui,<br>
        Kepala SMK Muhammadiyah Bawang
        <br><br><br><br>
        <strong>Imam Pamungkas, S.Pd., M.Si.</strong><br>
        NIP. -
      </td>
      <td>
        Bawang, ${formatIndonesianDate(new Date().toISOString().split('T')[0])}<br>
        Guru Pengampu Mata Pelajaran
        <br><br><br><br>
        <strong>${teacher.namaGuru || 'Guru Pendidik'}</strong><br>
        NIP. ${teacher.nip || '..............................'}
      </td>
    </tr>
  </table>
</body>
</html>`;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const cleanName = (teacher.namaGuru || 'Guru').replace(/[^a-zA-Z0-9]/g, '_');
  link.download = `Buku_Agenda_Mengajar_${cleanName}_${titleClass.replace(/[^a-zA-Z0-9]/g, '_')}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
