import * as XLSX from 'xlsx';
import {
  Student,
  SavingTransaction,
  StudentSavingSummary,
  ClassRoom,
  TeacherProfile,
} from '../types';

/**
 * Format currency to Rupiah string
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate per-student savings summaries for a given class
 */
export function calculateStudentSavingSummaries(
  students: Student[],
  transactions: SavingTransaction[]
): StudentSavingSummary[] {
  return students.map((student, idx) => {
    const studentTxs = transactions.filter((tx) => tx.studentId === student.id);

    let totalSetor = 0;
    let totalTarik = 0;
    let lastDate = '';

    // Sort chronologically
    studentTxs
      .slice()
      .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime())
      .forEach((tx) => {
        if (tx.jenis === 'setor') {
          totalSetor += Number(tx.nominal) || 0;
        } else if (tx.jenis === 'tarik') {
          totalTarik += Number(tx.nominal) || 0;
        }
        lastDate = tx.tanggal;
      });

    return {
      student,
      totalSetor,
      totalTarik,
      saldoAkhir: totalSetor - totalTarik,
      transaksiTerakhir: lastDate || '-',
      jumlahTransaksi: studentTxs.length,
    };
  });
}

/**
 * Generate parent WhatsApp message template
 */
export function buildParentSavingReportMessage(
  summary: StudentSavingSummary,
  cls: ClassRoom,
  teacher: TeacherProfile
): string {
  const s = summary.student;
  const today = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    `*LAPORAN TABUNGAN HARIAN SISWA*\n` +
    `*SMK MUHAMMADIYAH BAWANG*\n` +
    `Tahun Ajaran: ${teacher.tahunAjaran || '2025/2026'} | Semester: ${teacher.semester || 'Ganjil'}\n\n` +
    `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
    `Yth. Bapak/Ibu Wali dari:\n` +
    `• *Nama Siswa*: *${s.nama}*\n` +
    `• *NISN*: ${s.nisn || '-'}\n` +
    `• *Kelas*: ${cls.namaKelas}\n\n` +
    `Berikut rincian saldo tabungan ananda per ${today}:\n` +
    `💵 *Total Setoran*: ${formatRupiah(summary.totalSetor)}\n` +
    `📤 *Total Penarikan*: ${formatRupiah(summary.totalTarik)}\n` +
    `💰 *SALDO TABUNGAN SAAT INI*: *${formatRupiah(summary.saldoAkhir)}*\n\n` +
    `Transaksi Terakhir: ${summary.transaksiTerakhir}\n\n` +
    `Terima kasih atas kepercayaannya dalam membiasakan ananda menabung sejak dini.\n\n` +
    `Wassalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
    `*Wali Kelas / Guru Pengampu:*\n` +
    `*${teacher.namaGuru || 'Guru SMK Muhammadiyah Bawang'}*\n` +
    `NIP/NBM: ${teacher.nip || teacher.nbm || '-'}\n` +
    `SMK Muhammadiyah Bawang`
  );
}

/**
 * Export savings ledger to multi-sheet Excel spreadsheet
 */
export function exportSavingsToSpreadsheet(
  summaries: StudentSavingSummary[],
  transactions: SavingTransaction[],
  cls: ClassRoom,
  teacher: TeacherProfile
): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Rekap Saldo Siswa
  const rekapData = summaries.map((item, idx) => ({
    'No': idx + 1,
    'NISN': item.student.nisn || '-',
    'Nama Siswa': item.student.nama,
    'L/P': item.student.gender,
    'Total Setoran (Rp)': item.totalSetor,
    'Total Penarikan (Rp)': item.totalTarik,
    'Saldo Akhir (Rp)': item.saldoAkhir,
    'Transaksi Terakhir': item.transaksiTerakhir,
    'Jumlah Transaksi': item.jumlahTransaksi,
    'No. HP Wali Murid': item.student.noHpOrangTua || '-',
    'Status': item.saldoAkhir > 0 ? 'Aktif' : 'Nol',
  }));

  const wsRekap = XLSX.utils.json_to_sheet(rekapData);

  // Set column widths for Sheet 1
  wsRekap['!cols'] = [
    { wch: 6 },  // No
    { wch: 14 }, // NISN
    { wch: 28 }, // Nama
    { wch: 6 },  // L/P
    { wch: 18 }, // Setor
    { wch: 18 }, // Tarik
    { wch: 18 }, // Saldo
    { wch: 16 }, // Transaksi Terakhir
    { wch: 12 }, // Jml
    { wch: 18 }, // No HP
    { wch: 10 }, // Status
  ];

  XLSX.utils.book_append_sheet(wb, wsRekap, 'Rekap Saldo Kelas');

  // Sheet 2: Riwayat Transaksi Detail
  const txData = transactions
    .slice()
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
    .map((tx, idx) => ({
      'No': idx + 1,
      'Tanggal': tx.tanggal,
      'Nama Siswa': tx.studentName,
      'NISN': tx.nisn || '-',
      'Jenis': tx.jenis === 'setor' ? 'SETORAN (+)' : 'PENARIKAN (-)',
      'Nominal (Rp)': tx.nominal,
      'Kategori': tx.kategori.replace('_', ' ').toUpperCase(),
      'Keterangan': tx.keterangan || '-',
      'Petugas': tx.petugas || 'Wali Kelas',
    }));

  const wsTx = XLSX.utils.json_to_sheet(txData);
  wsTx['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 28 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 30 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTx, 'Riwayat Transaksi');

  // Sheet 3: Laporan Orang Tua (Pesan Siap Pakai)
  const pesanData = summaries.map((item, idx) => ({
    'No': idx + 1,
    'Nama Siswa': item.student.nama,
    'No HP Orang Tua': item.student.noHpOrangTua || '-',
    'Saldo Akhir (Rp)': item.saldoAkhir,
    'Pesan WhatsApp': buildParentSavingReportMessage(item, cls, teacher),
  }));

  const wsPesan = XLSX.utils.json_to_sheet(pesanData);
  wsPesan['!cols'] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 18 },
    { wch: 16 },
    { wch: 60 },
  ];
  XLSX.utils.book_append_sheet(wb, wsPesan, 'Pesan Laporan Ortu');

  // Generate filename
  const cleanClassName = cls.namaKelas.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `Laporan_Tabungan_${cleanClassName}_${dateStr}.xlsx`;

  XLSX.writeFile(wb, filename);
}
