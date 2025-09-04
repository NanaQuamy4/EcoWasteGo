-- Test the RPC function directly to see if it returns the recycler
SELECT * FROM get_available_recyclers_for_requests();

-- Also test the online recyclers function for comparison
SELECT * FROM get_online_recyclers();
