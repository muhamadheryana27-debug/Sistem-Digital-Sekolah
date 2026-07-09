import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import * as XLSX from 'xlsx';
import { ArrowLeft, FileSpreadsheet, Download, BookOpen, UserCheck, Award, HeartHandshake, ShieldCheck } from 'lucide-react';

interface ExportPanelProps {
  onBack: () => void;
}

const ExportPanel: React.FC<ExportPanelProps> = ({ onBack }) => {
  const { currentUser, gurus, siswa, jurnalMengajar, kasusBK, nilaiEkskul } = useApp();
  const [isExporting, setIsExporting] = useState<string | null>(null);

  if (!currentUser) return null;

  // Cari profil guru yang sedang login untuk mendeteksi sub-roles secara dinamis
  const currentGuruProfile = gurus.find(g => g.id === currentUser.id || g.name === currentUser.name);
  const userSubRoles = currentGuruProfile?.subRoles || ['guru_mapel'];

  // ==========================================
  // 1. EKSPOR JURNAL MENGAJAR (GURU MATA PELAJARAN)
  // ==========================================
  const handleExportJurnalMapel = () => {
    setIsExporting('jurnal_mapel');
    try {
      // Hanya ambil draf jurnal milik guru yang sedang login
      const filteredJurnal = jurnalMengajar.filter(j => j.guruId === currentUser.id);

      const dataExcel = filteredJurnal.map((j, index) => ({
        "No": index + 1,
        "Tanggal Mengajar": j.tanggal,
        "Rombel Kelas": j.kelas,
        "Jam Ke": j.jamKe,
        "Materi Pokok Pembelajaran": j.materi,
        "Uraian Aktivitas KBM": j.aktivitas
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataExcel);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Jurnal Mengajar");
      
      // Atur lebar kolom otomatis agar tidak terpotong saat dibuka di excel
      worksheet['!cols'] = [{ wch: 5 }, { wch: 18 }, { wch: 15 }, { wch: 10 }, { wch: 35 }, { wch: 50 }];

      XLSX.writeFile(workbook, `Rekap_Jurnal_Mengajar_${currentUser.name.replace(/\s+/g, '_')}.xlsx`);
    } catch (err) {
      alert("Gagal mengunduh laporan jurnal: " + err);
    } finally {
      setIsExporting(null);
    }
  };

  // ==========================================
  // 2. EKSPOR AGENDA KELAS (WALI KELAS / GURU PIKET)
  // ==========================================
  const handleExportAgendaKelas = () => {
    setIsExporting('agenda_kelas');
    try {
      let filteredJurnal = jurnalMengajar;
      let namaFile = "Semua_Kelas";

      // Jika dia adalah wali kelas, batasi hanya mengunduh kelas binaannya saja
      if (currentUser.role !== 'admin' && currentGuruProfile?.kelasWali) {
        filteredJurnal = jurnalMengajar.filter(j => j.kelas === currentGuruProfile.kelasWali);
        namaFile = `Kelas_${currentGuruProfile.kelasWali}`;
      }

      const dataExcel = filteredJurnal.map((j, index) => ({
        "No": index + 1,
        "Tanggal": j.tanggal,
        "Kelas": j.kelas,
        "Jam": j.jamKe,
        "Materi Pokok": j.materi,
        "Aktivitas KBM": j.aktivitas
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataExcel);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Agenda Kelas");
      XLSX.writeFile(workbook, `Rekap_Agenda_${namaFile}.xlsx`);
    } catch (err) {
      alert("Gagal ekspor agenda kelas: " + err);
    } finally {
      setIsExporting(null);
    }
  };

  // ==========================================
  // 3. EKSPOR NILAI & JURNAL EKSTRAKURIKULER
  // ==========================================
  const handleExportNilaiEkskul = () => {
    setIsExporting('ekskul');
    try {
      if (!currentGuruProfile?.namaEkskul) return;

      const filteredEkskul = nilaiEkskul.filter(n => n.namaEkskul === currentGuruProfile.namaEkskul);

      const dataExcel = filteredEkskul.map((e, index) => {
        // Cari nama siswa dari state global berdasarkan ID
        const dataSiswaAsli = siswa.find(s => s.id === e.siswaId);
        return {
          "No": index + 1,
          "Nama Lengkap Siswa": dataSiswaAsli ? dataSiswaAsli.name : e.siswaId,
          "Kelas": dataSiswaAsli ? dataSiswaAsli.kelas : '-',
          "Nama Ekstrakurikuler": e.namaEkskul,
          "Predikat Kualitatif": e.predikat,
          "Catatan Progres Pembinaan": e.catatan
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(dataExcel);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Nilai Rapor Ekskul");
      
      worksheet['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 10 }, { wch: 25 }, { wch: 20 }, { wch: 50 }];
      XLSX.writeFile(workbook, `Rekap_Nilai_Ekskul_${currentGuruProfile.namaEkskul.replace(/\s+/g, '_')}.xlsx`);
    } catch (err) {
      alert("Gagal ekspor nilai ekskul: " + err);
    } finally {
      setIsExporting(null);
    }
  };

  // ==========================================
  // 4. EKSPOR CATATAN BIMBINGAN KONSELING (GURU BK / ADMIN)
  // ==========================================
  const handleExportCatatanBk = () => {
    setIsExporting('bk');
    try {
      const dataExcel = kasusBK.map((k, index) => {
        const dataSiswaAsli = siswa.find(s => s.id === k.siswaId);
        return {
          "No": index + 1,
          "Tanggal Input": k.tanggal,
          "Nama Siswa": dataSiswaAsli ? dataSiswaAsli.name : k.siswaId,
          "Kelas": k.kelas,
          "Tingkat Kategori": k.tipeKasus,
          "Rincian Kronologi Kasus": k.deskripsi,
          "Status / Penanganan Lanjutan": k.solusi
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(dataExcel);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Log Kasus BK");
      
      worksheet['!cols'] = [{ wch: 5 }, { wch: 15 }, { wch: 25 }, { wch: 10 }, { wch: 15 }, { wch: 45 }, { wch: 45 }];
      XLSX.writeFile(workbook, `Rekap_Catatan_Kasus_BK_Sekolah.xlsx`);
    } catch (err) {
      alert("Gagal ekspor rekap kasus BK: " + err);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tombol Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onBack}
          className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg p-2 transition flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> <span className="text-xs font-semibold">Kembali ke Beranda</span>
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Pusat Unduh Laporan Digital</h2>
          <p className="text-xs text-slate-500 font-medium">Cetak seluruh rekapitulasi agenda KBM harian, rekap absen, nilai akademik, dan bimbingan bk ke format Microsoft Excel.</p>
        </div>
      </div>

      {/* Grid Menu Unduh Mengikuti Aturan Hak Akses (Role Gate) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* LAPORAN 1: JURNAL MENGAJAR MANDIRI (Selalu Aktif untuk Semua Guru Mapel) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex gap-4">
            <div className="p-3 bg-sky-50 text-sky-600 rounded-xl h-11"><BookOpen className="w-5 h-5" /></div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Rekap Jurnal Mengajar Pribadi</h4>
              <p className="text-xs text-slate-400 mt-1">Mengunduh seluruh daftar riwayat draf jurnal mengajar tatap muka yang pernah Anda laporkan sendiri.</p>
            </div>
          </div>
          <button
            onClick={handleExportJurnalMapel}
            disabled={isExporting !== null}
            className="mt-5 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <Download className="w-4 h-4" /> {isExporting === 'jurnal_mapel' ? 'Memproses Excel...' : 'Unduh Jurnal Saya (.xlsx)'}
          </button>
        </div>

        {/* LAPORAN 2: REKAP AGENDA KELAS (Hanya Wali Kelas, Guru Piket, atau Admin) */}
        {(currentUser.role === 'admin' || userSubRoles.includes('wali_kelas') || userSubRoles.includes('guru_piket')) && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl h-11"><UserCheck className="w-5 h-5" /></div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  {currentGuruProfile?.kelasWali ? `Rekap Agenda Kelas ${currentGuruProfile.kelasWali}` : 'Rekap Agenda Semua Kelas'}
                </h4>
                <p className="text-xs text-slate-400 mt-1">Cetak rekapitulasi KBM lintas mata pelajaran terintegrasi bulanan untuk laporan wali murid.</p>
              </div>
            </div>
            <button
              onClick={handleExportAgendaKelas}
              disabled={isExporting !== null}
              className="mt-5 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Download className="w-4 h-4" /> {isExporting === 'agenda_kelas' ? 'Memproses Excel...' : 'Unduh Laporan Agenda (.xlsx)'}
            </button>
          </div>
        )}

        {/* LAPORAN 3: NILAI & JURNAL EKSTRAKURIKULER (Hanya Pembina Ekskul atau Admin) */}
        {(currentUser.role === 'admin' || currentGuruProfile?.namaEkskul) && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl h-11"><Award className="w-5 h-5" /></div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  {currentGuruProfile?.namaEkskul ? `Rekap Nilai Rapor Ekskul ${currentGuruProfile.namaEkskul}` : 'Rekap Nilai Ekskul'}
                </h4>
                <p className="text-xs text-slate-400 mt-1">Unduh log kualitatif predikat akhir semester (A, B, C) siswa beserta lampiran catatan perkembangan bakat.</p>
              </div>
            </div>
            <button
              onClick={handleExportNilaiEkskul}
              disabled={isExporting !== null || !currentGuruProfile?.namaEkskul}
              className="mt-5 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Download className="w-4 h-4" /> {isExporting === 'ekskul' ? 'Memproses Excel...' : 'Unduh Nilai Ekskul (.xlsx)'}
            </button>
          </div>
        )}

        {/* LAPORAN 4: LOG REKAP CATATAN BK (Hanya Guru BK atau Admin) */}
        {(currentUser.role === 'admin' || currentUser.role === 'guru_bk' || userSubRoles.includes('guru_bk')) && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex gap-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl h-11"><HeartHandshake className="w-5 h-5" /></div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Master Log Kasus & Konseling BK</h4>
                <p className="text-xs text-slate-400 mt-1">Cetak berkas komparasi grafik kerawanan/pelanggaran (Poin Ringan, Sedang, Berat, Sangat Berat) untuk kebutuhan berkala.</p>
              </div>
            </div>
            <button
              onClick={handleExportCatatanBk}
              disabled={isExporting !== null}
              className="mt-5 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Download className="w-4 h-4" /> {isExporting === 'bk' ? 'Memproses Excel...' : 'Unduh Rekap Kasus BK (.xlsx)'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default ExportPanel;