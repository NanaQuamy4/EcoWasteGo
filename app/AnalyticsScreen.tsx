import { Feather, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import recyclerStats from './utils/recyclerStats';

const COLORS = {
  primary: '#4CAF50',
  secondary: '#8BC34A',
  accent: '#FF9800',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  text: '#333333',
  textLight: '#666666',
  background: '#F5F5F5',
  white: '#FFFFFF',
  gray: '#9E9E9E',
  lightGray: '#E0E0E0',
  darkGreen: '#2E7D32',
  lightGreen: '#C8E6C9',
  blue: '#2196F3',
  purple: '#9C27B0',
};

export default function AnalyticsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  // Mock data for analytics
  const wasteReductionData = {
    week: {
      totalWaste: 1250, // kg
      recycledWaste: 875, // kg
      reductionPercentage: 70,
      dailyData: [
        { day: 'Mon', waste: 180, recycled: 126 },
        { day: 'Tue', waste: 200, recycled: 140 },
        { day: 'Wed', waste: 220, recycled: 154 },
        { day: 'Thu', waste: 190, recycled: 133 },
        { day: 'Fri', waste: 210, recycled: 147 },
        { day: 'Sat', waste: 150, recycled: 105 },
        { day: 'Sun', waste: 100, recycled: 70 },
      ]
    },
    month: {
      totalWaste: 5200,
      recycledWaste: 3640,
      reductionPercentage: 70,
      weeklyData: [
        { week: 'Week 1', waste: 1250, recycled: 875 },
        { week: 'Week 2', waste: 1300, recycled: 910 },
        { week: 'Week 3', waste: 1350, recycled: 945 },
        { week: 'Week 4', waste: 1300, recycled: 910 },
      ]
    }
  };

  const recyclerPerformanceData = {
    week: {
      totalPickups: recyclerStats.getCompletedPickupsCount(),
      totalEarnings: recyclerStats.getTodayEarnings(),
      averagePickupValue: recyclerStats.getTodayEarnings() / Math.max(recyclerStats.getCompletedPickupsCount(), 1),
      efficiency: 85, // percentage
      dailyPerformance: [
        { day: 'Mon', pickups: 8, earnings: 120 },
        { day: 'Tue', pickups: 12, earnings: 180 },
        { day: 'Wed', pickups: 10, earnings: 150 },
        { day: 'Thu', pickups: 15, earnings: 225 },
        { day: 'Fri', pickups: 14, earnings: 210 },
        { day: 'Sat', pickups: 6, earnings: 90 },
        { day: 'Sun', pickups: 4, earnings: 60 },
      ]
    }
  };

  const environmentalImpactData = {
    co2Reduced: 1250, // kg CO2 equivalent
    treesEquivalent: 62, // number of trees
    landfillSpaceSaved: 875, // cubic meters
    energySaved: 1750, // kWh
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

  const currentData = selectedPeriod === 'week' ? wasteReductionData.week : wasteReductionData.month;
  const performanceData = recyclerPerformanceData.week;

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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity 
            style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text style={[styles.periodText, selectedPeriod === 'week' && styles.periodTextActive]}>
              This Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('month')}
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
            <Text style={styles.sectionTitle}>Waste Reduction Impact</Text>
          </View>
          
          <View style={styles.overviewCard}>
            <View style={styles.overviewRow}>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>Total Waste Generated</Text>
                <Text style={styles.overviewValue}>{currentData.totalWaste} kg</Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>Waste Recycled</Text>
                <Text style={styles.overviewValue}>{currentData.recycledWaste} kg</Text>
              </View>
            </View>
            
            <View style={styles.reductionContainer}>
              <Text style={styles.reductionTitle}>Waste Reduction Rate</Text>
              {renderProgressBar(currentData.reductionPercentage, COLORS.success)}
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
              performanceData.totalPickups.toString(),
              'Completed this week',
              <MaterialIcons name="local-shipping" size={20} color={COLORS.blue} />,
              COLORS.blue
            )}
            {renderMetricCard(
              'Total Earnings',
              `GHS ${performanceData.totalEarnings.toFixed(2)}`,
              'This week&apos;s income',
              <FontAwesome5 name="dollar-sign" size={18} color={COLORS.success} />,
              COLORS.success
            )}
            {renderMetricCard(
              'Avg. Pickup Value',
              `GHS ${performanceData.averagePickupValue.toFixed(2)}`,
              'Per pickup average',
              <MaterialIcons name="trending-up" size={20} color={COLORS.accent} />,
              COLORS.accent
            )}
            {renderMetricCard(
              'Efficiency Rate',
              `${performanceData.efficiency}%`,
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
              <Text style={styles.impactValue}>{environmentalImpactData.co2Reduced} kg</Text>
              <Text style={styles.impactLabel}>CO₂ Reduced</Text>
            </View>
            <View style={styles.impactCard}>
              <MaterialIcons name="park" size={24} color={COLORS.darkGreen} />
              <Text style={styles.impactValue}>{environmentalImpactData.treesEquivalent}</Text>
              <Text style={styles.impactLabel}>Trees Equivalent</Text>
            </View>
            <View style={styles.impactCard}>
              <MaterialIcons name="storage" size={24} color={COLORS.darkGreen} />
              <Text style={styles.impactValue}>{environmentalImpactData.landfillSpaceSaved} m³</Text>
              <Text style={styles.impactLabel}>Landfill Space Saved</Text>
            </View>
            <View style={styles.impactCard}>
              <MaterialIcons name="flash-on" size={24} color={COLORS.darkGreen} />
              <Text style={styles.impactValue}>{environmentalImpactData.energySaved} kWh</Text>
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
            {performanceData.dailyPerformance.map((day, index) => (
              <View key={index} style={styles.chartRow}>
                <Text style={styles.chartDay}>{day.day}</Text>
                <View style={styles.chartBars}>
                  {renderChartBar('Pickups', day.pickups, 15, COLORS.blue)}
                  {renderChartBar('Earnings', day.earnings, 250, COLORS.success)}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Waste Reduction Trend */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="trending-down" size={24} color={COLORS.success} />
            <Text style={styles.sectionTitle}>Waste Reduction Trend</Text>
          </View>
          
          <View style={styles.trendContainer}>
            {(selectedPeriod === 'week' ? wasteReductionData.week.dailyData : wasteReductionData.month.weeklyData.map(w => ({ day: w.week, waste: w.waste, recycled: w.recycled }))).map((day: { day: string; waste: number; recycled: number }, index: number) => (
              <View key={index} style={styles.trendDay}>
                <Text style={styles.trendDayLabel}>{day.day}</Text>
                <View style={styles.trendBars}>
                  <View style={styles.trendBarContainer}>
                    <Text style={styles.trendBarLabel}>Waste</Text>
                    <View style={[styles.trendBar, { backgroundColor: COLORS.error }]}>
                      <View 
                        style={[
                          styles.trendBarFill, 
                          { 
                            width: `${(day.waste / 250) * 100}%`,
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
                            width: `${(day.recycled / 250) * 100}%`,
                            backgroundColor: COLORS.success
                          }
                        ]} 
                      />
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
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
}); 