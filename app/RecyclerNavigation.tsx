import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppHeader from '../components/AppHeader';
import { COLORS } from '../constants';

export default function RecyclerNavigation() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);

  const handleStartNavigation = () => {
    setIsNavigating(true);
    Alert.alert(
      'Navigation Started',
      'Turn-by-turn navigation is now active. Follow the route to reach the pickup location.',
      [{ text: 'OK' }]
    );
    
    // Show arrival notification after 4 seconds
    setTimeout(() => {
      setHasArrived(true);
    }, 4000);
  };

  const handleCancelNavigation = () => {
    Alert.alert(
      'Cancel Navigation',
      'Are you sure you want to cancel the navigation?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          onPress: () => {
            setIsNavigating(false);
            router.back();
          }
        }
      ]
    );
  };

  const handleCallUser = () => {
    const phoneNumber = '0546732719';
    
    try {
      Linking.openURL(`tel:${phoneNumber}`);
    } catch (error) {
      Alert.alert('Error', 'Unable to open phone dialer. Please try calling manually: ' + phoneNumber);
    }
  };

  const handleTextUser = () => {
    router.push('/TextRecyclerScreen');
  };

  const handleCancelRide = () => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this pickup request? This will notify the user.',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Ride Cancelled',
              'The pickup request has been cancelled. You will be redirected to the requests screen.',
              [
                {
                  text: 'OK',
                  onPress: () => router.back()
                }
              ]
            );
          }
        }
      ]
    );
  };

  const handleCalculate = () => {
    // Navigate to RecyclerWeightEntry screen
    router.push({
      pathname: '/RecyclerWeightEntry',
      params: {
        userName: 'Michael Afia',
        pickup: 'Gold hostel - Komfo Anokye'
      }
    });
  };

  return (
    <View style={styles.container}>
      <AppHeader 
        leftIcon="arrow-left"
        rightIcon="truck"
        onLeftPress={() => router.back()}
        onRightPress={() => router.push('/RecyclerRequests')}
        notificationCount={0}
      />
      
      <ScrollView style={styles.content}>
        {/* Arrival Notification */}
        {hasArrived && (
          <View style={styles.arrivalNotification}>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>🎯 You have arrived at your destination!</Text>
              <Text style={styles.notificationText}>Ready to collect waste from Michael Afia</Text>
              <TouchableOpacity style={styles.calculateButton} onPress={handleCalculate}>
                <Text style={styles.calculateButtonText}>Calculate</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Route Information Card */}
        <View style={styles.routeInfoCard}>
          <View style={styles.routeHeader}>
            <MaterialIcons name="navigation" size={24} color={COLORS.darkGreen} />
            <Text style={styles.routeTitle}>Route to Pickup</Text>
          </View>
          
          <View style={styles.routeDetails}>
            <View style={styles.detailRow}>
              <MaterialIcons name="person" size={20} color={COLORS.gray} />
              <Text style={styles.detailText}>Michael Afia</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="location-on" size={20} color={COLORS.gray} />
              <Text style={styles.detailText}>Gold hostel - Komfo Anokye</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="phone" size={20} color={COLORS.gray} />
              <Text style={styles.detailText}>0546732719</Text>
            </View>
          </View>
          
          <View style={styles.routeStats}>
            <View style={styles.statItem}>
              <MaterialIcons name="directions-car" size={20} color={COLORS.darkGreen} />
              <Text style={styles.statValue}>2.3 km</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="access-time" size={20} color={COLORS.darkGreen} />
              <Text style={styles.statValue}>8 min</Text>
              <Text style={styles.statLabel}>ETA</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="category" size={20} color={COLORS.darkGreen} />
              <Text style={styles.statValue}>Plastic</Text>
              <Text style={styles.statLabel}>Waste Type</Text>
            </View>
          </View>
        </View>

        {/* Mock Map Section */}
        <View style={styles.mapContainer}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>Live Navigation</Text>
            <Text style={styles.mapSubtitle}>Google Maps integration coming soon</Text>
          </View>
          
          <View style={styles.mockMap}>
            <View style={styles.mapPlaceholder}>
              <MaterialIcons name="map" size={48} color={COLORS.lightGray} />
              <Text style={styles.mapPlaceholderText}>Navigation Map</Text>
              <Text style={styles.mapPlaceholderSubtext}>
                Real-time turn-by-turn navigation will be implemented here
              </Text>
            </View>
            
            {/* Route indicators */}
            <View style={styles.routeIndicator}>
              <View style={styles.currentLocation}>
                <MaterialIcons name="my-location" size={16} color={COLORS.white} />
              </View>
              <View style={styles.routeLine} />
              <View style={styles.destinationLocation}>
                <MaterialIcons name="location-on" size={16} color={COLORS.darkGreen} />
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.callButton]}
            onPress={handleCallUser}
          >
            <MaterialIcons name="phone" size={20} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Call User</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.textButton]}
            onPress={handleTextUser}
          >
            <MaterialIcons name="message" size={20} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Text User</Text>
          </TouchableOpacity>
        </View>

        {/* Cancel Ride Button */}
        <View style={styles.cancelRideContainer}>
          <TouchableOpacity 
            style={styles.cancelRideButton}
            onPress={handleCancelRide}
          >
            <MaterialIcons name="cancel" size={20} color={COLORS.white} />
            <Text style={styles.cancelRideButtonText}>Cancel Ride</Text>
          </TouchableOpacity>
        </View>

        {/* Navigation Controls */}
        <View style={styles.navigationControls}>
          {!isNavigating ? (
            <TouchableOpacity 
              style={[styles.navButton, styles.startNavButton]}
              onPress={handleStartNavigation}
            >
              <MaterialIcons name="play-arrow" size={24} color={COLORS.white} />
              <Text style={styles.startNavButtonText}>Start Navigation</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.navButton, styles.stopNavButton]}
              onPress={handleCancelNavigation}
            >
              <MaterialIcons name="stop" size={24} color={COLORS.white} />
              <Text style={styles.stopNavButtonText}>Stop Navigation</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  routeInfoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginLeft: 8,
  },
  routeDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.black,
    marginLeft: 8,
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  mapContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mapHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  mapSubtitle: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  mockMap: {
    height: 300,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    margin: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mapPlaceholder: {
    alignItems: 'center',
  },
  mapPlaceholderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gray,
    marginTop: 8,
  },
  mapPlaceholderSubtext: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  routeIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentLocation: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.darkGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeLine: {
    flex: 1,
    height: 3,
    backgroundColor: COLORS.darkGreen,
    marginHorizontal: 8,
  },
  destinationLocation: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.darkGreen,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  callButton: {
    backgroundColor: COLORS.darkGreen,
  },
  textButton: {
    backgroundColor: COLORS.primary,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  navigationControls: {
    marginBottom: 20,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  startNavButton: {
    backgroundColor: COLORS.darkGreen,
  },
  stopNavButton: {
    backgroundColor: COLORS.lightRed,
  },
  startNavButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  stopNavButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cancelRideContainer: {
    marginBottom: 16,
  },
  cancelRideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lightRed,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelRideButtonText: {
    color: COLORS.darkGreen,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  arrivalNotification: {
    backgroundColor: '#F2FFE5',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  notificationContent: {
    padding: 20,
    alignItems: 'center',
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 8,
    textAlign: 'center',
  },
  notificationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  calculateButton: {
    backgroundColor: COLORS.darkGreen,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 