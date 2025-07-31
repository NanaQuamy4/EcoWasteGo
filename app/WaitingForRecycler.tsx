import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, DIMENSIONS } from '../constants';
import { formatSecondsToTime } from '../constants/helpers';
import CommonHeader from './components/CommonHeader';

export default function WaitingForRecyclerScreen() {
  const params = useLocalSearchParams();
  const recyclerName = params.recyclerName as string;
  const pickup = params.pickup as string;
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);
  
  // Animation for the loading indicator
  const spinValue = useMemo(() => new Animated.Value(0), []);
  
  useEffect(() => {
    // Start spinning animation
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );
    spinAnimation.start();

    // Timer to track elapsed time
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    // Simulate recycler confirmation after 5 seconds (for demo)
    const confirmationTimer = setTimeout(() => {
      setIsConfirmed(true);
      spinAnimation.stop();
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(confirmationTimer);
      spinAnimation.stop();
    };
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleCancel = () => {
    router.back();
  };

  const handleConfirmed = () => {
    // Navigate to tracking screen
    router.push({
      pathname: '/TrackingScreen',
      params: { 
        recyclerName: recyclerName,
        pickup: pickup
      }
    });
  };

  if (isConfirmed) {
    return (
      <View style={styles.container}>
        <CommonHeader title="Pickup Confirmed!" />

        {/* Header Banner */}
        <View style={styles.bannerBg}>
          <Image
            source={require('../assets/images/blend.jpg')}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.headerCard}>
            <Text style={styles.header}>Pickup Confirmed!</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.successIcon}>
            <Text style={styles.successText}>✅</Text>
          </View>
          <Text style={styles.subtitle}>
            {recyclerName} has confirmed your pickup request
          </Text>
          <Text style={styles.locationText}>
            Pickup at: <Text style={styles.boldText}>{pickup}</Text>
          </Text>
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmed}>
            <Text style={styles.confirmButtonText}>CONTINUE</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CommonHeader title="Waiting for Recycler" />

      {/* Header Banner */}
      <View style={styles.bannerBg}>
        <Image
          source={require('../assets/images/blend.jpg')}
          style={styles.bannerImage}
          resizeMode="cover"
        />
        <View style={styles.headerCard}>
          <Text style={styles.header}>Waiting for Recycler</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Loading Animation */}
        <Animated.View style={[styles.loadingContainer, { transform: [{ rotate: spin }] }]}>
          <Image 
            source={require('../assets/images/truck.png')} 
            style={styles.loadingTruck}
          />
        </Animated.View>

        {/* Status Text */}
        <Text style={styles.subtitle}>
          Sending pickup request to {recyclerName}...
        </Text>
        
        {/* Time Elapsed */}
        <View style={styles.timeContainer}>
          <Text style={styles.timeLabel}>Time elapsed:</Text>
          <Text style={styles.timeText}>{formatSecondsToTime(timeElapsed)}</Text>
        </View>

        {/* Location Info */}
        <Text style={styles.locationText}>
          Pickup at: <Text style={styles.boldText}>{pickup}</Text>
        </Text>

        {/* Cancel Button */}
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>CANCEL REQUEST</Text>
        </TouchableOpacity>

        {/* Status Message */}
        <Text style={styles.statusMessage}>
          Please wait while the recycler reviews your request...
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  bannerBg: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20, // Increased spacing
    marginTop: 20, // Added top margin for better spacing
    position: 'relative',
    // Removed marginHorizontal to center properly
  },
  bannerImage: {
    width: '100%',
    height: 100, // Increased height for better visual impact
    borderRadius: 20, // Full rounded corners for modern look
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5, // Android shadow
  },
  headerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
    position: 'absolute',
    left: 70,
    right: 0,
    top: 25,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '70%',
    height: '50%',
    alignSelf: 'center',
   
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24, // Increased horizontal padding
    paddingTop: 20, // Added top padding
  },
  loadingContainer: {
    marginBottom: 40, // Increased spacing
    alignItems: 'center',
  },
  loadingTruck: {
    width: 100, // Increased size
    height: 80, // Increased size
    resizeMode: 'contain',
  },
  successIcon: {
    marginBottom: 30, // Increased spacing
    alignItems: 'center',
  },
  successText: {
    fontSize: 80, // Increased size for better impact
  },
  subtitle: {
    fontSize: 18, // Increased font size
    color: COLORS.darkGreen,
    textAlign: 'center',
    marginBottom: 25, // Increased spacing
    lineHeight: 24, // Increased line height
    fontWeight: '500', // Added medium weight
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20, // Increased spacing
    backgroundColor: COLORS.lightGreen,
    paddingHorizontal: 20, // Increased padding
    paddingVertical: 12, // Increased padding
    borderRadius: DIMENSIONS.borderRadius,
    shadowColor: COLORS.black,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  timeLabel: {
    fontSize: 16, // Increased font size
    color: COLORS.darkGreen,
    marginRight: 10, // Increased spacing
    fontWeight: '500', // Added medium weight
  },
  timeText: {
    fontSize: 18, // Increased font size
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  locationText: {
    fontSize: 16, // Increased font size
    color: COLORS.darkGreen,
    textAlign: 'center',
    marginBottom: 35, // Increased spacing
    fontWeight: '500', // Added medium weight
  },
  boldText: {
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  cancelButton: {
    backgroundColor: COLORS.red,
    paddingHorizontal: 35, // Increased padding
    paddingVertical: 15, // Increased padding
    borderRadius: DIMENSIONS.borderRadius,
    marginBottom: 25, // Increased spacing
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButtonText: {
    color: COLORS.white,
    fontSize: 16, // Increased font size
    fontWeight: 'bold',
    letterSpacing: 0.5, // Better text spacing
  },
  confirmButton: {
    backgroundColor: '#1C3301', // Updated to specific green color
    paddingHorizontal: 45, // Increased padding
    paddingVertical: 18, // Increased padding
    borderRadius: DIMENSIONS.borderRadius,
    marginTop: 15, // Increased spacing
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: 18, // Increased font size
    fontWeight: 'bold',
    letterSpacing: 0.5, // Better text spacing
  },
  statusMessage: {
    fontSize: 14, // Increased font size
    color: COLORS.gray,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 25, // Increased spacing
    lineHeight: 18, // Added line height
  },
}); 