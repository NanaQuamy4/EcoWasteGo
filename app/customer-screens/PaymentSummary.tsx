import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../constants';
import { apiService } from '../../services/apiService';
import CommonHeader from '../components/CommonHeader';

interface PaymentData {
  recycler: string;
  pickupDate: string;
  weight: string;
  rate: string;
  environmentalTax: string;
  totalDue: string;
}

export default function PaymentSummary() {
  const params = useLocalSearchParams();
  const requestId = params.requestId as string;
  const recyclerId = params.recyclerId as string;
  const recyclerName = params.recyclerName as string;
  const pickup = params.pickup as string;
  const paymentSummaryId = params.paymentSummaryId as string;
  const weight = params.weight as string;
  const wasteType = params.wasteType as string;
  const rate = params.rate as string;
  const subtotal = params.subtotal as string;
  const environmentalTax = params.environmentalTax as string;
  const totalAmount = params.totalAmount as string;

  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedReasonType, setSelectedReasonType] = useState<string>('');

  // Common rejection reasons
  const commonRejectionReasons = [
    {
      id: 'weight_incorrect',
      label: 'Weight seems incorrect',
      description: 'The weight amount doesn\'t match what I provided'
    },
    {
      id: 'rate_error',
      label: 'Rate calculation error',
      description: 'The rate per kg seems too high or incorrect'
    },
    {
      id: 'waste_type_mismatch',
      label: 'Waste type mismatch',
      description: 'The waste type doesn\'t match what I gave you'
    },
    {
      id: 'total_mismatch',
      label: 'Total amount doesn\'t match',
      description: 'The final total seems wrong or doesn\'t add up'
    },
    {
      id: 'tax_calculation',
      label: 'Environmental tax calculation error',
      description: 'The 5% tax calculation seems incorrect'
    },
    {
      id: 'subtotal_error',
      label: 'Subtotal calculation error',
      description: 'The base amount before tax seems wrong'
    },
    {
      id: 'other',
      label: 'Other reason',
      description: 'None of the above - I\'ll specify my reason'
    }
  ];

  // Handle reason selection
  const handleReasonSelection = (reasonId: string) => {
    setSelectedReasonType(reasonId);
    
    if (reasonId === 'other') {
      setRejectionReason('');
    } else {
      const selectedReason = commonRejectionReasons.find(r => r.id === reasonId);
      setRejectionReason(selectedReason?.label || '');
    }
  };

  // Payment data - now comes from the recycler's actual calculation
  const paymentData: PaymentData = {
    recycler: recyclerName || 'John Doe',
    pickupDate: new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    weight: weight || '8.5 kg',
    rate: rate || 'GHS 1.50/kg',
    environmentalTax: environmentalTax || 'GHS 0.64',
    totalDue: totalAmount || 'GHS 13.39',
  };

  const handleAccept = async () => {
    try {
      setIsProcessing(true);
      
      const response = await apiService.acceptPaymentSummary(paymentSummaryId);
      
      if (response) {
        Alert.alert(
          'Payment Accepted',
          'Your payment has been processed successfully. Thank you for supporting environmental protection!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to PaymentMade screen
                router.push({
                  pathname: '/customer-screens/PaymentMade' as any,
                  params: { 
                    recyclerId: recyclerId,
                    recyclerName: recyclerName, 
                    pickup: pickup,
                    requestId: requestId,
                    weight: weight,
                    wasteType: wasteType,
                    amount: subtotal,
                    environmentalTax: environmentalTax,
                    totalAmount: totalAmount
                  }
                });
              }
            }
          ]
        );
      } else {
        throw new Error('Failed to accept payment');
      }
    } catch (error) {
      console.error('Error accepting payment:', error);
      Alert.alert(
        'Error',
        'Failed to accept payment. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = () => {
    if (!selectedReasonType) {
      Alert.alert('Reason Required', 'Please select a reason for rejecting this payment summary.');
      return;
    }

    if (!rejectionReason.trim()) {
      Alert.alert('Reason Details Required', 'Please provide details for your rejection reason.');
      return;
    }

    if (rejectionReason.trim().length < 10) {
      Alert.alert(
        'Detailed Reason Required', 
        'Please provide a more detailed reason (at least 10 characters) so the recycler can understand and fix the issue properly.'
      );
      return;
    }

    Alert.alert(
      'Payment Rejected',
      'Are you sure you want to reject this payment summary? A detailed notification with your reason will be sent to the recycler to review and fix the issue.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsProcessing(true);
              
              const response = await apiService.rejectPaymentSummary(paymentSummaryId, rejectionReason);
              
              if (response) {
                Alert.alert(
                  'Notification Sent',
                  `Your rejection has been sent to the recycler with the reason: "${rejectionReason.substring(0, 50)}${rejectionReason.length > 50 ? '...' : ''}"\n\nThey will review your feedback and send you a corrected payment summary.`,
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        // Navigate back to tracking screen to wait for corrected payment
                        router.back();
                      }
                    }
                  ]
                );
              } else {
                throw new Error('Failed to reject payment');
              }
            } catch (error) {
              console.error('Error rejecting payment:', error);
              Alert.alert(
                'Error',
                'Failed to reject payment. Please try again.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  const toggleRejectionInput = () => {
    if (showRejectionInput) {
      // Reset when closing
      setShowRejectionInput(false);
      setSelectedReasonType('');
      setRejectionReason('');
    } else {
      // Open rejection input
      setShowRejectionInput(true);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <CommonHeader />

      {/* Payment Due Banner */}
      <View style={styles.paymentDueBanner}>
        <Text style={styles.paymentDueText}>Payment Due</Text>
      </View>

      {/* Summary Section */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Summary</Text>
          
          <View style={styles.paymentDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Recycler</Text>
              <View style={styles.detailValue}>
                <Text style={styles.valueText}>{paymentData.recycler}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pickup Date:</Text>
              <View style={styles.detailValue}>
                <Text style={styles.valueText}>{paymentData.pickupDate}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Weight</Text>
              <View style={styles.detailValue}>
                <Text style={styles.valueText}>{paymentData.weight}</Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Waste Type</Text>
              <View style={styles.detailValue}>
                <Text style={styles.valueText}>{wasteType || 'Mixed Waste'}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Rate</Text>
              <View style={styles.detailValue}>
                <Text style={styles.valueText}>{paymentData.rate}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Subtotal</Text>
              <View style={styles.detailValue}>
                <Text style={styles.valueText}>{subtotal || 'GHS 0.00'}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Environmental Excise Tax (5%)</Text>
              <View style={styles.detailValue}>
                <Text style={styles.valueText}>{paymentData.environmentalTax}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, styles.boldLabel]}>Total Due</Text>
              <View style={styles.detailValue}>
                <Text style={[styles.valueText, styles.totalText]}>{paymentData.totalDue}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Note Section */}
        <View style={styles.noteSection}>
          <Text style={styles.noteTitle}>Note:</Text>
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
          onPress={toggleRejectionInput}
          disabled={isProcessing}
        >
          <Text style={styles.rejectButtonText}>
            {isProcessing ? 'Processing...' : 'REJECT'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.acceptButton} 
          onPress={handleAccept}
          disabled={isProcessing}
        >
          <Text style={styles.acceptButtonText}>
            {isProcessing ? 'Processing...' : 'ACCEPT'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Rejection Reason Input */}
      {showRejectionInput && (
        <View style={styles.rejectionContainer}>
          <Text style={styles.rejectionTitle}>Why are you rejecting this payment?</Text>
          <Text style={styles.rejectionSubtitle}>
            Please provide a detailed reason so the recycler can understand and fix the issue.
          </Text>
          
          <View style={styles.rejectionExamples}>
            <Text style={styles.rejectionExamplesTitle}>Select a reason:</Text>
            {commonRejectionReasons.map((reason) => (
              <TouchableOpacity 
                key={reason.id}
                style={[
                  styles.rejectionExampleButton, 
                  selectedReasonType === reason.id && styles.selectedReasonButton
                ]} 
                onPress={() => handleReasonSelection(reason.id)}
              >
                <View style={styles.reasonContent}>
                  <View style={styles.reasonHeader}>
                    <Text style={[
                      styles.rejectionExample,
                      selectedReasonType === reason.id && styles.selectedReasonText
                    ]}>
                      • {reason.label}
                    </Text>
                    {selectedReasonType === reason.id && (
                      <Text style={styles.selectedIndicator}>✓</Text>
                    )}
                  </View>
                  {selectedReasonType === reason.id && reason.id !== 'other' && (
                    <Text style={styles.rejectionDescription}>{reason.description}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Show selected reason or custom input */}
          {selectedReasonType && (
            <View style={styles.selectedReasonContainer}>
              <Text style={styles.selectedReasonLabel}>
                {selectedReasonType === 'other' ? 'Custom Reason:' : 'Selected Reason:'}
              </Text>
              <TextInput
                style={styles.rejectionInput}
                value={rejectionReason}
                onChangeText={setRejectionReason}
                placeholder={
                  selectedReasonType === 'other' 
                    ? "Enter your detailed reason for rejection..." 
                    : "You can modify this reason if needed..."
                }
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
          )}
          
          <View style={styles.rejectionActions}>
            <TouchableOpacity 
              style={styles.cancelRejectionButton} 
              onPress={toggleRejectionInput}
            >
              <Text style={styles.cancelRejectionButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.confirmRejectionButton, 
                (!selectedReasonType || !rejectionReason.trim() || rejectionReason.trim().length < 10) && styles.disabledButton
              ]} 
              onPress={handleReject}
              disabled={!selectedReasonType || !rejectionReason.trim() || rejectionReason.trim().length < 10 || isProcessing}
            >
              <Text style={styles.confirmRejectionButtonText}>
                {isProcessing ? 'Processing...' : 'Confirm Rejection'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FFF0',
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
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    textAlign: 'center',
    marginBottom: 16,
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
  noteTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#192E01',
    marginBottom: 8,
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
}); 