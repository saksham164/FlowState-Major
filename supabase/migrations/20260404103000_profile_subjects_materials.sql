-- ============================================================
-- FlowState - Profile + Subject Folders + Subject Materials
-- ============================================================

-- Ensure user_rules exists (old migration file was empty)
CREATE TABLE IF NOT EXISTS public.user_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  target_category TEXT NOT NULL DEFAULT 'Work'
    CHECK (target_category IN ('Work', 'Study', 'Personal', 'Health', 'Finance')),
  target_priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (target_priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_rules ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_rules'
      AND policyname = 'Users can manage own rules'
  ) THEN
    CREATE POLICY "Users can manage own rules"
      ON public.user_rules
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_rules TO authenticated;

-- Add missing sender field for Gmail records
ALTER TABLE public.inbox_items
ADD COLUMN IF NOT EXISTS sender TEXT;

-- User profile details
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  institution TEXT,
  program TEXT,
  phone TEXT,
  semester INTEGER NOT NULL DEFAULT 1 CHECK (semester >= 1 AND semester <= 12),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS institution TEXT,
ADD COLUMN IF NOT EXISTS program TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_profiles'
      AND policyname = 'Users can manage own profile'
  ) THEN
    CREATE POLICY "Users can manage own profile"
      ON public.user_profiles
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;

-- Subject folders
CREATE TABLE IF NOT EXISTS public.subject_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  semester INTEGER NOT NULL DEFAULT 1 CHECK (semester >= 1 AND semester <= 12),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name)
);

ALTER TABLE public.subject_folders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'subject_folders'
      AND policyname = 'Users can manage own subject folders'
  ) THEN
    CREATE POLICY "Users can manage own subject folders"
      ON public.subject_folders
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subject_folders TO authenticated;

-- Subject material library (manual upload + Gmail routing)
CREATE TABLE IF NOT EXISTS public.subject_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subject_folders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  material_type TEXT NOT NULL DEFAULT 'note'
    CHECK (material_type IN ('note', 'assignment', 'resource', 'reference')),
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'upload', 'gmail', 'inbox')),
  file_url TEXT,
  notes TEXT,
  inbox_item_id UUID REFERENCES public.inbox_items(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subject_materials
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS inbox_item_id UUID REFERENCES public.inbox_items(id) ON DELETE SET NULL;

ALTER TABLE public.subject_materials ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'subject_materials'
      AND policyname = 'Users can manage own subject materials'
  ) THEN
    CREATE POLICY "Users can manage own subject materials"
      ON public.subject_materials
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subject_materials TO authenticated;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subject_materials_user_inbox_unique
ON public.subject_materials (user_id, inbox_item_id)
WHERE inbox_item_id IS NOT NULL;
