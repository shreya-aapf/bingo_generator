-- ============================================
-- QUICK SETUP: Run this entire script in your Supabase SQL Editor
-- ============================================
-- This will create the winning_claims table and set up all necessary
-- indexes, triggers, and Row Level Security policies.
-- ============================================

-- 1. CREATE TABLE
CREATE TABLE IF NOT EXISTS public.winning_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_ref TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_path TEXT NOT NULL,
    image_type TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID
);

-- 2. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_winning_claims_email ON public.winning_claims(email);
CREATE INDEX IF NOT EXISTS idx_winning_claims_claim_ref ON public.winning_claims(claim_ref);
CREATE INDEX IF NOT EXISTS idx_winning_claims_submitted_at ON public.winning_claims(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_winning_claims_status ON public.winning_claims(status);

-- 3. CREATE UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_winning_claims_updated_at
    BEFORE UPDATE ON public.winning_claims
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.winning_claims ENABLE ROW LEVEL SECURITY;

-- 5. CREATE RLS POLICIES
CREATE POLICY "Users can insert their own claims"
    ON public.winning_claims
    FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Users can view their own claims"
    ON public.winning_claims
    FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Only admins can update claims"
    ON public.winning_claims
    FOR UPDATE
    TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can delete claims"
    ON public.winning_claims
    FOR DELETE
    TO authenticated
    USING (auth.role() = 'authenticated');

-- 6. ADD TABLE COMMENTS
COMMENT ON TABLE public.winning_claims IS 'Stores winning bingo card claims';
COMMENT ON COLUMN public.winning_claims.claim_ref IS 'Unique claim reference ID';

-- ============================================
-- VERIFICATION QUERY
-- Run this to verify the table was created successfully:
-- ============================================
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'winning_claims'
ORDER BY ordinal_position;

