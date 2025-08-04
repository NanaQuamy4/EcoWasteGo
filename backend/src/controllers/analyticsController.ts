import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analyticsService';
import { AnalyticsResponse } from '../types/analytics';

export class AnalyticsController {
  /**
   * Get analytics data for the authenticated recycler
   */
  static async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const period = (req.query.period as 'week' | 'month' | 'year') || 'week';

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      // Verify user is a recycler
      if (req.user?.role !== 'recycler') {
        res.status(403).json({
          success: false,
          error: 'Access denied. Recycler role required.'
        });
        return;
      }

      const analyticsData = await AnalyticsService.getAnalyticsData(userId, period);

      const response: AnalyticsResponse = {
        success: true,
        data: analyticsData,
        message: 'Analytics data retrieved successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error in getAnalytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve analytics data'
      });
    }
  }

  /**
   * Get performance data only
   */
  static async getPerformance(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const period = (req.query.period as 'week' | 'month' | 'year') || 'week';

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      if (req.user?.role !== 'recycler') {
        res.status(403).json({
          success: false,
          error: 'Access denied. Recycler role required.'
        });
        return;
      }

      const performance = await AnalyticsService.getRecyclerPerformance(userId, period);

      res.status(200).json({
        success: true,
        data: performance,
        message: 'Performance data retrieved successfully'
      });
    } catch (error) {
      console.error('Error in getPerformance:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve performance data'
      });
    }
  }

  /**
   * Get environmental impact data only
   */
  static async getEnvironmentalImpact(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const period = (req.query.period as 'week' | 'month' | 'year') || 'week';

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      if (req.user?.role !== 'recycler') {
        res.status(403).json({
          success: false,
          error: 'Access denied. Recycler role required.'
        });
        return;
      }

      const environmentalImpact = await AnalyticsService.getEnvironmentalImpact(userId, period);

      res.status(200).json({
        success: true,
        data: environmentalImpact,
        message: 'Environmental impact data retrieved successfully'
      });
    } catch (error) {
      console.error('Error in getEnvironmentalImpact:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve environmental impact data'
      });
    }
  }

  /**
   * Get analytics summary (high-level metrics)
   */
  static async getAnalyticsSummary(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const period = (req.query.period as 'week' | 'month' | 'year') || 'week';

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      if (req.user?.role !== 'recycler') {
        res.status(403).json({
          success: false,
          error: 'Access denied. Recycler role required.'
        });
        return;
      }

      const [performance, environmentalImpact] = await Promise.all([
        AnalyticsService.getRecyclerPerformance(userId, period),
        AnalyticsService.getEnvironmentalImpact(userId, period)
      ]);

      const summary = {
        totalPickups: performance.totalPickups,
        totalEarnings: performance.totalEarnings,
        efficiency: performance.efficiency,
        wasteDiverted: environmentalImpact.wasteDiverted,
        co2Reduced: environmentalImpact.co2Reduced,
        treesEquivalent: environmentalImpact.treesEquivalent
      };

      res.status(200).json({
        success: true,
        data: summary,
        message: 'Analytics summary retrieved successfully'
      });
    } catch (error) {
      console.error('Error in getAnalyticsSummary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve analytics summary'
      });
    }
  }
} 