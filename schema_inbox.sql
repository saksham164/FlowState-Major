-- ============================================================
-- FlowState — Phase 6 Inbox / Integrations Schema
-- Run this in the Supabase SQL Editor for your project
-- ============================================================

CREATE TABLE IF NOT EXISTS public.inbox_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    source TEXT NOT NULL, -- e.g., 'gmail', 'canvas', 'manual'
    original_text TEXT, -- Optional raw text of the email/message
    parsed_name TEXT NOT NULL,
    parsed_category TEXT DEFAULT 'Work',
    parsed_priority TEXT DEFAULT 'medium',
    parsed_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on RLS
ALTER TABLE public.inbox_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own inbox items
CREATE POLICY "Users can manage their own inbox items" 
ON public.inbox_items FOR ALL USING (auth.uid() = user_id);
