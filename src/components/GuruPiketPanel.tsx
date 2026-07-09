import { useState, useMemo, useEffect, FormEvent } from 'react';
import { useApp } from '../context/AppContext';
import { GuruAbsenPiket, JurnalPiketHarian } from '../types';
import { ArrowLeft, BookOpen, AlertCircle, Eye, Printer, Filter, ShieldAlert, Plus, Save, CheckCircle2, X, Check } from 'lucide-react';

interface GuruPiketPanelProps {
  onBack: () => void;
}

export default function GuruPiketPanel({ onBack }: GuruPiketPanelProps) {
  const { 
    activeGuru, 
    gurus, 
    siswa, 
    jurnalPiket, 
    piketConfig,
    virtualDay, 
    virtualDate,
    addGuruKetidakhadiranPiket,
    saveJurnalPiketHarian,
    updateSiswaPresensi,
    izinGuru,
    approveIzinGuru,
    rejectIzinGuru
  } = useApp();

  const [activeTab, setActiveTab] = useState<'operasional' | 'presensi'>('presensi');
  const [filterKelas, setFilterKelas] = useState<'Exception' | 'VII-A' | 'VIII-A' | 'IX-A' | 'VII-B' | 'VIII-B' | 'IX-B'>('Exception');

  // Print Preview Modal state
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Active Daily Piket Log
  const activePiketLog = useMemo(() => {
    return jurnalPiket.find(jp => jp.tanggal === virtualDate) || {
      id: '',
      tanggal: virtualDate,
      hari: virtualDay,
      guruPiketIds: piketConfig.find(p => p.hari === virtualDay)?.guruIds || [],
      catatanKejadian: '',
      guruAbsenList: []
    };
  }, [jurnalPiket, virtualDate, virtualDay, piketConfig]);

  // Jurnal Piket Harian event state
  const [catatanKejadian, setCatatanKejadian] = useState(activePiketLog.catatanKejadian);
  const [eventSavedMsg, setEventSavedMsg] = useState('');

  // Sync state when virtualDate / activePiketLog changes, loading draft if any
  useEffect(() => {
    const savedDraft = localStorage.getItem(`autosave_jurnal_piket_${virtualDate}`);
    if (savedDraft !== null) {
      setCatatanKejadian(savedDraft);
    } else {
      setCatatanKejadian(activePiketLog.catatanKejadian || '');
    }
  }, [virtualDate, activePiketLog.catatanKejadian]);

  // Save to localStorage when catatanKejadian changes
  useEffect(() => {
    if (catatanKejadian !== activePiketLog.catatanKejadian) {
      localStorage.setItem(`autosave_jurnal_piket_${virtualDate}`, catatanKejadian);
    } else {
      localStorage.removeItem(`autosave_jurnal_piket_${virtualDate}`);
    }
  }, [catatanKejadian, virtualDate, activePiketLog.catatanKejadian]);

  // Guru Absen form state
  const [absenGuruId, setAbsenGuruId] = useState('');
  const [absenAlasan, setAbsenAlasan] = useState('Izin');
  const [absenTugas, setAbsenTugas] = useState('');
  const [absenSuccess, setAbsenSuccess] = useState('');

  const handleSaveEvents = (e: FormEvent) => {
    e.preventDefault();
    saveJurnalPiketHarian(virtualDate, virtualDay, catatanKejadian);
    localStorage.removeItem(`autosave_jurnal_piket_${virtualDate}`);
    setEventSavedMsg('Catatan Kejadian Harian berhasil disimpan!');
    setTimeout(() => setEventSavedMsg(''), 4000);
  };

  const handleAddGuruAbsen = (e: FormEvent) => {
    e.preventDefault();
    if (!absenGuruId || !absenTugas.trim()) {
      alert('Nama guru dan rincian tugas mandiri wajib diisi!');
      return;
    }

    const targetGuru = gurus.find(g => g.id === absenGuruId);
    if (!targetGuru) return;

    const newAbsenRecord: GuruAbsenPiket = {
      id: `ga-${Date.now()}`,
      guruId: targetGuru.id,
      namaGuru: targetGuru.name,
      alasan: absenAlasan,
      tugasMandiri: absenTugas
    };

    addGuruKetidakhadiranPiket(virtualDate, virtualDay, newAbsenRecord);
    setAbsenSuccess(`Sukses mencatat ketidakhadiran: ${targetGuru.name}. Lembar tugas disimpan.`);
    setAbsenGuruId('');
    setAbsenTugas('');
    setTimeout(() => setAbsenSuccess(''), 4000);
  };

  // Real-time Student Attendance Lists
  // State Awal (Exception): lists all students whose status is Sakit, Izin, Alfa (Absent se-sekolah)
  const studentExceptionList = useMemo(() => {
    return siswa.filter(s => s.statusAbsen !== 'Hadir');
  }, [siswa]);

  // Filter List: Lists all students in selected class
  const classFilteredStudents = useMemo(() => {
    if (filterKelas === 'Exception') return studentExceptionList;
    return siswa.filter(s => s.kelas === filterKelas);
  }, [siswa, filterKelas, studentExceptionList]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalSiswa = siswa.length;
    const sakit = siswa.filter(s => s.statusAbsen === 'Sakit').length;
    const izin = siswa.filter(s => s.statusAbsen === 'Izin').length;
    const alfa = siswa.filter(s => s.statusAbsen === 'Alfa').length;
    const hadir = totalSiswa - sakit - izin - alfa;
    
    return { totalSiswa, sakit, izin, alfa, hadir };
  }, [siswa]);

  return (
    <div className="space-y-6">
      {/* Back button Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg p-2 transition flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> <span className="text-xs font-semibold">Kembali</span>
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Pusat Kendali Guru Piket
            </h2>
            <p className="text-xs text-slate-500 font-medium">Melaporkan ketidakhadiran guru, mengisi jurnal operasional sekolah, dan monitoring presensi siswa se-sekolah.</p>
          </div>
        </div>

        {activeGuru?.role === 'admin' && (
          <span className="bg-amber-100 text-amber-800 text-[10px] border border-amber-300 font-black px-2.5 py-1 rounded-full uppercase">
            Bypass Admin
          </span>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Siswa</p>
          <p className="text-xl font-black text-slate-800 mt-1">{stats.totalSiswa}</p>
        </div>
        <div className="bg-sky-50 p-4 rounded-xl border border-sky-100 shadow-xs text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-sky-500">Hadir</p>
          <p className="text-xl font-black text-sky-700 mt-1">{stats.hadir}</p>
        </div>
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 shadow-xs text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Sakit</p>
          <p className="text-xl font-black text-amber-700 mt-1">{stats.sakit}</p>
        </div>
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 shadow-xs text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Izin</p>
          <p className="text-xl font-black text-indigo-700 mt-1">{stats.izin}</p>
        </div>
        <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 shadow-xs text-center col-span-2 md:col-span-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Alfa (Tanpa Keterangan)</p>
          <p className="text-xl font-black text-rose-700 mt-1">{stats.alfa}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-2">
        <button
          onClick={() => setActiveTab('presensi')}
          className={`px-4 py-2 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'presensi' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Eye className="w-4 h-4" /> Monitoring Kehadiran Siswa
        </button>
        <button
          onClick={() => setActiveTab('operasional')}
          className={`px-4 py-2 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'operasional' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Operasional Harian & Guru Absen
        </button>
      </div>

      {/* Tab Panel Contents */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm min-h-[45vh]">
        
        {/* TAB 1: REAL-TIME STUDENT ATTENDANCE MONITORING */}
        {activeTab === 'presensi' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <span>State Presensi: {filterKelas === 'Exception' ? 'Laporan Pengecualian (Siswa Tidak Hadir)' : `Presensi Penuh Kelas ${filterKelas}`}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {filterKelas === 'Exception' 
                    ? 'Menampilkan daftar gabungan semua murid se-sekolah yang tercatat absen saja (Izin/Sakit/Alfa) untuk efisiensi pelaporan.'
                    : `Menampilkan semua daftar presensi murid di dalam Kelas ${filterKelas}.`}
                </p>
              </div>

              {/* Filtering + Print Actions */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={filterKelas}
                    onChange={(e) => setFilterKelas(e.target.value as any)}
                    className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="Exception">● Hanya Siswa Absen</option>
                    <option value="VII-A">Kelas VII-A</option>
                    <option value="VIII-A">Kelas VIII-A</option>
                    <option value="IX-A">Kelas IX-A</option>
                    <option value="VII-B">Kelas VII-B</option>
                    <option value="VIII-B">Kelas VIII-B</option>
                    <option value="IX-B">Kelas IX-B</option>
                  </select>
                </div>

                {/* Print trigger button */}
                <button
                  onClick={() => setShowPrintModal(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Cetak Rekap Massal
                </button>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                    <th className="p-3 w-1/4">Nama Murid</th>
                    <th className="p-3">Rombel/Kelas</th>
                    <th className="p-3 text-center">Status Kehadiran</th>
                    <th className="p-3">Keterangan / Alasan</th>
                    <th className="p-3 text-right">Ubah Presensi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {classFilteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/50">
                      <td className="p-3">
                        <p className="font-bold text-slate-800">{student.name}</p>
                        <p className="text-[9px] text-slate-400 font-mono">NISN: {student.nisn}</p>
                      </td>
                      <td className="p-3 font-semibold text-slate-600">{student.kelas}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-black border uppercase tracking-wider ${
                          student.statusAbsen === 'Hadir' ? 'bg-sky-50 text-sky-700 border-sky-100'
                          : student.statusAbsen === 'Sakit' ? 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse'
                          : student.statusAbsen === 'Izin' ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                          : 'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>
                          {student.statusAbsen}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 font-medium italic">
                        {student.catatanAbsen || '-'}
                      </td>
                      <td className="p-3 text-right">
                        {/* Inline status switcher for quick manual override */}
                        <div className="inline-flex gap-1 bg-slate-100 p-0.5 rounded border border-slate-200">
                          {['Hadir', 'Sakit', 'Izin', 'Alfa'].map(opt => (
                            <button
                              key={opt}
                              onClick={() => {
                                const notes = opt !== 'Hadir' ? prompt('Masukkan rincian keterangan:') || `${opt} di Hari ${virtualDay}` : '';
                                updateSiswaPresensi(student.id, opt as any, notes);
                              }}
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition cursor-pointer ${
                                student.statusAbsen === opt 
                                  ? 'bg-slate-900 text-white shadow-xs' 
                                  : 'text-slate-500 hover:text-slate-800 hover:bg-white'
                              }`}
                            >
                              {opt[0]}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {classFilteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-400 italic">
                        <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        Luar biasa! Tidak ada pengecualian ketidakhadiran tercatat. Semua murid hadir di kelas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: OPERASIONAL GURU ABSEN & DAILY JURNAL */}
        {activeTab === 'operasional' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Jurnal Harian & Catatan Kejadian */}
            <form onSubmit={handleSaveEvents} className="lg:col-span-5 space-y-4">
              <div className="space-y-1 pb-2 border-b border-slate-100 flex justify-between items-start">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Kejadian Penting Sekolah</h4>
                  <p className="text-[10px] text-slate-400">Catat kondisi operasional, kebersihan, ketertiban, dan kejadian harian.</p>
                </div>
                <span className="flex items-center gap-1 text-[8px] md:text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-sans shrink-0">
                  <Check className="w-3 h-3" /> Draft Autosaved
                </span>
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Tanggal Piket</label>
                <div className="font-mono text-xs text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200">
                  {virtualDay}, {virtualDate}
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Catatan Kejadian Penting / Log Operasional</label>
                <textarea
                  rows={6}
                  value={catatanKejadian}
                  onChange={(e) => setCatatanKejadian(e.target.value)}
                  placeholder="Contoh: KBM terlaksana kondusif. Dilaksanakan pemeriksaan kuku di gerbang masuk. Pintu gerbang dikunci jam 07.15 WIB. Terdapat pembersihan berkala di laboratorium IPA..."
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
                ></textarea>
              </div>

              {eventSavedMsg && (
                <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 p-2 rounded font-semibold animate-fade-in">
                  {eventSavedMsg}
                </p>
              )}

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1 shadow-sm"
              >
                <Save className="w-4 h-4" /> Simpan Jurnal Piket Harian
              </button>
            </form>

            {/* Right: Laporan Ketidakhadiran Guru */}
            <div className="lg:col-span-7 border-l border-slate-100 lg:pl-8 space-y-6">
              
              {/* Form guru absen */}
              <form onSubmit={handleAddGuruAbsen} className="space-y-4">
                <div className="space-y-1 pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Laporan Ketidakhadiran Guru Mapel</h4>
                  <p className="text-[10px] text-slate-400">Catat guru yang berhalangan hadir beserta lembar tugas mandiri yang dititipkan.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1 font-sans">Nama Guru Berhalangan</label>
                    <select
                      value={absenGuruId}
                      onChange={(e) => setAbsenGuruId(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs"
                    >
                      <option value="">-- Pilih Guru --</option>
                      {gurus.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Alasan Ketidakhadiran</label>
                    <select
                      value={absenAlasan}
                      onChange={(e) => setAbsenAlasan(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-semibold"
                    >
                      <option value="Izin">Izin (Keperluan Keluarga)</option>
                      <option value="Sakit">Sakit (Keterangan Dokter)</option>
                      <option value="Dinas Luar">Dinas Luar (Pelatihan/Rapat)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Rincian Lembar Tugas Mandiri Yang Dititipkan</label>
                  <textarea
                    rows={3}
                    required
                    value={absenTugas}
                    onChange={(e) => setAbsenTugas(e.target.value)}
                    placeholder="Contoh: Mengerjakan soal pilihan ganda di buku paket halaman 12-14 nomor 1-20, dikumpulkan di atas meja piket setelah jam pelajaran selesai."
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  ></textarea>
                </div>

                {absenSuccess && (
                  <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 p-2 rounded font-semibold animate-fade-in">
                    {absenSuccess}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Catat Guru Berhalangan
                </button>
              </form>

              {/* Lists of currently reported absent teachers for activePiketLog */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Daftar Guru Absen Hari Ini</h5>
                {activePiketLog.guruAbsenList && activePiketLog.guruAbsenList.length > 0 ? (
                  <div className="space-y-2">
                    {activePiketLog.guruAbsenList.map(item => (
                      <div key={item.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-bold text-slate-800">{item.namaGuru}</p>
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded">
                            {item.alasan}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          <span className="font-bold text-slate-500">Tugas: </span> {item.tugasMandiri}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic font-medium py-2">Belum ada laporan guru absen.</p>
                )}
              </div>

              {/* Teacher Permit Approval Queue */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Verifikasi Pengajuan Izin Guru</h5>
                  <span className="bg-amber-100 text-amber-800 font-bold text-[8px] px-1.5 py-0.5 rounded-full uppercase font-mono">
                    {izinGuru.filter(i => i.status === 'Diajukan').length} Antrean
                  </span>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {izinGuru.filter(i => i.status === 'Diajukan').map((izin) => (
                    <div key={izin.id} className="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/30 space-y-3 text-xs">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="font-bold text-slate-900">{izin.namaGuru}</p>
                          <p className="text-[9px] text-slate-400 font-mono">Diajukan pada {izin.tanggalIzin} ({izin.tipeIzin})</p>
                        </div>
                        <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[8px] font-black uppercase font-mono">
                          {izin.status}
                        </span>
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-slate-100 space-y-1.5">
                        <p className="text-[11px] text-slate-700 leading-relaxed">
                          <span className="font-bold text-slate-400 block uppercase text-[8px]">Alasan / Keterangan:</span>
                          "{izin.keterangan}"
                        </p>
                        <p className="text-[11px] text-slate-700 leading-relaxed">
                          <span className="font-bold text-slate-400 block uppercase text-[8px]">Tugas Mandiri Dititipkan:</span>
                          {izin.tugasMandiri}
                        </p>
                        {izin.attachmentUrl && (
                          <div className="pt-1.5 flex items-center gap-1.5 text-sky-700 text-[10px]">
                            <span className="font-semibold">📁 Surat Keterangan:</span>
                            <a href={izin.attachmentUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-sky-800 font-bold">
                              {izin.attachmentUrl.split('/').pop()}
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (confirm(`Setujui izin ${izin.namaGuru}? Tugas mandiri akan didistribusikan secara otomatis.`)) {
                              approveIzinGuru(izin.id, activeGuru?.name || 'Guru Piket');
                            }
                          }}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] py-1.5 rounded transition cursor-pointer text-center"
                        >
                          Setujui & Distribusikan
                        </button>
                        <button
                          onClick={() => {
                            const note = prompt('Masukkan alasan penolakan:') || 'Berkas kurang lengkap';
                            rejectIzinGuru(izin.id, activeGuru?.name || 'Guru Piket', note);
                          }}
                          className="bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-bold text-[10px] px-3 py-1.5 rounded transition cursor-pointer text-center"
                        >
                          Tolak
                        </button>
                      </div>
                    </div>
                  ))}

                  {izinGuru.filter(i => i.status === 'Diajukan').length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-4">Tidak ada antrean verifikasi izin guru harian.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* PRINT PREVIEW OVERLAY MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-200 flex flex-col">
            
            {/* Modal Controls bar */}
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
                <Printer className="w-5 h-5 text-sky-400" /> Simulasi Dokumen Rekap Ketidakhadiran Massal
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer"
                >
                  Cetak / Simpan PDF
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs p-2 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document body with official Kop Surat SMPN 1 Wanayasa */}
            <div className="flex-1 overflow-y-auto p-12 bg-white text-slate-800 font-serif">
              
              {/* KOP SURAT */}
              <div className="border-b-4 border-double border-black pb-4 text-center space-y-1 relative">
                {/* School emblem placeholder */}
                <div className="absolute left-0 top-0 w-16 h-16 border-2 border-black rounded-lg flex items-center justify-center font-bold text-[10px] font-sans">
                  EMBLEM
                </div>
                
                <h3 className="text-base font-black uppercase tracking-wider leading-none">Pemerintah Kabupaten Purwakarta</h3>
                <h3 className="text-sm font-bold uppercase leading-none">Dinas Pendidikan dan Kebudayaan</h3>
                <h2 className="text-xl font-black uppercase tracking-wide leading-none">SMP Negeri 1 Wanayasa</h2>
                <p className="text-[10px] font-sans italic text-slate-600 leading-none">
                  Jl. Raya Timur Wanayasa, Kabupaten Purwakarta, Jawa Barat 41181 | Telp: (0264) 8282103
                </p>
              </div>

              {/* Document metadata */}
              <div className="mt-8 text-center space-y-1.5">
                <h4 className="text-sm font-black uppercase underline tracking-wider">Rekapitulasi Ketidakhadiran Murid Massal</h4>
                <p className="text-xs font-sans text-slate-600 font-medium">Hari: {virtualDay} | Tanggal: {virtualDate}</p>
              </div>

              {/* Table list of absent students only (Mass rekap) */}
              <div className="mt-8 font-sans">
                <table className="w-full text-left border-collapse border border-black">
                  <thead>
                    <tr className="bg-slate-100 text-xs font-bold border-b border-black">
                      <th className="p-2 border border-black w-10 text-center">No</th>
                      <th className="p-2 border border-black">Nama Lengkap Murid</th>
                      <th className="p-2 border border-black w-24 text-center">Kelas</th>
                      <th className="p-2 border border-black w-28 text-center">Status Absen</th>
                      <th className="p-2 border border-black">Alasan / Catatan Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {studentExceptionList.map((st, i) => (
                      <tr key={st.id}>
                        <td className="p-2 border border-black text-center font-bold">{i + 1}</td>
                        <td className="p-2 border border-black font-semibold text-slate-900">{st.name}</td>
                        <td className="p-2 border border-black text-center font-bold">{st.kelas}</td>
                        <td className="p-2 border border-black text-center font-black text-slate-800">{st.statusAbsen}</td>
                        <td className="p-2 border border-black italic text-slate-600">{st.catatanAbsen || '-'}</td>
                      </tr>
                    ))}
                    {studentExceptionList.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 border border-black text-center italic text-slate-500">
                          Seluruh murid dinyatakan HADIR. Tidak ada data pengecualian ketidakhadiran untuk hari ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Official Signature Lines */}
              <div className="mt-16 grid grid-cols-2 gap-8 font-sans text-xs">
                <div>
                  <p className="font-semibold text-slate-700">Mengetahui,</p>
                  <p className="font-bold text-slate-950 uppercase mt-0.5">Kepala Sekolah SMPN 1 Wanayasa</p>
                  <div className="h-16"></div>
                  <p className="font-black text-slate-900 underline">Drs. H. Suherman, M.Pd.</p>
                  <p className="text-slate-500 font-mono text-[10px]">NIP. 197005121995031002</p>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-slate-700 font-serif">Wanayasa, {virtualDate}</p>
                  <p className="font-bold text-slate-950 uppercase mt-0.5">Guru Piket Pembina</p>
                  <div className="h-16"></div>
                  <p className="font-black text-slate-900 underline">{activeGuru?.name || '...............................................'}</p>
                  <p className="text-slate-500 font-mono text-[10px]">NIP. {activeGuru?.nip || '---------------------------'}</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
