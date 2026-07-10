export type RoleType = 'admin' | 'guru' | 'guru_bk' | 'guru_mapel';

export type SubRoleType = 'guru_mapel' | 'wali_kelas' | 'guru_piket' | 'pembina_ekskul' | 'guru_bk';

export interface User {
  id: string;
  name: string;
  role: RoleType;
}

export interface Guru {
  id: string;
  nip: string;
  name: string;
  role: RoleType;
  subRoles: SubRoleType[];
  kelasWali: string | null;
  namaEkskul: string | null;
  piketDays: string[];
}

export interface Siswa {
  id: string;
  nisn: string;
  name: string;
  kelas: string;
  statusAbsen: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa';
  ekskul: string | null;
}

export interface JurnalMengajar {
  id: string;
  guruId: string;
  guruName: string;
  tanggal: string;
  hari?: string;
  kelas: string;
  jamKe: string;
  materi: string;
  aktivitas: string;
  absensiSiswa?: any[];
}

export interface KasusBK {
  id: string;
  siswaId: string;
  namaSiswa: string;
  kelas: string;
  tanggal: string;
  tipeKasus: 'Pelanggaran' | 'Prestasi' | 'Konseling';
  deskripsi: string;
  solusi: string;
  penangananOleh: string;
}

export interface NilaiEkskul {
  id: string;
  siswaId: string;
  namaSiswa: string;
  kelas: string;
  namaEkskul: string;
  predikat: 'A' | 'B' | 'C' | 'D';
  catatan: string;
}

// FIX: Menambahkan Type & Interface yang hilang dan dicari oleh src/data.ts
export interface JurnalPiketHarian {
  id: string;
  guruId: string;
  guruName: string;
  tanggal: string;
  hari: string;
  catatanKejadian: string;
  jumlahSiswaTerlambat: number;
  statusKbm: string;
}

export interface PiketScheduleConfig {
  id: string;
  guruId: string;
  guruName: string;
  hari: string;
}

export interface JurnalEkskul {
  id: string;
  namaEkskul: string;
  pembinaName: string;
  tanggal: string;
  aktivitasLatihan: string;
  jumlahHadir: number;
}

export interface AturanPoin {
  id: string;
  kategori: 'Ringan' | 'Sedang' | 'Berat' | 'Sangat Berat';
  jenisKasus: string;
  bobotPoin: number;
}

export interface LogPoinSiswa {
  id: string;
  siswaId: string;
  namaSiswa: string;
  kelas: string;
  tanggal: string;
  kasusId: string;
  namaKasus: string;
  poinMasuk: number;
}

export interface IzinGuru {
  id: string;
  guruId: string;
  guruName: string;
  tanggal: string;
  alasanIzin: string;
  tugasDiberikan: string;
  statusPersetujuan: 'Pending' | 'Disetujui' | 'Ditolak';
}