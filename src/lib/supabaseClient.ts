import { createClient } from '@supabase/supabase-js';

// FIX: Menggunakan Type Casting aman agar TypeScript di Vercel mendeteksi meta.env milik Vite
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Peringatan: VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY belum terkonfigurasi di Environment Variables."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);