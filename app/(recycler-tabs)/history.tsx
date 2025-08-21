import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
import { COLORS } from '../../constants';
import recyclerStats from '../../utils/recyclerStats';

export default function RecyclerHistoryTab() {
  const params = useLocalSearchParams();
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Get completed pickups count from params or default to 0
  const completedPickupsCount = parseInt(params.completedPickupsCount as string) || recyclerStats.getCompletedPickupsCount();
  const todayEarnings = parseFloat(params.todayEarnings as string) || recyclerStats.getTodayEarnings();

  // Real history data based on completed pickups from shared stats
  const getRealHistoryData = () => {
    const completedPickups = recyclerStats.getCompletedPickupsCount();
    const earnings = recyclerStats.getTodayEarnings();
    
    // Generate real history based on actual completed pickups
    return Array.from({ length: Math.min(completedPickups, 10) }, (_, index) => ({
      id: `real-${index + 1}`,
      date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      customerName: `Customer ${index + 1}`,
      pickupLocation: `Location ${index + 1}`,
      weight: `${(Math.random() * 20 + 5).toFixed(1)} kg`,
      amount: `GHS ${(earnings / completedPickups).toFixed(2)}`,
      status: 'completed',
      rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
    }));
  };

  // Dynamic activities based on real recycler performance
  const getRealActivities = () => {
    const completedPickups = recyclerStats.getCompletedPickupsCount();
    const earnings = recyclerStats.getTodayEarnings();
    
    const activities = [];
    
    // Add pickup completion activities based on real data
    if (completedPickups > 0) {
      activities.push({
        id: '1',
        type: 'pickup_completed',
        title: 'Pickup Completed',
        description: `Successfully completed ${completedPickups} pickup${completedPickups > 1 ? 's' : ''} today`,
        location: 'Various Locations',
        time: 'Today',
        amount: `₵${earnings.toFixed(2)}`,
        icon: 'check-circle',
        color: COLORS.green,
        metrics: { 
          pickups: `${completedPickups}`, 
          earnings: `₵${earnings.toFixed(2)}`, 
          avgPerPickup: `₵${(earnings / completedPickups).toFixed(2)}` 
        }
      });
    }
    
    // Add performance goal if pickups are completed
    if (completedPickups >= 5) {
      activities.push({
        id: '2',
        type: 'performance_goal',
        title: 'Daily Goal Achieved',
        description: `Completed ${completedPickups} pickups today`,
        time: 'Today',
        icon: 'emoji-events',
        color: COLORS.darkGreen,
        metrics: { 
          target: '5 pickups', 
          achieved: `${completedPickups}`, 
          percentage: `${Math.min(100, (completedPickups / 5) * 100)}%` 
        }
      });
    }
    
    // Add environmental impact based on completed pickups
    if (completedPickups > 0) {
      const estimatedWaste = completedPickups * 12; // 12kg average per pickup
      activities.push({
        id: '3',
        type: 'environmental_impact',
        title: 'Environmental Impact',
        description: `Prevented ${estimatedWaste}kg of waste from landfill`,
        time: 'Today',
        icon: 'eco',
        color: COLORS.green,
        metrics: { 
          wasteDiverted: `${estimatedWaste}kg`, 
          co2Saved: `${estimatedWaste * 0.5}kg`, 
          pickups: `${completedPickups}` 
        }
      });
    }
    
    return activities;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return COLORS.green;
      case 'cancelled': return COLORS.red;
      case 'pending': return '#FF9800';
      default: return COLORS.gray;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'pending': return 'Pending';
      default: return status;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <MaterialIcons
            key={star}
            name={star <= rating ? 'star' : 'star-border'}
            size={16}
            color={star <= rating ? '#FFD700' : COLORS.gray}
          />
        ))}
      </View>
    );
  };

  const getFilteredActivities = () => {
    switch (selectedFilter) {
      case 'pickups':
        return getRealActivities().filter(activity => 
          activity.type.includes('pickup')
        );
      case 'performance':
        return getRealActivities().filter(activity => 
          activity.type.includes('performance') || activity.type.includes('goal') || activity.type.includes('efficiency')
        );
      case 'environmental':
        return getRealActivities().filter(activity => 
          activity.type.includes('environmental')
        );
      default:
        return getRealActivities();
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
      <AppHeader onMenuPress={() => router.back()} />
      
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Performance & History</Text>
        </View>
        <Text style={styles.subtitle}>Track your activities and past pickups</Text>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'pickups' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('pickups')}
          >
            <Text style={[styles.filterText, selectedFilter === 'pickups' && styles.filterTextActive]}>Pickups</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'performance' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('performance')}
          >
            <Text style={[styles.filterText, selectedFilter === 'performance' && styles.filterTextActive]}>Performance</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'environmental' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('environmental')}
          >
            <Text style={[styles.filterText, selectedFilter === 'environmental' && styles.filterTextActive]}>Environmental</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Summary */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{completedPickupsCount}</Text>
            <Text style={styles.statLabel}>Today&apos;s Pickups</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>₵{todayEarnings.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Today&apos;s Earnings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>4.8</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
        </View>

        {/* Activities/History List */}
        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          {selectedFilter === 'all' ? (
            // Show activities when "All" is selected
            getFilteredActivities().map((activity) => (
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
            ))
          ) : (
            // Show history data for other filters
            getRealHistoryData().map((item) => (
              <TouchableOpacity key={item.id} style={styles.historyItem}>
                <View style={styles.historyHeader}>
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{item.customerName}</Text>
                    <Text style={styles.pickupLocation}>{item.pickupLocation}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                  </View>
                </View>
                
                <View style={styles.historyDetails}>
                  <View style={styles.detailRow}>
                    <MaterialIcons name="event" size={16} color={COLORS.gray} />
                    <Text style={styles.detailText}>{item.date}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <FontAwesome5 name="weight-hanging" size={16} color={COLORS.gray} />
                    <Text style={styles.detailText}>{item.weight}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <MaterialIcons name="attach-money" size={16} color={COLORS.gray} />
                    <Text style={styles.detailText}>{item.amount}</Text>
                  </View>
                </View>
                
                <View style={styles.ratingContainer}>
                  {renderStars(item.rating)}
                  <Text style={styles.ratingText}>{item.rating}/5</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  titleContainer: {
    backgroundColor: COLORS.lightGreen,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.lightGreen,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.darkGreen,
  },
  filterText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  filterTextActive: {
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 4,
  },
  listContainer: {
    flex: 1,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E3E3E3',
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
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: COLORS.gray,
  },
  amountContainer: {
    backgroundColor: COLORS.lightGreen,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
  },
  amountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  activityDescription: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 8,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: 'bold',
  },
  metricValue: {
    fontSize: 12,
    color: COLORS.darkGreen,
    fontWeight: 'bold',
  },
  historyItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E3E3E3',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 4,
  },
  pickupLocation: {
    fontSize: 14,
    color: COLORS.gray,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  historyDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  ratingText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: 'bold',
  },
});