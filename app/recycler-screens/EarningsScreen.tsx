import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';
import eventEmitter from '../utils/eventEmitter';
import { emitPaymentReceived, emitPickupCompleted } from '../utils/paymentEvents';
import recyclerStats from '../utils/recyclerStats';

export default function EarningsScreen() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Real-time state
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [earningsStats, setEarningsStats] = useState({
    totalEarnings: 0,
    completedPickups: 0,
    averagePerPickup: 0,
    weeklyEarnings: 0,
    monthlyEarnings: 0,
    todayEarnings: 0,
    yesterdayEarnings: 0,
  });

  // Animation states for real-time updates
  const [showPaymentAnimation, setShowPaymentAnimation] = useState(false);
  const [lastPaymentAmount, setLastPaymentAmount] = useState(0);
  
  // Animated values for smooth animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const borderColorAnim = useRef(new Animated.Value(0)).current;

  // Real-time data fetching
  const fetchEarningsData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      
      // Fetch data from the new API endpoints
      const [paymentsResponse, statsResponse] = await Promise.all([
        apiService.getPayments(),
        apiService.getUserStats()
      ]);
      
      if (paymentsResponse.success && paymentsResponse.data) {
        // Transform API data to match our local format
        const transformedPayments = paymentsResponse.data.map((payment: any) => ({
          id: payment.id,
          date: new Date(payment.created_at).toISOString().split('T')[0],
          time: new Date(payment.created_at).toTimeString().split(' ')[0].substring(0, 5),
          pickupId: payment.pickupId || payment.collection_id || `pickup_${payment.id}`,
          amount: payment.amount,
          status: payment.status,
          customer: payment.customer || 'Customer',
          wasteType: payment.wasteType || 'Mixed Waste',
          weight: `${payment.weight || 0} kg`
        }));
        
        setPaymentHistory(transformedPayments);
      }
      
      if (statsResponse.success && statsResponse.data) {
        // Transform API stats to match our local format
        const apiStats = statsResponse.data;
        setEarningsStats({
          totalEarnings: apiStats.totalEarnings || 0,
          todayEarnings: apiStats.todayEarnings || 0,
          completedPickups: apiStats.totalPickups || 0,
          averagePerPickup: apiStats.averagePerPickup || 0,
          weeklyEarnings: apiStats.weeklyEarnings || 0,
          monthlyEarnings: apiStats.monthlyEarnings || 0,
        });
      }
      
      setLastUpdated(new Date());
      console.log('Earnings data fetched successfully from API');
      
    } catch (error) {
      console.error('Error fetching earnings data:', error);
      // Fallback to local stats if anything fails
      setPaymentHistory(recyclerStats.getPaymentHistory());
      setEarningsStats(recyclerStats.getEarningsStats());
      
      if (showLoading) {
        Alert.alert(
          'Data Loading',
          'Failed to fetch from API. Using local data.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      if (showLoading) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchEarningsData();
  }, [fetchEarningsData]);

  // Reset animations when component unmounts
  useEffect(() => {
    return () => {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      borderColorAnim.setValue(0);
    };
  }, [scaleAnim, opacityAnim, borderColorAnim]);

  // Set up real-time updates every 60 seconds (less frequent since we're using local data)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchEarningsData(false); // Don't show loading indicator for background updates
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [fetchEarningsData]);

  // Real-time payment event listener for immediate updates
  useEffect(() => {
    const paymentReceivedListener = eventEmitter.on('paymentReceived', (paymentData: any) => {
      console.log('Payment received event:', paymentData);
      
      // Immediately update earnings when payment is marked as received
      if (paymentData && paymentData.amount) {
        const newPayment = {
          id: `payment_${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().split(' ')[0].substring(0, 5),
          pickupId: paymentData.pickupId || paymentData.collection_id || 'pickup_' + Date.now(),
          amount: paymentData.amount,
          status: 'completed',
          customer: paymentData.customer_name || paymentData.customer || 'Customer',
          wasteType: paymentData.waste_type || paymentData.wasteType || 'Mixed Waste',
          weight: `${paymentData.weight || 0} kg`
        };

        // Add new payment to history
        setPaymentHistory(prev => [newPayment, ...prev]);
        
        // Update earnings stats immediately
        setEarningsStats(prev => ({
          ...prev,
          totalEarnings: prev.totalEarnings + paymentData.amount,
          todayEarnings: prev.todayEarnings + paymentData.amount,
          completedPickups: prev.completedPickups + 1,
          averagePerPickup: ((prev.totalEarnings + paymentData.amount) / (prev.completedPickups + 1)),
          weeklyEarnings: prev.weeklyEarnings + paymentData.amount,
          monthlyEarnings: prev.monthlyEarnings + paymentData.amount,
        }));

        // Update last updated timestamp
        setLastUpdated(new Date());
        
        // Trigger payment animation
        setLastPaymentAmount(paymentData.amount);
        setShowPaymentAnimation(true);
        
        // Animate in
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(borderColorAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }),
        ]).start();
        
        // Hide animation after 3 seconds
        setTimeout(() => {
                  // Animate out
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(borderColorAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
          }),
        ]).start(() => {
          setShowPaymentAnimation(false);
        });
        }, 3000);
        
        // Show success notification
        Alert.alert(
          'Payment Received! 💰',
          `GHS ${paymentData.amount.toFixed(2)} added to your earnings from ${newPayment.customer}`,
          [{ text: 'Great!' }]
        );
      }
    });

    const pickupCompletedListener = eventEmitter.on('pickupCompleted', (pickupData: any) => {
      console.log('Pickup completed event:', pickupData);
      
      // Update completed pickups count when pickup is marked as complete
      if (pickupData) {
        setEarningsStats(prev => ({
          ...prev,
          completedPickups: prev.completedPickups + 1,
        }));
      }
    });

    // Cleanup listeners
    return () => {
      paymentReceivedListener(); // This calls the unsubscribe function
      pickupCompletedListener(); // This calls the unsubscribe function
    };
  }, []);

  // Real-time payment notifications for existing payments
  useEffect(() => {
    if (paymentHistory.length > 0) {
      const lastPayment = paymentHistory[0];
      const paymentTime = new Date(lastPayment.date + 'T' + lastPayment.time);
      const timeDiff = Date.now() - paymentTime.getTime();
      
      // Show notification for payments received in the last 5 minutes
      if (timeDiff < 5 * 60 * 1000 && timeDiff > 0) {
        // You can add a toast notification here
        console.log(`New payment received: GHS ${lastPayment.amount.toFixed(2)} from ${lastPayment.customer}`);
      }
    }
  }, [paymentHistory]);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchEarningsData(false);
  }, [fetchEarningsData]);

  const renderEarningsCard = (title: string, amount: number, subtitle: string, icon: React.ReactNode, color: string) => (
    <View style={[styles.earningsCard, { borderLeftColor: color }]}>
      <View style={styles.earningsHeader}>
        {icon}
        <Text style={styles.earningsTitle}>{title}</Text>
      </View>
      <Text style={[styles.earningsAmount, { color }]}>GHS {amount.toFixed(2)}</Text>
      <Text style={styles.earningsSubtitle}>{subtitle}</Text>
    </View>
  );

  const renderPaymentItem = (payment: any) => (
    <View key={payment.id} style={styles.paymentItem}>
      <View style={styles.paymentHeader}>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentId}>{payment.pickupId}</Text>
          <Text style={styles.paymentCustomer}>{payment.customer}</Text>
          <Text style={styles.paymentDate}>{payment.date} • {payment.time}</Text>
        </View>
        <View style={styles.paymentAmount}>
          <Text style={styles.amountText}>GHS {payment.amount.toFixed(2)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: COLORS.green }]}>
            <Text style={styles.statusText}>{payment.status}</Text>
          </View>
        </View>
      </View>
      <View style={styles.paymentDetails}>
        <View style={styles.detailItem}>
          <MaterialIcons name="category" size={16} color={COLORS.gray} />
          <Text style={styles.detailText}>{payment.wasteType}</Text>
        </View>
        <View style={styles.detailItem}>
          <MaterialIcons name="scale" size={16} color={COLORS.gray} />
          <Text style={styles.detailText}>{payment.weight}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings</Text>
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
        {/* Real-time Status Indicator */}
        <View style={styles.realTimeIndicator}>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Live Updates</Text>
            <Text style={styles.lastUpdatedText}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Text>
          </View>
        </View>

        {/* Demo Section - Remove in production */}
        <View style={styles.demoContainer}>
          <Text style={styles.demoTitle}>🧪 Demo Real-time Updates</Text>
          <View style={styles.demoButtons}>
            <TouchableOpacity 
              style={styles.demoButton}
              onPress={() => {
                const demoPayment = {
                  amount: Math.floor(Math.random() * 50) + 10, // Random amount between 10-60
                  pickupId: `demo_${Date.now()}`,
                  customer_name: 'Demo Customer',
                  waste_type: 'Mixed Waste',
                  weight: Math.floor(Math.random() * 10) + 5
                };
                emitPaymentReceived(demoPayment);
              }}
            >
              <Text style={styles.demoButtonText}>Simulate Payment</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.demoButton}
              onPress={() => {
                const demoPickup = {
                  pickupId: `demo_pickup_${Date.now()}`,
                  status: 'completed',
                  completedAt: new Date()
                };
                emitPickupCompleted(demoPickup);
              }}
            >
              <Text style={styles.demoButtonText}>Simulate Pickup</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Animation */}
        {showPaymentAnimation && (
          <Animated.View style={[
            styles.paymentAnimationContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            }
          ]}>
            <View style={styles.paymentAnimationContent}>
              <Text style={styles.paymentAnimationIcon}>💰</Text>
              <Text style={styles.paymentAnimationText}>
                +GHS {lastPaymentAmount.toFixed(2)} Added!
              </Text>
              <Text style={styles.paymentAnimationSubtext}>
                Payment received in real-time
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Real-time Payment Status */}
        <View style={styles.paymentStatusContainer}>
          <View style={styles.paymentStatusHeader}>
            <MaterialIcons name="payment" size={20} color={COLORS.primary} />
            <Text style={styles.paymentStatusTitle}>Payment Status</Text>
          </View>
          <View style={styles.paymentStatusContent}>
            <View style={styles.paymentStatusItem}>
              <View style={[styles.statusIndicator, { backgroundColor: COLORS.green }]} />
              <Text style={styles.paymentStatusText}>Live Updates Active</Text>
            </View>
            <View style={styles.paymentStatusItem}>
              <View style={[styles.statusIndicator, { backgroundColor: paymentHistory.length > 0 ? COLORS.green : COLORS.gray }]} />
              <Text style={styles.paymentStatusText}>
                {paymentHistory.length > 0 ? `${paymentHistory.length} Payments` : 'No Payments Yet'}
              </Text>
            </View>
            <View style={styles.paymentStatusItem}>
              <View style={[styles.statusIndicator, { backgroundColor: showPaymentAnimation ? COLORS.green : COLORS.gray }]} />
              <Text style={styles.paymentStatusText}>
                {showPaymentAnimation ? 'Payment Processing...' : 'Ready for Payments'}
              </Text>
            </View>
          </View>
        </View>

        {/* Real-time Quick Stats */}
        <View style={styles.quickStatsContainer}>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatLabel}>Today's Earnings</Text>
            <Text style={[styles.quickStatValue, { color: showPaymentAnimation ? COLORS.green : COLORS.primary }]}>
              GHS {earningsStats.todayEarnings.toFixed(2)}
            </Text>
          </View>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatLabel}>Completed Pickups</Text>
            <Text style={styles.quickStatValue}>{earningsStats.completedPickups}</Text>
          </View>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatLabel}>Avg per Pickup</Text>
            <Text style={styles.quickStatValue}>GHS {earningsStats.averagePerPickup.toFixed(2)}</Text>
          </View>
        </View>

        {/* Live Earnings Counter */}
        <Animated.View style={[
          styles.liveEarningsContainer,
          {
            borderColor: borderColorAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [COLORS.lightGray, COLORS.green],
            }),
          }
        ]}>
          <View style={styles.liveEarningsHeader}>
            <MaterialIcons name="trending-up" size={20} color={COLORS.green} />
            <Text style={styles.liveEarningsTitle}>Live Earnings Counter</Text>
          </View>
          <View style={styles.liveEarningsValue}>
            <Text style={styles.liveEarningsAmount}>
              GHS {earningsStats.totalEarnings.toFixed(2)}
            </Text>
            <Text style={styles.liveEarningsStatus}>
              {showPaymentAnimation ? '💰 Payment Received!' : '🟢 Live & Updating'}
            </Text>
          </View>
        </Animated.View>

        {/* Real-time Earnings Breakdown */}
        <View style={styles.earningsBreakdownContainer}>
          <View style={styles.earningsBreakdownHeader}>
            <MaterialIcons name="pie-chart" size={20} color={COLORS.secondary} />
            <Text style={styles.earningsBreakdownTitle}>Earnings Breakdown</Text>
          </View>
          <View style={styles.earningsBreakdownContent}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Today's Earnings:</Text>
              <Text style={[styles.breakdownValue, { color: COLORS.green }]}>
                GHS {earningsStats.todayEarnings.toFixed(2)}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>This Week:</Text>
              <Text style={styles.breakdownValue}>
                GHS {earningsStats.weeklyEarnings.toFixed(2)}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>This Month:</Text>
              <Text style={styles.breakdownValue}>
                GHS {earningsStats.monthlyEarnings.toFixed(2)}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Total Pickups:</Text>
              <Text style={styles.breakdownValue}>
                {earningsStats.completedPickups}
              </Text>
            </View>
          </View>
        </View>

        {/* Real-time Earnings Trend */}
        <View style={styles.trendContainer}>
          <View style={styles.trendHeader}>
            <MaterialIcons name="trending-up" size={20} color={COLORS.green} />
            <Text style={styles.trendTitle}>Earnings Trend</Text>
          </View>
          <View style={styles.trendContent}>
            <Text style={styles.trendText}>
              {earningsStats.todayEarnings > earningsStats.yesterdayEarnings ? '📈' : '📉'} 
              {earningsStats.todayEarnings > earningsStats.yesterdayEarnings 
                ? ` +${((earningsStats.todayEarnings - earningsStats.yesterdayEarnings) / earningsStats.yesterdayEarnings * 100).toFixed(1)}%`
                : ` -${((earningsStats.yesterdayEarnings - earningsStats.todayEarnings) / earningsStats.yesterdayEarnings * 100).toFixed(1)}%`
              } from yesterday
            </Text>
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
        </View>

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading earnings data...</Text>
          </View>
        )}

        {/* Total Earnings Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome5 name="dollar-sign" size={24} color={COLORS.darkGreen} />
            <Text style={styles.sectionTitle}>Total Earnings</Text>
          </View>
          
          <View style={styles.totalEarningsCard}>
            <Text style={styles.totalAmount}>GHS {earningsStats.totalEarnings.toFixed(2)}</Text>
            <Text style={styles.totalLabel}>Total Earnings</Text>
            <View style={styles.earningsBreakdown}>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Today</Text>
                <Text style={styles.breakdownValue}>GHS {earningsStats.todayEarnings.toFixed(2)}</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Yesterday</Text>
                <Text style={styles.breakdownValue}>GHS {earningsStats.yesterdayEarnings.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Earnings Statistics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="analytics" size={24} color={COLORS.darkBlue} />
            <Text style={styles.sectionTitle}>Earnings Statistics</Text>
          </View>
          
          <View style={styles.statsGrid}>
            {renderEarningsCard(
              'Completed Pickups',
              earningsStats.completedPickups,
              'Total pickups this period',
              <MaterialIcons name="local-shipping" size={20} color={COLORS.darkBlue} />,
              COLORS.darkBlue
            )}
            {renderEarningsCard(
              'Average Per Pickup',
              earningsStats.averagePerPickup,
              'Average earnings per pickup',
              <MaterialIcons name="trending-up" size={20} color={COLORS.green} />,
              COLORS.green
            )}
            {renderEarningsCard(
              'Weekly Estimate',
              earningsStats.weeklyEarnings,
              'Projected weekly earnings',
              <MaterialIcons name="calendar-today" size={20} color={COLORS.secondary} />,
              COLORS.secondary
            )}
            {renderEarningsCard(
              'Monthly Estimate',
              earningsStats.monthlyEarnings,
              'Projected monthly earnings',
              <MaterialIcons name="calendar-month" size={20} color={COLORS.primary} />,
              COLORS.primary
            )}
          </View>
        </View>

        {/* Payment History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="history" size={24} color={COLORS.black} />
            <Text style={styles.sectionTitle}>Payment History</Text>
          </View>
          
          <View style={styles.paymentHistoryContainer}>
            {paymentHistory.map(renderPaymentItem)}
          </View>
        </View>

        {/* Earnings Tips */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="lightbulb" size={24} color={COLORS.secondary} />
            <Text style={styles.sectionTitle}>Earnings Tips</Text>
          </View>
          
          <View style={styles.tipsContainer}>
            <View style={styles.tipCard}>
              <MaterialIcons name="schedule" size={20} color={COLORS.primary} />
              <Text style={styles.tipTitle}>Peak Hours</Text>
              <Text style={styles.tipText}>Focus on 9AM-5PM for higher demand</Text>
            </View>
            <View style={styles.tipCard}>
              <MaterialIcons name="location-on" size={20} color={COLORS.primary} />
              <Text style={styles.tipTitle}>High-Value Areas</Text>
              <Text style={styles.tipText}>Business districts offer better rates</Text>
            </View>
            <View style={styles.tipCard}>
              <MaterialIcons name="star" size={20} color={COLORS.primary} />
              <Text style={styles.tipTitle}>Customer Rating</Text>
              <Text style={styles.tipText}>Maintain 5-star rating for bonuses</Text>
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
    color: COLORS.gray,
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
    color: COLORS.black,
    marginLeft: 10,
  },
  totalEarningsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 20,
  },
  earningsBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 5,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  earningsCard: {
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
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  earningsTitle: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 8,
  },
  earningsAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  earningsSubtitle: {
    fontSize: 10,
    color: COLORS.gray,
  },
  paymentHistoryContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 2,
  },
  paymentCustomer: {
    fontSize: 12,
    color: COLORS.black,
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 10,
    color: COLORS.gray,
  },
  paymentAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.green,
    marginBottom: 5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '600',
  },
  paymentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 11,
    color: COLORS.gray,
    marginLeft: 5,
  },
  tipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tipCard: {
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
  tipTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.black,
    marginTop: 8,
    marginBottom: 5,
    textAlign: 'center',
  },
  tipText: {
    fontSize: 10,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 14,
  },
  // Real-time indicator styles
  realTimeIndicator: {
    backgroundColor: COLORS.lightGreen,
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.darkGreen,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.green,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    flex: 1,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  // Loading styles
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 12,
  },
  // Quick stats styles
  quickStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  quickStatItem: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickStatLabel: {
    fontSize: 10,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 4,
  },
  quickStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
  },
  // Trend styles
  trendContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 8,
  },
  trendContent: {
    alignItems: 'center',
  },
  trendText: {
    fontSize: 14,
    color: COLORS.darkGreen,
    textAlign: 'center',
    fontWeight: '500',
  },
  // Payment animation styles
  paymentAnimationContainer: {
    backgroundColor: COLORS.green,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  paymentAnimationContent: {
    padding: 16,
    alignItems: 'center',
  },
  paymentAnimationIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  paymentAnimationText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  paymentAnimationSubtext: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.8,
  },
  // Live earnings counter styles
  liveEarningsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
  },
  liveEarningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveEarningsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 8,
  },
  liveEarningsValue: {
    alignItems: 'center',
  },
  liveEarningsAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 8,
  },
  liveEarningsStatus: {
    fontSize: 14,
    color: COLORS.green,
    fontWeight: '500',
  },
  // Payment status styles
  paymentStatusContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentStatusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 8,
  },
  paymentStatusContent: {
    gap: 8,
  },
  paymentStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  paymentStatusText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  // Earnings breakdown styles
  earningsBreakdownContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  earningsBreakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  earningsBreakdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 8,
  },
  earningsBreakdownContent: {
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  breakdownLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  // Demo section styles
  demoContainer: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    borderStyle: 'dashed',
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  demoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  demoButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  demoButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 