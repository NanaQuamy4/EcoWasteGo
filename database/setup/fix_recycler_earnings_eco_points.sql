-- Fix Recycler Earnings Table - Add Missing Eco Points Column
-- This script adds the missing eco_points_earned column and fixes the table structure

-- 1. Add missing eco_points_earned column if it doesn't exist
DO $$
BEGIN
    -- Check if eco_points_earned column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recycler_earnings' 
        AND column_name = 'eco_points_earned'
    ) THEN
        -- Add the missing column
        ALTER TABLE recycler_earnings 
        ADD COLUMN eco_points_earned INTEGER NOT NULL DEFAULT 0;
        
        RAISE NOTICE 'Added eco_points_earned column to recycler_earnings table';
    ELSE
        RAISE NOTICE 'eco_points_earned column already exists';
    END IF;
END $$;

-- 2. Add other missing columns if they don't exist
DO $$
BEGIN
    -- Add points_per_kg column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recycler_earnings' 
        AND column_name = 'points_per_kg'
    ) THEN
        ALTER TABLE recycler_earnings 
        ADD COLUMN points_per_kg DECIMAL(5,2) DEFAULT 1.0;
        RAISE NOTICE 'Added points_per_kg column';
    END IF;

    -- Add bonus_points column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recycler_earnings' 
        AND column_name = 'bonus_points'
    ) THEN
        ALTER TABLE recycler_earnings 
        ADD COLUMN bonus_points INTEGER DEFAULT 0;
        RAISE NOTICE 'Added bonus_points column';
    END IF;
END $$;

-- 3. Update existing records to have eco points calculated
UPDATE recycler_earnings 
SET eco_points_earned = CASE 
    WHEN waste_type ILIKE '%electronic%' OR waste_type ILIKE '%e-waste%' THEN 
        FLOOR(CAST(REPLACE(weight, ' kg', '') AS DECIMAL) * 2)
    WHEN waste_type ILIKE '%plastic%' THEN 
        FLOOR(CAST(REPLACE(weight, ' kg', '') AS DECIMAL) * 1.5)
    WHEN waste_type ILIKE '%paper%' THEN 
        FLOOR(CAST(REPLACE(weight, ' kg', '') AS DECIMAL) * 1.2)
    ELSE 
        FLOOR(CAST(REPLACE(weight, ' kg', '') AS DECIMAL) * 1.0)
END
WHERE eco_points_earned = 0;

-- 4. Create index on eco_points_earned for better performance
CREATE INDEX IF NOT EXISTS idx_recycler_earnings_eco_points ON recycler_earnings(eco_points_earned);

-- 5. Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'recycler_earnings' 
ORDER BY ordinal_position;

-- 6. Show updated records
SELECT 
    id,
    waste_type,
    weight,
    eco_points_earned,
    points_per_kg,
    bonus_points
FROM recycler_earnings 
LIMIT 5;
