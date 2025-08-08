import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
import DrawerMenu from '../../components/DrawerMenu';
import MapComponent from '../../components/MapComponent';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import recyclerStats from '../utils/recyclerStats';

export default function RecyclerHomeTab() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [requests, setRequests] = useState(0);
  const [notificationCount, setNotificationCount] = useState(2); // Mock notification count
  const [mapMarkers, setMapMarkers] = useState<Array<{
    id: string;
    coordinate: { latitude: number; longitude: number };
    title: string;
    description: string;
    type: 'pickup' | 'recycler' | 'destination';
  }>>([]);

  const { user } = useAuth();
  const isVerified = user?.verification_status === 'verified';
  const recycler = {
    name: user?.username || 'Recycler',
    email: user?.email || '',
    phone: user?.phone || '',
    status: user?.verification_status || 'unverified',
    type: 'recycler' as const,
    totalPickups: isVerified ? 156 : 0,
    totalEarnings: isVerified ? '₵2,450.80' : '₵0.00',
    memberSince: 'Mar 2023',
  };

  // Update counts from shared stats
  useEffect(() => {
    const updateCounts = () => {
      // Show total available requests (pending + active) to match RecyclerRequests screen
      const newCount = recyclerStats.getTotalAvailableRequestsCount();
      setRequests(newCount);
    };
    
    updateCounts();
    // Update counts every time the component mounts or when stats change
    const interval = setInterval(updateCounts, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Check for subscription payment requirement
  useEffect(() => {
    if (recyclerStats.isPaymentRequired()) {
      Alert.alert(
        'Payment Required',
        `You have outstanding subscription fees of ${recyclerStats.getSubscriptionFeeString()}. You must pay these fees before continuing to use the app.`,
        [
          {
            text: 'Pay Now',
                            onPress: () => router.push('/recycler-screens/SubscriptionScreen')
          },
          {
            text: 'Later',
            style: 'cancel'
          }
        ]
      );
    }
  }, []);

  const handleOfflineToggle = () => {
    const newStatus = !isOffline;
    setIsOffline(newStatus);
    
    Alert.alert(
      newStatus ? 'Go Offline' : 'Go Online',
      `You are now ${newStatus ? 'offline' : 'online'}. ${newStatus ? 'You will not receive new pickup requests.' : 'You are now available for pickup requests.'}`,
      [
        { text: 'Cancel', onPress: () => setIsOffline(!newStatus), style: 'cancel' },
        { text: 'OK' }
      ]
    );
  };

  const handleRequestsPress = () => {
    router.push('/recycler-screens/RecyclerRequests' as any);
  };

  const handleNotificationPress = () => {
    // Navigate to notifications screen or show notification panel
    router.push('/recycler-screens/RecyclerNotificationScreen' as any);
    // Clear notification count when opened
    setNotificationCount(0);
  };

  // Generate mock pickup requests for map
  const generateMockPickups = () => {
    if (isVerified && requests > 0) {
      const mockPickups = [];
      for (let i = 0; i < Math.min(requests, 5); i++) {
        mockPickups.push({
          id: `pickup-${i}`,
          coordinate: {
            latitude: 6.6734 + (Math.random() - 0.5) * 0.01, // Ghana coordinates with random offset
            longitude: -1.5714 + (Math.random() - 0.5) * 0.01,
          },
          title: `Pickup Request #${i + 1}`,
          description: `Waste pickup request - ${Math.floor(Math.random() * 50) + 10}kg`,
          type: 'pickup' as const,
        });
      }
      setMapMarkers(mockPickups);
    } else {
      setMapMarkers([]);
    }
  };

  // Update map markers when requests change
  useEffect(() => {
    generateMockPickups();
  }, [requests, isVerified]);

  return (
    <View style={styles.container}>
      <AppHeader 
        onMenuPress={() => setDrawerOpen(true)} 
        onNotificationPress={handleNotificationPress}
        notificationCount={notificationCount}
      />
      <DrawerMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} user={recycler} />
      
      {/* Verification Prompt for Unverified Recyclers */}
      {!isVerified && (
        <View style={styles.verificationPrompt}>
          <View style={styles.verificationPromptHeader}>
            <MaterialIcons name="warning" size={24} color={COLORS.orange} />
            <Text style={styles.verificationPromptTitle}>Complete Registration Required</Text>
          </View>
          <Text style={styles.verificationPromptText}>
            You need to complete your registration to start receiving pickup requests and earning money.
          </Text>
          <TouchableOpacity 
            style={styles.verificationPromptButton}
            onPress={() => router.push('/recycler-screens/RecyclerRegistrationScreen' as any)}
          >
            <MaterialIcons name="assignment" size={20} color={COLORS.white} />
            <Text style={styles.verificationPromptButtonText}>Complete Registration</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Status Bar with Requests and Offline Toggle */}
      <View style={styles.statusBar}>
        <TouchableOpacity style={styles.statusItem} onPress={handleRequestsPress}>
          <View style={styles.statusIconContainer}>
            <FontAwesome5 name="truck" size={20} color={COLORS.darkGreen} />
            {requests > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{requests}</Text>
              </View>
            )}
          </View>
          <Text style={styles.statusText}>Requests</Text>
        </TouchableOpacity>

        <View style={styles.offlineContainer}>
          <View style={styles.statusIndicatorRow}>
            <View style={[styles.statusDot, isOffline && styles.statusDotOffline]} />
            <Text style={[styles.offlineText, isOffline && styles.offlineTextActive]}>{isOffline ? 'Offline' : 'Online'}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.toggle, isOffline && styles.toggleActive]} 
            onPress={handleOfflineToggle}
          >
            <View style={[styles.toggleThumb, isOffline && styles.toggleThumbActive]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapTitle}>Recycler Dashboard</Text>
          <Text style={styles.mapSubtitle}>
            {isVerified ? `Track your ${requests} pickup requests` : 'Complete registration to see pickup requests'}
          </Text>
        </View>
        
        <MapComponent
          markers={mapMarkers}
          showUserLocation={true}
          onMarkerPress={(markerId) => {
            Alert.alert(
              'Pickup Request',
              `You selected pickup request: ${markerId}`,
              [
                { text: 'Accept', onPress: () => console.log('Accepted pickup:', markerId) },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          }}
          style={styles.mapComponent}
        />
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{requests}</Text>
          <Text style={styles.statLabel}>Available Requests</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{recyclerStats.getActivePickupsCount()}</Text>
          <Text style={styles.statLabel}>Active Pickups</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>₵{recyclerStats.getTodayEarnings().toFixed(2)}</Text>
          <Text style={styles.statLabel}>Today&apos;s Earnings</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.lightGreen,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
  },
  statusItem: {
    alignItems: 'center',
    marginRight: 40,
  },
  statusIconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#f44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  offlineContainer: {
    alignItems: 'center',
    marginLeft: 'auto',
  },
  offlineText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 4,
  },
  offlineTextActive: {
    color: COLORS.gray,
  },
  toggle: {
    width: 40,
    height: 20,
    backgroundColor: '#ccc',
    borderRadius: 10,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: COLORS.darkGreen,
  },
  toggleThumb: {
    width: 16,
    height: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  mapComponent: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapHeader: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 8,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    textAlign: 'center',
  },
  mapSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
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
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.darkGreen,
    marginRight: 8,
  },
  statusDotOffline: {
    backgroundColor: COLORS.gray,
  },
  verificationPrompt: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  verificationPromptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  verificationPromptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.orange,
    marginLeft: 8,
  },
  verificationPromptText: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
    marginBottom: 16,
  },
  verificationPromptButton: {
    backgroundColor: COLORS.darkGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  verificationPromptButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});