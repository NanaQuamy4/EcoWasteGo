import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
import DrawerMenu from '../../components/DrawerMenu';
import { COLORS } from '../../constants';

export default function RecyclerHomeTab() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [requests, setRequests] = useState(4);
  const [activities, setActivities] = useState(1);
  const [notificationCount, setNotificationCount] = useState(2); // Mock notification count

  const recycler = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+233 54 123 4567',
    status: 'recycler',
    totalPickups: 156,
    totalEarnings: '₵2,450.80',
    memberSince: 'Mar 2023',
  };

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
    router.push('/RecyclerRequests');
  };

  const handleActivitiesPress = () => {
    router.push('/RecyclerActivities');
  };

  const handleNotificationPress = () => {
    // Navigate to notifications screen or show notification panel
    router.push('/NotificationScreen');
    // Clear notification count when opened
    setNotificationCount(0);
  };

  return (
    <View style={styles.container}>
      <AppHeader 
        onMenuPress={() => setDrawerOpen(true)} 
        onNotificationPress={handleNotificationPress}
        notificationCount={notificationCount}
      />
      <DrawerMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} user={recycler} />
      
      {/* Status Bar with Requests, Activities, and Offline Toggle */}
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

        <TouchableOpacity style={styles.statusItem} onPress={handleActivitiesPress}>
          <View style={styles.statusIconContainer}>
            <Ionicons name="alert-circle" size={20} color={COLORS.darkGreen} />
            {activities > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activities}</Text>
              </View>
            )}
          </View>
          <Text style={styles.statusText}>Activities</Text>
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
        {/* Blank placeholder for Google Maps API integration */}
        <View style={styles.mapPlaceholder}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>Recycler Dashboard</Text>
            <Text style={styles.mapSubtitle}>Track your pickup requests and routes</Text>
          </View>
          
          {/* Blank map area for future Google Maps integration */}
          <View style={styles.mapContent}>
            <View style={styles.blankMapArea}>
              <Text style={styles.blankMapText}>Map Area</Text>
              <Text style={styles.blankMapSubtext}>Google Maps integration coming soon</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{requests}</Text>
          <Text style={styles.statLabel}>Pending Requests</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>2</Text>
          <Text style={styles.statLabel}>Active Pickups</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>₵45.20</Text>
          <Text style={styles.statLabel}>Today's Earnings</Text>
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
    justifyContent: 'space-between',
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
    flex: 1,
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
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapHeader: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 1,
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
  mapContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blankMapArea: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  blankMapText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    textAlign: 'center',
  },
  blankMapSubtext: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
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
});