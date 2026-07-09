import { useState, useMemo, FormEvent } from 'react';
import { useApp } from '../context/AppContext';
import { LogPoinSiswa, AturanPoin, Siswa } from '../types';
import { ArrowLeft, ShieldAlert, CheckCircle, XCircle, Award, Scale, HelpCircle, FileText, Printer, Plus, Trash2, Edit2, Check } from 'lucide-react';

interface PksKesiswaanPanelProps {
  onBack: () => void;
}

export default function PksKesiswaanPanel({ onBack }: PksKesiswaanPanelProps) {
  const { 
    siswa, 
    aturanPoin, 
    logPoin, 
    addAturanPoin, 
    deleteAturanPoin, 
    updateAturanPoin, 
    approveLogPoin, 
    deleteLogPoin,
    virtualDate,
    activeGuru
  } = useApp();

  const [activeTab, setActiveTab] = useState<'ringkasan' | 'persetujuan' | 'siswa_poin' | 'master_aturan'>('ringkasan');
  const [successMsg, setSuccessMsg] = useState('');

  // Local state for Master Rule creation/edit
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleForm, setRuleForm] = useState({ kode: '', nama: '', bobot: 5, tipe: 'pelanggaran' as 'pelanggaran' | 'apresiasi' });

  // Calculation helpers
  const studentStats = useMemo(() => {
    return siswa.map(st => {
      const logs = logPoin.filter(lp => lp.siswaId === st.id && lp.disetujuiPks);
      const totalPelanggaran = logs.filter(l => l.tipe === 'pelanggaran').reduce((sum, l) => sum + l.bobot, 0);
      const totalApresiasi = logs.filter(l => l.tipe === 'apresiasi').reduce((sum, l) => sum + l.bobot, 0);
      const skorPerilaku = Math.max(0, Math.min(100, 100 - totalPelanggaran + totalApresiasi));

      return {
        ...st,
        totalPelanggaran,
        totalApresiasi,
        skorPerilaku,
        logs
      };
    });
  }, [siswa, logPoin]);

  const pendingApprovals = useMemo(() => {
    return logPoin.filter(lp => !lp.disetujuiPks);
  }, [logPoin]);

  const schoolStats = useMemo(() => {
    let totalPelanggaranCount = logPoin.filter(l => l.tipe === 'pelanggaran' && l.disetujuiPks).length;
    let totalApresiasiCount = logPoin.filter(l => l.tipe === 'apresiasi' && l.disetujuiPks).length;
    
    // Sort students by highest violation points
    const sortedTroubled = [...studentStats].sort((a, b) => b.totalPelanggaran - a.totalPelanggaran);
    // Sort students by highest appreciation points
    const sortedPrestasi = [...studentStats].sort((a, b) => b.totalApresiasi - a.totalApresiasi);

    return {
      totalPelanggaranCount,
      totalApresiasiCount,
      topTroubled: sortedTroubled.slice(0, 3),
      topPrestasi: sortedPrestasi.slice(0, 3)
    };
  }, [logPoin, studentStats]);

  // Handle Master Rule Operations
  const handleSaveRule = (e: FormEvent) => {
    e.preventDefault();
    if (!ruleForm.kode || !ruleForm.nama) {
      alert('Isi kode dan nama aturan!');
      return;
    }

    if (editingRuleId) {
      updateAturanPoin({
        id: editingRuleId,
        kode: ruleForm.kode.toUpperCase(),
        nama: ruleForm.nama,
        bobot: Number(ruleForm.bobot),
        tipe: ruleForm.tipe
      });
      setSuccessMsg('Berhasil memperbarui master aturan poin!');
    } else {
      const isKodeExists = aturanPoin.some(a => a.kode.toLowerCase() === ruleForm.kode.toLowerCase());
      if (isKodeExists) {
        alert('Kode aturan sudah terpakai!');
        return;
      }
      addAturanPoin({
        id: `ap-${Date.now()}`,
        kode: ruleForm.kode.toUpperCase(),
        nama: ruleForm.nama,
        bobot: Number(ruleForm.bobot),
        tipe: ruleForm.tipe
      });
      setSuccessMsg('Berhasil menambahkan master aturan poin baru!');
    }

    setRuleForm({ kode: '', nama: '', bobot: 5, tipe: 'pelanggaran' });
    setIsAddingRule(false);
    setEditingRuleId(null);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleEditRule = (rule: AturanPoin) => {
    setRuleForm({
      kode: rule.kode,
      nama: rule.nama,
      bobot: rule.bobot,
      tipe: rule.tipe
    });
    setEditingRuleId(rule.id);
    setIsAddingRule(true);
  };

  const handleDeleteRule = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus aturan poin ini?')) {
      deleteAturanPoin(id);
      setSuccessMsg('Berhasil menghapus aturan poin!');
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  // State for printable student behavioral report
  const [selectedStudentForPrint, setSelectedStudentForPrint] = useState<typeof studentStats[0] | null>(null);

  const handleApprovePoint = (id: string) => {
    approveLogPoin(id);
    setSuccessMsg('Berhasil menyetujui sanksi/apresiasi kesiswaan!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleRejectPoint = (id: string) => {
    if (window.confirm('Tolak usulan pencatatan poin ini?')) {
      deleteLogPoin(id);
      setSuccessMsg('Usulan berhasil ditolak dan dihapus.');
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg p-2 transition flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> <span className="text-xs font-semibold">Kembali ke Beranda</span>
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Pusat Kendali PKS Kesiswaan
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Sistem Disiplin SMP Negeri 1 Wanayasa. Otoritas penuh verifikasi sanksi, apresiasi, dan statistik kedisiplinan sekolah.
            </p>
          </div>
        </div>

        <div className="bg-slate-900 text-sky-400 font-mono text-[10px] px-3 py-1.5 rounded-lg border border-slate-800 font-semibold shadow-sm shrink-0">
          Otensi PKS: {activeGuru?.name}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-slate-200 flex gap-2 overflow-x-auto">
        <button
          onClick={() => { setActiveTab('ringkasan'); setSelectedStudentForPrint(null); }}
          className={`px-4 py-2 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'ringkasan' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Scale className="w-4 h-4" /> Ringkasan KBM Disiplin
        </button>
        <button
          onClick={() => { setActiveTab('persetujuan'); setSelectedStudentForPrint(null); }}
          className={`px-4 py-2 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap relative ${
            activeTab === 'persetujuan' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle className="w-4 h-4" /> Antrean Persetujuan Poin
          {pendingApprovals.length > 0 && (
            <span className="bg-rose-500 text-white font-mono text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse shrink-0">
              {pendingApprovals.length}
            </span>
          )}
        </button>
        <button
          onClick={() => { setActiveTab('siswa_poin'); }}
          className={`px-4 py-2 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'siswa_poin' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" /> Skor Kelakuan & Buku Saku
        </button>
        <button
          onClick={() => { setActiveTab('master_aturan'); setSelectedStudentForPrint(null); }}
          className={`px-4 py-2 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'master_aturan' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" /> Master Poin Pelanggaran & Apresiasi
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-sm">
          <Check className="w-4 h-4 text-emerald-600" /> {successMsg}
        </div>
      )}

      {/* Main stage based on Tab */}
      <div className="grid grid-cols-1 gap-6">

        {/* TAB 1: RINGKASAN */}
        {activeTab === 'ringkasan' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Kejadian Pelanggaran</span>
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-black text-rose-600 font-mono">{schoolStats.totalPelanggaranCount}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">Tersertifikasi PKS</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Pencapaian Apresiasi</span>
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-black text-emerald-600 font-mono">{schoolStats.totalApresiasiCount}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">Tersertifikasi PKS</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Antrean Persetujuan</span>
                <div className="flex justify-between items-baseline">
                  <span className={`text-2xl font-black font-mono ${pendingApprovals.length > 0 ? 'text-amber-600 animate-pulse' : 'text-slate-600'}`}>
                    {pendingApprovals.length}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">Butuh Tindakan Segera</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Rasio Kelakuan Positif</span>
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-black text-sky-600 font-mono">
                    {Math.round((studentStats.filter(s => s.skorPerilaku >= 85).length / siswa.length) * 100)}%
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold">Skor A/B (Sangat Baik)</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Violations list */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                <div className="pb-2 border-b border-slate-100 flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase text-rose-700 tracking-wider">Peringkat Kerawanan Tertinggi (Pelanggaran)</h4>
                  <span className="text-[9px] bg-rose-50 text-rose-700 font-mono font-bold px-2 py-0.5 rounded border border-rose-100">Intervensi BK</span>
                </div>
                
                <div className="space-y-3">
                  {schoolStats.topTroubled.map((st, index) => (
                    <div key={st.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-50 bg-slate-50/50">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-400">#{index+1}</span>
                          <p className="text-xs font-bold text-slate-800">{st.name}</p>
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold">Kelas: {st.kelas} | NISN: {st.nisn}</p>
                      </div>

                      <div className="text-right">
                        <span className="bg-rose-100 text-rose-800 font-mono text-[10px] font-black px-2.5 py-1 rounded-full">
                          {st.totalPelanggaran} Poin Pelanggaran
                        </span>
                        <p className="text-[9px] text-slate-400 mt-1">Skor Kelakuan: {st.skorPerilaku}/100</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Achievements list */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                <div className="pb-2 border-b border-slate-100 flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase text-emerald-700 tracking-wider">Apresiasi & Prestasi Kesiswaan Tertinggi</h4>
                  <span className="text-[9px] bg-emerald-50 text-emerald-700 font-mono font-bold px-2 py-0.5 rounded border border-emerald-100">Rekomendasi Rapor</span>
                </div>

                <div className="space-y-3">
                  {schoolStats.topPrestasi.map((st, index) => (
                    <div key={st.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-50 bg-slate-50/50">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-400">#{index+1}</span>
                          <p className="text-xs font-bold text-slate-800">{st.name}</p>
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold">Kelas: {st.kelas} | NISN: {st.nisn}</p>
                      </div>

                      <div className="text-right">
                        <span className="bg-emerald-100 text-emerald-800 font-mono text-[10px] font-black px-2.5 py-1 rounded-full">
                          {st.totalApresiasi} Poin Apresiasi
                        </span>
                        <p className="text-[9px] text-slate-400 mt-1 font-semibold text-emerald-600">Skor Kelakuan: {st.skorPerilaku}/100</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PERSETUJUAN */}
        {activeTab === 'persetujuan' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
            <div className="pb-2 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Antrean Verifikasi Sanksi & Apresiasi Sekolah</h3>
                <p className="text-[10px] text-slate-400">Pencatatan poin oleh guru mata pelajaran, guru piket, atau guru BK yang memerlukan persetujuan pimpinan kesiswaan.</p>
              </div>
              <span className="bg-amber-100 text-amber-800 font-mono font-bold text-[10px] px-2.5 py-1 rounded border border-amber-200">
                {pendingApprovals.length} Usulan Tertunda
              </span>
            </div>

            <div className="space-y-4">
              {pendingApprovals.map(log => (
                <div key={log.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition hover:bg-slate-50/50">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                        log.tipe === 'pelanggaran'
                          ? 'bg-rose-50 border-rose-200 text-rose-700'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      }`}>
                        {log.tipe} (Kode: {log.kodeAturan})
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{log.tanggal}</span>
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-xs text-slate-800 font-bold">
                        Siswa: {log.namaSiswa} <span className="text-slate-400 text-[10px] font-bold font-mono">({log.kelas})</span>
                      </p>
                      <p className="text-xs font-semibold text-sky-950 font-serif">"{log.namaAturan}"</p>
                      {log.catatan && (
                        <p className="text-[11px] text-slate-500 italic">Keterangan: "{log.catatan}"</p>
                      )}
                      <p className="text-[9px] text-slate-400">Dilaporkan Oleh: <span className="font-bold">{log.dilaporkanOleh}</span></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end">
                    <span className={`font-mono text-xs font-black px-3 py-1 rounded-lg border ${
                      log.tipe === 'pelanggaran' ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}>
                      {log.tipe === 'pelanggaran' ? '-' : '+'}{log.bobot} Bobot Poin
                    </span>

                    <button
                      onClick={() => handleApprovePoint(log.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs p-2 rounded-lg flex items-center gap-1 cursor-pointer transition shadow-sm"
                      title="Setujui dan masukkan ke Buku Kelakuan Siswa"
                    >
                      <CheckCircle className="w-4 h-4" /> <span className="hidden sm:inline">Setujui</span>
                    </button>

                    <button
                      onClick={() => handleRejectPoint(log.id)}
                      className="bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs p-2 rounded-lg flex items-center gap-1 cursor-pointer transition border border-rose-300"
                      title="Tolak usulan"
                    >
                      <XCircle className="w-4 h-4" /> <span className="hidden sm:inline">Tolak</span>
                    </button>
                  </div>
                </div>
              ))}

              {pendingApprovals.length === 0 && (
                <div className="text-center py-16 border border-dashed border-slate-200 rounded-xl space-y-2">
                  <CheckCircle className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-400 italic font-medium">Antrean bersih! Belum ada pengusulan sanksi/apresiasi kesiswaan baru.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SKOR KELAKUAN & PRINT INDIVIDUAL */}
        {activeTab === 'siswa_poin' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Students lists */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
              <div className="pb-2 border-b border-slate-100">
                <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Log Skor Buku Saku Perilaku Siswa</h3>
                <p className="text-[10px] text-slate-400">Pilih salah satu siswa di bawah ini untuk melihat detail log aktivitas kelakuan, sanksi, apresiasi, serta mencetak kartu kendali disiplin kesiswaan.</p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-bold text-[10px] text-slate-500 uppercase">
                      <th className="p-3">Siswa / Rombel</th>
                      <th className="p-3 text-center">Pelanggaran (Red)</th>
                      <th className="p-3 text-center">Apresiasi (Green)</th>
                      <th className="p-3 text-center">Sisa Skor (100)</th>
                      <th className="p-3 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentStats.map(st => {
                      let ratingColor = 'text-emerald-600 bg-emerald-50 border-emerald-100';
                      if (st.skorPerilaku < 85) ratingColor = 'text-amber-600 bg-amber-50 border-amber-100';
                      if (st.skorPerilaku < 70) ratingColor = 'text-rose-600 bg-rose-50 border-rose-100';

                      return (
                        <tr key={st.id} className="hover:bg-slate-50/40">
                          <td className="p-3">
                            <p className="font-bold text-slate-800">{st.name}</p>
                            <p className="text-[9px] text-slate-400 font-bold">Kelas {st.kelas} | NISN: {st.nisn}</p>
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-rose-600">{st.totalPelanggaran}</td>
                          <td className="p-3 text-center font-mono font-bold text-emerald-600">{st.totalApresiasi}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded font-mono font-bold border text-[11px] ${ratingColor}`}>
                              {st.skorPerilaku}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => setSelectedStudentForPrint(st)}
                              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] px-2 py-1 rounded cursor-pointer transition flex items-center gap-1 mx-auto"
                            >
                              <FileText className="w-3 h-3" /> Detail Log
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Individual log & Printing wrapper */}
            <div className="lg:col-span-5 space-y-4">
              {selectedStudentForPrint ? (
                <div className="space-y-4">
                  <div className="bg-slate-900 text-white p-4 rounded-t-2xl flex justify-between items-center border-b border-slate-800">
                    <span className="text-[9px] font-mono tracking-widest text-sky-400 font-bold uppercase">LOG INDIVIDUAL SISWA</span>
                    <button
                      onClick={() => window.print()}
                      className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-[10px] px-3 py-1.5 rounded flex items-center gap-1 cursor-pointer transition shadow-md"
                    >
                      <Printer className="w-3.5 h-3.5" /> Cetak Kartu Kendali
                    </button>
                  </div>

                  {/* Print Stage Card */}
                  <div className="bg-white p-6 border border-slate-200 rounded-b-2xl shadow-md space-y-6 text-slate-800 font-serif print-sheet">
                    {/* Kop Mini */}
                    <div className="border-b-2 border-black pb-2 text-center text-[9px] font-sans">
                      <p className="font-bold uppercase tracking-wider">SMP NEGERI 1 WANAYASA</p>
                      <p className="italic text-slate-500">Pusat Catatan Disiplin & Buku Saku Kesiswaan</p>
                    </div>

                    <div className="space-y-2 font-sans text-xs">
                      <div className="grid grid-cols-3">
                        <span className="text-slate-400">Nama Murid</span>
                        <span className="col-span-2 font-black text-slate-950">: {selectedStudentForPrint.name}</span>
                      </div>
                      <div className="grid grid-cols-3">
                        <span className="text-slate-400">Kelas / NISN</span>
                        <span className="col-span-2 font-semibold">: Kelas {selectedStudentForPrint.kelas} | NISN {selectedStudentForPrint.nisn}</span>
                      </div>
                      <div className="grid grid-cols-3">
                        <span className="text-slate-400">Skor Kelakuan</span>
                        <span className="col-span-2 font-bold text-sky-950">: {selectedStudentForPrint.skorPerilaku}/100</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider font-sans text-slate-400">Arsip Kejadian Tersertifikasi:</h4>
                      
                      <div className="space-y-2 font-sans text-[11px] max-h-[250px] overflow-y-auto pr-1">
                        {selectedStudentForPrint.logs.map(log => (
                          <div key={log.id} className="p-2 border border-slate-100 rounded bg-slate-50/50 space-y-1">
                            <div className="flex justify-between items-center">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${
                                log.tipe === 'pelanggaran' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              }`}>
                                {log.tipe} ({log.kodeAturan})
                              </span>
                              <span className="font-mono text-[8px] text-slate-400">{log.tanggal}</span>
                            </div>
                            <p className="font-bold text-slate-800">{log.namaAturan}</p>
                            {log.catatan && (
                              <p className="text-[9px] text-slate-500 italic">"Keterangan: {log.catatan}"</p>
                            )}
                            <p className="text-[8px] text-slate-400">Petugas: {log.dilaporkanOleh}</p>
                          </div>
                        ))}

                        {selectedStudentForPrint.logs.length === 0 && (
                          <p className="text-xs text-slate-400 italic text-center py-6 font-sans">Buku kelakuan murid ini masih bersih!</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-dashed border-slate-200 font-sans text-[9px] grid grid-cols-2 gap-4">
                      <div>
                        <p>Tanda Tangan PKS,</p>
                        <div className="h-8"></div>
                        <p className="font-bold underline">{activeGuru?.name}</p>
                      </div>
                      <div className="text-right">
                        <p>Wanayasa, {virtualDate}</p>
                        <div className="h-8"></div>
                        <p className="font-bold underline">Wali Kelas {selectedStudentForPrint.kelas}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 p-8 rounded-2xl text-center space-y-3 h-full flex flex-col justify-center py-20">
                  <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-400 italic">Belum ada murid yang dipilih untuk memuat rincian arsip individual.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 4: ATURAN POIN MANAGER */}
        {activeTab === 'master_aturan' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left form for adding/editing rules */}
            <div className="lg:col-span-4 space-y-4">
              <div className="space-y-1">
                <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                  {editingRuleId ? 'Edit Master Aturan Poin' : 'Tambah Master Aturan Poin Baru'}
                </h3>
                <p className="text-[10px] text-slate-400">Aturan ini akan otomatis didistribusikan ke log pengisian guru bimbingan/mapel dan guru piket.</p>
              </div>

              <form onSubmit={handleSaveRule} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                <div>
                  <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Tipe Aturan</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRuleForm(prev => ({ ...prev, tipe: 'pelanggaran' }))}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer text-center ${
                        ruleForm.tipe === 'pelanggaran'
                          ? 'bg-rose-50 border-rose-300 text-rose-700'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      Pelanggaran
                    </button>
                    <button
                      type="button"
                      onClick={() => setRuleForm(prev => ({ ...prev, tipe: 'apresiasi' }))}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer text-center ${
                        ruleForm.tipe === 'apresiasi'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      Apresiasi
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Kode Aturan (Unik)</label>
                  <input
                    type="text"
                    required
                    value={ruleForm.kode}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, kode: e.target.value }))}
                    placeholder="Contoh: P11 atau A07"
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Uraian / Deskripsi Aturan</label>
                  <textarea
                    rows={3}
                    required
                    value={ruleForm.nama}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, nama: e.target.value }))}
                    placeholder="Contoh: Datang terlambat lebih dari 15 menit..."
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Bobot Poin (Denda / Apresiasi)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={100}
                    value={ruleForm.bobot}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, bobot: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition"
                  >
                    <Plus className="w-4 h-4" /> {editingRuleId ? 'Simpan Edit Aturan' : 'Tambah Aturan'}
                  </button>

                  {editingRuleId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRuleId(null);
                        setRuleForm({ kode: '', nama: '', bobot: 5, tipe: 'pelanggaran' });
                      }}
                      className="bg-slate-100 border border-slate-200 text-slate-500 px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Right table of rules */}
            <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
              <div className="pb-2 border-b border-slate-100">
                <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Daftar Aturan Poin Kedisiplinan</h3>
                <p className="text-[10px] text-slate-400">Total {aturanPoin.length} aturan terdaftar di database kesiswaan.</p>
              </div>

              <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                {aturanPoin.map(rule => (
                  <div key={rule.id} className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 flex justify-between items-center gap-3 hover:bg-slate-100/50 transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-slate-900 bg-slate-200 px-1.5 py-0.5 rounded border border-slate-300">
                          {rule.kode}
                        </span>
                        <span className={`px-2 py-0.25 rounded text-[8px] font-black uppercase border ${
                          rule.tipe === 'pelanggaran'
                            ? 'bg-rose-50 border-rose-200 text-rose-700'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        }`}>
                          {rule.tipe}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 leading-tight">{rule.nama}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`font-mono text-xs font-black px-2 py-0.5 rounded border ${
                        rule.tipe === 'pelanggaran' ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}>
                        {rule.tipe === 'pelanggaran' ? '-' : '+'}{rule.bobot} Poin
                      </span>

                      <button
                        onClick={() => handleEditRule(rule)}
                        className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition cursor-pointer"
                        title="Edit Aturan"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Hapus Aturan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
