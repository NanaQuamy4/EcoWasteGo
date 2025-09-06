import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { COLORS } from '../../constants';
import { supabase } from '../../lib/supabase';

interface CelebrationData {
  pickupId: string;
  customerName: string;
  location: string;
  wasteType: string;
  weight: number;
  totalAmount: number;
  earnings: number;
  ecoPoints: number;
  co2Saved: number;
  treesEquivalent: number;
  landfillSpaceSaved: number;
  energySaved: number;
}

export default function RecyclerCelebration() {
  const params = useLocalSearchParams();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // State management
  const [loading, setLoading] = useState(true);
  const [celebrationData, setCelebrationData] = useState<CelebrationData | null>(null);
  const [showConfetti, setShowConfetti] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // ===== DATA LOADING =====
  const loadCelebrationData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!currentUser) {
        console.log('No current user, skipping celebration data load');
        return;
      }

      // Get the most recent completed pickup for this recycler
      const { data: earningsData, error: earningsError } = await supabase
        .from('recycler_earnings')
        .select(`
          id,
          pickup_id,
          total_amount,
          recycler_earnings,
          eco_points_earned,
          weight_kg,
          waste_type,
          completed_at,
          pickup_requests!inner(
            id,
            pickup_address,
            customers!inner(
              full_name
            )
          )
        `)
        .eq('recycler_id', currentUser.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      if (earningsError) {
        console.error('Error fetching celebration data:', earningsError);
        // Use params data as fallback
        const fallbackData: CelebrationData = {
          pickupId: params.pickupId as string || 'unknown',
          customerName: params.userName as string || 'Customer',
          location: params.pickup as string || 'Location',
          wasteType: params.wasteType as string || 'Mixed Waste',
          weight: parseFloat(params.weight as string || '0'),
          totalAmount: parseFloat(params.totalAmount as string || '0'),
          earnings: parseFloat(params.totalAmount as string || '0'),
          ecoPoints: Math.floor(parseFloat(params.weight as string || '0') * 10),
          co2Saved: parseFloat(params.weight as string || '0') * 2.5,
          treesEquivalent: Math.round(parseFloat(params.weight as string || '0') * 2.5 / 22),
          landfillSpaceSaved: Math.round(parseFloat(params.weight as string || '0') * 0.5),
          energySaved: Math.round(parseFloat(params.weight as string || '0') * 3.5)
        };
        setCelebrationData(fallbackData);
        return;
      }

      if (earningsData) {
        const celebrationData: CelebrationData = {
          pickupId: earningsData.pickup_id,
          customerName: earningsData.pickup_requests?.[0]?.customers?.[0]?.full_name || 'Customer',
          location: earningsData.pickup_requests?.[0]?.pickup_address || 'Location',
          wasteType: earningsData.waste_type || 'Mixed Waste',
          weight: earningsData.weight_kg || 0,
          totalAmount: earningsData.total_amount || 0,
          earnings: earningsData.recycler_earnings || 0,
          ecoPoints: earningsData.eco_points_earned || 0,
          co2Saved: (earningsData.weight_kg || 0) * 2.5,
          treesEquivalent: Math.round((earningsData.weight_kg || 0) * 2.5 / 22),
          landfillSpaceSaved: Math.round((earningsData.weight_kg || 0) * 0.5),
          energySaved: Math.round((earningsData.weight_kg || 0) * 3.5)
        };
        setCelebrationData(celebrationData);
        console.log('Celebration data loaded successfully:', celebrationData);
      }
    } catch (error) {
      console.error('Error loading celebration data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, params]);

  // ===== USER AUTHENTICATION =====
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Error getting current user:', error);
          return;
        }
        if (user) {
          setCurrentUser(user);
          console.log('Current user loaded:', user.id);
        }
      } catch (error) {
        console.error('Error in getCurrentUser:', error);
      }
    };

    getCurrentUser();
  }, []);

  // ===== INITIALIZATION =====
  useEffect(() => {
    if (currentUser) {
      loadCelebrationData();
    }
  }, [currentUser, loadCelebrationData]);

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

    // Stop confetti after 4 seconds
    setTimeout(() => {
      setShowConfetti(false);
    }, 4000);
  }, [scaleAnim, fadeAnim, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleContinue = () => {
    // Pass the completed pickup information to the requests screen
    router.push({
      pathname: '/recycler-screens/RecyclerRequests' as any,
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading celebration data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Confetti Animation */}
      {showConfetti && (
        <ConfettiCannon
          count={100}
          origin={{ x: 200, y: 0 }}
          fadeOut={true}
          explosionSpeed={400}
          fallSpeed={3000}
          autoStart={true}
          onAnimationEnd={() => setShowConfetti(false)}
        />
      )}

      {/* Custom Header with just the logo */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/images/logo landscape.png')} 
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
              <Text style={styles.achievementTitle}>🏆 Eco Hero Achievement</Text>
            </View>
            
            <View style={styles.achievementContent}>
              <Text style={styles.achievementText}>
                You&apos;ve successfully completed another pickup and contributed to a cleaner environment!
              </Text>
              
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{celebrationData?.weight || 0}kg</Text>
                  <Text style={styles.statLabel}>Waste Collected</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{celebrationData?.ecoPoints || 0}</Text>
                  <Text style={styles.statLabel}>Eco Points</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>₵{celebrationData?.earnings?.toFixed(2) || '0.00'}</Text>
                  <Text style={styles.statLabel}>Earnings</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Pickup Details Card */}
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Pickup Details</Text>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Customer:</Text>
              <Text style={styles.detailsValue}>{celebrationData?.customerName || 'Customer'}</Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Location:</Text>
              <Text style={styles.detailsValue} numberOfLines={2}>{celebrationData?.location || 'Location'}</Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Waste Type:</Text>
              <Text style={styles.detailsValue}>{celebrationData?.wasteType || 'Mixed Waste'}</Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Total Amount:</Text>
              <Text style={styles.detailsValue}>₵{celebrationData?.totalAmount?.toFixed(2) || '0.00'}</Text>
            </View>
          </View>

          {/* Environmental Impact Card */}
          <View style={styles.impactCard}>
            <Text style={styles.impactTitle}>🌍 Environmental Impact</Text>
            <Text style={styles.impactText}>
              By collecting {celebrationData?.weight || 0}kg of {celebrationData?.wasteType || 'waste'}, you&apos;ve contributed to:
            </Text>
            <View style={styles.impactList}>
              <Text style={styles.impactItem}>• {celebrationData?.co2Saved?.toFixed(1) || '0.0'} kg CO₂ emissions saved</Text>
              <Text style={styles.impactItem}>• {celebrationData?.treesEquivalent || 0} tree equivalent planted</Text>
              <Text style={styles.impactItem}>• {celebrationData?.landfillSpaceSaved || 0} m³ landfill space saved</Text>
              <Text style={styles.impactItem}>• {celebrationData?.energySaved || 0} kWh energy saved</Text>
            </View>
          </View>

          {/* Eco Points Card */}
          <View style={styles.ecoPointsCard}>
            <Text style={styles.ecoPointsTitle}>⭐ Eco Points Earned</Text>
            <View style={styles.ecoPointsContent}>
              <Text style={styles.ecoPointsNumber}>{celebrationData?.ecoPoints || 0}</Text>
              <Text style={styles.ecoPointsText}>points earned from this pickup</Text>
              <Text style={styles.ecoPointsSubtext}>
                Keep collecting to earn more points and unlock rewards!
              </Text>
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
  // New card styles
  detailsCard: {
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
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 16,
    textAlign: 'center',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailsLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  detailsValue: {
    fontSize: 14,
    color: COLORS.darkGreen,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  ecoPointsCard: {
    backgroundColor: '#FFF3CD',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
    alignItems: 'center',
  },
  ecoPointsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 16,
  },
  ecoPointsContent: {
    alignItems: 'center',
  },
  ecoPointsNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 8,
  },
  ecoPointsText: {
    fontSize: 16,
    color: COLORS.darkGreen,
    fontWeight: '600',
    marginBottom: 8,
  },
  ecoPointsSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FFF0',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray,
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