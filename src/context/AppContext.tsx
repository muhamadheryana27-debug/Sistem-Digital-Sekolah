import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface AppContextType {
  siswa: any[];
  users: any[];
  profiles: any[];
  loading: boolean;
  fetchSiswa: () => Promise<void>;
  addBkRecord: (record: any) => Promise<void>;
  inputNilai: (nilaiData: any) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [siswa, setSiswa] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSiswa = async () => {
    const { data, error } = await supabase.from('siswa').select('*');
    if (!error && data) setSiswa(data);
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await fetchSiswa();
      const { data: userData } = await supabase.from('user').select('*');
      const { data: profileData } = await supabase.from('profiles').select('*');
      if (userData) setUsers(userData);
      if (profileData) setProfiles(profileData);
      setLoading(false);
    };
    initData();
  }, []);

  // Fungsi global untuk BK
  const addBkRecord = async (record: any) => {
    const { error } = await supabase.from('bk_records').insert([record]);
    if (error) throw error;
  };

  // Fungsi global untuk Input Nilai Guru Mapel
  const inputNilai = async (nilaiData: any) => {
    const { error } = await supabase.from('student_score').insert([nilaiData]);
    if (error) throw error;
  };

  return (
    <AppContext.Provider value={{ siswa, users, profiles, loading, fetchSiswa, addBkRecord, inputNilai }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
