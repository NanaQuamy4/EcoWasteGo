import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppHeader from '../components/AppHeader';
import { COLORS } from '../constants';
import recyclerStats from './utils/recyclerStats';

export default function RecyclerRequests() {
  const params = useLocalSearchParams();
  const [notificationCount, setNotificationCount] = useState(2);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [acceptedRequests, setAcceptedRequests] = useState<Set<string>>(new Set());
  const [completedRequests, setCompletedRequests] = useState<Set<string>>(new Set());

  // Initialize mock data on component mount (only once)
  useEffect(() => {
    // Always initialize mock data to ensure it's available
    recyclerStats.initializeMockData();
    
    // Sync accepted requests with shared stats
    setAcceptedRequests(new Set(['5', '6'])); // IDs 5 and 6 are active in shared stats
  }, []);

  // Mock pickup requests data
  const pickupRequests = [
    {
      id: '1',
      userName: 'Michael Afia',
      location: 'Gold hostel - Komfo Anokye',
      phone: '0546732719',
      wasteType: 'Plastic',
      distance: '2.3 km',
      status: 'pending' // pending, active, completed
    },
    {
      id: '2',
      userName: 'Sarah Johnson',
      location: 'Kumasi Zoological Gardens',
      phone: '0541234567',
      wasteType: 'Paper',
      distance: '1.8 km',
      status: 'pending'
    },
    {
      id: '3',
      userName: 'David Wilson',
      location: 'KNUST Campus',
      phone: '0549876543',
      wasteType: 'Electronic',
      distance: '3.1 km',
      status: 'pending'
    },
    {
      id: '5',
      userName: 'James Brown',
      location: 'Adum Shopping Center',
      phone: '0547778888',
      wasteType: 'Metal',
      distance: '1.5 km',
      status: 'active'
    },
    {
      id: '6',
      userName: 'Lisa Anderson',
      location: 'KNUST Hospital',
      phone: '0549990000',
      wasteType: 'Plastic',
      distance: '2.7 km',
      status: 'active'
    }
  ];

  // Handle completed pickup from celebration screen
  useEffect(() => {
    if (params.completedPickup === 'true') {
      const pickupId = params.pickupId as string;
      const userName = params.userName as string;
      const location = params.location as string;
      const totalAmount = params.totalAmount as string;

      // Add to completed requests
      setCompletedRequests(prev => new Set([...prev, pickupId]));
      
      // Add to shared stats
      const earnings = parseFloat(totalAmount) || 0;
      recyclerStats.addCompletedPickup(pickupId, earnings);
      
      // Remove from accepted requests if it was there
      setAcceptedRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(pickupId);
        return newSet;
      });

      // Show completion message
      Alert.alert(
        'Pickup Completed!',
        `Successfully completed pickup for ${userName} at ${location}. Payment received: GHS ${totalAmount}`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Switch to completed filter to show the completed pickup
              setSelectedFilter('completed');
            }
          }
        ]
      );
    }
  }, [params.completedPickup, params.pickupId, params.userName, params.location, params.totalAmount]);

  const handleNotificationPress = () => {
    setNotificationCount(0);
  };

  const handleAcceptRequest = (requestId: string) => {
    setAcceptedRequests(prev => new Set([...prev, requestId]));
    
    // Update shared stats
    recyclerStats.addActivePickup(requestId);
    
    Alert.alert(
      'Request Accepted',
      'You have accepted this pickup request. It has been added to your active pickups.',
      [{ text: 'OK' }]
    );
  };

  const handleRejectRequest = (requestId: string) => {
    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this pickup request?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reject', 
          style: 'destructive',
          onPress: () => {
            // Remove from pending requests in shared stats
            recyclerStats.removePendingRequest(requestId);
            
            // Remove from accepted requests if it was there
            setAcceptedRequests(prev => {
              const newSet = new Set(prev);
              newSet.delete(requestId);
              return newSet;
            });
            
            Alert.alert('Request Rejected', 'The user has been notified.');
          }
        }
      ]
    );
  };

  const handleRouteRequest = (requestId: string) => {
    router.push('/RecyclerNavigation');
  };

  const handleCompleteRequest = (requestId: string) => {
    setCompletedRequests(prev => new Set([...prev, requestId]));
    setAcceptedRequests(prev => {
      const newSet = new Set(prev);
      newSet.delete(requestId);
      return newSet;
    });
    
    // Add to shared stats (mock earnings for manual completion)
    recyclerStats.addCompletedPickup(requestId, 15.50);
    
    Alert.alert(
      'Pickup Completed',
      'This pickup has been marked as completed.',
      [{ text: 'OK' }]
    );
  };

  // Filter requests based on selected filter
  const getFilteredRequests = () => {
    switch (selectedFilter) {
      case 'active':
        return pickupRequests.filter(request => acceptedRequests.has(request.id));
      case 'completed':
        return pickupRequests.filter(request => completedRequests.has(request.id));
      default:
        return pickupRequests; // Show all requests
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader 
        onNotificationPress={handleNotificationPress}
        notificationCount={notificationCount}
      />
      
      {/* Pickups Banner */}
      <View style={styles.pickupsBanner}>
        <TouchableOpacity style={styles.pickupsButton}>
          <Text style={styles.pickupsButtonText}>Pickups</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[styles.filterButtonText, selectedFilter === 'all' && styles.filterButtonTextActive]}>
            All Pickups
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === 'active' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('active')}
        >
          <Text style={[styles.filterButtonText, selectedFilter === 'active' && styles.filterButtonTextActive]}>
            Active Pickups
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === 'completed' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('completed')}
        >
          <Text style={[styles.filterButtonText, selectedFilter === 'completed' && styles.filterButtonTextActive]}>
            Completed Pickups
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pickup Requests */}
      <ScrollView style={styles.requestsContainer} showsVerticalScrollIndicator={false}>
        {getFilteredRequests().map((request) => (
          <View key={request.id} style={styles.requestCard}>
            <View style={styles.requestContent}>
              <View style={styles.userInfo}>
                <MaterialIcons name="person" size={20} color={COLORS.black} />
                <Text style={styles.userName}>{request.userName}</Text>
              </View>
              
              <View style={styles.locationInfo}>
                <MaterialIcons name="search" size={20} color={COLORS.black} />
                <Text style={styles.locationText}>{request.location}</Text>
              </View>
              
              <View style={styles.phoneInfo}>
                <MaterialIcons name="phone" size={20} color={COLORS.black} />
                <Text style={styles.phoneText}>{request.phone}</Text>
              </View>

              <View style={styles.requestDetails}>
                <View style={styles.detailItem}>
                  <MaterialIcons name="category" size={16} color={COLORS.gray} />
                  <Text style={styles.detailText}>{request.wasteType}</Text>
                </View>
                <View style={styles.detailItem}>
                  <MaterialIcons name="directions-car" size={16} color={COLORS.gray} />
                  <Text style={styles.detailText}>{request.distance}</Text>
                </View>
              </View>
            </View>
            
            {/* Show different buttons based on request status */}
            {completedRequests.has(request.id) ? (
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>Completed</Text>
              </View>
            ) : acceptedRequests.has(request.id) ? (
              <View style={styles.activeButtons}>
                <TouchableOpacity 
                  style={styles.routeButton}
                  onPress={() => handleRouteRequest(request.id)}
                >
                  <Text style={styles.routeButtonText}>Route</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.completeButton}
                  onPress={() => handleCompleteRequest(request.id)}
                >
                  <Text style={styles.completeButtonText}>Complete</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.rejectButton}
                  onPress={() => handleRejectRequest(request.id)}
                >
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.acceptButton}
                  onPress={() => handleAcceptRequest(request.id)}
                >
                  <Text style={styles.acceptButtonText}>Accept</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/(recycler-tabs)')}>
          <Ionicons name="home" size={24} color={COLORS.darkGreen} />
          <Text style={styles.tabLabel}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/(recycler-tabs)/history')}>
          <Ionicons name="time" size={24} color={COLORS.gray} />
          <Text style={styles.tabLabel}>History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/(recycler-tabs)/user')}>
          <Ionicons name="person" size={24} color={COLORS.gray} />
          <Text style={styles.tabLabel}>User</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  pickupsBanner: {
    backgroundColor: COLORS.lightGreen,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  pickupsButton: {
    backgroundColor: COLORS.darkGreen,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  pickupsButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.darkGreen,
  },
  filterButtonText: {
    color: COLORS.darkGreen,
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  requestsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  requestCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  requestContent: {
    flex: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginLeft: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.darkGreen,
    marginLeft: 8,
  },
  phoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneText: {
    fontSize: 14,
    color: COLORS.darkGreen,
    marginLeft: 8,
  },
  routeButton: {
    backgroundColor: COLORS.darkGreen,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  routeButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectButton: {
    backgroundColor: COLORS.red,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  rejectButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  acceptButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  acceptButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  requestDetails: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 4,
  },
  completedBadge: {
    backgroundColor: COLORS.green,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  completedText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  completeButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  completeButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E3E3E3',
    paddingBottom: 5,
    paddingTop: 5,
    height: 60,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.gray,
    marginTop: 2,
  },
});