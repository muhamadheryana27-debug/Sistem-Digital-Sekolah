import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import MainDashboard from './components/MainDashboard';
import RoleGate from './components/RoleGate';

const MainAppContent: React.FC = () => {
  const { currentUser, isLoading } = useApp();

  // Menampilkan indikator loading saat sinkronisasi awal dengan Supabase
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500 animate-pulse">
          Menghubungkan ke Supabase...
        </p>
      </div>
    );
  }

  // Jika belum ada pengguna yang login, arahkan ke Role Gate (Halaman Pilihan Login)
  if (!currentUser) {
    return <RoleGate />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">
        <MainDashboard />
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
};

export default App;