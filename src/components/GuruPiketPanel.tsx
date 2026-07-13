import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AlertCircle, PlusCircle, CheckCircle } from 'lucide-react';

const GuruPiketPanel: React.FC = () => {
  const { siswa, masterPelanggarans, addViolation } = useApp();
  
  // Mempertahankan state asli form Anda
  const [selectedSiswa, setSelectedSiswa] = useState<string>('');
  const [selectedPelanggaran, setSelectedPelanggaran] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiswa || !selectedPelanggaran) return;
    
    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const targetSiswa = siswa.find(s => s.nisn === selectedSiswa);
      const targetRule = masterPelanggarans.find(m => m.id === selectedPelanggaran);

      if (!targetSiswa || !targetRule) throw new Error('Data referensi siswa/aturan salah.');

      // Struktur data payload mengikuti kolom Supabase Anda
      const payload = {
        siswa_nisn: targetSiswa.nisn,
        nama_siswa: targetSiswa.nama_siswa,
        kelas: targetSiswa.kelas,
        kategori: targetRule.kategori,
        jenis_kasus: targetRule.jenis_kasus,
        bobot: Number(targetRule.bobot),
        reporter: 'Guru Piket',
        status: 'pending' 
      };

      await addViolation(payload);
      setStatusMsg({ type: 'success', text: `Sukses melaporkan ${targetSiswa.nama_siswa}. Berhasil disinkronkan!` });
      setSelectedSiswa('');
      setSelectedPelanggaran('');
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: `Gagal mengirim data: ${err.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
      <div className="border-b pb-2">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-sky-600" /> PELAPORAN INSIDEN PELANGGARAN SISWA
        </h3>
        <p className="text-[11px] text-slate-400">Gunakan form ini saat menemukan pelanggaran atribut, keterlambatan, atau tata tertib di area sekolah.</p>
      </div>

      {statusMsg && (
        <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          {statusMsg.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          {statusMsg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-slate-600 mb-1">Pilih Siswa Terlapor</label>
          <select value={selectedSiswa} onChange={(e) => setSelectedSiswa(e.target.value)} required className="w-full border rounded-xl p-2.5 bg-slate-50 font-medium">
            <option value="">-- Cari Nama Siswa / Kelas --</option>
            {siswa.map(s => (
              <option key={s.id} value={s.nisn}>{s.kelas} - {s.nama_siswa} ({s.nisn})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-600 mb-1">Jenis Pelanggaran Kasus</label>
          <select value={selectedPelanggaran} onChange={(e) => setSelectedPelanggaran(e.target.value)} required className="w-full border rounded-xl p-2.5 bg-slate-50 font-medium">
            <option value="">-- Pilih Jenis Pelanggaran --</option>
            {masterPelanggarans.map(m => (
              <option key={m.id} value={m.id}>[{m.kategori}] {m.jenis_kasus} - ({m.bobot} Poin)</option>
            ))}
          </select>
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full py-2.5 bg-sky-600 text-white font-black rounded-xl hover:bg-sky-700 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50">
          <PlusCircle className="w-4 h-4" /> {isSubmitting ? 'Mengirim Data...' : 'Kirim Laporan Kasus'}
        </button>
      </form>
    </div>
  );
};

export default GuruPiketPanel;
