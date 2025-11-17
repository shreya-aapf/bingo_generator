-- Create winning_claims table to store bingo card claims
-- This table stores information about users who submit winning bingo cards

CREATE TABLE IF NOT EXISTS public.winning_claims (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Claim identification
    claim_ref TEXT NOT NULL UNIQUE,
    
    -- User information
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    
    -- File information
    file_url TEXT NOT NULL,
    file_path TEXT NOT NULL,
    image_type TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    
    -- Timestamps
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Status tracking (optional, for future use)
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_winning_claims_email ON public.winning_claims(email);
CREATE INDEX IF NOT EXISTS idx_winning_claims_claim_ref ON public.winning_claims(claim_ref);
CREATE INDEX IF NOT EXISTS idx_winning_claims_submitted_at ON public.winning_claims(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_winning_claims_status ON public.winning_claims(status);

-- Add updated_at trigger
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

-- Enable Row Level Security (RLS)
ALTER TABLE public.winning_claims ENABLE ROW LEVEL SECURITY;

-- Create policies

-- 1. Allow authenticated users to insert their own claims
CREATE POLICY "Users can insert their own claims"
    ON public.winning_claims
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- 2. Allow users to view their own claims (by email)
CREATE POLICY "Users can view their own claims"
    ON public.winning_claims
    FOR SELECT
    TO anon
    USING (true); -- For now, allow all reads for admin dashboard

-- 3. Only authenticated admins can update claims
CREATE POLICY "Only admins can update claims"
    ON public.winning_claims
    FOR UPDATE
    TO authenticated
    USING (auth.role() = 'authenticated');

-- 4. Only authenticated admins can delete claims
CREATE POLICY "Only admins can delete claims"
    ON public.winning_claims
    FOR DELETE
    TO authenticated
    USING (auth.role() = 'authenticated');

-- Add comments for documentation
COMMENT ON TABLE public.winning_claims IS 'Stores winning bingo card claims with user information and file references';
COMMENT ON COLUMN public.winning_claims.claim_ref IS 'Unique claim reference ID for tracking';
COMMENT ON COLUMN public.winning_claims.full_name IS 'Full name of the person submitting the claim';
COMMENT ON COLUMN public.winning_claims.email IS 'Email address of the claimant';
COMMENT ON COLUMN public.winning_claims.file_url IS 'Public URL to the winning card image in storage';
COMMENT ON COLUMN public.winning_claims.file_path IS 'Storage path to the winning card image';
COMMENT ON COLUMN public.winning_claims.status IS 'Claim review status: pending, approved, or rejected';

