import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
import { COLORS } from '../../constants';
import { useNotificationCountSimple } from '../../hooks/useNotificationCountSimple';
import { supabase } from '../../lib/supabase';
export default function RecyclerHistoryTab() {
  // const params = useLocalSearchParams();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Real data state
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [activitiesData, setActivitiesData] = useState<any[]>([]);
  const [statsData, setStatsData] = useState({
    completedPickupsCount: 0,
    todayEarnings: 0,
    averageRating: 0,
  });

  // Notification state using the same hook as home screen
  const { notificationCount } = useNotificationCountSimple();

  // ===== DATA FETCHING FUNCTIONS =====
  const loadHistoryData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      
      if (!currentUser) {
        console.log('No current user, skipping history data load');
        return;
      }

      // Fetch recycler earnings with pickup request and customer data
      const { data: earningsData, error: earningsError } = await supabase
        .from('recycler_earnings')
        .select(`
          *,
          pickup_requests!inner(
            id,
            customer_id,
            pickup_address,
            waste_type,
            status,
            created_at,
            customers!inner(
              id,
              full_name,
              phone
            )
          )
        `)
        .eq('recycler_id', currentUser.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (earningsError) {
        console.error('Error fetching history data:', earningsError);
        throw earningsError;
      }

      // Transform earnings data to history format
      const transformedHistory = earningsData?.map((earning, index) => ({
        id: earning.id,
        date: new Date(earning.completed_at).toISOString().split('T')[0],
        customerName: earning.pickup_requests.customers?.full_name || 'Unknown Customer',
        pickupLocation: earning.pickup_requests.pickup_address || 'Unknown Location',
        weight: `${earning.weight || 0} kg`,
        amount: `₵${(earning.recycler_earnings || 0).toFixed(2)}`,
        status: 'completed',
        rating: Math.floor(Math.random() * 2) + 4, // TODO: Get real rating from reviews
        wasteType: earning.waste_type,
        ecoPoints: earning.eco_points_earned || 0,
        completedAt: earning.completed_at,
      })) || [];

      setHistoryData(transformedHistory);

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEarnings = earningsData?.filter(earning => 
        new Date(earning.completed_at) >= today
      ) || [];

      // const totalEarnings = earningsData?.reduce((sum, earning) => sum + (earning.recycler_earnings || 0), 0) || 0;
      const completedPickups = earningsData?.length || 0;
      const todayPickups = todayEarnings.length;
      const todayEarningsAmount = todayEarnings.reduce((sum, earning) => sum + (earning.recycler_earnings || 0), 0);

      setStatsData({
        completedPickupsCount: todayPickups,
        todayEarnings: todayEarningsAmount,
        averageRating: 4.8, // TODO: Calculate from real reviews
      });

      // Generate activities based on real data
      generateActivities(earningsData || []);

      console.log('History data loaded successfully:', {
        totalPickups: completedPickups,
        todayPickups,
        todayEarnings: todayEarningsAmount
      });
      
    } catch (error) {
      console.error('Error loading history data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Generate activities based on real earnings data
  const generateActivities = (earningsData: any[]) => {
    const activities = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayEarnings = earningsData.filter(earning => 
      new Date(earning.completed_at) >= today
    );
    
    // const totalEarnings = earningsData.reduce((sum, earning) => sum + (earning.recycler_earnings || 0), 0);
    const totalWaste = earningsData.reduce((sum, earning) => sum + (earning.weight || 0), 0);

    // Pickup completion activity
    if (todayEarnings.length > 0) {
      activities.push({
        id: '1',
        type: 'pickup_completed',
        title: 'Pickup Completed',
        description: `Successfully completed ${todayEarnings.length} pickup${todayEarnings.length > 1 ? 's' : ''} today`,
        location: 'Various Locations',
        time: 'Today',
        amount: `₵${todayEarnings.reduce((sum, earning) => sum + (earning.recycler_earnings || 0), 0).toFixed(2)}`,
        icon: 'check-circle',
        color: COLORS.green,
        metrics: { 
          pickups: `${todayEarnings.length}`, 
          earnings: `₵${todayEarnings.reduce((sum, earning) => sum + (earning.recycler_earnings || 0), 0).toFixed(2)}`, 
          avgPerPickup: `₵${(todayEarnings.reduce((sum, earning) => sum + (earning.recycler_earnings || 0), 0) / todayEarnings.length).toFixed(2)}` 
        }
      });
    }

    // Performance goal activity
    if (todayEarnings.length >= 5) {
      activities.push({
        id: '2',
        type: 'performance_goal',
        title: 'Daily Goal Achieved',
        description: `Completed ${todayEarnings.length} pickups today`,
        time: 'Today',
        icon: 'emoji-events',
        color: COLORS.darkGreen,
        metrics: { 
          target: '5 pickups', 
          achieved: `${todayEarnings.length}`, 
          percentage: `${Math.min(100, (todayEarnings.length / 5) * 100)}%` 
        }
      });
    }

    // Environmental impact activity
    if (totalWaste > 0) {
      activities.push({
        id: '3',
        type: 'environmental_impact',
        title: 'Environmental Impact',
        description: `Prevented ${totalWaste.toFixed(1)}kg of waste from landfill`,
        time: 'All Time',
        icon: 'eco',
        color: COLORS.green,
        metrics: { 
          wasteDiverted: `${totalWaste.toFixed(1)}kg`, 
          co2Saved: `${(totalWaste * 0.5).toFixed(1)}kg`, 
          pickups: `${earningsData.length}` 
        }
      });
    }

    setActivitiesData(activities);
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
      loadHistoryData();
    }
  }, [currentUser, loadHistoryData]);

  // ===== REFRESH HANDLER =====
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadHistoryData(false);
    setIsRefreshing(false);
  }, [loadHistoryData]);

  // ===== NOTIFICATION HANDLER =====
  const handleNotificationPress = useCallback(() => {
    router.push('/recycler-screens/RecyclerNotificationScreen');
  }, []);

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
        return activitiesData.filter(activity => 
          activity.type.includes('pickup')
        );
      case 'performance':
        return activitiesData.filter(activity => 
          activity.type.includes('performance') || activity.type.includes('goal') || activity.type.includes('efficiency')
        );
      case 'environmental':
        return activitiesData.filter(activity => 
          activity.type.includes('environmental')
        );
      default:
        return activitiesData;
    }
  };

  const getFilteredHistory = () => {
    switch (selectedFilter) {
      case 'pickups':
        return historyData;
      case 'performance':
        return historyData; // All history items are performance-related
      case 'environmental':
        return historyData; // All history items have environmental impact
      default:
        return historyData;
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
        onMenuPress={() => router.back()} 
        onNotificationPress={handleNotificationPress}
        notificationCount={notificationCount}
      />
      
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
            <Text style={styles.statNumber}>{statsData.completedPickupsCount}</Text>
            <Text style={styles.statLabel}>Today&apos;s Pickups</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>₵{statsData.todayEarnings.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Today&apos;s Earnings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{statsData.averageRating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
        </View>

        {/* Activities/History List */}
        <ScrollView 
          style={styles.listContainer} 
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
              <Text style={styles.loadingText}>Loading history...</Text>
            </View>
          )}

          {!isLoading && (
            <>
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
                            <Text style={styles.metricValue}>{String(value)}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                // Show history data for other filters
                getFilteredHistory().map((item) => (
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
                      {item.wasteType && (
                        <View style={styles.detailRow}>
                          <MaterialIcons name="recycling" size={16} color={COLORS.gray} />
                          <Text style={styles.detailText}>{item.wasteType}</Text>
                        </View>
                      )}
                      {item.ecoPoints > 0 && (
                        <View style={styles.detailRow}>
                          <MaterialIcons name="eco" size={16} color={COLORS.green} />
                          <Text style={styles.detailText}>{item.ecoPoints} eco points</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.ratingContainer}>
                      {renderStars(item.rating)}
                      <Text style={styles.ratingText}>{item.rating}/5</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}

              {/* Empty State */}
              {((selectedFilter === 'all' && getFilteredActivities().length === 0) || 
                (selectedFilter !== 'all' && getFilteredHistory().length === 0)) && (
                <View style={styles.emptyStateContainer}>
                  <MaterialIcons name="history" size={48} color={COLORS.gray} />
                  <Text style={styles.emptyStateTitle}>No History Yet</Text>
                  <Text style={styles.emptyStateText}>
                    {selectedFilter === 'all' 
                      ? 'Complete your first pickup to see activities here'
                      : 'Complete your first pickup to see history here'
                    }
                  </Text>
                </View>
              )}
            </>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.gray,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});