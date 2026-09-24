export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          role: string;
          school_id: string | null;
          school_name: string | null;
          nip: string | null;
          nbm: string | null;
          main_subject: string | null;
          academic_year: string | null;
          semester: string | null;
          avatar_url: string | null;
          active_class_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          email?: string;
          role?: string;
          school_id?: string | null;
          school_name?: string | null;
          nip?: string | null;
          nbm?: string | null;
          main_subject?: string | null;
          academic_year?: string | null;
          semester?: string | null;
          avatar_url?: string | null;
          active_class_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          role?: string;
          school_id?: string | null;
          school_name?: string | null;
          nip?: string | null;
          nbm?: string | null;
          main_subject?: string | null;
          academic_year?: string | null;
          semester?: string | null;
          avatar_url?: string | null;
          active_class_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      classes: {
        Row: {
          id: string;
          teacher_id: string;
          name: string;
          academic_year: string;
          major: string;
          grade_level: string | null;
          kkm: number;
          notes: string | null;
          legacy_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          name: string;
          academic_year?: string;
          major?: string;
          grade_level?: string | null;
          kkm?: number;
          notes?: string | null;
          legacy_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          name?: string;
          academic_year?: string;
          major?: string;
          grade_level?: string | null;
          kkm?: number;
          notes?: string | null;
          legacy_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      students: {
        Row: {
          id: string;
          class_id: string;
          nis: string | null;
          nisn: string | null;
          name: string;
          gender: 'L' | 'P';
          birth_place: string | null;
          birth_date: string | null;
          address: string | null;
          phone: string | null;
          parent_name: string | null;
          attendance_number: number | null;
          notes: string | null;
          legacy_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          nis?: string | null;
          nisn?: string | null;
          name: string;
          gender?: 'L' | 'P';
          birth_place?: string | null;
          birth_date?: string | null;
          address?: string | null;
          phone?: string | null;
          parent_name?: string | null;
          attendance_number?: number | null;
          notes?: string | null;
          legacy_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          nis?: string | null;
          nisn?: string | null;
          name?: string;
          gender?: 'L' | 'P';
          birth_place?: string | null;
          birth_date?: string | null;
          address?: string | null;
          phone?: string | null;
          parent_name?: string | null;
          attendance_number?: number | null;
          notes?: string | null;
          legacy_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      attendance_sessions: {
        Row: {
          id: string;
          class_id: string;
          teacher_id: string;
          attendance_date: string;
          subject: string;
          meeting_number: number;
          notes: string | null;
          legacy_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          teacher_id: string;
          attendance_date?: string;
          subject?: string;
          meeting_number?: number;
          notes?: string | null;
          legacy_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          teacher_id?: string;
          attendance_date?: string;
          subject?: string;
          meeting_number?: number;
          notes?: string | null;
          legacy_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      attendance_records: {
        Row: {
          id: string;
          session_id: string;
          student_id: string;
          status: 'H' | 'S' | 'I' | 'A' | 'D';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          student_id: string;
          status?: 'H' | 'S' | 'I' | 'A' | 'D';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          student_id?: string;
          status?: 'H' | 'S' | 'I' | 'A' | 'D';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      grade_headers: {
        Row: {
          id: string;
          class_id: string;
          teacher_id: string;
          name: string;
          semester: string | null;
          academic_year: string | null;
          category: string | null;
          weight: number | null;
          max_score: number | null;
          order_index: number | null;
          legacy_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          teacher_id: string;
          name: string;
          semester?: string | null;
          academic_year?: string | null;
          category?: string | null;
          weight?: number | null;
          max_score?: number | null;
          order_index?: number | null;
          legacy_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          teacher_id?: string;
          name?: string;
          semester?: string | null;
          academic_year?: string | null;
          category?: string | null;
          weight?: number | null;
          max_score?: number | null;
          order_index?: number | null;
          legacy_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      grades: {
        Row: {
          id: string;
          grade_header_id: string;
          student_id: string;
          value: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          grade_header_id: string;
          student_id: string;
          value?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          grade_header_id?: string;
          student_id?: string;
          value?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      student_grades_summary: {
        Row: {
          id: string;
          class_id: string;
          student_id: string;
          formatif1: number | null;
          formatif2: number | null;
          formatif3: number | null;
          formatif4: number | null;
          formatif5: number | null;
          formatif6: number | null;
          formatif7: number | null;
          formatif8: number | null;
          sumatif_tengah: number | null;
          sumatif_akhir: number | null;
          tugas1: number | null;
          tugas2: number | null;
          tugas3: number | null;
          uts: number | null;
          uas: number | null;
          praktik: number | null;
          notes: string | null;
          legacy_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          student_id: string;
          formatif1?: number | null;
          formatif2?: number | null;
          formatif3?: number | null;
          formatif4?: number | null;
          formatif5?: number | null;
          formatif6?: number | null;
          formatif7?: number | null;
          formatif8?: number | null;
          sumatif_tengah?: number | null;
          sumatif_akhir?: number | null;
          tugas1?: number | null;
          tugas2?: number | null;
          tugas3?: number | null;
          uts?: number | null;
          uas?: number | null;
          praktik?: number | null;
          notes?: string | null;
          legacy_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          student_id?: string;
          formatif1?: number | null;
          formatif2?: number | null;
          formatif3?: number | null;
          formatif4?: number | null;
          formatif5?: number | null;
          formatif6?: number | null;
          formatif7?: number | null;
          formatif8?: number | null;
          sumatif_tengah?: number | null;
          sumatif_akhir?: number | null;
          tugas1?: number | null;
          tugas2?: number | null;
          tugas3?: number | null;
          uts?: number | null;
          uas?: number | null;
          praktik?: number | null;
          notes?: string | null;
          legacy_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      teaching_agendas: {
        Row: {
          id: string;
          teacher_id: string;
          class_id: string;
          agenda_date: string;
          subject: string | null;
          material: string | null;
          activity: string | null;
          attendance_count: number | null;
          absent_count: number | null;
          hours_range: string | null;
          hours_array: Json | null;
          notes: string | null;
          legacy_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          class_id: string;
          agenda_date?: string;
          subject?: string | null;
          material?: string | null;
          activity?: string | null;
          attendance_count?: number | null;
          absent_count?: number | null;
          hours_range?: string | null;
          hours_array?: Json | null;
          notes?: string | null;
          legacy_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          class_id?: string;
          agenda_date?: string;
          subject?: string | null;
          material?: string | null;
          activity?: string | null;
          attendance_count?: number | null;
          absent_count?: number | null;
          hours_range?: string | null;
          hours_array?: Json | null;
          notes?: string | null;
          legacy_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      savings: {
        Row: {
          id: string;
          teacher_id: string;
          student_id: string;
          class_id: string;
          transaction_date: string;
          transaction_type: 'setor' | 'tarik';
          amount: number;
          category: string | null;
          description: string | null;
          officer: string | null;
          legacy_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          student_id: string;
          class_id: string;
          transaction_date?: string;
          transaction_type: 'setor' | 'tarik';
          amount: number;
          category?: string | null;
          description?: string | null;
          officer?: string | null;
          legacy_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          student_id?: string;
          class_id?: string;
          transaction_date?: string;
          transaction_type?: 'setor' | 'tarik';
          amount?: number;
          category?: string | null;
          description?: string | null;
          officer?: string | null;
          legacy_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      public_shares: {
        Row: {
          id: string;
          teacher_id: string;
          class_id: string;
          share_type: 'absensi' | 'nilai' | 'tabungan';
          token: string;
          payload: Json;
          is_active: boolean;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          class_id: string;
          share_type: 'absensi' | 'nilai' | 'tabungan';
          token: string;
          payload?: Json;
          is_active?: boolean;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          class_id?: string;
          share_type?: 'absensi' | 'nilai' | 'tabungan';
          token?: string;
          payload?: Json;
          is_active?: boolean;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      get_public_share: {
        Args: {
          p_token: string;
          p_share_type: string;
        };
        Returns: Json;
      };
    };
  };
}
