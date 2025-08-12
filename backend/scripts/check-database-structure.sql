-- Database Structure Diagnostic Script
-- This script will show us what tables and columns actually exist

-- =====================================================
-- 1. CHECK WHAT TABLES EXIST
-- =====================================================

-- Show all tables in the public schema
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- =====================================================
-- 2. CHECK WASTE_COLLECTIONS TABLE STRUCTURE
-- =====================================================

-- Check if waste_collections table exists and show its structure
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'waste_collections') THEN
        RAISE NOTICE 'waste_collections table EXISTS';
        
        -- Show all columns in waste_collections
        RAISE NOTICE 'Columns in waste_collections:';
        FOR col_rec IN 
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'waste_collections' 
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE 'Column: %, Type: %, Nullable: %, Default: %', 
                col_rec.column_name, col_rec.data_type, col_rec.is_nullable, col_rec.column_default;
        END LOOP;
    ELSE
        RAISE NOTICE 'waste_collections table does NOT exist';
    END IF;
END $$;

-- =====================================================
-- 3. CHECK USERS TABLE STRUCTURE
-- =====================================================

-- Check if users table exists and show its structure
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE NOTICE 'users table EXISTS';
        
        -- Show all columns in users
        RAISE NOTICE 'Columns in users:';
        FOR col_rec IN 
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE 'Column: %, Type: %, Nullable: %, Default: %', 
                col_rec.column_name, col_rec.data_type, col_rec.is_nullable, col_rec.column_default;
        END LOOP;
    ELSE
        RAISE NOTICE 'users table does NOT exist';
    END IF;
END $$;

-- =====================================================
-- 4. CHECK CHAT_MESSAGES TABLE STRUCTURE
-- =====================================================

-- Check if chat_messages table exists and show its structure
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
        RAISE NOTICE 'chat_messages table EXISTS';
        
        -- Show all columns in chat_messages
        RAISE NOTICE 'Columns in chat_messages:';
        FOR col_rec IN 
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'chat_messages' 
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE 'Column: %, Type: %, Nullable: %, Default: %', 
                col_rec.column_name, col_rec.data_type, col_rec.is_nullable, col_rec.column_default;
        END LOOP;
    ELSE
        RAISE NOTICE 'chat_messages table does NOT exist';
    END IF;
END $$;

-- =====================================================
-- 5. CHECK RECYCLERS TABLE STRUCTURE
-- =====================================================

-- Check if recyclers table exists and show its structure
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recyclers') THEN
        RAISE NOTICE 'recyclers table EXISTS';
        
        -- Show all columns in recyclers
        RAISE NOTICE 'Columns in recyclers:';
        FOR col_rec IN 
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'recyclers' 
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE 'Column: %, Type: %, Nullable: %, Default: %', 
                col_rec.column_name, col_rec.data_type, col_rec.is_nullable, col_rec.column_default;
        END LOOP;
    ELSE
        RAISE NOTICE 'recyclers table does NOT exist';
    END IF;
END $$;

-- =====================================================
-- 6. SHOW ALL TABLES WITH THEIR PRIMARY KEYS
-- =====================================================

-- Show all tables and their primary key columns
SELECT 
    t.table_name,
    c.column_name as primary_key_column,
    c.data_type as primary_key_type
FROM information_schema.tables t
LEFT JOIN information_schema.table_constraints tc ON t.table_name = tc.table_name
LEFT JOIN information_schema.key_column_usage c ON tc.constraint_name = c.constraint_name
WHERE t.schemaname = 'public' 
    AND tc.constraint_type = 'PRIMARY KEY'
ORDER BY t.table_name;

-- =====================================================
-- 7. SHOW ALL FOREIGN KEY RELATIONSHIPS
-- =====================================================

-- Show all foreign key relationships
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
-- 8. SUMMARY OF EXISTING STRUCTURE
-- =====================================================

-- Count tables by category
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
