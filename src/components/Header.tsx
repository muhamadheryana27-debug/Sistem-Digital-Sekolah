import React from 'react';
import { useApp } from '../context/AppContext';
import { LogOut, User, Shield } from 'lucide-react';

const Header: React.FC = () => {
  const { currentUser, setCurrentUser } = useApp();

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Format label peran/role untuk tampilan UI
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'guru':
        return 'Guru / Staf';
      default:
        return role;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Identitas Aplikasi */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-tr from-sky-600 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-sky-100">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none">
              SIDIAG
            </h1>
            <p className="text-[10px] text-slate-400 font-medium mt-1">
              Sistem Digital Jurnal & Agenda Sekolah
            </p>
          </div>
        </div>

        {/* Informasi Akun & Aksi */}
        {currentUser && (
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-800 leading-none">
                {currentUser.name}
              </p>
              <span className="inline-block bg-sky-50 text-sky-700 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 border border-sky-100">
                {getRoleLabel(currentUser.role)}
              </span>
            </div>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
              <User className="w-4 h-4" />
            </div>

            <div className="h-6 w-[1px] bg-slate-200"></div>

            {/* Tombol Log Out */}
            <button
              onClick={handleLogout}
              title="Keluar dari Aplikasi"
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer group"
            >
              <LogOut className="w-4 h-4 group-hover:scale-105 transition-transform" />
            </button>
          </div>
        )}

      </div>
    </header>
  );
};

export default Header;