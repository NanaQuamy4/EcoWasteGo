import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants';
import CommonHeader from './components/CommonHeader';
import recyclerStats from './utils/recyclerStats';

export default function RecyclerPaymentSummary() {
  const params = useLocalSearchParams();
  const userName = params.userName as string;
  const pickup = params.pickup as string;
  const weight = params.weight as string;
  const wasteType = params.wasteType as string;
  const rate = params.rate as string;
  const subtotal = params.subtotal as string;
  const environmentalTax = params.environmentalTax as string;
  const totalAmount = params.totalAmount as string;

  // State to track payment status
  const [paymentSent, setPaymentSent] = useState(false);
  const [paymentAccepted, setPaymentAccepted] = useState(false);

  const handleSendToUser = () => {
    Alert.alert(
      'Send Payment Summary',
      'Are you sure you want to send this payment summary to the user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: () => {
            setPaymentSent(true);
            Alert.alert(
              'Payment Summary Sent',
              'The payment summary has been sent to the user. They will receive a notification to review and accept/reject the payment.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    // Simulate user response after 3 seconds
                    setTimeout(() => {
                      simulateUserResponse();
                    }, 3000);
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const simulateUserResponse = () => {
    // Simulate user accepting the payment (in real app, this would come from backend)
    Alert.alert(
      'User Response',
      'The user has accepted your payment summary! You can now mark payment as received.',
      [
        {
          text: 'OK',
          onPress: () => {
            setPaymentAccepted(true);
          }
        }
      ]
    );
  };

  const handlePaymentReceived = () => {
    if (!paymentSent) {
      Alert.alert(
        'Payment Not Sent',
        'Please send the payment summary to the user first.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!paymentAccepted) {
      Alert.alert(
        'Payment Not Accepted',
        'The user has not accepted the payment summary yet. Please wait for their response.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Payment Received',
      'Confirm that you have received the payment from the user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            // Calculate earnings from total amount
            const earnings = parseFloat(totalAmount.replace('GHS ', '').replace(',', ''));
            
            // Add completed pickup to recyclerStats with payment data
            recyclerStats.addCompletedPickup('1', earnings, {
              customer: userName,
              wasteType: wasteType,
              weight: weight
            });
            
            // Mark request as completed and navigate to requests
            Alert.alert(
              'Request Completed',
              'Payment received! This request has been marked as completed.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    // Navigate to celebration screen with pickup information
                    router.push({
                      pathname: '/RecyclerCelebration',
                      params: {
                        pickupId: '1', // This would be the actual pickup ID
                        userName: userName,
                        pickup: pickup,
                        wasteType: wasteType,
                        totalAmount: totalAmount,
                        weight: weight,
                        rate: rate,
                        subtotal: subtotal,
                        environmentalTax: environmentalTax
                      }
                    });
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const handleEdit = () => {
    // Reset payment status when editing
    setPaymentSent(false);
    setPaymentAccepted(false);
    // Go back to weight entry to edit
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <CommonHeader />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Payment Summary</Text>
          <Text style={styles.headerSubtitle}>Review bill for {userName}</Text>
        </View>

        {/* Payment Status Indicator */}
        {paymentSent && (
          <View style={styles.statusContainer}>
            <View style={[styles.statusCard, paymentAccepted ? styles.acceptedStatus : styles.pendingStatus]}>
              <Text style={styles.statusTitle}>
                {paymentAccepted ? '✅ Payment Accepted' : '⏳ Awaiting User Response'}
              </Text>
              <Text style={styles.statusText}>
                Payment Status: {paymentSent ? (paymentAccepted ? 'Accepted' : 'Sent') : 'Not Sent'}
              </Text>
              <Text style={styles.statusSubtext}>
                {paymentSent ? (paymentAccepted ? 'User has accepted the payment summary' : 'Waiting for user&apos;s response') : 'Payment summary not sent yet'}
              </Text>
            </View>
          </View>
        )}

        {/* Summary Card */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Bill Details</Text>
            
            <View style={styles.billDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>User</Text>
                <View style={styles.detailValue}>
                  <Text style={styles.valueText}>{userName}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Pickup Location</Text>
                <View style={styles.detailValue}>
                  <Text style={styles.valueText}>{pickup}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Waste Type</Text>
                <View style={styles.detailValue}>
                  <Text style={styles.valueText}>{wasteType}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Weight</Text>
                <View style={styles.detailValue}>
                  <Text style={styles.valueText}>{weight} kg</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Rate</Text>
                <View style={styles.detailValue}>
                  <Text style={styles.valueText}>GHS {rate}/kg</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Subtotal</Text>
                <View style={styles.detailValue}>
                  <Text style={styles.valueText}>GHS {subtotal}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Environmental Tax (5%)</Text>
                <View style={styles.detailValue}>
                  <Text style={styles.valueText}>GHS {environmentalTax}</Text>
                </View>
              </View>

              <View style={[styles.detailRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <View style={styles.totalValue}>
                  <Text style={styles.totalText}>GHS {totalAmount}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Note Section */}
          <View style={styles.noteSection}>
            <Text style={styles.noteTitle}>Note:</Text>
            <Text style={styles.noteText}>This bill includes a 5% Environmental Excise Tax as required by Ghana&apos;s environmental protection regulations.</Text>
            <Text style={styles.noteText}>The user will receive this payment summary and can accept or reject the payment.</Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Buttons */}
      <View style={styles.bottomButtonsContainer}>
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Text style={styles.editButtonText}>EDIT</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sendButton, paymentSent && styles.disabledButton]} 
            onPress={handleSendToUser}
            disabled={paymentSent}
          >
            <Text style={styles.sendButtonText}>
              {paymentSent ? 'SENT TO USER' : 'SEND TO USER'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Payment Received Button */}
        <View style={styles.paymentReceivedContainer}>
          <TouchableOpacity 
            style={[
              styles.paymentReceivedButton, 
              (!paymentSent || !paymentAccepted) && styles.disabledPaymentButton
            ]} 
            onPress={handlePaymentReceived}
            disabled={!paymentSent || !paymentAccepted}
          >
            <Text style={[
              styles.paymentReceivedButtonText,
              (!paymentSent || !paymentAccepted) && styles.disabledPaymentButtonText
            ]}>
              💰 PAYMENT RECEIVED
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
}); 