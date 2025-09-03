-- Test the RPC function that the app uses to get available recyclers
SELECT * FROM get_available_recyclers_for_requests();

-- Also test the online recyclers function
SELECT * FROM get_online_recyclers();
