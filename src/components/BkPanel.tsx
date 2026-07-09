import React, { useState, useMemo, FormEvent, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import { KasusBK } from '../types';
import { ArrowLeft, HeartHandshake, ClipboardList, Save, Calendar, Search, ChevronDown, X, CheckCircle2, MessageSquarePlus, Clock } from 'lucide-react';

interface BkPanelProps {
  onBack: () => void;
  kasusList?: KasusBK[];
}

const BkPanel: React.FC<BkPanelProps> = ({ onBack, kasusList = [] }) => {
  const { siswa, masterPelanggarans } = useApp();
  const [activeTab, setActiveTab] = useState<'input' | 'riwayat'>('input');

  // State Utama Form Input (Tab 1)
  const [selectedKelas, setSelectedKelas] = useState('VII-A');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [kategoriKasus, setKategoriKasus] = useState('Ringan');
  
  // State Autocomplete Box Jenis Kasus
  const [searchJenisKasus, setSearchJenisKasus] = useState('');
  const [selectedJenisKasus, setSelectedJenisKasus] = useState<{ jenis_cases?: string; jenis_kasus: string; bobot: number } | null>(null);
  const [showJenisDropdown, setShowJenisDropdown] = useState(false);

  const [detailKasus, setDetailKasus] = useState('');
  const [tindakanPenanganan, setTindakanPenanganan] = useState('');
  
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // STATE BARU: Khusus Penanganan Lanjutan di Tab Riwayat
  const [selectedKasusId, setSelectedKasusId] = useState<string | number | null>(null);
  const [catatanLanjutan, setCatatanLanjutan] = useState('');
  const [statusFinal, setStatusFinal] = useState('Tuntas');
  const [successUpdateMsg, setSuccessUpdateMsg] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter Siswa Berdasarkan Rombel Kelas Pilihan
  const filteredStudents = useMemo(() => {
    return siswa.filter(s => s.kelas === selectedKelas);
  }, [siswa, selectedKelas]);

  useEffect(() => {
    setSelectedStudentId('');
  }, [selectedKelas]);

  // Filter List Pelanggaran Master (Case-Insensitive)
  const filteredMasterPelanggaran = useMemo(() => {
    return masterPelanggarans.filter(p => {
      const matchKategori = p.kategori.toLowerCase().trim() === kategoriKasus.toLowerCase().trim();
      const namaKasus = p.jenis_cases || p.jenis_kasus || '';
      const matchSearch = namaKasus.toLowerCase().includes(searchJenisKasus.toLowerCase());
      return matchKategori && matchSearch;
    });
  }, [masterPelanggarans, kategoriKasus, searchJenisKasus]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowJenisDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectJenisKasus = (item: any) => {
    setSelectedJenisKasus(item);
    setSearchJenisKasus(''); 
    setShowJenisDropdown(false);
  };

  const handleClearJenisKasus = () => {
    setSelectedJenisKasus(null);
    setSearchJenisKasus('');
  };

  // SIMPAN KASUS BARU (Default status awal: 'Diproses')
  const handleSubmitKasus = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      alert('Silakan pilih nama siswa terlebih dahulu!');
      return;
    }
    if (!selectedJenisKasus) {
      alert('Silakan pilih jenis spesifikasi pelanggaran!');
      return;
    }

    setIsSubmitting(true);
    try {
      const namaKasusFinal = selectedJenisKasus.jenis_cases || selectedJenisKasus.jenis_kasus;
      const finalDeskripsi = `[${namaKasusFinal}] Poin Pelanggaran: ${selectedJenisKasus.bobot}. Catatan: ${detailKasus}`;

      const { error } = await supabase.from('bk_records').insert([{
        student_id: Number(selectedStudentId),
        kelas: selectedKelas,
        kategori_cases: kategoriKasus,
        kategori_kasus: kategoriKasus, 
        detail_kasus: finalDeskripsi,
        tindakan_penanganan: tindakanPenanganan,
        status: 'Diproses' // Set awal ke Diproses agar bisa ditindaklanjuti di tab riwayat
      }]);

      if (error) throw new Error(error.message);

      setSuccessMsg('Sukses menyimpan laporan awal kasus bimbingan konseling!');
      handleClearJenisKasus();
      setSelectedStudentId('');
      setDetailKasus('');
      setTindakanPenanganan('');
      
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      alert(`Gagal menyimpan: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // SIMPAN UPDATE PENANGANAN LANJUTAN KASUS (Tab Riwayat)
  const handleUpdateLanjutan = async (e: FormEvent, kasusId: string | number, deskripsiLama: string) => {
    e.preventDefault();
    if (!catatanLanjutan.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('bk_records')
        .update({
          tindakan_penanganan: catatanLanjutan, // Memperbarui solusi tindakan konseling lanjutan
          status: statusFinal // 'Tuntas' atau tetap 'Diproses'
        })
        .eq('id', kasusId);

      if (error) throw new Error(error.message);

      setSuccessUpdateMsg('Sukses memperbarui perkembangan kasus menjadi ' + statusFinal + '!');
      setCatatanLanjutan('');
      setSelectedKasusId(null);

      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      alert(`Gagal memperbarui perkembangan kasus: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStudentName = (studentIdStr: string) => {
    const found = siswa.find(s => s.id === studentIdStr);
    return found ? found.name : `Siswa ID: ${studentIdStr}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg p-2 transition flex items-center gap-1 cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> <span className="text-xs font-semibold">Kembali</span>
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Pencatatan Kasus & Bimbingan BK</h2>
          <p className="text-xs text-slate-500 font-medium">Form pelaporan konseling dan pemantauan tertib kedisiplinan siswa.</p>
        </div>
      </div>

      {/* Navigasi Sub Tab */}
      <div className="border-b border-slate-200 flex gap-2">
        <button onClick={() => setActiveTab('input')} className={`px-4 py-2 text-xs font-bold transition cursor-pointer border-b-2 ${activeTab === 'input' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500'}`}>
          <HeartHandshake className="w-4 h-4 inline mr-1" /> Input Catatan BK Baru
        </button>
        <button onClick={() => setActiveTab('riwayat')} className={`px-4 py-2 text-xs font-bold transition cursor-pointer border-b-2 ${activeTab === 'riwayat' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500'}`}>
          <ClipboardList className="w-4 h-4 inline mr-1" /> Riwayat & Tindak Lanjut ({kasusList.length})
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm min-h-[40vh]">
        
        {/* ==================== TAB 1: FORM INPUT KASUS BARU ==================== */}
        {activeTab === 'input' && (
          <form onSubmit={handleSubmitKasus} className="max-w-3xl space-y-5">
            {/* ... Bagian Form Input Tetap Sama Seperti Sebelumnya (Disembunyikan demi efisiensi) ... */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">Pilih Kelas Terlebih Dahulu</label>
              <div className="relative">
                <select value={selectedKelas} onChange={(e) => setSelectedKelas(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 appearance-none focus:outline-none focus:border-sky-500 cursor-pointer">
                  {['VII-A', 'VIII-A', 'IX-A', 'VII-B', 'VIII-B', 'IX-B'].map(k => <option key={k} value={k}>Kelas {k.replace('-', ' ')}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-4 top-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">Pilih Siswa Bersangkutan</label>
              <div className="relative">
                <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 appearance-none focus:outline-none focus:border-sky-500 cursor-pointer">
                  <option value="">-- Silakan Pilih Nama Siswa Aktif --</option>
                  {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-4 top-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">Filter Kategori Kasus</label>
              <select value={kategoriKasus} onChange={(e) => { setKategoriKasus(e.target.value); handleClearJenisKasus(); }} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-500 cursor-pointer">
                <option value="Ringan">Ringan</option><option value="Sedang">Sedang</option><option value="Berat">Berat</option><option value="Sangat Berat">Sangat Berat</option>
              </select>
            </div>

            <div className="relative" ref={dropdownRef}>
              <label className="block text-xs font-bold text-slate-600 mb-2">Jenis Kasus / Pelanggaran Aturan</label>
              {!selectedJenisKasus ? (
                <div className="relative">
                  <input type="text" value={searchJenisKasus} onFocus={() => setShowJenisDropdown(true)} onChange={(e) => setSearchJenisKasus(e.target.value)} placeholder="Ketik kata kunci untuk mencari daftar pelanggaran master..." className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-sky-500" />
                  <Search className="w-4 h-4 absolute right-4 top-4 text-slate-400 pointer-events-none" />
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-4 w-full min-w-0">
                  <div className="flex-1 min-w-0 text-sm text-slate-800 font-semibold leading-relaxed break-words whitespace-normal">
                    <span className="bg-rose-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded mr-2 inline-block data-caps">[{selectedJenisKasus.bobot} Poin]</span>
                    {selectedJenisKasus.jenis_cases || selectedJenisKasus.jenis_kasus}
                  </div>
                  <button type="button" onClick={handleClearJenisKasus} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-4 h-4" /></button>
                </div>
              )}

              {showJenisDropdown && !selectedJenisKasus && filteredMasterPelanggaran.length > 0 && (
                <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-xl mt-1 max-h-[220px] overflow-y-auto divide-y divide-slate-100">
                  {filteredMasterPelanggaran.map(item => (
                    <button key={item.id} type="button" onClick={() => handleSelectJenisKasus(item)} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-start gap-3 text-xs cursor-pointer">
                      <span className="bg-rose-50 text-rose-700 font-extrabold text-[10px] px-2 py-0.5 rounded border border-rose-100 shrink-0">[{item.bobot} Poin]</span>
                      <div className="flex-1 min-w-0 break-words text-slate-700 font-semibold leading-relaxed">{item.jenis_cases || item.jenis_kasus}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">Catatan Detail Kronologi Kasus Lapangan</label>
              <textarea rows={2} value={detailKasus} onChange={(e) => setDetailKasus(e.target.value)} placeholder="Tulis rincian lokasi kejadian atau keterangan saksi..." className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-500"></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">Tindakan Penanganan Awal Konseling</label>
              <textarea rows={2} required value={tindakanPenanganan} onChange={(e) => setTindakanPenanganan(e.target.value)} placeholder="Tulis bentuk pembinaan psikologis awal..." className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-500"></textarea>
            </div>

            {successMsg && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 p-3 rounded-xl font-semibold">{successMsg}</p>}
            
            <button type="submit" disabled={isSubmitting || !selectedStudentId || !selectedJenisKasus} className="w-full bg-slate-950 text-white font-bold text-sm py-3.5 rounded-xl shadow-md disabled:opacity-40 cursor-pointer">
              Simpan Laporan Awal BK
            </button>
          </form>
        )}

        {/* ==================== TAB 2: RIWAYAT & PENANGANAN LANJUTAN INTERAKTIF ==================== */}
        {activeTab === 'riwayat' && (
          <div className="space-y-4">
            {successUpdateMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {successUpdateMsg}
              </div>
            )}

            {kasusList.length === 0 ? (
              <div className="text-center p-8 bg-slate-50 text-slate-400 text-xs rounded-2xl">Belum ada histori log kasus terdaftar di sistem.</div>
            ) : (
              <div className="space-y-4">
                {kasusList.map((item) => {
                  // Cek apakah kasus ini statusnya bertipe tuntas atau masih diproses (bisa di-handle fallback dari database)
                  const isKasusTuntas = item.solusi && (item.solusi.toLowerCase().includes('tuntas') || !selectedKasusId);
                  
                  return (
                    <div 
                      key={item.id} 
                      className={`p-5 border rounded-2xl flex flex-col gap-3 shadow-sm w-full min-w-0 transition-all ${
                        selectedKasusId === item.id ? 'border-sky-50 ring-4 ring-sky-50 bg-sky-50/10' : 'border-slate-200 bg-slate-50/30'
                      }`}
                    >
                      {/* Atribut Header Kasus */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-900 text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {item.tanggal}
                          </span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase border ${
                            item.tipeKasus.toLowerCase().includes('berat') ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {item.tipeKasus}
                          </span>
                        </div>

                        {/* Badge Status Alur Kasus */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                          item.solusi.toLowerCase().includes('tuntas') || isKasusTuntas
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.solusi.toLowerCase().includes('tuntas') || isKasusTuntas ? (
                            <><CheckCircle2 className="w-3 h-3" /> Kasus Tuntas</>
                          ) : (
                            <><Clock className="w-3 h-3" /> Butuh Bimbingan Lanjutan</>
                          )}
                        </span>
                      </div>

                      {/* Info Profil Siswa Target */}
                      <h5 className="text-sm font-bold text-slate-900 flex justify-between items-center">
                        <div>
                          {getStudentName(item.namaSiswa)} <span className="text-xs text-slate-400 font-normal">(Kelas {item.kelas})</span>
                        </div>
                        
                        {/* Tombol Tindak Lanjut Kasus (Hanya muncul jika belum dipilih & kasus belum tuntas) */}
                        {selectedKasusId !== item.id && !item.solusi.toLowerCase().includes('tuntas') && (
                          <button 
                            type="button"
                            onClick={() => { setSelectedKasusId(item.id); setCatatanLanjutan(item.solusi); }}
                            className="text-xs bg-white border border-slate-200 hover:border-sky-500 hover:text-sky-600 px-3 py-1.5 rounded-lg font-bold shadow-sm flex items-center gap-1 cursor-pointer transition"
                          >
                            <MessageSquarePlus className="w-3.5 h-3.5 text-sky-500" /> Tindak Lanjut Kasus
                          </button>
                        )}
                      </h5>

                      {/* Box Uraian Kronologi Kasus */}
                      <div className="w-full min-w-0 bg-white p-4 border border-slate-100 rounded-xl">
                        <strong className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">Uraian & Kronologi Kasus:</strong>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed break-words whitespace-normal">{item.deskripsi}</p>
                      </div>

                      {/* Kondisional View: Jika sedang dipilih, tampilkan form editor penanganan lanjutan */}
                      {selectedKasusId === item.id ? (
                        <form onSubmit={(e) => handleUpdateLanjutan(e, item.id, item.solusi)} className="space-y-3 p-4 bg-white border border-sky-100 rounded-xl mt-1 animate-fadeIn">
                          <h6 className="text-xs font-bold text-sky-800 flex items-center gap-1"><MessageSquarePlus className="w-4 h-4" /> Form Konseling & Penyelesaian Kasus</h6>
                          
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Catatan Perkembangan Penanganan Lanjutan / Hasil Sidang BK</label>
                            <textarea 
                              rows={3} 
                              required
                              value={catatanLanjutan} 
                              onChange={(e) => setCatatanLanjutan(e.target.value)} 
                              placeholder="Tuliskan hasil konseling lanjutan, pemanggilan orang tua, atau keputusan sanksi akhir..." 
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-sky-500 font-medium"
                            ></textarea>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Ubah Status Akhir</label>
                              <select 
                                value={statusFinal} 
                                onChange={(e) => setStatusFinal(e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-700 focus:outline-none"
                              >
                                <option value="Tuntas">Tuntas (Selesai & Masuk Rekap BL)</option>
                                <option value="Diproses">Tetap Diproses (Butuh Konseling Tahap Berikutnya)</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button type="button" onClick={() => setSelectedKasusId(null)} className="px-3 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer">Batal</button>
                              <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-sky-600 text-white rounded-lg text-xs font-bold hover:bg-sky-700 shadow cursor-pointer flex items-center gap-1">
                                <Save className="w-3.5 h-3.5" /> {isSubmitting ? 'Memproses...' : 'Simpan Pembaruan'}
                              </button>
                            </div>
                          </div>
                        </form>
                      ) : (
                        /* Tampilan teks normal jika tidak sedang diedit */
                        <div className="w-full min-w-0 bg-emerald-50/30 p-4 border border-emerald-100/50 rounded-xl">
                          <strong className="text-[10px] uppercase tracking-wider text-emerald-600 block mb-1">Catatan Tindakan / Solusi BK:</strong>
                          <p className="text-xs text-slate-700 font-medium leading-relaxed break-words whitespace-normal">{item.solusi}</p>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BkPanel;