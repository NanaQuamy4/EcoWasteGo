import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, DIMENSIONS } from '../constants';
import CommonHeader from './components/CommonHeader';

export default function TrackingScreen() {
  const params = useLocalSearchParams();
  const recyclerName = params.recyclerName as string;
  const pickup = params.pickup as string;
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [hasReachedDestination, setHasReachedDestination] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showPaymentButton, setShowPaymentButton] = useState(false);

  // Timer-based simulation: Show destination reached after 10 seconds
  useEffect(() => {
    const destinationTimer = setTimeout(() => {
      setHasReachedDestination(true);
      setShowPopup(true);
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

  const handlePopupOK = () => {
    setShowPopup(false);
    setShowPaymentButton(true);
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

      {/* Arrival Popup Modal */}
      <Modal
        visible={showPopup}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPopup(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.popupContainer}>
            <Text style={styles.popupTitle}>🎯 Recycler has arrived!</Text>
            <Text style={styles.popupMessage}>Your recycler has reached your location</Text>
            <TouchableOpacity style={styles.okButton} onPress={handlePopupOK}>
              <Text style={styles.okButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Row: Status */}
      <View style={styles.bottomRow}>
        <View style={styles.statusAndButtons}>
          <Text style={styles.statusText}>
            {hasReachedDestination ? 'Recycler has arrived!' : 'Recycler is on his way'}
          </Text>
          <Text style={styles.timerText}>
            {hasReachedDestination ? 'Ready for pickup' : `${15 - timeElapsed}s until arrival`}
          </Text>
        </View>
      </View>

      {/* Payment Button */}
      {showPaymentButton && (
        <View style={styles.paymentButtonContainer}>
          <TouchableOpacity style={styles.paymentButton} onPress={handleCheckPaymentDue}>
            <Text style={styles.paymentButtonText}>Check Payment Due</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Action Buttons and Truck Row */}
      <View style={styles.actionRow}>
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
        <Image
          source={require('../assets/images/truck.png')}
          style={styles.truckImage}
        />
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/') }>
          <Feather name="home" size={28} color={COLORS.darkGreen} />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/history') }>
          <Feather name="rotate-ccw" size={28} color={COLORS.darkGreen} />
          <Text style={styles.navLabel}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/user') }>
          <Feather name="user" size={28} color={COLORS.darkGreen} />
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
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 300,
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
    marginBottom:10,
    marginTop: 10,
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
    marginBottom: -50,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DIMENSIONS.margin,
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  pillButton: {
    backgroundColor: '#1C3301',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pillButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  truckImage: {
    width: 120,
    height: 80,
    resizeMode: 'contain',
    marginLeft: 10,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 30,
    marginHorizontal: 40,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  popupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 10,
    textAlign: 'center',
  },
  popupMessage: {
    fontSize: 16,
    color: COLORS.secondary,
    marginBottom: 25,
    textAlign: 'center',
  },
  okButton: {
    backgroundColor: '#1C3301',
    borderRadius: 15,
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
  okButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  paymentButtonContainer: {
    alignItems: 'flex-end',
    marginTop: 20,
  },
  paymentButton: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: 170,
    marginBottom: 10,
  },
  paymentButtonText: {
    color: '#1C3301',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: COLORS.lightGreen,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    color: COLORS.darkGreen,
    fontSize: 13,
    marginTop: 2,
    fontWeight: 'bold',
  },
}); 