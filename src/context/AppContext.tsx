import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface AppContextType {
  siswa: any[];
  users: any[];
  profiles: any[];
  masterPelanggaran: any[];
  bkRecords: any[];
  studentScores: any[];
  loading: boolean;
  currentUser: any | null; // Ditambahkan untuk menampung user login saat ini

  // Fungsi Otentikasi & Sesi
  login: (username: string, password: string) => Promise<any>;
  logout: () => void;
  setCurrentUser: (user: any) => void;
  
  // Fungsi Aksi Modul (CRUD Supabase)
  fetchSiswa: () => Promise<void>;
  addSiswa: (data: any) => Promise<void>;
  updateSiswa: (id: string, data: any) => Promise<void>;
  deleteSiswa: (id: string) => Promise<void>;
  
  addBkRecord: (record: any) => Promise<void>;
  updateBkStatus: (id: string, status: string) => Promise<void>;
  addSesiLanjut: (sesiData: any) => Promise<void>;
  
  inputNilai: (nilaiData: any) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [siswa, setSiswa] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [masterPelanggaran, setMasterPelanggaran] = useState<any[]>([]);
  const [bkRecords, setBkRecords] = useState<any[]>([]);
  const [studentScores, setStudentScores] = useState<any[]>([]);
  const [currentUser, setCurrentUserState] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Fungsi untuk melacak user login lokal
  const setCurrentUser = (user: any) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem('sigap_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('sigap_user');
    }
  };

  // 1. Fungsi Fetching Data dari Supabase
  const fetchSiswa = async () => {
    const { data } = await supabase.from('siswa').select('*');
    if (data) setSiswa(data);
  };

  const refreshAllData = async () => {
    setLoading(true);
    await fetchSiswa();
    
    const { data: userData } = await supabase.from('user').select('*');
    const { data: profileData } = await supabase.from('profiles').select('*');
    const { data: mpData } = await supabase.from('master-pelanggarans').select('*');
    const { data: bkData } = await supabase.from('bk_records').select('*');
    const { data: scoreData } = await supabase.from('student_score').select('*');

    if (userData) setUsers(userData);
    if (profileData) setProfiles(profileData);
    if (mpData) setMasterPelanggaran(mpData);
    if (bkData) setBkRecords(bkData);
    if (scoreData) setStudentScores(scoreData);
    
    // Cek session lokal saat refresh halaman
    const savedUser = localStorage.getItem('sigap_user');
    if (savedUser) {
      setCurrentUserState(JSON.parse(savedUser));
    }

    setLoading(false);
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // 2. Logika Otentikasi Halaman Login ke Supabase
  const login = async (username: string, password: string) => {
    // Mencari ketersediaan akun di tabel 'user' Supabase sesuai input
    const { data: userRow, error } = await supabase
      .from('user')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !userRow) {
      throw new Error('Username atau Password salah!');
    }

    // Ambil profil pelengkap jika ada
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userRow.id)
      .single();

    const fullUserData = { ...userRow, profile: profileRow || null };
    setCurrentUser(fullUserData);
    return fullUserData;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  // 3. Aksi Modul Siswa (Admin Panel)
  const addSiswa = async (dataSiswa: any) => {
    const { error } = await supabase.from('siswa').insert([dataSiswa]);
    if (error) throw error;
    await fetchSiswa();
  };

  const updateSiswa = async (id: string, dataUpdated: any) => {
    const { error } = await supabase.from('siswa').update(dataUpdated).eq('id', id);
    if (error) throw error;
    await fetchSiswa();
  };

  const deleteSiswa = async (id: string) => {
    const { error } = await supabase.from('siswa').delete().eq('id', id);
    if (error) throw error;
    await fetchSiswa();
  };

  // 4. Aksi Modul Bimbingan Konseling (BK Panel & PKS Kesiswaan)
  const addBkRecord = async (record: any) => {
    const { error } = await supabase.from('bk_records').insert([record]);
    if (error) throw error;
    
    const { data } = await supabase.from('bk_records').select('*');
    if (data) setBkRecords(data);
  };

  const updateBkStatus = async (id: string, statusBaru: string) => {
    const { error } = await supabase.from('bk_records').update({ status: statusBaru }).eq('id', id);
    if (error) throw error;
    
    const { data } = await supabase.from('bk_records').select('*');
    if (data) setBkRecords(data);
  };

  const addSesiLanjut = async (sesiData: any) => {
    const { error } = await supabase.from('bk_sesi_lanjut').insert([sesiData]);
    if (error) throw error;
  };

  // 5. Aksi Modul Penilaian (Guru Mapel Panel / Wali Kelas)
  const inputNilai = async (nilaiData: any) => {
    const { error } = await supabase.from('student_score').insert([nilaiData]);
    if (error) throw error;

    const { data } = await supabase.from('student_score').select('*');
    if (data) setStudentScores(data);
  };

  return (
    <AppContext.Provider
      value={{
        siswa,
        users,
        profiles,
        masterPelanggaran,
        bkRecords,
        studentScores,
        loading,
        currentUser,
        login,
        logout,
        setCurrentUser,
        fetchSiswa,
        addSiswa,
        updateSiswa,
        deleteSiswa,
        addBkRecord,
        updateBkStatus,
        addSesiLanjut,
        inputNilai,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
