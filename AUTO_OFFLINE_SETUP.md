# Auto-Offline Setup Guide

Since `pg_cron` is not available in your Supabase instance, here are alternative ways to set up automatic offline functionality for inactive recyclers.

## Option 1: App-Based Auto-Offline (Recommended - Already Implemented)

The system now includes an app-based auto-offline manager that runs when the app is active:

- ✅ **Already implemented** in `hooks/useAutoOfflineManager.ts`
- ✅ **Automatically started** when recycler app is active
- ✅ **Runs every minute** to check for inactive recyclers
- ✅ **Stops when app goes to background** to save battery

**No additional setup required** - this works out of the box!

## Option 2: External Cron Service

If you want a server-side solution that runs independently of the app, you can use external cron services:

### A. Vercel Cron Jobs

1. **Deploy the API endpoint** (`api/auto-offline-cron.ts`) to Vercel
2. **Add to `vercel.json`**:
```json
{
  "crons": [
    {
      "path": "/api/auto-offline-cron",
      "schedule": "* * * * *"
    }
  ]
}
```

### B. GitHub Actions

Create `.github/workflows/auto-offline.yml`:
```yaml
name: Auto-Offline Recyclers
on:
  schedule:
    - cron: '* * * * *'  # Every minute
  workflow_dispatch:

jobs:
  auto-offline:
    runs-on: ubuntu-latest
    steps:
      - name: Call Auto-Offline API
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET_TOKEN }}" \
            https://your-app.vercel.app/api/auto-offline-cron
```

### C. External Cron Service

Use services like:
- **Cron-job.org** (free)
- **EasyCron** (paid)
- **SetCronJob** (paid)

Set up a job to call your API endpoint every minute.

## Option 3: Manual Testing

You can manually test the auto-offline functionality:

```sql
-- Test the function directly in Supabase SQL Editor
SELECT auto_set_inactive_recyclers_offline();
```

## Environment Variables

For external cron services, add these environment variables:

```env
# Required for API endpoint
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CRON_SECRET_TOKEN=your_secret_token
```

## How It Works

1. **Heartbeat System**: Recyclers send heartbeat every 30 seconds when app is active
2. **Auto-Offline Check**: Every minute, the system checks for recyclers who haven't sent heartbeat in 5+ minutes
3. **Status Update**: Inactive recyclers are automatically set to offline and unavailable
4. **Real-time Updates**: All status changes are reflected in real-time across the app

## Monitoring

Check the auto-offline functionality:

```sql
-- View recent auto-offline notifications
SELECT * FROM admin_notifications 
WHERE type = 'system' 
AND title = 'Auto-Offline Update'
ORDER BY created_at DESC;

-- Check recycler online status
SELECT 
  full_name,
  is_online,
  is_available,
  heartbeat_at,
  last_seen_at
FROM recyclers 
WHERE verification_status = 'approved'
ORDER BY heartbeat_at DESC;
```

## Recommendation

**Use Option 1 (App-Based)** as it's already implemented and works reliably. The app-based solution is more efficient and doesn't require external services or additional costs.

The external cron options are useful if you want a backup system or if you need the auto-offline to work even when no recycler apps are active.
