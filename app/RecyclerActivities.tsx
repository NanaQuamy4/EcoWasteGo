import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppHeader from '../components/AppHeader';
import { COLORS } from '../constants';

export default function RecyclerActivities() {
  const params = useLocalSearchParams();
  const [selectedFilter, setSelectedFilter] = useState('pickups');

  // Get completed pickups count from params or default to 0
  const completedPickupsCount = parseInt(params.completedPickupsCount as string) || 0;
  const todayEarnings = parseFloat(params.todayEarnings as string) || 156.80;

  // Mock activities data focused on work performance
  const activities = [
    {
      id: '1',
      type: 'pickup_completed',
      title: 'Pickup Completed',
      description: 'Successfully collected 15kg of plastic waste',
      location: 'Gold hostel - Komfo Anokye',
      time: '2 hours ago',
      amount: '₵18.00',
      icon: 'check-circle',
      color: COLORS.green,
      metrics: { weight: '15kg', wasteType: 'Plastic', efficiency: '95%' }
    },
    {
      id: '2',
      type: 'route_completed',
      title: 'Route Completed',
      description: 'Completed 3 pickups in 2.5 hours',
      location: 'KNUST Campus Area',
      time: '4 hours ago',
      amount: '₵45.50',
      icon: 'navigation',
      color: COLORS.primary,
      metrics: { distance: '8.2km', stops: '3', time: '2.5h' }
    },
    {
      id: '3',
      type: 'performance_goal',
      title: 'Daily Goal Achieved',
      description: 'Reached 80% of daily pickup target',
      time: '6 hours ago',
      icon: 'emoji-events',
      color: COLORS.darkGreen,
      metrics: { target: '20 pickups', achieved: '16', percentage: '80%' }
    },
    {
      id: '4',
      type: 'environmental_impact',
      title: 'Environmental Impact',
      description: 'Prevented 25kg of waste from landfill',
      time: '1 day ago',
      icon: 'eco',
      color: COLORS.green,
      metrics: { co2Saved: '12kg', treesEquivalent: '0.5', wasteDiverted: '25kg' }
    },
    {
      id: '5',
      type: 'efficiency_improvement',
      title: 'Efficiency Improved',
      description: 'Reduced average pickup time by 15%',
      time: '1 day ago',
      icon: 'trending-up',
      color: COLORS.primary,
      metrics: { improvement: '15%', avgTime: '12min', savings: '₵8.50' }
    },
    {
      id: '6',
      type: 'quality_score',
      title: 'Quality Score',
      description: 'Maintained 4.8/5 customer satisfaction',
      time: '2 days ago',
      icon: 'star',
      color: COLORS.darkGreen,
      metrics: { rating: '4.8/5', reviews: '12', satisfaction: '96%' }
    }
  ];

  const getFilteredActivities = () => {
    switch (selectedFilter) {
      case 'pickups':
        return activities.filter(activity => 
          activity.type.includes('pickup')
        );
      case 'performance':
        return activities.filter(activity => 
          activity.type.includes('performance') || activity.type.includes('goal') || activity.type.includes('efficiency')
        );
      case 'environmental':
        return activities.filter(activity => 
          activity.type.includes('environmental')
        );
      default:
        return activities;
    }
  };

  const getActivityIcon = (iconName: string) => {
    return <MaterialIcons name={iconName as any} size={24} color={COLORS.white} />;
  };

  const handleActivityPress = (activity: any) => {
    Alert.alert(
      activity.title,
      `${activity.description}\n\nMetrics:\n${Object.entries(activity.metrics || {}).map(([key, value]) => `${key}: ${value}`).join('\n')}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader 
        leftIcon="arrow-left"
        onLeftPress={() => router.back()}
      />
      
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.titleRectangle}>
          <Text style={styles.headerTitle}>Activities</Text>
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === 'pickups' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('pickups')}
        >
          <Text style={[styles.filterButtonText, selectedFilter === 'pickups' && styles.filterButtonTextActive]}>
            Pickups
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === 'performance' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('performance')}
        >
          <Text style={[styles.filterButtonText, selectedFilter === 'performance' && styles.filterButtonTextActive]}>
            Performance
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === 'environmental' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('environmental')}
        >
          <Text style={[styles.filterButtonText, selectedFilter === 'environmental' && styles.filterButtonTextActive]}>
            Environmental
          </Text>
        </TouchableOpacity>
      </View>

      {/* Activities List */}
      <ScrollView style={styles.activitiesContainer} showsVerticalScrollIndicator={false}>
        {getFilteredActivities().map((activity) => (
          <TouchableOpacity 
            key={activity.id} 
            style={styles.activityCard}
            onPress={() => handleActivityPress(activity)}
          >
            <View style={styles.activityHeader}>
              <View style={[styles.activityIcon, { backgroundColor: activity.color }]}>
                {getActivityIcon(activity.icon)}
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
              {activity.amount && (
                <View style={styles.amountContainer}>
                  <Text style={styles.amountText}>{activity.amount}</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.activityDescription}>{activity.description}</Text>
            
            {activity.location && (
              <View style={styles.locationContainer}>
                <MaterialIcons name="location-on" size={16} color={COLORS.gray} />
                <Text style={styles.locationText}>{activity.location}</Text>
              </View>
            )}

            {/* Metrics Display */}
            {activity.metrics && (
              <View style={styles.metricsContainer}>
                {Object.entries(activity.metrics).map(([key, value], index) => (
                  <View key={index} style={styles.metricItem}>
                    <Text style={styles.metricLabel}>{key}:</Text>
                    <Text style={styles.metricValue}>{value}</Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Performance Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{completedPickupsCount}</Text>
          <Text style={styles.statLabel}>Today's Pickups</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>₵{todayEarnings.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Today's Earnings</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>4.8/5</Text>
          <Text style={styles.statLabel}>Avg Rating</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    textAlign: 'center',
  },
  titleRectangle: {
    backgroundColor: COLORS.lightGreen,
    borderRadius: 20,
    paddingHorizontal: 30,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.darkGreen,
  },
  filterButtonText: {
    color: COLORS.darkGreen,
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  activitiesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  activityCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  activityTime: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  amountContainer: {
    backgroundColor: COLORS.lightGreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  amountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  activityDescription: {
    fontSize: 14,
    color: COLORS.black,
    marginBottom: 8,
    lineHeight: 20,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 4,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  metricItem: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: COLORS.gray,
    marginRight: 4,
  },
  metricValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.lightGreen,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 4,
  },
});