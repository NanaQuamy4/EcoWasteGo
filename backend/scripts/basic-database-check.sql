-- Basic Database Structure Check
-- Simple queries to see what exists

-- =====================================================
-- 1. SHOW ALL TABLES (SIMPLE)
-- =====================================================

SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- =====================================================
-- 2. CHECK SPECIFIC TABLES ONE BY ONE
-- =====================================================

-- Check if waste_collections exists
SELECT 'waste_collections' as table_name, 
       CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'waste_collections' AND schemaname = 'public') 
            THEN 'EXISTS' 
            ELSE 'DOES NOT EXIST' 
       END as status;

-- Check if users exists
SELECT 'users' as table_name, 
       CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users' AND schemaname = 'public') 
            THEN 'EXISTS' 
            ELSE 'DOES NOT EXIST' 
       END as status;

-- Check if recyclers exists
SELECT 'recyclers' as table_name, 
       CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'recyclers' AND schemaname = 'public') 
            THEN 'EXISTS' 
            ELSE 'DOES NOT EXIST' 
       END as status;

-- Check if chat_messages exists
SELECT 'chat_messages' as table_name, 
       CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'chat_messages' AND schemaname = 'public') 
            THEN 'EXISTS' 
            ELSE 'DOES NOT EXIST' 
       END as status;

-- =====================================================
-- 3. SHOW COLUMNS FOR EXISTING TABLES
-- =====================================================

-- If waste_collections exists, show its columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'waste_collections' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- If users exists, show its columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- If recyclers exists, show its columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'recyclers' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- If chat_messages exists, show its columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'chat_messages' 
    AND table_schema = 'public'
ORDER BY ordinal_position;
