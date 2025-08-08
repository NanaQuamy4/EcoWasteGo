import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if we're in test mode
const isTestMode = supabaseUrl === 'https://test.supabase.co';

// Validate Supabase URL format
const isValidUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  if (url === 'your_supabase_project_url') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

if (!isTestMode && (!isValidUrl(supabaseUrl) || !supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key')) {
  console.error('❌ Invalid Supabase configuration detected!');
  console.error('Current values:');
  console.error(`  SUPABASE_URL: ${supabaseUrl}`);
  console.error(`  SUPABASE_ANON_KEY: ${supabaseAnonKey ? '***' + supabaseAnonKey.slice(-4) : 'undefined'}`);
  console.error('');
  console.error('Please update your .env file with real Supabase credentials:');
  console.error('1. Go to your Supabase project dashboard');
  console.error('2. Copy your project URL and API keys');
  console.error('3. Update the .env file with real values');
  console.error('');
  throw new Error('Invalid Supabase configuration. Please check your .env file.');
}

// Create Supabase client with anon key for regular operations
export const supabase: SupabaseClient = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Create Supabase admin client with service role key for admin operations
export const supabaseAdmin: SupabaseClient | null = supabaseServiceKey && supabaseServiceKey !== 'your_supabase_service_role_key'
  ? createClient(supabaseUrl || '', supabaseServiceKey)
  : null;
