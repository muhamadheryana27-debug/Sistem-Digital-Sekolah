import React, { useState, useMemo, FormEvent, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { JurnalMengajar } from '../types';
import { ArrowLeft, BookOpen, Calendar, GraduationCap, PlusCircle, Save, Check, AlertTriangle, ClipboardList } from 'lucide-react';

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
  // Menarik data dan fungsi yang dibutuhkan secara terpusat dari AppContext
  const { currentUser, jurnalMengajar: contextJurnal = [], addJurnalMengajar, siswa = [], updateNilaiSiswa } = useApp();
  
  // Tab Navigasi Aktif
  const [activeSubTab, setActiveSubTab] = useState<'jurnal' | 'nilai'>('jurnal');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // --- STATE FORM JURNAL MENGAJAR ---
  const [mataPelajaran, setMataPelajaran] = useState('IPA');
  const [kelasJurnal, setKelasJurnal] = useState('VII-A');
  const [jamKe, setJamKe] = useState('1-2');
  const [materi, setMateri] = useState('');
  const [aktivitas, setAktivitas] = useState('');

  // --- STATE FILTER & NILAI SISWA ---
  const [kelasNilai, setKelasNilai] = useState('VII-A');
  const [mapelNilai, setMapelNilai] = useState('IPA');
  const [nilaiSiswa, setNilaiSiswa] = useState<NilaiSiswaState>({});

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Filter riwayat jurnal berdasarkan akun guru aktif
  const myJurnal = useMemo(() => {
    if (!currentUser) return [];
    return contextJurnal.filter(j => {
      if (!j) return false;
      return String(j.guruId).trim() === String(currentUser.id).trim();
    });
  }, [contextJurnal, currentUser]);

  // 2. DETEKSI OTOMATIS MATA PELAJARAN USER BERDASARKAN JURNAL YANG PERNAH DIINPUT
  const myMapels = useMemo(() => {
    if (myJurnal.length === 0) return [];
    // Mengambil daftar mata pelajaran unik yang pernah diajar oleh guru ini
    const mapels = myJurnal.map(j => j.guruName).filter(Boolean);
    return Array.from(new Set(mapels));
  }, [myJurnal]);

  // Efek otomatis untuk menentukan mapelNilai saat halaman dimuat atau list mapel berubah
  useEffect(() => {
    if (myMapels.length > 0) {
      // Set otomatis ke mata pelajaran pertama yang terdeteksi
      setMapelNilai(myMapels[0]);
    }
  }, [myMapels]);

  // 3. Filter daftar siswa berdasarkan kelas terpilih untuk lembar nilai
  const filteredSiswa = useMemo(() => {
    return siswa.filter(s => s && s.kelas === kelasNilai);
  }, [siswa, kelasNilai]);

  // 4. Mengatur perubahan teks input nilai secara dinamis per baris siswa
  const handleNilaiChange = (siswaId: string, kolom: string, value: string) => {
    setNilaiSiswa(prev => ({
      ...prev,
      [siswaId]: {
        ...(prev[siswaId] || { harian: '', tugas: '', uts: '', uas: '', psat: '', psaj: '' }),
        [kolom]: value
      }
    }));
  };

  // 5. Submit Jurnal Mengajar baru ke database
  const handleJurnalSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const newJurnal = {
        guruId: currentUser.id,
        guruName: mataPelajaran, // Menyimpan nama mata pelajaran pada kolom terkait
        tanggal: today,
        kelas: kelasJurnal,
        jamKe,
        materi,
        aktivitas,
      };

      await addJurnalMengajar(newJurnal);
      setSuccessMsg('Jurnal mengajar berhasil disimpan ke sistem!');
      setMateri('');
      setAktivitas('');
      setIsFormOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat menyimpan jurnal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Menyimpan kumpulan data nilai siswa ke database Supabase secara massal
  const handleSaveNilai = async () => {
    setSuccessMsg('');
    setErrorMsg('');
    setIsSubmitting(true);
    
    try {
      let targetSiswaList = filteredSiswa;
      let successCount = 0;

      for (const s of targetSiswaList) {
        const currentNilai = nilaiSiswa[s.id];
        if (currentNilai) {
          const success = await updateNilaiSiswa(s.id, mapelNilai, currentNilai);
          if (success) successCount++;
        }
      }

      if (successCount > 0) {
        setSuccessMsg(`Berhasil menyimpan data nilai ${successCount} siswa kelas ${kelasNilai} untuk mata pelajaran ${mapelNilai}!`);
      } else {
        setSuccessMsg(`Proses selesai. Tidak ada data nilai baru yang diubah.`);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg('Gagal mengamankan data nilai ke database. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen p-1">
      {/* Top Navigation / Headings */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition cursor-pointer shadow-sm text-slate-600">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Guru Mata Pelajaran</h1>
            <p className="text-xs text-slate-500">Kelola operasional mengajar harian & input capaian nilai siswa.</p>
          </div>
        </div>

        {/* Tab Penyetelan Sub-Menu */}
        <div className="flex bg-slate-200/70 p-1 rounded-xl border border-slate-300/40">
          <button 
            onClick={() => { setActiveSubTab('jurnal'); setSuccessMsg(''); setErrorMsg(''); }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${activeSubTab === 'jurnal' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Jurnal Mengajar
          </button>
          <button 
            onClick={() => { setActiveSubTab('nilai'); setSuccessMsg(''); setErrorMsg(''); }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${activeSubTab === 'nilai' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <ClipboardList className="w-3.5 h-3.5" /> Input Nilai Siswa
          </button>
        </div>
      </div>

      {/* Banner Notifikasi Status */}
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
              <span>Riwayat Agenda Mengajar Anda</span>
            </div>
            {!isFormOpen && (
              <button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white font-bold text-xs rounded-xl hover:bg-sky-700 transition shadow-sm cursor-pointer">
                <PlusCircle className="w-4 h-4" /> Buat Jurnal Baru
              </button>
            )}
          </div>

          {isFormOpen && (
            <form onSubmit={handleJurnalSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-sky-600" /> Isi Form Jurnal Mengajar Harian
                </h3>
                <button type="button" onClick={() => setIsFormOpen(false)} className="text-xs text-slate-400 hover:text-slate-600 font-medium">Batal</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Mata Pelajaran</label>
                  <select value={mataPelajaran} onChange={(e) => setMataPelajaran(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium text-slate-700">
                    <option value="IPA">Ilmu Pengetahuan Alam (IPA)</option>
                    <option value="IPS">Ilmu Pengetahuan Sosial (IPS)</option>
                    <option value="Matematika">Matematika</option>
                    <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                    <option value="Bahasa Inggris">Bahasa Inggris</option>
                    <option value="PAI">Pendidikan Agama Islam</option>
                    <option value="PPKn">PPKn</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Kelas Mengajar</label>
                  <select value={kelasJurnal} onChange={(e) => setKelasJurnal(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium text-slate-700">
                    <option value="VII-A">Kelas VII-A</option>
                    <option value="VII-B">Kelas VII-B</option>
                    <option value="VIII-A">Kelas VIII-A</option>
                    <option value="VIII-B">Kelas VIII-B</option>
                    <option value="IX-A">Kelas IX-A</option>
                    <option value="IX-B">Kelas IX-B</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Jam Pelajaran Ke-</label>
                  <input type="text" value={jamKe} onChange={(e) => setJamKe(e.target.value)} placeholder="Contoh: 1-2 atau 3-4" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium text-slate-700" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Materi Pokok Pembahasan</label>
                <input type="text" value={materi} onChange={(e) => setMateri(e.target.value)} placeholder="Tuliskan materi/bab yang dipelajari hari ini..." required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium text-slate-700" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Catatan Aktivitas & Hambatan Kelas</label>
                <textarea value={aktivitas} onChange={(e) => setAktivitas(e.target.value)} rows={3} placeholder="Ceritakan jalannya KBM, penugasan, atau hambatan jika ada..." required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium text-slate-700" />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-200 transition cursor-pointer">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-5 py-2 bg-sky-600 text-white font-bold text-xs rounded-xl hover:bg-sky-700 transition shadow-sm disabled:opacity-50 cursor-pointer">
                  <Save className="w-3.5 h-3.5" /> {isSubmitting ? 'Menyimpan...' : 'Simpan Jurnal'}
                </button>
              </div>
            </form>
          )}

          {/* Data List Jurnal View */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {myJurnal.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400"><BookOpen className="w-5 h-5" /></div>
                <h4 className="text-xs font-bold text-slate-700">Belum Ada Riwayat Jurnal</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Jurnal harian yang Anda simpan akan tampil di dalam daftar ini.</p>
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
                      <th className="p-4">Catatan Aktivitas</th>
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
          {/* Menu Filter Pemilihan Kelas & Mapel (Otomatis) */}
          <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Pilih Kelas</label>
              <select value={kelasNilai} onChange={(e) => setKelasNilai(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium text-slate-700">
                <option value="VII-A">Kelas VII-A</option>
                <option value="VII-B">Kelas VII-B</option>
                <option value="VIII-A">Kelas VIII-A</option>
                <option value="VIII-B">Kelas VIII-B</option>
                <option value="IX-A">Kelas IX-A</option>
                <option value="IX-B">Kelas IX-B</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Mata Pelajaran</label>
              {myMapels.length <= 1 ? (
                // JIKA HANYA ADA 1 MAPEL TERDETEKSI ATAU BELUM ADA JURNAL, TAMPILKAN TEXT DENGAN AUTOMATIC DETECTION
                <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 h-[34px] flex items-center">
                  ✨ {mapelNilai} (Terdeteksi Otomatis)
                </div>
              ) : (
                // JIKA TERDAPAT 2 ATAU LEBIH MATA PELAJARAN, MUNCULKAN DROPDOWN AGAR USER BISA MEMILIH MANUAL
                <select value={mapelNilai} onChange={(e) => setMapelNilai(e.target.value)} className="w-full bg-amber-50/50 border border-amber-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-bold text-amber-900">
                  {myMapels.map((m, idx) => (
                    <option key={idx} value={m}>Mata Pelajaran: {m}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Lembar Table Kerja Input Skor Nilai */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-sky-600" /> Lembar Nilai Siswa: {kelasNilai} — {mapelNilai}
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
                          
                          {/* Input Nilai Harian */}
                          <td className="p-2">
                            <input type="text" value={currentNilai.harian} onChange={(e) => handleNilaiChange(s.id, 'harian', e.target.value)} className="w-full text-center bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 p-2 font-bold rounded-lg text-slate-700 transition" placeholder="0" />
                          </td>

                          {/* Input Nilai Tugas */}
                          <td className="p-2">
                            <input type="text" value={currentNilai.tugas} onChange={(e) => handleNilaiChange(s.id, 'tugas', e.target.value)} className="w-full text-center bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 p-2 font-bold rounded-lg text-slate-700 transition" placeholder="0" />
                          </td>

                          {/* Input Nilai UTS */}
                          <td className="p-2">
                            <input type="text" value={currentNilai.uts} onChange={(e) => handleNilaiChange(s.id, 'uts', e.target.value)} className="w-full text-center bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 p-2 font-bold rounded-lg text-slate-700 transition" placeholder="0" />
                          </td>

                          {/* Input Nilai UAS */}
                          <td className="p-2">
                            <input type="text" value={currentNilai.uas} onChange={(e) => handleNilaiChange(s.id, 'uas', e.target.value)} className="w-full text-center bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 p-2 font-bold rounded-lg text-slate-700 transition" placeholder="0" />
                          </td>

                          {/* Input Nilai PSAT */}
                          <td className="p-2">
                            <input type="text" value={currentNilai.psat} onChange={(e) => handleNilaiChange(s.id, 'psat', e.target.value)} className="w-full text-center bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 p-2 font-bold rounded-lg text-slate-700 transition" placeholder="0" />
                          </td>

                          {/* Input Nilai PSAJ */}
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