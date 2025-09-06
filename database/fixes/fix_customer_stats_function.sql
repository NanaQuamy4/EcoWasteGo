-- Fix get_customer_total_stats function to return correct data types
-- This fixes the "Returned type bigint does not match expected type numeric" error

-- Drop and recreate the function with proper type casting
-- Using CREATE OR REPLACE to handle existing function
CREATE OR REPLACE FUNCTION get_customer_total_stats(p_customer_id UUID)
RETURNS TABLE (
  total_points INTEGER,
  total_pickups INTEGER,
  total_weight_kg DECIMAL(8,2),
  total_co2_saved DECIMAL(8,2),
  total_trees_equivalent DECIMAL(8,2),
  total_landfill_saved DECIMAL(8,2),
  total_energy_saved DECIMAL(8,2),
  average_points_per_pickup DECIMAL(8,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(ce.total_points), 0)::INTEGER as total_points,
    COUNT(*)::INTEGER as total_pickups,
    COALESCE(SUM(ce.weight_kg), 0) as total_weight_kg,
    COALESCE(SUM(ce.co2_saved), 0) as total_co2_saved,
    COALESCE(SUM(ce.trees_equivalent), 0) as total_trees_equivalent,
    COALESCE(SUM(ce.landfill_space_saved), 0) as total_landfill_saved,
    COALESCE(SUM(ce.energy_saved), 0) as total_energy_saved,
    CASE 
      WHEN COUNT(*) > 0 THEN (COALESCE(SUM(ce.total_points), 0)::DECIMAL / COUNT(*)::DECIMAL)::DECIMAL(8,2)
      ELSE 0::DECIMAL(8,2)
    END as average_points_per_pickup
  FROM customer_earnings ce
  WHERE ce.customer_id = p_customer_id
  AND ce.status = 'completed';
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_customer_total_stats TO authenticated;

-- Test the function to ensure it works
DO $$
DECLARE
  test_result RECORD;
BEGIN
  -- Test with a dummy UUID to check if function returns correct types
  SELECT * INTO test_result FROM get_customer_total_stats('00000000-0000-0000-0000-000000000000');
  
  RAISE NOTICE 'Function test completed successfully';
  RAISE NOTICE 'Total points type: %', pg_typeof(test_result.total_points);
  RAISE NOTICE 'Average points type: %', pg_typeof(test_result.average_points_per_pickup);
END $$;
