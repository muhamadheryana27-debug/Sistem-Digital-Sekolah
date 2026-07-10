import React, { useState, useRef, FormEvent } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import * as XLSX from 'xlsx';
import { 
  ArrowLeft, FileSpreadsheet, UploadCloud, Users, GraduationCap, 
  ShieldAlert, Save, CheckCircle, AlertCircle, PlusCircle, Edit2, Trash2, X, Lock
} from 'lucide-react';

interface AdminPanelProps {
  onBackToDashboard?: () => void;
}

const DAYS_OF_WEEK = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

const AdminPanel: React.FC<AdminPanelProps> = ({ onBackToDashboard }) => {
  const { 
    bulkInsertSiswa, 
    bulkInsertGurus, 
    bulkInsertPelanggaran, 
    addMasterPelanggaran, 
    masterPelanggarans,
    gurus,
    siswa
  } = useApp();

  // Tab Utama Admin
  const [mainTab, setMainTab] = useState<'excel_import' | 'manage_data'>('excel_import');
  const [uploadType, setUploadType] = useState<'siswa' | 'guru' | 'pelanggaran'>('siswa');
  const [activeSubTab, setActiveSubTab] = useState<'siswa' | 'guru'>('siswa');
  
  // State Input Manual Pelanggaran Master
  const [katManual, setKatManual] = useState('Ringan');
  const [jenisManual, setJenisManual] = useState('');
  const [bobotManual, setBobotManual] = useState('5');
  const [successManual, setSuccessManual] = useState('');

  // State Pendaftaran Siswa Baru
  const [newSiswa, setNewSiswa] = useState({ nisn: '', name: '', kelas: '' });
  
  // State Pendaftaran Guru Baru (Dengan Input Manual Mapel, Ekskul & Pilihan Role)
  const [newGuru, setNewGuru] = useState({ 
    name: '', 
    username: '', 
    password: '', 
    role: 'guru_mapel', 
    mataPelajaran: '',  
    isWaliKelas: false, 
    kelasWali: '', 
    isGuruPiket: false, 
    piketDays: [] as string[], 
    namaEkskul: ''     
  });

  // State Modal Aksi Edit & Manajemen Kata Sandi
  const [editingItem, setEditingItem] = useState<{ type: 'siswa' | 'guru'; data: any } | null>(null);
  const [passwordModal, setPasswordModal] = useState<{ isOpen: boolean; userId: string; userName: string; newPass: string } | null>(null);

  // State Engine Loader Excel Import
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- HANDLER DINAMIS CHECKBOX HARI ---
  const handleDayCheckboxChange = (day: string, isChecked: boolean) => {
    if (isChecked) {
      setNewGuru(prev => ({ ...prev, piketDays: [...prev.piketDays, day] }));
    } else {
      setNewGuru(prev => ({ ...prev, piketDays: prev.piketDays.filter(d => d !== day) }));
    }
  };

  const handleEditDayCheckboxChange = (day: string, isChecked: boolean) => {
    if (!editingItem) return;
    const currentDays = editingItem.data.piketDays || [];
    const updatedDays = isChecked 
      ? [...currentDays, day] 
      : currentDays.filter((d: string) => d !== day);

    setEditingItem({
      ...editingItem,
      data: { ...editingItem.data, piketDays: updatedDays }
    });
  };

  // 1. DOWNLOAD TEMPLATE DOKUMEN EXCEL
  const handleDownloadTemplate = () => {
    let dataTemplate: any[] = [];
    let fileName = "";

    if (uploadType === 'siswa') {
      dataTemplate = [
        { "nisn": "0401234561", "nama_siswa": "Nama Siswa Contoh A", "kelas": "VII-A" }
      ];
      fileName = "template_siswa_sigap.xlsx";
    } else if (uploadType === 'guru') {
      dataTemplate = [
        { 
          "nama_lengkap": "Muhamad Sidik Heryana, S.Pd", 
          "username": "sidik95",
          "password_awal": "sandi123",
          "role": "guru_mapel",
          "mata_pelajaran": "IPA Terpadu",
          "is_wali_kelas": "true", 
          "kelas_wali": "VII-A", 
          "is_guru_piket": "true",
          "hari_piket": "Senin, Kamis",
          "nama_ekstrakurikuler": "Hortikultura" 
        }
      ];
      fileName = "template_guru_sigap.xlsx";
    } else {
      dataTemplate = [
        { "kategori": "Ringan", "jenis_kasus": "Terlambat masuk gerbang sekolah", "bobot": 5 }
      ];
      fileName = "template_master_pelanggaran.xlsx";
    }

    const worksheet = XLSX.utils.json_to_sheet(dataTemplate);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template SIGAP");
    XLSX.writeFile(workbook, fileName);
  };

  // 2. OLAH DAN SUBMIT UNGGAH BERKAS EXCEL (.XLSX)
  const handleFileProcess = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    setUploadSuccess(null);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const dataBytes = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(dataBytes, { type: 'array' });
        const parsedData: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });

        if (parsedData.length === 0) throw new Error('File Excel kosong.');

        const normalizedData = parsedData.map(row => {
          const newRow: any = {};
          Object.keys(row).forEach(key => { newRow[key.trim().toLowerCase()] = String(row[key]).trim(); });
          return newRow;
        });

        if (uploadType === 'siswa') {
          const payload = normalizedData.map((d: any) => ({
            nisn: d.nisn || '',
            name: d.nama_siswa || d.name || '',
            kelas: d.kelas || '',
            statusAbsen: 'Hadir' as const,
            ekskul: null
          }));
          await bulkInsertSiswa(payload);
          setUploadSuccess(`Sukses memproses ${payload.length} data siswa!`);
        } else if (uploadType === 'guru') {
          for (const d of normalizedData) {
            const isWali = d.is_wali_kelas === 'true' || d.is_wali_kelas === '1';
            const isPiket = d.is_guru_piket === 'true' || d.is_guru_piket === '1';
            const parsedDays = d.hari_piket ? d.hari_piket.split(',').map((h: string) => h.trim()) : [];

            await supabase.from('profiles').insert([{
              nama_lengkap: d.nama_lengkap || d.name || '',
              username: d.username || null,
              password_clear: d.password_awal || null,
              role: d.role || 'guru_mapel',
              mata_pelajaran: d.mata_pelajaran || null,
              nama_ekstrakurikuler: d.nama_ekstrakurikuler || null,
              is_wali_kelas: isWali,
              kelas_wali: isWali ? d.kelas_wali : null,
              is_guru_piket: isPiket,
              piket_days: parsedDays
            }]);
          }
          setUploadSuccess(`Sukses mengimpor data akun pendidik via Excel!`);
        } else if (uploadType === 'pelanggaran') {
          const payload = normalizedData.map((d: any) => ({
            kategori: d.kategori || 'Ringan',
            jenis_cases: d.jenis_kasus || '',
            jenis_kasus: d.jenis_kasus || '',
            bobot: Number(d.bobot || 0)
          }));
          await bulkInsertPelanggaran(payload);
          setUploadSuccess(`Sukses memproses ${payload.length} aturan tata tertib!`);
        }
        setTimeout(() => window.location.reload(), 1500);
      } catch (err: any) {
        setUploadError(`Gagal mem-parsing dokumen Excel: ${err.message}`);
      } finally { setIsUploading(false); }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSaveManualPelanggaran = async (e: FormEvent) => {
    e.preventDefault();
    if(!jenisManual.trim()) return;
    try {
      await addMasterPelanggaran({ kategori: katManual, jenis_cases: jenisManual, jenis_kasus: jenisManual, bobot: Number(bobotManual) } as any);
      setSuccessManual('Sukses menambahkan master aturan pelanggaran baru!');
      setJenisManual('');
      setTimeout(() => setSuccessManual(''), 3000);
    } catch (err: any) { alert(err.message); }
  };

  // --- ACTION: TAMBAH SISWA MANUAL ---
  const handleAddSiswaManual = async (e: FormEvent) => {
    e.preventDefault();
    if (!newSiswa.name || !newSiswa.kelas) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('students').insert([{ nisn: newSiswa.nisn || null, nama_siswa: newSiswa.name, kelas: newSiswa.kelas }]);
      if (error) throw error;
      alert(`Berhasil menambahkan siswa: ${newSiswa.name}`);
      setNewSiswa({ nisn: '', name: '', kelas: '' });
      window.location.reload();
    } catch (err: any) { alert(err.message); } 
    finally { setIsSubmitting(false); }
  };

  // --- ACTION: BUAT AKUN GURU MANUAL (DENGAN INPUT BEBAS MAPEL/EKSKUL & ROLE) ---
  const handleAddGuruManual = async (e: FormEvent) => {
    e.preventDefault();
    if (!newGuru.name || !newGuru.username || !newGuru.password) {
      alert("Mohon lengkapi Nama, Username, dan Kata Sandi Akun.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('profiles').insert([{
        nama_lengkap: newGuru.name,
        username: newGuru.username,
        password_clear: newGuru.password,
        role: newGuru.role,
        mata_pelajaran: newGuru.mataPelajaran || null,
        nama_ekstrakurikuler: newGuru.namaEkskul || null,
        is_wali_kelas: newGuru.isWaliKelas,
        kelas_wali: newGuru.isWaliKelas ? newGuru.kelasWali : null,
        is_guru_piket: newGuru.isGuruPiket,
        piket_days: newGuru.isGuruPiket ? newGuru.piketDays : []
      }]);
      if (error) throw error;
      alert(`Sukses mendaftarkan akun guru: ${newGuru.name}`);
      setNewGuru({ name: '', username: '', password: '', role: 'guru_mapel', mataPelajaran: '', isWaliKelas: false, kelasWali: '', isGuruPiket: false, piketDays: [], namaEkskul: '' });
      window.location.reload();
    } catch (err: any) { alert(err.message); } 
    finally { setIsSubmitting(false); }
  };

  // --- ACTION: SIMPAN MODIFIKASI DATA MASTER INDIVIDU ---
  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsSubmitting(true);
    try {
      if (editingItem.type === 'siswa') {
        const { error } = await supabase.from('students').update({ nisn: editingItem.data.nisn || null, nama_siswa: editingItem.data.name, kelas: editingItem.data.kelas }).eq('id', editingItem.data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('profiles').update({
          nama_lengkap: editingItem.data.name,
          username: editingItem.data.username || null,
          role: editingItem.data.role,
          mata_pelajaran: editingItem.data.mataPelajaran || null,
          nama_ekstrakurikuler: editingItem.data.namaEkskul || null,
          is_wali_kelas: editingItem.data.isWaliKelas,
          kelas_wali: editingItem.data.isWaliKelas ? editingItem.data.kelasWali : null,
          is_guru_piket: editingItem.data.isGuruPiket,
          piket_days: editingItem.data.isGuruPiket ? editingItem.data.piketDays : []
        }).eq('id', editingItem.data.id);
        if (error) throw error;
      }
      alert('Perubahan data berhasil diamankan!');
      setEditingItem(null);
      window.location.reload();
    } catch (err: any) { alert(err.message); }
    finally { setIsSubmitting(false); }
  };

  // --- ACTION: DELETION PERMANEN DATA INDIVIDU ---
  const handleDeleteItem = async (type: 'siswa' | 'guru', id: string, name: string) => {
    if (!window.confirm(`PERINGATAN! Apakah Anda yakin ingin menghapus permanen data ${type}: ${name}?`)) return;
    try {
      const targetTable = type === 'siswa' ? 'students' : 'profiles';
      const { error } = await supabase.from(targetTable).delete().eq('id', id);
      if (error) throw error;
      alert(`Sukses membuang data ${name} dari sistem.`);
      window.location.reload();
    } catch (err: any) { alert(err.message); }
  };

  // --- ACTION: PENGATURAN RESET KATA SANDI USER ---
  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!passwordModal || !passwordModal.newPass.trim()) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('profiles').update({ password_clear: passwordModal.newPass }).eq('id', passwordModal.userId);
      if (error) throw error;
      alert(`Kata sandi akun ${passwordModal.userName} berhasil diperbarui!`);
      setPasswordModal(null);
    } catch (err: any) { alert(err.message); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      {/* Top Main Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button onClick={() => setMainTab('excel_import')} className={`pb-3 px-4 font-bold text-sm border-b-2 transition cursor-pointer ${mainTab === 'excel_import' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500'}`}>Import Berkas & Aturan</button>
        <button onClick={() => setMainTab('manage_data')} className={`pb-3 px-4 font-bold text-sm border-b-2 transition cursor-pointer ${mainTab === 'manage_data' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500'}`}>Manajemen Data Manual</button>
      </div>

      {/* ==================== PANEL UTAMA 1: EXCEL ENGINE IMPORT & BK ==================== */}
      {mainTab === 'excel_import' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <button type="button" onClick={onBackToDashboard} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-sky-600 transition mb-6 group"><ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Kembali ke Dasbor Utama</button>
          
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
              <button onClick={() => { setUploadType('siswa'); setUploadSuccess(null); setUploadError(null); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition text-left cursor-pointer ${uploadType === 'siswa' ? 'bg-sky-50 text-sky-700 border border-sky-100' : 'text-slate-600 hover:bg-slate-50'}`}><GraduationCap className="w-4 h-4" /> Unggah Data Siswa</button>
              <button onClick={() => { setUploadType('guru'); setUploadSuccess(null); setUploadError(null); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition text-left cursor-pointer ${uploadType === 'guru' ? 'bg-sky-50 text-sky-700 border border-sky-100' : 'text-slate-600 hover:bg-slate-50'}`}><Users className="w-4 h-4" /> Unggah Akun Pendidik</button>
              <button onClick={() => { setUploadType('pelanggaran'); setUploadSuccess(null); setUploadError(null); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition text-left cursor-pointer ${uploadType === 'pelanggaran' ? 'bg-sky-50 text-sky-700 border border-sky-100' : 'text-slate-600 hover:bg-slate-50'}`}><ShieldAlert className="w-4 h-4" /> Aturan Kasus BK</button>
            </div>

            <div className="flex-1 w-full space-y-6">
              <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={(e) => { if(e.target.files && e.target.files[0]) handleFileProcess(e.target.files[0]); }} />
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-200 hover:border-sky-500 hover:bg-sky-50/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/50 transition cursor-pointer group">
                <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-sky-600 shadow-sm mb-4 transition"><UploadCloud className="w-6 h-6" /></div>
                <h4 className="text-sm font-bold text-slate-800">{isUploading ? 'Sedang Menyimpan Berkas...' : `Pilih Berkas Spreadsheet Format Excel untuk ${uploadType === 'pelanggaran' ? 'Aturan Pelanggaran' : uploadType === 'siswa' ? 'Siswa' : 'Guru'}`}</h4>
                <p className="text-xs text-slate-400 mt-1">Gunakan berkas berkstensi resmi .xlsx atau .xls saja.</p>
                <button type="button" onClick={(e) => { e.stopPropagation(); handleDownloadTemplate(); }} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-sky-600 mt-5 shadow-sm hover:bg-slate-100 transition"><FileSpreadsheet className="w-4 h-4" /> Download Format Template Excel</button>
              </div>

              {uploadSuccess && <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 font-medium"><CheckCircle className="w-4 h-4 text-emerald-600" /> {uploadSuccess}</div>}
              {uploadError && <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2 font-medium"><AlertCircle className="w-4 h-4 text-rose-600" /> {uploadError}</div>}

              {uploadType === 'pelanggaran' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                  <form onSubmit={handleSaveManualPelanggaran} className="space-y-4">
                    <h5 className="text-xs font-bold uppercase text-slate-700">Form Tambah Kategori Pelanggaran BK</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Kategori</label>
                        <select value={katManual} onChange={(e) => setKatManual(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700"><option value="Ringan">Ringan</option><option value="Sedang">Sedang</option><option value="Berat">Berat</option><option value="Sangat Berat">Sangat Berat</option></select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Bobot Skor</label>
                        <input type="number" value={bobotManual} onChange={(e) => setBobotManual(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Jenis Kasus/Bentuk Pelanggaran</label>
                      <input type="text" required value={jenisManual} onChange={(e) => setJenisManual(e.target.value)} placeholder="Contoh: Merusak fasilitas sarana prasarana kelas" className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-800" />
                    </div>
                    {successManual && <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded">{successManual}</p>}
                    <button type="submit" className="w-full bg-slate-900 text-white font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 shadow"><Save className="w-4 h-4" /> Daftarkan Aturan Pelanggaran</button>
                  </form>

                  <div className="space-y-3">
                    <h5 className="text-xs font-bold uppercase text-slate-700">Daftar Poin Aturan Pelanggaran BK ({masterPelanggarans.length})</h5>
                    <div className="max-h-[220px] overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl px-3 bg-slate-50/40">
                      {masterPelanggarans.map(p => (
                        <div key={p.id} className="py-2.5 flex justify-between items-center text-xs gap-2">
                          <div><p className="font-semibold text-slate-800">{p.jenis_kasus}</p><span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 mt-1 inline-block uppercase">{p.kategori}</span></div>
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
      )}

      {/* ==================== PANEL UTAMA 2: DATA INDIVIDU MANUAL MANAGEMENT ==================== */}
      {mainTab === 'manage_data' && (
        <div className="space-y-6">
          <div className="flex border-b border-slate-200 bg-white p-2 rounded-xl shadow-sm gap-2">
            <button onClick={() => setActiveSubTab('siswa')} className={`flex items-center gap-2 px-4 py-2 font-bold text-xs rounded-lg transition cursor-pointer ${activeSubTab === 'siswa' ? 'bg-sky-50 text-sky-600' : 'text-slate-500 hover:text-slate-800'}`}><GraduationCap className="w-4 h-4" /> Manajemen Siswa</button>
            <button onClick={() => setActiveSubTab('guru')} className={`flex items-center gap-2 px-4 py-2 font-bold text-xs rounded-lg transition cursor-pointer ${activeSubTab === 'guru' ? 'bg-sky-50 text-sky-600' : 'text-slate-500 hover:text-slate-800'}`}><Users className="w-4 h-4" /> Manajemen Pendidik & Akun</button>
          </div>

          {activeSubTab === 'siswa' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm h-fit space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><PlusCircle className="w-4 h-4 text-sky-600" /> Tambah Siswa Baru</h3>
                <form onSubmit={handleAddSiswaManual} className="space-y-3">
                  <div><label className="block text-[11px] font-bold text-slate-500 mb-1">Nomor NISN</label><input type="text" value={newSiswa.nisn} onChange={(e) => setNewSiswa({ ...newSiswa, nisn: e.target.value })} placeholder="Masukkan NISN..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" /></div>
                  <div><label className="block text-[11px] font-bold text-slate-500 mb-1">Nama Lengkap Siswa</label><input type="text" value={newSiswa.name} onChange={(e) => setNewSiswa({ ...newSiswa, name: e.target.value })} placeholder="Tulis nama lengkap..." required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" /></div>
                  <div><label className="block text-[11px] font-bold text-slate-500 mb-1">Rombel Kelas Binaan</label>
                    <select value={newSiswa.kelas} onChange={(e) => setNewSiswa({ ...newSiswa, kelas: e.target.value })} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"><option value="">-- Pilih Rombel Kelas --</option><option value="VII-A">VII-A</option><option value="VII-B">VII-B</option><option value="VIII-A">VIII-A</option><option value="VIII-B">VIII-B</option><option value="IX-A">IX-A</option><option value="IX-B">IX-B</option></select>
                  </div>
                  <button type="submit" disabled={isSubmitting} className="w-full py-2 bg-sky-600 text-white font-bold text-xs rounded-xl hover:bg-sky-700 flex items-center justify-center gap-2 transition"><PlusCircle className="w-3.5 h-3.5" /> Posisikan Siswa</button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50/50 border-b border-slate-100"><h4 className="text-xs font-bold text-slate-700">Daftar Total Siswa Terdaftar ({siswa.length})</h4></div>
                <div className="overflow-y-auto max-h-[450px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 border-b">
                      <tr><th className="p-3 pl-4">NISN</th><th className="p-3">Nama Siswa</th><th className="p-3">Kelas</th><th className="p-3 text-center">Tindakan Aksi</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                      {siswa.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/40">
                          <td className="p-3 pl-4 font-mono font-medium text-slate-400">{s.nisn || '-'}</td>
                          <td className="p-3 font-bold text-slate-800">{s.name}</td>
                          <td className="p-3"><span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-semibold">{s.kelas}</span></td>
                          <td className="p-3 text-center">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => setEditingItem({ type: 'siswa', data: { id: s.id, nisn: s.nisn, name: s.name, kelas: s.kelas } })} className="p-1 text-sky-600 hover:bg-sky-50 rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDeleteItem('siswa', s.id, s.name)} className="p-1 text-rose-600 hover:bg-rose-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'guru' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Input Manual Guru dengan Mengetik Bebas Mapel & Ekskul */}
              <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm h-fit space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><PlusCircle className="w-4 h-4 text-sky-600" /> Registrasi Akun Guru</h3>
                <form onSubmit={handleAddGuruManual} className="space-y-3">
                  <div><label className="block text-[11px] font-bold text-slate-500 mb-1">Nama Lengkap & Gelar</label><input type="text" value={newGuru.name} onChange={(e) => setNewGuru({ ...newGuru, name: e.target.value })} placeholder="Contoh: Muhamad Sidik Heryana, S.Pd" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" /></div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-[11px] font-bold text-slate-500 mb-1">Username Login</label><input type="text" value={newGuru.username} onChange={(e) => setNewGuru({ ...newGuru, username: e.target.value })} placeholder="Username..." required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" /></div>
                    <div><label className="block text-[11px] font-bold text-slate-500 mb-1">Kata Sandi</label><input type="password" value={newGuru.password} onChange={(e) => setNewGuru({ ...newGuru, password: e.target.value })} placeholder="Ketik sandi..." required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" /></div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Pilih Jabatan / Role Utama</label>
                    <select value={newGuru.role} onChange={(e) => setNewGuru({ ...newGuru, role: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700">
                      <option value="guru_mapel">Guru Mata Pelajaran</option>
                      <option value="guru_bk">Guru Bimbingan Konseling (BK)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Mata Pelajaran (Ketik Manual)</label>
                    <input type="text" value={newGuru.mataPelajaran} onChange={(e) => setNewGuru({ ...newGuru, mataPelajaran: e.target.value })} placeholder="Contoh: IPA Terpadu, Matematika..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" />
                  </div>

                  <div className="p-3 bg-slate-50 border rounded-xl space-y-2">
                    <div className="flex items-center justify-between"><span className="text-[11px] font-bold text-slate-600">Ditugaskan Jadi Wali Kelas</span><input type="checkbox" checked={newGuru.isWaliKelas} onChange={(e) => setNewGuru({ ...newGuru, isWaliKelas: e.target.checked })} className="w-4 h-4 text-sky-600" /></div>
                    {newGuru.isWaliKelas && (
                      <select value={newGuru.kelasWali} onChange={(e) => setNewGuru({ ...newGuru, kelasWali: e.target.value })} required className="w-full text-xs p-2 rounded bg-white border"><option value="">-- Pilih Kelas Binaan --</option><option value="VII-A">VII-A</option><option value="VII-B">VII-B</option><option value="VIII-A">VIII-A</option><option value="VIII-B">VIII-B</option><option value="IX-A">IX-A</option><option value="IX-B">IX-B</option></select>
                    )}
                  </div>
                  
                  <div className="p-3 bg-slate-50 border rounded-xl space-y-2">
                    <div className="flex items-center justify-between"><span className="text-[11px] font-bold text-slate-600">Aktif Tugas Piket Harian</span><input type="checkbox" checked={newGuru.isGuruPiket} onChange={(e) => setNewGuru({ ...newGuru, isGuruPiket: e.target.checked })} className="w-4 h-4 text-sky-600" /></div>
                    {newGuru.isGuruPiket && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {DAYS_OF_WEEK.map((day) => (
                          <label key={day} className="flex items-center gap-1 bg-white border p-1 rounded text-[10px] font-medium text-slate-600 cursor-pointer"><input type="checkbox" checked={newGuru.piketDays.includes(day)} onChange={(e) => handleDayCheckboxChange(day, e.target.checked, setNewGuru)} className="w-3 h-3 text-sky-600" />{day}</label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Membina Ekstrakurikuler (Ketik Manual)</label>
                    <input type="text" value={newGuru.namaEkskul} onChange={(e) => setNewGuru({ ...newGuru, namaEkskul: e.target.value })} placeholder="Contoh: Hortikultura" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" />
                  </div>

                  <button type="submit" disabled={isSubmitting} className="w-full py-2 bg-sky-600 text-white font-bold text-xs rounded-xl hover:bg-sky-700 shadow-sm transition"><PlusCircle className="w-3.5 h-3.5" /> Rampungkan Akun Guru</button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50/50 border-b border-slate-100"><h4 className="text-xs font-bold text-slate-700">Daftar Total Guru Terdaftar ({gurus.length})</h4></div>
                <div className="overflow-y-auto max-h-[520px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 border-b">
                      <tr><th className="p-3 pl-4">Identitas Guru</th><th className="p-3">Mata Pelajaran</th><th className="p-3">Penugasan Peran</th><th className="p-3 text-center">Opsi Aksi</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                      {gurus.map((g: any) => (
                        <tr key={g.id} className="hover:bg-slate-50/40">
                          <td className="p-3 pl-4 font-bold text-slate-800">
                            {g.name}
                            {g.username && <span className="block text-[10px] text-slate-400 font-mono mt-0.5">ID User: {g.username}</span>}
                          </td>
                          <td className="p-3 font-semibold text-slate-700">{g.mata_pelajaran || g.mata_pelajaran_1 || <span className="text-slate-400 italic font-normal">Belum di-set</span>}</td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${g.role === 'guru_bk' ? 'bg-rose-50 text-rose-600' : 'bg-sky-50 text-sky-600'}`}>{g.role === 'guru_bk' ? 'Guru BK' : 'Guru Mapel'}</span>
                              {g.kelasWali && <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold">Wali {g.kelasWali}</span>}
                              {g.subRoles?.includes('guru_piket') && <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded text-[10px] font-bold">Piket {g.piketDays && g.piketDays.length > 0 ? `(${g.piketDays.join(', ')})` : ''}</span>}
                              {g.namaEkskul && <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold">Pembina {g.namaEkskul}</span>}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex justify-center gap-1">
                              <button onClick={() => setEditingItem({ type: 'guru', data: { id: g.id, name: g.name, username: g.username || '', role: g.role || 'guru_mapel', mataPelajaran: g.mata_pelajaran || '', isWaliKelas: !!g.kelasWali, kelasWali: g.kelasWali || '', isGuruPiket: g.subRoles?.includes('guru_piket') || false, piketDays: g.piketDays || [], namaEkskul: g.namaEkskul || '' } })} className="p-1.5 text-sky-600 hover:bg-sky-50 rounded" title="Edit Profil"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setPasswordModal({ isOpen: true, userId: g.id, userName: g.name, newPass: '' })} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded" title="Ubah Password"><Lock className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDeleteItem('guru', g.id, g.name)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded" title="Hapus User"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== DIALOG FORM MODAL MODIFIKASI DATA MASTER ==================== */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border shadow-xl overflow-hidden">
            <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Modifikasi Data Master: {editingItem.type}</h3>
              <button onClick={() => setEditingItem(null)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              {editingItem.type === 'siswa' ? (
                <>
                  <div><label className="block text-[10px] font-bold text-slate-400 mb-1">NISN</label><input type="text" value={editingItem.data.nisn} onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, nisn: e.target.value } })} className="w-full bg-slate-50 border p-2 text-xs rounded-xl" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-400 mb-1">Nama Siswa</label><input type="text" value={editingItem.data.name} onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, name: e.target.value } })} required className="w-full bg-slate-50 border p-2 text-xs rounded-xl" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-400 mb-1">Kelas Mengajar</label>
                    <select value={editingItem.data.kelas} onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, kelas: e.target.value } })} className="w-full bg-slate-50 border p-2 text-xs rounded-xl"><option value="VII-A">VII-A</option><option value="VII-B">VII-B</option><option value="VIII-A">VIII-A</option><option value="VIII-B">VIII-B</option><option value="IX-A">IX-A</option><option value="IX-B">IX-B</option></select>
                  </div>
                </>
              ) : (
                <>
                  <div><label className="block text-[10px] font-bold text-slate-400 mb-1">Nama Lengkap Guru</label><input type="text" value={editingItem.data.name} onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, name: e.target.value } })} required className="w-full bg-slate-50 border p-2 text-xs rounded-xl" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-400 mb-1">Username Login</label><input type="text" value={editingItem.data.username} onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, username: e.target.value } })} className="w-full bg-slate-50 border p-2 text-xs rounded-xl" /></div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Role Utama</label>
                    <select value={editingItem.data.role} onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, role: e.target.value } })} className="w-full bg-slate-50 border p-2 text-xs rounded-xl">
                      <option value="guru_mapel">Guru Mata Pelajaran</option>
                      <option value="guru_bk">Guru BK</option>
                    </select>
                  </div>

                  <div><label className="block text-[10px] font-bold text-slate-400 mb-1">Mata Pelajaran (Ketik Manual)</label><input type="text" value={editingItem.data.mataPelajaran} onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, mataPelajaran: e.target.value } })} className="w-full bg-slate-50 border p-2 text-xs rounded-xl" /></div>

                  <div className="p-3 bg-slate-50 border rounded-xl space-y-2">
                    <div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-600">Sebagai Wali Kelas</span><input type="checkbox" checked={editingItem.data.isWaliKelas} onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, isWaliKelas: e.target.checked } })} className="w-4 h-4" /></div>
                    {editingItem.data.isWaliKelas && (
                      <select value={editingItem.data.kelasWali} onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, kelasWali: e.target.value } })} className="w-full bg-white border rounded-lg p-1.5 text-xs font-semibold"><option value="VII-A">VII-A</option><option value="VII-B">VII-B</option><option value="VIII-A">VIII-A</option><option value="VIII-B">VIII-B</option><option value="IX-A">IX-A</option><option value="IX-B">IX-B</option></select>
                    )}
                  </div>
                  <div className="p-3 bg-slate-50 border rounded-xl space-y-3">
                    <div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-600">Tugas Guru Piket</span><input type="checkbox" checked={editingItem.data.isGuruPiket} onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, isGuruPiket: e.target.checked } })} className="w-4 h-4" /></div>
                    {editingItem.data.isGuruPiket && (
                      <div className="flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map((day) => (
                          <label key={day} className="flex items-center gap-1 bg-white border px-2 py-1 rounded-lg text-[10px] font-medium text-slate-600 cursor-pointer"><input type="checkbox" checked={(editingItem.data.piketDays || []).includes(day)} onChange={(e) => handleEditDayCheckboxChange(day, e.target.checked)} className="w-3.5 h-3.5" />{day}</label>
                        ))}
                      </div>
                    )}
                  </div>
                  <div><label className="block text-[10px] font-bold text-slate-400 mb-1">Pembina Ekstrakurikuler</label><input type="text" value={editingItem.data.namaEkskul} onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, namaEkskul: e.target.value } })} className="w-full bg-slate-50 border p-2 text-xs rounded-xl" /></div>
                </>
              )}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setEditingItem(null)} className="px-4 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm"><Save className="w-3.5 h-3.5" /> Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== POPUP DIALOG RESET PASSWORD AKUN GURU ==================== */}
      {passwordModal && passwordModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border shadow-xl overflow-hidden">
            <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-amber-500" /> Ubah Sandi Akun Pendidik</h3>
              <button onClick={() => setPasswordModal(null)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleUpdatePassword} className="p-5 space-y-4">
              <div>
                <p className="text-xs text-slate-500 font-medium">Memperbarui kredensial sandi login untuk:</p>
                <p className="text-xs font-bold text-slate-800 bg-slate-100 p-2 rounded-lg mt-1">{passwordModal.userName}</p>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Kata Sandi Baru</label>
                <input type="password" required value={passwordModal.newPass} onChange={(e) => setPasswordModal({ ...passwordModal, newPass: e.target.value })} placeholder="Ketik kata sandi baru..." className="w-full bg-slate-50 border p-2.5 text-xs font-semibold rounded-xl" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setPasswordModal(null)} className="px-4 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-5 py-2 bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm"><Save className="w-3.5 h-3.5" /> Perbarui Sandi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;