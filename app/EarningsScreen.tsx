import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS } from '../constants';
import recyclerStats from './utils/recyclerStats';

export default function EarningsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  // Get real payment history from recyclerStats
  const paymentHistory = recyclerStats.getPaymentHistory();

  // Get real earnings statistics from recyclerStats
  const earningsStats = recyclerStats.getEarningsStats();

  const renderEarningsCard = (title: string, amount: number, subtitle: string, icon: React.ReactNode, color: string) => (
    <View style={[styles.earningsCard, { borderLeftColor: color }]}>
      <View style={styles.earningsHeader}>
        {icon}
        <Text style={styles.earningsTitle}>{title}</Text>
      </View>
      <Text style={[styles.earningsAmount, { color }]}>GHS {amount.toFixed(2)}</Text>
      <Text style={styles.earningsSubtitle}>{subtitle}</Text>
    </View>
  );

  const renderPaymentItem = (payment: any) => (
    <View key={payment.id} style={styles.paymentItem}>
      <View style={styles.paymentHeader}>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentId}>{payment.pickupId}</Text>
          <Text style={styles.paymentCustomer}>{payment.customer}</Text>
          <Text style={styles.paymentDate}>{payment.date} • {payment.time}</Text>
        </View>
        <View style={styles.paymentAmount}>
          <Text style={styles.amountText}>GHS {payment.amount.toFixed(2)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: COLORS.green }]}>
            <Text style={styles.statusText}>{payment.status}</Text>
          </View>
        </View>
      </View>
      <View style={styles.paymentDetails}>
        <View style={styles.detailItem}>
          <MaterialIcons name="category" size={16} color={COLORS.gray} />
          <Text style={styles.detailText}>{payment.wasteType}</Text>
        </View>
        <View style={styles.detailItem}>
          <MaterialIcons name="scale" size={16} color={COLORS.gray} />
          <Text style={styles.detailText}>{payment.weight}</Text>
        </View>
      </View>
    </View>
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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

        {/* Total Earnings Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome5 name="dollar-sign" size={24} color={COLORS.darkGreen} />
            <Text style={styles.sectionTitle}>Total Earnings</Text>
          </View>
          
          <View style={styles.totalEarningsCard}>
            <Text style={styles.totalAmount}>GHS {earningsStats.totalEarnings.toFixed(2)}</Text>
            <Text style={styles.totalLabel}>Total Earnings</Text>
            <View style={styles.earningsBreakdown}>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Today</Text>
                <Text style={styles.breakdownValue}>GHS {earningsStats.todayEarnings.toFixed(2)}</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Yesterday</Text>
                <Text style={styles.breakdownValue}>GHS {earningsStats.yesterdayEarnings.toFixed(2)}</Text>
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
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
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
    fontSize: 12,
    color: COLORS.black,
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 10,
    color: COLORS.gray,
  },
  paymentAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
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
}); 