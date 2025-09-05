import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { COLORS } from '../../constants';
import { supabase } from '../../lib/supabase';

interface EcoPointsStats {
  totalEcoPoints: number;
  completedPickups: number;
  averagePointsPerPickup: number;
  weeklyPoints: number;
  monthlyPoints: number;
  todayPoints: number;
  yesterdayPoints: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  pointsRequired: number;
  earned: boolean;
  earnedDate?: string;
  category: 'pickup' | 'points' | 'environmental' | 'streak';
}

interface EcoPointsHistory {
  id: string;
  date: string;
  time: string;
  pickupId: string;
  points: number;
  wasteType: string;
  weight: string;
  bonusPoints: number;
  customer: string;
}

export default function RecyclerRewardsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [ecoPointsStats, setEcoPointsStats] = useState<EcoPointsStats>({
    totalEcoPoints: 0,
    completedPickups: 0,
    averagePointsPerPickup: 0,
    weeklyPoints: 0,
    monthlyPoints: 0,
    todayPoints: 0,
    yesterdayPoints: 0,
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [ecoPointsHistory, setEcoPointsHistory] = useState<EcoPointsHistory[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [filteredStats, setFilteredStats] = useState({
    filteredPoints: 0,
    filteredPickups: 0,
    filteredAverage: 0
  });

  // Mock achievements data
  const mockAchievements: Achievement[] = [
    {
      id: 'first_pickup',
      title: 'First Pickup',
      description: 'Complete your first waste pickup',
      icon: 'local-shipping',
      pointsRequired: 10,
      earned: true,
      earnedDate: '2024-01-15',
      category: 'pickup'
    },
    {
      id: 'eco_warrior',
      title: 'Eco Warrior',
      description: 'Earn 100 eco points',
      icon: 'eco',
      pointsRequired: 100,
      earned: true,
      earnedDate: '2024-01-20',
      category: 'points'
    },
    {
      id: 'plastic_hero',
      title: 'Plastic Hero',
      description: 'Collect 50kg of plastic waste',
      icon: 'recycling',
      pointsRequired: 75,
      earned: false,
      category: 'environmental'
    },
    {
      id: 'streak_master',
      title: 'Streak Master',
      description: 'Complete pickups for 7 consecutive days',
      icon: 'trending-up',
      pointsRequired: 200,
      earned: false,
      category: 'streak'
    },
    {
      id: 'e_waste_expert',
      title: 'E-Waste Expert',
      description: 'Collect 20kg of electronic waste',
      icon: 'devices',
      pointsRequired: 150,
      earned: false,
      category: 'environmental'
    },
    {
      id: 'eco_champion',
      title: 'Eco Champion',
      description: 'Earn 500 eco points',
      icon: 'star',
      pointsRequired: 500,
      earned: false,
      category: 'points'
    }
  ];

  // Fetch eco points data from database
  const fetchEcoPointsData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Error fetching user:', userError);
        return;
      }

      // Fetch recycler earnings with eco points
      const { data: earningsData, error: earningsError } = await supabase
        .from('recycler_earnings')
        .select('*')
        .eq('recycler_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (earningsError) {
        console.error('Error fetching earnings:', earningsError);
        return;
      }

      // Calculate eco points statistics
      const totalEcoPoints = earningsData?.reduce((sum, earning) => sum + (earning.eco_points_earned || 0), 0) || 0;
      const completedPickups = earningsData?.length || 0;
      const averagePointsPerPickup = completedPickups > 0 ? totalEcoPoints / completedPickups : 0;

      // Calculate today's points
      const today = new Date().toISOString().split('T')[0];
      const todayPoints = earningsData
        ?.filter(earning => earning.completed_at?.startsWith(today))
        .reduce((sum, earning) => sum + (earning.eco_points_earned || 0), 0) || 0;

      // Calculate yesterday's points
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const yesterdayPoints = earningsData
        ?.filter(earning => earning.completed_at?.startsWith(yesterdayStr))
        .reduce((sum, earning) => sum + (earning.eco_points_earned || 0), 0) || 0;

      // Calculate weekly points (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weeklyPoints = earningsData
        ?.filter(earning => new Date(earning.completed_at || '') >= weekAgo)
        .reduce((sum, earning) => sum + (earning.eco_points_earned || 0), 0) || 0;

      // Calculate monthly points (last 30 days)
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      const monthlyPoints = earningsData
        ?.filter(earning => new Date(earning.completed_at || '') >= monthAgo)
        .reduce((sum, earning) => sum + (earning.eco_points_earned || 0), 0) || 0;

      setEcoPointsStats({
        totalEcoPoints,
        completedPickups,
        averagePointsPerPickup,
        weeklyPoints,
        monthlyPoints,
        todayPoints,
        yesterdayPoints,
      });

      // Create eco points history with period filtering
      let filteredEarnings = earningsData || [];
      
      // Apply period filter
      if (selectedPeriod === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filteredEarnings = earningsData?.filter(earning => 
          new Date(earning.completed_at || '') >= weekAgo
        ) || [];
      } else if (selectedPeriod === 'month') {
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        filteredEarnings = earningsData?.filter(earning => 
          new Date(earning.completed_at || '') >= monthAgo
        ) || [];
      }
      // For 'all', use all earnings data (no filtering)

      const history: EcoPointsHistory[] = filteredEarnings.map(earning => ({
        id: earning.id,
        date: earning.completed_at?.split('T')[0] || '',
        time: earning.completed_at?.split('T')[1]?.split('.')[0] || '',
        pickupId: earning.request_id,
        points: earning.eco_points_earned || 0,
        wasteType: earning.waste_type || '',
        weight: earning.weight || '',
        bonusPoints: earning.bonus_points || 0,
        customer: 'Customer', // You might want to join with customers table
      }));

      setEcoPointsHistory(history);

      // Calculate filtered stats for the selected period
      const filteredPoints = filteredEarnings.reduce((sum, earning) => sum + (earning.eco_points_earned || 0), 0);
      const filteredPickups = filteredEarnings.length;
      const filteredAverage = filteredPickups > 0 ? filteredPoints / filteredPickups : 0;

      setFilteredStats({
        filteredPoints,
        filteredPickups,
        filteredAverage
      });

      // Debug logging
      console.log('RecyclerRewardsScreen: Filtered stats updated:', {
        selectedPeriod,
        filteredPoints,
        filteredPickups,
        filteredAverage,
        totalEarnings: earningsData?.length || 0
      });

      // Update achievements based on actual data
      const updatedAchievements = mockAchievements.map(achievement => {
        let earned = false;
        let earnedDate = '';

        switch (achievement.id) {
          case 'first_pickup':
            earned = completedPickups >= 1;
            earnedDate = completedPickups >= 1 ? earningsData?.[0]?.completed_at?.split('T')[0] || '' : '';
            break;
          case 'eco_warrior':
            earned = totalEcoPoints >= 100;
            break;
          case 'plastic_hero':
            const plasticWeight = earningsData
              ?.filter(e => e.waste_type?.toLowerCase().includes('plastic'))
              .reduce((sum, e) => sum + parseFloat(e.weight?.replace(' kg', '') || '0'), 0) || 0;
            earned = plasticWeight >= 50;
            break;
          case 'e_waste_expert':
            const eWasteWeight = earningsData
              ?.filter(e => e.waste_type?.toLowerCase().includes('electronic'))
              .reduce((sum, e) => sum + parseFloat(e.weight?.replace(' kg', '') || '0'), 0) || 0;
            earned = eWasteWeight >= 20;
            break;
          case 'eco_champion':
            earned = totalEcoPoints >= 500;
            break;
        }

        return { ...achievement, earned, earnedDate };
      });

      setAchievements(updatedAchievements);

    } catch (error) {
      console.error('Error fetching eco points data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    fetchEcoPointsData();
  }, [fetchEcoPointsData]);

  // Refetch data when selectedPeriod changes
  useEffect(() => {
    fetchEcoPointsData();
  }, [selectedPeriod, fetchEcoPointsData]);

  // Set up real-time subscription for recycler earnings
  useEffect(() => {
    let subscription: any;

    const setupRealtimeSubscription = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('Error fetching user for realtime subscription:', userError);
          return;
        }

        // Subscribe to recycler_earnings changes for this recycler
        subscription = supabase
          .channel('recycler-earnings-realtime')
          .on(
            'postgres_changes',
            {
              event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
              schema: 'public',
              table: 'recycler_earnings',
              filter: `recycler_id=eq.${user.id}`
            },
            (payload) => {
              console.log('RecyclerRewardsScreen: Real-time earnings update:', payload);
              // Refresh data when earnings change
              fetchEcoPointsData();
            }
          )
          .subscribe();

        console.log('RecyclerRewardsScreen: Real-time subscription established');
      } catch (error) {
        console.error('Error setting up real-time subscription:', error);
      }
    };

    setupRealtimeSubscription();

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        console.log('RecyclerRewardsScreen: Cleaning up real-time subscription');
        subscription.unsubscribe();
      }
    };
  }, [fetchEcoPointsData]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchEcoPointsData();
    setIsRefreshing(false);
  }, [fetchEcoPointsData]);

  // Render achievement card
  const renderAchievementCard = (achievement: Achievement) => (
    <TouchableOpacity
      key={achievement.id}
      style={[
        styles.achievementCard,
        achievement.earned && styles.achievementCardEarned
      ]}
    >
      <View style={styles.achievementIcon}>
        <MaterialIcons 
          name={achievement.icon as any} 
          size={24} 
          color={achievement.earned ? COLORS.darkGreen : COLORS.gray} 
        />
      </View>
      <View style={styles.achievementContent}>
        <Text style={[
          styles.achievementTitle,
          achievement.earned && styles.achievementTitleEarned
        ]}>
          {achievement.title}
        </Text>
        <Text style={styles.achievementDescription}>
          {achievement.description}
        </Text>
        <Text style={styles.achievementPoints}>
          {achievement.pointsRequired} points
        </Text>
        {achievement.earned && achievement.earnedDate && (
          <Text style={styles.achievementDate}>
            Earned on {new Date(achievement.earnedDate).toLocaleDateString()}
          </Text>
        )}
      </View>
      {achievement.earned && (
        <View style={styles.achievementBadge}>
          <MaterialIcons name="check-circle" size={20} color={COLORS.darkGreen} />
        </View>
      )}
    </TouchableOpacity>
  );

  // Render eco points history item
  const renderHistoryItem = (item: EcoPointsHistory) => (
    <View key={item.id} style={styles.historyItem}>
      <View style={styles.historyIcon}>
        <MaterialIcons name="eco" size={20} color={COLORS.darkGreen} />
      </View>
      <View style={styles.historyContent}>
        <Text style={styles.historyWasteType}>{item.wasteType}</Text>
        <Text style={styles.historyDetails}>
          {item.weight} • {item.date} at {item.time}
        </Text>
      </View>
      <View style={styles.historyPoints}>
        <Text style={styles.historyPointsText}>+{item.points}</Text>
        {item.bonusPoints > 0 && (
          <Text style={styles.historyBonusText}>(+{item.bonusPoints} bonus)</Text>
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.darkGreen} />
        <Text style={styles.loadingText}>Loading eco points data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.darkGreen} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Eco Points & Rewards</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
        bounces={true}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Eco Points Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="eco" size={24} color={COLORS.darkGreen} />
            <Text style={styles.sectionTitle}>Your Eco Points</Text>
          </View>
          
          <View style={styles.pointsOverviewCard}>
            <Text style={styles.totalPoints}>{filteredStats.filteredPoints}</Text>
            <Text style={styles.totalPointsLabel}>
              {selectedPeriod === 'week' ? 'This Week' : 
               selectedPeriod === 'month' ? 'This Month' : 'All Time'} Eco Points
            </Text>
            <View style={styles.pointsBreakdown}>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Pickups</Text>
                <Text style={styles.breakdownValue}>{filteredStats.filteredPickups}</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Average</Text>
                <Text style={styles.breakdownValue}>{filteredStats.filteredAverage.toFixed(1)}</Text>
              </View>
            </View>
          </View>
        </View>

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
          <TouchableOpacity 
            style={[styles.periodButton, selectedPeriod === 'all' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('all')}
          >
            <Text style={[styles.periodText, selectedPeriod === 'all' && styles.periodTextActive]}>
              All Time
            </Text>
          </TouchableOpacity>
        </View>

        {/* Eco Points Statistics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="analytics" size={24} color={COLORS.darkBlue} />
            <Text style={styles.sectionTitle}>Points Statistics</Text>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <MaterialIcons name="local-shipping" size={20} color={COLORS.darkBlue} />
              <Text style={styles.statNumber}>{filteredStats.filteredPickups}</Text>
              <Text style={styles.statLabel}>
                {selectedPeriod === 'week' ? 'This Week' : 
                 selectedPeriod === 'month' ? 'This Month' : 'All Time'} Pickups
              </Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="trending-up" size={20} color={COLORS.green} />
              <Text style={styles.statNumber}>{Math.round(filteredStats.filteredAverage)}</Text>
              <Text style={styles.statLabel}>Avg Points/Pickup</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="calendar-today" size={20} color={COLORS.secondary} />
              <Text style={styles.statNumber}>{ecoPointsStats.todayPoints}</Text>
              <Text style={styles.statLabel}>Today's Points</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="eco" size={20} color={COLORS.primary} />
              <Text style={styles.statNumber}>{filteredStats.filteredPoints}</Text>
              <Text style={styles.statLabel}>
                {selectedPeriod === 'week' ? 'Weekly' : 
                 selectedPeriod === 'month' ? 'Monthly' : 'Total'} Points
              </Text>
            </View>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="emoji-events" size={24} color={COLORS.orange} />
            <Text style={styles.sectionTitle}>Achievements</Text>
          </View>
          
          <View style={styles.achievementsContainer}>
            {achievements.map(renderAchievementCard)}
          </View>
        </View>

        {/* Eco Points History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="history" size={24} color={COLORS.black} />
            <Text style={styles.sectionTitle}>Points History</Text>
          </View>
          
          <View style={styles.historyContainer}>
            {ecoPointsHistory.length > 0 ? (
              ecoPointsHistory.map(renderHistoryItem)
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="eco" size={48} color={COLORS.gray} />
                <Text style={styles.emptyStateText}>No eco points earned yet</Text>
                <Text style={styles.emptyStateSubtext}>Complete pickups to start earning eco points!</Text>
              </View>
            )}
          </View>
        </View>

        {/* How to Earn Points */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="lightbulb" size={24} color={COLORS.secondary} />
            <Text style={styles.sectionTitle}>How to Earn Points</Text>
          </View>
          
          <View style={styles.tipsContainer}>
            <View style={styles.tipCard}>
              <MaterialIcons name="eco" size={20} color={COLORS.primary} />
              <View style={styles.tipTextContainer}>
                <Text style={styles.tipTitle}>Base Points</Text>
                <Text style={styles.tipText}>1 point per kg of waste collected</Text>
              </View>
            </View>
            <View style={styles.tipCard}>
              <MaterialIcons name="recycling" size={20} color={COLORS.primary} />
              <View style={styles.tipTextContainer}>
                <Text style={styles.tipTitle}>Plastic Bonus</Text>
                <Text style={styles.tipText}>1.5x points for plastic waste</Text>
              </View>
            </View>
            <View style={styles.tipCard}>
              <MaterialIcons name="devices" size={20} color={COLORS.primary} />
              <View style={styles.tipTextContainer}>
                <Text style={styles.tipTitle}>E-Waste Bonus</Text>
                <Text style={styles.tipText}>2x points for electronic waste</Text>
              </View>
            </View>
            <View style={styles.tipCard}>
              <MaterialIcons name="description" size={20} color={COLORS.primary} />
              <View style={styles.tipTextContainer}>
                <Text style={styles.tipTitle}>Paper Bonus</Text>
                <Text style={styles.tipText}>1.2x points for paper waste</Text>
              </View>
            </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.darkGreen,
    fontWeight: 'bold',
    marginTop: 16,
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
    color: COLORS.black,
  },
  headerSpacer: {
    width: 34,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginLeft: 8,
  },
  pointsOverviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalPoints: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 8,
  },
  totalPointsLabel: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 20,
  },
  pointsBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  breakdownValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 4,
    marginVertical: 10,
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
    backgroundColor: COLORS.darkGreen,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
  },
  periodTextActive: {
    color: COLORS.white,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
  },
  achievementsContainer: {
    gap: 12,
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementCardEarned: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.darkGreen,
  },
  achievementIcon: {
    marginRight: 12,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 4,
  },
  achievementTitleEarned: {
    color: COLORS.darkGreen,
  },
  achievementDescription: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  achievementPoints: {
    fontSize: 12,
    color: COLORS.orange,
    fontWeight: '600',
  },
  achievementDate: {
    fontSize: 12,
    color: COLORS.darkGreen,
    marginTop: 4,
  },
  achievementBadge: {
    marginLeft: 8,
  },
  historyContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  historyIcon: {
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyWasteType: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 2,
  },
  historyDetails: {
    fontSize: 14,
    color: COLORS.gray,
  },
  historyPoints: {
    alignItems: 'flex-end',
  },
  historyPointsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  historyBonusText: {
    fontSize: 12,
    color: COLORS.orange,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
  },
  tipsContainer: {
    gap: 12,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },
});
