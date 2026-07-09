import React, { useState, useMemo, FormEvent } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import { JurnalMengajar } from '../types';
import { ArrowLeft, BookOpen, Calendar, GraduationCap, PlusCircle, Save, Check } from 'lucide-react';

interface GuruMapelPanelProps {
  onBack: () => void;
  Jurnal?: JurnalMengajar[];
}

const GuruMapelPanel: React.FC<GuruMapelPanelProps> = ({ onBack, Jurnal = [] }) => {
  const { currentUser, jurnalMengajar: contextJurnal = [] } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);

  // State Form Input Jurnal Baru
  const [mataPelajaran, setMataPelajaran] = useState('IPA'); // State Baru untuk kolom mata_pelajaran
  const [kelas, setKelas] = useState('VII-A');
  const [jamKe, setJamKe] = useState('1-2');
  const [materi, setMateri] = useState('');
  const [aktivitas, setAktivitas] = useState('');
  
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const daftarJurnalSumber = useMemo(() => {
    return Jurnal.length > 0 ? Jurnal : contextJurnal;
  }, [Jurnal, contextJurnal]);

  const myJurnal = useMemo(() => {
    if (!currentUser) return [];
    // PERBAIKAN FILTER: Memastikan pencocokan ID menggunakan string/id dari user yang login
    return daftarJurnalSumber.filter(j => String(j.guruId) === String(currentUser.id));
  }, [daftarJurnalSumber, currentUser]);

  const totalMengajar = myJurnal.length;
  const totalKelasBinaan = useMemo(() => {
    return new Set(myJurnal.map(j => j.kelas)).size;
  }, [myJurnal]);

  const handleSubmitJurnal = async (e: FormEvent) => {
    e.preventDefault();
    if (!materi.trim() || !aktivitas.trim() || !mataPelajaran.trim()) {
      alert('Semua bidang input wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    try {
      // PERBAIKAN: Mengganti 'jurnal_mengajar' menjadi 'teaching_journals' sesuai nama tabel asli Anda
      const { error } = await supabase
        .from('teaching_journals')
        .insert([{
          user_id: Number(currentUser?.id) || null,
          kelas: kelas,
          mata_pelajaran: mataPelajaran,   // Kolom database 1
          jam_ke: jamKe,
          materi_pelajaran: materi,       // Kolom database 2
          catatan_kelas: aktivitas         
        }]);

      if (error) throw new Error(error.message);

      setSuccessMsg('Sukses mengunggah agenda jurnal mengajar hari ini ke Supabase!');
      setMateri('');
      setAktivitas('');
      
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      alert(`Gagal menyimpan jurnal ke Supabase: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Panel */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg p-2 transition flex items-center gap-1 cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> <span className="text-xs font-semibold">Kembali</span>
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Ruang Guru Mata Pelajaran</h2>
            <p className="text-xs text-slate-500 font-medium">Manajemen administrasi tatap muka kelas, materi pokok, dan aktivitas pembelajaran harian.</p>
          </div>
        </div>

        <button onClick={() => setIsFormOpen(!isFormOpen)} className="bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow cursor-pointer">
          <PlusCircle className="w-4 h-4" /> {isFormOpen ? 'Tutup Form' : 'Isi Jurnal Hari Ini'}
        </button>
      </div>

      {/* FORM INPUT JURNAL BARU */}
      {isFormOpen && (
        <form onSubmit={handleSubmitJurnal} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-2xl space-y-4 animate-fadeIn">
          <div className="space-y-1 pb-2 border-b border-slate-100 flex justify-between items-start">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Form Kendali Jurnal KBM</h4>
              <p className="text-[10px] text-slate-400">Pencatatan materi ajar resmi kurikulum sekolah.</p>
            </div>
            <span className="flex items-center gap-1 text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              <Check className="w-3 h-3" /> Supabase Live
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Nama Mata Pelajaran</label>
              <input type="text" required value={mataPelajaran} onChange={(e) => setMataPelajaran(e.target.value)} placeholder="Contoh: IPA / Matematika" className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs focus:outline-none" />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Rombel Kelas</label>
              <select value={kelas} onChange={(e) => setKelas(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs focus:outline-none cursor-pointer">
                {['VII-A', 'VIII-A', 'IX-A', 'VII-B', 'VIII-B', 'IX-B'].map(k => <option key={k} value={k}>Kelas {k.replace('-', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Alokasi Jam Ke</label>
              <input type="text" required value={jamKe} onChange={(e) => setJamKe(e.target.value)} placeholder="Contoh: 1-2 atau 3-4..." className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Materi Pembelajaran / Kompetensi Dasar</label>
            <input type="text" required value={materi} onChange={(e) => setMateri(e.target.value)} placeholder="Contoh: Struktur sel tumbuhan, Persamaan linear, dll..." className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs focus:outline-none" />
          </div>

          <div>
            <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Catatan Kelas / Aktivitas Pembelajaran</label>
            <textarea rows={3} required value={aktivitas} onChange={(e) => setAktivitas(e.target.value)} placeholder="Contoh: Penyampaian materi lewat slide ceramah, pengerjaan tugas kelompok..." className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs focus:outline-none"></textarea>
          </div>

          {successMsg && <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 p-2 rounded font-semibold">{successMsg}</p>}

          <button type="submit" disabled={isSubmitting} className="w-full bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shadow">
            <Save className="w-4 h-4" /> {isSubmitting ? 'Mengirim Data...' : 'Simpan Lembar Jurnal Kelas'}
          </button>
        </form>
      )}

      {/* COUNTER STATISTIK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl"><BookOpen className="w-5 h-5" /></div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Tatap Muka</span>
            <strong className="text-base font-black text-slate-800">{totalMengajar} Kali Pertemuan</strong>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><GraduationCap className="w-5 h-5" /></div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cakupan Kelas</span>
            <strong className="text-base font-black text-slate-800">{totalKelasBinaan} Rombel Terlayani</strong>
          </div>
        </div>
      </div>

      {/* TABEL HISTORI LOGBOOK */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" /> Histori Berkas Mengajar Pribadi Anda
        </h3>

        {myJurnal.length === 0 ? (
          <div className="text-center p-8 bg-slate-50 border border-slate-100 text-slate-400 text-xs rounded-xl font-medium">
            Belum ada rekap riwayat mengajar terdaftar untuk user Anda di database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400 bg-slate-50/50">
                  <th className="py-2.5 px-3">Tanggal Laporan</th>
                  <th className="py-2.5 px-3">Mata Pelajaran</th>
                  <th className="py-2.5 px-3">Kelas</th>
                  <th className="py-2.5 px-3">Sesi Jam</th>
                  <th className="py-2.5 px-3">Materi Pokok Kurikulum</th>
                  <th className="py-2.5 px-3">Detail Uraian KBM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                {myJurnal.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-3 px-3 whitespace-nowrap text-slate-900 font-bold">{j.tanggal}</td>
                    <td className="py-3 px-3"><span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase">{j.guruName || 'Umum'}</span></td>
                    <td className="py-3 px-3"><span className="bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{j.kelas}</span></td>
                    <td className="py-3 px-3 text-slate-400 font-mono">Jam Ke-{j.jam_ke || j.jamKe}</td>
                    <td className="py-3 px-3 max-w-[180px] truncate font-semibold text-slate-800" title={j.materi}>{j.materi}</td>
                    <td className="py-3 px-3 max-w-[240px] truncate text-slate-400" title={j.aktivitas}>{j.aktivitas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuruMapelPanel;