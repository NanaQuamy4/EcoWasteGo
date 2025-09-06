import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
import { COLORS } from '../../constants';
import { supabase } from '../../lib/supabase';

interface RecyclerSubscriptionData {
  recycler_id: string;
  recycler_name: string;
  recycler_email: string;
  current_week_fees: number;
  current_week_earnings: number;
  current_week_pickups: number;
  total_pending_fees: number;
  overdue_fees: number;
  is_payment_required: boolean;
  last_payment_date: string | null;
  total_earnings_all_time: number;
  total_fees_paid: number;
}

interface SubscriptionSummary {
  total_recyclers: number;
  total_pending_fees: number;
  total_overdue_fees: number;
  total_earnings_this_week: number;
  average_fee_per_recycler: number;
}

export default function AdminSubscriptionScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recyclerData, setRecyclerData] = useState<RecyclerSubscriptionData[]>([]);
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'paid'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'fees' | 'earnings' | 'pickups'>('fees');

  // ===== DATA LOADING =====
  const loadSubscriptionData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get all recyclers with their subscription data
      const { data: recyclersData, error: recyclersError } = await supabase
        .from('recyclers')
        .select(`
          id,
          full_name,
          email,
          created_at
        `)
        .order('full_name');

      if (recyclersError) {
        console.error('Error fetching recyclers:', recyclersError);
        throw recyclersError;
      }

      if (!recyclersData || recyclersData.length === 0) {
        setRecyclerData([]);
        setSummary({
          total_recyclers: 0,
          total_pending_fees: 0,
          total_overdue_fees: 0,
          total_earnings_this_week: 0,
          average_fee_per_recycler: 0
        });
        return;
      }

      // Get subscription data for each recycler
      const recyclerSubscriptionData: RecyclerSubscriptionData[] = [];
      let totalPendingFees = 0;
      let totalOverdueFees = 0;
      let totalEarningsThisWeek = 0;

      for (const recycler of recyclersData) {
        try {
          // Get current week subscription summary
          const { data: subscriptionData, error: subscriptionError } = await supabase
            .rpc('get_recycler_subscription_summary', { p_recycler_id: recycler.id });

          if (subscriptionError) {
            console.error(`Error fetching subscription data for ${recycler.full_name}:`, subscriptionError);
            continue;
          }

          const subscription = subscriptionData?.[0];

          // Get total earnings all time
          const { data: totalEarningsData, error: totalEarningsError } = await supabase
            .from('recycler_earnings')
            .select('total_amount')
            .eq('recycler_id', recycler.id)
            .eq('status', 'completed');

          const totalEarningsAllTime = totalEarningsData?.reduce((sum, record) => sum + (record.total_amount || 0), 0) || 0;

          // Get total fees paid
          const { data: paidFeesData, error: paidFeesError } = await supabase
            .from('subscription_fees')
            .select('platform_fee_amount')
            .eq('recycler_id', recycler.id)
            .eq('status', 'paid');

          const totalFeesPaid = paidFeesData?.reduce((sum, record) => sum + (record.platform_fee_amount || 0), 0) || 0;

          // Get last payment date
          const { data: lastPaymentData, error: lastPaymentError } = await supabase
            .from('subscription_fees')
            .select('paid_at')
            .eq('recycler_id', recycler.id)
            .eq('status', 'paid')
            .order('paid_at', { ascending: false })
            .limit(1);

          const recyclerData: RecyclerSubscriptionData = {
            recycler_id: recycler.id,
            recycler_name: recycler.full_name,
            recycler_email: recycler.email,
            current_week_fees: subscription?.current_week_fees || 0,
            current_week_earnings: subscription?.current_week_earnings || 0,
            current_week_pickups: subscription?.current_week_pickups || 0,
            total_pending_fees: subscription?.total_pending_fees || 0,
            overdue_fees: subscription?.overdue_fees || 0,
            is_payment_required: subscription?.is_payment_required || false,
            last_payment_date: lastPaymentData?.[0]?.paid_at || null,
            total_earnings_all_time: totalEarningsAllTime,
            total_fees_paid: totalFeesPaid
          };

          recyclerSubscriptionData.push(recyclerData);

          // Update totals
          totalPendingFees += recyclerData.total_pending_fees;
          totalOverdueFees += recyclerData.overdue_fees;
          totalEarningsThisWeek += recyclerData.current_week_earnings;

        } catch (error) {
          console.error(`Error processing data for ${recycler.full_name}:`, error);
        }
      }

      setRecyclerData(recyclerSubscriptionData);
      setSummary({
        total_recyclers: recyclerSubscriptionData.length,
        total_pending_fees: totalPendingFees,
        total_overdue_fees: totalOverdueFees,
        total_earnings_this_week: totalEarningsThisWeek,
        average_fee_per_recycler: recyclerSubscriptionData.length > 0 ? totalPendingFees / recyclerSubscriptionData.length : 0
      });

      console.log('Admin subscription data loaded successfully');

    } catch (error) {
      console.error('Error loading admin subscription data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ===== INITIALIZATION =====
  useEffect(() => {
    loadSubscriptionData();
  }, [loadSubscriptionData]);

  // ===== REFRESH =====
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSubscriptionData();
    setRefreshing(false);
  }, [loadSubscriptionData]);

  // ===== FILTERING AND SORTING =====
  const filteredAndSortedData = recyclerData
    .filter(recycler => {
      switch (filter) {
        case 'pending':
          return recycler.is_payment_required && recycler.overdue_fees === 0;
        case 'overdue':
          return recycler.overdue_fees > 0;
        case 'paid':
          return !recycler.is_payment_required;
        default:
          return true;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.recycler_name.localeCompare(b.recycler_name);
        case 'fees':
          return b.total_pending_fees - a.total_pending_fees;
        case 'earnings':
          return b.current_week_earnings - a.current_week_earnings;
        case 'pickups':
          return b.current_week_pickups - a.current_week_pickups;
        default:
          return 0;
      }
    });

  // ===== RENDER FUNCTIONS =====
  const renderSummaryCards = () => (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryCard}>
        <MaterialIcons name="people" size={24} color={COLORS.primary} />
        <Text style={styles.summaryValue}>{summary?.total_recyclers || 0}</Text>
        <Text style={styles.summaryLabel}>Total Recyclers</Text>
      </View>
      
      <View style={styles.summaryCard}>
        <MaterialIcons name="account-balance-wallet" size={24} color="#E65100" />
        <Text style={styles.summaryValue}>₵{(summary?.total_pending_fees || 0).toFixed(2)}</Text>
        <Text style={styles.summaryLabel}>Pending Fees</Text>
      </View>
      
      <View style={styles.summaryCard}>
        <MaterialIcons name="warning" size={24} color={COLORS.red} />
        <Text style={styles.summaryValue}>₵{(summary?.total_overdue_fees || 0).toFixed(2)}</Text>
        <Text style={styles.summaryLabel}>Overdue Fees</Text>
      </View>
      
      <View style={styles.summaryCard}>
        <MaterialIcons name="trending-up" size={24} color={COLORS.green} />
        <Text style={styles.summaryValue}>₵{(summary?.total_earnings_this_week || 0).toFixed(2)}</Text>
        <Text style={styles.summaryLabel}>This Week Earnings</Text>
      </View>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {[
          { key: 'all', label: 'All', icon: 'list' },
          { key: 'pending', label: 'Pending', icon: 'schedule' },
          { key: 'overdue', label: 'Overdue', icon: 'warning' },
          { key: 'paid', label: 'Paid', icon: 'check-circle' }
        ].map((filterOption) => (
          <TouchableOpacity
            key={filterOption.key}
            style={[
              styles.filterButton,
              filter === filterOption.key && styles.filterButtonActive
            ]}
            onPress={() => setFilter(filterOption.key as any)}
          >
            <MaterialIcons 
              name={filterOption.icon as any} 
              size={16} 
              color={filter === filterOption.key ? '#fff' : COLORS.gray} 
            />
            <Text style={[
              styles.filterButtonText,
              filter === filterOption.key && styles.filterButtonTextActive
            ]}>
              {filterOption.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderSortOptions = () => (
    <View style={styles.sortContainer}>
      <Text style={styles.sortLabel}>Sort by:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortScroll}>
        {[
          { key: 'fees', label: 'Fees' },
          { key: 'earnings', label: 'Earnings' },
          { key: 'pickups', label: 'Pickups' },
          { key: 'name', label: 'Name' }
        ].map((sortOption) => (
          <TouchableOpacity
            key={sortOption.key}
            style={[
              styles.sortButton,
              sortBy === sortOption.key && styles.sortButtonActive
            ]}
            onPress={() => setSortBy(sortOption.key as any)}
          >
            <Text style={[
              styles.sortButtonText,
              sortBy === sortOption.key && styles.sortButtonTextActive
            ]}>
              {sortOption.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderRecyclerCard = (recycler: RecyclerSubscriptionData) => (
    <View key={recycler.recycler_id} style={styles.recyclerCard}>
      <View style={styles.recyclerHeader}>
        <View style={styles.recyclerInfo}>
          <Text style={styles.recyclerName}>{recycler.recycler_name}</Text>
          <Text style={styles.recyclerEmail}>{recycler.recycler_email}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          recycler.overdue_fees > 0 ? styles.statusOverdue :
          recycler.is_payment_required ? styles.statusPending : styles.statusPaid
        ]}>
          <Text style={[
            styles.statusText,
            recycler.overdue_fees > 0 ? styles.statusTextOverdue :
            recycler.is_payment_required ? styles.statusTextPending : styles.statusTextPaid
          ]}>
            {recycler.overdue_fees > 0 ? 'Overdue' :
             recycler.is_payment_required ? 'Pending' : 'Paid'}
          </Text>
        </View>
      </View>

      <View style={styles.recyclerStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>₵{recycler.total_pending_fees.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Pending Fees</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>₵{recycler.current_week_earnings.toFixed(2)}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{recycler.current_week_pickups}</Text>
          <Text style={styles.statLabel}>Pickups</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>₵{recycler.total_fees_paid.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total Paid</Text>
        </View>
      </View>

      {recycler.overdue_fees > 0 && (
        <View style={styles.overdueWarning}>
          <MaterialIcons name="warning" size={16} color={COLORS.red} />
          <Text style={styles.overdueText}>
            ₵{recycler.overdue_fees.toFixed(2)} overdue
          </Text>
        </View>
      )}

      {recycler.last_payment_date && (
        <Text style={styles.lastPaymentText}>
          Last payment: {new Date(recycler.last_payment_date).toLocaleDateString()}
        </Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading subscription data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader onMenuPress={() => router.back()} />
      
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIconContainer}>
            <MaterialIcons name="account-balance" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Subscription Management</Text>
          <Text style={styles.subtitle}>Track recycler subscription fees and payments</Text>
        </View>

        {/* Summary Cards */}
        {summary && renderSummaryCards()}

        {/* Filters */}
        {renderFilters()}

        {/* Sort Options */}
        {renderSortOptions()}

        {/* Recyclers List */}
        <View style={styles.recyclersContainer}>
          <Text style={styles.sectionTitle}>
            Recyclers ({filteredAndSortedData.length})
          </Text>
          
          {filteredAndSortedData.length > 0 ? (
            filteredAndSortedData.map(renderRecyclerCard)
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="people-outline" size={64} color={COLORS.lightGray} />
              <Text style={styles.emptyText}>No recyclers found</Text>
              <Text style={styles.emptySubtext}>
                {filter === 'all' ? 'No recyclers registered yet' : 
                 `No recyclers with ${filter} status`}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FFF0',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FFF0',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 20,
  },
  headerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginTop: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
    textAlign: 'center',
  },
  filtersContainer: {
    marginBottom: 20,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sortLabel: {
    fontSize: 16,
    color: COLORS.darkGreen,
    fontWeight: '600',
    marginRight: 12,
  },
  sortScroll: {
    flexDirection: 'row',
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  sortButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sortButtonText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: '#FFFFFF',
  },
  recyclersContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 16,
  },
  recyclerCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recyclerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recyclerInfo: {
    flex: 1,
  },
  recyclerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 4,
  },
  recyclerEmail: {
    fontSize: 14,
    color: COLORS.gray,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusPending: {
    backgroundColor: '#FFF3E0',
  },
  statusOverdue: {
    backgroundColor: '#FFEBEE',
  },
  statusPaid: {
    backgroundColor: '#E8F5E8',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusTextPending: {
    color: '#E65100',
  },
  statusTextOverdue: {
    color: COLORS.red,
  },
  statusTextPaid: {
    color: '#2E7D32',
  },
  recyclerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
  },
  overdueWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  overdueText: {
    marginLeft: 6,
    fontSize: 14,
    color: COLORS.red,
    fontWeight: '500',
  },
  lastPaymentText: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.lightGray,
    marginTop: 8,
    textAlign: 'center',
  },
});

