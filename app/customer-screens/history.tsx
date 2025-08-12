import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, DIMENSIONS, HISTORY_DATA } from '../../constants';
import { getStatusColor, getStatusText } from '../../constants/helpers';
import CommonHeader from '../components/CommonHeader';
import customerStats from '../utils/customerStats';

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
  wasteType?: string;
  totalAmount?: string;
}

export default function HistoryScreen() {
  const params = useLocalSearchParams();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'completed' | 'cancelled' | 'pending'>('all');
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);

  // Handle completed pickup from EcoImpactCelebration
  useEffect(() => {
    if (params.completedPickup === 'true') {
      const requestId = params.requestId as string;
      const recyclerName = params.recyclerName as string;
      const pickup = params.pickup as string;
      const weight = params.weight as string;
      const wasteType = params.wasteType as string;
      const amount = params.amount as string;
      const environmentalTax = params.environmentalTax as string;
      const totalAmount = params.totalAmount as string;

      // Add the new completed pickup to history
      const newPickup: HistoryItem = {
        id: requestId,
        date: new Date().toISOString().split('T')[0],
        recyclerName: recyclerName,
        pickupLocation: pickup,
        weight: weight,
        amount: `GHS ${amount}`,
        status: 'completed',
        recyclerImage: require('../../assets/images/blend.jpg'), // Use existing image
        wasteType: wasteType,
        totalAmount: `GHS ${totalAmount}`,
        environmentalTax: `GHS ${environmentalTax}`,
        pickupTime: new Date().toTimeString().split(' ')[0].substring(0, 5)
      };

      setHistoryData(prev => [newPickup, ...prev]);
    }
  }, [params.completedPickup, params.requestId, params.recyclerName, params.pickup, params.weight, params.wasteType, params.amount, params.environmentalTax, params.totalAmount]);

  // Initialize with mock data and customer stats
  useEffect(() => {
    customerStats.initializeMockData();
    
    // Combine mock data with customer stats data
    const customerHistory = customerStats.getPickupHistory();
    const enhancedHistory = customerHistory.map(pickup => ({
      id: pickup.id,
      date: pickup.date,
      recyclerName: pickup.recyclerName,
      pickupLocation: pickup.pickupLocation,
      weight: `${pickup.weight} kg`,
      amount: `GHS ${pickup.amount.toFixed(2)}`,
      status: pickup.status,
      recyclerImage: require('../../assets/images/blend.jpg'), // Use existing image
      wasteType: pickup.wasteType,
      totalAmount: `GHS ${pickup.totalAmount.toFixed(2)}`,
      environmentalTax: `GHS ${pickup.environmentalTax.toFixed(2)}`,
      pickupTime: pickup.time
    }));

    // Combine with existing mock data and remove duplicates
    const allHistory = [...enhancedHistory, ...HISTORY_DATA];
    const uniqueHistory = allHistory.filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id)
    );

    setHistoryData(uniqueHistory);
  }, []);

  const filteredHistory = historyData.filter(item => {
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
        wasteType: item.wasteType || '',
        totalAmount: item.totalAmount || '',
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
        {item.wasteType && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Waste Type:</Text>
            <Text style={styles.detailValue}>{item.wasteType}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Weight:</Text>
          <Text style={styles.detailValue}>{item.weight}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount:</Text>
          <Text style={[styles.detailValue, styles.amountText]}>{item.amount}</Text>
        </View>
        {item.totalAmount && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Amount:</Text>
            <Text style={[styles.detailValue, styles.totalAmountText]}>{item.totalAmount}</Text>
          </View>
        )}
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
        <Text style={styles.tapText}>Tap for details</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>No pickup history yet</Text>
      <Text style={styles.emptyStateSubtext}>Your completed pickups will appear here</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <CommonHeader />
      
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
          onPress={() => handleFilterPress('all')}
        >
          <Text style={[styles.filterButtonText, selectedFilter === 'all' && styles.filterButtonTextActive]}>
            All ({historyData.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === 'completed' && styles.filterButtonActive]}
          onPress={() => handleFilterPress('completed')}
        >
          <Text style={[styles.filterButtonText, selectedFilter === 'completed' && styles.filterButtonTextActive]}>
            Completed ({historyData.filter(item => item.status === 'completed').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === 'pending' && styles.filterButtonActive]}
          onPress={() => handleFilterPress('pending')}
        >
          <Text style={[styles.filterButtonText, selectedFilter === 'pending' && styles.filterButtonTextActive]}>
            Pending ({historyData.filter(item => item.status === 'pending').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === 'cancelled' && styles.filterButtonActive]}
          onPress={() => handleFilterPress('cancelled')}
        >
          <Text style={[styles.filterButtonText, selectedFilter === 'cancelled' && styles.filterButtonTextActive]}>
            Cancelled ({historyData.filter(item => item.status === 'cancelled').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* History List */}
      <FlatList
        data={filteredHistory}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.historyList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: DIMENSIONS.margin,
    paddingVertical: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  historyList: {
    paddingHorizontal: DIMENSIONS.margin,
    paddingBottom: 20,
  },
  historyItem: {
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.cardBorderRadius,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recyclerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recyclerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  recyclerDetails: {
    flex: 1,
  },
  recyclerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 4,
  },
  pickupLocation: {
    fontSize: 14,
    color: COLORS.gray,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  historyDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.darkGreen,
    fontWeight: '600',
  },
  amountText: {
    color: COLORS.primary,
  },
  totalAmountText: {
    color: COLORS.darkGreen,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  ratingLabel: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  star: {
    fontSize: 16,
  },
  starFilled: {
    color: '#FFD700',
  },
  starEmpty: {
    color: COLORS.lightGray,
  },
  tapIndicator: {
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  tapText: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    color: COLORS.gray,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.lightGray,
    textAlign: 'center',
  },
}); 