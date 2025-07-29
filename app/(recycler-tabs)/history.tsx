import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
import { COLORS } from '../../constants';

export default function RecyclerHistoryTab() {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const mockHistoryData = [
    {
      id: '1',
      date: '2024-01-15',
      customerName: 'Williams Boampong',
      pickupLocation: 'Accra Central',
      weight: '12.5 kg',
      amount: 'GHS 15.75',
      status: 'completed',
      rating: 5,
    },
    {
      id: '2',
      date: '2024-01-14',
      customerName: 'Sarah Wilson',
      pickupLocation: 'East Legon',
      weight: '8.2 kg',
      amount: 'GHS 9.43',
      status: 'completed',
      rating: 4,
    },
    {
      id: '3',
      date: '2024-01-13',
      customerName: 'Mike Johnson',
      pickupLocation: 'Osu',
      weight: '15.8 kg',
      amount: 'GHS 19.77',
      status: 'completed',
      rating: 5,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return COLORS.green;
      case 'cancelled': return COLORS.red;
      case 'pending': return '#FF9800';
      default: return COLORS.gray;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'pending': return 'Pending';
      default: return status;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <MaterialIcons
            key={star}
            name={star <= rating ? 'star' : 'star-border'}
            size={16}
            color={star <= rating ? '#FFD700' : COLORS.gray}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader onMenuPress={() => router.back()} />
      
      <View style={styles.content}>
        <Text style={styles.title}>Pickup History</Text>
        <Text style={styles.subtitle}>View your past pickups and earnings</Text>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'completed' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('completed')}
          >
            <Text style={[styles.filterText, selectedFilter === 'completed' && styles.filterTextActive]}>Completed</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'cancelled' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('cancelled')}
          >
            <Text style={[styles.filterText, selectedFilter === 'cancelled' && styles.filterTextActive]}>Cancelled</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Summary */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>156</Text>
            <Text style={styles.statLabel}>Total Pickups</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>₵1,234.50</Text>
            <Text style={styles.statLabel}>Total Earnings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>4.8</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
        </View>

        {/* History List */}
        <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
          {mockHistoryData.map((item) => (
            <TouchableOpacity key={item.id} style={styles.historyItem}>
              <View style={styles.historyHeader}>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{item.customerName}</Text>
                  <Text style={styles.pickupLocation}>{item.pickupLocation}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                </View>
              </View>
              
              <View style={styles.historyDetails}>
                <View style={styles.detailRow}>
                  <MaterialIcons name="event" size={16} color={COLORS.gray} />
                  <Text style={styles.detailText}>{item.date}</Text>
                </View>
                <View style={styles.detailRow}>
                  <FontAwesome5 name="weight-hanging" size={16} color={COLORS.gray} />
                  <Text style={styles.detailText}>{item.weight}</Text>
                </View>
                <View style={styles.detailRow}>
                  <MaterialIcons name="attach-money" size={16} color={COLORS.gray} />
                  <Text style={styles.detailText}>{item.amount}</Text>
                </View>
              </View>
              
              <View style={styles.ratingContainer}>
                {renderStars(item.rating)}
                <Text style={styles.ratingText}>{item.rating}/5</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.lightGreen,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.darkGreen,
  },
  filterText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  filterTextActive: {
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.lightGreen,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 4,
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E3E3E3',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  historyDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  ratingText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: 'bold',
  },
});