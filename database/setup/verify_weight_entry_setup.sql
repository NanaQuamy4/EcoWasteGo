-- Verify Weight Entry Database Setup
-- Run this to check if everything is working correctly

-- 1. Check if tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('waste_collection_details', 'pricing_rates', 'collection_photos') 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('waste_collection_details', 'pricing_rates', 'collection_photos');

-- 2. Check if functions exist
SELECT 
    routine_name,
    CASE 
        WHEN routine_name IN ('calculate_collection_pricing', 'create_waste_collection') 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('calculate_collection_pricing', 'create_waste_collection');

-- 3. Check if view exists
SELECT 
    table_name,
    CASE 
        WHEN table_name = 'collection_summary' 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name = 'collection_summary';

-- 4. Check pricing rates data
SELECT 
    waste_type,
    quality_level,
    base_rate_per_kg,
    is_active
FROM pricing_rates 
WHERE is_active = true 
ORDER BY waste_type, quality_level
LIMIT 10;

-- 5. Test pricing calculation function
SELECT calculate_collection_pricing('plastic', 'good', 5.0) as test_pricing;

-- 6. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('waste_collection_details', 'pricing_rates', 'collection_photos')
ORDER BY tablename, policyname;

-- 7. Summary
SELECT 
    'Weight Entry Database Setup Verification' as check_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('waste_collection_details', 'pricing_rates', 'collection_photos')) = 3
        AND (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name IN ('calculate_collection_pricing', 'create_waste_collection')) = 2
        AND (SELECT COUNT(*) FROM information_schema.views WHERE table_name = 'collection_summary') = 1
        AND (SELECT COUNT(*) FROM pricing_rates WHERE is_active = true) > 0
        THEN '✅ ALL CHECKS PASSED - Ready for weight entry!'
        ELSE '❌ SOME CHECKS FAILED - Please review the setup'
    END as overall_status;
