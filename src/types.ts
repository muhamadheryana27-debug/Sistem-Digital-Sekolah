export type RoleType = 'admin' | 'guru' | 'guru_bk'; // Ditambahkan 'guru_bk' agar aman saat pemetaan state

export type SubRoleType = 'wali_kelas' | 'pembina_ekskul' | 'guru_piket' | 'guru_bk' | 'guru_mapel' | 'pks_kesiswaan';

export interface Guru {
  id: string;
  nip: string;
  name: string;
  role: RoleType;
  subRoles: SubRoleType[];
  kelasWali: string | null;
  namaEkskul: string | null;
  piketDays: string[];
  email?: string;
}

export interface Siswa {
  id: string;
  nisn: string;
  name: string;
  kelas: string;
  statusAbsen: 'Hadir' | 'Sakit' | 'Izin' | 'Alfa';
  catatanAbsen?: string;
  ekskul: string | null;
}

export interface JurnalMengajar {
  id: string;
  guruId: string;
  guruName: string;
  tanggal: string;
  hari: string;
  kelas: string;
  jamKe: string;
  materi: string;
  aktivitas: string;
  absensiSiswa: {
    siswaId: string;
    namaSiswa: string;
    status: 'Sakit' | 'Izin' | 'Alfa';
    catatan?: string;
  }[];
}

export interface KasusBK {
  id: string;
  siswaId: string;
  namaSiswa: string;
  kelas: string;
  tanggal: string;
  tipeKasus: 'Kerawanan' | 'Pelanggaran' | 'Bimbingan';
  deskripsi: string;
  solusi: string;
  penangananOleh: string;
  tindakLanjut?: { tanggal: string; perkembangan: string; petugas: string; }[];
}

export interface NilaiEkskul {
  id: string;
  siswaId: string;
  namaSiswa: string;
  kelas: string;
  namaEkskul: string;
  predikat: 'A' | 'B' | 'C';
  catatan: string;
}