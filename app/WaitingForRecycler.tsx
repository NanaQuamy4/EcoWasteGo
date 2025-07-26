import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CommonHeader from './components/CommonHeader';
import { COLORS, DIMENSIONS } from './utils/constants';
import { formatSecondsToTime } from './utils/helpers';

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
    marginBottom: 8,
    marginTop: 0,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: 70,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  headerCard: {
    backgroundColor: 'transparent',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    position: 'absolute',
    left: 18,
    right: 18,
    top: 30,
    zIndex: 2,
    alignItems: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    textAlign: 'center',
    marginBottom: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    marginBottom: 30,
  },
  loadingTruck: {
    width: 80,
    height: 60,
    resizeMode: 'contain',
  },
  successIcon: {
    marginBottom: 20,
  },
  successText: {
    fontSize: 60,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.darkGreen,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: COLORS.lightGreen,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: DIMENSIONS.borderRadius,
  },
  timeLabel: {
    fontSize: 14,
    color: COLORS.darkGreen,
    marginRight: 8,
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.darkGreen,
    textAlign: 'center',
    marginBottom: 30,
  },
  boldText: {
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  cancelButton: {
    backgroundColor: COLORS.red,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: DIMENSIONS.borderRadius,
    marginBottom: 20,
  },
  cancelButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: DIMENSIONS.borderRadius,
    marginTop: 10,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusMessage: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
}); 