-- ============================================================
-- FlowState — Phase 5 Analytics Prep Database Schema
-- Run this in the Supabase SQL Editor for your project
-- ============================================================

-- Create the focus_sessions table
CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id     UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  duration    INTEGER NOT NULL, -- Duration logged in seconds
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own sessions
CREATE POLICY "Users can view own focus sessions"
  ON public.focus_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can perfectly log their own sessions
CREATE POLICY "Users can insert own focus sessions"
  ON public.focus_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Explicitly allow authenticated users to hit the table
GRANT SELECT, INSERT ON public.focus_sessions TO authenticated;
