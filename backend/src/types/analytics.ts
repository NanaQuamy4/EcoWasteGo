export interface DailyPerformance {
  day: string;
  pickups: number;
  earnings: number;
}

export interface RecyclerPerformance {
  totalPickups: number;
  totalEarnings: number;
  averagePickupValue: number;
  efficiency: number;
  dailyPerformance: DailyPerformance[];
}

export interface EnvironmentalImpact {
  wasteDiverted: number;
  co2Reduced: number;
  treesEquivalent: number;
  landfillSpaceSaved: number;
  energySaved: number;
}

export interface AnalyticsData {
  performance: RecyclerPerformance;
  environmentalImpact: EnvironmentalImpact;
  period: 'week' | 'month' | 'year';
}

export interface AnalyticsResponse {
  success: boolean;
  data: AnalyticsData;
  message?: string;
} 