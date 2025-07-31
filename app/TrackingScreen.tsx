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

  // Timer-based simulation: Show destination reached after 10 seconds
  useEffect(() => {
    const destinationTimer = setTimeout(() => {
      setHasReachedDestination(true);
    }, 10000); // 10 seconds - show destination reached

    return () => {
      clearTimeout(destinationTimer);
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

      {/* Image Rectangle Banner */}
      <View style={styles.bannerContainer}>
        <View style={styles.bannerBg}>
          <Image
            source={require('../assets/images/blend.jpg')}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <TouchableOpacity style={styles.trackButton}>
            <Text style={styles.trackButtonText}>Track Your Recycler</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
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

      {/* Simple Arrival Notification */}
      {hasReachedDestination && (
        <View style={styles.arrivalNotification}>
          <Text style={styles.arrivalText}>🎯 Recycler has arrived!</Text>
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
            {hasReachedDestination && (
              <TouchableOpacity style={styles.paymentButton} onPress={handleCheckPaymentDue}>
                <Text style={styles.paymentButtonText}>Check Payment Due</Text>
              </TouchableOpacity>
            )}
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

  bannerContainer: {
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 20,
  },
  bannerBg: {
    backgroundColor: COLORS.lightGreen,
    borderRadius: 20,
    padding: 15,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
    position: 'relative',
    height: 80,
  },
  bannerImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  trackButton: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 25,
    paddingVertical: 10,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trackButtonText: {
    color: '#1C3301',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  mapContainer: {
    flex: 1,
    backgroundColor: COLORS.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DIMENSIONS.margin,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 20,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },

  mapHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
  },
  mapTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 8,
    textAlign: 'center',
  },
  mapSubtitle: {
    fontSize: 16,
    color: COLORS.secondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  mapContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  blankMapArea: {
    alignItems: 'center',
  },
  blankMapText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 12,
    textAlign: 'center',
  },
  blankMapSubtext: {
    fontSize: 16,
    color: COLORS.secondary,
    textAlign: 'center',
    fontWeight: '500',
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: DIMENSIONS.margin,
    marginBottom: 80,
    marginTop: 20,
  },
  statusAndButtons: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  statusText: {
    color: COLORS.darkGreen,
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  timerText: {
    color: COLORS.secondary,
    fontSize: 14,
    marginBottom: 15,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  pillButton: {
    backgroundColor: '#1C3301',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 10,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pillButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  truckImage: {
    width: 120,
    height: 80,
    resizeMode: 'contain',
    marginLeft: 10,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 70,
    borderTopWidth: 1,
    borderTopColor: '#E3E3E3',
    backgroundColor: COLORS.white,
    paddingBottom: 8,
    shadowColor: COLORS.black,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navIcon: {
    fontSize: 24,
    color: '#1C3301',
  },
  navLabel: {
    fontSize: 12,
    color: '#1C3301',
    marginTop: 4,
    fontWeight: '500',
  },
  arrivalNotification: {
    backgroundColor: '#1C3301',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 15,
    alignItems: 'center',
  },
  arrivalText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  paymentButton: {
    backgroundColor: '#1C3301',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 10,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 