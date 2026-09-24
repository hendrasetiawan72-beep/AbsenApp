import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { TeacherProfile } from '../types';

export interface AuthUser {
  id: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  role?: string;
}

export const AuthService = {
  /**
   * Get current active session
   */
  async getSession() {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    } catch (err) {
      console.warn('[AuthService] getSession notice:', err);
      return null;
    }
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;

      // Try reading profile from public.profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      return {
        id: user.id,
        email: user.email,
        fullName: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0],
        avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url || '',
        role: profile?.role || 'teacher',
      };
    } catch (err) {
      console.warn('[AuthService] getCurrentUser notice:', err);
      return null;
    }
  },

  /**
   * Sign in with email and password
   */
  async signInWithPassword(email: string, password: string): Promise<{ user: AuthUser | null; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return {
        user: null,
        error: new Error('Supabase belum dikonfigurasi. Silakan tambahkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.'),
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        // User-friendly translation of Supabase Auth errors
        let friendlyMessage = error.message;
        if (error.message.includes('Invalid login credentials')) {
          friendlyMessage = 'Email atau kata sandi tidak sesuai. Silakan periksa kembali.';
        } else if (error.message.includes('Email not confirmed')) {
          friendlyMessage = 'Email belum dikonfirmasi. Periksa kotak masuk email Anda.';
        }
        return { user: null, error: new Error(friendlyMessage) };
      }

      if (!data.user) {
        return { user: null, error: new Error('Gagal masuk. Pengguna tidak ditemukan.') };
      }

      // Sync profile if needed
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!profile) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email || '',
          full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Guru',
          role: 'teacher',
          school_id: 'SMK Muhammadiyah Bawang',
          school_name: 'SMK Muhammadiyah Bawang',
        });
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          fullName: profile?.full_name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
          avatarUrl: profile?.avatar_url || '',
          role: profile?.role || 'teacher',
        },
        error: null,
      };
    } catch (err: any) {
      return { user: null, error: new Error(err.message || 'Terjadi kesalahan saat masuk.') };
    }
  },

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, fullName?: string): Promise<{ user: AuthUser | null; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return {
        user: null,
        error: new Error('Supabase belum dikonfigurasi.'),
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName || email.split('@')[0],
          },
        },
      });

      if (error) return { user: null, error };
      if (!data.user) return { user: null, error: new Error('Pendaftaran gagal diproses.') };

      // Ensure profile exists in profiles table
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email || '',
        full_name: fullName || data.user.email?.split('@')[0] || 'Guru',
        role: 'teacher',
        school_id: 'SMK Muhammadiyah Bawang',
        school_name: 'SMK Muhammadiyah Bawang',
      });

      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          fullName: fullName || data.user.email?.split('@')[0],
          role: 'teacher',
        },
        error: null,
      };
    } catch (err: any) {
      return { user: null, error: new Error(err.message || 'Gagal mendaftarkan akun.') };
    }
  },

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[AuthService] signOut notice:', err);
    }
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    if (!isSupabaseConfigured()) {
      // return a no-op subscription
      return { data: { subscription: { unsubscribe: () => {} } } };
    }

    return supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        callback({
          id: session.user.id,
          email: session.user.email,
          fullName: profile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          avatarUrl: profile?.avatar_url || session.user.user_metadata?.avatar_url || '',
          role: profile?.role || 'teacher',
        });
      } else {
        callback(null);
      }
    });
  },

  /**
   * Fetch teacher profile from Supabase
   */
  async getProfile(userId: string): Promise<TeacherProfile | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: userId,
        namaGuru: data.full_name,
        nip: data.nip || '-',
        nbm: data.nbm || '-',
        namaSekolah: data.school_name || 'SMK Muhammadiyah Bawang',
        mataPelajaranUtama: data.main_subject || 'Bahasa Inggris',
        tahunAjaran: data.academic_year || '2026/2027',
        semester: (data.semester as any) || 'Ganjil',
        avatarUrl: data.avatar_url || '',
        email: data.email,
        role: data.role as any,
        isLoggedIn: true,
      };
    } catch (err) {
      console.warn('[AuthService] getProfile error:', err);
      return null;
    }
  },

  /**
   * Update teacher profile in Supabase
   */
  async updateProfile(userId: string, profile: Partial<TeacherProfile>): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
      await supabase.from('profiles').upsert({
        id: userId,
        full_name: profile.namaGuru,
        email: profile.email,
        nip: profile.nip,
        nbm: profile.nbm,
        school_name: profile.namaSekolah,
        main_subject: profile.mataPelajaranUtama,
        academic_year: profile.tahunAjaran,
        semester: profile.semester,
        avatar_url: profile.avatarUrl,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[AuthService] updateProfile error:', err);
      throw new Error('Gagal memperbarui profil di cloud Supabase.');
    }
  },
};

let cachedAuthUser: AuthUser | null = null;

export const auth = {
  get currentUser() {
    if (!cachedAuthUser) {
      if (typeof window !== 'undefined') {
        const uid = localStorage.getItem('smk_active_teacher_uid');
        if (uid) {
          return {
            uid,
            id: uid,
            email: 'hendra.alkindi@gmail.com',
            displayName: 'Hendra Setiawan, S.Pd',
            photoURL: '',
          };
        }
      }
      return null;
    }
    return {
      uid: cachedAuthUser.id,
      id: cachedAuthUser.id,
      email: cachedAuthUser.email,
      displayName: cachedAuthUser.fullName,
      photoURL: cachedAuthUser.avatarUrl,
    };
  },
  setCurrentUser(user: AuthUser | null) {
    cachedAuthUser = user;
  }
};

export const onAuthStateChanged = (
  _authInstance: any,
  callback: (user: any) => void
): (() => void) => {
  const result = AuthService.onAuthStateChange((user) => {
    cachedAuthUser = user;
    if (user) {
      callback({
        uid: user.id,
        id: user.id,
        email: user.email,
        displayName: user.fullName,
        photoURL: user.avatarUrl,
      });
    } else {
      callback(null);
    }
  });

  return () => {
    if (typeof result === 'function') {
      (result as any)();
    } else if (result && (result as any).data?.subscription?.unsubscribe) {
      (result as any).data.subscription.unsubscribe();
    }
  };
};

export const signOut = async (_authInstance?: any) => {
  cachedAuthUser = null;
  return AuthService.signOut();
};

