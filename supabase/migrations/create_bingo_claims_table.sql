-- Create table for tracking bingo card claim submissions
CREATE TABLE bingo_claims (
    id BIGSERIAL PRIMARY KEY,
    claim_ref TEXT UNIQUE NOT NULL,
    card_id TEXT NOT NULL,
    proof_code TEXT NOT NULL,
    claimant_name TEXT NOT NULL,
    claimant_email TEXT NOT NULL,
    winning_marks TEXT[] NOT NULL,
    card_file_name TEXT NOT NULL,
    card_url TEXT NOT NULL,
    has_attachment BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'verified', 'rejected', 'awarded')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_bingo_claims_claim_ref ON bingo_claims(claim_ref);
CREATE INDEX idx_bingo_claims_card_id ON bingo_claims(card_id);
CREATE INDEX idx_bingo_claims_email ON bingo_claims(claimant_email);
CREATE INDEX idx_bingo_claims_status ON bingo_claims(status);
CREATE INDEX idx_bingo_claims_submitted_at ON bingo_claims(submitted_at);

-- Add Row Level Security (RLS)
ALTER TABLE bingo_claims ENABLE ROW LEVEL SECURITY;

-- Create policy for service role (Edge Functions) to insert and select
CREATE POLICY "Service role can manage bingo_claims" ON bingo_claims
    FOR ALL USING (auth.role() = 'service_role');

-- Create policy for authenticated users to view their own claims
CREATE POLICY "Users can view their own claims" ON bingo_claims
    FOR SELECT USING (claimant_email = auth.jwt() ->> 'email');

-- Create policy for admins to view all claims (you'll need to set up admin role)
-- CREATE POLICY "Admins can view all claims" ON bingo_claims
--     FOR ALL USING (auth.jwt() ->> 'user_role' = 'admin');

-- Add comments for documentation
COMMENT ON TABLE bingo_claims IS 'Stores bingo card winning claim submissions';
COMMENT ON COLUMN bingo_claims.claim_ref IS 'Unique claim reference ID generated for each submission';
COMMENT ON COLUMN bingo_claims.card_id IS 'CID of the bingo card being claimed';
COMMENT ON COLUMN bingo_claims.proof_code IS 'HMAC proof code validating the card authenticity';
COMMENT ON COLUMN bingo_claims.winning_marks IS 'Array of marked squares that form the winning pattern';
COMMENT ON COLUMN bingo_claims.card_file_name IS 'File name of the uploaded card image in storage';
COMMENT ON COLUMN bingo_claims.card_url IS 'Public URL of the uploaded card image';
COMMENT ON COLUMN bingo_claims.status IS 'Current status of the claim processing';
