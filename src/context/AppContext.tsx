import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Guru,
  Siswa,
  JurnalMengajar,
  KasusBK,
  NilaiEkskul,
  SubRoleType,
} from "../types";
import { supabase } from "../lib/supabaseClient";

export interface MasterPelanggaran {
  id: string;
  kategori: string;
  jenis_cases?: string;
  jenis_kasus: string;
  bobot: number;
}

interface AppContextType {
  currentUser: { id: string; name: string; role: string } | null;
  setCurrentUser: (
    user: { id: string; name: string; role: string } | null,
  ) => void;
  gurus: Guru[];
  siswa: Siswa[]; // State frontend tetap menggunakan nama siswa agar tidak merusak komponen UI lain
  jurnalMengajar: JurnalMengajar[];
  kasusBK: KasusBK[];
  nilaiEkskul: NilaiEkskul[];
  masterPelanggarans: MasterPelanggaran[];
  isLoading: boolean;

  // Actions
  addJurnalMengajar: (jurnal: Omit<JurnalMengajar, "id">, absensi?: any[]) => Promise<void>;
  addKasusBK: (kasus: Omit<KasusBK, "id">) => Promise<void>;
  addNilaiEkskul: (nilai: Omit<NilaiEkskul, "id">) => Promise<void>;
  addMasterPelanggaran: (
    pelanggaran: Omit<MasterPelanggaran, "id">,
  ) => Promise<void>;
  bulkInsertSiswa: (siswaList: Omit<Siswa, "id">[]) => Promise<void>;
  bulkInsertGurus: (guruList: Omit<Guru, "id">[]) => Promise<void>;
  bulkInsertPelanggaran: (
    list: Omit<MasterPelanggaran, "id">[],
  ) => Promise<void>;
  updateNilaiSiswa: (siswaId: string, mapel: string, dataNilai: any) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    role: string;
  } | null>(null);
  const [gurus, setGurus] = useState<any[]>([]);
  const [siswa, setSiswa] = useState<any[]>([]);
  const [jurnalMengajar, setJurnalMengajar] = useState<JurnalMengajar[]>([]);
  const [kasusBK, setKasusBK] = useState<KasusBK[]>([]);
  const [nilaiEkskul, setNilaiEkskul] = useState<NilaiEkskul[]>([]);
  const [masterPelanggarans, setMasterPelanggarans] = useState<
    MasterPelanggaran[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSupabaseData = async () => {
    setIsLoading(true);
    try {
      const [
        { data: resProfiles },
        { data: resStudents },
        { data: resJournals },
        { data: resBkRecords },
        { data: resEkskulScores },
        { data: resMasterPelanggaran },
      ] = await Promise.all([
        supabase.from("profiles").select(`
          *,
          users (
            id,
            username,
            role
          )
        `),
        supabase.from("students").select("*"), // DIUBAH: Menggunakan tabel 'students' sesuai database Anda
        supabase.from("teaching_journals").select("*"),
        supabase.from("bk_records").select("*"), 
        supabase.from("extracurricular_scores").select("*"), 
        supabase.from("master_pelanggarans").select("*"), // Sesuai nama di dump SQL Anda
      ]);

      if (resProfiles)
        setGurus(
          resProfiles.map((p: any) => {
            const sRoles: SubRoleType[] = ["guru_mapel"];
            
            if (p.is_wali_kelas || p.kelas_wali) sRoles.push("wali_kelas");
            if (p.is_guru_piket) sRoles.push("guru_piket");
            if (p.nama_ekstrakurikuler) sRoles.push("pembina_ekskul");
            
            const dbRole = p.users?.role || p.role;
            if (p.nama_lengkap?.toLowerCase().includes("bk") || dbRole === "guru_bk")
              sRoles.push("guru_bk");

            const determinedRole = dbRole === "admin" ? "admin" : (dbRole === "guru_bk" ? "guru_bk" : "guru");

            return {
              id: String(p.id), 
              user_id: p.user_id ? String(p.user_id) : String(p.id),
              nip: p.users?.username || p.username || "",
              username: p.users?.username || p.username || "",
              name: p.nama_lengkap || p.users?.username || "Tanpa Nama",
              role: determinedRole, 
              subRoles: sRoles,
              kelasWali: p.kelas_wali || null,
              namaEkskul: p.nama_ekstrakurikuler || null,
              mata_pelajaran: p.mapel || p.mata_pelajaran || "Umum", // Mengambil kolom mapel dari profile Anda
              piketDays: p.piket_days || [],
            };
          }),
        );

      if (resStudents)
        setSiswa(
          resStudents.map((s) => {
            // SINKRONISASI FORMAT KELAS:
            // Mengubah spasi "VIII A" dari database menjadi strip "VIII-A" agar dibaca oleh komponen UI Frontend
            let formatKelas = s.kelas || "";
            if (formatKelas && !formatKelas.includes("-")) {
              formatKelas = formatKelas.trim().replace(/\s+/g, "-");
            }

            return {
              id: String(s.id),
              nisn: s.nisn || "",
              name: s.nama_siswa || "",
              nama_siswa: s.nama_siswa || "",
              jenis_kelamin: s.jenis_kelamin || "",
              kelas: formatKelas, // Menggunakan format seragam dengan tanda hubung (-)
              statusAbsen: "Hadir",
              ekskul: s.kelas_wali || null,
            };
          }),
        );

      if (resJournals)
        setJurnalMengajar(
          resJournals.map((j) => ({
            id: String(j.id),
            guruId: String(j.user_id || ""),
            guruName: j.mata_pelajaran || "", 
            tanggal: j.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
            hari: "",
            kelas: j.kelas || "",
            jamKe: j.jam_ke || "",
            materi: j.materi_pembelajaran || "", 
            aktivitas: j.catatan_kelas || "", 
            absensiSiswa: [],
          })),
        );

      if (resBkRecords)
        setKasusBK(
          resBkRecords.map((k: any) => ({
            id: String(k.id),
            siswaId: String(k.student_id || ""),
            namaSiswa: k.nama_siswa || `Siswa ID ${k.student_id}`,
            kelas: k.kelas || "",
            tanggal: k.created_at ? k.created_at.split("T")[0] : "",
            tipeKasus: k.kategori_kasus || "Pelanggaran",
            deskripsi: k.detail_kasus || "",
            solusi: k.tindakan_penanganan || "",
            penangananOleh: "Guru BK",
          })),
        );

      if (resEkskulScores)
        setNilaiEkskul(
          resEkskulScores.map((n: any) => ({
            id: String(n.id),
            siswaId: String(n.student_id || ""),
            namaSiswa: n.nama_siswa || "",
            kelas: n.kelas || "",
            namaEkskul: n.nama_ekskul || "",
            predikat: n.nilai_kualitatif || "Baik",
            catatan: n.catatan_pembinaan || "",
          })),
        );

      if (resMasterPelanggaran)
        setMasterPelanggarans(
          resMasterPelanggaran.map((m) => ({
            id: String(m.id),
            kategori: m.kategori || "",
            jenis_kasus: m.jenis_kasus || "",
            bobot: Number(m.bobot || 0),
          })),
        );
    } catch (err) {
      console.error("Gagal melakukan sinkronisasi data Supabase:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSupabaseData();
  }, []);

  const addJurnalMengajar = async (jurnal: Omit<JurnalMengajar, "id">, absensi: any[] = []) => {
    const { data: jurnalData, error: jurnalError } = await supabase
      .from("teaching_journals")
      .insert([
        {
          user_id: Number(jurnal.guruId) || null,
          kelas: jurnal.kelas,
          mata_pelajaran: jurnal.guruName, 
          jam_ke: jurnal.jamKe,
          materi_pembelajaran: jurnal.materi, 
          catatan_kelas: jurnal.aktivitas, 
        },
      ])
      .select()
      .single();

    if (jurnalError) throw new Error(jurnalError.message);

    setJurnalMengajar((prev) => [
      ...prev, 
      { 
        ...jurnal, 
        id: String(jurnalData.id),
        absensiSiswa: absensi 
      }
    ]);
  };

  const addKasusBK = async (kasus: Omit<KasusBK, "id">) => {
    const { data, error } = await supabase
      .from("bk_records")
      .insert([
        {
          user_id: Number(currentUser?.id) || 1,
          student_id: Number(kasus.siswaId),
          kelas: kasus.kelas.replace("-", " "), // Kembalikan ke format spasi untuk DB jika perlu
          kategori_kasus: kasus.tipeKasus,
          detail_kasus: kasus.deskripsi,
          tindakan_penanganan: kasus.solusi,
          status: "Sedang Dibina",
        },
      ])
      .select()
      .single();
    if (error) throw new Error(error.message);
    
    const targetSiswa = siswa.find((s) => s.id === kasus.siswaId);
    setKasusBK((prev) => [
      ...prev, 
      { 
        ...kasus, 
        id: String(data.id),
        namaSiswa: targetSiswa ? targetSiswa.name : kasus.namaSiswa 
      }
    ]);
  };

  const addNilaiEkskul = async (nilai: Omit<NilaiEkskul, "id">) => {
    const { data, error } = await supabase
      .from("extracurricular_scores")
      .insert([
        {
          user_id: Number(currentUser?.id) || 1,
          student_id: Number(nilai.siswaId),
          nama_ekskul: nilai.namaEkskul,
          nilai_kualitatif: nilai.predikat,
          catatan_pembinaan: nilai.catatan,
        },
      ])
      .select()
      .single();
    if (error) throw new Error(error.message);

    const targetSiswa = siswa.find((s) => s.id === nilai.siswaId);
    setNilaiEkskul((prev) => [
      ...prev, 
      { 
        ...nilai, 
        id: String(data.id),
        namaSiswa: targetSiswa ? targetSiswa.name : nilai.namaSiswa,
        kelas: targetSiswa ? targetSiswa.kelas : nilai.kelas 
      }
    ]);
  };

  const addMasterPelanggaran = async (
    pelanggaran: Omit<MasterPelanggaran, "id">,
  ) => {
    const { data, error } = await supabase
      .from("master_pelanggarans")
      .insert([
        {
          kategori: pelanggaran.kategori,
          jenis_kasus: pelanggaran.jenis_kasus,
          bobot: Number(pelanggaran.bobot),
        },
      ])
      .select()
      .single();
    if (error) throw new Error(error.message);
    setMasterPelanggarans((prev) => [
      ...prev,
      { ...pelanggaran, id: String(data.id) },
    ]);
  };

  const bulkInsertSiswa = async (siswaList: Omit<Siswa, "id">[]) => {
    const payload = siswaList.map((s) => ({
      nisn: s.nisn,
      nama_siswa: s.name,
      jenis_kelamin: s.jenis_kelamin,
      kelas: s.kelas.replace("-", " "), // Simpan format spasi "VIII A" ke database
    }));
    const { error } = await supabase
      .from("students") // DIUBAH: Target tabel students
      .upsert(payload, { onConflict: "nisn" });
    if (error) throw new Error(error.message);
    await fetchSupabaseData();
  };

  const bulkInsertGurus = async (guruList: Omit<Guru, "id">[]) => {
    const payload = guruList.map((g) => ({
      nama_lengkap: g.name,
      is_wali_kelas: g.subRoles.includes("wali_kelas"),
      kelas_wali: g.kelasWali,
      is_guru_piket: g.subRoles.includes("guru_piket"),
      nama_ekstrakurikuler: g.namaEkskul,
      mapel: g.mata_pelajaran,
    }));
    const { error } = await supabase.from("profiles").insert(payload);
    if (error) throw new Error(error.message);
    await fetchSupabaseData();
  };

  const bulkInsertPelanggaran = async (
    list: Omit<MasterPelanggaran, "id">[],
  ) => {
    const payload = list.map((l) => ({
      kategori: l.kategori,
      jenis_kasus: l.jenis_kasus,
      bobot: Number(l.bobot),
    }));
    const { error } = await supabase
      .from("master_pelanggarans")
      .insert(payload);
    if (error) throw new Error(error.message);
    await fetchSupabaseData();
  };

  const updateNilaiSiswa = async (siswaId: string, mapel: string, dataNilai: any) => {
    try {
      const payload = {
        user_id: Number(currentUser?.id) || 1,
        student_id: Number(siswaId),
        kelas: (dataNilai.kelas || "").replace("-", " "),
        mapel: mapel,
        jenis_penilaian: dataNilai.jenis_penilaian || "Harian",
        nilai: Number(dataNilai.nilai || 0),
      };

      const { error } = await supabase
        .from("student_scores") // DIUBAH: Sesuai tabel student_scores Anda
        .insert([payload]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Gagal memperbarui nilai mata pelajaran:", error);
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        gurus,
        siswa,
        jurnalMengajar,
        kasusBK,
        nilaiEkskul,
        masterPelanggarans,
        isLoading,
        addJurnalMengajar,
        addKasusBK,
        addNilaiEkskul,
        addMasterPelanggaran,
        bulkInsertSiswa,
        bulkInsertGurus,
        bulkInsertPelanggaran,
        updateNilaiSiswa,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp harus digunakan di dalam AppProvider");
  return context;
};
