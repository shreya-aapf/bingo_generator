-- Migration: Create winning_claims table
-- Description: Store winning bingo card claims with full name, email, and file link
-- Created: 2025-11-17

-- Create winning_claims table
CREATE TABLE IF NOT EXISTS public.winning_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  claim_ref TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Metadata fields
  image_type TEXT,
  file_size_bytes INTEGER,
  
  -- Validation
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_winning_claims_email ON public.winning_claims(email);
CREATE INDEX IF NOT EXISTS idx_winning_claims_claim_ref ON public.winning_claims(claim_ref);
CREATE INDEX IF NOT EXISTS idx_winning_claims_submitted_at ON public.winning_claims(submitted_at DESC);

-- Enable Row Level Security
ALTER TABLE public.winning_claims ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow anyone to insert (for submissions)
CREATE POLICY "Allow public inserts" ON public.winning_claims
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow service role to read all
CREATE POLICY "Allow service role to read all" ON public.winning_claims
  FOR SELECT
  TO service_role
  USING (true);

-- Allow authenticated users to read their own submissions
CREATE POLICY "Allow users to read their own submissions" ON public.winning_claims
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt() ->> 'email');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_winning_claims_updated_at
  BEFORE UPDATE ON public.winning_claims
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE public.winning_claims IS 'Stores winning bingo card claim submissions with file references';
COMMENT ON COLUMN public.winning_claims.claim_ref IS 'Unique claim reference identifier';
COMMENT ON COLUMN public.winning_claims.full_name IS 'Full name of the person claiming the prize';
COMMENT ON COLUMN public.winning_claims.email IS 'Email address of the claimant';
COMMENT ON COLUMN public.winning_claims.file_url IS 'Public URL to the uploaded winning card image';
COMMENT ON COLUMN public.winning_claims.file_path IS 'Storage bucket path to the file';
COMMENT ON COLUMN public.winning_claims.submitted_at IS 'When the claim was submitted by the user';

