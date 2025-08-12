import { supabase } from '../config/supabase';
import {
    AnalyticsData,
    DailyPerformance,
    EnvironmentalImpact,
    RecyclerPerformance
} from '../types/analytics';

export class AnalyticsService {
  /**
   * Get recycler performance data for a specific period
   */
  static async getRecyclerPerformance(userId: string, period: 'week' | 'month' | 'year'): Promise<RecyclerPerformance> {
    try {
      const startDate = this.getStartDate(period);
      
      // Get completed waste collections for the period
      const { data: collections, error } = await supabase
        .from('waste_collections')
        .select('*')
        .eq('recycler_id', userId)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch collections: ${error.message}`);
      }

      const totalPickups = collections?.length || 0;
      const totalEarnings = this.calculateTotalEarnings(collections || []);
      const averagePickupValue = totalPickups > 0 ? totalEarnings / totalPickups : 0;
      const efficiency = this.calculateEfficiency(collections || []);

      // Calculate daily performance
      const dailyPerformance = this.calculateDailyPerformance(collections || [], period);

      return {
        totalPickups,
        totalEarnings,
        averagePickupValue,
        efficiency,
        dailyPerformance
      };
    } catch (error) {
      console.error('Error getting recycler performance:', error);
      throw error;
    }
  }

  /**
   * Calculate environmental impact based on completed collections
   */
  static async getEnvironmentalImpact(userId: string, period: 'week' | 'month' | 'year'): Promise<EnvironmentalImpact> {
    try {
      const startDate = this.getStartDate(period);
      
      // Get completed collections for the period
      const { data: collections, error } = await supabase
        .from('waste_collections')
        .select('weight, waste_type')
        .eq('recycler_id', userId)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString());

      if (error) {
        throw new Error(`Failed to fetch collections: ${error.message}`);
      }

      const totalWeight = collections?.reduce((sum, collection) => sum + (collection.weight || 0), 0) || 0;
      
      return this.calculateEnvironmentalImpact(totalWeight, collections || []);
    } catch (error) {
      console.error('Error getting environmental impact:', error);
      throw error;
    }
  }

  /**
   * Get complete analytics data for a user
   */
  static async getAnalyticsData(userId: string, period: 'week' | 'month' | 'year'): Promise<AnalyticsData> {
    try {
      const [performance, environmentalImpact] = await Promise.all([
        this.getRecyclerPerformance(userId, period),
        this.getEnvironmentalImpact(userId, period)
      ]);

      return {
        performance,
        environmentalImpact,
        period
      };
    } catch (error) {
      console.error('Error getting analytics data:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive user stats and earnings data for recycler
   */
  static async getUserStats(userId: string): Promise<any> {
    try {
      // Get all completed collections for the recycler
      const { data: collections, error: collectionsError } = await supabase
        .from('waste_collections')
        .select('*')
        .eq('recycler_id', userId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (collectionsError) {
        throw new Error(`Failed to fetch collections: ${collectionsError.message}`);
      }

      // Get all payments for the recycler
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('recycler_id', userId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (paymentsError) {
        throw new Error(`Failed to fetch payments: ${paymentsError.message}`);
      }

      // Calculate current date and time periods
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      // Calculate earnings for different periods
      const totalEarnings = this.calculateTotalEarnings(collections || []);
      const todayEarnings = this.calculateEarningsForPeriod(collections || [], today, now);
      const yesterdayEarnings = this.calculateEarningsForPeriod(collections || [], yesterday, today);
      const weeklyEarnings = this.calculateEarningsForPeriod(collections || [], weekStart, now);
      const monthlyEarnings = this.calculateEarningsForPeriod(collections || [], monthStart, now);

      // Calculate completed pickups
      const completedPickups = collections?.length || 0;
      const averagePerPickup = completedPickups > 0 ? totalEarnings / completedPickups : 0;

      return {
        totalEarnings,
        todayEarnings,
        yesterdayEarnings,
        weeklyEarnings,
        monthlyEarnings,
        completedPickups,
        averagePerPickup,
        totalPayments: payments?.length || 0,
        lastUpdated: now.toISOString()
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  /**
   * Calculate total earnings from collections
   */
  private static calculateTotalEarnings(collections: any[]): number {
    return collections.reduce((total, collection) => {
      // Calculate earnings based on waste type and weight
      const baseRate = this.getBaseRate(collection.waste_type);
      const weight = collection.weight || 0;
      return total + (baseRate * weight);
    }, 0);
  }

  /**
   * Calculate earnings for a specific period
   */
  private static calculateEarningsForPeriod(collections: any[], startDate: Date, endDate: Date): number {
    return collections
      .filter(collection => {
        const pickupDate = new Date(collection.pickup_date || collection.created_at);
        return pickupDate >= startDate && pickupDate < endDate;
      })
      .reduce((total, collection) => {
        const baseRate = this.getBaseRate(collection.waste_type);
        const weight = collection.weight || 0;
        return total + (baseRate * weight);
      }, 0);
  }

  /**
   * Calculate efficiency based on completed vs total collections
   */
  private static calculateEfficiency(collections: any[]): number {
    if (collections.length === 0) return 0;
    
    const completedOnTime = collections.filter(collection => {
      const pickupDate = new Date(collection.pickup_date);
      const createdDate = new Date(collection.created_at);
      const timeDiff = pickupDate.getTime() - createdDate.getTime();
      const hoursDiff = timeDiff / (1000 * 3600);
      
      // Consider efficient if completed within 24 hours
      return hoursDiff <= 24;
    }).length;

    return Math.round((completedOnTime / collections.length) * 100);
  }

  /**
   * Calculate daily performance data
   */
  private static calculateDailyPerformance(collections: any[], period: 'week' | 'month' | 'year'): DailyPerformance[] {
    const days = this.getDaysForPeriod(period);
    const dailyData: { [key: string]: { pickups: number; earnings: number } } = {};

    // Initialize daily data
    days.forEach(day => {
      dailyData[day] = { pickups: 0, earnings: 0 };
    });

    // Aggregate collections by day
    collections.forEach(collection => {
      const date = new Date(collection.created_at);
      const dayKey = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      if (dailyData[dayKey]) {
        dailyData[dayKey].pickups += 1;
        dailyData[dayKey].earnings += this.getBaseRate(collection.waste_type) * (collection.weight || 0);
      }
    });

    return days.map(day => ({
      day,
      pickups: dailyData[day]?.pickups || 0,
      earnings: Math.round(dailyData[day]?.earnings || 0)
    }));
  }

  /**
   * Calculate environmental impact based on waste weight and type
   */
  private static calculateEnvironmentalImpact(totalWeight: number, collections: any[]): EnvironmentalImpact {
    const wasteDiverted = totalWeight;
    
    // Calculate CO2 reduction based on waste type
    const co2Reduced = collections.reduce((total, collection) => {
      const weight = collection.weight || 0;
      const co2Factor = this.getCO2Factor(collection.waste_type);
      return total + (weight * co2Factor);
    }, 0);

    const treesEquivalent = Math.floor(co2Reduced / 20); // 20kg CO2 per tree
    const landfillSpaceSaved = totalWeight * 0.7; // cubic meters
    const energySaved = totalWeight * 1.4; // kWh

    return {
      wasteDiverted,
      co2Reduced: Math.round(co2Reduced),
      treesEquivalent,
      landfillSpaceSaved: Math.round(landfillSpaceSaved),
      energySaved: Math.round(energySaved)
    };
  }

  /**
   * Get base rate for waste type (GHS per kg)
   */
  private static getBaseRate(wasteType: string): number {
    const rates: { [key: string]: number } = {
      'plastic': 2.5,
      'paper': 1.8,
      'glass': 0.3,
      'metal': 4.0,
      'organic': 0.5,
      'electronics': 8.0,
      'mixed': 1.5
    };
    return rates[wasteType] || 1.5;
  }

  /**
   * Get CO2 reduction factor for waste type (kg CO2 per kg waste)
   */
  private static getCO2Factor(wasteType: string): number {
    const factors: { [key: string]: number } = {
      'plastic': 2.5,
      'paper': 1.8,
      'glass': 0.3,
      'metal': 4.0,
      'organic': 0.5,
      'electronics': 8.0,
      'mixed': 1.5
    };
    return factors[wasteType] || 1.5;
  }

  /**
   * Get start date for the specified period
   */
  private static getStartDate(period: 'week' | 'month' | 'year'): Date {
    const now = new Date();
    
    switch (period) {
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        return weekStart;
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return monthStart;
      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        return yearStart;
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Default to week
    }
  }

  /**
   * Get days for the specified period
   */
  private static getDaysForPeriod(period: 'week' | 'month' | 'year'): string[] {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    switch (period) {
      case 'week':
        return days;
      case 'month':
        // For month, we'll return week days repeated
        return [...days, ...days, ...days, ...days];
      case 'year':
        // For year, we'll return month names
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      default:
        return days;
    }
  }
} 