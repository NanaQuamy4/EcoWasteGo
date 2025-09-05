-- Create the missing update_specific_recycler_availability function
-- This function was dropped when we disabled the automatic busy system
-- but some parts of the app still try to call it

CREATE OR REPLACE FUNCTION update_specific_recycler_availability(recycler_id_param UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- This function now does nothing since we disabled automatic busy system
  -- Recyclers have full manual control over their availability
  -- Just log that it was called (for debugging)
  RAISE NOTICE 'update_specific_recycler_availability called for recycler: %', recycler_id_param;
  
  -- No automatic updates - recyclers control their own availability
  RETURN;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_specific_recycler_availability(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_specific_recycler_availability(UUID) TO anon;

-- Test the function
SELECT 'Testing update_specific_recycler_availability function...' as info;
SELECT update_specific_recycler_availability('e9e096bf-7c7b-4338-a619-124d7ae699b6'::UUID);

-- Success message
SELECT '✅ update_specific_recycler_availability function created (no-op version)!' as result;
