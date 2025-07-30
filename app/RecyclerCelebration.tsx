import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants';

export default function RecyclerCelebration() {
  const params = useLocalSearchParams();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Celebration animations
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Rotating animation for the celebration icon
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, [scaleAnim, fadeAnim, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleContinue = () => {
    // Pass the completed pickup information to the requests screen
    router.push({
      pathname: '/RecyclerRequests',
      params: {
        completedPickup: 'true',
        pickupId: params.pickupId || '1', // Default to first pickup if no ID
        userName: params.userName || 'User',
        location: params.pickup || 'Location',
        wasteType: params.wasteType || 'Waste',
        totalAmount: params.totalAmount || '0'
      }
    });
  };

  const handleReturnToHome = () => {
    router.push('/(recycler-tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header with just the logo */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/images/logo landscape.png')} 
            style={styles.logo} 
          />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Celebration Header */}
          <View style={styles.headerSection}>
            <Animated.View style={[styles.celebrationIcon, { transform: [{ rotate: spin }] }]}>
              <Text style={styles.celebrationEmoji}>🎉</Text>
            </Animated.View>
            
            <Text style={styles.celebrationTitle}>Payment Received!</Text>
            <Text style={styles.celebrationSubtitle}>Thank you for your eco-friendly service</Text>
          </View>

          {/* Achievement Card */}
          <View style={styles.achievementCard}>
            <View style={styles.achievementHeader}>
              <Text style={styles.achievementTitle}>🌱 Eco Hero Achievement</Text>
            </View>
            
            <View style={styles.achievementContent}>
              <Text style={styles.achievementText}>
                You&apos;ve successfully completed another pickup and contributed to a cleaner environment!
              </Text>
              
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>♻️</Text>
                  <Text style={styles.statLabel}>Waste Collected</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>🌍</Text>
                  <Text style={styles.statLabel}>Planet Helped</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>💰</Text>
                  <Text style={styles.statLabel}>Payment Earned</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Impact Message */}
          <View style={styles.impactCard}>
            <Text style={styles.impactTitle}>Your Impact Today</Text>
            <Text style={styles.impactText}>
              By collecting and properly disposing of waste, you&apos;ve contributed to:
            </Text>
            <View style={styles.impactList}>
              <Text style={styles.impactItem}>• Reducing landfill waste</Text>
              <Text style={styles.impactItem}>• Preventing environmental pollution</Text>
              <Text style={styles.impactItem}>• Supporting sustainable practices</Text>
              <Text style={styles.impactItem}>• Creating a cleaner community</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Fixed Bottom Buttons */}
      <View style={styles.bottomButtonsContainer}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue to Next Collection</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.returnHomeButton} onPress={handleReturnToHome}>
          <Text style={styles.returnHomeButtonText}>🏠 Return to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FFF0',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    marginTop: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E3E3E3',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 70,
    resizeMode: 'contain',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  celebrationIcon: {
    marginBottom: 20,
  },
  celebrationEmoji: {
    fontSize: 80,
  },
  celebrationTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    textAlign: 'center',
    marginBottom: 8,
  },
  celebrationSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  achievementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  achievementHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  achievementTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  achievementContent: {
    alignItems: 'center',
  },
  achievementText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  impactCard: {
    backgroundColor: '#CFDFBF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  impactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 12,
    textAlign: 'center',
  },
  impactText: {
    fontSize: 14,
    color: '#192E01',
    marginBottom: 16,
    lineHeight: 20,
  },
  impactList: {
    paddingLeft: 10,
  },
  impactItem: {
    fontSize: 14,
    color: '#192E01',
    marginBottom: 8,
    lineHeight: 20,
  },
  bottomButtonsContainer: {
    backgroundColor: '#F8FFF0',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 16,
  },
  continueButton: {
    backgroundColor: COLORS.darkGreen,
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  returnHomeButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#357ABD',
  },
  returnHomeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 