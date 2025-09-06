import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../constants';
import { supabase } from '../../lib/supabase';

// Payment summary data will be fetched from database

// Customer data will be fetched from database

// Predefined rejection reasons
const predefinedReasons = [
  {
    id: 'price_too_high',
    text: 'Price is too high for the service provided',
    description: 'The quoted amount exceeds what I expected for this waste collection'
  },
  {
    id: 'weight_discrepancy',
    text: 'Weight measurement seems incorrect',
    description: 'The weight recorded does not match what I observed'
  },
  {
    id: 'quality_issue',
    text: 'Waste quality assessment is unfair',
    description: 'The quality rating does not reflect the actual condition of my waste'
  },
  {
    id: 'service_issue',
    text: 'Poor service quality or attitude',
    description: 'The recycler provided unsatisfactory service or was unprofessional'
  },
  {
    id: 'timing_issue',
    text: 'Collection took too long or was delayed',
    description: 'The pickup was significantly delayed or took longer than expected'
  },
  {
    id: 'other',
    text: 'Other reason (please specify)',
    description: 'I have a different reason for rejecting this payment'
  }
];

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
  const [selectedReason, setSelectedReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  // ===== INITIALIZATION EFFECT =====
  // This effect runs when the component first loads
  useEffect(() => {
    loadPaymentData();
  }, []);

  // ===== REAL DATA LOADING FUNCTION =====
  // This fetches real payment summary data from the database
  const loadPaymentData = async () => {
    try {
      setIsLoading(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Fetch payment summary from database
      const { data: paymentData, error: paymentError } = await supabase
        .from('payment_summaries')
        .select(`
          *,
          pickup_requests!inner(
            id,
            customer_id,
            pickup_address,
            waste_type,
            estimated_weight,
            status
          ),
          recyclers!inner(
            id,
            full_name,
            phone
          )
        `)
        .eq('id', params.paymentSummaryId)
        .single();

      if (paymentError) {
        console.error('Error fetching payment summary:', paymentError);
        throw paymentError;
      }

      // Fetch customer data
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', user.id)
        .single();

      if (customerError) {
        console.error('Error fetching customer data:', customerError);
        // Continue without customer data
      }

      // Format payment summary data
      const summary = {
        id: paymentData.id,
        requestId: paymentData.request_id,
        recyclerId: paymentData.recycler_id,
        recyclerName: paymentData.recyclers?.full_name || params.recyclerName || 'Unknown Recycler',
        recyclerPhone: paymentData.recyclers?.phone || '',
        pickup: paymentData.pickup_requests?.pickup_address || params.pickup || 'Selected Location',
        weight: `${paymentData.weight} kg`,
        wasteType: paymentData.waste_type || params.wasteType || 'Mixed Waste',
        rate: `GHS ${paymentData.rate_per_kg}/kg`,
        subtotal: `GHS ${paymentData.base_amount.toFixed(2)}`,
        environmentalTax: `GHS ${paymentData.environmental_tax.toFixed(2)}`,
        totalAmount: `GHS ${paymentData.total_amount.toFixed(2)}`,
        status: paymentData.status,
        customerId: paymentData.pickup_requests?.customer_id
      };
      
      setPaymentSummary(summary);
      setCustomerData(customerData);
      console.log('PaymentSummary: Real data loaded successfully');
    } catch (error) {
      console.error('PaymentSummary: Error loading data:', error);
      // Set fallback data from params
      const fallbackSummary = {
        id: params.paymentSummaryId || 'unknown',
        requestId: params.requestId || 'unknown',
        recyclerId: params.recyclerId || 'unknown',
        recyclerName: params.recyclerName || 'Unknown Recycler',
        recyclerPhone: '',
        pickup: params.pickup || 'Selected Location',
        weight: params.weight || '0 kg',
        wasteType: params.wasteType || 'Mixed Waste',
        rate: params.rate || 'GHS 1.20/kg',
        subtotal: params.subtotal || 'GHS 0.00',
        environmentalTax: params.environmentalTax || 'GHS 0.00',
        totalAmount: params.totalAmount || 'GHS 0.00',
        status: 'pending',
        customerId: 'unknown'
      };
      setPaymentSummary(fallbackSummary);
      setCustomerData(null);
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
      // Update payment summary status in database
      const { error: paymentError } = await supabase
        .from('payment_summaries')
        .update({
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentSummary?.id);

      if (paymentError) {
        console.error('Error updating payment summary:', paymentError);
        Alert.alert('Error', 'Failed to accept payment. Please try again.');
        return;
      }

      // Update pickup request status to completed
      const { error: requestError } = await supabase
        .from('pickup_requests')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentSummary?.requestId);

      if (requestError) {
        console.error('Error updating pickup request:', requestError);
        // Don't block the flow, just log the error
      }

      // Calculate eco points based on weight and waste type
      const weightInKg = parseFloat(paymentSummary?.weight?.replace(' kg', '') || '0');
      const basePointsPerKg = 1.0; // Base points per kg
      let bonusPoints = 0;
      
      // Bonus points for special waste types
      switch (paymentSummary?.wasteType?.toLowerCase()) {
        case 'electronic waste':
        case 'e-waste':
          bonusPoints = Math.floor(weightInKg * 2); // 2x bonus for e-waste
          break;
        case 'plastic':
          bonusPoints = Math.floor(weightInKg * 1.5); // 1.5x bonus for plastic
          break;
        case 'paper':
          bonusPoints = Math.floor(weightInKg * 1.2); // 1.2x bonus for paper
          break;
        case 'mixed waste':
        default:
          bonusPoints = 0; // No bonus for mixed waste
          break;
      }
      
      const totalEcoPoints = Math.floor(weightInKg * basePointsPerKg) + bonusPoints;

      // Calculate platform fee (10% commission)
      const totalAmount = parseFloat(paymentSummary?.totalAmount?.replace('GHS ', '') || '0');
      const platformFee = totalAmount * 0.10; // 10% platform fee
      const recyclerEarnings = totalAmount - platformFee; // 90% goes to recycler

      // Create recycler earnings record
      const { error: earningsError } = await supabase
        .from('recycler_earnings')
        .insert({
          recycler_id: paymentSummary?.recyclerId,
          request_id: paymentSummary?.requestId,
          payment_summary_id: paymentSummary?.id,
          waste_type: paymentSummary?.wasteType,
          weight: paymentSummary?.weight,
          base_amount: parseFloat(paymentSummary?.subtotal?.replace('GHS ', '') || '0'),
          environmental_tax: parseFloat(paymentSummary?.environmentalTax?.replace('GHS ', '') || '0'),
          total_amount: totalAmount,
          recycler_earnings: recyclerEarnings, // 90% goes to recycler
          platform_fee: platformFee, // 10% platform fee
          eco_points_earned: totalEcoPoints,
          points_per_kg: basePointsPerKg,
          bonus_points: bonusPoints,
          status: 'completed',
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      if (earningsError) {
        console.error('Error creating recycler earnings:', earningsError);
        // Don't block the flow, just log the error
      }

      // Calculate environmental impact
      const co2Saved = weightInKg * 0.5; // 0.5kg CO2 saved per kg of waste recycled
      const treesEquivalent = weightInKg * 0.02; // 0.02 trees equivalent per kg
      const landfillSpaceSaved = weightInKg * 0.5; // 0.5m³ landfill space saved per kg
      const energySaved = weightInKg * 1.4; // 1.4kWh energy saved per kg

      // Create customer earnings record
      const { error: customerEarningsError } = await supabase
        .from('customer_earnings')
        .insert({
          customer_id: paymentSummary?.customerId,
          request_id: paymentSummary?.requestId,
          waste_type: paymentSummary?.wasteType,
          weight_kg: weightInKg,
          base_points: Math.floor(weightInKg * basePointsPerKg),
          bonus_points: bonusPoints,
          total_points: totalEcoPoints,
          co2_saved: co2Saved,
          trees_equivalent: treesEquivalent,
          landfill_space_saved: landfillSpaceSaved,
          energy_saved: energySaved,
          achievements_earned: [], // Will be calculated by achievement system
          new_achievements: [], // Will be calculated by achievement system
          status: 'completed',
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      if (customerEarningsError) {
        console.error('Error creating customer earnings:', customerEarningsError);
        // Don't block the flow, just log the error
      }

      // Create notification for recycler about payment acceptance
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: paymentSummary?.recyclerId,
          type: 'payment_accepted',
          title: 'Payment Accepted!',
          message: `Customer has accepted your payment summary of ${paymentSummary?.totalAmount}. You earned ₵${recyclerEarnings.toFixed(2)} (after 10% platform fee) and ${totalEcoPoints} eco points from this pickup! 🌱`,
          data: {
            request_id: paymentSummary?.requestId,
            payment_summary_id: paymentSummary?.id,
            total_amount: paymentSummary?.totalAmount,
            recycler_earnings: recyclerEarnings,
            platform_fee: platformFee,
            eco_points_earned: totalEcoPoints,
            status: 'completed'
          },
          created_at: new Date().toISOString()
        });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Don't block the flow, just log the error
      }

      // Update local state
      if (paymentSummary) {
        paymentSummary.status = 'accepted';
        setPaymentSummary({ ...paymentSummary });
      }
      
      console.log('PaymentSummary: Payment accepted and pickup process completed successfully');
      
      // Navigate to payment made screen
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
    if (!selectedReason) {
      Alert.alert('Reason Required', 'Please select a reason for rejection.');
      return;
    }
    
    if (selectedReason === 'other' && !rejectionReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a detailed reason for rejection.');
      return;
    }
    
    if (rejectionReason.trim() && rejectionReason.trim().length < 10) {
      Alert.alert('Reason Too Short', 'Please provide a more detailed reason (at least 10 characters).');
      return;
    }

    setIsRejecting(true);
    
    try {
      // Update payment summary in database
      const { error: updateError } = await supabase
        .from('payment_summaries')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          selected_reason: selectedReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentSummary?.id);

      if (updateError) {
        console.error('Error updating payment summary:', updateError);
        Alert.alert('Error', 'Failed to reject payment. Please try again.');
        return;
      }

      // Create notification for recycler
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: paymentSummary?.recycler_id,
          type: 'payment_rejected',
          title: 'Payment Rejected',
          message: `Customer ${customerData?.name || 'Unknown'} has rejected your payment summary. Reason: ${selectedReason === 'other' ? rejectionReason : predefinedReasons.find(r => r.id === selectedReason)?.text}`,
          data: {
            payment_summary_id: paymentSummary?.id,
            request_id: paymentSummary?.requestId,
            customer_name: customerData?.name,
            rejection_reason: rejectionReason,
            selected_reason: selectedReason,
            can_edit: true
          },
          created_at: new Date().toISOString()
        });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Continue anyway as the rejection was saved
      }

      // Update local state
      if (paymentSummary) {
        paymentSummary.status = 'rejected';
        paymentSummary.rejectionReason = rejectionReason;
        paymentSummary.selectedReason = selectedReason;
        setPaymentSummary({ ...paymentSummary });
      }
      
      console.log('PaymentSummary: Payment rejected successfully and recycler notified');
      
      Alert.alert(
        'Payment Rejected',
        'Your payment rejection has been sent to the recycler. They will review your feedback and may send a revised payment summary.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowRejectionModal(false);
              setRejectionReason('');
              setSelectedReason('');
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
    setSelectedReason('');
  };

  // Handle predefined reason selection
  const handleReasonSelection = (reasonId: string) => {
    setSelectedReason(reasonId);
    const reason = predefinedReasons.find(r => r.id === reasonId);
    if (reason && reasonId !== 'other') {
      setRejectionReason(reason.description);
    } else if (reasonId === 'other') {
      setRejectionReason('');
    }
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
        <TouchableOpacity style={styles.retryButton} onPress={loadPaymentData}>
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
          <Text style={styles.noteText}>Your payment supports Ghana&apos;s environmental protection and recycling efforts.</Text>
          <Text style={styles.noteText}>Together, we&apos;re reducing pollution and creating a cleaner future</Text>
          <Text style={styles.noteText}>&quot;One Tap to a Greener Planet.&quot;</Text>
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


      {/* Rejection Reason Input */}
      {showRejectionModal && (
        <View style={styles.rejectionContainer}>
          <Text style={styles.rejectionTitle}>Why are you rejecting this payment?</Text>
          <Text style={styles.rejectionSubtitle}>
            Please provide a detailed reason so the recycler can understand and fix the issue.
          </Text>
          
          <View style={styles.rejectionExamples}>
            <Text style={styles.rejectionExamplesTitle}>Select a reason:</Text>
            {predefinedReasons.map((reason) => (
            <TouchableOpacity 
                key={reason.id}
                style={[
                  styles.rejectionExampleButton,
                  selectedReason === reason.id && styles.selectedReasonButton
                ]}
                onPress={() => handleReasonSelection(reason.id)}
            >
              <View style={styles.reasonContent}>
                <View style={styles.reasonHeader}>
                    <Text style={[
                      styles.rejectionExample,
                      selectedReason === reason.id && styles.selectedReasonText
                    ]}>
                      • {reason.text}
                  </Text>
                    {selectedReason === reason.id && (
                      <View style={styles.selectedIndicator}>
                        <Text style={styles.selectedIndicatorText}>✓</Text>
                      </View>
                    )}
                </View>
              </View>
            </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.selectedReasonContainer}>
            <Text style={styles.selectedReasonLabel}>
              {selectedReason === 'other' ? 'Please specify your reason:' : 'Additional Details (Optional):'}
            </Text>
            <TextInput
              style={styles.rejectionInput}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder={
                selectedReason === 'other' 
                  ? "Enter your detailed reason for rejection..." 
                  : "Add any additional details or clarifications..."
              }
              multiline
              numberOfLines={4}
              placeholderTextColor="#999"
              maxLength={500}
              editable={selectedReason !== ''}
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
                (!selectedReason || (selectedReason === 'other' && (!rejectionReason.trim() || rejectionReason.trim().length < 10))) && styles.disabledButton
              ]} 
              onPress={handleRejectPayment}
              disabled={!selectedReason || (selectedReason === 'other' && (!rejectionReason.trim() || rejectionReason.trim().length < 10)) || isRejecting}
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
    backgroundColor: '#1C3301',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  selectedIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
}); 