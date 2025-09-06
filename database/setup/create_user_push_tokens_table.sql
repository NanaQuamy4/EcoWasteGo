-- Create table for storing user push notification tokens
CREATE TABLE IF NOT EXISTS user_push_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    push_token TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
    device_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one token per user per platform
    UNIQUE(user_id, platform)
);

-- Add RLS policies
ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only access their own push tokens
CREATE POLICY "Users can view own push tokens" ON user_push_tokens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push tokens" ON user_push_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push tokens" ON user_push_tokens
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own push tokens" ON user_push_tokens
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON user_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_platform ON user_push_tokens(platform);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_active ON user_push_tokens(is_active) WHERE is_active = TRUE;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_user_push_tokens_updated_at ON user_push_tokens;
CREATE TRIGGER trigger_update_user_push_tokens_updated_at
    BEFORE UPDATE ON user_push_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_user_push_tokens_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_push_tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_push_tokens TO anon;

-- Add comments
COMMENT ON TABLE user_push_tokens IS 'Stores push notification tokens for users to enable push notifications';
COMMENT ON COLUMN user_push_tokens.push_token IS 'Expo push token for sending notifications';
COMMENT ON COLUMN user_push_tokens.platform IS 'Platform the token is for (ios, android, web)';
COMMENT ON COLUMN user_push_tokens.is_active IS 'Whether the token is currently active and valid';
