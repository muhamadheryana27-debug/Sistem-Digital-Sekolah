import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { LIST_KELAS_LENGKAP } from "../utils/kelasHelper";

export const GuruMapelPanel: React.FC = () => {
  const { currentUser, siswa, addJurnalMengajar } = useApp();
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);

  // State Utama Form Jurnal
  const [formData, setFormData] = useState({
    mataPelajaran: currentUser?.mata_pelajaran || "Informatika",
    kelas: "",
    jamKe: "",
    materi: "",
    aktivitas: "",
  });

  // State Dinamis Presensi per Siswa (Default: H)
  const [absensi, setAbsensi] = useState<{ [siswaId: string]: string }>({});
  
  // State Dinamis Jenis Catatan per Siswa (apresiasi / pelanggaran - Sesuai Enum DB)
  const [logTypes, setLogTypes] = useState<{ [siswaId: string]: string }>({});

  // State Dinamis Isi Teks Catatan/Kejadian per Siswa
  const [logNotes, setLogNotes] = useState<{ [siswaId: string]: string }>({});

  // Siswa difilter berdasarkan drop-down kelas yang dipilih
  const siswaFilter = siswa.filter((s) => s.kelas === formData.kelas);

  const handleStatusChange = (siswaId: string, status: string) => {
    setAbsensi((prev) => ({ ...prev, [siswaId]: status }));
  };

  const handleLogTypeChange = (siswaId: string, type: string) => {
    setLogTypes((prev) => ({ ...prev, [siswaId]: type }));
  };

  const handleNoteChange = (siswaId: string, text: string) => {
    setLogNotes((prev) => ({ ...prev, [siswaId]: text }));
  };

  const handleBukaForm = () => {
    if (!formData.kelas) {
      alert("Silakan pilih kelas terlebih dahulu!");
      return;
    }
    setFormVisible(true);
  };

  const handleSubmitJurnal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kelas || !formData.jamKe || !formData.materi) {
      alert("Mohon lengkapi Detail Pembelajaran (Jam Pelajaran, Rombel, dan Materi)!");
      return;
    }

    setLoading(true);
    try {
      // 1. Siapkan payload absensi siswa
      const absensiPayload = siswaFilter.map((s) => ({
        student_id: s.id,
        status: absensi[s.id] || "H",
      }));

      // 2. Siapkan payload log kejadian khusus siswa (Berdasarkan Enum Murni DB)
      const logsPayload = siswaFilter
        .filter((s) => logNotes[s.id] && logNotes[s.id].trim() !== "")
        .map((s) => ({
          student_id: s.id,
          jenis_kejadian: logTypes[s.id] || "apresiasi", // Murni string 'apresiasi' / 'pelanggaran'
          catatan_kejadian: logNotes[s.id],
        }));

      // 3. Panggil action context untuk eksekusi Supabase
      await addJurnalMengajar(
        {
          guruId: currentUser?.id || "",
          guruName: formData.mataPelajaran,
          kelas: formData.kelas,
          jamKe: formData.jamKe,
          materi: formData.materi,
          aktivitas: formData.aktivitas,
          tanggal: new Date().toISOString().split("T")[0],
          hari: "",
        },
        absensiPayload,
        logsPayload
      );

      alert("Jurnal Mengajar, Absensi, dan Catatan Siswa berhasil disimpan!");
      
      // Reset State Form
      setFormData({ ...formData, kelas: "", jamKe: "", materi: "", aktivitas: "" });
      setAbsensi({});
      setLogTypes({});
      setLogNotes({});
      setFormVisible(false);
    } catch (err: any) {
      console.error(err);
      alert(`Gagal menyimpan data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        
        {/* Header Panel */}
        <div className="bg-blue-600 px-6 py-4 text-white flex items-center space-x-2">
          <span className="text-xl">📋</span>
          <h2 className="text-lg font-bold">Isi Jurnal & Absensi Kelas</h2>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Bagian 1: Pilih Kelas Mengajar */}
          <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm flex items-end space-x-4">
            <div className="flex-1">
              <label className="text-sm font-semibold text-gray-700 block mb-1">Pilih Kelas Mengajar</label>
              <select
                className="border p-2 rounded-md bg-white w-full text-sm"
                value={formData.kelas}
                onChange={(e) => {
                  setFormData({ ...formData, kelas: e.target.value });
                  setFormVisible(false);
                }}
              >
                <option value="">-- Pilih Rombel --</option>
                {LIST_KELAS_LENGKAP.map((kls) => (
                  <option key={kls} value={kls}>Kelas {kls}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleBukaForm}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-5 py-2 rounded-md shadow transition"
            >
              Buka Form
            </button>
          </div>

          {/* Form Utama (Hanya Tampil Saat Tombol Buka Form Diklik) */}
          {formVisible && (
            <form onSubmit={handleSubmitJurnal} className="space-y-6">
              
              {/* Bagian 2: Detail Pembelajaran */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b pb-1">
                  Detail Pembelajaran
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Mata Pelajaran</label>
                    <input
                      type="text"
                      className="border p-2 rounded-md bg-gray-50 w-full text-sm font-medium text-gray-700 cursor-not-allowed"
                      value={formData.mataPelajaran}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Jam Ke-</label>
                    <input
                      type="text"
                      placeholder="Contoh: 1-2"
                      className="border p-2 rounded-md w-full text-sm"
                      value={formData.jamKe}
                      onChange={(e) => setFormData({ ...formData, jamKe: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Rombel Belajar</label>
                    <input
                      type="text"
                      className="border p-2 rounded-md bg-gray-50 w-full text-sm font-bold text-gray-600 cursor-not-allowed"
                      value={formData.kelas.replace("-", " ")}
                      disabled
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Materi Pokok Pembelajaran</label>
                  <input
                    type="text"
                    placeholder="Tuliskan pokok pembahasan materi hari ini..."
                    className="border p-2 rounded-md w-full text-sm"
                    value={formData.materi}
                    onChange={(e) => setFormData({ ...formData, materi: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Catatan Hambatan / Aktivitas Umum</label>
                  <input
                    type="text"
                    placeholder="Isi hambatan kelas secara umum jika ada..."
                    className="border p-2 rounded-md w-full text-sm"
                    value={formData.aktivitas}
                    onChange={(e) => setFormData({ ...formData, aktivitas: e.target.value })}
                  />
                </div>
              </div>

              {/* Bagian 3: Daftar Absensi & Catatan Khusus Siswa */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b pb-1">
                  Daftar Absensi & Catatan Khusus Siswa
                </h3>

                {siswaFilter.length === 0 ? (
                  <p className="text-sm text-amber-600 italic p-4 bg-amber-50 rounded-md border border-amber-200">
                    Tidak ditemukan data siswa aktif terdaftar di kelas ini.
                  </p>
                ) : (
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-inner">
                    
                    {/* Header Row Tabel */}
                    <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center text-xs font-bold text-gray-600">
                      <div className="w-1/2">Nama Siswa / Kejadian Spesifik</div>
                      <div className="w-1/2 text-right pr-12">Status Absen</div>
                    </div>

                    {/* Loop Baris Siswa */}
                    <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                      {siswaFilter.map((s) => (
                        <div key={s.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50 transition gap-3">
                          
                          {/* Sisi Kiri: Nama & Kolom Catatan KBM Siswa */}
                          <div className="w-full md:w-3/5 space-y-2">
                            <span className="text-sm font-bold text-gray-800 block uppercase">{s.name}</span>
                            
                            <div className="flex items-center space-x-2 w-full">
                              {/* Dropdown Tipe Kejadian KBM (Value wajib lowercase steril sesuai Enum Postgres) */}
                              <select
                                className="border px-2 py-1.5 rounded bg-white text-xs font-semibold border-gray-300 text-gray-700 focus:ring-1 focus:ring-blue-500"
                                value={logTypes[s.id] || "apresiasi"}
                                onChange={(e) => handleLogTypeChange(s.id, e.target.value)}
                              >
                                <option value="apresiasi">Apresiasi</option>
                                <option value="pelanggaran">Pelanggaran</option>
                              </select>

                              {/* Kolom Teks Log/Kejadian Khusus KBM */}
                              <input
                                type="text"
                                placeholder="Isi jika siswa aktif presentasi / membuat pelanggaran khusus..."
                                className="border px-3 py-1 text-xs rounded w-full border-gray-300 focus:ring-1 focus:ring-blue-500"
                                value={logNotes[s.id] || ""}
                                onChange={(e) => handleNoteChange(s.id, e.target.value)}
                              />
                            </div>
                          </div>

                          {/* Sisi Kanan: Status Absensi */}
                          <div className="flex items-center justify-start md:justify-end space-x-3 w-full md:w-2/5 pr-4">
                            {[
                              { code: "H", color: "text-green-600 border-green-500 bg-green-50" },
                              { code: "S", color: "text-amber-600 border-amber-500 bg-amber-50" },
                              { code: "I", color: "text-blue-600 border-blue-500 bg-blue-50" },
                              { code: "A", color: "text-red-600 border-red-500 bg-red-50" }
                            ].map((opt) => (
                              <label
                                key={opt.code}
                                className={`flex flex-col items-center justify-center border rounded-md w-12 h-10 cursor-pointer text-xs font-bold transition select-none ${
                                  (absensi[s.id] || "H") === opt.code
                                    ? `${opt.color} border-2 scale-105 shadow-sm`
                                    : "bg-white text-gray-400 border-gray-200 hover:bg-gray-50"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`status-${s.id}`}
                                  value={opt.code}
                                  checked={(absensi[s.id] || "H") === opt.code}
                                  onChange={() => handleStatusChange(s.id, opt.code)}
                                  className="hidden"
                                />
                                <span>{opt.code}</span>
                              </label>
                            ))}
                          </div>

                        </div>
                      ))}
                    </div>

                  </div>
                )}
              </div>

              {/* Bagian Bawah Form Aksi */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setFormVisible(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading || siswaFilter.length === 0}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-md shadow disabled:opacity-50 transition flex items-center space-x-1"
                >
                  <span>💾</span>
                  <span>{loading ? "Menyimpan Jurnal..." : "Simpan Jurnal"}</span>
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
};
