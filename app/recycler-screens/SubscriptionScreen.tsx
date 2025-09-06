import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import AppHeader from '../../components/AppHeader';
import { COLORS } from '../../constants';
import { PaymentMethod, paystackService } from '../../lib/paystackService';
import { supabase } from '../../lib/supabase';

interface SubscriptionSummary {
  current_week_fees: number;
  current_week_earnings: number;
  current_week_pickups: number;
  is_payment_required: boolean;
  overdue_fees: number;
  total_pending_fees: number;
}

export default function SubscriptionScreen() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscriptionSummary, setSubscriptionSummary] = useState<SubscriptionSummary | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [showWebView, setShowWebView] = useState(false);

  // ===== DATA LOADING =====
  const loadSubscriptionData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!currentUser) {
        console.log('No current user, skipping subscription data load');
        return;
      }

      // Get subscription summary from database
      const { data, error } = await supabase
        .rpc('get_recycler_subscription_summary', { p_recycler_id: currentUser.id });

      if (error) {
        console.error('Error fetching subscription summary:', error);
        throw error;
      }

      if (data && data.length > 0) {
        setSubscriptionSummary(data[0]);
        console.log('Subscription data loaded successfully:', data[0]);
      }
      
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

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

  // ===== INITIALIZATION =====
  useEffect(() => {
    if (currentUser) {
      loadSubscriptionData();
    }
  }, [currentUser, loadSubscriptionData]);

  // ===== INITIALIZE PAYSTACK =====
  useEffect(() => {
    const initializePaystack = async () => {
      try {
        await paystackService.initialize();
        console.log('Paystack service initialized');
      } catch (error) {
        console.error('Failed to initialize Paystack:', error);
      }
    };

    initializePaystack();
  }, []);

  // ===== COMPUTED VALUES =====
  const isPaymentRequired = subscriptionSummary?.is_payment_required || false;
  const weeklySummary = {
    totalPickups: subscriptionSummary?.current_week_pickups || 0,
    totalEarnings: subscriptionSummary?.current_week_earnings || 0,
    fees: subscriptionSummary?.current_week_fees || 0,
    pickups: subscriptionSummary?.current_week_pickups || 0,
    avgFee: (subscriptionSummary?.current_week_pickups || 0) > 0 
      ? (subscriptionSummary?.current_week_fees || 0) / (subscriptionSummary?.current_week_pickups || 1) 
      : 0
  };

  const handlePayFees = () => {
    if (!isPaymentRequired) {
      Alert.alert('No Payment Required', 'You have no outstanding subscription fees.');
      return;
    }

    setShowPaymentMethods(true);
  };

  const handlePaymentMethodSelection = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    setShowPaymentMethods(false);
    processPayment(method);
  };

  const processPayment = async (paymentMethod: PaymentMethod) => {
    if (!currentUser || !subscriptionSummary) {
      Alert.alert('Error', 'User or subscription data not available.');
      return;
    }

    setIsProcessing(true);

    try {
      const totalFees = subscriptionSummary.total_pending_fees;
      
      // Get user email from auth
      const userEmail = currentUser.email || `${currentUser.id}@ecowastego.com`;

      // Process payment through Paystack
      const result = await paystackService.processSubscriptionPayment(
        currentUser.id,
        totalFees,
        userEmail,
        paymentMethod.type,
        {
          recycler_id: currentUser.id,
          payment_type: 'subscription_fee',
          week_fees: subscriptionSummary.current_week_fees,
          overdue_fees: subscriptionSummary.overdue_fees,
        }
      );

      if (result.success && result.data) {
        // Open payment URL in WebView
        setPaymentUrl(result.data.data.authorization_url);
        setShowWebView(true);
      } else {
        throw new Error(result.error || 'Failed to initialize payment');
      }

    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert(
        'Payment Failed',
        `Failed to initialize payment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWebViewNavigationStateChange = (navState: any) => {
    const { url } = navState;
    
    // Check if payment was successful (Paystack redirect URLs)
    if (url.includes('success') || url.includes('successful')) {
      handlePaymentSuccess();
    } else if (url.includes('failed') || url.includes('error')) {
      handlePaymentFailure();
    }
  };

  const handlePaymentSuccess = async () => {
    setShowWebView(false);
    setPaymentUrl(null);
    
    // Refresh subscription data
    await loadSubscriptionData();
    
    Alert.alert(
      'Payment Successful!',
      `Your subscription fees of ₵${subscriptionSummary?.total_pending_fees.toFixed(2)} have been paid successfully. You can continue using the app.`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const handlePaymentFailure = () => {
    setShowWebView(false);
    setPaymentUrl(null);
    
    Alert.alert(
      'Payment Failed',
      'Your payment was not successful. Please try again or contact support if the issue persists.',
      [{ text: 'OK' }]
    );
  };

  const renderPaymentMethodModal = () => (
    <Modal
      visible={showPaymentMethods}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowPaymentMethods(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Payment Method</Text>
            <TouchableOpacity
              onPress={() => setShowPaymentMethods(false)}
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={24} color={COLORS.darkGreen} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.paymentMethodsList}>
            {paystackService.getPaymentMethods().map((method) => (
              <TouchableOpacity
                key={method.id}
                style={styles.paymentMethodItem}
                onPress={() => handlePaymentMethodSelection(method)}
                disabled={!method.enabled}
              >
                <View style={styles.paymentMethodContent}>
                  <Text style={styles.paymentMethodIcon}>{method.icon}</Text>
                  <View style={styles.paymentMethodInfo}>
                    <Text style={styles.paymentMethodName}>{method.name}</Text>
                    <Text style={styles.paymentMethodDescription}>{method.description}</Text>
                  </View>
                  <MaterialIcons
                    name="chevron-right"
                    size={24}
                    color={COLORS.darkGreen}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <Text style={styles.modalFooterText}>
              Amount: ₵{subscriptionSummary?.total_pending_fees.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderWebViewModal = () => (
    <Modal
      visible={showWebView}
      animationType="slide"
      onRequestClose={() => setShowWebView(false)}
    >
      <View style={styles.webViewContainer}>
        <View style={styles.webViewHeader}>
          <Text style={styles.webViewTitle}>Complete Payment</Text>
          <TouchableOpacity
            onPress={() => setShowWebView(false)}
            style={styles.closeButton}
          >
            <MaterialIcons name="close" size={24} color={COLORS.darkGreen} />
          </TouchableOpacity>
        </View>
        
        {paymentUrl && (
          <WebView
            source={{ uri: paymentUrl }}
            onNavigationStateChange={handleWebViewNavigationStateChange}
            style={styles.webView}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.webViewLoading}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.webViewLoadingText}>Loading payment page...</Text>
              </View>
            )}
          />
        )}
      </View>
    </Modal>
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
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIconContainer}>
            <MaterialIcons name="account-balance-wallet" size={48} color={COLORS.darkGreen} />
          </View>
          <Text style={styles.title}>Subscription Management</Text>
          <Text style={styles.subtitle}>Weekly 10% commission on pickups</Text>
        </View>

        {/* Payment Status */}
        <View style={[styles.statusCard, isPaymentRequired ? styles.paymentRequired : styles.noPayment]}>
          <MaterialIcons 
            name={isPaymentRequired ? "warning" : "check-circle"} 
            size={32} 
            color={isPaymentRequired ? "#FF6B6B" : "#4CAF50"} 
          />
          <View style={styles.statusContent}>
            <Text style={styles.statusTitle}>
              {isPaymentRequired ? 'Payment Required' : 'All Caught Up'}
            </Text>
            <Text style={styles.statusDescription}>
              {isPaymentRequired 
                ? 'You have outstanding subscription fees that need to be paid.'
                : 'Your subscription fees are up to date.'
              }
            </Text>
          </View>
        </View>

        {/* Weekly Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>This Week's Summary</Text>
          
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Pickups</Text>
              <Text style={styles.summaryValue}>{weeklySummary.totalPickups}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Earnings</Text>
              <Text style={styles.summaryValue}>₵{weeklySummary.totalEarnings.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Platform Fee (10%)</Text>
              <Text style={styles.summaryValue}>₵{weeklySummary.fees.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Avg. Fee per Pickup</Text>
              <Text style={styles.summaryValue}>₵{weeklySummary.avgFee.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Fee Breakdown */}
        <View style={styles.feeBreakdownCard}>
          <Text style={styles.feeBreakdownTitle}>Fee Breakdown</Text>
          
          <View style={styles.feeBreakdownRow}>
            <Text style={styles.feeBreakdownLabel}>Current Week Fees</Text>
            <Text style={styles.feeBreakdownValue}>₵{subscriptionSummary?.current_week_fees.toFixed(2) || '0.00'}</Text>
          </View>

          {(subscriptionSummary?.overdue_fees || 0) > 0 && (
            <View style={styles.feeBreakdownRow}>
              <Text style={[styles.feeBreakdownLabel, styles.overdueLabel]}>Overdue Fees</Text>
              <Text style={[styles.feeBreakdownValue, styles.overdueValue]}>
                ₵{subscriptionSummary?.overdue_fees.toFixed(2) || '0.00'}
              </Text>
            </View>
          )}

          <View style={styles.feeBreakdownDivider} />
          
          <View style={styles.feeBreakdownRow}>
            <Text style={styles.feeBreakdownTotalLabel}>Total Amount Due</Text>
            <Text style={styles.feeBreakdownTotalValue}>
              ₵{subscriptionSummary?.total_pending_fees.toFixed(2) || '0.00'}
            </Text>
          </View>
        </View>

        {/* Payment Button */}
        {isPaymentRequired && (
          <TouchableOpacity
            style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
            onPress={handlePayFees}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <MaterialIcons name="payment" size={24} color="white" />
                <Text style={styles.payButtonText}>Pay Subscription Fees</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <MaterialIcons name="info" size={24} color={COLORS.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>How It Works</Text>
            <Text style={styles.infoText}>
              • Platform fee is 10% of your weekly earnings{'\n'}
              • Fees are calculated automatically{'\n'}
              • Payment is required to continue using the platform{'\n'}
              • Multiple payment methods available
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Payment Method Selection Modal */}
      {renderPaymentMethodModal()}

      {/* Payment WebView Modal */}
      {renderWebViewModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textLight,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  paymentRequired: {
    backgroundColor: '#FFF3F3',
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  noPayment: {
    backgroundColor: '#F0FFF4',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  statusContent: {
    flex: 1,
    marginLeft: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  feeBreakdownCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feeBreakdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 16,
  },
  feeBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  feeBreakdownLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  overdueLabel: {
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  feeBreakdownValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  overdueValue: {
    color: '#FF6B6B',
  },
  feeBreakdownDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  feeBreakdownTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  feeBreakdownTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  payButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  payButtonDisabled: {
    backgroundColor: COLORS.textLight,
  },
  payButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  closeButton: {
    padding: 4,
  },
  paymentMethodsList: {
    maxHeight: 400,
  },
  paymentMethodItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 4,
  },
  paymentMethodDescription: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
  },
  modalFooterText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  // WebView Styles
  webViewContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  webViewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  webViewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  webView: {
    flex: 1,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  webViewLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textLight,
  },
});