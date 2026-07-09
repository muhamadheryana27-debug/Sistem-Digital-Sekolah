import { Guru, Siswa, JadwalKBM, JurnalMengajar, KasusBK, NilaiMapel, NilaiEkskul, JurnalPiketHarian, PiketScheduleConfig, JurnalEkskul, AturanPoin, LogPoinSiswa, IzinGuru } from './types';

// Pre-seeded Teachers
export const DEFAULT_GURU: Guru[] = [
  {
    id: 'g-admin',
    nip: '197005121995031002',
    name: 'Drs. H. Suherman, M.Pd.',
    role: 'admin',
    subRoles: ['guru_mapel'],
    kelasWali: null,
    namaEkskul: null,
    piketDays: []
  },
  {
    id: 'g-sri',
    nip: '198204152008012015',
    name: 'Sri Mulyani, S.Pd.',
    role: 'guru',
    subRoles: ['guru_mapel', 'wali_kelas', 'pembina_ekskul', 'guru_piket'],
    kelasWali: 'IX-A',
    namaEkskul: 'Pramuka',
    piketDays: ['Senin', 'Rabu']
  },
  {
    id: 'g-budi',
    nip: '198509202010121004',
    name: 'Budi Santoso, S.Pd.',
    role: 'guru',
    subRoles: ['guru_mapel', 'guru_piket', 'pembina_ekskul'],
    kelasWali: null,
    namaEkskul: 'Futsal',
    piketDays: ['Senin', 'Kamis']
  },
  {
    id: 'g-siti',
    nip: '197811032005022008',
    name: 'Siti Rahma, S.Psi.',
    role: 'guru',
    subRoles: ['guru_mapel', 'guru_bk'],
    kelasWali: null,
    namaEkskul: null,
    piketDays: ['Selasa']
  },
  {
    id: 'g-ahmad',
    nip: '199002242018041001',
    name: 'Ahmad Hidayat, M.T.',
    role: 'guru',
    subRoles: ['guru_mapel', 'wali_kelas', 'pembina_ekskul'],
    kelasWali: 'VII-A',
    namaEkskul: 'PMR',
    piketDays: ['Rabu']
  },
  {
    id: 'g-diana',
    nip: '198807192015032002',
    name: 'Diana Lestari, S.Pd.',
    role: 'guru',
    subRoles: ['guru_mapel', 'wali_kelas', 'pembina_ekskul'],
    kelasWali: 'VIII-A',
    namaEkskul: 'Paskibra',
    piketDays: ['Kamis']
  },
  {
    id: 'g-joko',
    nip: '198101302009021003',
    name: 'Joko Susilo, S.Pd.',
    role: 'guru',
    subRoles: ['guru_mapel'],
    kelasWali: null,
    namaEkskul: null,
    piketDays: ['Jumat']
  },
  {
    id: 'g-asep',
    nip: '197504122002101003',
    name: 'Asep Wijaya, S.Pd.',
    role: 'guru',
    subRoles: ['guru_mapel', 'pks_kesiswaan'],
    kelasWali: null,
    namaEkskul: null,
    piketDays: ['Selasa']
  }
];

// Pre-seeded Students
export const DEFAULT_SISWA: Siswa[] = [
  // VII-A Students
  { id: 's-vii-1', nisn: '0101234561', name: 'Adit Pratama', kelas: 'VII-A', statusAbsen: 'Hadir', ekskul: 'PMR' },
  { id: 's-vii-2', nisn: '0101234562', name: 'Clarissa Putri', kelas: 'VII-A', statusAbsen: 'Hadir', ekskul: 'Pramuka' },
  { id: 's-vii-3', nisn: '0101234563', name: 'Farhan Ramadhan', kelas: 'VII-A', statusAbsen: 'Sakit', catatanAbsen: 'Demam tinggi', ekskul: 'Futsal' },
  { id: 's-vii-4', nisn: '0101234564', name: 'Naura Salsa', kelas: 'VII-A', statusAbsen: 'Hadir', ekskul: 'Paskibra' },
  { id: 's-vii-5', nisn: '0101234565', name: 'Rizky Febrian', kelas: 'VII-A', statusAbsen: 'Hadir', ekskul: 'Pramuka' },

  // VIII-A Students
  { id: 's-viii-1', nisn: '0201234561', name: 'Amanda Syahputri', kelas: 'VIII-A', statusAbsen: 'Hadir', ekskul: 'Pramuka' },
  { id: 's-viii-2', nisn: '0201234562', name: 'Dimas Setiawan', kelas: 'VIII-A', statusAbsen: 'Izin', catatanAbsen: 'Acara keluarga', ekskul: 'Futsal' },
  { id: 's-viii-3', nisn: '0201234563', name: 'Intan Permata', kelas: 'VIII-A', statusAbsen: 'Hadir', ekskul: 'PMR' },
  { id: 's-viii-4', nisn: '0201234564', name: 'Muhammad Fadel', kelas: 'VIII-A', statusAbsen: 'Hadir', ekskul: 'Paskibra' },
  { id: 's-viii-5', nisn: '0201234565', name: 'Shafa Kamila', kelas: 'VIII-A', statusAbsen: 'Alfa', catatanAbsen: 'Tanpa Keterangan', ekskul: 'Pramuka' },

  // IX-A Students
  { id: 's-ix-1', nisn: '0301234561', name: 'Bayu Pamungkas', kelas: 'IX-A', statusAbsen: 'Hadir', ekskul: 'Futsal' },
  { id: 's-ix-2', nisn: '0301234562', name: 'Dina Lorenza', kelas: 'IX-A', statusAbsen: 'Hadir', ekskul: 'PMR' },
  { id: 's-ix-3', nisn: '0301234563', name: 'Guntur Wibowo', kelas: 'IX-A', statusAbsen: 'Hadir', ekskul: 'Pramuka' },
  { id: 's-ix-4', nisn: '0301234564', name: 'Keysha Amelia', kelas: 'IX-A', statusAbsen: 'Hadir', ekskul: 'Paskibra' },
  { id: 's-ix-5', nisn: '0301234565', name: 'Tegar Prasetyo', kelas: 'IX-A', statusAbsen: 'Sakit', catatanAbsen: 'Sakit gigi', ekskul: 'Pramuka' }
];

// Pre-seeded KBM Schedules (Master Jadwal)
export const DEFAULT_JADWAL: JadwalKBM[] = [
  // Senin Schedules
  { id: 'j-1', hari: 'Senin', jamKe: '1-2', mapel: 'Matematika', kelas: 'IX-A', guruId: 'g-sri', guruName: 'Sri Mulyani, S.Pd.' },
  { id: 'j-2', hari: 'Senin', jamKe: '3-4', mapel: 'Bahasa Indonesia', kelas: 'IX-A', guruId: 'g-budi', guruName: 'Budi Santoso, S.Pd.' },
  { id: 'j-3', hari: 'Senin', jamKe: '5-6', mapel: 'IPA', kelas: 'VII-A', guruId: 'g-ahmad', guruName: 'Ahmad Hidayat, M.T.' },
  
  // Selasa Schedules
  { id: 'j-4', hari: 'Selasa', jamKe: '1-2', mapel: 'BK Kelompok', kelas: 'IX-A', guruId: 'g-siti', guruName: 'Siti Rahma, S.Psi.' },
  { id: 'j-5', hari: 'Selasa', jamKe: '3-4', mapel: 'Matematika', kelas: 'VII-A', guruId: 'g-sri', guruName: 'Sri Mulyani, S.Pd.' },
  
  // Rabu Schedules
  { id: 'j-6', hari: 'Rabu', jamKe: '1-2', mapel: 'Bahasa Inggris', kelas: 'VIII-A', guruId: 'g-diana', guruName: 'Diana Lestari, S.Pd.' },
  { id: 'j-7', hari: 'Rabu', jamKe: '3-4', mapel: 'Matematika', kelas: 'VIII-A', guruId: 'g-sri', guruName: 'Sri Mulyani, S.Pd.' },
  
  // Kamis Schedules
  { id: 'j-8', hari: 'Kamis', jamKe: '1-2', mapel: 'IPS', kelas: 'IX-A', guruId: 'g-joko', guruName: 'Joko Susilo, S.Pd.' },
  { id: 'j-9', hari: 'Kamis', jamKe: '3-4', mapel: 'Bahasa Indonesia', kelas: 'VII-A', guruId: 'g-budi', guruName: 'Budi Santoso, S.Pd.' },
  
  // Jumat Schedules
  { id: 'j-10', hari: 'Jumat', jamKe: '1-2', mapel: 'IPA', kelas: 'VIII-A', guruId: 'g-ahmad', guruName: 'Ahmad Hidayat, M.T.' },
  { id: 'j-11', hari: 'Jumat', jamKe: '3-4', mapel: 'IPS', kelas: 'VII-A', guruId: 'g-joko', guruName: 'Joko Susilo, S.Pd.' }
];

// Pre-seeded Piket Schedules Config (Lock 2 teachers per day)
export const DEFAULT_PIKET_CONFIG: PiketScheduleConfig[] = [
  { hari: 'Senin', guruIds: ['g-sri', 'g-budi'] },
  { hari: 'Selasa', guruIds: ['g-siti', 'g-sri'] },
  { hari: 'Rabu', guruIds: ['g-sri', 'g-ahmad'] },
  { hari: 'Kamis', guruIds: ['g-budi', 'g-diana'] },
  { hari: 'Jumat', guruIds: ['g-joko', 'g-siti'] }
];

// Pre-seeded JurnalMengajar
export const DEFAULT_JURNAL_MENGAJAR: JurnalMengajar[] = [
  {
    id: 'jm-1',
    guruId: 'g-sri',
    guruName: 'Sri Mulyani, S.Pd.',
    tanggal: '2026-07-06',
    hari: 'Senin',
    kelas: 'IX-A',
    jamKe: '1-2',
    materi: 'Persamaan Kuadrat',
    aktivitas: 'Membahas bentuk umum persamaan kuadrat dan melatih siswa mencari akar menggunakan pemfaktoran.',
    absensiSiswa: [
      { siswaId: 's-ix-5', namaSiswa: 'Tegar Prasetyo', status: 'Sakit', catatan: 'Sakit gigi' }
    ]
  },
  {
    id: 'jm-2',
    guruId: 'g-budi',
    guruName: 'Budi Santoso, S.Pd.',
    tanggal: '2026-07-06',
    hari: 'Senin',
    kelas: 'IX-A',
    jamKe: '3-4',
    materi: 'Teks Eksposisi',
    aktivitas: 'Membaca bersama contoh teks eksposisi bertema lingkungan dan mengidentifikasi tesis serta argumentasi.',
    absensiSiswa: [
      { siswaId: 's-ix-5', namaSiswa: 'Tegar Prasetyo', status: 'Sakit', catatan: 'Sakit gigi' }
    ]
  }
];

// Pre-seeded Jurnal Piket Harian
export const DEFAULT_JURNAL_PIKET: JurnalPiketHarian[] = [
  {
    id: 'jp-1',
    tanggal: '2026-07-06',
    hari: 'Senin',
    guruPiketIds: ['g-sri', 'g-budi'],
    catatanKejadian: 'KBM berjalan tertib. Cuaca pagi cerah, siang gerimis ringan. Upacara bendera hari Senin terlaksana dengan khidmat.',
    guruAbsenList: [
      {
        id: 'ga-1',
        guruId: 'g-joko',
        namaGuru: 'Joko Susilo, S.Pd.',
        alasan: 'Izin',
        tugasMandiri: 'Membaca materi IPS Bab 2 halaman 45-50 dan merangkum konsep interaksi sosial.'
      }
    ]
  }
];

// Pre-seeded Jurnal Ekskul
export const DEFAULT_JURNAL_EKSKUL: JurnalEkskul[] = [
  {
    id: 'je-1',
    pembinaId: 'g-sri',
    namaEkskul: 'Pramuka',
    tanggal: '2026-07-04',
    aktivitas: 'Latihan baris-berbaris (PBB) dasar dan tali temali simpul mati & simpul pangkal.',
    absensiSiswa: [
      { siswaId: 's-vii-2', namaSiswa: 'Clarissa Putri', status: 'Hadir' },
      { siswaId: 's-vii-5', namaSiswa: 'Rizky Febrian', status: 'Hadir' },
      { siswaId: 's-viii-1', namaSiswa: 'Amanda Syahputri', status: 'Hadir' },
      { siswaId: 's-viii-5', namaSiswa: 'Shafa Kamila', status: 'Hadir' },
      { siswaId: 's-ix-3', namaSiswa: 'Guntur Wibowo', status: 'Izin' }
    ]
  }
];

// Pre-seeded Kasus BK
export const DEFAULT_KASUS_BK: KasusBK[] = [
  {
    id: 'kbk-1',
    siswaId: 's-viii-5',
    namaSiswa: 'Shafa Kamila',
    kelas: 'VIII-A',
    tanggal: '2026-07-03',
    tipeKasus: 'Pelanggaran',
    deskripsi: 'Terlambat masuk sekolah sebanyak 3 kali dalam seminggu berturut-turut.',
    solusi: 'Pemanggilan siswa, bimbingan konseling pribadi, membuat surat pernyataan janji tidak terlambat lagi.',
    penangananOleh: 'Siti Rahma, S.Psi.'
  },
  {
    id: 'kbk-2',
    siswaId: 's-vii-3',
    namaSiswa: 'Farhan Ramadhan',
    kelas: 'VII-A',
    tanggal: '2026-07-02',
    tipeKasus: 'Kerawanan',
    deskripsi: 'Menunjukkan perubahan sikap murung dan sering menyendiri di kelas.',
    solusi: 'Pendekatan konseling empati, memberikan ruang cerita, mendiskusikan dengan wali kelas Ahmad Hidayat.',
    penangananOleh: 'Siti Rahma, S.Psi.'
  }
];

// Pre-seeded Nilai Mapel
export const DEFAULT_NILAI_MAPEL: NilaiMapel[] = [
  { id: 'nm-1', siswaId: 's-ix-1', namaSiswa: 'Bayu Pamungkas', kelas: 'IX-A', mapel: 'Matematika', guruId: 'g-sri', nilaiHarian: 85, nilaiTugas: 80, nilaiUts: 75, nilaiUas: 80 },
  { id: 'nm-2', siswaId: 's-ix-2', namaSiswa: 'Dina Lorenza', kelas: 'IX-A', mapel: 'Matematika', guruId: 'g-sri', nilaiHarian: 90, nilaiTugas: 95, nilaiUts: 88, nilaiUas: 90 },
  { id: 'nm-3', siswaId: 's-ix-3', namaSiswa: 'Guntur Wibowo', kelas: 'IX-A', mapel: 'Matematika', guruId: 'g-sri', nilaiHarian: 78, nilaiTugas: 82, nilaiUts: 80, nilaiUas: 85 },
  { id: 'nm-4', siswaId: 's-ix-4', namaSiswa: 'Keysha Amelia', kelas: 'IX-A', mapel: 'Matematika', guruId: 'g-sri', nilaiHarian: 88, nilaiTugas: 85, nilaiUts: 82, nilaiUas: 88 },
  { id: 'nm-5', siswaId: 's-ix-5', namaSiswa: 'Tegar Prasetyo', kelas: 'IX-A', mapel: 'Matematika', guruId: 'g-sri', nilaiHarian: 70, nilaiTugas: 75, nilaiUts: 70, nilaiUas: 72 }
];

// Pre-seeded Nilai Ekskul
export const DEFAULT_NILAI_EKSKUL: NilaiEkskul[] = [
  { id: 'ne-1', siswaId: 's-vii-2', namaSiswa: 'Clarissa Putri', kelas: 'VII-A', namaEkskul: 'Pramuka', predikat: 'A', catatan: 'Sangat aktif dalam kegiatan PBB dan responsif memahami materi tali temali.' },
  { id: 'ne-2', siswaId: 's-vii-5', namaSiswa: 'Rizky Febrian', kelas: 'VII-A', namaEkskul: 'Pramuka', predikat: 'B', catatan: 'Aktif mengikuti kegiatan baris-berbaris dengan cukup baik.' },
  { id: 'ne-3', siswaId: 's-viii-1', namaSiswa: 'Amanda Syahputri', kelas: 'VIII-A', namaEkskul: 'Pramuka', predikat: 'A', catatan: 'Menunjukkan jiwa kepemimpinan yang baik sebagai pimpinan regu.' }
];

// Pre-seeded Master Pelanggaran & Apresiasi
export const DEFAULT_ATURAN_POIN: AturanPoin[] = [
  { id: 'ap-1', kode: 'P01', nama: 'Terlambat masuk sekolah / kelas', bobot: 5, tipe: 'pelanggaran' },
  { id: 'ap-2', kode: 'P02', nama: 'Tidak memakai atribut seragam lengkap', bobot: 5, tipe: 'pelanggaran' },
  { id: 'ap-3', kode: 'P03', nama: 'Rambut gondrong / tidak rapi', bobot: 5, tipe: 'pelanggaran' },
  { id: 'ap-4', kode: 'P04', nama: 'Membawa / bermain HP saat jam KBM tanpa izin', bobot: 10, tipe: 'pelanggaran' },
  { id: 'ap-5', kode: 'P05', nama: 'Membuang sampah sembarangan', bobot: 5, tipe: 'pelanggaran' },
  { id: 'ap-6', kode: 'P06', nama: 'Meninggalkan lingkungan sekolah tanpa izin (Bolos)', bobot: 15, tipe: 'pelanggaran' },
  { id: 'ap-7', kode: 'P07', nama: 'Merusak fasilitas sarpras sekolah', bobot: 25, tipe: 'pelanggaran' },
  { id: 'ap-8', kode: 'P08', nama: 'Melakukan perundungan (Bullying) fisik/verbal', bobot: 50, tipe: 'pelanggaran' },
  { id: 'ap-9', kode: 'P09', nama: 'Membawa rokok atau merokok di lingkungan sekolah', bobot: 30, tipe: 'pelanggaran' },
  { id: 'ap-10', kode: 'P10', nama: 'Melawan Kepala Sekolah, Guru, atau Tenaga Kependidikan', bobot: 50, tipe: 'pelanggaran' },

  { id: 'ap-11', kode: 'A01', nama: 'Menjuarai perlombaan tingkat Kabupaten (Juara 1-3)', bobot: 30, tipe: 'apresiasi' },
  { id: 'ap-12', kode: 'A02', nama: 'Menjuarai perlombaan tingkat Provinsi / Nasional', bobot: 50, tipe: 'apresiasi' },
  { id: 'ap-13', kode: 'A03', nama: 'Menjadi petugas upacara bendera dengan sangat baik', bobot: 10, tipe: 'apresiasi' },
  { id: 'ap-14', kode: 'A04', nama: 'Menjadi pengurus OSIS / MPK yang aktif dan teladan', bobot: 15, tipe: 'apresiasi' },
  { id: 'ap-15', kode: 'A05', nama: 'Membantu merapikan lingkungan / sarpras sekolah secara sukarela', bobot: 10, tipe: 'apresiasi' },
  { id: 'ap-16', kode: 'A06', nama: 'Menunjukkan kejujuran tinggi (misal mengembalikan dompet hilang)', bobot: 20, tipe: 'apresiasi' }
];

// Pre-seeded Log Poin Siswa
export const DEFAULT_LOG_POIN: LogPoinSiswa[] = [
  {
    id: 'lp-1',
    siswaId: 's-viii-5',
    namaSiswa: 'Shafa Kamila',
    kelas: 'VIII-A',
    tanggal: '2026-07-03',
    aturanPoinId: 'ap-1',
    kodeAturan: 'P01',
    namaAturan: 'Terlambat masuk sekolah / kelas',
    bobot: 5,
    tipe: 'pelanggaran',
    dilaporkanOleh: 'Siti Rahma, S.Psi.',
    catatan: 'Terlambat 15 menit tanpa surat keterangan',
    disetujuiPks: true
  },
  {
    id: 'lp-2',
    siswaId: 's-vii-2',
    namaSiswa: 'Clarissa Putri',
    kelas: 'VII-A',
    tanggal: '2026-07-04',
    aturanPoinId: 'ap-13',
    kodeAturan: 'A03',
    namaAturan: 'Menjadi petugas upacara bendera dengan sangat baik',
    bobot: 10,
    tipe: 'apresiasi',
    dilaporkanOleh: 'Sri Mulyani, S.Pd.',
    catatan: 'Menjadi dirigen upacara bendera dengan sangat khidmat',
    disetujuiPks: true
  },
  {
    id: 'lp-3',
    siswaId: 's-ix-1',
    namaSiswa: 'Bayu Pamungkas',
    kelas: 'IX-A',
    tanggal: '2026-07-06',
    aturanPoinId: 'ap-15',
    kodeAturan: 'A05',
    namaAturan: 'Membantu merapikan lingkungan / sarpras sekolah secara sukarela',
    bobot: 10,
    tipe: 'apresiasi',
    dilaporkanOleh: 'Budi Santoso, S.Pd.',
    catatan: 'Membantu membersihkan lapangan futsal setelah latihan selesai',
    disetujuiPks: false
  }
];

// Pre-seeded Izin Guru
export const DEFAULT_IZIN_GURU: IzinGuru[] = [
  {
    id: 'ig-1',
    guruId: 'g-joko',
    namaGuru: 'Joko Susilo, S.Pd.',
    tanggal: '2026-07-06',
    alasan: 'Izin',
    tugasMandiri: 'Membaca materi IPS Bab 2 halaman 45-50 dan merangkum konsep interaksi sosial.',
    status: 'Disetujui',
    diverifikasiOleh: 'Sri Mulyani, S.Pd.'
  }
];

// LocalStorage helpers with automatic seeding
export function getStoredData<T>(key: string, defaultVal: T): T {
  const item = localStorage.getItem(`sigap_${key}`);
  if (!item) {
    localStorage.setItem(`sigap_${key}`, JSON.stringify(defaultVal));
    return defaultVal;
  }
  try {
    return JSON.parse(item) as T;
  } catch (e) {
    return defaultVal;
  }
}

export function setStoredData<T>(key: string, val: T): void {
  localStorage.setItem(`sigap_${key}`, JSON.stringify(val));
}

// Global data API
export const loadInitialState = () => {
  const gurus = getStoredData<Guru[]>('gurus', DEFAULT_GURU);
  const siswa = getStoredData<Siswa[]>('siswa', DEFAULT_SISWA);
  const jadwal = getStoredData<JadwalKBM[]>('jadwal', DEFAULT_JADWAL);
  const piketConfig = getStoredData<PiketScheduleConfig[]>('piket_config', DEFAULT_PIKET_CONFIG);
  const jurnalMengajar = getStoredData<JurnalMengajar[]>('jurnal_mengajar', DEFAULT_JURNAL_MENGAJAR);
  const jurnalPiket = getStoredData<JurnalPiketHarian[]>('jurnal_piket', DEFAULT_JURNAL_PIKET);
  const jurnalEkskul = getStoredData<JurnalEkskul[]>('jurnal_ekskul', DEFAULT_JURNAL_EKSKUL);
  const kasusBk = getStoredData<KasusBK[]>('kasus_bk', DEFAULT_KASUS_BK);
  const nilaiMapel = getStoredData<NilaiMapel[]>('nilai_mapel', DEFAULT_NILAI_MAPEL);
  const nilaiEkskul = getStoredData<NilaiEkskul[]>('nilai_ekskul', DEFAULT_NILAI_EKSKUL);
  const aturanPoin = getStoredData<AturanPoin[]>('aturan_poin', DEFAULT_ATURAN_POIN);
  const logPoin = getStoredData<LogPoinSiswa[]>('log_poin', DEFAULT_LOG_POIN);
  const izinGuru = getStoredData<IzinGuru[]>('izin_guru', DEFAULT_IZIN_GURU);

  return {
    gurus,
    siswa,
    jadwal,
    piketConfig,
    jurnalMengajar,
    jurnalPiket,
    jurnalEkskul,
    kasusBk,
    nilaiMapel,
    nilaiEkskul,
    aturanPoin,
    logPoin,
    izinGuru
  };
};

export const saveState = (state: ReturnType<typeof loadInitialState>) => {
  setStoredData('gurus', state.gurus);
  setStoredData('siswa', state.siswa);
  setStoredData('jadwal', state.jadwal);
  setStoredData('piket_config', state.piketConfig);
  setStoredData('jurnal_mengajar', state.jurnalMengajar);
  setStoredData('jurnal_piket', state.jurnalPiket);
  setStoredData('jurnal_ekskul', state.jurnalEkskul);
  setStoredData('kasus_bk', state.kasusBk);
  setStoredData('nilai_mapel', state.nilaiMapel);
  setStoredData('nilai_ekskul', state.nilaiEkskul);
  setStoredData('aturan_poin', state.aturanPoin);
  setStoredData('log_poin', state.logPoin);
  setStoredData('izin_guru', state.izinGuru);
};
