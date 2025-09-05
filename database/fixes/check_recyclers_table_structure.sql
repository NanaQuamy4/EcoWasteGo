-- Check the actual column types in the recyclers table
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'recyclers' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
