import { createClient, SupabaseClient } from '@supabase/supabase-js';



export const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWFyZHNqdW14cXdzdGRvYW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMDg2NjQsImV4cCI6MjA2OTg4NDY2NH0.UB8PO1jD1ahbiMW43Ao5keVxChnOMSqohqminGZm7tg";
export const supabaseUrl = "https://esyardsjumxqwstdoaod.supabase.co";
export const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWFyZHNqdW14cXdzdGRvYW9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDMwODY2NCwiZXhwIjoyMDY5ODg0NjY0fQ.-4GmJBNR4vXGJSfU8m1HKfoRG52KY0_pDTQaEuVFHR8";

console.log(supabaseUrl, supabaseAnonKey, supabaseServiceKey);


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

// if ( (!isValidUrl(supabaseUrl) || !supabaseAnonKey )) {
//   console.error('❌ Invalid Supabase configuration detected!');
//   console.error('Current values:');
//   console.error(`  SUPABASE_URL: ${supabaseUrl}`);
//   console.error(`  SUPABASE_ANON_KEY: ${supabaseAnonKey ? '***' + supabaseAnonKey.slice(-4) : 'undefined'}`);
//   console.error('');
//   console.error('Please update your .env file with real Supabase credentials:');
//   console.error('1. Go to your Supabase project dashboard');
//   console.error('2. Copy your project URL and API keys');
//   console.error('3. Update the .env file with real values');
//   console.error('');
//   throw new Error('Invalid Supabase configuration. Please check your .env file.');
// }

// Create Supabase client with anon key for regular operations
export const supabase: SupabaseClient = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Create Supabase admin client with service role key for admin operations
export const supabaseAdmin: SupabaseClient | null = supabaseServiceKey 
  ? createClient(supabaseUrl || '', supabaseServiceKey)
  : null;
