import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, ImageBackground, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
import DrawerMenu from '../../components/DrawerMenu';
import { COLORS } from '../../constants';
import { useNotificationCountSimple as useNotificationCount } from '../../hooks/useNotificationCountSimple';
import { supabase } from '../../lib/supabase';

interface PickupHistory {
  id: string;
  pickup_address: string;
  waste_type: string;
  estimated_weight: number;
  final_price?: number;
  status: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  recyclers?: {
    full_name: string;
    phone: string;
    rating?: number;
  }[];
  payment_summaries?: {
    base_amount: number;
    eco_tax: number;
    total_amount: number;
    payment_method: string;
    paid_at?: string;
  }[];
}

export default function HistoryScreen() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pickupHistory, setPickupHistory] = useState<PickupHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Use real notification count
  const { notificationCount } = useNotificationCount();
  const router = useRouter();

  // ===== USER AUTHENTICATION =====
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

  // ===== LOAD PICKUP HISTORY =====
  const loadPickupHistory = useCallback(async () => {
    if (!currentUser?.id) return;

    try {
      setIsLoading(true);
      console.log('Loading pickup history for user:', currentUser.id);

      const { data, error } = await supabase
        .from('pickup_requests')
        .select(`
          id,
          pickup_address,
          waste_type,
          estimated_weight,
          final_price,
          status,
          created_at,
          updated_at,
          completed_at,
          recyclers (
            full_name,
            phone,
            rating
          ),
          payment_summaries (
            base_amount,
            eco_tax,
            total_amount,
            payment_method,
            paid_at
          )
        `)
        .eq('customer_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pickup history:', error);
        Alert.alert('Error', 'Failed to load pickup history');
        return;
      }

      console.log('Fetched pickup history:', data?.length || 0, 'pickups');
      setPickupHistory(data || []);

    } catch (error) {
      console.error('Error loading pickup history:', error);
      Alert.alert('Error', 'Failed to load pickup history');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentUser?.id]);

  // Load data when user is available
  useEffect(() => {
    if (currentUser?.id) {
      loadPickupHistory();
    }
  }, [currentUser?.id, loadPickupHistory]);

  const handleNotificationPress = () => {
    router.push('/customer-screens/CustomerNotificationScreen' as any);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadPickupHistory();
  };

  const handleSchedulePickup = () => {
    router.push('/(tabs)' as any);
  };

  const handleViewDetails = (pickup: PickupHistory) => {
    router.push({
      pathname: '/customer-screens/HistoryDetail' as any,
      params: { pickupId: pickup.id }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return COLORS.green;
      case 'in_progress': return COLORS.orange;
      case 'confirmed': return COLORS.blue;
      case 'pending': return COLORS.gray;
      case 'cancelled': return '#e74c3c';
      default: return COLORS.gray;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'check-circle';
      case 'in_progress': return 'local-shipping';
      case 'confirmed': return 'assignment-turned-in';
      case 'pending': return 'schedule';
      case 'cancelled': return 'cancel';
      default: return 'help';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderPickupItem = ({ item }: { item: PickupHistory }) => (
    <TouchableOpacity 
      style={styles.pickupCard}
      onPress={() => handleViewDetails(item)}
    >
      <View style={styles.pickupHeader}>
        <View style={styles.statusContainer}>
          <MaterialIcons 
            name={getStatusIcon(item.status)} 
            size={20} 
            color={getStatusColor(item.status)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('_', ' ')}
          </Text>
        </View>
        <Text style={styles.dateText}>
          {formatDate(item.created_at)}
        </Text>
      </View>

      <View style={styles.pickupDetails}>
        <View style={styles.addressContainer}>
          <MaterialIcons name="location-on" size={16} color={COLORS.gray} />
          <Text style={styles.addressText} numberOfLines={2}>
            {item.pickup_address}
          </Text>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <MaterialIcons name="category" size={16} color={COLORS.gray} />
            <Text style={styles.detailText}>{item.waste_type}</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="scale" size={16} color={COLORS.gray} />
            <Text style={styles.detailText}>{item.estimated_weight}kg</Text>
          </View>
        </View>

        {item.recyclers?.[0] && (
          <View style={styles.recyclerContainer}>
            <MaterialIcons name="person" size={16} color={COLORS.gray} />
            <Text style={styles.recyclerText}>
              Recycler: {item.recyclers[0].full_name}
            </Text>
          </View>
        )}

        {item.final_price && (
          <View style={styles.priceContainer}>
            <MaterialIcons name="attach-money" size={16} color={COLORS.green} />
            <Text style={styles.priceText}>₵{item.final_price.toFixed(2)}</Text>
          </View>
        )}
      </View>

      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>
          {formatTime(item.created_at)}
        </Text>
        <MaterialIcons name="chevron-right" size={20} color={COLORS.gray} />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="history" size={80} color={COLORS.lightGray} />
      <Text style={styles.emptyTitle}>No Pickup History</Text>
      <Text style={styles.emptySubtitle}>
        You haven&apos;t scheduled any pickups yet. Start your eco-friendly journey today!
      </Text>
      <TouchableOpacity style={styles.scheduleButton} onPress={handleSchedulePickup}>
        <MaterialIcons name="add" size={20} color={COLORS.white} />
        <Text style={styles.scheduleButtonText}>Schedule Your First Pickup</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.container}>
        <AppHeader 
          onMenuPress={() => setDrawerOpen(true)} 
          onNotificationPress={handleNotificationPress}
          notificationCount={notificationCount}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading pickup history...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader 
        onMenuPress={() => setDrawerOpen(true)} 
        onNotificationPress={handleNotificationPress}
        notificationCount={notificationCount}
      />
      <DrawerMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      
      <View style={styles.greenSectionWrapper}>
        <ImageBackground
          source={require('../../assets/images/blend.jpg')}
          style={styles.historySection}
          imageStyle={{ borderRadius: 20, opacity: 0.28 }}
          resizeMode="cover"
        >
          <View style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
            <View style={styles.historyLabelContainer}>
              <Text style={styles.historyLabel}>History</Text>
            </View>
          </View>
        </ImageBackground>
      </View>

      <View style={styles.contentContainer}>
        {pickupHistory.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={pickupHistory}
            renderItem={renderPickupItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[COLORS.primary]}
                tintColor={COLORS.primary}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  greenSectionWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  historySection: {
    width: '100%',
    height: 100,
    borderRadius: 20,
    backgroundColor: '#D0D4CC',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    alignSelf: 'center',
  },
  historyLabelContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 44,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    width: '70%',
  },
  historyLabel: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#263A13',
    fontFamily: 'Montserrat-Bold',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.lightGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  scheduleButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  scheduleButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  pickupCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  pickupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  pickupDetails: {
    marginBottom: 12,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 16,
    color: COLORS.darkGreen,
    fontWeight: '500',
    marginLeft: 6,
    flex: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 4,
  },
  recyclerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recyclerText: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 16,
    color: COLORS.green,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.gray,
  },
});
