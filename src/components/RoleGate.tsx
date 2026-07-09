import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import { Shield, Lock, User, AlertCircle } from 'lucide-react';

const RoleGate: React.FC = () => {
  const { setCurrentUser } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-tr from-sky-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-sky-100 mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-950">Selamat Datang di SIDIAG</h2>
          <p className="text-sm text-slate-500 mt-1">Sistem Digital Jurnal & Agenda Sekolah.</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Username / NIP</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none"><User className="w-4 h-4" /></span>
              <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Masukkan username Anda..." className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-50" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none"><Lock className="w-4 h-4" /></span>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-50" />
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md active:scale-[0.98] transition disabled:opacity-50 cursor-pointer text-sm flex items-center justify-center gap-2">
            {isSubmitting ? 'Memverifikasi...' : 'Masuk Aplikasi'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RoleGate;