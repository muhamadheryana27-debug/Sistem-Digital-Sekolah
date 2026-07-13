import React, { useState, useMemo, FormEvent, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { JurnalMengajar } from '../types';
import { LIST_KELAS_LENGKAP } from '../utils/kelasHelper';
import { ArrowLeft, BookOpen, Calendar, GraduationCap, PlusCircle, Save, Check, AlertTriangle, ClipboardList, ThumbsUp, AlertCircle } from 'lucide-react';

interface GuruMapelPanelProps {
  onBack: () => void;
  Jurnal?: JurnalMengajar[];
}

interface NilaiSiswaState {
  [siswaId: string]: {
    harian: string;
    tugas: string;
    uts: string;
    uas: string;
    psat: string;
    psaj: string;
  };
}

const GuruMapelPanel: React.FC<GuruMapelPanelProps> = ({ onBack }) => {
  const { currentUser, jurnalMengajar: contextJurnal = [], addJurnalMengajar, siswa = [], updateNilaiSiswa } = useApp();
  
  const [activeSubTab, setActiveSubTab] = useState<'jurnal' | 'nilai'>('jurnal');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // --- STATE FORM JURNAL MENGAJAR ---
  const [mataPelajaran, setMataPelajaran] = useState('Informatika');
  const [kelasJurnal, setKelasJurnal] = useState('');
  const [jamKe, setJamKe] = useState('1-2');
  const [materi, setMateri] = useState('');
  const [aktivitas, setAktivitas] = useState('');

  // --- STATE DINAMIS TABEL PRESENSI & LOG KHUSUS SISWA (Sesuai Laravel) ---
  const [absensi, setAbsensi] = useState<{ [siswaId: string]: string }>({});
  const [logTypes, setLogTypes] = useState<{ [siswaId: string]: string }>({});
  const [logNotes, setLogNotes] = useState<{ [siswaId: string]: string }>({});

  // --- STATE FILTER & NILAI SISWA ---
  const [kelasNilai, setKelasNilai] = useState('VII-A');
  const [mapelNilai, setMapelNilai] = useState('Informatika');
  const [nilaiSiswa, setNilaiSiswa] = useState<NilaiSiswaState>({});

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Otomatisasi Mapel berdasarkan Profile Guru aktif
  useEffect(() => {
    if (currentUser?.mata_pelajaran) {
      setMataPelajaran(currentUser.mata_pelajaran);
      setMapelNilai(currentUser.mata_pelajaran);
    }
  }, [currentUser]);

  // 1. Filter riwayat jurnal berdasarkan akun guru aktif
  const myJurnal = useMemo(() => {
    if (!currentUser) return [];
    return contextJurnal.filter(j => j && String(j.guruId).trim() === String(currentUser.id).trim());
  }, [contextJurnal, currentUser]);

  const myMapels = useMemo(() => {
    if (currentUser?.mata_pelajaran) return [currentUser.mata_pelajaran];
    if (myJurnal.length === 0) return ['Informatika'];
    const mapels = myJurnal.map(j => j.guruName).filter(Boolean);
    return Array.from(new Set(mapels));
  }, [myJurnal, currentUser]);

  // Siswa difilter berdasarkan kelas pilihan pada Tab aktif
  const siswaFilterJurnal = useMemo(() => {
    return siswa.filter(s => s && s.kelas === kelasJurnal);
  }, [siswa, kelasJurnal]);

  const filteredSiswa = useMemo(() => {
    return siswa.filter(s => s && s.kelas === kelasNilai);
  }, [siswa, kelasNilai]);

  const handleStatusChange = (siswaId: string, status: string) => {
    setAbsensi(prev => ({ ...prev, [siswaId]: status }));
  };

  const handleLogTypeChange = (siswaId: string, type: string) => {
    setLogTypes(prev => ({ ...prev, [siswaId]: type }));
  };

  const handleNoteChange = (siswaId: string, text: string) => {
    setLogNotes(prev => ({ ...prev, [siswaId]: text }));
  };

  const handleNilaiChange = (siswaId: string, kolom: string, value: string) => {
    setNilaiSiswa(prev => ({
      ...prev,
      [siswaId]: {
        ...(prev[siswaId] || { harian: '', tugas: '', uts: '', uas: '', psat: '', psaj: '' }),
        [kolom]: value
      }
    }));
  };

  // Submit Jurnal Mengajar + Absensi + Catatan Khusus Terintegrasi
  const handleJurnalSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || !kelasJurnal || !jamKe || !materi) {
      alert("Mohon lengkapi Detail Pembelajaran (Jam Pelajaran, Kelas, dan Materi)!");
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // 1. Payload Absensi
      const absensiPayload = siswaFilterJurnal.map(s => ({
        student_id: s.id,
        status: absensi[s.id] || 'H'
      }));

      // 2. Payload Log Kejadian Khusus (Hanya jika diisi teksnya)
      const logsPayload = siswaFilterJurnal
        .filter(s => logNotes[s.id] && logNotes[s.id].trim() !== '')
        .map(s => ({
          student_id: s.id,
          jenis_kejadian: logTypes[s.id] || 'apresiasi',
          catatan_kejadian: logNotes[s.id]
        }));

      await addJurnalMengajar(
        {
          guruId: currentUser.id,
          guruName: mataPelajaran,
          tanggal: today,
          kelas: kelasJurnal,
          jamKe,
          materi,
          aktivitas,
        },
        absensiPayload,
        logsPayload
      );

      setSuccessMsg('Jurnal mengajar, absensi, dan catatan khusus siswa berhasil disimpan!');
      setMateri('');
      setAktivitas('');
      setAbsensi({});
      setLogNotes({});
      setIsFormOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat menyimpan jurnal.');
    } medical {
      setIsSubmitting(false);
    }
  };

  const handleSaveNilai = async () => {
    setSuccessMsg('');
    setErrorMsg('');
    setIsSubmitting(true);
    
    try {
      let successCount = 0;
      for (const s of filteredSiswa) {
        const currentNilai = nilaiSiswa[s.id];
        if (currentNilai) {
          const success = await updateNilaiSiswa(s.id, mapelNilai, currentNilai);
          if (success) successCount++;
        }
      }
      setSuccessMsg(`Berhasil mengamankan data nilai ${successCount} siswa kelas ${kelasNilai}!`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg('Gagal mengamankan data nilai ke database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-6">
      {/* Top Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition cursor-pointer shadow-sm text-slate-600">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Layanan Guru Mata Pelajaran</h1>
            <p className="text-xs text-slate-500">Administrasi jurnal mengajar, presensi real-time, dan rekap penilaian kelas.</p>
          </div>
        </div>

        {/* Tab Penyetelan Sub-Menu */}
        <div className="flex bg-slate-200/70 p-1 rounded-xl border border-slate-300/40 self-start sm:self-auto">
          <button 
            onClick={() => { setActiveSubTab('jurnal'); setSuccessMsg(''); setErrorMsg(''); }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${activeSubTab === 'jurnal' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Jurnal & Absensi
          </button>
          <button 
            onClick={() => { setActiveSubTab('nilai'); setSuccessMsg(''); setErrorMsg(''); }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${activeSubTab === 'nilai' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <ClipboardList className="w-3.5 h-3.5" /> Input Nilai Siswa
          </button>
        </div>
      </div>

      {/* Banner Status Notifikasi */}
      {successMsg && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-xs font-semibold shadow-sm">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <p>{successMsg}</p>
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-xs font-semibold shadow-sm">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      {/* ==================== SUB-TAB JURNAL MENGAJAR ==================== */}
      {activeSubTab === 'jurnal' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>Riwayat Agenda Tatap Muka Jurnal Anda</span>
            </div>
            {!isFormOpen && (
              <button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white font-bold text-xs rounded-xl hover:bg-sky-700 transition shadow-sm cursor-pointer">
                <PlusCircle className="w-4 h-4" /> Input Jurnal & Absensi
              </button>
            )}
          </div>

          {isFormOpen && (
            <form onSubmit={handleJurnalSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-sky-600" /> DETAIL PEMBELAJARAN
                </h3>
                <button type="button" onClick={() => setIsFormOpen(false)} className="text-xs text-slate-400 hover:text-slate-600 font-medium">Batal</button>
              </div>

              {/* Baris Atribut Pembelajaran */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Mata Pelajaran</label>
                  <input
                    type="text"
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 cursor-not-allowed"
                    value={mataPelajaran}
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Pilih Kelas Mengajar</label>
                  <select 
                    value={kelasJurnal} 
                    onChange={(e) => setKelasJurnal(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-bold text-slate-700"
                    required
                  >
                    <option value="">-- Pilih Rombel --</option>
                    {LIST_KELAS_LENGKAP.map(kls => (
                      <option key={kls} value={kls}>{kls}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Jam Pelajaran Ke-</label>
                  <input type="text" value={jamKe} onChange={(e) => setJamKe(e.target.value)} placeholder="Contoh: 1-2 atau 3-4" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium text-slate-700" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Materi Pokok Pembelajaran</label>
                <input type="text" value={materi} onChange={(e) => setMateri(e.target.value)} placeholder="Tuliskan pokok pembahasan materi hari ini..." required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium text-slate-700" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Catatan Hambatan / Aktivitas Umum</label>
                <textarea value={aktivitas} onChange={(e) => setAktivitas(e.target.value)} rows={2} placeholder="Isi hambatan kelas secara umum atau jalannya penugasan KBM..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium text-slate-700" />
              </div>

              {/* ⚡ INTEGRASI SUB FORM TABLE DAFTAR ABSENSI & CATATAN KHUSUS SISWA (Sesuai Desain Laravel) */}
              {kelasJurnal && (
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    DAFTAR ABSENSI & CATATAN KHUSUS SISWA ({kelasJurnal})
                  </h4>

                  {siswaFilterJurnal.length === 0 ? (
                    <p className="text-xs text-amber-600 italic p-3 bg-amber-50 rounded-xl border border-amber-200">
                      Tidak ditemukan data records siswa aktif untuk kelas {kelasJurnal}.
                    </p>
                  ) : (
                    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
                      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex justify-between items-center text-[10px] font-bold text-slate-500 tracking-wide uppercase">
                        <div className="w-7/12">Nama Siswa / Kejadian Spesifik</div>
                        <div className="w-5/12 text-center">Status Absen</div>
                      </div>

                      <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                        {siswaFilterJurnal.map(s => (
                          <div key={s.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50/80 transition gap-3">
                            
                            {/* Kiri: Nama & Form Catatan Input Interaktif */}
                            <div className="w-full sm:w-7/12 space-y-1.5">
                              <span className="text-xs font-bold text-slate-800 uppercase block tracking-wide">{s.name}</span>
                              <div className="flex items-center gap-2">
                                <select 
                                  value={logTypes[s.id] || 'apresiasi'} 
                                  onChange={(e) => handleLogTypeChange(s.id, e.target.value)}
                                  className="border border-slate-300 px-2 py-1 rounded bg-white text-[10px] font-bold text-slate-600 focus:ring-1 focus:ring-sky-500"
                                >
                                  <option value="apresiasi">👍 Apresiasi</option>
                                  <option value="pelanggaran">⚠️ Pelanggaran</option>
                                </select>
                                <input 
                                  type="text" 
                                  value={logNotes[s.id] || ''} 
                                  onChange={(e) => handleNoteChange(s.id, e.target.value)}
                                  placeholder="Isi jika siswa presentasi/melanggar..." 
                                  className="border border-slate-300 px-2.5 py-1 text-[10px] rounded-lg w-full focus:ring-1 focus:ring-sky-500 text-slate-700" 
                                />
                              </div>
                            </div>

                            {/* Kanan: Pilihan Radio Bulat */}
                            <div className="flex items-center justify-center gap-1.5 w-full sm:w-5/12">
                              {[
                                { status: 'H', style: 'text-green-600 border-green-500 bg-green-50' },
                                { status: 'S', style: 'text-amber-600 border-amber-500 bg-amber-50' },
                                { status: 'I', style: 'text-blue-600 border-blue-500 bg-blue-50' },
                                { status: 'A', style: 'text-red-600 border-red-500 bg-red-50' }
                              ].map(opt => (
                                <label 
                                  key={opt.status}
                                  className={`flex flex-col items-center justify-center border rounded-lg w-10 h-8 cursor-pointer text-[11px] font-bold transition select-none ${
                                    (absensi[s.id] || 'H') === opt.status 
                                      ? `${opt.style} border-2 scale-105 shadow-sm` 
                                      : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  <input 
                                    type="radio" 
                                    name={`absen-${s.id}`} 
                                    value={opt.status} 
                                    checked={(absensi[s.id] || 'H') === opt.status} 
                                    onChange={() => handleStatusChange(s.id, opt.status)} 
                                    className="hidden" 
                                  />
                                  <span>{opt.status}</span>
                                </label>
                              ))}
                            </div>

                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-200 transition cursor-pointer">Batal</button>
                <button type="submit" disabled={isSubmitting || (kelasJurnal && siswaFilterJurnal.length === 0)} className="flex items-center gap-2 px-6 py-2 bg-sky-600 text-white font-bold text-xs rounded-xl hover:bg-sky-700 transition shadow-sm disabled:opacity-50 cursor-pointer">
                  <Save className="w-3.5 h-3.5" /> {isSubmitting ? 'Menyimpan...' : 'Simpan Jurnal & Absensi'}
                </button>
              </div>
            </form>
          )}

          {/* Data List Riwayat Jurnal */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {myJurnal.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400"><BookOpen className="w-5 h-5" /></div>
                <h4 className="text-xs font-bold text-slate-700">Belum Ada Riwayat Jurnal</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Seluruh jurnal dan absensi tatap muka terisi akan tersusun rapi di sini.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-4">Tanggal</th>
                      <th className="p-4">Mata Pelajaran</th>
                      <th className="p-4">Kelas</th>
                      <th className="p-4">Jam Ke</th>
                      <th className="p-4">Materi Pokok</th>
                      <th className="p-4">Catatan Hambatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                    {myJurnal.map((j, i) => (
                      <tr key={j.id || i} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-medium text-slate-900 whitespace-nowrap">{j.tanggal}</td>
                        <td className="p-4"><span className="px-2 py-1 bg-sky-50 text-sky-700 font-semibold rounded-md text-[11px]">{j.guruName}</span></td>
                        <td className="p-4 font-bold text-slate-700">{j.kelas}</td>
                        <td className="p-4 whitespace-nowrap">Jam ke-{j.jamKe}</td>
                        <td className="p-4 max-w-xs truncate font-medium text-slate-800" title={j.materi}>{j.materi}</td>
                        <td className="p-4 max-w-sm truncate text-slate-500" title={j.aktivitas}>{j.aktivitas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB INPUT NILAI SISWA ==================== */}
      {activeSubTab === 'nilai' && (
        <div className="space-y-6">
          <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Pilih Kelas</label>
              <select value={kelasNilai} onChange={(e) => setKelasNilai(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-bold text-slate-700">
                {LIST_KELAS_LENGKAP.map(kls => (
                  <option key={kls} value={kls}>Kelas {kls}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Mata Pelajaran</label>
              {myMapels.length <= 1 ? (
                <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 h-[34px] flex items-center">
                  ✨ {mapelNilai} (Terdeteksi Otomatis)
                </div>
              ) : (
                <select value={mapelNilai} onChange={(e) => setMapelNilai(e.target.value)} className="w-full bg-amber-50/50 border border-amber-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-bold text-amber-900">
                  {myMapels.map((m, idx) => (
                    <option key={idx} value={m}>{m}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-sky-600" /> Lembar Nilai Siswa: Kelas {kelasNilai} — {mapelNilai}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Silakan ketik skor nilai siswa secara langsung pada kolom tabel di bawah.</p>
              </div>
              {filteredSiswa.length > 0 && (
                <button onClick={handleSaveNilai} disabled={isSubmitting} className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition shadow-sm cursor-pointer disabled:opacity-50">
                  <Save className="w-3.5 h-3.5" /> {isSubmitting ? 'Menyimpan...' : 'Simpan Semua Nilai'}
                </button>
              )}
            </div>

            {filteredSiswa.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400"><GraduationCap className="w-5 h-5" /></div>
                <h4 className="text-xs font-bold text-slate-700">Tidak Ada Siswa Terdaftar</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Tidak ditemukan records siswa aktif untuk kelas {kelasNilai}.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
                      <th className="p-4 text-left w-12">No</th>
                      <th className="p-4 text-left min-w-[200px]">Nama Lengkap Siswa</th>
                      <th className="p-4 w-24">Nilai Harian</th>
                      <th className="p-4 w-24">Tugas</th>
                      <th className="p-4 w-24">UTS</th>
                      <th className="p-4 w-24">UAS</th>
                      <th className="p-4 w-24">PSAT</th>
                      <th className="p-4 w-24">PSAJ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                    {filteredSiswa.map((s, index) => {
                      const currentNilai = nilaiSiswa[s.id] || { harian: '', tugas: '', uts: '', uas: '', psat: '', psaj: '' };
                      return (
                        <tr key={s.id || index} className="hover:bg-slate-50/50 transition">
                          <td className="p-4 text-center font-bold text-slate-400">{index + 1}</td>
                          <td className="p-4 font-bold text-slate-800">
                            {s.name}
                            <span className="block text-[10px] text-slate-400 font-medium mt-0.5">NISN: {s.nisn || '-'}</span>
                          </td>
                          
                          <td className="p-2">
                            <input type="text" value={currentNilai.harian} onChange={(e) => handleNilaiChange(s.id, 'harian', e.target.value)} className="w-full text-center bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 p-2 font-bold rounded-lg text-slate-700 transition" placeholder="0" />
                          </td>
                          <td className="p-2">
                            <input type="text" value={currentNilai.tugas} onChange={(e) => handleNilaiChange(s.id, 'tugas', e.target.value)} className="w-full text-center bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 p-2 font-bold rounded-lg text-slate-700 transition" placeholder="0" />
                          </td>
                          <td className="p-2">
                            <input type="text" value={currentNilai.uts} onChange={(e) => handleNilaiChange(s.id, 'uts', e.target.value)} className="w-full text-center bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 p-2 font-bold rounded-lg text-slate-700 transition" placeholder="0" />
                          </td>
                          <td className="p-2">
                            <input type="text" value={currentNilai.uas} onChange={(e) => handleNilaiChange(s.id, 'uas', e.target.value)} className="w-full text-center bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 p-2 font-bold rounded-lg text-slate-700 transition" placeholder="0" />
                          </td>
                          <td className="p-2">
                            <input type="text" value={currentNilai.psat} onChange={(e) => handleNilaiChange(s.id, 'psat', e.target.value)} className="w-full text-center bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 p-2 font-bold rounded-lg text-slate-700 transition" placeholder="0" />
                          </td>
                          <td className="p-2">
                            <input type="text" value={currentNilai.psaj} onChange={(e) => handleNilaiChange(s.id, 'psaj', e.target.value)} className="w-full text-center bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 p-2 font-bold rounded-lg text-slate-700 transition" placeholder="0" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            {filteredSiswa.length > 0 && (
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button onClick={handleSaveNilai} disabled={isSubmitting} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition shadow-sm cursor-pointer disabled:opacity-50">
                  <Save className="w-4 h-4" /> {isSubmitting ? 'Sedang Menyimpan...' : 'Simpan Semua Nilai Kelas'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GuruMapelPanel;
