-- EcoWasteGo Database Optimization Script
-- Run this in your Supabase SQL Editor for performance improvements

-- =============================================================================
-- DATABASE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(verification_status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Waste collections table indexes
CREATE INDEX IF NOT EXISTS idx_waste_collections_customer_id ON waste_collections(customer_id);
CREATE INDEX IF NOT EXISTS idx_waste_collections_recycler_id ON waste_collections(recycler_id);
CREATE INDEX IF NOT EXISTS idx_waste_collections_status ON waste_collections(status);
CREATE INDEX IF NOT EXISTS idx_waste_collections_waste_type ON waste_collections(waste_type);
CREATE INDEX IF NOT EXISTS idx_waste_collections_created_at ON waste_collections(created_at);
CREATE INDEX IF NOT EXISTS idx_waste_collections_pickup_address ON waste_collections(pickup_address);
CREATE INDEX IF NOT EXISTS idx_waste_collections_location ON waste_collections USING GIST (
  ST_SetSRID(ST_MakePoint(pickup_longitude, pickup_latitude), 4326)
);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_waste_collections_customer_status ON waste_collections(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_waste_collections_recycler_status ON waste_collections(recycler_id, status);
CREATE INDEX IF NOT EXISTS idx_waste_collections_type_status ON waste_collections(waste_type, status);

-- Payments table indexes
CREATE INDEX IF NOT EXISTS idx_payments_collection_id ON payments(collection_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_amount ON payments(amount);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Recycler profiles table indexes
CREATE INDEX IF NOT EXISTS idx_recycler_profiles_user_id ON recycler_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_recycler_profiles_verification_status ON recycler_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_recycler_profiles_location ON recycler_profiles USING GIST (
  ST_SetSRID(ST_MakePoint(business_longitude, business_latitude), 4326)
);

-- Tracking sessions table indexes
CREATE INDEX IF NOT EXISTS idx_tracking_sessions_collection_id ON tracking_sessions(collection_id);
CREATE INDEX IF NOT EXISTS idx_tracking_sessions_status ON tracking_sessions(status);
CREATE INDEX IF NOT EXISTS idx_tracking_sessions_created_at ON tracking_sessions(created_at);

-- =============================================================================
-- QUERY OPTIMIZATION VIEWS
-- =============================================================================

-- View for recycler availability with distance calculation
CREATE OR REPLACE VIEW recycler_availability_view AS
SELECT 
  rp.id,
  rp.user_id,
  u.username,
  u.phone,
  rp.company_name,
  rp.business_location,
  rp.business_latitude,
  rp.business_longitude,
  rp.verification_status,
  rp.rating,
  rp.total_collections,
  rp.available_resources,
  rp.areas_of_operation,
  rp.is_available,
  rp.last_active,
  u.created_at,
  -- Calculate distance from a given point (will be parameterized in queries)
  ST_Distance(
    ST_SetSRID(ST_MakePoint(rp.business_longitude, rp.business_latitude), 4326)::geography,
    ST_SetSRID(ST_MakePoint(0, 0), 4326)::geography
  ) as distance_meters
FROM recycler_profiles rp
JOIN users u ON rp.user_id = u.id
WHERE u.role = 'recycler' 
  AND u.status = 'active'
  AND u.verification_status = 'verified'
  AND rp.is_available = true;

-- View for waste collection statistics
CREATE OR REPLACE VIEW waste_collection_stats_view AS
SELECT 
  customer_id,
  COUNT(*) as total_collections,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_collections,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_collections,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_collections,
  SUM(CASE WHEN status = 'completed' THEN weight ELSE 0 END) as total_weight_kg,
  AVG(CASE WHEN status = 'completed' THEN weight ELSE NULL END) as avg_weight_kg,
  MAX(created_at) as last_collection_date
FROM waste_collections
GROUP BY customer_id;

-- View for recycler performance metrics
CREATE OR REPLACE VIEW recycler_performance_view AS
SELECT 
  rp.user_id,
  rp.company_name,
  COUNT(wc.id) as total_collections_handled,
  COUNT(CASE WHEN wc.status = 'completed' THEN 1 END) as completed_collections,
  COUNT(CASE WHEN wc.status = 'cancelled' THEN 1 END) as cancelled_collections,
  AVG(CASE WHEN wc.status = 'completed' THEN 
    EXTRACT(EPOCH FROM (wc.updated_at - wc.created_at))/3600 
  END) as avg_completion_time_hours,
  SUM(CASE WHEN wc.status = 'completed' THEN wc.weight ELSE 0 END) as total_weight_processed,
  rp.rating,
  rp.total_collections
FROM recycler_profiles rp
LEFT JOIN waste_collections wc ON rp.user_id = wc.recycler_id
GROUP BY rp.user_id, rp.company_name, rp.rating, rp.total_collections;

-- =============================================================================
-- MATERIALIZED VIEWS FOR HEAVY ANALYTICS
-- =============================================================================

-- Materialized view for daily waste collection analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_waste_analytics AS
SELECT 
  DATE(created_at) as collection_date,
  waste_type,
  status,
  COUNT(*) as collection_count,
  SUM(weight) as total_weight,
  AVG(weight) as avg_weight,
  COUNT(DISTINCT customer_id) as unique_customers,
  COUNT(DISTINCT recycler_id) as unique_recyclers
FROM waste_collections
GROUP BY DATE(created_at), waste_type, status
ORDER BY collection_date DESC, waste_type, status;

-- Materialized view for monthly recycler earnings
CREATE MATERIALIZED VIEW IF NOT EXISTS monthly_recycler_earnings AS
SELECT 
  DATE_TRUNC('month', p.created_at) as month,
  wc.recycler_id,
  u.username as recycler_name,
  COUNT(wc.id) as collections_completed,
  SUM(p.amount) as total_earnings,
  AVG(p.amount) as avg_earnings_per_collection,
  SUM(wc.weight) as total_weight_processed
FROM payments p
JOIN waste_collections wc ON p.collection_id = wc.id
JOIN users u ON wc.recycler_id = u.id
WHERE p.status = 'completed' AND wc.status = 'completed'
GROUP BY DATE_TRUNC('month', p.created_at), wc.recycler_id, u.username
ORDER BY month DESC, total_earnings DESC;

-- =============================================================================
-- PERFORMANCE MONITORING FUNCTIONS
-- =============================================================================

-- Function to get slow queries
CREATE OR REPLACE FUNCTION get_slow_queries(threshold_ms INTEGER DEFAULT 1000)
RETURNS TABLE (
  query_text TEXT,
  execution_time_ms NUMERIC,
  calls BIGINT,
  total_time_ms NUMERIC,
  mean_time_ms NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    query::TEXT as query_text,
    ROUND(mean_exec_time::NUMERIC, 2) as execution_time_ms,
    calls,
    ROUND(total_exec_time::NUMERIC, 2) as total_time_ms,
    ROUND(mean_exec_time::NUMERIC, 2) as mean_time_ms
  FROM pg_stat_statements
  WHERE mean_exec_time > threshold_ms
  ORDER BY mean_exec_time DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get table sizes
CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE (
  table_name TEXT,
  table_size TEXT,
  index_size TEXT,
  total_size TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname||'.'||tablename as table_name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get index usage statistics
CREATE OR REPLACE FUNCTION get_index_usage_stats()
RETURNS TABLE (
  index_name TEXT,
  table_name TEXT,
  index_scans BIGINT,
  index_tuples_read BIGINT,
  index_tuples_fetched BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.relname as index_name,
    t.relname as table_name,
    s.idx_scan as index_scans,
    s.idx_tup_read as index_tuples_read,
    s.idx_tup_fetch as index_tuples_fetched
  FROM pg_stat_user_indexes s
  JOIN pg_index i ON s.indexrelid = i.indexrelid
  JOIN pg_class t ON s.relid = t.oid
  ORDER BY s.idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- AUTOMATIC MAINTENANCE
-- =============================================================================

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW daily_waste_analytics;
  REFRESH MATERIALIZED VIEW monthly_recycler_earnings;
  
  -- Log the refresh
  INSERT INTO system_logs (action, details, created_at)
  VALUES ('materialized_view_refresh', 'Daily and monthly analytics views refreshed', NOW());
END;
$$ LANGUAGE plpgsql;

-- Function to analyze tables for query planner optimization
CREATE OR REPLACE FUNCTION analyze_all_tables()
RETURNS VOID AS $$
DECLARE
  table_record RECORD;
BEGIN
  FOR table_record IN 
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE 'ANALYZE ' || table_record.tablename;
  END LOOP;
  
  -- Log the analysis
  INSERT INTO system_logs (action, details, created_at)
  VALUES ('table_analysis', 'All tables analyzed for query planner optimization', NOW());
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SCHEDULED MAINTENANCE (requires pg_cron extension)
-- =============================================================================

-- Uncomment these if you have pg_cron extension installed
-- SELECT cron.schedule('refresh-analytics', '0 2 * * *', 'SELECT refresh_materialized_views();');
-- SELECT cron.schedule('analyze-tables', '0 3 * * 0', 'SELECT analyze_all_tables();');

-- =============================================================================
-- QUERY OPTIMIZATION RECOMMENDATIONS
-- =============================================================================

-- 1. Use the materialized views for heavy analytics queries
-- 2. Use the recycler_availability_view with ST_DWithin for location-based queries
-- 3. Use the performance views for dashboard data
-- 4. Run analyze_all_tables() weekly for query planner optimization
-- 5. Monitor slow queries with get_slow_queries()
-- 6. Check table sizes with get_table_sizes()
-- 7. Monitor index usage with get_index_usage_stats()

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check if indexes were created
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check if views were created
SELECT 
  schemaname,
  viewname,
  definition
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;

-- Check if materialized views were created
SELECT 
  schemaname,
  matviewname,
  definition
FROM pg_matviews
WHERE schemaname = 'public'
ORDER BY matviewname;

-- Check if functions were created
SELECT 
  proname,
  prosrc
FROM pg_proc
WHERE proname IN ('get_slow_queries', 'get_table_sizes', 'get_index_usage_stats', 'refresh_materialized_views', 'analyze_all_tables'); 