@echo off
echo ========================================
echo EcoWasteGo Complete System Test
echo ========================================
echo.

echo 1. Testing Database Functions...
echo --------------------------------
psql -h your-host -U your-user -d your-database -f database/tests/test_system_functions.sql

echo.
echo 2. Testing Database Performance...
echo ---------------------------------
psql -h your-host -U your-user -d your-database -f database/performance/fixed_messaging_check.sql

echo.
echo 3. Testing JavaScript Functions...
echo ----------------------------------
node tests/test_complete_system.js

echo.
echo 4. Testing Real-time Messaging...
echo ---------------------------------
node tests/test_realtime_messaging.js

echo.
echo ========================================
echo All tests completed!
echo ========================================
pause
