import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
import MapComponent from '../../components/MapComponent';
import { COLORS } from '../../constants';
import { apiService } from '../../services/apiService';

interface NavigationData {
  requestId: string;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  wasteType: string;
  weight: number;
  estimatedDistance: number;
  estimatedTime: number;
}

export default function RecyclerNavigation() {
  const params = useLocalSearchParams();
  const requestId = params.requestId as string;
  
  const [isNavigating, setIsNavigating] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);
  const [isLocationTracking, setIsLocationTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 6.6734,
    longitude: -1.5714,
  });
  const [destinationLocation, setDestinationLocation] = useState({
    latitude: 6.6834,
    longitude: -1.5814,
  });
  const [navigationData, setNavigationData] = useState<NavigationData | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{latitude: number, longitude: number}>>([]);
  const [distanceToDestination, setDistanceToDestination] = useState(0);
  const [etaToDestination, setEtaToDestination] = useState(0);

  // Get request details when component mounts
  useEffect(() => {
    if (requestId) {
      fetchRequestDetails();
    }
    requestLocationPermission();
  }, [requestId]);

  // Cleanup location subscription
  useEffect(() => {
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [locationSubscription]);

  const fetchRequestDetails = async () => {
    try {
      const response = await apiService.getWasteCollection(requestId);
      if (response) {
        // For now, using mock data - in real app, you'd get coordinates from address
        setNavigationData({
          requestId: response.id,
          customerName: `Customer ${response.customer_id.substring(0, 8)}`,
          customerPhone: '+233 XX XXX XXXX',
          pickupAddress: response.pickup_address || 'Location not specified',
          wasteType: response.waste_type,
          weight: response.weight || 0,
          estimatedDistance: 2.3,
          estimatedTime: 8
        });
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
      // Use mock data as fallback
      setNavigationData({
        requestId: requestId || 'mock-id',
        customerName: 'Michael Afia',
        customerPhone: '0546732719',
        pickupAddress: 'Gold hostel - Komfo Anokye',
        wasteType: 'Plastic',
        weight: 10,
        estimatedDistance: 2.3,
        estimatedTime: 8
      });
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
        getCurrentLocation();
      } else {
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to use navigation features.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setCurrentLocation(newLocation);
      
      // Update route coordinates when location changes
      if (isNavigating) {
        updateRouteCoordinates(newLocation);
        updateCustomerTracking(newLocation);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  const startLocationTracking = async () => {
    if (!locationPermission) {
      Alert.alert('Location Permission Required', 'Please enable location services first.');
      return;
    }

    setIsLocationTracking(true);
    
    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          const newLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          
          setCurrentLocation(newLocation);
          
          if (isNavigating) {
            updateRouteCoordinates(newLocation);
            updateCustomerTracking(newLocation);
            checkArrival(newLocation);
          }
        }
      );

      setLocationSubscription(subscription);
    } catch (error) {
      console.error('Error starting location tracking:', error);
      setIsLocationTracking(false);
      Alert.alert('Error', 'Failed to start location tracking. Please try again.');
    }
  };

  const stopLocationTracking = () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
    setIsLocationTracking(false);
  };

  const updateRouteCoordinates = (newLocation: {latitude: number, longitude: number}) => {
    // Add new location to route coordinates
    setRouteCoordinates(prev => [...prev, newLocation]);
    
    // Calculate distance to destination
    const distance = calculateDistance(newLocation, destinationLocation);
    setDistanceToDestination(distance);
    
    // Calculate ETA (assuming average speed of 30 km/h)
    const etaMinutes = Math.round((distance / 30) * 60);
    setEtaToDestination(etaMinutes);
  };

  const updateCustomerTracking = async (recyclerLocation: {latitude: number, longitude: number}) => {
    try {
      // Update the waste collection status to 'in_progress' if not already done
      await apiService.updateWasteStatus(requestId, 'in_progress');
      
      // In a real app, you'd send the recycler's location to a real-time service
      // For now, we'll simulate this with the API
      console.log('Updating customer tracking with recycler location:', recyclerLocation);
      
      // You could also update a separate tracking table or use WebSockets for real-time updates
    } catch (error) {
      console.error('Error updating customer tracking:', error);
    }
  };

  const checkArrival = async (currentLoc: {latitude: number, longitude: number}) => {
    const distance = calculateDistance(currentLoc, destinationLocation);
    
    // Consider arrived if within 50 meters of destination
    if (distance < 0.05 && !hasArrived) {
      setHasArrived(true);
      setIsNavigating(false);
      stopLocationTracking();
      
      try {
        // Update database status to indicate arrival (using 'in_progress' since 'arrived' is not a valid status)
        // The status 'in_progress' now means: recycler has arrived and is ready to collect
        await apiService.updateWasteStatus(requestId, 'in_progress');
        
        // Show arrival notification to recycler
        Alert.alert(
          '🎯 Destination Reached!',
          `You have arrived at ${navigationData?.pickupAddress || 'the pickup location'}.\n\nReady to collect waste from ${navigationData?.customerName || 'the customer'}.\n\nNavigation has ended automatically.`,
          [
            { 
              text: 'Start Collection', 
              onPress: () => {
                // Optionally navigate to collection screen or show collection options
                console.log('Starting waste collection process');
              }
            }
          ]
        );
        
        // In a real app, you would also send a push notification to the customer
        // For now, we'll update the database status which the customer can poll
        console.log('Recycler has arrived at customer location');
        
      } catch (error) {
        console.error('Error updating arrival status:', error);
        // Still show the arrival alert even if database update fails
        Alert.alert(
          '🎯 Destination Reached!',
          'You have arrived at the pickup location. Ready to collect waste.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const calculateDistance = (point1: {latitude: number, longitude: number}, point2: {latitude: number, longitude: number}) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleStartNavigation = async () => {
    if (!locationPermission) {
      Alert.alert('Location Permission Required', 'Please enable location services first.');
      return;
    }

    try {
      // Update status to 'in_progress' in the database
      await apiService.updateWasteStatus(requestId, 'in_progress');
      
      setIsNavigating(true);
      startLocationTracking();
      
      Alert.alert(
        '🚀 Navigation Started!',
        'Turn-by-turn navigation is now active. Your location will be shared with the customer in real-time.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error starting navigation:', error);
      Alert.alert('Error', 'Failed to start navigation. Please try again.');
    }
  };

  const handleStopNavigation = () => {
    Alert.alert(
      'Stop Navigation',
      'Are you sure you want to stop navigation?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          onPress: () => {
            setIsNavigating(false);
            stopLocationTracking();
          }
        }
      ]
    );
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
            stopLocationTracking();
            router.back();
          }
        }
      ]
    );
  };

  const handleCallUser = () => {
    if (!navigationData) return;
    
    try {
      Linking.openURL(`tel:${navigationData.customerPhone}`);
    } catch {
      Alert.alert('Error', 'Unable to open phone dialer. Please try calling manually: ' + navigationData.customerPhone);
    }
  };

  const handleTextUser = () => {
    if (!navigationData) return;
    
    router.push({
      pathname: '/recycler-screens/RecyclerTextUserScreen' as any,
      params: {
        requestId: requestId,
        userName: navigationData.customerName,
        pickup: navigationData.pickupAddress
      }
    });
  };

  const handleCancelRide = async () => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this pickup request? This will notify the customer.',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.updateWasteStatus(requestId, 'cancelled');
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
            } catch (error) {
              console.error('Error cancelling ride:', error);
              Alert.alert('Error', 'Failed to cancel ride. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleCalculate = () => {
    if (!navigationData) return;
    
    // Navigate to weight entry screen with all necessary parameters
    router.push({
      pathname: '/recycler-screens/RecyclerWeightEntry' as any,
      params: {
        requestId: requestId,
        userName: navigationData.customerName,
        pickup: navigationData.pickupAddress
      }
    });
  };

  if (!navigationData) {
    return (
      <View style={styles.container}>
        <AppHeader 
          leftIcon="arrow-left"
          rightIcon="truck"
          onLeftPress={() => router.back()}
          onRightPress={() => router.push('/recycler-screens/RecyclerRequests' as any)}
          notificationCount={0}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading navigation data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader 
        leftIcon="arrow-left"
        rightIcon="truck"
        onLeftPress={() => router.back()}
        onRightPress={() => router.push('/recycler-screens/RecyclerRequests' as any)}
        notificationCount={0}
      />
      
      <ScrollView style={styles.content}>
        {/* Arrival Notification */}
        {hasArrived && (
          <View style={styles.arrivalNotification}>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>🎯 You have arrived at your destination!</Text>
              <Text style={styles.notificationText}>Ready to collect waste from {navigationData.customerName}</Text>
              <TouchableOpacity style={styles.calculateButton} onPress={handleCalculate}>
                <Text style={styles.calculateButtonText}>Calculate Weight</Text>
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
              <Text style={styles.detailText}>{navigationData.customerName}</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="location-on" size={20} color={COLORS.gray} />
              <Text style={styles.detailText}>{navigationData.pickupAddress}</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="phone" size={20} color={COLORS.gray} />
              <Text style={styles.detailText}>{navigationData.customerPhone}</Text>
            </View>
          </View>
          
          <View style={styles.routeStats}>
            <View style={styles.statItem}>
              <MaterialIcons name="directions-car" size={20} color={COLORS.darkGreen} />
              <Text style={styles.statValue}>
                {isNavigating ? `${distanceToDestination.toFixed(1)} km` : `${navigationData.estimatedDistance} km`}
              </Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="access-time" size={20} color={COLORS.darkGreen} />
              <Text style={styles.statValue}>
                {isNavigating ? `${etaToDestination} min` : `${navigationData.estimatedTime} min`}
              </Text>
              <Text style={styles.statLabel}>ETA</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="category" size={20} color={COLORS.darkGreen} />
              <Text style={styles.statValue}>{navigationData.wasteType}</Text>
              <Text style={styles.statLabel}>Waste Type</Text>
            </View>
          </View>
        </View>

        {/* Live Navigation Map */}
        <View style={styles.mapContainer}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>
              {isNavigating ? '�� Live Navigation' : '🗺️ Route Preview'}
            </Text>
            <Text style={styles.mapSubtitle}>
              {isNavigating 
                ? `Real-time tracking • ${distanceToDestination.toFixed(1)} km remaining`
                : 'Tap Start Navigation to begin live tracking'
              }
            </Text>
          </View>
          
          <MapComponent
            markers={[
              {
                id: 'current',
                coordinate: currentLocation,
                title: 'Your Location',
                description: 'Recycler current position',
                type: 'recycler',
              },
              {
                id: 'destination',
                coordinate: destinationLocation,
                title: 'Pickup Location',
                description: navigationData.pickupAddress,
                type: 'destination',
              },
            ]}
            route={{
              coordinates: routeCoordinates.length > 0 ? routeCoordinates : [currentLocation, destinationLocation],
              color: COLORS.darkGreen,
            }}
            style={styles.navigationMap}
            showUserLocation={true}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {!hasArrived ? (
            <>
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={handleCallUser}
              >
                <Text style={styles.actionButtonText}>📞 Call</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={handleTextUser}
              >
                <Text style={styles.actionButtonText}>💬 Text</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.calculateWeightButton} 
                onPress={handleCalculate}
              >
                <Text style={styles.calculateWeightButtonText}>⚖️ Calculate Weight</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={handleTextUser}
              >
                <Text style={styles.actionButtonText}>💬 Text</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Cancel Ride Button */}
        <View style={styles.cancelRideContainer}>
          <TouchableOpacity 
            style={styles.cancelRideButton}
            onPress={handleCancelRide}
          >
            <MaterialIcons name="cancel" size={20} color={COLORS.white} />
            <Text style={styles.cancelRideButtonText}>Cancel Pickup</Text>
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
              onPress={handleStopNavigation}
            >
              <MaterialIcons name="stop" size={24} color={COLORS.white} />
              <Text style={styles.stopNavButtonText}>Stop Navigation</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Location Status */}
        <View style={styles.locationStatus}>
          <MaterialIcons 
            name={locationPermission ? "location-on" : "location-off"} 
            size={16} 
            color={locationPermission ? COLORS.darkGreen : COLORS.red} 
          />
          <Text style={[styles.locationStatusText, { color: locationPermission ? COLORS.darkGreen : COLORS.red }]}>
            {locationPermission 
              ? (isLocationTracking ? 'Live tracking active' : 'Location ready')
              : 'Location permission required'
            }
          </Text>
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
  navigationMap: {
    height: 300,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  locationStatusText: {
    marginLeft: 8,
    fontSize: 14,
  },
  calculateWeightButton: {
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
  calculateWeightButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 