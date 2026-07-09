import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import AdminPanel from './AdminPanel';
import GuruMapelPanel from './GuruMapelPanel';
import GuruPiketPanel from './GuruPiketPanel';
import WaliKelasPanel from './WaliKelasPanel';
import EkskulPanel from './EkskulPanel';
import BkPanel from './BkPanel';
import ExportPanel from './ExportPanel';
import { BookOpen, UserCheck, Award, HeartHandshake, FileText, LayoutDashboard } from 'lucide-react';

const MainDashboard: React.FC = () => {
  const { currentUser, gurus, siswa, jurnalMengajar, kasusBK, nilaiEkskul } = useApp();
  const [guruView, setGuruView] = useState<string>('home');
  const [activeTab, setActiveTab] = useState('overview');

  if (!currentUser) return null;

  const currentGuruProfile = gurus.find(g => String(g.id) === String(currentUser.id) || g.name === currentUser.name);

  const myJurnal = useMemo(() => {
    return jurnalMengajar.filter(j => String(j.guruId) === String(currentUser.id));
  }, [jurnalMengajar, currentUser.id]);

  const mySiswaWali = useMemo(() => {
    return currentGuruProfile?.kelasWali ? siswa.filter(s => s.kelas === currentGuruProfile.kelasWali) : [];
  }, [siswa, currentGuruProfile]);

  const myEkskulData = useMemo(() => {
    return currentGuruProfile?.namaEkskul ? nilaiEkskul.filter(n => n.namaEkskul === currentGuruProfile.namaEkskul) : [];
  }, [nilaiEkskul, currentGuruProfile]);

  return (
    <div className="space-y-6">
      {currentUser.role === 'admin' && (
        <div className="space-y-6">
          <div className="flex border-b border-slate-200 gap-2">
            <button onClick={() => setActiveTab('overview')} className={`pb-3 px-4 font-semibold text-sm border-b-2 transition cursor-pointer ${activeTab === 'overview' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500'}`}>Ringkasan Sistem</button>
            <button onClick={() => setActiveTab('manage')} className={`pb-3 px-4 font-semibold text-sm border-b-2 transition cursor-pointer ${activeTab === 'manage' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500'}`}>Data Master & Template</button>
          </div>

          {activeTab === 'overview' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm"><h3 className="text-xs font-bold text-slate-400 uppercase">Total Guru</h3><p className="text-2xl font-black text-slate-900 mt-2">{gurus.length}</p></div>
              <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm"><h3 className="text-xs font-bold text-slate-400 uppercase">Total Siswa</h3><p className="text-2xl font-black text-slate-900 mt-2">{siswa.length}</p></div>
              <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm"><h3 className="text-xs font-bold text-slate-400 uppercase">Kasus BK</h3><p className="text-2xl font-black text-slate-900 mt-2">{kasusBK.length}</p></div>
            </div>
          ) : (
            <AdminPanel onBackToDashboard={() => setActiveTab('overview')} />
          )}
        </div>
      )}

      {(currentUser.role === 'guru' || currentUser.role === 'guru_bk') && (
        <div className="space-y-6">
          {guruView === 'home' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-sky-600 to-indigo-600 p-6 rounded-2xl text-white shadow-md">
                <h2 className="text-xl font-bold">Selamat Datang, {currentUser.name}!</h2>
                <p className="text-sky-100 text-xs mt-1">Silakan pilih menu ruang lingkup kerja aktif Anda.</p>
              </div>

              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Akses Menu Kerja</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button onClick={() => setGuruView('mapel')} className="bg-white p-5 border border-slate-200 rounded-2xl text-left hover:border-sky-500 hover:ring-4 hover:ring-sky-50 transition flex items-start gap-4 cursor-pointer group">
                  <div className="p-3 bg-sky-50 text-sky-600 rounded-xl group-hover:bg-sky-600 group-hover:text-white transition"><BookOpen className="w-5 h-5" /></div>
                  <div><h4 className="text-sm font-bold text-slate-800">Guru Mata Pelajaran</h4><p className="text-xs text-slate-400 mt-1">Input Jurnal Kelas harian & Riwayat Mengajar.</p></div>
                </button>

                {/* PERBAIKAN: Ditambahkan ?. setelah subRoles agar tidak crash jika profile kosong */}
                {currentGuruProfile?.subRoles?.includes('wali_kelas') && (
                  <button onClick={() => setGuruView('walikelas')} className="bg-white p-5 border border-slate-200 rounded-2xl text-left hover:border-indigo-500 hover:ring-4 hover:ring-indigo-50 transition flex items-start gap-4 cursor-pointer group">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition"><UserCheck className="w-5 h-5" /></div>
                    <div><h4 className="text-sm font-bold text-slate-800">Wali Kelas ({currentGuruProfile.kelasWali})</h4><p className="text-xs text-slate-400 mt-1">Rekap absensi harian dan peninjauan kasus BK siswa.</p></div>
                  </button>
                )}

                {currentGuruProfile?.namaEkskul && (
                  <button onClick={() => setGuruView('ekskul')} className="bg-white p-5 border border-slate-200 rounded-2xl text-left hover:border-emerald-500 hover:ring-4 hover:ring-emerald-50 transition flex items-start gap-4 cursor-pointer group">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition"><Award className="w-5 h-5" /></div>
                    <div><h4 className="text-sm font-bold text-slate-800">Pembina Ekskul ({currentGuruProfile.namaEkskul})</h4><p className="text-xs text-slate-400 mt-1">Input jurnal latihan mingguan dan nilai rapor ekskul.</p></div>
                  </button>
                )}

                {(currentUser.role === 'guru_bk' || currentGuruProfile?.subRoles?.includes('guru_bk')) && (
                  <button onClick={() => setGuruView('bk')} className="bg-white p-5 border border-slate-200 rounded-2xl text-left hover:border-rose-500 hover:ring-4 hover:ring-rose-50 transition flex items-start gap-4 cursor-pointer group">
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition"><HeartHandshake className="w-5 h-5" /></div>
                    <div><h4 className="text-sm font-bold text-slate-800">Bimbingan Konseling (BK)</h4><p className="text-xs text-slate-400 mt-1">Pencatatan kasus pelanggaran & riwayat konseling.</p></div>
                  </button>
                )}

                {currentGuruProfile?.subRoles?.includes('guru_piket') && (
                  <button onClick={() => setGuruView('piket')} className="bg-white p-5 border border-slate-200 rounded-2xl text-left hover:border-amber-500 hover:ring-4 hover:ring-amber-50 transition flex items-start gap-4 cursor-pointer group">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition"><LayoutDashboard className="w-5 h-5" /></div>
                    <div><h4 className="text-sm font-bold text-slate-800">Guru Piket</h4><p className="text-xs text-slate-400 mt-1">Pemantauan KBM harian harian sekolah.</p></div>
                  </button>
                )}

                <button onClick={() => setGuruView('laporan')} className="bg-white p-5 border border-slate-200 rounded-2xl text-left hover:border-slate-800 hover:ring-4 hover:ring-slate-100 transition flex items-start gap-4 cursor-pointer group">
                  <div className="p-3 bg-slate-100 text-slate-700 rounded-xl group-hover:bg-slate-800 group-hover:text-white transition"><FileText className="w-5 h-5" /></div>
                  <div><h4 className="text-sm font-bold text-slate-800">Unduh Laporan</h4><p className="text-xs text-slate-400 mt-1">Cetak rekap agenda, jurnal, nilai, & absensi.</p></div>
                </button>
              </div>
            </div>
          )}

          {guruView === 'mapel' && <GuruMapelPanel onBack={() => setGuruView('home')} Jurnal={myJurnal} />}
          {guruView === 'piket' && <GuruPiketPanel onBack={() => setGuruView('home')} />}
          {guruView === 'walikelas' && <WaliKelasPanel onBack={() => setGuruView('home')} siswaList={mySiswaWali} />}
          {guruView === 'ekskul' && <EkskulPanel onBack={() => setGuruView('home')} ekskulData={myEkskulData} />}
          {guruView === 'bk' && <BkPanel onBack={() => setGuruView('home')} kasusList={kasusBK} />}
          {guruView === 'laporan' && <ExportPanel onBack={() => setGuruView('home')} />}
        </div>
      )}
    </div>
  );
};

export default MainDashboard;