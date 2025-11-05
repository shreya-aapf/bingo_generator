-- Create table for storing user-card mappings
-- This allows tracking which users generated which cards

CREATE TABLE IF NOT EXISTS user_card_mappings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id VARCHAR(12) NOT NULL, -- The bingo card CID
    user_name VARCHAR(255), -- Optional user name
    user_email VARCHAR(255), -- Optional user email
    session_id VARCHAR(255) NOT NULL, -- Session identifier
    user_agent TEXT, -- Browser/device information
    ip_address VARCHAR(45), -- IPv4 or IPv6 address
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}', -- Additional flexible data storage
    
    -- Indexes for common queries
    CONSTRAINT unique_card_session UNIQUE(card_id, session_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_card_mappings_card_id ON user_card_mappings(card_id);
CREATE INDEX IF NOT EXISTS idx_user_card_mappings_email ON user_card_mappings(user_email) WHERE user_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_card_mappings_session ON user_card_mappings(session_id);
CREATE INDEX IF NOT EXISTS idx_user_card_mappings_created_at ON user_card_mappings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_card_mappings_metadata ON user_card_mappings USING GIN(metadata);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_card_mappings_updated_at 
    BEFORE UPDATE ON user_card_mappings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) if needed
ALTER TABLE user_card_mappings ENABLE ROW LEVEL SECURITY;

-- Create policy for service role (full access)
CREATE POLICY "Service role can manage all mappings" ON user_card_mappings
    FOR ALL USING (auth.role() = 'service_role');

-- Create policy for authenticated users (can only see their own)
CREATE POLICY "Users can view their own mappings" ON user_card_mappings
    FOR SELECT USING (user_email = auth.jwt() ->> 'email');

-- Add comments for documentation
COMMENT ON TABLE user_card_mappings IS 'Stores mappings between users and their generated bingo cards';
COMMENT ON COLUMN user_card_mappings.card_id IS 'The 12-character bingo card identifier (CID)';
COMMENT ON COLUMN user_card_mappings.session_id IS 'Unique session identifier for tracking anonymous users';
COMMENT ON COLUMN user_card_mappings.metadata IS 'Flexible JSON storage for additional tracking data';

-- Optional: Create a view for analytics
CREATE VIEW user_card_analytics AS 
SELECT 
    DATE(created_at) as date,
    COUNT(*) as cards_generated,
    COUNT(DISTINCT user_email) FILTER (WHERE user_email IS NOT NULL) as unique_users_with_email,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(DISTINCT ip_address) as unique_ips
FROM user_card_mappings 
GROUP BY DATE(created_at)
ORDER BY date DESC;

COMMENT ON VIEW user_card_analytics IS 'Daily analytics for bingo card generation';
