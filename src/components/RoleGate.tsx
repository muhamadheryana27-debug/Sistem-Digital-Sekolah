import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import { Shield, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';

const RoleGate: React.FC = () => {
  const { setCurrentUser } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State untuk kontrol intip password
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const cleanUsername = username.trim();

      // 1. Ambil data dari tabel users berdasarkan username
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (userError) throw new Error(`Masalah koneksi Supabase: ${userError.message}`);
      if (!userData) throw new Error('Username tidak ditemukan dalam sistem.');
      if (!password) throw new Error('Password wajib diisi.');

      // 2. Ambil detail data nama lengkap dari tabel profiles
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userData.id)
        .maybeSingle();

      // 3. Masuk dengan mempertahankan status role asli dari database (admin / guru / guru_bk)
      setCurrentUser({
        id: String(userData.id),
        name: profileData?.nama_lengkap || userData.username,
        role: userData.role // Menyimpan string murni: admin, guru, atau guru_bk
      });

    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat masuk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
        
        {/* Logo & Judul Sistem */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">SIGAP Dashboard</h1>
          <p className="text-xs text-slate-400">Sistem Informasi Penilaian Guru & Absensi Siswa</p>
        </div>

        {/* Notifikasi Pesan Eror */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-2xl flex items-start gap-3 text-rose-700 text-xs font-semibold animate-shake">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Input Login */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600">Username</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username Anda..."
                className="w-full text-xs pl-10 pr-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-50 transition"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600">Password Akun</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'} // Tipe dinamis berdasarkan state
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password Anda..."
                className="w-full text-xs pl-10 pr-11 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-50 transition"
                disabled={isSubmitting}
              />
              {/* Tombol Interaktif Intip Password */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer p-0.5 rounded transition"
                title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-2xl text-xs transition duration-200 shadow-sm disabled:opacity-50 flex items-center justify-center cursor-pointer mt-2"
          >
            {isSubmitting ? 'Memproses Verifikasi...' : 'Masuk ke Sistem'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RoleGate;