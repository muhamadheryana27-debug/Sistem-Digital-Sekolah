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
  jenis_kasus: string;
  bobot: number;
}

interface AppContextType {
  currentUser: { id: string; name: string; role: string } | null;
  setCurrentUser: (
    user: { id: string; name: string; role: string } | null,
  ) => void;
  gurus: Guru[];
  siswa: Siswa[];
  jurnalMengajar: JurnalMengajar[];
  kasusBK: KasusBK[];
  nilaiEkskul: NilaiEkskul[];
  masterPelanggarans: MasterPelanggaran[];
  isLoading: boolean;

  // Actions
  addJurnalMengajar: (jurnal: Omit<JurnalMengajar, "id">) => Promise<void>;
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
  const [gurus, setGurus] = useState<Guru[]>([]);
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [jurnalMengajar, setJurnalMengajar] = useState<JurnalMengajar[]>([]);
  const [kasusBK, setKasusBK] = useState<KasusBK[]>([]);
  const [nilaiEkskul, setNilaiEkskul] = useState<NilaiEkskul[]>([]);
  const [masterPelanggarans, setMasterPelanggarans] = useState<
    MasterPelanggaran[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
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
          supabase.from("profiles").select("*"),
          supabase.from("students").select("*"),
          supabase.from("teaching_journals").select("*"),
          supabase.from("bk_records").select("*"),
          supabase.from("extracurricular_scores").select("*"),
          supabase.from("master_pelanggarans").select("*"),
        ]);

        if (resProfiles)
          setGurus(
            resProfiles.map((p) => {
              const sRoles: SubRoleType[] = ["guru_mapel"];
              if (p.is_wali_kelas) sRoles.push("wali_kelas");
              if (p.is_guru_piket) sRoles.push("guru_piket");
              if (p.nama_ekstrakurikuler) sRoles.push("pembina_ekskul");
              if (p.nama_lengkap?.toLowerCase().includes("bk"))
                sRoles.push("guru_bk");

              return {
                id: String(p.id),
                nip: p.user_id ? String(p.user_id) : "",
                name: p.nama_lengkap || "",
                role: p.is_wali_kelas ? "guru" : "admin",
                subRoles: sRoles,
                kelasWali: p.kelas_wali || null,
                namaEkskul: p.nama_ekstrakurikuler || null,
                piketDays: [],
              };
            }),
          );

        if (resStudents)
          setSiswa(
            resStudents.map((s) => ({
              id: String(s.id),
              nisn: s.nisn || "",
              name: s.nama_siswa || "",
              kelas: s.kelas || "",
              statusAbsen: "Hadir",
              ekskul: s.kelas_wali || null,
            })),
          );
        // Tambahkan ke AppContext.tsx
        const addJurnalLengkap = async (
          jurnal: Omit<JurnalMengajar, "id">,
          absensi: any[],
        ) => {
          // 1. Simpan Jurnal Utama
          const { data: jurnalData, error: jurnalError } = await supabase
            .from("teaching_journals")
            .insert([
              {
                user_id: Number(jurnal.guruId),
                kelas: jurnal.kelas,
                mata_pelajaran: jurnal.guruName,
                jam_ke: jurnal.jamKe,
                materi_pembelajaran: jurnal.materi,
                catatan_kelas: jurnal.aktivitas,
              },
            ])
            .select()
            .single();

          if (jurnalError) throw jurnalError;

          // 2. Simpan Absensi (Relasi ke jurnalData.id)
          const absensiPayload = absensi.map((a) => ({
            journal_id: jurnalData.id,
            student_id: a.siswaId,
            status: a.status,
          }));

          const { error: absensiError } = await supabase
            .from("student_attendance")
            .insert(absensiPayload);
          if (absensiError) throw absensiError;
        };

        // ==========================================
        // SINKRONISASI COCOK DENGAN DUA KOLOM MAPEL & MATERI
        // ==========================================
        if (resJournals)
          setJurnalMengajar(
            resJournals.map((j) => ({
              id: String(j.id),
              guruId: String(j.user_id || ""),
              guruName: j.mata_pelajaran || "", // Kita simpan nama mata pelajaran di properti guruName pembantu
              tanggal:
                j.tanggal ||
                j.created_at?.split("T")[0] ||
                new Date().toISOString().split("T")[0],
              hari: "",
              kelas: j.kelas || "",
              jamKe: j.jam_ke || "",
              materi: j.materi_pembelajaran || "", // Mengambil materi pokok asli
              aktivitas: j.catatan_kelas || "", // Mengambil catatan kelas asli
              absensiSiswa: [],
            })),
          );

        if (resBkRecords)
          setKasusBK(
            resBkRecords.map((k) => ({
              id: String(k.id),
              siswaId: String(k.student_id || ""),
              namaSiswa: String(k.student_id || ""),
              kelas: k.kelas || "",
              tanggal: k.created_at ? k.created_at.split("T")[0] : "",
              tipeKasus: (k.kategori_kasus as any) || "Ringan",
              deskripsi: k.detail_kasus || "",
              solusi: k.tindakan_penanganan || "",
              penangananOleh: "",
            })),
          );

        if (resEkskulScores)
          setNilaiEkskul(
            resEkskulScores.map((n) => ({
              id: String(n.id),
              siswaId: String(n.student_id || ""),
              namaSiswa: "",
              kelas: "",
              namaEkskul: n.nama_ekskul || "",
              predikat: (n.nilai_kualitatif as any) || "B",
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

    fetchSupabaseData();
  }, []);

  const addJurnalMengajar = async (jurnal: Omit<JurnalMengajar, "id">) => {
    const { data, error } = await supabase
      .from("teaching_journals")
      .insert([
        {
          user_id: Number(jurnal.guruId) || null,
          kelas: jurnal.kelas,
          mata_pelajaran: jurnal.guruName, // Kolom mata_pelajaran database
          jam_ke: jurnal.jamKe,
          materi_pembelajaran: jurnal.materi, // Kolom materi_pelajaran database
          catatan_kelas: jurnal.aktivitas, // Kolom catatan_kelas database
        },
      ])
      .select()
      .single();
    if (error) throw new Error(error.message);
    setJurnalMengajar((prev) => [...prev, { ...jurnal, id: String(data.id) }]);
  };

  // ... (Aksi Bulk Insert dan BK lainnya tetap sama)
  const addKasusBK = async (kasus: Omit<KasusBK, "id">) => {
    const { data, error } = await supabase
      .from("bk_records")
      .insert([
        {
          student_id: Number(kasus.siswaId),
          kelas: kasus.kelas,
          kategori_kasus: kasus.tipeKasus,
          detail_kasus: kasus.deskripsi,
          tindakan_penanganan: kasus.solusi,
          status: "Selesai",
        },
      ])
      .select()
      .single();
    if (error) throw new Error(error.message);
    setKasusBK((prev) => [...prev, { ...kasus, id: String(data.id) }]);
  };

  const addNilaiEkskul = async (nilai: Omit<NilaiEkskul, "id">) => {
    const { data, error } = await supabase
      .from("extracurricular_scores")
      .insert([
        {
          student_id: Number(nilai.siswaId),
          nama_ekskul: nilai.namaEkskul,
          nilai_kualitatif: nilai.predikat,
          catatan_pembinaan: nilai.catatan,
        },
      ])
      .select()
      .single();
    if (error) throw new Error(error.message);
    setNilaiEkskul((prev) => [...prev, { ...nilai, id: String(data.id) }]);
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
      kelas: s.kelas,
    }));
    const { error } = await supabase.from("students").insert(payload);
    if (error) throw new Error(error.message);
  };

  const bulkInsertGurus = async (guruList: Omit<Guru, "id">[]) => {
    const payload = guruList.map((g) => ({
      nama_lengkap: g.name,
      is_wali_kelas: g.subRoles.includes("wali_kelas"),
      kelas_wali: g.kelasWali,
      is_guru_piket: g.subRoles.includes("guru_piket"),
      nama_ekstrakurikuler: g.namaEkskul,
    }));
    const { error } = await supabase.from("profiles").insert(payload);
    if (error) throw new Error(error.message);
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
