import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface AppContextType {
  siswa: any[];
  gurus: any[];
  violations: any[];
  masterPelanggarans: any[];
  loading: boolean;
  refreshData: () => Promise<void>;
  addViolation: (violation: any) => Promise<void>;
  updateViolationStatus: (id: string, status: string, approvedBy: string) => Promise<void>;
  addMasterPelanggaran: (data: any) => Promise<void>;
  bulkInsertSiswa: (data: any[]) => Promise<void>;
  bulkInsertPelanggaran: (data: any[]) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [siswa, setSiswa] = useState<any[]>([]);
  const [gurus, setGurus] = useState<any[]>([]);
  const [violations, setViolations] = useState<any[]>([]);
  const [masterPelanggarans, setMasterPelanggarans] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshData = async () => {
    try {
      setLoading(true);
      
      // Ambil data siswa
      const { data: dataSiswa } = await supabase.from('students').select('*').order('nama_siswa', { ascending: true });
      if (dataSiswa) setSiswa(dataSiswa);

      // Ambil data guru beserta relasi user account-nya
      const { data: dataGuru } = await supabase.from('profiles').select(`
        id, user_id, nama_lengkap, mata_pelajaran, mapel, is_wali_kelas, kelas_wali, is_guru_piket, nama_ekstrakurikuler,
        users ( username, role )
      `);
      if (dataGuru) {
        setGurus(dataGuru.map((g: any) => ({
          ...g,
          username: g.users?.username,
          role: g.users?.role
        })));
      }

      // Ambil master regulasi tata tertib
      const { data: dataMaster } = await supabase.from('master_pelanggaran').select('*').order('bobot', { ascending: true });
      if (dataMaster) setMasterPelanggarans(dataMaster);

      // Ambil log kasus pelanggaran aktif
      const { data: dataViolations } = await supabase.from('violations').select('*').order('created_at', { ascending: false });
      if (dataViolations) setViolations(dataViolations);

    } catch (error) {
      console.error('Gagal sinkronisasi data Supabase:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const addViolation = async (violation: any) => {
    const { error } = await supabase.from('violations').insert([violation]);
    if (error) throw error;
    await refreshData();
  };

  const updateViolationStatus = async (id: string, status: string, approvedBy: string) => {
    const { error } = await supabase
      .from('violations')
      .update({ status, approved_by: approvedBy, updated_at: new Date() })
      .eq('id', id);
    if (error) throw error;
    await refreshData();
  };

  const addMasterPelanggaran = async (data: any) => {
    const { error } = await supabase.from('master_pelanggaran').insert([data]);
    if (error) throw error;
    await refreshData();
  };

  const bulkInsertSiswa = async (dataArray: any[]) => {
    const { error } = await supabase.from('students').insert(dataArray);
    if (error) throw error;
    await refreshData();
  };

  const bulkInsertPelanggaran = async (dataArray: any[]) => {
    const { error } = await supabase.from('master_pelanggaran').insert(dataArray);
    if (error) throw error;
    await refreshData();
  };

  return (
    <AppContext.Provider value={{
      siswa, gurus, violations, masterPelanggarans, loading,
      refreshData, addViolation, updateViolationStatus, addMasterPelanggaran,
      bulkInsertSiswa, bulkInsertPelanggaran
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp harus dibungkus dalam AppProvider');
  return context;
};
