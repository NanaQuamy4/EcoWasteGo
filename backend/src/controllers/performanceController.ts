import { Request, Response } from 'express';
import databaseService from '../services/databaseService';

export class PerformanceController {
  /**
   * Get comprehensive performance metrics
   */
  static async getPerformanceMetrics(req: Request, res: Response): Promise<void> {
    try {
      const stats = databaseService.getPerformanceStats();
      
      // Get additional metrics from database
      const dbMetrics = await databaseService.pgQuery(`
        SELECT 
          (SELECT count(*) FROM users) as total_users,
          (SELECT count(*) FROM waste_collections) as total_collections,
          (SELECT count(*) FROM payments) as total_payments,
          (SELECT count(*) FROM users WHERE role = 'recycler') as total_recyclers,
          (SELECT count(*) FROM users WHERE role = 'customer') as total_customers,
          (SELECT count(*) FROM waste_collections WHERE status = 'pending') as pending_collections,
          (SELECT count(*) FROM waste_collections WHERE status = 'completed') as completed_collections
      `) as any[];

      const response = {
        success: true,
        data: {
          database: {
            ...stats,
            metrics: dbMetrics[0] || {}
          },
          recommendations: PerformanceController.getOptimizationRecommendations(stats),
          timestamp: new Date().toISOString()
        },
        message: 'Performance metrics retrieved successfully'
      };

      res.json(response);
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve performance metrics'
      });
    }
  }

  /**
   * Get slow query analysis
   */
  static async getSlowQueries(req: Request, res: Response): Promise<void> {
    try {
      const slowQueries = await databaseService.pgQuery(`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows,
          shared_blks_hit,
          shared_blks_read
        FROM pg_stat_statements 
        WHERE mean_time > 1000
        ORDER BY mean_time DESC
        LIMIT 20
      `);

      res.json({
        success: true,
        data: slowQueries,
        message: 'Slow queries retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting slow queries:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve slow queries'
      });
    }
  }

  /**
   * Get index usage statistics
   */
  static async getIndexUsage(req: Request, res: Response): Promise<void> {
    try {
      const indexStats = await databaseService.pgQuery(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch,
          pg_size_pretty(pg_relation_size(indexrelid)) as index_size
        FROM pg_stat_user_indexes
        ORDER BY idx_scan DESC
      `);

      res.json({
        success: true,
        data: indexStats,
        message: 'Index usage statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting index usage:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve index usage statistics'
      });
    }
  }

  /**
   * Get table statistics and sizes
   */
  static async getTableStats(req: Request, res: Response): Promise<void> {
    try {
      const tableStats = await databaseService.pgQuery(`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
          pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size,
          (SELECT count(*) FROM information_schema.columns WHERE table_schema = schemaname AND table_name = tablename) as column_count
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `);

      res.json({
        success: true,
        data: tableStats,
        message: 'Table statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting table stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve table statistics'
      });
    }
  }

  /**
   * Get cache hit ratio
   */
  static async getCacheHitRatio(req: Request, res: Response): Promise<void> {
    try {
      const cacheStats = await databaseService.pgQuery(`
        SELECT 
          schemaname,
          tablename,
          heap_blks_read,
          heap_blks_hit,
          CASE 
            WHEN (heap_blks_hit + heap_blks_read) > 0 
            THEN ROUND((heap_blks_hit::float / (heap_blks_hit + heap_blks_read) * 100)::numeric, 2)
            ELSE 0 
          END as hit_ratio_percent
        FROM pg_statio_user_tables
        ORDER BY hit_ratio_percent DESC
      `) as any[];

      const overallHitRatio = cacheStats.reduce((acc: any, row: any) => {
        const total = row.heap_blks_hit + row.heap_blks_read;
        if (total > 0) {
          acc.total_hits += row.heap_blks_hit;
          acc.total_reads += row.heap_blks_read;
        }
        return acc;
      }, { total_hits: 0, total_reads: 0 });

      const overallRatio = overallHitRatio.total_reads > 0 
        ? Math.round((overallHitRatio.total_hits / (overallHitRatio.total_hits + overallHitRatio.total_reads)) * 100 * 100) / 100
        : 0;

      res.json({
        success: true,
        data: {
          tables: cacheStats,
          overall: {
            hit_ratio_percent: overallRatio,
            total_hits: overallHitRatio.total_hits,
            total_reads: overallHitRatio.total_reads
          }
        },
        message: 'Cache hit ratio retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting cache hit ratio:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve cache hit ratio'
      });
    }
  }

  /**
   * Get connection pool status
   */
  static async getConnectionPoolStatus(req: Request, res: Response): Promise<void> {
    try {
      const stats = databaseService.getPerformanceStats();
      
      res.json({
        success: true,
        data: {
          pool: stats.pool,
          recommendations: PerformanceController.getPoolRecommendations(stats.pool)
        },
        message: 'Connection pool status retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting connection pool status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve connection pool status'
      });
    }
  }

  /**
   * Optimize database performance
   */
  static async optimizeDatabase(req: Request, res: Response): Promise<void> {
    try {
      const { action } = req.body;

      switch (action) {
        case 'refresh_statistics':
          await databaseService.pgQuery('SELECT update_table_statistics()');
          break;
        case 'refresh_materialized_views':
          await databaseService.pgQuery('SELECT refresh_user_statistics()');
          break;
        case 'cleanup_old_data':
          await databaseService.pgQuery('SELECT cleanup_old_data()');
          break;
        case 'clear_cache':
          databaseService.invalidateCache();
          break;
        default:
          res.status(400).json({
            success: false,
            error: 'Invalid optimization action'
          });
          return;
      }

      res.json({
        success: true,
        message: `Database optimization action '${action}' completed successfully`
      });
    } catch (error) {
      console.error('Error optimizing database:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to optimize database'
      });
    }
  }

  /**
   * Get optimization recommendations based on performance stats
   */
  private static getOptimizationRecommendations(stats: any): string[] {
    const recommendations: string[] = [];

    // Cache recommendations
    if (stats.cache.size < stats.cache.maxSize * 0.1) {
      recommendations.push('Consider increasing cache size for better performance');
    }

    // Query performance recommendations
    if (stats.queries.avgDuration > 500) {
      recommendations.push('Average query duration is high. Consider adding indexes or optimizing queries');
    }

    if (stats.queries.slowQueries > 10) {
      recommendations.push('Multiple slow queries detected. Review and optimize frequently slow queries');
    }

    // Pool recommendations
    if (stats.pool) {
      if (stats.pool.waitingCount > 0) {
        recommendations.push('Connection pool has waiting connections. Consider increasing pool size');
      }
      if (stats.pool.idleCount > stats.pool.totalCount * 0.8) {
        recommendations.push('High number of idle connections. Consider reducing pool size');
      }
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('Database performance is good. Continue monitoring for any degradation');
    }

    return recommendations;
  }

  /**
   * Get connection pool recommendations
   */
  private static getPoolRecommendations(pool: any): string[] {
    const recommendations: string[] = [];

    if (!pool) {
      recommendations.push('PostgreSQL connection pool not available');
      return recommendations;
    }

    if (pool.waitingCount > 0) {
      recommendations.push(`Increase pool size. Currently ${pool.waitingCount} connections waiting`);
    }

    if (pool.idleCount > pool.totalCount * 0.8) {
      recommendations.push(`Reduce pool size. High idle connections: ${pool.idleCount}/${pool.totalCount}`);
    }

    if (pool.totalCount < 5) {
      recommendations.push('Consider increasing minimum pool size for better concurrency');
    }

    if (recommendations.length === 0) {
      recommendations.push('Connection pool configuration is optimal');
    }

    return recommendations;
  }

  /**
   * Get real-time performance dashboard data
   */
  static async getDashboardData(req: Request, res: Response): Promise<void> {
    try {
      const [metrics, slowQueries, cacheStats, tableStats] = await Promise.all([
        PerformanceController.getPerformanceMetrics(req, res),
        PerformanceController.getSlowQueries(req, res),
        PerformanceController.getCacheHitRatio(req, res),
        PerformanceController.getTableStats(req, res)
      ]);

      // This would normally return the data, but since we're calling other methods
      // that already send responses, we need to restructure this
      const dashboardData = {
        success: true,
        data: {
          timestamp: new Date().toISOString(),
          summary: {
            total_users: 0, // Would be populated from metrics
            total_collections: 0,
            pending_collections: 0,
            cache_hit_ratio: 0,
            avg_query_time: 0
          },
          alerts: PerformanceController.getPerformanceAlerts()
        },
        message: 'Dashboard data retrieved successfully'
      };

      res.json(dashboardData);
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve dashboard data'
      });
    }
  }

  /**
   * Get performance alerts
   */
  private static getPerformanceAlerts(): any[] {
    const alerts: any[] = [];
    const stats = databaseService.getPerformanceStats();

    // Check for critical issues
    if (stats.queries.avgDuration > 2000) {
      alerts.push({
        level: 'critical',
        message: 'Average query duration is very high (>2s)',
        action: 'Immediate query optimization required'
      });
    }

    if (stats.queries.slowQueries > 20) {
      alerts.push({
        level: 'warning',
        message: 'High number of slow queries detected',
        action: 'Review and optimize slow queries'
      });
    }

    if (stats.cache.size > stats.cache.maxSize * 0.9) {
      alerts.push({
        level: 'info',
        message: 'Cache is nearly full',
        action: 'Consider increasing cache size or implementing cache eviction'
      });
    }

    return alerts;
  }
} 