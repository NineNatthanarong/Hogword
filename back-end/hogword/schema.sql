-- Create table for tracking user practice attempts
CREATE TABLE public.practice_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    word TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    sentence TEXT, -- Can be null if word is just generated but not attempted yet
    score NUMERIC,
    level TEXT,
    suggestion TEXT,
    corrected_sentence TEXT,
    status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'resigned', 'skipped')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying analytics faster
CREATE INDEX idx_practice_logs_user_id ON public.practice_logs(user_id);
CREATE INDEX idx_practice_logs_created_at ON public.practice_logs(created_at);

-- Create table specifically for tracking current state to avoid complex queries on logs
-- This is an optimization for /api/word?state=fetch
CREATE TABLE public.user_state (
    user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
    current_log_id UUID REFERENCES public.practice_logs(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies (Row Level Security) - Basic setup
-- Enable RLS
ALTER TABLE public.practice_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_state ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own logs
CREATE POLICY "Users can view their own logs" ON public.practice_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own logs" ON public.practice_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own logs" ON public.practice_logs
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only manage their own state
CREATE POLICY "Users can view their own state" ON public.user_state
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own state" ON public.user_state
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own state" ON public.user_state
    FOR UPDATE USING (auth.uid() = user_id);
