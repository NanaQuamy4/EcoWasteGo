import { router } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, DIMENSIONS, HISTORY_DATA } from '../../constants';
import { calculateTotalStats, getStatusColor, getStatusText } from '../../constants/helpers';
import CommonHeader from '../components/CommonHeader';

interface HistoryItem {
  id: string;
  date: string;
  recyclerName: string;
  pickupLocation: string;
  weight: string;
  amount: string;
  status: string;
  recyclerImage: any;
  rating?: number;
  recyclerPhone?: string;
  pickupTime?: string;
  environmentalTax?: string;
  notes?: string;
}

export default function HistoryScreen() {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'completed' | 'cancelled' | 'pending'>('all');

  const filteredHistory = HISTORY_DATA.filter(item => {
    if (selectedFilter === 'all') return true;
    return item.status === selectedFilter;
  });

  const handleFilterPress = (filter: 'all' | 'completed' | 'cancelled' | 'pending') => {
    setSelectedFilter(filter);
  };

  const handleHistoryItemPress = (item: HistoryItem) => {
    // Navigate to detailed view with item data
    router.push({
              pathname: '/customer-screens/HistoryDetail' as any,
      params: {
        id: item.id,
        date: item.date,
        recyclerName: item.recyclerName,
        pickupLocation: item.pickupLocation,
        weight: item.weight,
        amount: item.amount,
        status: item.status,
        rating: item.rating?.toString() || '',
        recyclerPhone: item.recyclerPhone || '',
        pickupTime: item.pickupTime || '',
        environmentalTax: item.environmentalTax || '',
        notes: item.notes || '',
      }
    });
  };

  const renderHistoryItem = ({ item }: { item: HistoryItem }) => (
    <TouchableOpacity style={styles.historyItem} onPress={() => handleHistoryItemPress(item)}>
      <View style={styles.historyHeader}>
        <View style={styles.recyclerInfo}>
          <Image source={item.recyclerImage} style={styles.recyclerImage} />
          <View style={styles.recyclerDetails}>
            <Text style={styles.recyclerName}>{item.recyclerName}</Text>
            <Text style={styles.pickupLocation}>{item.pickupLocation}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.historyDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date:</Text>
          <Text style={styles.detailValue}>{item.date}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Weight:</Text>
          <Text style={styles.detailValue}>{item.weight}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount:</Text>
          <Text style={[styles.detailValue, styles.amountText]}>{item.amount}</Text>
        </View>
        {item.rating && (
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>Rating:</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Text key={star} style={[styles.star, star <= item.rating! ? styles.starFilled : styles.starEmpty]}>
                  ★
                </Text>
              ))}
            </View>
          </View>
        )}
      </View>
      
      {/* Tap indicator */}
      <View style={styles.tapIndicator}>
        <Text style={styles.tapText}>Tap to view details</Text>
        <Text style={styles.tapArrow}>→</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📋</Text>
      <Text style={styles.emptyStateTitle}>No History Yet</Text>
      <Text style={styles.emptyStateText}>
        Your pickup history will appear here once you complete your first waste pickup.
      </Text>
    </View>
  );

  const totalStats = calculateTotalStats(HISTORY_DATA);

  return (
    <SafeAreaView style={styles.container}>
      <CommonHeader title="Pickup History" subtitle="Track your environmental impact" />

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
          onPress={() => handleFilterPress('all')}
        >
          <Text style={[styles.filterButtonText, selectedFilter === 'all' && styles.filterButtonTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, selectedFilter === 'completed' && styles.filterButtonActive]}
          onPress={() => handleFilterPress('completed')}
        >
          <Text style={[styles.filterButtonText, selectedFilter === 'completed' && styles.filterButtonTextActive]}>
            Completed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, selectedFilter === 'pending' && styles.filterButtonActive]}
          onPress={() => handleFilterPress('pending')}
        >
          <Text style={[styles.filterButtonText, selectedFilter === 'pending' && styles.filterButtonTextActive]}>
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, selectedFilter === 'cancelled' && styles.filterButtonActive]}
          onPress={() => handleFilterPress('cancelled')}
        >
          <Text style={[styles.filterButtonText, selectedFilter === 'cancelled' && styles.filterButtonTextActive]}>
            Cancelled
          </Text>
        </TouchableOpacity>
      </View>

      {/* Statistics Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalStats.totalPickups}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalStats.totalWeight}</Text>
          <Text style={styles.statLabel}>Total Waste</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalStats.totalAmount}</Text>
          <Text style={styles.statLabel}>Total Earned</Text>
        </View>
      </View>

      {/* History List */}
      <FlatList
        data={filteredHistory}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        style={styles.historyList}
        contentContainerStyle={styles.historyListContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: DIMENSIONS.margin,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E3E3E3',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.secondary,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.gray,
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    margin: DIMENSIONS.margin,
    borderRadius: DIMENSIONS.borderRadius,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E3E3E3',
    marginHorizontal: 8,
  },
  historyList: {
    flex: 1,
  },
  historyListContent: {
    padding: DIMENSIONS.margin,
  },
  historyItem: {
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.borderRadius,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recyclerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recyclerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  recyclerDetails: {
    flex: 1,
  },
  recyclerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 2,
  },
  pickupLocation: {
    fontSize: 12,
    color: COLORS.gray,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  historyDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.darkGreen,
    fontWeight: '500',
  },
  amountText: {
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingLabel: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
    marginRight: 8,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 16,
    marginRight: 2,
  },
  starFilled: {
    color: '#FFD700',
  },
  starEmpty: {
    color: '#E3E3E3',
  },
  tapIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  tapText: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  tapArrow: {
    fontSize: 16,
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
}); 