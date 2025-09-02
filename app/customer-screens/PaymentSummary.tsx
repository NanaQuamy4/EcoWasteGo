import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../constants';

// ===== MOCK DATA FOR PAYMENT SUMMARY SCREEN =====
// This replaces the backend API calls with local mock data
// In a real app, this would come from a database or payment service

// Mock payment summary data
const mockPaymentSummary = {
  id: "pay_sum_001",
  requestId: "req_001",
  recyclerId: "recycler_001",
  recyclerName: "GreenFleet GH",
  recyclerPhone: "+233241234568",
  wasteType: "Mixed Waste",
  weight: "10 kg",
  rate: "GHS 1.20/kg",
  subtotal: "GHS 12.00",
  environmentalTax: "GHS 0.60",
  totalAmount: "GHS 12.60",
  status: "pending",
  createdAt: "2025-06-26T14:30:00Z",
  pickupAddress: "123 Main Street, Accra Central",
  specialInstructions: "Please call before arrival",
  estimatedPickupTime: "15:30"
};

// Mock customer data
const mockCustomerData = {
  id: "user_001",
  name: "John Doe",
  phone: "+233241234567",
  email: "john.doe@example.com",
  address: "123 Main Street, Accra Central"
};

export default function PaymentSummary() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    requestId?: string;
    recyclerId?: string;
    recyclerName?: string;
    pickup?: string;
    paymentSummaryId?: string;
    weight?: string;
    wasteType?: string;
    rate?: string;
    subtotal?: string;
    environmentalTax?: string;
    totalAmount?: string;
  }>();

  // ===== LOCAL STATE MANAGEMENT =====
  // These state variables manage the UI state and data
  const [paymentSummary, setPaymentSummary] = useState<any>(null);
  const [customerData, setCustomerData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  // ===== INITIALIZATION EFFECT =====
  // This effect runs when the component first loads
  useEffect(() => {
    loadMockData();
  }, []);

  // ===== MOCK DATA LOADING FUNCTION =====
  // This replaces the backend API call to fetch payment summary data
  // It loads data from our mock data arrays
  const loadMockData = async () => {
    try {
      setIsLoading(true);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Create payment summary from params or use mock data
      const summary = {
        ...mockPaymentSummary,
        requestId: params.requestId || mockPaymentSummary.requestId,
        recyclerId: params.recyclerId || mockPaymentSummary.recyclerId,
        recyclerName: params.recyclerName || mockPaymentSummary.recyclerName,
        pickup: params.pickup || mockPaymentSummary.pickupAddress,
        weight: params.weight || mockPaymentSummary.weight,
        wasteType: params.wasteType || mockPaymentSummary.wasteType,
        rate: params.rate || mockPaymentSummary.rate,
        subtotal: params.subtotal || mockPaymentSummary.subtotal,
        environmentalTax: params.environmentalTax || mockPaymentSummary.environmentalTax,
        totalAmount: params.totalAmount || mockPaymentSummary.totalAmount,
        id: params.paymentSummaryId || mockPaymentSummary.id
      };
      
      setPaymentSummary(summary);
      setCustomerData(mockCustomerData);
      console.log('PaymentSummary: Mock data loaded successfully');
    } catch (error) {
      console.error('PaymentSummary: Error loading mock data:', error);
      // Fallback to default mock data
      setPaymentSummary(mockPaymentSummary);
      setCustomerData(mockCustomerData);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== MOCK ACTION HANDLERS =====
  // These functions handle user actions
  
  // Accept the payment summary
  const handleAcceptPayment = async () => {
    setIsAccepting(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update mock data status
      if (paymentSummary) {
        paymentSummary.status = 'accepted';
        setPaymentSummary({ ...paymentSummary });
      }
      
      console.log('PaymentSummary: Payment accepted successfully');
      
      // Navigate directly to payment made screen
      router.push({
        pathname: '/customer-screens/PaymentMade',
        params: {
          requestId: paymentSummary?.requestId,
          amount: paymentSummary?.totalAmount,
          recyclerName: paymentSummary?.recyclerName,
          wasteType: paymentSummary?.wasteType,
          weight: paymentSummary?.weight
        }
      });
    } catch (error) {
      console.error('Error accepting payment:', error);
      Alert.alert('Error', 'Failed to accept payment. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };

  // Reject the payment summary
  const handleRejectPayment = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for rejection.');
      return;
    }

    setIsRejecting(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update mock data status
      if (paymentSummary) {
        paymentSummary.status = 'rejected';
        paymentSummary.rejectionReason = rejectionReason;
        setPaymentSummary({ ...paymentSummary });
      }
      
      console.log('PaymentSummary: Payment rejected successfully');
      
      Alert.alert(
        'Payment Rejected',
        'Your payment summary has been rejected. The recycler will be notified and may provide a new summary.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowRejectionModal(false);
              setRejectionReason('');
              // Navigate back to tracking screen
              router.back();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error rejecting payment:', error);
      Alert.alert('Error', 'Failed to reject payment. Please try again.');
    } finally {
      setIsRejecting(false);
    }
  };

  // Show rejection modal
  const showRejectionReasonModal = () => {
    setShowRejectionModal(true);
  };

  // Cancel rejection
  const cancelRejection = () => {
    setShowRejectionModal(false);
    setRejectionReason('');
  };

  // Contact recycler
  const handleContactRecycler = () => {
    if (paymentSummary?.recyclerPhone) {
      Alert.alert(
        'Contact Recycler',
        `Call ${paymentSummary.recyclerName} at ${paymentSummary.recyclerPhone}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Call', 
            onPress: () => {
              // In a real app, this would use Linking to make a phone call
              console.log('Calling recycler:', paymentSummary.recyclerPhone);
              Alert.alert('Call Recycler', 'Phone call functionality would be implemented here.');
            }
          }
        ]
      );
    }
  };

  // View recycler profile
  const handleViewRecyclerProfile = () => {
    if (paymentSummary?.recyclerId) {
      router.push({
        pathname: '/customer-screens/RecyclerProfileDetails',
        params: { recyclerId: paymentSummary.recyclerId }
      });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading payment summary...</Text>
      </View>
    );
  }

  if (!paymentSummary || !customerData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load payment summary</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadMockData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Logo and Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#1C3301" />
        </TouchableOpacity>
        
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/images/logo landscape.png')} 
            style={styles.logoLandscape}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.headerRight} />
      </View>

      {/* Payment Due Banner */}
      <View style={styles.paymentDueBanner}>
        <View style={styles.bannerPill}>
          <Text style={styles.paymentDueText}>Payment Due</Text>
        </View>
      </View>

      {/* Summary Section */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
                      <Text style={styles.summaryTitle}>Summary</Text>
          
          <View style={styles.paymentDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Recycler</Text>
              <View style={styles.detailValue}>
                <Text style={styles.valueText}>{paymentSummary.recyclerName}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pickup Date:</Text>
              <View style={styles.detailValue}>
                <Text style={styles.valueText}>June 26, 2025</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Weight</Text>
              <View style={styles.detailValue}>
                <Text style={styles.valueText}>{paymentSummary.weight}</Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Rate</Text>
              <View style={styles.detailValue}>
                <Text style={styles.valueText}>{paymentSummary.rate}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Environmental Excise Tax (5%)</Text>
              <View style={styles.detailValue}>
                <Text style={styles.valueText}>{paymentSummary.environmentalTax}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, styles.boldLabel]}>Total Due</Text>
              <View style={styles.detailValue}>
                <Text style={[styles.valueText, styles.totalText]}>{paymentSummary.totalAmount}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Note Section */}
        <View style={styles.noteSection}>
          <Text style={styles.noteText}>This receipt includes a 5% Environmental Excise Tax.</Text>
          <Text style={styles.noteText}>Your payment supports Ghana's environmental protection and recycling efforts.</Text>
          <Text style={styles.noteText}>Together, we're reducing pollution and creating a cleaner future</Text>
          <Text style={styles.noteText}>"One Tap to a Greener Planet."</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.rejectButton} 
          onPress={showRejectionReasonModal}
          disabled={isRejecting}
        >
          <Text style={styles.rejectButtonText}>
            {isRejecting ? 'Processing...' : 'REJECT'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.acceptButton} 
          onPress={handleAcceptPayment}
          disabled={isAccepting}
        >
          <Text style={styles.acceptButtonText}>
            {isAccepting ? 'Processing...' : 'ACCEPT'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/customer-screens/HomeScreen')}>
          <MaterialIcons name="home" size={28} color="#22330B" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/customer-screens/history')}>
          <MaterialIcons name="history" size={28} color="#22330B" />
          <Text style={styles.navLabel}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/user')}>
          <MaterialIcons name="person" size={28} color="#22330B" />
          <Text style={styles.navLabel}>User</Text>
        </TouchableOpacity>
      </View>

      {/* Rejection Reason Input */}
      {showRejectionModal && (
        <View style={styles.rejectionContainer}>
          <Text style={styles.rejectionTitle}>Why are you rejecting this payment?</Text>
          <Text style={styles.rejectionSubtitle}>
            Please provide a detailed reason so the recycler can understand and fix the issue.
          </Text>
          
          <View style={styles.rejectionExamples}>
            <Text style={styles.rejectionExamplesTitle}>Select a reason:</Text>
            <TouchableOpacity 
              style={styles.rejectionExampleButton}
              onPress={() => {
                // No specific reason selection in mock data, so no action
              }}
            >
              <View style={styles.reasonContent}>
                <View style={styles.reasonHeader}>
                  <Text style={styles.rejectionExample}>
                    • Placeholder Reason
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.selectedReasonContainer}>
            <Text style={styles.selectedReasonLabel}>
              Custom Reason:
            </Text>
            <TextInput
              style={styles.rejectionInput}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="Enter your detailed reason for rejection..."
              multiline
              numberOfLines={4}
              placeholderTextColor="#999"
              maxLength={500}
            />
            
            <View style={styles.rejectionCharCount}>
              <Text style={styles.rejectionCharCountText}>
                {rejectionReason.length}/500 characters
              </Text>
            </View>
          </View>
          
          <View style={styles.rejectionActions}>
            <TouchableOpacity 
              style={styles.cancelRejectionButton} 
              onPress={cancelRejection}
            >
              <Text style={styles.cancelRejectionButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.confirmRejectionButton, 
                (!rejectionReason.trim() || rejectionReason.trim().length < 10) && styles.disabledButton
              ]} 
              onPress={handleRejectPayment}
              disabled={!rejectionReason.trim() || rejectionReason.trim().length < 10 || isRejecting}
            >
              <Text style={styles.confirmRejectionButtonText}>
                {isRejecting ? 'Processing...' : 'Confirm Rejection'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FFF0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C3301',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    textAlign: 'center',
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FFF0',
  },
  loadingText: {
    fontSize: 18,
    color: '#1C3301',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FFF0',
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
  paymentDueBanner: {
    backgroundColor: '#F2FFE5',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  paymentDueText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    textAlign: 'center',
  },
  summaryContainer: {
    backgroundColor: '#CFDFBF',
    borderRadius: 20,
    marginHorizontal: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  summaryTitleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitleLogo: {
    width: 200,
    height: 60,
  },
  paymentDetails: {
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
  boldLabel: {
    fontWeight: 'bold',
    color: '#1C3301',
  },
  detailValue: {
    flexDirection: 'row',
    alignItems: 'center',
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
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C3301',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },

  noteSection: {
    marginTop: 8,
  },
  noteText: {
    fontSize: 12,
    color: '#192E01',
    lineHeight: 18,
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 20,
  },
  rejectButton: {
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
  rejectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  acceptButton: {
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
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  rejectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rejectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C3301',
    marginBottom: 12,
  },
  rejectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  rejectionExamples: {
    marginBottom: 12,
  },
  rejectionExamplesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1C3301',
    marginBottom: 8,
  },
  rejectionExampleButton: {
    paddingVertical: 8,
  },
  reasonContent: {
    paddingVertical: 8,
  },
  reasonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rejectionExample: {
    fontSize: 12,
    color: '#192E01',
    marginBottom: 4,
  },
  rejectionDescription: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  selectedReasonButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  selectedReasonText: {
    fontWeight: 'bold',
    color: '#1C3301',
  },
  selectedReasonContainer: {
    marginTop: 12,
  },
  selectedReasonLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1C3301',
    marginBottom: 8,
  },
  rejectionInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rejectionCharCount: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  rejectionCharCountText: {
    fontSize: 12,
    color: '#666',
  },
  rejectionActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  cancelRejectionButton: {
    backgroundColor: '#FF4444',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flex: 1,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelRejectionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  confirmRejectionButton: {
    backgroundColor: '#1C3301',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flex: 1,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmRejectionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  selectedIndicator: {
    fontSize: 16,
    color: '#1C3301',
    marginLeft: 8,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logoLandscape: {
    height: 44,
    resizeMode: 'contain',
    flex: 1,
  },
  bannerPill: {
    backgroundColor: '#1C3301',
    borderRadius: 15,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navLabel: {
    fontSize: 12,
    color: '#22330B',
    marginTop: 4,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
}); 