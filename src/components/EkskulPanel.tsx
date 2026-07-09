import React, { useState, useMemo, FormEvent } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import { NilaiEkskul } from '../types';
import { ArrowLeft, Award, BookOpen, Users, Check, Save } from 'lucide-react';

interface EkskulPanelProps {
  onBack: () => void;
  ekskulData?: NilaiEkskul[];
}

const EkskulPanel: React.FC<EkskulPanelProps> = ({ onBack, ekskulData = [] }) => {
  const { currentUser, gurus, siswa } = useApp();
  const [activeTab, setActiveTab] = useState<'jurnal' | 'anggota' | 'nilai'>('jurnal');

  // Ambil profil ekskul pembina yang aktif dari database profiles
  const currentGuruProfile = gurus.find(g => g.id === currentUser?.id || g.name === currentUser?.name);
  const namaEkskulBinaan = currentGuruProfile?.namaEkskul || "Ekstrakurikuler";

  // 1. Logika Ambil Anggota Ekskul Secara Dinamis dari Data Siswa
  const anggotaEkskul = useMemo(() => {
    // Mencocokkan data kolom 'ekskul' siswa dengan nama ekskul binaan guru
    return siswa.filter(s => s.ekskul?.toLowerCase() === namaEkskulBinaan.toLowerCase());
  }, [siswa, namaEkskulBinaan]);

  // ==========================================
  // TAB 1: FORM JURNAL KEGIATAN EKSTRAKURIKULER
  // ==========================================
  const [tanggalKegiatan, setTanggalKegiatan] = useState(new Date().toISOString().split('T')[0]);
  const [materiKegiatan, setMateriKegiatan] = useState('');
  const [jumlahHadir, setJumlahHadir] = useState(anggotaEkskul.length.toString());
  const [catatanKegiatan, setCatatanKegiatan] = useState('');
  const [jurnalSuccess, setJurnalSuccess] = useState('');
  const [isSubmittingJurnal, setIsSubmittingJurnal] = useState(false);

  const handleSubmitJurnal = async (e: FormEvent) => {
    e.preventDefault();
    if (!materiKegiatan.trim()) {
      alert('Materi atau nama kegiatan ekstrakurikuler wajib diisi!');
      return;
    }

    setIsSubmittingJurnal(true);
    try {
      // Simpan log jurnal ekskul ke tabel 'teaching_journals' (menggunakan materi khusus ekskul)
      const { error } = await supabase
        .from('teaching_journals')
        .insert([{
          tanggal: tanggalKegiatan,
          jam_ke: 'Ekskul',
          kelas: namaEkskulBinaan,
          materi: `Kegiatan Ekskul: ${materiKegiatan}`,
          aktivitas: catatanKegiatan,
          user_id: Number(currentUser?.id) || null
        }]);

      if (error) throw new Error(error.message);

      setJurnalSuccess(`Sukses menyimpan jurnal kegiatan mingguan ${namaEkskulBinaan}!`);
      setMateriKegiatan('');
      setCatatanKegiatan('');
      setTimeout(() => setJurnalSuccess(''), 4000);
    } catch (err: any) {
      alert(`Gagal menyimpan ke Supabase: ${err.message}`);
    } finally {
      setIsSubmittingJurnal(false);
    }
  };

  // ==========================================
  // TAB 3: LOGIKA FORM INPUT NILAI EKSTRAKURIKULER
  // ==========================================
  const [inputNilaiMap, setInputNilaiMap] = useState<Record<string, { predikat: 'A' | 'B' | 'C' | 'D', catatan: string }>>({});
  const [nilaiSuccess, setNilaiSuccess] = useState('');
  const [isSubmittingNilai, setIsSubmittingNilai] = useState(false);

  // Set nilai bawaan (default) untuk semua anggota aktif
  React.useEffect(() => {
    const initialMap: typeof inputNilaiMap = {};
    anggotaEkskul.forEach(s => {
      // Cari jika data nilai lama sudah pernah diinput sebelumnya
      const existing = ekskulData.find(d => d.namaSiswa === s.name);
      initialMap[s.id] = {
        predikat: (existing?.predikat as any) || 'B',
        catatan: existing?.catatan || 'Menunjukkan perkembangan minat dan kedisiplinan yang baik.'
      };
    });
    setInputNilaiMap(initialMap);
  }, [anggotaEkskul, ekskulData]);

  const handleValueChange = (studentId: string, field: 'predikat' | 'catatan', value: string) => {
    setInputNilaiMap(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const handleSaveNilai = async () => {
    if (anggotaEkskul.length === 0) return;
    setIsSubmittingNilai(true);

    try {
      // Buat struktur data sesuai nama kolom tabel 'extracurricular_scores' Anda
      const payload = anggotaEkskul.map(s => {
        const input = inputNilaiMap[s.id] || { predikat: 'B', catatan: '' };
        return {
          student_id: Number(s.id), // Mengubah ID string ke bigint (int8) Supabase
          nama_ekskul: namaEkskulBinaan,
          nilai_kualitatif: input.predikat,
          catatan_pembinaan: input.catatan
        };
      });

      const { error } = await supabase
        .from('extracurricular_scores')
        .insert(payload);

      if (error) throw new Error(error.message);

      setNilaiSuccess(`Berhasil mengunggah rekap nilai rapor ekskul ${namaEkskulBinaan} ke Supabase!`);
      setTimeout(() => setNilaiSuccess(''), 4000);
    } catch (err: any) {
      alert(`Gagal menyimpan nilai ekskul: ${err.message}`);
    } finally {
      setIsSubmittingNilai(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Kendali Modul */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg p-2 transition flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> <span className="text-xs font-semibold">Kembali ke Beranda</span>
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Panel Pembina Ekstrakurikuler: {namaEkskulBinaan}
          </h2>
          <p className="text-xs text-slate-500 font-medium">Manajemen kegiatan mingguan, rekap anggota aktif, dan pengisian nilai rapor ekstrakurikuler.</p>
        </div>
      </div>

      {/* Navigasi Sub Tab Modul */}
      <div className="border-b border-slate-200 flex gap-2">
        <button
          onClick={() => setActiveTab('jurnal')}
          className={`px-4 py-2 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'jurnal' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Input Jurnal Kegiatan
        </button>
        <button
          onClick={() => setActiveTab('anggota')}
          className={`px-4 py-2 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'anggota' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" /> Manajemen Anggota Aktif ({anggotaEkskul.length})
        </button>
        <button
          onClick={() => setActiveTab('nilai')}
          className={`px-4 py-2 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'nilai' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" /> Input Nilai Rapor Ekskul
        </button>
      </div>

      {/* Konten Kotak Putih Utama Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm min-h-[40vh]">
        
        {/* TAB 1: FORM JURNAL KEGIATAN */}
        {activeTab === 'jurnal' && (
          <form onSubmit={handleSubmitJurnal} className="max-w-xl space-y-4">
            <div className="space-y-1 pb-2 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Form Jurnal Latihan Mingguan</h4>
                <p className="text-[10px] text-slate-400">Pencatatan materi latihan rutin ekstrakurikuler sekolah.</p>
              </div>
              <span className="flex items-center gap-1 text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                <Check className="w-3 h-3" /> Supabase Live
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Tanggal Latihan</label>
                <input
                  type="date"
                  required
                  value={tanggalKegiatan}
                  onChange={(e) => setTanggalKegiatan(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Jumlah Anggota Hadir</label>
                <input
                  type="number"
                  value={jumlahHadir}
                  onChange={(e) => setJumlahHadir(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Materi / Agenda Latihan</label>
              <input
                type="text"
                required
                value={materiKegiatan}
                onChange={(e) => setMateriKegiatan(e.target.value)}
                placeholder="Contoh: Teknik dasar PBB, latihan fisik, atau aransemen lagu baru..."
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Catatan / Hambatan Pembinaan</label>
              <textarea
                rows={4}
                value={catatanKegiatan}
                onChange={(e) => setCatatanKegiatan(e.target.value)}
                placeholder="Uraikan jalannya latihan serta kendala sarana prasarana jika ada..."
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
              ></textarea>
            </div>

            {jurnalSuccess && (
              <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 p-2 rounded font-semibold">
                {jurnalSuccess}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmittingJurnal}
              className="w-full bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1.5 shadow disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {isSubmittingJurnal ? 'Menyimpan...' : 'Simpan Jurnal Latihan'}
            </button>
          </form>
        )}

        {/* TAB 2: DAFTAR MANAJEMEN ANGGOTA EKSUKUL */}
        {activeTab === 'anggota' && (
          <div className="space-y-4">
            <div className="space-y-1 pb-2 border-b border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Daftar Anggota Aktif ({namaEkskulBinaan})</h4>
              <p className="text-[10px] text-slate-400">Siswa yang diatur memilih ekstrakurikuler ini pada dasbor Admin otomatis terdata di sini.</p>
            </div>

            {anggotaEkskul.length === 0 ? (
              <div className="text-center p-8 bg-slate-50 rounded-2xl text-slate-400 text-xs">
                Belum ada anggota yang terdaftar di ekstrakurikuler {namaEkskulBinaan}.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {anggotaEkskul.map(student => (
                  <div key={student.id} className="p-4 border border-slate-100 bg-slate-50/50 rounded-2xl flex flex-col justify-between">
                    <div>
                      <span className="inline-block bg-sky-50 text-sky-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-sky-100 uppercase mb-2">
                        Kelas {student.kelas}
                      </span>
                      <h5 className="text-xs font-bold text-slate-800">{student.name}</h5>
                    </div>
                    <p className="text-[9px] font-mono text-slate-400 mt-2">NISN: {student.nisn}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FORM INPUT NILAI RAPOR EKSKUL */}
        {activeTab === 'nilai' && (
          <div className="space-y-6">
            <div className="space-y-1 pb-3 border-b border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Penilaian Kualitatif Akhir Semester</h4>
              <p className="text-xs text-slate-400">Pemberian predikat nilai serta catatan progres pembinaan bakat/minat untuk rapor akhir siswa.</p>
            </div>

            {anggotaEkskul.length === 0 ? (
              <div className="text-center p-8 bg-slate-50 rounded-2xl text-slate-400 text-xs">
                Tidak ada data anggota untuk dilakukan proses penilaian.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                        <th className="p-3 w-1/4">Nama Anggota</th>
                        <th className="p-3 w-24 text-center">Predikat</th>
                        <th className="p-3">Catatan Perkembangan Pembinaan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {anggotaEkskul.map(student => {
                        const currentVal = inputNilaiMap[student.id] || { predikat: 'B', catatan: '' };

                        return (
                          <tr key={student.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-semibold text-slate-800">
                              {student.name}
                              <p className="text-[9px] font-mono text-slate-400">Kelas: {student.kelas}</p>
                            </td>
                            <td className="p-3 text-center">
                              <select
                                value={currentVal.predikat}
                                onChange={(e) => handleValueChange(student.id, 'predikat', e.target.value as any)}
                                className="border border-slate-200 rounded p-1 font-bold bg-slate-50 text-xs text-center"
                              >
                                {['A', 'B', 'C', 'D'].map(p => (
                                  <option key={p} value={p}>{p}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3">
                              <input
                                type="text"
                                value={currentVal.catatan}
                                onChange={(e) => handleValueChange(student.id, 'catatan', e.target.value)}
                                placeholder="Tuliskan catatan progres atau sertifikat penghargaan..."
                                className="w-full border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-700 bg-slate-50/50 focus:outline-none focus:bg-white"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {nilaiSuccess && (
                  <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 p-2.5 rounded font-semibold">
                    {nilaiSuccess}
                  </p>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNilai}
                    disabled={isSubmittingNilai}
                    className="bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs px-6 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" /> {isSubmittingNilai ? 'Mengunggah...' : 'Simpan Seluruh Nilai Rapor'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default EkskulPanel;