import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const envSupabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const envSupabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

// Fallback dummy credentials to prevent crashes when developing before env setup
export const SUPABASE_URL =
  (envSupabaseUrl && typeof envSupabaseUrl === 'string' && envSupabaseUrl.trim() !== ''
    ? envSupabaseUrl.trim()
    : 'https://placeholder.supabase.co');

export const SUPABASE_ANON_KEY =
  (envSupabaseAnonKey && typeof envSupabaseAnonKey === 'string' && envSupabaseAnonKey.trim() !== ''
    ? envSupabaseAnonKey.trim()
    : 'placeholder-anon-key');

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    envSupabaseUrl &&
    envSupabaseAnonKey &&
    !envSupabaseUrl.includes('placeholder') &&
    envSupabaseAnonKey !== 'placeholder-anon-key'
  );
};

export const supabase = createClient<any>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  global: {
    headers: {
      'x-application-name': 'AbsenApp-SMK-Bawang',
    },
  },
});

/**
 * Health check test connection to Supabase
 */
export async function testSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message: 'VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY belum dikonfigurasi di file lingkungan.',
    };
  }
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      return { ok: false, message: error.message };
    }
    return { ok: true, message: 'Koneksi Supabase PostgreSQL aktif' };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Gagal menghubungi server Supabase' };
  }
}
