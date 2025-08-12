-- Chat Messages Migration for EcoWasteGo
-- This script creates the chat_messages table for real-time communication

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pickup_id UUID NOT NULL REFERENCES waste_collections(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('customer', 'recycler')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_pickup_id ON chat_messages(pickup_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_type ON chat_messages(sender_type);

-- Create composite index for pickup_id and created_at (for ordering)
CREATE INDEX IF NOT EXISTS idx_chat_messages_pickup_created ON chat_messages(pickup_id, created_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chat_messages_updated_at 
    BEFORE UPDATE ON chat_messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for unread message counts
CREATE OR REPLACE VIEW unread_message_counts AS
SELECT 
    pickup_id,
    sender_id,
    COUNT(*) as unread_count
FROM chat_messages 
WHERE is_read = FALSE 
GROUP BY pickup_id, sender_id;

-- Insert some sample message suggestions (optional)
INSERT INTO chat_messages (pickup_id, sender_id, sender_type, message) VALUES
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'recycler', 'Hi! I''m on my way to collect your waste.'),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'recycler', 'I''ve arrived at your location.'),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'recycler', 'Please have your waste ready for pickup.'),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'customer', 'I''m ready for pickup.'),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'customer', 'Please call when you arrive.'),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'customer', 'I have additional waste to add.')
ON CONFLICT DO NOTHING;

-- Grant permissions (adjust based on your Supabase setup)
-- GRANT ALL ON chat_messages TO authenticated;
-- GRANT ALL ON unread_message_counts TO authenticated;

-- Enable Row Level Security (RLS) for Supabase
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

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

-- Create function to mark messages as read
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

-- Grant execute permission on the function
-- GRANT EXECUTE ON FUNCTION mark_messages_as_read(UUID, UUID) TO authenticated;

COMMENT ON TABLE chat_messages IS 'Stores chat messages between customers and recyclers for waste pickups';
COMMENT ON COLUMN chat_messages.pickup_id IS 'Reference to the waste collection request';
COMMENT ON COLUMN chat_messages.sender_id IS 'ID of the user sending the message';
COMMENT ON COLUMN chat_messages.sender_type IS 'Type of sender: customer or recycler';
COMMENT ON COLUMN chat_messages.message IS 'The actual message content';
COMMENT ON COLUMN chat_messages.is_read IS 'Whether the message has been read by the recipient';
