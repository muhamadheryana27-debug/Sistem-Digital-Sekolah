import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, Check, X, UserCheck, AlertTriangle } from 'lucide-react';

const BkPanel: React.FC = () => {
  // Hanya mengubah pemanggilan data dari AppContext (Supabase)
  const { siswa, violations, updateViolationStatus, loading } = useApp();
  const [filterKelas, setFilterKelas] = useState<string>('Semua');

  // Mempertahankan variabel fungsi bawaan lama Anda
  const pendingViolations = violations.filter(v => v.status === 'pending');
  const approvedViolations = violations.filter(v => v.status === 'approved');

  const handleApprove = async (id: string) => {
    if (window.confirm('Setujui pelaporan pelanggaran ini untuk akumulasi poin siswa?')) {
      await updateViolationStatus(id, 'approved', 'Guru BK');
    }
  };

  const handleReject = async (id: string) => {
    if (window.confirm('Tolak berkas laporan pelanggaran ini?')) {
      await updateViolationStatus(id, 'rejected', 'Guru BK');
    }
  };

  const getSiswaPoin = (nisn: string) => {
    return violations
      .filter(v => v.siswa_nisn === nisn && v.status === 'approved')
      .reduce((sum, v) => sum + (v.bobot || 0), 0);
  };

  if (loading) return <div className="p-6 text-center text-xs font-bold text-slate-500">Menyinkronkan data modul BK...</div>;

  return (
    <div className="space-y-6">
      {/* Seluruh komponen JSX UI lama Anda tetap dipertahankan tanpa modifikasi visual */}
      <div className="bg-white border p-6 rounded-2xl shadow-sm">
        <h2 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-4">
          <ShieldAlert className="w-5 h-5 text-rose-500" /> PERSETUJUAN KASUS PELANGGARAN TATA TERTIB
        </h2>
        
        {pendingViolations.length === 0 ? (
          <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center">Tidak ada laporan pelanggaran masuk hari ini.</p>
        ) : (
          <div className="space-y-3">
            {pendingViolations.map((v) => (
              <div key={v.id} className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-slate-800">{v.nama_siswa} ({v.kelas})</p>
                  <p className="text-slate-600 mt-1"><span className="font-semibold text-rose-600">Pelanggaran:</span> {v.jenis_kasus}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Dilaporkan oleh: {v.reporter} • Bobot: {v.bobot} Poin</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(v.id)} className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-1 font-bold shadow-sm"><Check className="w-3.5 h-3.5" /> Setujui</button>
                  <button onClick={() => handleReject(v.id)} className="p-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 flex items-center gap-1 font-bold shadow-sm"><X className="w-3.5 h-3.5" /> Tolak</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-700">Rekapitulasi Poin Kedisiplinan Siswa</h3>
          <select value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)} className="text-xs bg-white border rounded-lg p-1 font-semibold">
            <option value="Semua">Semua Kelas</option>
            <option value="VII-A">VII-A</option><option value="VII-B">VII-B</option>
            <option value="VIII-A">VIII-A</option><option value="VIII-B">VIII-B</option>
            <option value="IX-A">IX-A</option><option value="IX-B">IX-B</option>
          </select>
        </div>
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-100 text-[10px] font-bold text-slate-500 uppercase border-b">
            <tr>
              <th className="p-3 pl-4">NISN</th>
              <th className="p-3">Nama Siswa</th>
              <th className="p-3">Kelas</th>
              <th className="p-3 text-center">Akumulasi Poin</th>
              <th className="p-3 text-center">Status Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {siswa.filter(s => filterKelas === 'Semua' || s.kelas === filterKelas).map((s) => {
              const poin = getSiswaPoin(s.nisn);
              return (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="p-3 pl-4 font-mono text-slate-400">{s.nisn}</td>
                  <td className="p-3 font-bold text-slate-800">{s.nama_siswa}</td>
                  <td className="p-3 font-medium text-slate-500">{s.kelas}</td>
                  <td className="p-3 text-center font-black text-sm text-slate-700">
                    <span className={`px-2 py-0.5 rounded-full ${poin >= 50 ? 'bg-rose-100 text-rose-700' : poin >= 20 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{poin} Pts</span>
                  </td>
                  <td className="p-3 text-center">
                    {poin >= 50 ? (
                      <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold">Panggilan Orang Tua</span>
                    ) : poin >= 20 ? (
                      <span className="px-2 py-0.5 bg-amber-500 text-white rounded text-[10px] font-bold">Peringatan Wali Kelas</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold">Aman / Kondusif</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BkPanel;
