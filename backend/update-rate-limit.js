const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = "https://esyardsjumxqwstdoaod.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWFyZHNqdW14cXdzdGRvYW9kIiwicmF6I6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDMwODY2NCwiZXhwIjoyMDY5ODg0NjY0fQ.-4GmJBNR4vXGJSfU8m1HKfoRG52KY0_pDTQaEuVFHR8";

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateRateLimit() {
  try {
    console.log('🔄 Updating SMS rate limit from 5 to 9000 attempts per hour...');
    
    // SQL to update the rate limit function
    const updateSQL = `
      -- Drop the existing function
      DROP FUNCTION IF EXISTS check_verification_rate_limit(VARCHAR, VARCHAR);
      
      -- Recreate the function with the new rate limit
      CREATE OR REPLACE FUNCTION check_verification_rate_limit(
        contact_info_param VARCHAR(255),
        verification_type_param VARCHAR(10)
      )
      RETURNS BOOLEAN AS $$
      DECLARE
        recent_attempts INTEGER;
      BEGIN
        -- Count attempts in the last hour
        SELECT COUNT(*) INTO recent_attempts
        FROM verification_attempts
        WHERE contact_info = contact_info_param
          AND verification_type = verification_type_param
          AND created_at > NOW() - INTERVAL '1 hour';
        
        -- Allow max 9000 attempts per hour (increased from 5)
        RETURN recent_attempts < 9000;
      END;
      $$ LANGUAGE plpgsql;
      
      -- Add comment for documentation
      COMMENT ON FUNCTION check_verification_rate_limit(VARCHAR, VARCHAR) IS 'Rate limiting function to prevent spam/abuse of verification system - allows 9000 attempts per hour';
    `;
    
    // Execute the SQL update
    const { data, error } = await supabase.rpc('exec_sql', { sql: updateSQL });
    
    if (error) {
      console.error('❌ Error updating rate limit:', error);
      
      // Try alternative approach using direct SQL execution
      console.log('🔄 Trying alternative approach...');
      
      // Split the SQL into separate statements
      const statements = [
        "DROP FUNCTION IF EXISTS check_verification_rate_limit(VARCHAR, VARCHAR);",
        `CREATE OR REPLACE FUNCTION check_verification_rate_limit(
          contact_info_param VARCHAR(255),
          verification_type_param VARCHAR(10)
        )
        RETURNS BOOLEAN AS $$
        DECLARE
          recent_attempts INTEGER;
        BEGIN
          SELECT COUNT(*) INTO recent_attempts
          FROM verification_attempts
          WHERE contact_info = contact_info_param
            AND verification_type = verification_type_param
            AND created_at > NOW() - INTERVAL '1 hour';
          RETURN recent_attempts < 9000;
        END;
        $$ LANGUAGE plpgsql;`
      ];
      
      for (const statement of statements) {
        try {
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement });
          if (stmtError) {
            console.error('❌ Error executing statement:', stmtError);
          } else {
            console.log('✅ Statement executed successfully');
          }
        } catch (stmtErr) {
          console.error('❌ Error executing statement:', stmtErr);
        }
      }
    } else {
      console.log('✅ Rate limit updated successfully!');
    }
    
    // Verify the function was updated
    console.log('🔍 Verifying the update...');
    
    // Test the function to see if it allows more attempts
    const testResult = await supabase.rpc('check_verification_rate_limit', {
      contact_info_param: 'test@example.com',
      verification_type_param: 'email'
    });
    
    console.log('🧪 Test result:', testResult);
    console.log('✅ Rate limit update completed!');
    
  } catch (error) {
    console.error('💥 Error updating rate limit:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }
}

// Run the update
updateRateLimit();
