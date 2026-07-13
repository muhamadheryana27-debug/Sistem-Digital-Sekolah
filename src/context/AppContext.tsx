useEffect(() => {
    const fetchSupabaseData = async () => {
      setIsLoading(true);
      try {
        // Mengambil data profiles sekaligus melakukan JOIN ke tabel users berdasarkan user_id
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
            users:user_id (
              id,
              username,
              role
            )
          `),
          supabase.from("siswa").select("*"),
          supabase.from("teaching_journals").select("*"),
          supabase.from("bk_records").select("*"), 
          supabase.from("extracurricular_scores").select("*"), 
          supabase.from("master-pelanggarans").select("*"),
        ]);

        if (resProfiles)
          setGurus(
            resProfiles.map((p: any) => {
              const sRoles: SubRoleType[] = ["guru_mapel"];
              
              if (p.is_wali_kelas || p.kelas_wali) sRoles.push("wali_kelas");
              if (p.is_guru_piket) sRoles.push("guru_piket");
              if (p.nama_ekstrakurikuler) sRoles.push("pembina_ekskul");
              
              // Mengambil data role dari table users hasil relasi join
              const dbRole = p.users?.role || p.role;
              if (p.nama_lengkap?.toLowerCase().includes("bk") || dbRole === "guru_bk")
                sRoles.push("guru_bk");

              const determinedRole = dbRole === "admin" ? "admin" : (dbRole === "guru_bk" ? "guru_bk" : "guru");

              return {
                id: p.user_id ? String(p.user_id) : String(p.id), 
                nip: p.users?.username || (p.user_id ? String(p.user_id) : ""), // Menampilkan username/NIP dari tabel users
                name: p.nama_lengkap || p.users?.username || "Tanpa Nama",
                role: determinedRole, 
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

        if (resJournals)
          setJurnalMengajar(
            resJournals.map((j) => ({
              id: String(j.id),
              guruId: String(j.user_id || ""),
              guruName: j.mata_ajaran || j.mata_pelajaran || "", 
              tanggal: j.tanggal || j.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
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
              tanggal: k.created_at ? k.created_at.split("T")[0] : (k.crated_at ? k.crated_at.split("T")[0] : ""),
              tipeKasus: (k.kategori_kasus as any) || "Pelanggaran",
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
