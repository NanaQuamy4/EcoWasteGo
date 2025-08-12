-- Simple Database Structure Check
-- This script will show us what tables and columns actually exist

-- =====================================================
-- 1. SHOW ALL TABLES IN PUBLIC SCHEMA
-- =====================================================

SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- =====================================================
-- 2. CHECK IF KEY TABLES EXIST
-- =====================================================

SELECT 
    t.table_name,
    CASE WHEN it.table_name IS NOT NULL THEN 'EXISTS' ELSE 'DOES NOT EXIST' END as status
FROM (
    SELECT 'waste_collections' as table_name
    UNION ALL SELECT 'users'
    UNION ALL SELECT 'recyclers'
    UNION ALL SELECT 'chat_messages'
    UNION ALL SELECT 'payment_summaries'
    UNION ALL SELECT 'notifications'
    UNION ALL SELECT 'rejected_recyclers'
) t
LEFT JOIN information_schema.tables it ON it.table_name = t.table_name
WHERE it.schemaname = 'public' OR it.schemaname IS NULL
ORDER BY t.table_name;

-- =====================================================
-- 3. SHOW COLUMNS FOR WASTE_COLLECTIONS (if it exists)
-- =====================================================

SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'waste_collections' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- 4. SHOW COLUMNS FOR USERS (if it exists)
-- =====================================================

SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- 5. SHOW COLUMNS FOR CHAT_MESSAGES (if it exists)
-- =====================================================

SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'chat_messages' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- 6. SHOW COLUMNS FOR RECYCLERS (if it exists)
-- =====================================================

SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'recyclers' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- 7. SHOW PRIMARY KEYS FOR ALL TABLES
-- =====================================================

SELECT 
    t.table_name,
    c.column_name as primary_key_column,
    c.data_type as primary_key_type
FROM information_schema.tables t
LEFT JOIN information_schema.table_constraints tc ON t.table_name = tc.table_name
LEFT JOIN information_schema.key_column_usage c ON tc.constraint_name = c.constraint_name
WHERE t.schemaname = 'public' 
    AND (tc.constraint_type = 'PRIMARY KEY' OR tc.constraint_type IS NULL)
ORDER BY t.table_name, tc.constraint_type;

-- =====================================================
-- 8. SHOW FOREIGN KEY RELATIONSHIPS
-- =====================================================

SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- 9. COUNT TABLES BY CATEGORY
-- =====================================================

SELECT 
    CASE 
        WHEN table_name LIKE '%user%' OR table_name LIKE '%auth%' THEN 'Authentication/Users'
        WHEN table_name LIKE '%waste%' OR table_name LIKE '%collection%' THEN 'Waste Management'
        WHEN table_name LIKE '%recycler%' THEN 'Recycler Management'
        WHEN table_name LIKE '%chat%' OR table_name LIKE '%message%' THEN 'Communication'
        WHEN table_name LIKE '%payment%' OR table_name LIKE '%summary%' THEN 'Payment'
        WHEN table_name LIKE '%notification%' THEN 'Notifications'
        ELSE 'Other'
    END as table_category,
    COUNT(*) as table_count,
    STRING_AGG(table_name, ', ') as table_names
FROM information_schema.tables 
WHERE schemaname = 'public'
GROUP BY 
    CASE 
        WHEN table_name LIKE '%user%' OR table_name LIKE '%auth%' THEN 'Authentication/Users'
        WHEN table_name LIKE '%waste%' OR table_name LIKE '%collection%' THEN 'Waste Management'
        WHEN table_name LIKE '%recycler%' THEN 'Recycler Management'
        WHEN table_name LIKE '%chat%' OR table_name LIKE '%message%' THEN 'Communication'
        WHEN table_name LIKE '%payment%' OR table_name LIKE '%summary%' THEN 'Payment'
        WHEN table_name LIKE '%notification%' THEN 'Notifications'
        ELSE 'Other'
    END
ORDER BY table_category;
