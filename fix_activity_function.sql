-- Fix get_recent_activity function to handle VARCHAR type mismatch
-- This script fixes the type mismatch error in the get_recent_activity function

-- Drop and recreate the function with proper type casting
DROP FUNCTION IF EXISTS get_recent_activity();

CREATE OR REPLACE FUNCTION get_recent_activity()
RETURNS TABLE (
    id UUID,
    type TEXT,
    description TEXT,
    activity_timestamp TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.type::TEXT,  -- Cast VARCHAR to TEXT
        n.title::TEXT as description,  -- Cast VARCHAR to TEXT
        n.created_at as activity_timestamp
    FROM notifications n
    ORDER BY n.created_at DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_recent_activity() TO authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'get_recent_activity function fixed successfully!' as status;
