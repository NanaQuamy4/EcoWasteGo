import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
import { COLORS } from '../../constants';
import recyclerStats from '../../utils/recyclerStats';

export default function SubscriptionScreen() {
  const [isProcessing, setIsProcessing] = useState(false);

  const weeklySummary = recyclerStats.getWeeklySummary();
  const isPaymentRequired = recyclerStats.isPaymentRequired();

  const handlePayFees = () => {
    if (!isPaymentRequired) {
      Alert.alert('No Payment Required', 'You have no outstanding subscription fees.');
      return;
    }

    Alert.alert(
      'Pay Subscription Fees',
      `Pay GHS ${weeklySummary.fees.toFixed(2)} to EcoWasteGo?\n\nThis will clear your weekly subscription fees.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay Now',
          onPress: () => {
            setIsProcessing(true);
            // Simulate payment processing
            setTimeout(() => {
              recyclerStats.paySubscriptionFees();
              setIsProcessing(false);
              Alert.alert(
                'Payment Successful!',
                'Your subscription fees have been paid. You can continue using the app.',
                [{ text: 'OK', onPress: () => router.back() }]
              );
            }, 2000);
          }
        }
      ]
    );
  };

  const handleTestAddFees = () => {
    recyclerStats.addCompletedPickup('test-1', 25.00, {
      customer: 'Test User 1',
      wasteType: 'Plastic',
      weight: '12kg'
    });
    recyclerStats.addCompletedPickup('test-2', 30.00, {
      customer: 'Test User 2',
      wasteType: 'Paper',
      weight: '15kg'
    });
    Alert.alert('Test Fees Added', 'Added test fees for testing. Refresh the screen to see changes.');
  };

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
            color={isPaymentRequired ? COLORS.red : COLORS.green} 
          />
          <View style={styles.statusContent}>
            <Text style={[styles.statusText, isPaymentRequired ? styles.statusTextRequired : styles.statusTextPaid]}>
              {isPaymentRequired ? 'Payment Required' : 'All Fees Paid'}
            </Text>
            <Text style={styles.statusDescription}>
              {isPaymentRequired 
                ? 'You have outstanding subscription fees that must be paid before continuing.'
                : 'You have no outstanding fees for this week.'
              }
            </Text>
          </View>
        </View>

        {/* Weekly Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>This Week&apos;s Summary</Text>
          
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <MaterialIcons name="local-shipping" size={20} color={COLORS.darkGreen} style={styles.summaryIcon} />
              <Text style={styles.summaryLabel}>Total Pickups</Text>
              <Text style={styles.summaryValue}>{weeklySummary.pickups}</Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialIcons name="attach-money" size={20} color={COLORS.darkGreen} style={styles.summaryIcon} />
              <Text style={styles.summaryLabel}>Total Earnings</Text>
              <Text style={styles.summaryValue}>GHS {(weeklySummary.fees * 10).toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <MaterialIcons name="account-balance" size={20} color="#E65100" style={styles.summaryIcon} />
              <Text style={styles.summaryLabel}>Subscription Fee (10%)</Text>
              <Text style={[styles.summaryValue, styles.feeAmount]}>
                {recyclerStats.getSubscriptionFeeString()}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialIcons name="trending-up" size={20} color={COLORS.darkGreen} style={styles.summaryIcon} />
              <Text style={styles.summaryLabel}>Avg Fee per Pickup</Text>
              <Text style={styles.summaryValue}>GHS {weeklySummary.avgFee.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Payment Button */}
        <TouchableOpacity 
          style={[styles.payButton, isPaymentRequired ? styles.payButtonRequired : styles.payButtonDisabled]}
          onPress={handlePayFees}
          disabled={!isPaymentRequired || isProcessing}
        >
          <MaterialIcons 
            name="payment" 
            size={24} 
            color={isPaymentRequired ? '#fff' : COLORS.gray} 
          />
          <Text style={[styles.payButtonText, isPaymentRequired ? styles.payButtonTextRequired : styles.payButtonTextDisabled]}>
            {isProcessing ? 'Processing...' : isPaymentRequired ? 'Pay Subscription Fees' : 'No Payment Required'}
          </Text>
        </TouchableOpacity>

        {/* Information */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How It Works</Text>
          <View style={styles.infoItem}>
            <MaterialIcons name="info" size={16} color={COLORS.darkGreen} />
            <Text style={styles.infoText}>10% commission is charged on every pickup</Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons name="schedule" size={16} color={COLORS.darkGreen} />
            <Text style={styles.infoText}>Fees accumulate weekly and must be paid</Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons name="block" size={16} color={COLORS.darkGreen} />
            <Text style={styles.infoText}>App access is blocked until fees are paid</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FFF0',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 20,
  },
  headerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginTop: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  paymentRequired: {
    backgroundColor: '#FFF8E1',
    borderWidth: 2,
    borderColor: '#FFB74D',
  },
  noPayment: {
    backgroundColor: '#E8F5E8',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  statusContent: {
    marginLeft: 15,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusTextRequired: {
    color: '#E65100',
  },
  statusTextPaid: {
    color: '#2E7D32',
  },
  statusDescription: {
    fontSize: 15,
    color: COLORS.gray,
    marginTop: 6,
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 20,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    textAlign: 'center',
  },
  feeAmount: {
    color: '#E65100',
    fontSize: 20,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  payButtonRequired: {
    backgroundColor: COLORS.darkGreen,
    borderWidth: 2,
    borderColor: '#2E7D32',
  },
  payButtonDisabled: {
    backgroundColor: '#E0E0E0',
    borderWidth: 2,
    borderColor: '#BDBDBD',
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  payButtonTextRequired: {
    color: '#FFFFFF',
  },
  payButtonTextDisabled: {
    color: '#757575',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 16,
    textAlign: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  infoText: {
    fontSize: 15,
    color: COLORS.gray,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  summaryIcon: {
    marginBottom: 8,
  },
}); 