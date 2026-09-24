import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface PublicSharePayload {
  shareId: string;
  shareType: 'absensi' | 'nilai' | 'tabungan';
  className: string;
  mataPelajaran?: string;
  schoolName?: string;
  waliKelas?: string;
  academicYear?: string;
  isPublicEnabled: boolean;
  updatedAt: string;
  [key: string]: any;
}

export const PublicShareService = {
  /**
   * Derive a stable or custom token for a class & shareType
   */
  getShareToken(teacherUid: string, classId: string, shareType: 'absensi' | 'nilai' | 'tabungan'): string {
    const prefix = shareType === 'absensi' ? 'abs' : shareType === 'tabungan' ? 'tb' : 'nil';
    return `${prefix}_${teacherUid.slice(0, 8)}_${classId}`;
  },

  /**
   * Publish public snapshot into public_shares table
   */
  async publishShare(
    teacherId: string,
    classId: string,
    shareType: 'absensi' | 'nilai' | 'tabungan',
    token: string,
    payload: PublicSharePayload,
    isActive: boolean = true
  ): Promise<void> {
    if (!isSupabaseConfigured()) {
      // In offline/dev without cloud, store in localStorage for local testing
      try {
        localStorage.setItem(`pub_share_${shareType}_${token}`, JSON.stringify(payload));
      } catch {}
      return;
    }

    try {
      const { error } = await supabase.from('public_shares').upsert(
        {
          teacher_id: teacherId,
          class_id: classId.includes('-') && classId.length >= 32 ? classId : undefined as any,
          share_type: shareType,
          token,
          payload: payload as any,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'token' }
      );

      if (error) throw error;
    } catch (err) {
      console.error(`[PublicShareService] publishShare (${shareType}) error:`, err);
      throw new Error(`Gagal mempublikasikan tautan publik ${shareType} ke Supabase.`);
    }
  },

  /**
   * Get public share via secure RPC function (no direct table access needed)
   */
  async getPublicShare(token: string, shareType: 'absensi' | 'nilai' | 'tabungan'): Promise<PublicSharePayload | null> {
    if (!isSupabaseConfigured()) {
      try {
        const local = localStorage.getItem(`pub_share_${shareType}_${token}`);
        if (local) return JSON.parse(local);
      } catch {}
      return null;
    }

    try {
      // Call secure RPC function get_public_share
      const { data, error } = await (supabase.rpc as any)('get_public_share', {
        p_token: token,
        p_share_type: shareType,
      });

      if (error) {
        // Fallback: direct select if RPC not installed yet
        const { data: row, error: selectErr } = await supabase
          .from('public_shares')
          .select('payload, is_active, expires_at')
          .eq('token', token)
          .eq('share_type', shareType)
          .eq('is_active', true)
          .maybeSingle();

        if (selectErr || !row) return null;
        return row.payload as PublicSharePayload;
      }

      if (data && (data as any).found) {
        return (data as any).data as PublicSharePayload;
      }
      return null;
    } catch (err) {
      console.warn(`[PublicShareService] getPublicShare notice:`, err);
      return null;
    }
  },

  /**
   * Optional Realtime subscription for public shares if live updates are enabled
   */
  subscribeShare(
    token: string,
    shareType: 'absensi' | 'nilai' | 'tabungan',
    onChange: (payload: PublicSharePayload) => void
  ) {
    if (!isSupabaseConfigured()) {
      return { unsubscribe: () => {} };
    }

    const channel = supabase
      .channel(`public_share_${token}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'public_shares',
          filter: `token=eq.${token}`,
        },
        (payload) => {
          if (payload.new && (payload.new as any).payload) {
            onChange((payload.new as any).payload);
          }
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      },
    };
  },
};
