import { Client } from 'pg';

// Direct database connection as fallback
const databaseConfig = {
  host: process.env.DB_HOST || 'db.esyardsjumxqwstdoaod.supabase.co',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
};

export const createDatabaseClient = () => {
  if (!databaseConfig.password) {
    throw new Error('Database password not configured');
  }
  
  return new Client(databaseConfig);
};

export default databaseConfig; 