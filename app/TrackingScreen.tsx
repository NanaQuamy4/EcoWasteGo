import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, DIMENSIONS } from '../constants';
import CommonHeader from './components/CommonHeader';

export default function TrackingScreen() {
  const params = useLocalSearchParams();
  const recyclerName = params.recyclerName as string;
  const pickup = params.pickup as string;
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [hasReachedDestination, setHasReachedDestination] = useState(false);

  // Timer-based simulation: Show destination reached after 10 seconds, then navigate after 15 seconds
  useEffect(() => {
    const destinationTimer = setTimeout(() => {
      setHasReachedDestination(true);
    }, 10000); // 10 seconds - show destination reached

    const navigationTimer = setTimeout(() => {
      // Navigate to RecyclerHasArrived screen
      router.push({
        pathname: '/RecyclerHasArrived',
        params: { 
          recyclerName: recyclerName,
          pickup: pickup 
        }
      });
    }, 15000); // 15 seconds for demo

    return () => {
      clearTimeout(destinationTimer);
      clearTimeout(navigationTimer);
    };
  }, [recyclerName, pickup]);

  // Optional: Show countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleCall = () => {
    // Navigate to CallRecyclerScreen
    router.push({
      pathname: '/CallRecyclerScreen',
      params: { 
        recyclerName: recyclerName,
        pickup: pickup 
      }
    });
  };
  
  const handleText = () => {
    // Navigate to TextRecyclerScreen
    router.push({
      pathname: '/TextRecyclerScreen',
      params: { 
        recyclerName: recyclerName,
        pickup: pickup 
      }
    });
  };
  
  const handleCancel = () => {
    Alert.alert(
      'Cancel Pickup',
      'Are you sure you want to cancel your pickup?',
      [
        {
          text: 'No',
          style: 'cancel',
          onPress: () => {
            // Stay on tracking screen - do nothing
          }
        },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            // Navigate back to SelectTruck screen with pickup parameter
            router.push({
              pathname: '/SelectTruck',
              params: { pickup: pickup }
            });
          }
        }
      ]
    );
  };

  const handleCheckPaymentDue = () => {
    // Navigate to payment summary screen
    router.push({
      pathname: '/PaymentSummary',
      params: { 
        recyclerName: recyclerName,
        pickup: pickup 
      }
    });
  };

  return (
    <View style={styles.container}>
      <CommonHeader title="Track Your Recycler" />

      {/* Map Container */}
      <View style={styles.mapContainer}>
        {/* Blank placeholder for Google Maps API integration */}
        <View style={styles.mapPlaceholder}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>Live Tracking</Text>
            <Text style={styles.mapSubtitle}>Track your recycler in real-time</Text>
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

      {/* Destination Reached Notification */}
      {hasReachedDestination && (
        <View style={styles.destinationNotification}>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>🎯 Destination Reached!</Text>
            <Text style={styles.notificationText}>Your recycler has arrived at your location</Text>
            <TouchableOpacity style={styles.checkPaymentButton} onPress={handleCheckPaymentDue}>
              <Text style={styles.checkPaymentText}>Check Payment Due</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bottom Row: Status, Truck, and Buttons */}
      <View style={styles.bottomRow}>
        <View style={styles.statusAndButtons}>
          <Text style={styles.statusText}>
            {hasReachedDestination ? 'Recycler has arrived!' : 'Recycler is on his way'}
          </Text>
          <Text style={styles.timerText}>
            {hasReachedDestination ? 'Ready for pickup' : `${15 - timeElapsed}s until arrival`}
          </Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.pillButton} onPress={handleCall}>
              <Text style={styles.pillButtonText}>📞 Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pillButton} onPress={handleText}>
              <Text style={styles.pillButtonText}>💬 Text</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pillButton} onPress={handleCancel}>
              <Text style={styles.pillButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Image
          source={require('../assets/images/truck.png')}
          style={styles.truckImage}
        />
      </View>

      {/* Bottom Navigation Placeholder */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>⏪</Text>
          <Text style={styles.navLabel}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>User</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  mapContainer: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DIMENSIONS.margin,
  },
  mapPlaceholder: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: DIMENSIONS.margin,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapHeader: {
    alignItems: 'center',
    marginBottom: DIMENSIONS.margin,
  },
  mapTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 4,
  },
  mapSubtitle: {
    fontSize: 14,
    color: COLORS.secondary,
  },
  mapContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blankMapArea: {
    alignItems: 'center',
  },
  blankMapText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 8,
  },
  blankMapSubtext: {
    fontSize: 14,
    color: COLORS.secondary,
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: DIMENSIONS.margin,
    marginBottom: 70,
  },
  statusAndButtons: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  statusText: {
    color: COLORS.darkGreen,
    fontSize: 15,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  timerText: {
    color: COLORS.secondary,
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  pillButton: {
    backgroundColor: '#E3E3E3',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  pillButtonText: {
    color: COLORS.darkGreen,
    fontWeight: 'bold',
    fontSize: 15,
  },
  truckImage: {
    width: 90,
    height: 60,
    resizeMode: 'contain',
    marginLeft: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#E3E3E3',
    backgroundColor: COLORS.white,
    paddingBottom: 4,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navIcon: {
    fontSize: 22,
    color: COLORS.darkGreen,
  },
  navLabel: {
    fontSize: 12,
    color: COLORS.darkGreen,
    marginTop: 2,
  },
  destinationNotification: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  notificationContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    alignItems: 'center',
  },
  notificationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 8,
    textAlign: 'center',
  },
  notificationText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  checkPaymentButton: {
    backgroundColor: COLORS.darkGreen,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  checkPaymentText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 