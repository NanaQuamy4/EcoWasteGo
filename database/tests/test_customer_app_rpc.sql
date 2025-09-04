-- Test the exact RPC function that the customer app uses
SELECT * FROM get_available_recyclers_for_requests();

-- Test with a simpler query to see if the recycler meets all criteria
SELECT 
  r.id,
  r.full_name,
  r.phone,
  r.truck_size,
  r.rating,
  r.verification_status,
  r.is_available,
  r.is_online,
  r.heartbeat_at,
  (r.heartbeat_at > NOW() - INTERVAL '5 minutes') as heartbeat_recent,
  COALESCE(pending_counts.pending_count, 0) as pending_requests_count
FROM recyclers r
LEFT JOIN (
  SELECT 
    recycler_id,
    COUNT(*) as pending_count
  FROM pickup_requests 
  WHERE status IN ('accepted', 'in_progress', 'confirmed')
  GROUP BY recycler_id
) pending_counts ON r.id = pending_counts.recycler_id
WHERE r.email = 'nquamy7@gmail.com';

-- Check if the recycler meets all the RPC function criteria
SELECT 
  'verification_status = approved' as criteria,
  (verification_status = 'approved') as meets_criteria
FROM recyclers WHERE email = 'nquamy7@gmail.com'
UNION ALL
SELECT 
  'is_online = true' as criteria,
  (is_online = true) as meets_criteria
FROM recyclers WHERE email = 'nquamy7@gmail.com'
UNION ALL
SELECT 
  'is_available = true' as criteria,
  (is_available = true) as meets_criteria
FROM recyclers WHERE email = 'nquamy7@gmail.com'
UNION ALL
SELECT 
  'heartbeat_at > NOW() - INTERVAL 5 minutes' as criteria,
  (heartbeat_at > NOW() - INTERVAL '5 minutes') as meets_criteria
FROM recyclers WHERE email = 'nquamy7@gmail.com';
