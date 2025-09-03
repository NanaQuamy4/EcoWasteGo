/**
 * API endpoint for external cron services to call
 * This can be used with services like Vercel Cron, GitHub Actions, or any external cron service
 * 
 * Usage:
 * - Set up a cron job to call this endpoint every minute
 * - Example with Vercel Cron: https://vercel.com/docs/cron-jobs
 * - Example with GitHub Actions: https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Optional: Add authentication/authorization here
  // For example, check for a secret token in headers
  const authToken = req.headers.authorization;
  if (authToken !== `Bearer ${process.env.CRON_SECRET_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Call the auto-offline function
    const { data, error } = await supabase.rpc('auto_set_inactive_recyclers_offline');

    if (error) {
      console.error('Auto-offline cron error:', error);
      return res.status(500).json({ 
        error: 'Failed to run auto-offline check',
        details: error.message,
        code: error.code
      });
    }

    const offlineCount = data || 0;
    console.log(`Auto-offline cron completed. Set ${offlineCount} recyclers offline.`);

    return res.status(200).json({
      success: true,
      message: `Set ${offlineCount} inactive recyclers offline`,
      offline_count: offlineCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Auto-offline cron error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// For Vercel deployment
export const config = {
  api: {
    bodyParser: false,
  },
};
