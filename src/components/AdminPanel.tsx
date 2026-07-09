import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import * as XLSX from 'xlsx';
import { ArrowLeft, FileSpreadsheet, UploadCloud, Users, GraduationCap, ShieldAlert, Save, CheckCircle, AlertCircle } from 'lucide-react';

interface AdminPanelProps {
  onBackToDashboard?: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onBackToDashboard }) => {
  const { 
    bulkInsertSiswa, 
    bulkInsertGurus, 
    bulkInsertPelanggaran, 
    addMasterPelanggaran, 
    masterPelanggarans 
  } = useApp();

  const [uploadType, setUploadType] = useState<'siswa' | 'guru' | 'pelanggaran'>('siswa');
  
  // State Input Manual Pelanggaran
  const [katManual, setKatManual] = useState('Ringan');
  const [jenisManual, setJenisManual] = useState('');
  const [bobotManual, setBobotManual] = useState('5');
  const [successManual, setSuccessManual] = useState('');

  // State Proses Unggah File Excel
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. FUNGSI UNDUH TEMPLATE FORMAT EXCEL (.xlsx)
  const handleDownloadTemplate = () => {
    let dataTemplate: any[] = [];
    let fileName = "";

    if (uploadType === 'siswa') {
      dataTemplate = [
        { "nisn": "0401234561", "nama_siswa": "Nama Siswa Contoh A", "kelas": "VII-A" },
        { "nisn": "0401234562", "nama_siswa": "Nama Siswa Contoh B", "kelas": "VII-B" }
      ];
      fileName = "template_siswa_sidiag.xlsx";
    } else if (uploadType === 'guru') {
      dataTemplate = [
        { "nama_lengkap": "Nama Guru Contoh", "is_wali_kelas": "true", "kelas_wali": "VII-A", "is_guru_piket": "false", "nama_ekstrakurikuler": "Pramuka" }
      ];
      fileName = "template_guru_sidiag.xlsx";
    } else {
      dataTemplate = [
        { "kategori": "Ringan", "jenis_kasus": "Terlambat masuk kelas setelah bel gerbang", "bobot": 5 },
        { "kategori": "Berat", "jenis_kasus": "Membawa senjata tajam atau barang terlarang", "bobot": 50 }
      ];
      fileName = "template_master_pelanggaran.xlsx";
    }

    // Pembuatan berkas workbook Excel via SheetJS
    const worksheet = XLSX.utils.json_to_sheet(dataTemplate);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template SIDIAG");

    // Eksport file biner excel langsung dari browser
    XLSX.writeFile(workbook, fileName);
  };

  // 2. FUNGSI UTAMA MEMBACA DAN PARSING FILE EXCEL (.xlsx / .xls)
  const handleFileProcess = async (file: File) => {
    if (!file) return;
    
    // Validasi ekstensi agar hanya menerima format excel resmi
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setUploadError('Format dokumen salah. Harap hanya pilih file dokumen Excel (.xlsx atau .xls).');
      return;
    }

    setIsUploading(true);
    setUploadSuccess(null);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const dataBytes = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(dataBytes, { type: 'array' });
        
        // Ambil nama lembar kerja (sheet) pertama
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Konversi baris tabel excel ke format JSON array
        const parsedData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (parsedData.length === 0) {
          throw new Error('File Excel kosong atau baris header tidak valid.');
        }

        // Normalisasi nama kolom header ke lowercase agar aman dari kesalahan typo kapitalisasi
        const normalizedData = parsedData.map(row => {
          const newRow: any = {};
          Object.keys(row).forEach(key => {
            newRow[key.trim().toLowerCase()] = String(row[key]).trim();
          });
          return newRow;
        });

        // Pemetaan payload insert ke masing-masing tabel Supabase
        if (uploadType === 'siswa') {
          const payload = normalizedData.map((d: any) => ({
            nisn: d.nisn || '',
            name: d.nama_siswa || d.name || '',
            kelas: d.kelas || '',
            statusAbsen: 'Hadir' as const,
            ekskul: null
          }));
          await bulkInsertSiswa(payload);
          setUploadSuccess(`Sukses memproses ${payload.length} data siswa dari file Excel ke tabel students!`);
        } 
        
        else if (uploadType === 'guru') {
          const payload = normalizedData.map((d: any) => {
            const roles = ['guru_mapel'];
            const isWali = d.is_wali_kelas === 'true' || d.is_wali_kelas === '1';
            const isPiket = d.is_guru_piket === 'true' || d.is_guru_piket === '1';
            
            if (isWali) roles.push('wali_kelas');
            if (isPiket) roles.push('guru_piket');
            if (d.nama_ekstrakurikuler) roles.push('pembina_ekskul');

            return {
              nip: d.nip || '',
              name: d.nama_lengkap || d.name || '',
              role: isWali ? ('guru' as const) : ('admin' as const),
              subRoles: roles as any,
              kelasWali: d.kelas_wali || null,
              namaEkskul: d.nama_ekstrakurikuler || null,
              piketDays: []
            };
          });
          await bulkInsertGurus(payload);
          setUploadSuccess(`Sukses memproses ${payload.length} data guru dari file Excel ke tabel profiles!`);
        } 
        
        else if (uploadType === 'pelanggaran') {
          const payload = normalizedData.map((d: any) => ({
            kategori: d.kategori || 'Ringan',
            jenis_cases: d.jenis_kasus || '',
            jenis_kasus: d.jenis_kasus || '',
            bobot: Number(d.bobot || 0)
          }));
          await bulkInsertPelanggaran(payload);
          setUploadSuccess(`Sukses memproses ${payload.length} master aturan pelanggaran dari file Excel ke master data BK!`);
        }

        // Penyegaran halaman otomatis agar state context mengambil data terbaru dari database
        setTimeout(() => window.location.reload(), 2000);

      } catch (err: any) {
        setUploadError(`Gagal membaca atau mem-parsing dokumen Excel: ${err.message}`);
      } finally {
        setIsUploading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleSaveManualPelanggaran = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!jenisManual.trim()) return;
    try {
      await addMasterPelanggaran({
        kategori: katManual,
        jenis_cases: jenisManual,
        jenis_kasus: jenisManual,
        bobot: Number(bobotManual)
      } as any);
      setSuccessManual('Sukses menambahkan jenis pelanggaran baru ke database Supabase!');
      setJenisManual('');
      setTimeout(() => setSuccessManual(''), 4000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <button type="button" onClick={onBackToDashboard} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-sky-600 transition cursor-pointer mb-6 group"><ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Kembali ke Beranda</button>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Navigasi Kategori */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
          <button onClick={() => { setUploadType('siswa'); setUploadSuccess(null); setUploadError(null); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition text-left cursor-pointer ${uploadType === 'siswa' ? 'bg-sky-50 text-sky-700 border border-sky-100' : 'text-slate-600 hover:bg-slate-50'}`}><GraduationCap className="w-4 h-4" /> Data Siswa</button>
          <button onClick={() => { setUploadType('guru'); setUploadSuccess(null); setUploadError(null); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition text-left cursor-pointer ${uploadType === 'guru' ? 'bg-sky-50 text-sky-700 border border-sky-100' : 'text-slate-600 hover:bg-slate-50'}`}><Users className="w-4 h-4" /> Data Guru / Staf</button>
          <button onClick={() => { setUploadType('pelanggaran'); setUploadSuccess(null); setUploadError(null); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition text-left cursor-pointer ${uploadType === 'pelanggaran' ? 'bg-sky-50 text-sky-700 border border-sky-100' : 'text-slate-600 hover:bg-slate-50'}`}><ShieldAlert className="w-4 h-4" /> Master Pelanggaran BK</button>
        </div>

        <div className="flex-1 w-full space-y-6">
          
          {/* HTML File Input Khusus berekstensi Excel */}
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept=".xlsx, .xls"
            onChange={(e) => {
              if(e.target.files && e.target.files[0]) {
                handleFileProcess(e.target.files[0]);
              }
            }}
          />

          {/* Kotak Interaktif Dropzone Unggah Dokumen Excel */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileProcess(e.dataTransfer.files[0]);
              }
            }}
            className="border-2 border-dashed border-slate-200 hover:border-sky-500 hover:bg-sky-50/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/50 transition cursor-pointer group"
          >
            <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-sky-600 shadow-sm mb-4 transition">
              <UploadCloud className="w-6 h-6 animate-bounce" style={{ animationDuration: '3s' }} />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              {isUploading ? 'Sedang Membaca & Menyimpan Dokumen Excel...' : `Klik / Seret Berkas Excel Master ${uploadType === 'pelanggaran' ? 'Pelanggaran' : uploadType === 'siswa' ? 'Siswa' : 'Guru'}`}
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Mendukung file spreadsheet dengan format ekstensi resmi .xlsx atau .xls.
            </p>
            
            {/* Tombol Unduh Template File Excel Asli */}
            <button type="button" onClick={(e) => { e.stopPropagation(); handleDownloadTemplate(); }} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-sky-600 mt-5 shadow-sm hover:bg-slate-100 transition cursor-pointer"><FileSpreadsheet className="w-4 h-4" /> Unduh Template Excel (.xlsx)</button>
          </div>

          {/* Alert Penunjuk Status Impor */}
          {uploadSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 font-medium animate-fadeIn">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> {uploadSuccess}
            </div>
          )}
          {uploadError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2 font-medium animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" /> {uploadError}
            </div>
          )}

          {/* Form Tambah Manual Khusus Pelanggaran BK */}
          {uploadType === 'pelanggaran' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              <form onSubmit={handleSaveManualPelanggaran} className="space-y-4">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">Tambah Jenis Pelanggaran Manual</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Kategori</label>
                    <select value={katManual} onChange={(e) => setKatManual(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none">
                      <option value="Ringan">Ringan</option><option value="Sedang">Sedang</option><option value="Berat">Berat</option><option value="Sangat Berat">Sangat Berat</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Bobot Poin</label>
                    <input type="number" value={bobotManual} onChange={(e) => setBobotManual(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Jenis Kasus Pelanggaran</label>
                  <input type="text" required value={jenisManual} onChange={(e) => setJenisManual(e.target.value)} placeholder="Contoh: Berkelahi di lingkungan sekolah" className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 focus:outline-none" />
                </div>
                {successManual && <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded">{successManual}</p>}
                <button type="submit" className="w-full bg-slate-950 text-white font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow"><Save className="w-4 h-4" /> Simpan Jenis Pelanggaran</button>
              </form>

              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">List Pelanggaran BK Aktif ({masterPelanggarans.length})</h5>
                <div className="max-h-[220px] overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl px-3 bg-slate-50/40">
                  {masterPelanggarans.map(p => (
                    <div key={p.id} className="py-2.5 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-semibold text-slate-800">{p.jenis_kasus}</p>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 mt-1 inline-block uppercase">{p.kategori}</span>
                      </div>
                      <span className="bg-rose-50 text-rose-700 border border-rose-100 rounded px-2 py-0.5 font-bold text-[10px] shrink-0">Poin: {p.bobot}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;