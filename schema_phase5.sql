-- ============================================================
-- FlowState — Phase 5 Task Categorization Upgrade
-- Run this in the Supabase SQL Editor for your project
-- ============================================================

-- Alter the tasks table to support analytical categories
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Work' 
CHECK (category IN ('Work', 'Study', 'Personal', 'Health', 'Finance'));

-- NOTE: If you already have existing tasks, they will default to 'Work'.
