import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../constants';
import CommonHeader from '../components/CommonHeader';

// ===== MOCK DATA FOR RECYCLER PAYMENT SUMMARY SCREEN =====
// This replaces the backend API calls with local mock data
// In a real app, this would come from a database or payment service

// Mock waste collection data
const mockWasteCollection = {
  id: "req_001",
  customer_id: "user_001",
  customer_name: "John Doe",
  customer_phone: "+233241234567",
  customer_address: "123 Main Street, Accra Central",
  waste_type: "Mixed Waste",
  weight: 8.5,
  special_instructions: "Please call before arrival",
  status: "in_progress",
  created_at: "2024-01-15T10:30:00Z",
  pickup_completed_at: "2024-01-15T14:30:00Z"
};

// Mock recycler data
const mockRecyclerData = {
  id: "recycler_001",
  name: "Green Team",
  phone: "+233241234568",
  rating: 4.8,
  completedPickups: 150,
  vehicle: "Recycling Truck",
  baseRate: 2.50 // per kg
};

// Mock payment calculation
const mockPaymentCalculation = {
  baseAmount: 0,
  environmentalTax: 0,
  totalAmount: 0,
  taxRate: 0.05, // 5%
  currency: "₵"
};

export default function RecyclerPaymentSummary() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    requestId?: string;
    customerName?: string;
    customerPhone?: string;
    pickup?: string;
    wasteType?: string;
    weight?: string;
    rate?: string;
  }>();

  // ===== LOCAL STATE MANAGEMENT =====
  // These state variables manage the UI state and data
  const [wasteCollection, setWasteCollection] = useState<any>(null);
  const [recyclerData, setRecyclerData] = useState<any>(null);
  const [paymentCalculation, setPaymentCalculation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [weight, setWeight] = useState('');
  const [rate, setRate] = useState('');

  // ===== INITIALIZATION EFFECT =====
  // This effect runs when the component first loads
  useEffect(() => {
    loadMockData();
  }, []);

  // ===== MOCK DATA LOADING FUNCTION =====
  // This replaces the backend API call to fetch waste collection data
  // It loads data from our mock data arrays
  const loadMockData = async () => {
    try {
      setIsLoading(true);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Load mock waste collection data
      const collection = {
        ...mockWasteCollection,
        customer_name: params.customerName || mockWasteCollection.customer_name,
        customer_phone: params.customerPhone || mockWasteCollection.customer_phone,
        customer_address: params.pickup || mockWasteCollection.customer_address,
        waste_type: params.wasteType || mockWasteCollection.waste_type,
        weight: parseFloat(params.weight || mockWasteCollection.weight.toString()),
        id: params.requestId || mockWasteCollection.id
      };
      
      setWasteCollection(collection);
      setRecyclerData(mockRecyclerData);
      
      // Use rate from params or fallback to mock data
      const rateFromParams = parseFloat(params.rate || mockRecyclerData.baseRate.toString());
      
      // Initialize payment calculation
      const initialCalculation = {
        ...mockPaymentCalculation,
        baseRate: rateFromParams
      };
      
      setPaymentCalculation(initialCalculation);
      setWeight(collection.weight.toString());
      setRate(rateFromParams.toString());
      
      // Calculate initial payment
      const weightValue = collection.weight;
      const rateValue = rateFromParams;
      const baseAmount = weightValue * rateValue;
      const environmentalTax = baseAmount * initialCalculation.taxRate;
      const totalAmount = baseAmount + environmentalTax;
      
      setPaymentCalculation({
        ...initialCalculation,
        baseAmount,
        environmentalTax,
        totalAmount
      });
      
      console.log('RecyclerPaymentSummary: Mock data loaded successfully');
    } catch (error) {
      console.error('RecyclerPaymentSummary: Error loading mock data:', error);
      // Fallback to default mock data
      setWasteCollection(mockWasteCollection);
      setRecyclerData(mockRecyclerData);
      setPaymentCalculation(mockPaymentCalculation);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== MOCK ACTION HANDLERS =====
  // These functions handle user actions
  
  // Calculate payment based on weight and rate
  const calculatePayment = () => {
    const weightValue = parseFloat(weight) || 0;
    const rateValue = parseFloat(rate) || 0;
    
    if (weightValue <= 0 || rateValue <= 0) {
      Alert.alert('Invalid Values', 'Please enter valid weight and rate values.');
      return;
    }
    
    const baseAmount = weightValue * rateValue;
    const environmentalTax = baseAmount * paymentCalculation.taxRate;
    const totalAmount = baseAmount + environmentalTax;
    
    setPaymentCalculation({
      ...paymentCalculation,
      baseAmount,
      environmentalTax,
      totalAmount
    });
    
    console.log('Payment calculated:', { baseAmount, environmentalTax, totalAmount });
    
    // Update the waste collection with new weight
    setWasteCollection((prev: any) => prev ? {
      ...prev,
      weight: weightValue
    } : prev);
  };

  // Submit payment summary
  const handleSubmitPaymentSummary = async () => {
    if (!weight.trim() || !rate.trim()) {
      Alert.alert('Missing Information', 'Please enter both weight and rate.');
      return;
    }

    const weightValue = parseFloat(weight);
    const rateValue = parseFloat(rate);

    if (weightValue <= 0 || rateValue <= 0) {
      Alert.alert('Invalid Values', 'Weight and rate must be greater than 0.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create payment summary data
      const paymentSummary = {
        id: `pay_sum_${Date.now()}`,
        requestId: wasteCollection.id,
        recyclerId: recyclerData.id,
        weight: `${weightValue} kg`,
        wasteType: wasteCollection.waste_type,
        rate: `${paymentCalculation.currency} ${rateValue}/kg`,
        subtotal: `${paymentCalculation.currency} ${paymentCalculation.baseAmount.toFixed(2)}`,
        environmentalTax: `${paymentCalculation.currency} ${paymentCalculation.environmentalTax.toFixed(2)}`,
        totalAmount: `${paymentCalculation.currency} ${paymentCalculation.totalAmount.toFixed(2)}`,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      console.log('RecyclerPaymentSummary: Payment summary created successfully');
      
      Alert.alert(
        'Payment Summary Sent!',
        'Your payment summary has been sent to the customer for review. You can now wait for their response or track the payment status.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Stay on the same screen - no navigation
              console.log('Payment summary sent, staying on current screen');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error creating payment summary:', error);
      Alert.alert('Error', 'Failed to create payment summary. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Call customer
  const handleCallCustomer = () => {
    if (wasteCollection?.customer_phone) {
      Alert.alert(
        'Call Customer',
        `Call ${wasteCollection.customer_name} at ${wasteCollection.customer_phone}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Call', 
            onPress: () => {
              // In a real app, this would use Linking to make a phone call
              console.log('Calling customer:', wasteCollection.customer_phone);
              Alert.alert('Call Customer', 'Phone call functionality would be implemented here.');
            }
          }
        ]
      );
    }
  };

  // View customer profile
  const handleViewCustomerProfile = () => {
    if (wasteCollection?.customer_id) {
      // In a real app, this would navigate to customer profile
      Alert.alert('Customer Profile', 'Customer profile view would be implemented here.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading collection details...</Text>
      </View>
    );
  }

  if (!wasteCollection || !recyclerData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load collection information</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadMockData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CommonHeader />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Payment Summary</Text>
          <Text style={styles.headerSubtitle}>Review bill for {wasteCollection.customer_name}</Text>
        </View>

      {/* Payment Status Indicator */}
      {/* This section is removed as per the new_code, as payment status is now managed by mock data */}

      {/* Summary Card */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Bill Details</Text>
          
          <View style={styles.billDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>User</Text>
              <View style={styles.detailValue}>
                <Text style={styles.valueText}>{wasteCollection.customer_name}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pickup Location</Text>
              <View style={styles.detailValue}>
                <Text style={styles.valueText}>{wasteCollection.customer_address}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Waste Type</Text>
              <View style={styles.detailValue}>
                <Text style={styles.valueText}>{wasteCollection.waste_type}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Weight (kg)</Text>
              <View style={styles.detailValue}>
                <TextInput
                  style={styles.valueInput}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  placeholder="Enter weight"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Rate (GHS/kg)</Text>
              <View style={styles.detailValue}>
                <TextInput
                  style={styles.valueInput}
                  value={rate}
                  onChangeText={setRate}
                  keyboardType="numeric"
                  placeholder="Enter rate"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Subtotal</Text>
              <View style={styles.detailValue}>
                <Text style={styles.valueText}>GHS {paymentCalculation.baseAmount.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Environmental Tax (5%)</Text>
              <View style={styles.detailValue}>
                <Text style={styles.valueText}>GHS {paymentCalculation.environmentalTax.toFixed(2)}</Text>
              </View>
            </View>

            <View style={[styles.detailRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <View style={styles.totalValue}>
                <Text style={styles.totalText}>GHS {paymentCalculation.totalAmount.toFixed(2)}</Text>
              </View>
            </View>
          </View>
          
          {/* Calculate Button */}
          <TouchableOpacity 
            style={styles.calculateButton} 
            onPress={calculatePayment}
          >
            <Text style={styles.calculateButtonText}>Recalculate Bill</Text>
          </TouchableOpacity>
        </View>

        {/* Note Section */}
        <View style={styles.noteSection}>
          <Text style={styles.noteTitle}>Note:</Text>
          <Text style={styles.noteText}>This bill includes a 5% Environmental Excise Tax as required by Ghana&apos;s environmental protection regulations.</Text>
          <Text style={styles.noteText}>The user will receive this payment summary and can accept or reject the payment.</Text>
        </View>


      </View>

      {/* Fixed Bottom Buttons */}
      <View style={styles.bottomButtonsContainer}>
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.editButton} onPress={() => router.push({
            pathname: '/recycler-screens/RecyclerWeightEntry' as any,
            params: {
              requestId: wasteCollection.id,
              userName: wasteCollection.customer_name,
              pickup: wasteCollection.customer_address,
              currentWeight: wasteCollection.weight,
              currentWasteType: wasteCollection.waste_type
            }
          })}>
            <Text style={styles.editButtonText}>EDIT</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sendButton, isSubmitting && styles.disabledButton]} 
            onPress={handleSubmitPaymentSummary}
            disabled={isSubmitting}
          >
            <Text style={styles.sendButtonText}>
              {isSubmitting ? 'SENDING...' : 'SEND TO USER'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Payment Received Button */}
        <View style={styles.paymentReceivedContainer}>
          <TouchableOpacity 
            style={styles.paymentReceivedButton} 
            onPress={() => {
              // Simulate payment received for mock data
              Alert.alert(
                'Payment Received',
                'Confirm that you have received the payment from the customer?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Confirm',
                    onPress: () => {
                                             // Calculate earnings from total amount
                       const earnings = paymentCalculation.totalAmount;
                      
                      // Add completed pickup to recyclerStats with payment data
                      // recyclerStats.addCompletedPickup(requestId, earnings, {
                      //   customer: userName,
                      //   wasteType: wasteType,
                      //   weight: weight
                      // });

                      // Navigate to celebration screen
                      router.push({
                        pathname: '/recycler-screens/RecyclerCelebration' as any,
                        params: {
                          pickupId: wasteCollection.id,
                          userName: wasteCollection.customer_name,
                          location: wasteCollection.customer_address,
                          totalAmount: paymentCalculation.totalAmount
                        }
                      });
                    }
                  }
                ]
              );
            }}
            // Removed disabled={!paymentSent || !paymentAccepted}
          >
            <Text style={styles.paymentReceivedButtonText}>
              💰 PAYMENT RECEIVED
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FFF0',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
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
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  statusContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statusCard: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  pendingStatus: {
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  acceptedStatus: {
    backgroundColor: '#D4EDDA',
    borderWidth: 1,
    borderColor: '#C3E6CB',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  statusSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  summaryContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 20,
    textAlign: 'center',
  },
  billDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  valueText: {
    fontSize: 14,
    color: COLORS.darkGreen,
    fontWeight: '600',
  },
  valueInput: {
    fontSize: 14,
    color: COLORS.darkGreen,
    fontWeight: '600',
    textAlign: 'center',
    minWidth: 80,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  totalValue: {
    backgroundColor: '#F2FFE5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: COLORS.darkGreen,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  calculateButton: {
    backgroundColor: COLORS.darkGreen,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noteSection: {
    backgroundColor: '#CFDFBF',
    borderRadius: 16,
    padding: 20,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 12,
  },
  noteText: {
    fontSize: 14,
    color: '#192E01',
    marginBottom: 8,
    lineHeight: 20,
  },

  bottomButtonsContainer: {
    backgroundColor: '#F8FFF0',
    paddingTop: 10,
    paddingBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  editButton: {
    backgroundColor: '#FF4444',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sendButton: {
    backgroundColor: '#1C3301',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#999',
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  paymentReceivedContainer: {
    paddingHorizontal: 20,
  },
  paymentReceivedButton: {
    backgroundColor: '#FFD700',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#FFA500',
  },
  disabledPaymentButton: {
    backgroundColor: '#E0E0E0',
    borderColor: '#CCC',
    opacity: 0.5,
  },
  paymentReceivedButtonText: {
    color: '#1C3301',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledPaymentButtonText: {
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FFF0',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FFF0',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#1C3301',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 