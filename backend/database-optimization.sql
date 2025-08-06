-- Database Performance Optimization Scripts for EcoWasteGo
-- This script creates indexes, optimizes queries, and improves database performance

-- ============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_role_email_verified ON users(role, email_verified);

-- Waste collections table indexes
CREATE INDEX IF NOT EXISTS idx_waste_collections_customer_id ON waste_collections(customer_id);
CREATE INDEX IF NOT EXISTS idx_waste_collections_recycler_id ON waste_collections(recycler_id);
CREATE INDEX IF NOT EXISTS idx_waste_collections_status ON waste_collections(status);
CREATE INDEX IF NOT EXISTS idx_waste_collections_created_at ON waste_collections(created_at);
CREATE INDEX IF NOT EXISTS idx_waste_collections_customer_status ON waste_collections(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_waste_collections_recycler_status ON waste_collections(recycler_id, status);
CREATE INDEX IF NOT EXISTS idx_waste_collections_pending ON waste_collections(status) WHERE status = 'pending';

-- Payments table indexes
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_recycler_id ON payments(recycler_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_collection_id ON payments(collection_id);

-- Recycler profiles table indexes
CREATE INDEX IF NOT EXISTS idx_recycler_profiles_user_id ON recycler_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_recycler_profiles_is_verified ON recycler_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_recycler_profiles_is_available ON recycler_profiles(is_available);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- ============================================================================
-- PARTIAL INDEXES FOR COMMON QUERIES
-- ============================================================================

-- Partial index for verified recyclers
CREATE INDEX IF NOT EXISTS idx_users_verified_recyclers ON users(created_at) 
WHERE role = 'recycler' AND email_verified = true;

-- Partial index for pending collections
CREATE INDEX IF NOT EXISTS idx_waste_collections_pending_only ON waste_collections(created_at) 
WHERE status = 'pending';

-- Partial index for completed collections
CREATE INDEX IF NOT EXISTS idx_waste_collections_completed_only ON waste_collections(created_at) 
WHERE status = 'completed';

-- ============================================================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ============================================================================

-- Composite index for user collections with status
CREATE INDEX IF NOT EXISTS idx_waste_collections_user_status_created ON waste_collections(customer_id, status, created_at);

-- Composite index for recycler collections with status
CREATE INDEX IF NOT EXISTS idx_waste_collections_recycler_status_created ON waste_collections(recycler_id, status, created_at);

-- Composite index for user analytics
CREATE INDEX IF NOT EXISTS idx_waste_collections_user_analytics ON waste_collections(customer_id, status, waste_type, created_at);

-- ============================================================================
-- FULL-TEXT SEARCH INDEXES
-- ============================================================================

-- Full-text search for recycler names and descriptions
CREATE INDEX IF NOT EXISTS idx_users_username_fts ON users USING gin(to_tsvector('english', username));

-- Full-text search for waste collection descriptions
CREATE INDEX IF NOT EXISTS idx_waste_collections_description_fts ON waste_collections USING gin(to_tsvector('english', description));

-- ============================================================================
-- STATISTICS AND ANALYTICS OPTIMIZATION
-- ============================================================================

-- Create materialized view for user statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS user_statistics AS
SELECT 
    u.id,
    u.role,
    COUNT(wc.id) as total_collections,
    COUNT(CASE WHEN wc.status = 'completed' THEN 1 END) as completed_collections,
    SUM(CASE WHEN wc.status = 'completed' THEN wc.weight ELSE 0 END) as total_weight,
    AVG(CASE WHEN wc.status = 'completed' THEN wc.weight END) as avg_weight,
    COUNT(DISTINCT wc.waste_type) as waste_types_handled,
    MAX(wc.created_at) as last_collection_date
FROM users u
LEFT JOIN waste_collections wc ON u.id = wc.customer_id OR u.id = wc.recycler_id
GROUP BY u.id, u.role;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_user_statistics_role ON user_statistics(role);
CREATE INDEX IF NOT EXISTS idx_user_statistics_total_collections ON user_statistics(total_collections);

-- ============================================================================
-- QUERY OPTIMIZATION FUNCTIONS
-- ============================================================================

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_user_statistics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW user_statistics;
END;
$$ LANGUAGE plpgsql;

-- Function to get optimized user profile
CREATE OR REPLACE FUNCTION get_user_profile_optimized(user_uuid UUID)
RETURNS TABLE(
    id UUID,
    email TEXT,
    username TEXT,
    role TEXT,
    email_verified BOOLEAN,
    created_at TIMESTAMP,
    total_collections BIGINT,
    completed_collections BIGINT,
    total_weight NUMERIC,
    avg_weight NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.username,
        u.role,
        u.email_verified,
        u.created_at,
        COALESCE(us.total_collections, 0),
        COALESCE(us.completed_collections, 0),
        COALESCE(us.total_weight, 0),
        COALESCE(us.avg_weight, 0)
    FROM users u
    LEFT JOIN user_statistics us ON u.id = us.id
    WHERE u.id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to get optimized recycler list
CREATE OR REPLACE FUNCTION get_recyclers_optimized(
    page_num INTEGER DEFAULT 1,
    page_size INTEGER DEFAULT 10,
    search_term TEXT DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    username TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    profile_image TEXT,
    created_at TIMESTAMP,
    total_collections BIGINT,
    completed_collections BIGINT,
    avg_rating NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.username,
        u.phone,
        u.address,
        u.city,
        u.state,
        u.profile_image,
        u.created_at,
        COALESCE(us.total_collections, 0),
        COALESCE(us.completed_collections, 0),
        COALESCE(rp.rating, 0)
    FROM users u
    LEFT JOIN user_statistics us ON u.id = us.id
    LEFT JOIN recycler_profiles rp ON u.id = rp.user_id
    WHERE u.role = 'recycler' 
    AND u.email_verified = true
    AND (search_term IS NULL OR u.username ILIKE '%' || search_term || '%')
    ORDER BY u.created_at DESC
    LIMIT page_size
    OFFSET (page_num - 1) * page_size;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PERFORMANCE MONITORING VIEWS
-- ============================================================================

-- View for slow queries (requires pg_stat_statements extension)
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
WHERE mean_time > 1000  -- Queries taking more than 1 second
ORDER BY mean_time DESC;

-- View for table statistics
CREATE OR REPLACE VIEW table_statistics AS
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public'
ORDER BY tablename, attname;

-- ============================================================================
-- MAINTENANCE SCRIPTS
-- ============================================================================

-- Function to update table statistics
CREATE OR REPLACE FUNCTION update_table_statistics()
RETURNS void AS $$
BEGIN
    ANALYZE users;
    ANALYZE waste_collections;
    ANALYZE payments;
    ANALYZE recycler_profiles;
    ANALYZE notifications;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Delete notifications older than 90 days
    DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Archive completed collections older than 1 year
    -- (This would require an archive table)
    
    -- Update statistics
    PERFORM update_table_statistics();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PERFORMANCE CONFIGURATION
-- ============================================================================

-- Set work_mem for better query performance
-- ALTER SYSTEM SET work_mem = '256MB';

-- Set shared_buffers for better caching
-- ALTER SYSTEM SET shared_buffers = '256MB';

-- Set effective_cache_size
-- ALTER SYSTEM SET effective_cache_size = '1GB';

-- Enable parallel queries
-- ALTER SYSTEM SET max_parallel_workers_per_gather = 2;
-- ALTER SYSTEM SET max_parallel_workers = 4;

-- ============================================================================
-- MONITORING QUERIES
-- ============================================================================

-- Query to check index usage
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- ORDER BY idx_scan DESC;

-- Query to check table sizes
-- SELECT 
--     schemaname,
--     tablename,
--     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
-- FROM pg_tables 
-- WHERE schemaname = 'public'
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Query to check cache hit ratio
-- SELECT 
--     sum(heap_blks_read) as heap_read,
--     sum(heap_blks_hit)  as heap_hit,
--     sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
-- FROM pg_statio_user_tables;

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON INDEX idx_users_email IS 'Optimizes user lookup by email';
COMMENT ON INDEX idx_waste_collections_customer_status ON waste_collections IS 'Optimizes customer collection queries with status filter';
COMMENT ON INDEX idx_waste_collections_pending ON waste_collections IS 'Optimizes pending collection queries';
COMMENT ON MATERIALIZED VIEW user_statistics IS 'Pre-computed user statistics for faster analytics';
COMMENT ON FUNCTION get_user_profile_optimized IS 'Optimized user profile query with statistics';
COMMENT ON FUNCTION get_recyclers_optimized IS 'Optimized recycler list with pagination and search';

-- ============================================================================
-- EXECUTION NOTES
-- ============================================================================

/*
To apply these optimizations:

1. Run this script on your database:
   psql -d your_database -f database-optimization.sql

2. Schedule regular maintenance:
   - Refresh materialized views: SELECT refresh_user_statistics();
   - Update statistics: SELECT update_table_statistics();
   - Cleanup old data: SELECT cleanup_old_data();

3. Monitor performance:
   - Check slow queries: SELECT * FROM slow_queries;
   - Monitor cache hit ratio
   - Watch index usage statistics

4. Consider additional optimizations:
   - Partition large tables by date
   - Use read replicas for analytics
   - Implement connection pooling
   - Add Redis caching layer
*/ 