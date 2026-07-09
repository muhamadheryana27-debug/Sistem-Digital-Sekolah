import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Users, ShieldAlert, Award, AlertTriangle, Calendar } from 'lucide-react';

interface WaliKelasPanelProps {
  onBack: () => void;
}

export default function WaliKelasPanel({ onBack }: WaliKelasPanelProps) {
  const { activeGuru, siswa, kasusBk, nilaiEkskul, virtualDay } = useApp();

  const [activeTab, setActiveTab] = useState<'attendance' | 'dual_monitoring'>('attendance');

  // Verify Wali Kelas is valid and set class
  const kelasWali = activeGuru?.kelasWali || '';

  // Filter students belonging to this Wali Kelas
  const myStudents = useMemo(() => {
    return siswa.filter(s => s.kelas === kelasWali);
  }, [siswa, kelasWali]);

  // Dual Monitoring Info: Map BK incidents and Extracurricular data for home-room students
  const dualMonitoringData = useMemo(() => {
    return myStudents.map(student => {
      const studentBkIncidents = kasusBk.filter(k => k.siswaId === student.id);
      const studentEkskulGrades = nilaiEkskul.find(ne => ne.siswaId === student.id);

      return {
        student,
        bkIncidents: studentBkIncidents,
        ekskulGrade: studentEkskulGrades
      };
    });
  }, [myStudents, kasusBk, nilaiEkskul]);

  // Attendance stats for home-room
  const homeRoomStats = useMemo(() => {
    const total = myStudents.length;
    const sakit = myStudents.filter(s => s.statusAbsen === 'Sakit').length;
    const izin = myStudents.filter(s => s.statusAbsen === 'Izin').length;
    const alfa = myStudents.filter(s => s.statusAbsen === 'Alfa').length;
    const hadir = total - sakit - izin - alfa;

    return { total, sakit, izin, alfa, hadir };
  }, [myStudents]);

  if (!kelasWali) {
    return (
      <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="font-bold text-slate-900">Hak Akses Terbatas</h3>
        <p className="text-sm text-slate-500">Akun Anda tidak dikonfigurasi sebagai Wali Kelas. Silakan kembali ke Beranda atau pilih Sri Mulyani (Wali Kelas IX-A) di Simulator.</p>
        <button onClick={onBack} className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer">
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button Row */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg p-2 transition flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> <span className="text-xs font-semibold">Kembali ke Beranda</span>
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Pusat Kendali Wali Kelas ({kelasWali})
          </h2>
          <p className="text-xs text-slate-500 font-medium">Memantau rekapitulasi kehadiran harian serta rekam ganda bimbingan konseling dan ekstrakurikuler siswa binaan.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-xs">
          <p className="text-[10px] font-bold uppercase text-slate-400">Total Murid Kelas</p>
          <p className="text-xl font-black text-slate-800 mt-1">{homeRoomStats.total}</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center shadow-xs">
          <p className="text-[10px] font-bold uppercase text-emerald-500">Hadir Hari Ini</p>
          <p className="text-xl font-black text-emerald-700 mt-1">{homeRoomStats.hadir}</p>
        </div>
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center shadow-xs">
          <p className="text-[10px] font-bold uppercase text-amber-500">Sakit</p>
          <p className="text-xl font-black text-amber-700 mt-1">{homeRoomStats.sakit}</p>
        </div>
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-center shadow-xs">
          <p className="text-[10px] font-bold uppercase text-indigo-500">Izin</p>
          <p className="text-xl font-black text-indigo-700 mt-1">{homeRoomStats.izin}</p>
        </div>
        <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 text-center shadow-xs col-span-2 md:col-span-1">
          <p className="text-[10px] font-bold uppercase text-rose-500">Alfa</p>
          <p className="text-xl font-black text-rose-700 mt-1">{homeRoomStats.alfa}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-2">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'attendance' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" /> Rekap Absensi Kelas Binaan
        </button>
        <button
          onClick={() => setActiveTab('dual_monitoring')}
          className={`px-4 py-2 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'dual_monitoring' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" /> Monitoring Siswa Ganda (Ekskul & BK)
        </button>
      </div>

      {/* Tab Panel Contents */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm min-h-[40vh]">
        
        {/* TAB 1: ATTENDANCE REKAP */}
        {activeTab === 'attendance' && (
          <div className="space-y-4">
            <div className="pb-3 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase text-slate-500">Status Kehadiran Kelas Binaan ({kelasWali})</h3>
              <span className="text-[10px] font-mono text-slate-400">Hari ini: {virtualDay}</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                    <th className="p-3">Nama Lengkap Murid</th>
                    <th className="p-3">NISN</th>
                    <th className="p-3 text-center">Status Kehadiran Hari Ini</th>
                    <th className="p-3">Catatan Alasan / Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {myStudents.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-800">{st.name}</td>
                      <td className="p-3 font-mono text-slate-400">{st.nisn}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold border uppercase ${
                          st.statusAbsen === 'Hadir' ? 'bg-sky-50 text-sky-700 border-sky-100'
                          : st.statusAbsen === 'Sakit' ? 'bg-amber-50 text-amber-700 border-amber-100'
                          : st.statusAbsen === 'Izin' ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                          : 'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>
                          {st.statusAbsen}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 italic font-medium">{st.catatanAbsen || '-'}</td>
                    </tr>
                  ))}
                  {myStudents.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400 italic">Belum ada siswa terdaftar di kelas perwalian Anda.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: DUAL MONITORING (EKSKUL & BK) */}
        {activeTab === 'dual_monitoring' && (
          <div className="space-y-6">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase text-slate-500">Monitoring Kasus Kesiswaan & Ekstrakurikuler Ganda</h3>
              <p className="text-xs text-slate-400">Memungkinkan Wali Kelas mendeteksi kerawanan sosial bimbingan konseling dan performa ekstrakurikuler murid didiknya di satu layar tunggal.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {dualMonitoringData.map(({ student, bkIncidents, ekskulGrade }) => (
                <div key={student.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col md:flex-row">
                  
                  {/* Left block: student details */}
                  <div className="md:w-1/4 bg-slate-50 p-4 border-r border-slate-200 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-800">{student.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">NISN: {student.nisn}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60">
                      <span className="text-[9px] font-bold uppercase text-slate-400 block">Keterlibatan Ekskul</span>
                      <span className="text-xs font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded inline-block mt-1 border border-sky-100/50">
                        {student.ekskul || 'Tidak Mengikuti'}
                      </span>
                    </div>
                  </div>

                  {/* Middle block: BK bimbingan cases history */}
                  <div className="flex-1 p-4 space-y-3">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> Log Kasus & Bimbingan BK ({bkIncidents.length})
                    </span>

                    {bkIncidents.length > 0 ? (
                      <div className="space-y-2">
                        {bkIncidents.map(inc => (
                          <div key={inc.id} className="p-2.5 bg-rose-50/40 border border-rose-100 rounded-lg text-xs">
                            <div className="flex justify-between items-center font-bold">
                              <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded ${
                                inc.tipeKasus === 'Pelanggaran' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {inc.tipeKasus}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono">{inc.tanggal}</span>
                            </div>
                            <p className="text-slate-700 mt-1.5 italic font-sans">"{inc.deskripsi}"</p>
                            <p className="text-emerald-700 text-[10px] font-bold mt-1 bg-emerald-50 px-1.5 py-0.5 rounded inline-block">
                              Tindakan: {inc.solusi}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic py-2">Siswa memiliki catatan perilaku yang bersih dan teladan.</p>
                    )}
                  </div>

                  {/* Right block: extracurricular assessment details */}
                  <div className="md:w-1/3 p-4 bg-slate-50/40 border-l border-slate-100 flex flex-col justify-between">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-purple-500" /> Penilaian Ekskul Rapor
                    </span>

                    {ekskulGrade ? (
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-600">Ekskul: {ekskulGrade.namaEkskul}</span>
                          <span className="bg-purple-100 text-purple-800 border border-purple-200 text-xs font-black px-2 py-0.2 rounded">
                            Predikat {ekskulGrade.predikat}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 italic line-clamp-3">"{ekskulGrade.catatan}"</p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic py-4">Belum ada rekap predikat ekskul diinput oleh Pembina.</p>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
