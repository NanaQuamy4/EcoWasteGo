import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants';
import CommonHeader from './components/CommonHeader';

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
  const recyclerName = params.recyclerName as string;
  const pickup = params.pickup as string;

  // Payment data
  const paymentData: PaymentData = {
    recycler: recyclerName || 'GreenFleet GH',
    pickupDate: 'June 26, 2025',
    weight: '10 kg',
    rate: 'GHS 1.20/kg',
    environmentalTax: 'GHS 0.60',
    totalDue: 'GHS 12.60',
  };

  const handleAccept = () => {
    Alert.alert(
      'Payment Accepted',
      'Your payment has been processed successfully. Thank you for supporting environmental protection!',
      [
        {
          text: 'OK',
          onPress: () => {
            // Navigate to PaymentMade screen
            router.push({
              pathname: '/PaymentMade',
              params: { recyclerName: recyclerName, pickup: pickup }
            });
          }
        }
      ]
    );
  };

  const handleReject = () => {
    Alert.alert(
      'Payment Rejected',
      'Are you sure you want to reject this payment? A notification will be sent to the recycler to review their payment inputs (e.g., weight calculations) for potential errors.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Notification Sent',
              'A notification has been sent to the recycler to review the payment details. They will check for any input errors (like weight calculations) and send you a corrected payment summary.',
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
          }
        }
      ]
    );
  };

  const handleCalculate = () => {
    // Recalculate payment (in real app, this would trigger recalculation)
    Alert.alert(
      'Payment Calculated',
      'Payment has been recalculated based on the current details.',
      [{ text: 'OK' }]
    );
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
              <Text style={styles.detailLabel}>Rate</Text>
              <View style={styles.detailValue}>
                <Text style={styles.valueText}>{paymentData.rate}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Environmental Excise Tax (5%)</Text>
              <View style={styles.detailValue}>
                <Text style={styles.valueText}>{paymentData.environmentalTax}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.calculateButton} onPress={handleCalculate}>
            <Text style={styles.calculateButtonText}>Calculate</Text>
          </TouchableOpacity>
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
        <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
          <Text style={styles.rejectButtonText}>REJECT</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
          <Text style={styles.acceptButtonText}>ACCEPT</Text>
        </TouchableOpacity>
      </View>
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
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  calculateButton: {
    backgroundColor: COLORS.darkGreen,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
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
}); 