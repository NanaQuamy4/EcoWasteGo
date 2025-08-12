-- Fix Chat Messages Table Migration
-- This script adds missing columns to the existing chat_messages table

-- Check if sender_type column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_messages' 
        AND column_name = 'sender_type'
    ) THEN
        ALTER TABLE chat_messages ADD COLUMN sender_type VARCHAR(20);
        
        -- Update existing records with default sender_type based on existing data
        -- This assumes existing messages are from recyclers (you can adjust this logic)
        UPDATE chat_messages SET sender_type = 'recycler' WHERE sender_type IS NULL;
        
        -- Make the column NOT NULL after updating existing data
        ALTER TABLE chat_messages ALTER COLUMN sender_type SET NOT NULL;
        
        -- Add the CHECK constraint
        ALTER TABLE chat_messages ADD CONSTRAINT check_sender_type 
            CHECK (sender_type IN ('customer', 'recycler'));
    END IF;
END $$;

-- Check if is_read column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_messages' 
        AND column_name = 'is_read'
    ) THEN
        ALTER TABLE chat_messages ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Check if updated_at column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_messages' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE chat_messages ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_chat_messages_pickup_id ON chat_messages(pickup_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_type ON chat_messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_pickup_created ON chat_messages(pickup_id, created_at);

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists, then recreate it
DROP TRIGGER IF EXISTS update_chat_messages_updated_at ON chat_messages;
CREATE TRIGGER update_chat_messages_updated_at 
    BEFORE UPDATE ON chat_messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create or replace the unread_message_counts view
CREATE OR REPLACE VIEW unread_message_counts AS
SELECT 
    pickup_id,
    sender_id,
    COUNT(*) as unread_count
FROM chat_messages 
WHERE is_read = FALSE 
GROUP BY pickup_id, sender_id;

-- Create or replace the mark_messages_as_read function
CREATE OR REPLACE FUNCTION mark_messages_as_read(pickup_uuid UUID, user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE chat_messages 
    SET is_read = TRUE 
    WHERE pickup_id = pickup_uuid 
    AND sender_id != user_uuid 
    AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security if not already enabled
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate them
DROP POLICY IF EXISTS "Users can view messages for their pickups" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages for their pickups" ON chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;

-- Create RLS policies
CREATE POLICY "Users can view messages for their pickups" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM waste_collections 
            WHERE id = pickup_id 
            AND (customer_id = auth.uid() OR recycler_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert messages for their pickups" ON chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM waste_collections 
            WHERE id = pickup_id 
            AND (customer_id = auth.uid() OR recycler_id = auth.uid())
        )
    );

CREATE POLICY "Users can update their own messages" ON chat_messages
    FOR UPDATE USING (sender_id = auth.uid());

-- Add comments to the table and columns
COMMENT ON TABLE chat_messages IS 'Stores chat messages between customers and recyclers for waste pickups';
COMMENT ON COLUMN chat_messages.pickup_id IS 'Reference to the waste collection request';
COMMENT ON COLUMN chat_messages.sender_id IS 'ID of the user sending the message';
COMMENT ON COLUMN chat_messages.sender_type IS 'Type of sender: customer or recycler';
COMMENT ON COLUMN chat_messages.message IS 'The actual message content';
COMMENT ON COLUMN chat_messages.is_read IS 'Whether the message has been read by the recipient';

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON chat_messages TO authenticated;
GRANT SELECT ON unread_message_counts TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_read(UUID, UUID) TO authenticated;

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'chat_messages' 
ORDER BY ordinal_position;
