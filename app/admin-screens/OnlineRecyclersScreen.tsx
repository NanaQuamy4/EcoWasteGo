import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
import { COLORS } from '../../constants';
import { useAdminRecyclerMonitoring } from '../../hooks/useAdminRecyclerMonitoring';

interface RecyclerItemProps {
  recycler: {
    id: string;
    fullName: string;
    phone: string;
    email: string;
    truckSize: string;
    rating: number;
    verificationStatus: string;
    isAvailable: boolean;
    isOnline: boolean;
    lastSeenAt: string;
    heartbeatAt: string;
    statusCategory: string;
  };
  onForceOffline: (id: string) => void;
}

const RecyclerItem: React.FC<RecyclerItemProps> = ({ recycler, onForceOffline }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return COLORS.darkGreen;
      case 'Busy': return COLORS.orange;
      case 'Busy (5+ Requests)': return '#e74c3c';
      case 'Offline': return COLORS.gray;
      case 'Inactive': return '#ff6b6b';
      case 'Unverified': return '#9b59b6';
      default: return COLORS.gray;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Available': return 'check-circle';
      case 'Busy': return 'pause-circle';
      case 'Busy (5+ Requests)': return 'block';
      case 'Offline': return 'cancel';
      case 'Inactive': return 'warning';
      case 'Unverified': return 'help';
      default: return 'info';
    }
  };

  const formatLastSeen = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const handleForceOffline = () => {
    Alert.alert(
      'Force Offline',
      `Are you sure you want to force ${recycler.fullName} offline?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Force Offline', 
          style: 'destructive',
          onPress: () => onForceOffline(recycler.id)
        }
      ]
    );
  };

  return (
    <View style={styles.recyclerItem}>
      <View style={styles.recyclerHeader}>
        <View style={styles.recyclerInfo}>
          <Text style={styles.recyclerName}>{recycler.fullName}</Text>
          <Text style={styles.recyclerPhone}>{recycler.phone}</Text>
        </View>
        <View style={styles.statusContainer}>
          <MaterialIcons 
            name={getStatusIcon(recycler.statusCategory)} 
            size={20} 
            color={getStatusColor(recycler.statusCategory)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(recycler.statusCategory) }]}>
            {recycler.statusCategory}
          </Text>
        </View>
      </View>
      
      <View style={styles.recyclerDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Truck Size:</Text>
          <Text style={styles.detailValue}>{recycler.truckSize}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Rating:</Text>
          <Text style={styles.detailValue}>⭐ {recycler.rating.toFixed(1)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Verification:</Text>
          <Text style={[styles.detailValue, { 
            color: recycler.verificationStatus === 'approved' ? COLORS.darkGreen : COLORS.orange 
          }]}>
            {recycler.verificationStatus}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Last Seen:</Text>
          <Text style={styles.detailValue}>{formatLastSeen(recycler.lastSeenAt)}</Text>
        </View>
        {/* {recycler.pendingRequestsCount !== undefined && recycler.pendingRequestsCount > 0 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pending Requests:</Text>
            <Text style={[styles.detailValue, { color: recycler.pendingRequestsCount >= 5 ? '#e74c3c' : COLORS.orange }]}>
              {recycler.pendingRequestsCount}
            </Text>
          </View>
        )} */}
      </View>

      {recycler.isOnline && (
        <TouchableOpacity style={styles.forceOfflineButton} onPress={handleForceOffline}>
          <MaterialIcons name="power-off" size={16} color={COLORS.white} />
          <Text style={styles.forceOfflineText}>Force Offline</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default function OnlineRecyclersScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  
  const {
    recyclers,
    summary,
    loading,
    error,
    fetchAllRecyclers,
    forceRecyclerOffline
  } = useAdminRecyclerMonitoring();

  const filters = [
    { key: 'All', label: 'All', count: recyclers.length },
    { key: 'Available', label: 'Available', count: recyclers.filter(r => r.statusCategory === 'Available').length },
    { key: 'Busy', label: 'Busy', count: recyclers.filter(r => r.statusCategory === 'Busy' || r.statusCategory === 'Busy (5+ Requests)').length },
    { key: 'Offline', label: 'Offline', count: recyclers.filter(r => r.statusCategory === 'Offline').length },
    { key: 'Inactive', label: 'Inactive', count: recyclers.filter(r => r.statusCategory === 'Inactive').length },
    { key: 'Unverified', label: 'Unverified', count: recyclers.filter(r => r.statusCategory === 'Unverified').length }
  ];

  const filteredRecyclers = selectedFilter === 'All' 
    ? recyclers 
    : selectedFilter === 'Busy'
    ? recyclers.filter(recycler => recycler.statusCategory === 'Busy' || recycler.statusCategory === 'Busy (5+ Requests)')
    : recyclers.filter(recycler => recycler.statusCategory === selectedFilter);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllRecyclers();
    setRefreshing(false);
  };

  const handleForceOffline = async (recyclerId: string) => {
    try {
      await forceRecyclerOffline(recyclerId);
      Alert.alert('Success', 'Recycler has been forced offline');
    } catch (error) {
      Alert.alert('Error', 'Failed to force recycler offline');
    }
  };

  const renderFilterButton = (filter: { key: string; label: string; count: number }) => (
    <TouchableOpacity
      key={filter.key}
      style={[
        styles.filterButton,
        selectedFilter === filter.key && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(filter.key)}
    >
      <Text style={[
        styles.filterButtonText,
        selectedFilter === filter.key && styles.filterButtonTextActive
      ]}>
        {filter.label} ({filter.count})
      </Text>
    </TouchableOpacity>
  );

  const renderRecyclerItem = ({ item }: { item: any }) => (
    <RecyclerItem recycler={item} onForceOffline={handleForceOffline} />
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <AppHeader 
          leftIcon="arrow-left"
          onLeftPress={() => router.back()}
          hideRightIcon={true}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading recyclers...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader 
        leftIcon="arrow-left"
        onLeftPress={() => router.back()}
        hideRightIcon={true}
      />
      
      {/* Screen Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>Online Recyclers</Text>
      </View>
      
      {/* Summary Cards */}
      {summary && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{summary.onlineRecyclers}</Text>
            <Text style={styles.summaryLabel}>Online</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{summary.availableRecyclers}</Text>
            <Text style={styles.summaryLabel}>Available</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{summary.busyRecyclers}</Text>
            <Text style={styles.summaryLabel}>Busy</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{summary.offlineRecyclers}</Text>
            <Text style={styles.summaryLabel}>Offline</Text>
          </View>
        </View>
      )}

      {/* Filter Buttons */}
      <View style={styles.filtersContainer}>
        <FlatList
          data={filters}
          renderItem={({ item }) => renderFilterButton(item)}
          keyExtractor={(item) => item.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        />
      </View>

      {/* Recyclers List */}
      <FlatList
        data={filteredRecyclers}
        renderItem={renderRecyclerItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="recycling" size={64} color={COLORS.gray} />
            <Text style={styles.emptyText}>No recyclers found</Text>
            <Text style={styles.emptySubtext}>
              {selectedFilter === 'All' 
                ? 'No recyclers are registered yet'
                : `No recyclers with status: ${selectedFilter}`
              }
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  titleContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.gray,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    marginBottom: 8,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  filtersContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    marginBottom: 8,
  },
  filtersList: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: COLORS.darkGreen,
  },
  filterButtonText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  listContainer: {
    padding: 16,
  },
  recyclerItem: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recyclerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recyclerInfo: {
    flex: 1,
  },
  recyclerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 4,
  },
  recyclerPhone: {
    fontSize: 14,
    color: COLORS.gray,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  recyclerDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.darkGreen,
    fontWeight: '500',
  },
  forceOfflineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.orange,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  forceOfflineText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.gray,
    marginTop: 16,
    fontWeight: 'bold',
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 8,
    textAlign: 'center',
  },
});