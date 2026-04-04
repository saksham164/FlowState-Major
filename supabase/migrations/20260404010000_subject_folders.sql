-- ============================================================
-- FlowState - Phase: User Profile + Semester Subject Folders
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  semester TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subject_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  semester TEXT,
  name TEXT NOT NULL,
  code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subject_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subject_folders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  material_type TEXT NOT NULL DEFAULT 'note' CHECK (material_type IN ('note', 'assignment', 'resource')),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'gmail', 'inbox')),
  file_url TEXT,
  notes TEXT,
  inbox_item_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, inbox_item_id)
);

ALTER TABLE public.inbox_items
ADD COLUMN IF NOT EXISTS sender TEXT;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile"
  ON public.user_profiles
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own subject folders"
  ON public.subject_folders
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own subject materials"
  ON public.subject_materials
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subject_folders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subject_materials TO authenticated;

