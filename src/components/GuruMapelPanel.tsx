import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { LIST_KELAS_LENGKAP } from "../utils/kelasHelper";

export const GuruMapelPanel: React.FC = () => {
  const { currentUser, siswa, addJurnalMengajar } = useApp();
  const [loading, setLoading] = useState(false);

  // State Form Jurnal
  const [formData, setFormData] = useState({
    mataPelajaran: currentUser?.mata_pelajaran || "",
    kelas: "",
    jamKe: "",
    materi: "",
    aktivitas: "",
  });

  // State Absensi Siswa di kelas yang terpilih
  const [absensi, setAbsensi] = useState<{ [siswaId: string]: string }>({});

  // Filter siswa berdasarkan kelas yang dipilih di UI (format dengan strip, e.g., "VIII-A")
  const siswaFilter = siswa.filter((s) => s.kelas === formData.kelas);

  const handleStatusChange = (siswaId: string, status: string) => {
    setAbsensi((prev) => ({ ...prev, [siswaId]: status }));
  };

  const handleSubmitJurnal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kelas || !formData.jamKe || !formData.materi) {
      alert("Mohon lengkapi data Kelas, Jam Pelajaran, dan Materi Pokok!");
      return;
    }

    setLoading(true);
    try {
      // Susun data absensi untuk dikirim ke action context
      const absensiPayload = siswaFilter.map((s) => ({
        student_id: s.id,
        status: absensi[s.id] || "H", // Default 'H' (Hadir) jika tidak diubah
      }));

      await addJurnalMengajar(
        {
          guruId: currentUser?.id || "",
          guruName: formData.mataPelajaran,
          kelas: formData.kelas, // Kirim format "VIII-A", AppContext akan otomatis mengubah ke "VIII A" untuk DB
          jamKe: formData.jamKe,
          materi: formData.materi,
          aktivitas: formData.aktivitas,
          tanggal: new Date().toISOString().split("T")[0],
          hari: "",
        },
        absensiPayload
      );

      alert("Jurnal Mengajar dan Absensi berhasil disimpan!");
      // Reset Form kecuali Mata Pelajaran
      setFormData({
        ...formData,
        kelas: "",
        jamKe: "",
        materi: "",
        aktivitas: "",
      });
      setAbsensi({});
    } catch (err: any) {
      console.error(err);
      alert(`Gagal menyimpan jurnal: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-5xl mx-auto">
      <h2 className="text-xl font-bold mb-4 text-blue-900">
        Form Input Jurnal Mengajar & Presensi Siswa
      </h2>
      
      <form onSubmit={handleSubmitJurnal} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Mata Pelajaran */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold mb-1">Mata Pelajaran</label>
            <input
              type="text"
              className="border p-2 rounded-md bg-gray-100 cursor-not-allowed"
              value={formData.mataPelajaran}
              disabled
            />
          </div>

          {/* Kelas Mengajar - MENGGUNAKAN LIST LENGKAP VII A - IX H */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold mb-1">Kelas Mengajar</label>
            <select
              className="border p-2 rounded-md bg-white w-full"
              value={formData.kelas}
              onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
            >
              <option value="">-- Pilih Kelas Mengajar --</option>
              {LIST_KELAS_LENGKAP.map((kls) => (
                <option key={kls} value={kls}>
                  Kelas {kls}
                </option>
              ))}
            </select>
          </div>

          {/* Jam Pelajaran Ke */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold mb-1">Jam Pelajaran Ke-</label>
            <input
              type="text"
              placeholder="Contoh: 1-3 atau 4-6"
              className="border p-2 rounded-md"
              value={formData.jamKe}
              onChange={(e) => setFormData({ ...formData, jamKe: e.target.value })}
            />
          </div>
        </div>

        {/* Materi Bahasan */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold mb-1">Materi Pokok Pembahasan</label>
          <input
            type="text"
            placeholder="Tuliskan materi atau bab yang dipelajari hari ini..."
            className="border p-2 rounded-md"
            value={formData.materi}
            onChange={(e) => setFormData({ ...formData, materi: e.target.value })}
          />
        </div>

        {/* Catatan Aktivitas */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold mb-1">Catatan Aktivitas & Hambatan Kelas</label>
          <textarea
            rows={3}
            placeholder="Ceritakan jalannya KBM, penugasan, atau hambatan jika ada..."
            className="border p-2 rounded-md"
            value={formData.aktivitas}
            onChange={(e) => setFormData({ ...formData, aktivitas: e.target.value })}
          />
        </div>

        {/* Tabel Tabel Presensi Siswa Otomatis Muncul saat Kelas Dipilih */}
        {formData.kelas && (
          <div className="mt-6 border-t pt-4">
            <h3 className="font-bold text-md mb-2 text-gray-700">
              Daftar Hadir Siswa Kelas {formData.kelas} ({siswaFilter.length} Siswa)
            </h3>
            {siswaFilter.length === 0 ? (
              <p className="text-sm text-red-500 italic">Belum ada data siswa terdaftar untuk kelas ini di database.</p>
            ) : (
              <div className="overflow-x-auto max-h-72 border rounded-md">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">No</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">NISN</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">Nama Siswa</th>
                      <th className="px-4 py-2 text-center font-semibold text-gray-600">Status Presensi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {siswaFilter.map((s, index) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">{index + 1}</td>
                        <td className="px-4 py-2 text-gray-500">{s.nisn}</td>
                        <td className="px-4 py-2 font-medium text-gray-800">{s.name}</td>
                        <td className="px-4 py-2 text-center">
                          <div className="flex justify-center space-x-2">
                            {["H", "S", "I", "A"].map((status) => (
                              <label
                                key={status}
                                className={`cursor-pointer px-3 py-1 text-xs font-bold rounded-md border ${
                                  (absending[s.id] || "H") === status
                                    ? status === "H" ? "bg-green-100 text-green-700 border-green-400"
                                      : status === "S" ? "bg-yellow-100 text-yellow-700 border-yellow-400"
                                      : status === "I" ? "bg-blue-100 text-blue-700 border-blue-400"
                                      : "bg-red-100 text-red-700 border-red-400"
                                    : "bg-white text-gray-500 border-gray-200"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`absensi-${s.id}`}
                                  value={status}
                                  checked={(absensi[s.id] || "H") === status}
                                  onChange={() => handleStatusChange(s.id, status)}
                                  className="hidden"
                                />
                                {status === "H" ? "Hadir" : status === "S" ? "Sakit" : status === "I" ? "Izin" : "Alfa"}
                              </label>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <button
            type="button"
            className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50"
            onClick={() => setFormData({ ...formData, kelas: "", jamKe: "", materi: "", aktivitas: "" })}
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-sm disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Simpan Jurnal"}
          </button>
        </div>
      </form>
    </div>
  );
};
