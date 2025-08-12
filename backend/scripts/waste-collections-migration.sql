-- EcoWasteGo Waste Collections Table Enhancement
-- Copy and paste this entire script into your Supabase SQL Editor

-- Add missing fields to waste_collections table for better status tracking
ALTER TABLE waste_collections ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE waste_collections ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE waste_collections ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE waste_collections ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE waste_collections ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE waste_collections ADD COLUMN IF NOT EXISTS actual_weight DECIMAL(10,2);
ALTER TABLE waste_collections ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add indexes for better performance on status-based queries
CREATE INDEX IF NOT EXISTS idx_waste_collections_status ON waste_collections(status);
CREATE INDEX IF NOT EXISTS idx_waste_collections_customer_id ON waste_collections(customer_id);
CREATE INDEX IF NOT EXISTS idx_waste_collections_recycler_id ON waste_collections(recycler_id);
CREATE INDEX IF NOT EXISTS idx_waste_collections_created_at ON waste_collections(created_at);

-- Add constraint to ensure valid status values
ALTER TABLE waste_collections ADD CONSTRAINT IF NOT EXISTS check_waste_collection_status 
CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled'));

-- Create view for pending waste collections (for recyclers)
CREATE OR REPLACE VIEW pending_waste_collections AS
SELECT 
    wc.id,
    wc.customer_id,
    wc.waste_type,
    wc.weight,
    wc.description,
    wc.pickup_address,
    wc.pickup_notes,
    wc.created_at,
    u.email as customer_email,
    u.username as customer_name,
    u.phone as customer_phone
FROM waste_collections wc
JOIN users u ON wc.customer_id = u.id
WHERE wc.status = 'pending'
AND u.status = 'active';

-- Create view for active waste collections (for recyclers)
CREATE OR REPLACE VIEW active_waste_collections AS
SELECT 
    wc.id,
    wc.customer_id,
    wc.recycler_id,
    wc.waste_type,
    wc.weight,
    wc.description,
    wc.pickup_address,
    wc.pickup_notes,
    wc.status,
    wc.accepted_at,
    wc.started_at,
    wc.created_at,
    u.email as customer_email,
    u.username as customer_name,
    u.phone as customer_phone
FROM waste_collections wc
JOIN users u ON wc.customer_id = u.id
WHERE wc.status IN ('accepted', 'in_progress')
AND u.status = 'active';

-- Create view for completed waste collections (for analytics)
CREATE OR REPLACE VIEW completed_waste_collections AS
SELECT 
    wc.id,
    wc.customer_id,
    wc.recycler_id,
    wc.waste_type,
    wc.weight,
    wc.actual_weight,
    wc.description,
    wc.pickup_address,
    wc.notes,
    wc.status,
    wc.created_at,
    wc.accepted_at,
    wc.started_at,
    wc.completed_at,
    u.email as customer_email,
    u.username as customer_name,
    u.phone as customer_phone
FROM waste_collections wc
JOIN users u ON wc.customer_id = u.id
WHERE wc.status = 'completed'
AND u.status = 'active';

-- Add comments for documentation
COMMENT ON COLUMN waste_collections.rejection_reason IS 'Reason provided when a waste collection request is rejected';
COMMENT ON COLUMN waste_collections.accepted_at IS 'Timestamp when the waste collection was accepted by a recycler';
COMMENT ON COLUMN waste_collections.started_at IS 'Timestamp when the waste collection pickup started';
COMMENT ON COLUMN waste_collections.completed_at IS 'Timestamp when the waste collection was completed';
COMMENT ON COLUMN waste_collections.cancelled_at IS 'Timestamp when the waste collection was cancelled';
COMMENT ON COLUMN waste_collections.actual_weight IS 'Actual weight collected (may differ from estimated weight)';
COMMENT ON COLUMN waste_collections.notes IS 'Additional notes from recycler about the collection';

-- Update existing records to have default values for new columns
UPDATE waste_collections SET 
    rejection_reason = NULL,
    accepted_at = NULL,
    started_at = NULL,
    completed_at = NULL,
    cancelled_at = NULL,
    actual_weight = NULL,
    notes = NULL
WHERE rejection_reason IS NULL;

PRINT 'Waste Collections table enhancement completed successfully!';
