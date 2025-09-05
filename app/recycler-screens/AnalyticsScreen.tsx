import { Feather, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS } from '../../constants';
import { supabase } from '../../lib/supabase';

export default function AnalyticsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Analytics data state
  const [analyticsData, setAnalyticsData] = useState({
    totalPickups: 0,
    totalEarnings: 0,
    averagePickupValue: 0,
    efficiency: 0,
    dailyPerformance: [] as Array<{ day: string; pickups: number; earnings: number; }>,
    environmentalImpact: {
      wasteDiverted: 0,
      co2Reduced: 0,
      treesEquivalent: 0,
      landfillSpaceSaved: 0,
      energySaved: 0,
    }
  });

  // ===== DATA FETCHING FUNCTIONS =====
  const loadAnalyticsData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      
      if (!currentUser) {
        console.log('No current user, skipping analytics data load');
        return;
      }

      // Calculate date range based on selected period
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const startDate = selectedPeriod === 'week' ? weekAgo : monthAgo;

      // Fetch recycler earnings data
      const { data: earningsData, error: earningsError } = await supabase
        .from('recycler_earnings')
        .select(`
          *,
          pickup_requests!inner(
            id,
            customer_id,
            pickup_address,
            waste_type,
            status
          )
        `)
        .eq('recycler_id', currentUser.id)
        .eq('status', 'completed')
        .gte('completed_at', startDate.toISOString())
        .order('completed_at', { ascending: false });

      if (earningsError) {
        console.error('Error fetching analytics data:', earningsError);
        throw earningsError;
      }

      // Calculate analytics metrics
      const totalPickups = earningsData?.length || 0;
      const totalEarnings = earningsData?.reduce((sum, earning) => sum + (earning.recycler_earnings || 0), 0) || 0;
      const averagePickupValue = totalPickups > 0 ? totalEarnings / totalPickups : 0;
      
      // Calculate efficiency based on actual performance vs target
      // Target: 20 pickups per week, 80 per month
      const targetPickups = selectedPeriod === 'week' ? 20 : 80;
      const efficiency = totalPickups > 0 ? Math.min(100, Math.round((totalPickups / targetPickups) * 100)) : 0;

      // Calculate daily performance
      const dailyPerformance = calculateDailyPerformance(earningsData || [], selectedPeriod);

      // Calculate environmental impact based on waste type and weight
      const totalWaste = earningsData?.reduce((sum, earning) => sum + (earning.weight || 0), 0) || 0;
      
      // Environmental impact factors (these could be stored in database as configuration)
      const ENVIRONMENTAL_FACTORS = {
        co2PerKg: 0.5, // kg CO2 equivalent per kg of waste
        co2PerTree: 20, // kg CO2 per tree
        landfillSpacePerKg: 0.7, // cubic meters per kg
        energyPerKg: 1.4, // kWh per kg
      };
      
      const environmentalImpact = {
        wasteDiverted: totalWaste,
        co2Reduced: totalWaste * ENVIRONMENTAL_FACTORS.co2PerKg,
        treesEquivalent: Math.floor(totalWaste * ENVIRONMENTAL_FACTORS.co2PerKg / ENVIRONMENTAL_FACTORS.co2PerTree),
        landfillSpaceSaved: totalWaste * ENVIRONMENTAL_FACTORS.landfillSpacePerKg,
        energySaved: totalWaste * ENVIRONMENTAL_FACTORS.energyPerKg,
      };

      setAnalyticsData({
        totalPickups,
        totalEarnings,
        averagePickupValue,
        efficiency,
        dailyPerformance,
        environmentalImpact,
      });

      console.log('Analytics data loaded successfully:', {
        totalPickups,
        totalEarnings: Math.round(totalEarnings),
        efficiency
      });
      
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, selectedPeriod]);

  // Calculate daily performance data
  const calculateDailyPerformance = (earningsData: any[], period: string) => {
    const days = period === 'week' ? 7 : 30;
    const performance = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayEarnings = earningsData.filter(earning => {
        const earningDate = new Date(earning.completed_at);
        return earningDate >= dayStart && earningDate < dayEnd;
      });
      
      const pickups = dayEarnings.length;
      const earnings = dayEarnings.reduce((sum, earning) => sum + (earning.recycler_earnings || 0), 0);
      
      performance.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        pickups,
        earnings: Math.round(earnings),
      });
    }
    
    return performance;
  };

  // ===== USER AUTHENTICATION EFFECT =====
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Error getting current user:', error);
          return;
        }
        if (user) {
          setCurrentUser(user);
          console.log('Current user loaded:', user.id);
        }
      } catch (error) {
        console.error('Error in getCurrentUser:', error);
      }
    };

    getCurrentUser();
  }, []);

  // ===== INITIALIZATION EFFECT =====
  useEffect(() => {
    if (currentUser) {
      loadAnalyticsData();
    }
  }, [currentUser, loadAnalyticsData]);

  // ===== REFRESH HANDLER =====
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadAnalyticsData(false);
    setIsRefreshing(false);
  }, [loadAnalyticsData]);

  // ===== PERIOD CHANGE HANDLER =====
  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
  };

  const renderProgressBar = (percentage: number, color: string) => (
    <View style={styles.progressContainer}>
      <View style={[styles.progressBar, { backgroundColor: COLORS.lightGray }]}>
        <View 
          style={[
            styles.progressFill, 
            { 
              width: `${percentage}%`, 
              backgroundColor: color 
            }
          ]} 
        />
      </View>
      <Text style={styles.progressText}>{percentage}%</Text>
    </View>
  );

  const renderMetricCard = (title: string, value: string, subtitle: string, icon: React.ReactNode, color: string) => (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <View style={styles.metricHeader}>
        {icon}
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricSubtitle}>{subtitle}</Text>
    </View>
  );

  const renderChartBar = (label: string, value: number, maxValue: number, color: string) => (
    <View style={styles.chartBarContainer}>
      <Text style={styles.chartLabel}>{label}</Text>
      <View style={styles.chartBarWrapper}>
        <View style={[styles.chartBar, { backgroundColor: color }]}>
          <View 
            style={[
              styles.chartBarFill, 
              { 
                width: `${(value / maxValue) * 100}%`,
                backgroundColor: color
              }
            ]} 
          />
        </View>
        <Text style={styles.chartValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading analytics...</Text>
          </View>
        )}

        {!isLoading && (
          <>
            {/* Period Selector */}
            <View style={styles.periodSelector}>
              <TouchableOpacity 
                style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
                onPress={() => handlePeriodChange('week')}
              >
                <Text style={[styles.periodText, selectedPeriod === 'week' && styles.periodTextActive]}>
                  This Week
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
                onPress={() => handlePeriodChange('month')}
              >
                <Text style={[styles.periodText, selectedPeriod === 'month' && styles.periodTextActive]}>
                  This Month
                </Text>
              </TouchableOpacity>
            </View>

        {/* Waste Reduction Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="eco" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Your Environmental Impact</Text>
          </View>
          
          <View style={styles.overviewCard}>
            <View style={styles.overviewRow}>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>Waste Diverted</Text>
                <Text style={styles.overviewValue}>{analyticsData.environmentalImpact.wasteDiverted.toFixed(1)} kg</Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>Pickups Completed</Text>
                <Text style={styles.overviewValue}>{analyticsData.totalPickups}</Text>
              </View>
            </View>
            
            <View style={styles.reductionContainer}>
              <Text style={styles.reductionTitle}>Impact Rate</Text>
              {renderProgressBar(analyticsData.totalPickups > 0 ? 100 : 0, COLORS.success)} {/* 100% impact for completed pickups */}
            </View>
          </View>
        </View>

        {/* Recycler Performance */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome5 name="user-tie" size={20} color={COLORS.blue} />
            <Text style={styles.sectionTitle}>Your Performance</Text>
          </View>
          
          <View style={styles.metricsGrid}>
            {renderMetricCard(
              'Total Pickups',
              analyticsData.totalPickups.toString(),
              `Completed this ${selectedPeriod}`,
              <MaterialIcons name="local-shipping" size={20} color={COLORS.blue} />,
              COLORS.blue
            )}
            {renderMetricCard(
              'Total Earnings',
              `₵${analyticsData.totalEarnings.toFixed(2)}`,
              `This ${selectedPeriod}'s income`,
              <FontAwesome5 name="dollar-sign" size={18} color={COLORS.success} />,
              COLORS.success
            )}
            {renderMetricCard(
              'Avg. Pickup Value',
              `₵${analyticsData.averagePickupValue.toFixed(2)}`,
              'Per pickup average',
              <MaterialIcons name="trending-up" size={20} color={COLORS.accent} />,
              COLORS.accent
            )}
            {renderMetricCard(
              'Efficiency Rate',
              `${analyticsData.efficiency}%`,
              'Performance score',
              <MaterialIcons name="speed" size={20} color={COLORS.purple} />,
              COLORS.purple
            )}
          </View>
        </View>

        {/* Environmental Impact */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="feather" size={22} color={COLORS.darkGreen} />
            <Text style={styles.sectionTitle}>Environmental Impact</Text>
          </View>
          
          <View style={styles.impactGrid}>
            <View style={styles.impactCard}>
              <Ionicons name="leaf-outline" size={24} color={COLORS.darkGreen} />
              <Text style={styles.impactValue}>{analyticsData.environmentalImpact.co2Reduced.toFixed(1)} kg</Text>
              <Text style={styles.impactLabel}>CO₂ Reduced</Text>
            </View>
            <View style={styles.impactCard}>
              <MaterialIcons name="park" size={24} color={COLORS.darkGreen} />
              <Text style={styles.impactValue}>{analyticsData.environmentalImpact.treesEquivalent}</Text>
              <Text style={styles.impactLabel}>Trees Equivalent</Text>
            </View>
            <View style={styles.impactCard}>
              <MaterialIcons name="storage" size={24} color={COLORS.darkGreen} />
              <Text style={styles.impactValue}>{analyticsData.environmentalImpact.landfillSpaceSaved.toFixed(1)} m³</Text>
              <Text style={styles.impactLabel}>Landfill Space Saved</Text>
            </View>
            <View style={styles.impactCard}>
              <MaterialIcons name="flash-on" size={24} color={COLORS.darkGreen} />
              <Text style={styles.impactValue}>{analyticsData.environmentalImpact.energySaved.toFixed(1)} kWh</Text>
              <Text style={styles.impactLabel}>Energy Saved</Text>
            </View>
          </View>
        </View>

        {/* Daily Performance Chart */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="bar-chart" size={24} color={COLORS.accent} />
            <Text style={styles.sectionTitle}>Daily Performance</Text>
          </View>
          
          <View style={styles.chartContainer}>
            {analyticsData.dailyPerformance.map((day, index) => {
              const maxPickups = Math.max(...analyticsData.dailyPerformance.map(d => d.pickups), 1);
              const maxEarnings = Math.max(...analyticsData.dailyPerformance.map(d => d.earnings), 1);
              
              return (
                <View key={index} style={styles.chartRow}>
                  <Text style={styles.chartDay}>{day.day}</Text>
                  <View style={styles.chartBars}>
                    {renderChartBar('Pickups', day.pickups, maxPickups, COLORS.blue)}
                    {renderChartBar('Earnings', day.earnings, maxEarnings, COLORS.success)}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Waste Reduction Trend */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="trending-down" size={24} color={COLORS.success} />
            <Text style={styles.sectionTitle}>Waste Reduction Trend</Text>
          </View>
          
          <View style={styles.trendContainer}>
            <View style={styles.trendDay}>
              <Text style={styles.trendDayLabel}>Today</Text>
              <View style={styles.trendBars}>
                <View style={styles.trendBarContainer}>
                  <Text style={styles.trendBarLabel}>Waste</Text>
                  <View style={[styles.trendBar, { backgroundColor: COLORS.error }]}>
                    <View 
                      style={[
                        styles.trendBarFill, 
                        { 
                          width: `${Math.min(100, (analyticsData.environmentalImpact.wasteDiverted / 50) * 100)}%`,
                          backgroundColor: COLORS.error
                        }
                      ]} 
                    />
                  </View>
                </View>
                <View style={styles.trendBarContainer}>
                  <Text style={styles.trendBarLabel}>Recycled</Text>
                  <View style={[styles.trendBar, { backgroundColor: COLORS.success }]}>
                    <View 
                      style={[
                        styles.trendBarFill, 
                        { 
                          width: `${Math.min(100, (analyticsData.environmentalImpact.wasteDiverted / 50) * 100)}%`,
                          backgroundColor: COLORS.success
                        }
                      ]} 
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSpacer: {
    width: 34,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 4,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  periodTextActive: {
    color: COLORS.white,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 10,
  },
  overviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  overviewItem: {
    flex: 1,
    alignItems: 'center',
  },
  overviewLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 5,
  },
  overviewValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  reductionContainer: {
    marginTop: 10,
  },
  reductionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.success,
    minWidth: 40,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    width: '48%',
    marginBottom: 15,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricTitle: {
    fontSize: 12,
    color: COLORS.textLight,
    marginLeft: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 5,
  },
  metricSubtitle: {
    fontSize: 10,
    color: COLORS.textLight,
  },
  impactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  impactCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    width: '48%',
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  impactValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginVertical: 5,
  },
  impactLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  chartDay: {
    width: 40,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  chartBars: {
    flex: 1,
    marginLeft: 15,
  },
  chartBarContainer: {
    marginBottom: 8,
  },
  chartLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    marginBottom: 3,
  },
  chartBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
  },
  chartBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  chartValue: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.text,
    minWidth: 30,
  },
  trendContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trendDay: {
    marginBottom: 15,
  },
  trendDayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  trendBars: {
    marginLeft: 10,
  },
  trendBarContainer: {
    marginBottom: 6,
  },
  trendBarLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    marginBottom: 3,
  },
  trendBar: {
    height: 4,
    borderRadius: 2,
  },
  trendBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.textLight,
  },
}); 