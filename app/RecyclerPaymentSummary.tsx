import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants';
import CommonHeader from './components/CommonHeader';

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

  const handleSendToUser = () => {
    Alert.alert(
      'Send Payment Summary',
      'Are you sure you want to send this payment summary to the user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: () => {
            Alert.alert(
              'Payment Summary Sent',
              'The payment summary has been sent to the user. They will receive a notification to review and accept/reject the payment.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    // Navigate back to requests screen
                    router.push('/RecyclerRequests');
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
    // Go back to weight entry to edit
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <CommonHeader />

      {/* Header Section */}
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>Payment Summary</Text>
        <Text style={styles.headerSubtitle}>Review bill for {userName}</Text>
      </View>

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
          <Text style={styles.noteText}>This bill includes a 5% Environmental Excise Tax as required by Ghana's environmental protection regulations.</Text>
          <Text style={styles.noteText}>The user will receive this payment summary and can accept or reject the payment.</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
          <Text style={styles.editButtonText}>EDIT</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sendButton} onPress={handleSendToUser}>
          <Text style={styles.sendButtonText}>SEND TO USER</Text>
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
  summaryContainer: {
    paddingHorizontal: 20,
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 20,
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
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 