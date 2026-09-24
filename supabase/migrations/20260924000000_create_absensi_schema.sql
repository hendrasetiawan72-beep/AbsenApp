-- ==============================================================================
-- SUPABASE POSTGRESQL IDEMPOTENT MIGRATION SCHEMA FOR ABSENAPP
-- Application: SIM Presensi, Nilai & Tabungan Siswa SMK Muhammadiyah Bawang
-- Architecture: Supabase Auth, PostgreSQL 15+, RLS, UUID, Indices, RPC Functions
-- ==============================================================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. HELPER FUNCTION: updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. TABLE: PROFILES (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'teacher',
  school_id TEXT DEFAULT 'SMK Muhammadiyah Bawang',
  school_name TEXT DEFAULT 'SMK Muhammadiyah Bawang',
  nip TEXT DEFAULT '-',
  nbm TEXT DEFAULT '-',
  main_subject TEXT DEFAULT 'Bahasa Inggris',
  academic_year TEXT DEFAULT '2026/2027',
  semester TEXT DEFAULT 'Ganjil',
  avatar_url TEXT DEFAULT '',
  active_class_id TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 3. TABLE: CLASSES
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  academic_year TEXT NOT NULL DEFAULT '2026/2027',
  major TEXT NOT NULL DEFAULT '',
  grade_level TEXT DEFAULT '',
  kkm NUMERIC NOT NULL DEFAULT 75,
  notes TEXT DEFAULT '',
  legacy_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_legacy_id ON public.classes(legacy_id);

-- 4. TABLE: STUDENTS
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  nis TEXT DEFAULT '',
  nisn TEXT DEFAULT '',
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('L', 'P')) DEFAULT 'L',
  birth_place TEXT DEFAULT '',
  birth_date DATE,
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  parent_name TEXT DEFAULT '',
  attendance_number INTEGER,
  notes TEXT DEFAULT '',
  legacy_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_class_id ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_legacy_id ON public.students(legacy_id);
CREATE INDEX IF NOT EXISTS idx_students_nisn ON public.students(nisn);

-- 5. TABLE: ATTENDANCE_SESSIONS
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subject TEXT NOT NULL DEFAULT '',
  meeting_number INTEGER DEFAULT 1,
  notes TEXT DEFAULT '',
  legacy_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_class_id ON public.attendance_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_teacher_id ON public.attendance_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date ON public.attendance_sessions(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_legacy_id ON public.attendance_sessions(legacy_id);

-- 6. TABLE: ATTENDANCE_RECORDS
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('H', 'S', 'I', 'A', 'D')) DEFAULT 'H',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_session_student UNIQUE (session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_records_session_id ON public.attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON public.attendance_records(student_id);

-- 7. TABLE: GRADE_HEADERS
CREATE TABLE IF NOT EXISTS public.grade_headers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  semester TEXT DEFAULT 'Ganjil',
  academic_year TEXT DEFAULT '2026/2027',
  category TEXT DEFAULT 'formatif',
  weight NUMERIC DEFAULT 1,
  max_score NUMERIC DEFAULT 100,
  order_index INTEGER DEFAULT 0,
  legacy_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grade_headers_class_id ON public.grade_headers(class_id);
CREATE INDEX IF NOT EXISTS idx_grade_headers_teacher_id ON public.grade_headers(teacher_id);

-- 8. TABLE: GRADES
CREATE TABLE IF NOT EXISTS public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_header_id UUID NOT NULL REFERENCES public.grade_headers(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  value NUMERIC,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_header_student UNIQUE (grade_header_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_grades_header_id ON public.grades(grade_header_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON public.grades(student_id);

-- 8b. TABLE: STUDENT_GRADES_SUMMARY (Direct mapping of 10-assessment columns formatif 1-8, STS, SAS)
CREATE TABLE IF NOT EXISTS public.student_grades_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  formatif1 NUMERIC,
  formatif2 NUMERIC,
  formatif3 NUMERIC,
  formatif4 NUMERIC,
  formatif5 NUMERIC,
  formatif6 NUMERIC,
  formatif7 NUMERIC,
  formatif8 NUMERIC,
  sumatif_tengah NUMERIC,
  sumatif_akhir NUMERIC,
  tugas1 NUMERIC,
  tugas2 NUMERIC,
  tugas3 NUMERIC,
  uts NUMERIC,
  uas NUMERIC,
  praktik NUMERIC,
  notes TEXT DEFAULT '',
  legacy_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_summary_student UNIQUE (student_id)
);

CREATE INDEX IF NOT EXISTS idx_grades_summary_class_id ON public.student_grades_summary(class_id);
CREATE INDEX IF NOT EXISTS idx_grades_summary_student_id ON public.student_grades_summary(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_summary_legacy_id ON public.student_grades_summary(legacy_id);

-- 9. TABLE: TEACHING_AGENDAS
CREATE TABLE IF NOT EXISTS public.teaching_agendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  agenda_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subject TEXT DEFAULT '',
  material TEXT DEFAULT '',
  activity TEXT DEFAULT '',
  attendance_count INTEGER DEFAULT 0,
  absent_count INTEGER DEFAULT 0,
  hours_range TEXT DEFAULT '',
  hours_array JSONB DEFAULT '[]'::jsonb,
  notes TEXT DEFAULT '',
  legacy_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teaching_agendas_teacher_id ON public.teaching_agendas(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teaching_agendas_class_id ON public.teaching_agendas(class_id);
CREATE INDEX IF NOT EXISTS idx_teaching_agendas_date ON public.teaching_agendas(agenda_date);
CREATE INDEX IF NOT EXISTS idx_teaching_agendas_legacy_id ON public.teaching_agendas(legacy_id);

-- 10. TABLE: SAVINGS (Tabungan Siswa)
CREATE TABLE IF NOT EXISTS public.savings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('setor', 'tarik')),
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  category TEXT DEFAULT 'harian',
  description TEXT DEFAULT '',
  officer TEXT DEFAULT 'Wali Kelas',
  legacy_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_savings_teacher_id ON public.savings(teacher_id);
CREATE INDEX IF NOT EXISTS idx_savings_student_id ON public.savings(student_id);
CREATE INDEX IF NOT EXISTS idx_savings_class_id ON public.savings(class_id);
CREATE INDEX IF NOT EXISTS idx_savings_date ON public.savings(transaction_date);
CREATE INDEX IF NOT EXISTS idx_savings_legacy_id ON public.savings(legacy_id);

-- 11. TABLE: PUBLIC_SHARES (Snapshot publik aman untuk orang tua/siswa)
CREATE TABLE IF NOT EXISTS public.public_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  share_type TEXT NOT NULL CHECK (share_type IN ('absensi', 'nilai', 'tabungan')),
  token TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_public_shares_token ON public.public_shares(token);
CREATE INDEX IF NOT EXISTS idx_public_shares_teacher_id ON public.public_shares(teacher_id);
CREATE INDEX IF NOT EXISTS idx_public_shares_class_type ON public.public_shares(class_id, share_type);

-- 12. TRIGGERS FOR updated_at
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN (
      'profiles', 'classes', 'students', 'attendance_sessions',
      'attendance_records', 'grade_headers', 'grades', 'student_grades_summary',
      'teaching_agendas', 'savings', 'public_shares'
    )
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_update_timestamp_%I ON public.%I;
      CREATE TRIGGER trg_update_timestamp_%I
      BEFORE UPDATE ON public.%I
      FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
    ', t, t, t, t);
  END LOOP;
END $$;

-- 13. AUTOMATIC PROFILE CREATION TRIGGER FROM auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, school_id, school_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'teacher',
    'SMK Muhammadiyah Bawang',
    'SMK Muhammadiyah Bawang'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 14. SECURE RPC FUNCTION: get_public_share
CREATE OR REPLACE FUNCTION public.get_public_share(p_token TEXT, p_share_type TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT payload INTO v_result
  FROM public.public_shares
  WHERE token = p_token
    AND share_type = p_share_type
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW());

  IF v_result IS NULL THEN
    RETURN jsonb_build_object(
      'error', 'Data share publik tidak ditemukan atau tautan telah kedaluwarsa.',
      'found', false
    );
  END IF;

  RETURN jsonb_build_object(
    'found', true,
    'data', v_result
  );
END;
$$;

-- Grant execute on RPC function to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_public_share(TEXT, TEXT) TO anon, authenticated;

-- ==============================================================================
-- 15. ROW LEVEL SECURITY (RLS) POLICIES
-- Zero-Trust Attribute-Based Access Control: strict isolation per teacher
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_headers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_grades_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teaching_agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_shares ENABLE ROW LEVEL SECURITY;

-- 15a. PROFILES POLICIES
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- 15b. CLASSES POLICIES
DROP POLICY IF EXISTS "classes_all_own" ON public.classes;
CREATE POLICY "classes_all_own" ON public.classes
  FOR ALL TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- 15c. STUDENTS POLICIES
DROP POLICY IF EXISTS "students_all_own" ON public.students;
CREATE POLICY "students_all_own" ON public.students
  FOR ALL TO authenticated
  USING (class_id IN (SELECT id FROM public.classes WHERE teacher_id = auth.uid()))
  WITH CHECK (class_id IN (SELECT id FROM public.classes WHERE teacher_id = auth.uid()));

-- 15d. ATTENDANCE_SESSIONS POLICIES
DROP POLICY IF EXISTS "attendance_sessions_all_own" ON public.attendance_sessions;
CREATE POLICY "attendance_sessions_all_own" ON public.attendance_sessions
  FOR ALL TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- 15e. ATTENDANCE_RECORDS POLICIES
DROP POLICY IF EXISTS "attendance_records_all_own" ON public.attendance_records;
CREATE POLICY "attendance_records_all_own" ON public.attendance_records
  FOR ALL TO authenticated
  USING (session_id IN (SELECT id FROM public.attendance_sessions WHERE teacher_id = auth.uid()))
  WITH CHECK (session_id IN (SELECT id FROM public.attendance_sessions WHERE teacher_id = auth.uid()));

-- 15f. GRADE_HEADERS POLICIES
DROP POLICY IF EXISTS "grade_headers_all_own" ON public.grade_headers;
CREATE POLICY "grade_headers_all_own" ON public.grade_headers
  FOR ALL TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- 15g. GRADES POLICIES
DROP POLICY IF EXISTS "grades_all_own" ON public.grades;
CREATE POLICY "grades_all_own" ON public.grades
  FOR ALL TO authenticated
  USING (grade_header_id IN (SELECT id FROM public.grade_headers WHERE teacher_id = auth.uid()))
  WITH CHECK (grade_header_id IN (SELECT id FROM public.grade_headers WHERE teacher_id = auth.uid()));

-- 15h. STUDENT_GRADES_SUMMARY POLICIES
DROP POLICY IF EXISTS "grades_summary_all_own" ON public.student_grades_summary;
CREATE POLICY "grades_summary_all_own" ON public.student_grades_summary
  FOR ALL TO authenticated
  USING (class_id IN (SELECT id FROM public.classes WHERE teacher_id = auth.uid()))
  WITH CHECK (class_id IN (SELECT id FROM public.classes WHERE teacher_id = auth.uid()));

-- 15i. TEACHING_AGENDAS POLICIES
DROP POLICY IF EXISTS "teaching_agendas_all_own" ON public.teaching_agendas;
CREATE POLICY "teaching_agendas_all_own" ON public.teaching_agendas
  FOR ALL TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- 15j. SAVINGS POLICIES
DROP POLICY IF EXISTS "savings_all_own" ON public.savings;
CREATE POLICY "savings_all_own" ON public.savings
  FOR ALL TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- 15k. PUBLIC_SHARES POLICIES
-- Teachers have full CRUD over their own shares
DROP POLICY IF EXISTS "public_shares_teacher_crud" ON public.public_shares;
CREATE POLICY "public_shares_teacher_crud" ON public.public_shares
  FOR ALL TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- Anyone (anon and authenticated) can SELECT active, non-expired shares
DROP POLICY IF EXISTS "public_shares_anon_select" ON public.public_shares;
CREATE POLICY "public_shares_anon_select" ON public.public_shares
  FOR SELECT TO anon, authenticated
  USING (is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW()));
