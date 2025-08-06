require('dotenv').config();
const { Client } = require('pg');

console.log('🔍 Testing Direct Database Connection...');

// You'll need to get the database connection string from Supabase dashboard
// Go to: https://supabase.com/dashboard/project/esyardsjumxqwstdoaod/settings/database
// Copy the "Connection string" and replace the password

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:[YOUR-PASSWORD]@db.esyardsjumxqwstdoaod.supabase.co:5432/postgres';

async function testDirectConnection() {
  const client = new Client({
    connectionString: connectionString
  });

  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Test query
    const result = await client.query('SELECT * FROM users LIMIT 1');
    console.log('✅ Query successful:', result.rows);

    // Test insert
    const insertResult = await client.query(`
      INSERT INTO users (id, email, username, role, email_verified) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *
    `, ['test-direct-' + Date.now(), 'test@direct.com', 'testdirect', 'customer', false]);
    
    console.log('✅ Insert successful:', insertResult.rows);

  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await client.end();
  }
}

testDirectConnection(); 