import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

/**
 * Robustly resolve and sanitize Supabase URL and Anon Key.
 * Handles cases where environment variables might be swapped, missing protocol,
 * or include API endpoints like /rest/v1.
 */
function sanitizeSupabaseUrl(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let cleaned = rawUrl.trim();

  // If protocol missing but domain is provided
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    if (cleaned.includes('.supabase.co')) {
      cleaned = 'https://' + cleaned;
    } else {
      return '';
    }
  }

  try {
    const parsed = new URL(cleaned);
    return parsed.origin;
  } catch {
    return '';
  }
}

function resolveSupabaseConfig() {
  const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
  const procEnv = (typeof process !== 'undefined' && process.env) || {};

  const rawUrl = metaEnv.VITE_SUPABASE_URL || procEnv.VITE_SUPABASE_URL || procEnv.SUPABASE_URL;
  const rawAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || procEnv.VITE_SUPABASE_ANON_KEY || procEnv.SUPABASE_ANON_KEY;
  const rawServiceKey = metaEnv.SUPABASE_SERVICE_ROLE_KEY || procEnv.SUPABASE_SERVICE_ROLE_KEY;

  let validUrl = sanitizeSupabaseUrl(rawUrl);

  // If rawUrl is not a valid URL (e.g. user swapped with key), search other env variables for a valid URL
  if (!validUrl) {
    const candidates = [rawServiceKey, rawAnonKey, procEnv.DATABASE_URL].filter(Boolean);
    for (const c of candidates) {
      const attempt = sanitizeSupabaseUrl(c);
      if (attempt) {
        validUrl = attempt;
        break;
      }
    }
  }

  // Resolve Anon Key (if rawUrl is actually a publishable key)
  let validKey = rawAnonKey;
  if (typeof rawUrl === 'string' && rawUrl.startsWith('sb_publishable_')) {
    validKey = rawUrl;
  }
  if (!validKey || typeof validKey !== 'string' || validKey.trim() === '') {
    validKey = 'placeholder-anon-key';
  }

  const finalUrl = validUrl || 'https://placeholder.supabase.co';

  return {
    url: finalUrl,
    key: validKey.trim(),
    isConfigured: Boolean(validUrl && !finalUrl.includes('placeholder') && validKey !== 'placeholder-anon-key'),
  };
}

const config = resolveSupabaseConfig();

export const SUPABASE_URL = config.url;
export const SUPABASE_ANON_KEY = config.key;

export const isSupabaseConfigured = (): boolean => {
  return config.isConfigured;
};

// Safe createClient initialization that will never throw uncaught URL error
let supabaseClient: any;
try {
  supabaseClient = createClient<any>(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
} catch (err) {
  console.warn('[Supabase] Initializing client fallback:', err);
  supabaseClient = createClient<any>('https://placeholder.supabase.co', 'placeholder-anon-key', {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export const supabase = supabaseClient;

/**
 * Health check test connection to Supabase
 */
export async function testSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message: 'Kredensial Supabase (URL / Key) belum dikonfigurasi. Mode offline aktif.',
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

