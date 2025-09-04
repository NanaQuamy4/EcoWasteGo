-- Disable the automatic availability trigger to give recyclers full manual control
-- This allows recyclers to manually control their online/offline status without
-- the system automatically setting them to "busy" based on pending requests

-- Drop the trigger that automatically updates availability
DROP TRIGGER IF EXISTS trigger_update_recycler_availability ON pickup_requests;

-- Drop the trigger function as well
DROP FUNCTION IF EXISTS trigger_update_recycler_availability() CASCADE;

-- Also drop the update_recycler_availability function that was being called by the trigger
DROP FUNCTION IF EXISTS update_recycler_availability() CASCADE;

-- Verify the trigger is gone
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_recycler_availability';

-- Check if any functions still exist
SELECT 
  proname, 
  prokind 
FROM pg_proc 
WHERE proname IN ('trigger_update_recycler_availability', 'update_recycler_availability');

-- Set all online recyclers to available (manual control)
UPDATE public.recyclers 
SET 
  is_available = true,
  updated_at = NOW()
WHERE 
  is_online = true 
  AND verification_status = 'approved';

-- Verify the changes
SELECT 
  id, 
  full_name, 
  is_online, 
  is_available, 
  verification_status,
  heartbeat_at
FROM public.recyclers 
WHERE is_online = true;

RAISE NOTICE 'Automatic availability trigger disabled. Recyclers now have full manual control over their availability status.';
