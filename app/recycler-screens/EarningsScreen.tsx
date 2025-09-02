import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
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
// Mock user data (replacing useAuth)

// ===== MOCK DATA FOR EARNINGS =====
// This replaces the backend API calls with local mock data
// In a real app, this would come from a database or payment service
const mockEarningsStats = {
  totalEarnings: 12500,
  completedPickups: 45,
  averagePerPickup: 278,
  weeklyEarnings: 3200,
  monthlyEarnings: 12500,
  todayEarnings: 450,
  yesterdayEarnings: 380
};

const mockPaymentHistory = [
  {
    id: "pay_001",
    date: "2024-01-15",
    time: "14:30",
    pickupId: "req_002",
    amount: 250,
    status: "completed",
    customer: "Jane Smith",
    wasteType: "Mixed Waste",
    weight: "8 kg"
  },
  {
    id: "pay_002",
    date: "2024-01-14", 
    time: "16:45",
    pickupId: "req_004",
    amount: 180,
    status: "completed",
    customer: "David Wilson",
    wasteType: "Paper",
    weight: "6 kg"
  },
  {
    id: "pay_003",
    date: "2024-01-13",
    time: "11:20", 
    pickupId: "req_005",
    amount: 320,
    status: "completed",
    customer: "Sarah Johnson",
    wasteType: "Electronic Waste",
    weight: "12 kg"
  },
  {
    id: "pay_004",
    date: "2024-01-12",
    time: "09:15",
    pickupId: "req_006", 
    amount: 150,
    status: "completed",
    customer: "Michael Afia",
    wasteType: "Plastic",
    weight: "5 kg"
  },
  {
    id: "pay_005",
    date: "2024-01-11",
    time: "13:45",
    pickupId: "req_007",
    amount: 280,
    status: "completed", 
    customer: "John Doe",
    wasteType: "Mixed Waste",
    weight: "9 kg"
  }
];

export default function EarningsScreen() {
  const user = { id: "user_001", username: "User", email: "user@example.com", phone: "+233 24 123 4567", role: "customer", verification_status: "verified", created_at: "2024-01-15T10:30:00Z", profile_image: null, company_name: "Green Team Recycling" };
  
  // ===== LOCAL STATE MANAGEMENT =====
  // These state variables manage the UI state and data
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

  // ===== MOCK DATA LOADING FUNCTION =====
  // This replaces the backend API calls to fetch earnings data
  // It loads data from our mock data arrays
  const loadMockEarningsData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Load mock payment history
      setPaymentHistory([...mockPaymentHistory]);
      
      // Load mock earnings stats
      setEarningsStats({ ...mockEarningsStats });
      
      setLastUpdated(new Date());
      console.log('Mock earnings data loaded successfully');
      
    } catch (error) {
      console.error('Error loading mock earnings data:', error);
      // Fallback to default values
      setPaymentHistory([]);
      setEarningsStats({
        totalEarnings: 0,
        completedPickups: 0,
        averagePerPickup: 0,
        weeklyEarnings: 0,
        monthlyEarnings: 0,
        todayEarnings: 0,
        yesterdayEarnings: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ===== INITIALIZATION EFFECT =====
  // This effect runs when the component first loads
  useEffect(() => {
    loadMockEarningsData();
  }, [loadMockEarningsData]);

  // ===== REAL-TIME SIMULATION EFFECT =====
  // This simulates real-time updates by occasionally adding new payments
  // In a real app, this would be WebSocket or push notifications
  useEffect(() => {
    const interval = setInterval(() => {
      // 5% chance of getting a new payment every 30 seconds
      if (Math.random() < 0.05) {
        simulateNewPayment();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // ===== NEW PAYMENT SIMULATION =====
  // This simulates receiving a new payment notification
  const simulateNewPayment = () => {
    const newPayment = {
      id: `pay_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      pickupId: `req_${Math.floor(Math.random() * 1000)}`,
      amount: Math.floor(Math.random() * 300) + 100, // Random amount between 100-400
      status: "completed",
      customer: `Customer ${Math.floor(Math.random() * 1000)}`,
      wasteType: "Mixed Waste",
      weight: `${Math.floor(Math.random() * 20) + 1} kg`
    };

    // Add to payment history
    setPaymentHistory(prev => [newPayment, ...prev]);
    
    // Update earnings stats
    setEarningsStats(prev => ({
      ...prev,
      totalEarnings: prev.totalEarnings + newPayment.amount,
      todayEarnings: prev.todayEarnings + newPayment.amount,
      completedPickups: prev.completedPickups + 1,
      averagePerPickup: Math.round((prev.totalEarnings + newPayment.amount) / (prev.completedPickups + 1))
    }));

    // Show payment animation
    setLastPaymentAmount(newPayment.amount);
    setShowPaymentAnimation(true);
    
    // Hide animation after 3 seconds
    setTimeout(() => {
      setShowPaymentAnimation(false);
    }, 3000);

    // Animate the payment notification
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // ===== REFRESH HANDLER =====
  // This handles pull-to-refresh functionality
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadMockEarningsData(false);
    setIsRefreshing(false);
  }, [loadMockEarningsData]);

  // ===== PERIOD CHANGE HANDLER =====
  // This handles changing between different time periods
  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    // In a real app, you would fetch data for the selected period
    // For now, we'll just update the UI
  };

  // ===== PAYMENT DETAILS HANDLER =====
  // This handles viewing payment details
  const handlePaymentDetails = (payment: any) => {
    Alert.alert(
      'Payment Details',
      `Customer: ${payment.customer}\nWaste Type: ${payment.wasteType}\nWeight: ${payment.weight}\nAmount: ₵${payment.amount}\nDate: ${payment.date} ${payment.time}`,
      [{ text: 'OK' }]
    );
  };

  // ===== RENDER FUNCTIONS =====
  // These functions render different parts of the UI
  
  // Render earnings summary cards
  const renderEarningsSummary = () => (
    <View style={styles.summaryContainer}>
      {/* Total Earnings Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <FontAwesome5 name="money-bill-wave" size={24} color={COLORS.green} />
          <Text style={styles.summaryTitle}>Total Earnings</Text>
        </View>
        <Text style={styles.summaryAmount}>₵{earningsStats.totalEarnings.toLocaleString()}</Text>
        <Text style={styles.summarySubtext}>{earningsStats.completedPickups} pickups completed</Text>
      </View>

      {/* Today's Earnings Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <FontAwesome5 name="calendar-day" size={24} color={COLORS.orange} />
          <Text style={styles.summaryTitle}>Today</Text>
        </View>
        <Text style={styles.summaryAmount}>₵{earningsStats.todayEarnings}</Text>
        <Text style={styles.summarySubtext}>Today's earnings</Text>
      </View>

      {/* Weekly Earnings Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <FontAwesome5 name="calendar-week" size={24} color={COLORS.blue} />
          <Text style={styles.summaryTitle}>This Week</Text>
        </View>
        <Text style={styles.summaryAmount}>₵{earningsStats.weeklyEarnings}</Text>
        <Text style={styles.summarySubtext}>Weekly earnings</Text>
      </View>

      {/* Monthly Earnings Card */}
              <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <FontAwesome5 name="calendar-alt" size={24} color={COLORS.blue} />
            <Text style={styles.summaryTitle}>This Month</Text>
          </View>
          <Text style={styles.summaryAmount}>₵{earningsStats.monthlyEarnings.toLocaleString()}</Text>
          <Text style={styles.summarySubtext}>Monthly earnings</Text>
        </View>
    </View>
  );

  // Render period selector
  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {['day', 'week', 'month', 'year'].map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.periodButtonActive
          ]}
          onPress={() => handlePeriodChange(period)}
        >
          <Text style={[
            styles.periodButtonText,
            selectedPeriod === period && styles.periodButtonTextActive
          ]}>
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Render payment history item
  const renderPaymentItem = (payment: any) => (
    <TouchableOpacity
      key={payment.id}
      style={styles.paymentItem}
      onPress={() => handlePaymentDetails(payment)}
    >
      <View style={styles.paymentHeader}>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentCustomer}>{payment.customer}</Text>
          <Text style={styles.paymentDate}>{payment.date} • {payment.time}</Text>
        </View>
        <Text style={styles.paymentAmount}>₵{payment.amount}</Text>
      </View>
      
      <View style={styles.paymentDetails}>
        <Text style={styles.paymentWasteType}>{payment.wasteType}</Text>
        <Text style={styles.paymentWeight}>{payment.weight}</Text>
      </View>
      
      <View style={styles.paymentStatus}>
        <View style={[styles.statusDot, styles.statusCompleted]} />
        <Text style={styles.statusText}>{payment.status}</Text>
      </View>
    </TouchableOpacity>
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
                // emitPaymentReceived(demoPayment); // This line is removed as per the edit hint
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
                // emitPickupCompleted(demoPickup); // This line is removed as per the edit hint
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
                +₵{lastPaymentAmount.toFixed(2)} Added!
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
              ₵{earningsStats.todayEarnings.toFixed(2)}
            </Text>
          </View>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatLabel}>Completed Pickups</Text>
            <Text style={styles.quickStatValue}>{earningsStats.completedPickups}</Text>
          </View>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatLabel}>Avg per Pickup</Text>
            <Text style={styles.quickStatValue}>₵{earningsStats.averagePerPickup.toFixed(2)}</Text>
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
              ₵{earningsStats.totalEarnings.toFixed(2)}
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
                ₵{earningsStats.todayEarnings.toFixed(2)}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>This Week:</Text>
              <Text style={styles.breakdownValue}>
                ₵{earningsStats.weeklyEarnings.toFixed(2)}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>This Month:</Text>
              <Text style={styles.breakdownValue}>
                ₵{earningsStats.monthlyEarnings.toFixed(2)}
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
            <Text style={styles.totalAmount}>₵{earningsStats.totalEarnings.toFixed(2)}</Text>
            <Text style={styles.totalLabel}>Total Earnings</Text>
            <View style={styles.earningsBreakdown}>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Today</Text>
                <Text style={styles.breakdownValue}>₵{earningsStats.todayEarnings.toFixed(2)}</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Yesterday</Text>
                <Text style={styles.breakdownValue}>₵{earningsStats.yesterdayEarnings.toFixed(2)}</Text>
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
            {/* renderEarningsCard is removed as per the edit hint */}
            {/* The following lines are replaced with renderEarningsSummary */}
            {/*
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
            */}
            {renderEarningsSummary()}
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

// ... existing code ...

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
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 10,
    color: COLORS.gray,
  },
  paymentAmount: {
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
  // New styles for summary cards
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
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
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryTitle: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 8,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 5,
  },
  summarySubtext: {
    fontSize: 10,
    color: COLORS.gray,
  },
  paymentWasteType: {
    fontSize: 11,
    color: COLORS.gray,
    marginBottom: 2,
  },
  paymentWeight: {
    fontSize: 11,
    color: COLORS.gray,
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  statusCompleted: {
    backgroundColor: COLORS.green,
  },
  periodButtonText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});
