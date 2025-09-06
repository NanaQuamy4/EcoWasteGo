import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, DIMENSIONS } from '../../constants';
import { supabase } from '../../lib/supabase';

// Local helper functions (replacing constants/helpers)
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


interface HistoryItem {
  id: string;
  date: string;
  recyclerName: string;
  pickupLocation: string;
  weight: string;
  amount: string;
  status: string;
  recyclerImage: any;
  rating?: number;
  recyclerPhone?: string;
  pickupTime?: string;
  environmentalTax?: string;
  notes?: string;
  wasteType?: string;
  totalAmount?: string;
  ecoPoints?: number;
  recyclerId?: string;
  completedAt?: string;
}

export default function HistoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'completed' | 'cancelled' | 'pending'>('all');
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Handle completed pickup from EcoImpactCelebration
  useEffect(() => {
    if (params.completedPickup === 'true') {
      const requestId = params.requestId as string;
      const recyclerName = params.recyclerName as string;
      const pickup = params.pickup as string;
      const weight = params.weight as string;
      const wasteType = params.wasteType as string;
      const amount = params.amount as string;
      const environmentalTax = params.environmentalTax as string;
      const totalAmount = params.totalAmount as string;

      // Add the new completed pickup to history
      const newPickup: HistoryItem = {
        id: requestId,
        date: new Date().toISOString().split('T')[0],
        recyclerName: recyclerName,
        pickupLocation: pickup,
        weight: weight,
        amount: `GHS ${amount}`,
        status: 'completed',
        recyclerImage: require('../../assets/images/blend.jpg'), // Use existing image
        wasteType: wasteType,
        totalAmount: `GHS ${totalAmount}`,
        environmentalTax: `GHS ${environmentalTax}`,
        pickupTime: new Date().toTimeString().split(' ')[0].substring(0, 5)
      };

      setHistoryData(prev => [newPickup, ...prev]);
    }
  }, [params.completedPickup, params.requestId, params.recyclerName, params.pickup, params.weight, params.wasteType, params.amount, params.environmentalTax, params.totalAmount]);

  // ===== DATA FETCHING FUNCTIONS =====
  const loadHistoryData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      
      if (!currentUser) {
        console.log('No current user, skipping history data load');
        return;
      }

      // Fetch pickup requests with recycler and payment data
      const { data: pickupData, error: pickupError } = await supabase
        .from('pickup_requests')
        .select(`
          id,
          pickup_address,
          waste_type,
          estimated_weight,
          status,
          created_at,
          pickup_completed_at,
          final_price,
          customer_rating,
          recycler_notes,
                  recyclers(
          id,
          full_name,
          phone
        ),
          payment_summaries(
            id,
            base_amount,
            environmental_tax,
            total_amount,
            status
          )
        `)
        .eq('customer_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (pickupError) {
        console.error('Error fetching pickup history:', pickupError);
        throw pickupError;
      }

      // Transform pickup data to history format
      const transformedHistory = pickupData?.map((pickup) => ({
        id: pickup.id,
        date: new Date(pickup.created_at).toISOString().split('T')[0],
        recyclerName: pickup.recyclers?.[0]?.full_name || 'Unknown Recycler',
        pickupLocation: pickup.pickup_address || 'Unknown Location',
        weight: `${pickup.estimated_weight || 0} kg`,
        amount: `₵${(pickup.final_price || 0).toFixed(2)}`,
        status: pickup.status,
        recyclerImage: require('../../assets/images/blend.jpg'), // Default image
        rating: pickup.customer_rating || 0,
        recyclerPhone: pickup.recyclers?.[0]?.phone || '',
        pickupTime: pickup.pickup_completed_at ? 
          new Date(pickup.pickup_completed_at).toTimeString().split(' ')[0].substring(0, 5) : 
          new Date(pickup.created_at).toTimeString().split(' ')[0].substring(0, 5),
        environmentalTax: pickup.payment_summaries?.[0]?.environmental_tax ? 
          `₵${pickup.payment_summaries[0].environmental_tax}` : '',
        notes: pickup.recycler_notes || '',
        wasteType: pickup.waste_type || 'General',
        totalAmount: pickup.payment_summaries?.[0]?.total_amount ? 
          `₵${pickup.payment_summaries[0].total_amount}` : `₵${(pickup.final_price || 0).toFixed(2)}`,
        recyclerId: pickup.recyclers?.[0]?.id,
        completedAt: pickup.pickup_completed_at,
      })) || [];

      setHistoryData(transformedHistory);

      console.log('History data loaded successfully:', {
        totalPickups: transformedHistory.length,
        completedPickups: transformedHistory.filter(item => item.status === 'completed').length
      });
      
    } catch (error) {
      console.error('Error loading history data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

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

  const filteredHistory = historyData.filter(item => {
    if (selectedFilter === 'all') return true;
    return item.status === selectedFilter;
  });

  // ===== REFRESH HANDLER =====
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadHistoryData(false);
    setIsRefreshing(false);
  }, [loadHistoryData]);

  // ===== REAL-TIME UPDATES =====
  useEffect(() => {
    if (!currentUser) return;

    // Subscribe to pickup request changes
    const channel = supabase
      .channel('customer-pickup-history')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pickup_requests',
          filter: `customer_id=eq.${currentUser.id}`,
        },
        (payload) => {
          console.log('Pickup request change detected:', payload);
          loadHistoryData(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, loadHistoryData]);

  const handleFilterPress = (filter: 'all' | 'completed' | 'cancelled' | 'pending') => {
    setSelectedFilter(filter);
  };

  const handleHistoryItemPress = (item: HistoryItem) => {
    // Navigate to detailed view with item data
    router.push({
      pathname: '/customer-screens/HistoryDetail' as any,
      params: {
        id: item.id,
        date: item.date,
        recyclerName: item.recyclerName,
        pickupLocation: item.pickupLocation,
        weight: item.weight,
        amount: item.amount,
        status: item.status,
        rating: item.rating?.toString() || '',
        recyclerPhone: item.recyclerPhone || '',
        pickupTime: item.pickupTime || '',
        environmentalTax: item.environmentalTax || '',
        notes: item.notes || '',
        wasteType: item.wasteType || '',
        totalAmount: item.totalAmount || '',
      }
    });
  };

  const renderHistoryItem = ({ item }: { item: HistoryItem }) => (
    <TouchableOpacity style={styles.historyItem} onPress={() => handleHistoryItemPress(item)}>
      <View style={styles.historyHeader}>
        <View style={styles.recyclerInfo}>
          <Image source={item.recyclerImage} style={styles.recyclerImage} />
          <View style={styles.recyclerDetails}>
            <Text style={styles.recyclerName}>{item.recyclerName}</Text>
            <Text style={styles.pickupLocation}>{item.pickupLocation}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.historyDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date:</Text>
          <Text style={styles.detailValue}>{item.date}</Text>
        </View>
        {item.wasteType && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Waste Type:</Text>
            <Text style={styles.detailValue}>{item.wasteType}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Weight:</Text>
          <Text style={styles.detailValue}>{item.weight}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount:</Text>
          <Text style={[styles.detailValue, styles.amountText]}>{item.amount}</Text>
        </View>
        {item.totalAmount && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Amount:</Text>
            <Text style={[styles.detailValue, styles.totalAmountText]}>{item.totalAmount}</Text>
          </View>
        )}
        {item.ecoPoints && item.ecoPoints > 0 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Eco Points:</Text>
            <Text style={[styles.detailValue, styles.ecoPointsText]}>+{item.ecoPoints}</Text>
          </View>
        )}
        {item.rating && item.rating > 0 && (
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>Rating:</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Text key={star} style={[styles.star, star <= item.rating! ? styles.starFilled : styles.starEmpty]}>
                  ★
                </Text>
              ))}
            </View>
          </View>
        )}
      </View>
      
      {/* Tap indicator */}
      <View style={styles.tapIndicator}>
        <Text style={styles.tapText}>Tap for details</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>No pickup history yet</Text>
      <Text style={styles.emptyStateSubtext}>Your completed pickups will appear here</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
          onPress={() => handleFilterPress('all')}
        >
          <Text style={[styles.filterButtonText, selectedFilter === 'all' && styles.filterButtonTextActive]}>
            All ({historyData.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === 'completed' && styles.filterButtonActive]}
          onPress={() => handleFilterPress('completed')}
        >
          <Text style={[styles.filterButtonText, selectedFilter === 'completed' && styles.filterButtonTextActive]}>
            Completed ({historyData.filter(item => item.status === 'completed').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === 'pending' && styles.filterButtonActive]}
          onPress={() => handleFilterPress('pending')}
        >
          <Text style={[styles.filterButtonText, selectedFilter === 'pending' && styles.filterButtonTextActive]}>
            Pending ({historyData.filter(item => item.status === 'pending').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === 'cancelled' && styles.filterButtonActive]}
          onPress={() => handleFilterPress('cancelled')}
        >
          <Text style={[styles.filterButtonText, selectedFilter === 'cancelled' && styles.filterButtonTextActive]}>
            Cancelled ({historyData.filter(item => item.status === 'cancelled').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* History List */}
      <FlatList
        data={filteredHistory}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.historyList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading history...</Text>
            </View>
          ) : (
            renderEmptyState()
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: DIMENSIONS.margin,
    paddingVertical: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  historyList: {
    paddingHorizontal: DIMENSIONS.margin,
    paddingBottom: 20,
  },
  historyItem: {
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.cardBorderRadius,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recyclerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recyclerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  recyclerDetails: {
    flex: 1,
  },
  recyclerName: {
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  historyDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.darkGreen,
    fontWeight: '600',
  },
  amountText: {
    color: COLORS.primary,
  },
  totalAmountText: {
    color: COLORS.darkGreen,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  ratingLabel: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  star: {
    fontSize: 16,
  },
  starFilled: {
    color: '#FFD700',
  },
  starEmpty: {
    color: COLORS.lightGray,
  },
  tapIndicator: {
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  tapText: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    color: COLORS.gray,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.lightGray,
    textAlign: 'center',
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
  ecoPointsText: {
    color: COLORS.green,
    fontWeight: 'bold',
  },
}); 