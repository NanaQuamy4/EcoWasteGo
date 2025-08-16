import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import { supabaseAnonKey, supabaseServiceKey, supabaseUrl } from '../config/supabase';

// Database performance configuration
const DB_CONFIG = {
  // Connection pooling
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
  },
  
  // Query optimization
  query: {
    timeout: 30000,
    maxRows: 1000,
  },
  
  // Caching
  cache: {
    ttl: 300, // 5 minutes
    maxSize: 1000,
  },
  
  // Monitoring
  monitoring: {
    enabled: true,
    logSlowQueries: true,
    slowQueryThreshold: 1000, // ms
  }
};

// Cache implementation
class DatabaseCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  set(key: string, data: any, ttl: number = 300): void {
    // Clean expired entries
    this.cleanup();
    
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl * 1000
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}

// Query performance monitoring
class QueryMonitor {
  private queries: { sql: string; duration: number; timestamp: number }[] = [];
  private slowQueries: { sql: string; duration: number; timestamp: number }[] = [];

  logQuery(sql: string, duration: number): void {
    const queryInfo = { sql, duration, timestamp: Date.now() };
    this.queries.push(queryInfo);
    
    if (duration > DB_CONFIG.monitoring.slowQueryThreshold) {
      this.slowQueries.push(queryInfo);
      console.warn(`Slow query detected (${duration}ms):`, sql);
    }
    
    // Keep only last 1000 queries
    if (this.queries.length > 1000) {
      this.queries = this.queries.slice(-1000);
    }
    
    if (this.slowQueries.length > 100) {
      this.slowQueries = this.slowQueries.slice(-100);
    }
  }

  getStats(): { totalQueries: number; avgDuration: number; slowQueries: number } {
    if (this.queries.length === 0) {
      return { totalQueries: 0, avgDuration: 0, slowQueries: 0 };
    }
    
    const totalDuration = this.queries.reduce((sum, q) => sum + q.duration, 0);
    return {
      totalQueries: this.queries.length,
      avgDuration: totalDuration / this.queries.length,
      slowQueries: this.slowQueries.length
    };
  }
}

// Optimized database service
export class DatabaseService {
  private supabase!: SupabaseClient;
  private supabaseAdmin!: SupabaseClient | null;
  private pgPool: Pool | null = null;
  private cache!: DatabaseCache;
  private monitor!: QueryMonitor;

  constructor() {
    // Initialize with retries for Supabase connection
    this.initializeSupabase();

    this.cache = new DatabaseCache(DB_CONFIG.cache.maxSize);
    this.monitor = new QueryMonitor();

    // Initialize PostgreSQL connection pool for direct database access
    this.initializePgPool();
  }

  private initializeSupabase(): void {
    try {
      // Create Supabase client with anon key for regular operations
      this.supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // Create Supabase admin client with service role key for admin operations
      this.supabaseAdmin = supabaseServiceKey 
        ? createClient(supabaseUrl, supabaseServiceKey)
        : null;

      console.log('✅ Supabase clients initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Supabase clients:', error);
      throw new Error('Failed to initialize Supabase clients');
    }
  }

  private initializePgPool(): void {
    try {
      const databaseConfig = {
        host: process.env.DB_HOST || 'db.esyardsjumxqwstdoaod.supabase.co',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'postgres',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: false },
        ...DB_CONFIG.pool
      };

      if (databaseConfig.password) {
        this.pgPool = new Pool(databaseConfig);
        
        this.pgPool.on('error', (err) => {
          console.error('Unexpected error on idle client', err);
        });
      }
    } catch (error) {
      console.warn('PostgreSQL pool initialization failed, using Supabase only:', error);
    }
  }

  // Optimized query execution with caching and monitoring
  async executeQuery<T>(
    queryFn: () => Promise<T>,
    cacheKey?: string,
    cacheTTL: number = DB_CONFIG.cache.ttl
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      if (cacheKey) {
        const cached = this.cache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // Execute query
      const result = await queryFn();
      
      // Cache result
      if (cacheKey) {
        this.cache.set(cacheKey, result, cacheTTL);
      }

      // Monitor performance
      const duration = Date.now() - startTime;
      this.monitor.logQuery('Query executed', duration);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.monitor.logQuery('Query failed', duration);
      throw error;
    }
  }

  // Optimized Supabase queries with connection pooling
  async supabaseQuery<T>(
    queryBuilder: (supabase: SupabaseClient) => any,
    cacheKey?: string,
    cacheTTL: number = DB_CONFIG.cache.ttl
  ): Promise<T> {
    return this.executeQuery(
      async () => {
        const query = queryBuilder(this.supabase);
        const { data, error } = await query;
        
        if (error) {
          throw new Error(error.message);
        }
        
        return data;
      },
      cacheKey,
      cacheTTL
    );
  }

  // Direct PostgreSQL queries for complex operations
  async pgQuery(
    sql: string,
    params: any[] = [],
    cacheKey?: string,
    cacheTTL: number = DB_CONFIG.cache.ttl
  ): Promise<any[]> {
    if (!this.pgPool) {
      throw new Error('PostgreSQL pool not available');
    }

    return this.executeQuery(
      async () => {
        const client = await this.pgPool!.connect();
        try {
          const result = await client.query(sql, params);
          return result.rows;
        } finally {
          client.release();
        }
      },
      cacheKey,
      cacheTTL
    );
  }

  // Optimized batch operations
  async batchQuery(queries: { sql: string; params?: any[] }[]): Promise<any[][]> {
    if (!this.pgPool) {
      throw new Error('PostgreSQL pool not available');
    }

    const client = await this.pgPool.connect();
    try {
      const results = await Promise.all(
        queries.map(async ({ sql, params = [] }) => {
          const result = await client.query(sql, params);
          return result.rows;
        })
      );
      return results;
    } finally {
      client.release();
    }
  }

  // Cache management
  invalidateCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache['cache'].keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // Performance monitoring
  getPerformanceStats(): {
    cache: { size: number; maxSize: number };
    queries: { totalQueries: number; avgDuration: number; slowQueries: number };
    pool: { totalCount: number; idleCount: number; waitingCount: number } | null;
  } {
    return {
      cache: this.cache.getStats(),
      queries: this.monitor.getStats(),
      pool: this.pgPool ? {
        totalCount: this.pgPool.totalCount,
        idleCount: this.pgPool.idleCount,
        waitingCount: this.pgPool.waitingCount
      } : null
    };
  }

  // Optimized user queries
  async getUserProfile(userId: string): Promise<any> {
    const cacheKey = `user_profile_${userId}`;
    return this.supabaseQuery(
      async (supabase) => {
        // Try to find user in customers table first
        let { data: profile, error } = await supabase
          .from('customers')
          .select('*')
          .eq('id', userId)
          .single();

        if (profile) {
          profile.role = 'customer';
          return { data: profile, error: null };
        }

        // If not found in customers, check recyclers table
        const { data: recycler, error: recyclerError } = await supabase
          .from('recyclers')
          .select('*')
          .eq('id', userId)
          .single();

        if (recycler) {
          recycler.role = 'recycler';
          return { data: recycler, error: null };
        }

        return { data: null, error: recyclerError };
      },
      cacheKey,
      600 // 10 minutes cache for user profiles
    );
  }

  // Optimized recycler queries with pagination
  async getRecyclers(page: number = 1, limit: number = 10): Promise<any> {
    const cacheKey = `recyclers_${page}_${limit}`;
    const offset = (page - 1) * limit;
    
    return this.supabaseQuery(
      (supabase) => supabase
        .from('recyclers')
        .select(`
          id,
          username,
          phone,
          business_location,
          areas_of_operation,
          profile_image,
          created_at,
          is_available,
          verification_status
        `)
        .eq('email_verified', true)
        .eq('is_available', true) // Only show available recyclers
        .eq('verification_status', 'verified') // Only show verified recyclers
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false }),
      cacheKey,
      300 // 5 minutes cache for recycler lists
    );
  }

  // Optimized waste collection queries
  async getUserCollections(userId: string, userRole: string, page: number = 1, limit: number = 10, status?: string): Promise<any> {
    const cacheKey = `collections_${userId}_${userRole}_${page}_${limit}_${status || 'all'}`;
    const offset = (page - 1) * limit;
    
    return this.supabaseQuery(
      (supabase) => {
        let query = supabase
          .from('waste_collections')
          .select(`
            *,
            customers:customer_id(id, username, phone, address),
            recyclers:recycler_id(id, username, phone)
          `);

        // Filter by user role
        if (userRole === 'customer') {
          query = query.eq('customer_id', userId);
        } else if (userRole === 'recycler') {
          query = query.eq('recycler_id', userId);
        }

        // Filter by status if provided
        if (status) {
          query = query.eq('status', status);
        }

        return query
          .range(offset, offset + limit - 1)
          .order('created_at', { ascending: false });
      },
      cacheKey,
      180 // 3 minutes cache for collections
    );
  }

  // Optimized analytics queries
  async getAnalytics(userId: string, userRole: string): Promise<any> {
    const cacheKey = `analytics_${userId}_${userRole}`;
    
    return this.executeQuery(
      async () => {
        const [collections, earnings, impact] = await Promise.all([
          this.supabaseQuery(
            (supabase) => supabase
              .from('waste_collections')
              .select('status, created_at')
              .eq(userRole === 'customer' ? 'customer_id' : 'recycler_id', userId),
            `collections_${userId}`,
            300
          ),
          this.supabaseQuery(
            (supabase) => supabase
              .from('payments')
              .select('amount, status, created_at')
              .eq(userRole === 'customer' ? 'customer_id' : 'recycler_id', userId),
            `earnings_${userId}`,
            300
          ),
          this.supabaseQuery(
            (supabase) => supabase
              .from('waste_collections')
              .select('waste_type, weight')
              .eq(userRole === 'customer' ? 'customer_id' : 'recycler_id', userId)
              .eq('status', 'completed'),
            `impact_${userId}`,
            300
          )
        ]);

        return {
          collections,
          earnings,
          impact
        };
      },
      cacheKey,
      600 // 10 minutes cache for analytics
    );
  }

  // Cleanup resources
  async cleanup(): Promise<void> {
    if (this.pgPool) {
      await this.pgPool.end();
    }
    this.cache.clear();
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
export default databaseService; 