import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Animated, Easing, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { DIMENSIONS } from '../../constants';
import customerStats from '../utils/customerStats';

export default function EcoImpactCelebrationScreen() {
  const params = useLocalSearchParams();
  
  // Extract parameters from navigation
  const recyclerName = params.recyclerName as string;
  const pickup = params.pickup as string;
  const requestId = params.requestId as string;
  const weight = params.weight as string;
  const wasteType = params.wasteType as string;
  const amount = params.amount as string;
  const environmentalTax = params.environmentalTax as string;
  const totalAmount = params.totalAmount as string;

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [bounceAnim] = useState(new Animated.Value(0));
  const [glitterAnim] = useState(new Animated.Value(0));
  const [sparkleAnim] = useState(new Animated.Value(0));
  const [showConfetti, setShowConfetti] = useState(true);
  const [achievementsEarned, setAchievementsEarned] = useState<string[]>([]);

  useEffect(() => {
    // Initialize customer stats and save the completed pickup
    customerStats.initializeMockData();
    
    // Save the completed pickup to customer stats
    if (requestId && weight && totalAmount) {
      const weightNum = parseFloat(weight.replace(' kg', ''));
      const amountNum = parseFloat(amount);
      const environmentalTaxNum = parseFloat(environmentalTax);
      const totalAmountNum = parseFloat(totalAmount);
      
      customerStats.addCompletedPickup({
        id: requestId,
        recyclerName: recyclerName,
        pickupLocation: pickup,
        wasteType: wasteType,
        weight: weightNum,
        amount: amountNum,
        environmentalTax: environmentalTaxNum,
        totalAmount: totalAmountNum
      });

      // Get newly earned achievements
      const stats = customerStats.getStats();
      const earnedAchievements = customerStats.getEarnedAchievements();
      setAchievementsEarned(earnedAchievements.map(a => a.key));
    }

    // Animate in the celebration screen
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(500),
        Animated.spring(bounceAnim, {
          toValue: 1,
          tension: 100,
          friction: 5,
        }),
      ]),
    ]).start();

    // Start glitter animation for celebration card
    Animated.loop(
      Animated.sequence([
        Animated.timing(glitterAnim, { 
          toValue: 1, 
          duration: 800, 
          useNativeDriver: true, 
          easing: Easing.linear 
        }),
        Animated.timing(glitterAnim, { 
          toValue: 0, 
          duration: 800, 
          useNativeDriver: true, 
          easing: Easing.linear 
        }),
      ])
    ).start();

    // Start sparkle animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, { 
          toValue: 1, 
          duration: 1200, 
          useNativeDriver: true 
        }),
        Animated.timing(sparkleAnim, { 
          toValue: 0, 
          duration: 1200, 
          useNativeDriver: true 
        }),
      ])
    ).start();

    // Stop confetti after 3 seconds
    setTimeout(() => {
      setShowConfetti(false);
    }, 3000);
  }, [fadeAnim, scaleAnim, bounceAnim, glitterAnim, sparkleAnim, requestId, weight, totalAmount, recyclerName, pickup, wasteType, amount, environmentalTax]);

  const handleReturnHome = () => {
    // Navigate to user home screen (user tabs)
    router.push('/(tabs)');
  };

  const handleViewHistory = () => {
    // Navigate to user history screen with pickup data for detailed view
    router.push({
      pathname: '/(tabs)/history' as any,
      params: {
        completedPickup: 'true',
        requestId: requestId,
        recyclerName: recyclerName,
        pickup: pickup,
        weight: weight,
        wasteType: wasteType,
        amount: amount,
        environmentalTax: environmentalTax,
        totalAmount: totalAmount
      }
    });
  };

  const handleViewRewards = () => {
    // Navigate to rewards screen to show new achievements
    router.push({
      pathname: '/(tabs)/rewards' as any,
      params: {
        newAchievements: 'true',
        achievementsEarned: achievementsEarned.join(',')
      }
    });
  };

  // Get environmental impact data
  const getEnvironmentalImpact = () => {
    if (weight) {
      const weightNum = parseFloat(weight.replace(' kg', ''));
      const co2Saved = weightNum * 2.5; // kg CO2 saved per kg recycled
      const treesEquivalent = Math.round(co2Saved / 22); // 1 tree absorbs ~22kg CO2/year
      const landfillSpaceSaved = Math.round(weightNum * 0.5); // 0.5 cubic meters per kg
      const energySaved = Math.round(weightNum * 3.5); // kWh saved per kg recycled
      
      return { co2Saved, treesEquivalent, landfillSpaceSaved, energySaved };
    }
    return { co2Saved: 0, treesEquivalent: 0, landfillSpaceSaved: 0, energySaved: 0 };
  };

  const environmentalImpact = getEnvironmentalImpact();

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

      {/* Background Gradient Effect */}
      <View style={styles.backgroundGradient}>
        <View style={styles.gradientCircle1} />
        <View style={styles.gradientCircle2} />
        <View style={styles.gradientCircle3} />
      </View>

      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <ScrollView 
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
        {/* Celebration Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              transform: [{ scale: bounceAnim }]
            }
          ]}
        >
          <Text style={styles.celebrationTitle}>🎉 Thank You!</Text>
          <Text style={styles.celebrationSubtitle}>You&apos;ve made a difference today!</Text>
        </Animated.View>

        {/* Celebration Card with Glitter Animation */}
        <Animated.View 
          style={[
            styles.celebrationCard,
            {
              transform: [
                { scale: bounceAnim },
                { 
                  scale: glitterAnim.interpolate({ 
                    inputRange: [0, 1], 
                    outputRange: [1, 1.05] 
                  }) 
                },
                { 
                  rotate: glitterAnim.interpolate({ 
                    inputRange: [0, 1], 
                    outputRange: ['0deg', '2deg'] 
                  }) 
                }
              ],
              shadowColor: '#FFD700',
              shadowOpacity: glitterAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.15, 0.4]
              }),
              shadowRadius: glitterAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [15, 25]
              }),
            }
          ]}
        >
          <View style={styles.decorationRow}>
            <Text style={styles.decoration}>🎉</Text>
            <Text style={styles.decoration}>✨</Text>
            <Text style={styles.decoration}>🌱</Text>
            <Text style={styles.decoration}>✨</Text>
            <Text style={styles.decoration}>🎉</Text>
          </View>
          <Text style={styles.celebrationCardTitle}>You Did It!</Text>
          <Text style={styles.celebrationMessage}>Thank you for making a positive impact on our environment!</Text>
          <View style={styles.decorationRow}>
            <Text style={styles.decoration}>🌍</Text>
            <Text style={styles.decoration}>💚</Text>
            <Text style={styles.decoration}>🌿</Text>
            <Text style={styles.decoration}>💚</Text>
            <Text style={styles.decoration}>🌍</Text>
          </View>
          
          {/* Sparkle Effect */}
          <Animated.View
            style={[
              styles.sparkleEffect,
              {
                opacity: sparkleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.8]
                }),
                transform: [
                  { 
                    scale: sparkleAnim.interpolate({ 
                      inputRange: [0, 1], 
                      outputRange: [0.8, 1.2] 
                    }) 
                  }
                ]
              }
            ]}
          >
            <Text style={styles.sparkle}>✨</Text>
          </Animated.View>
        </Animated.View>

        {/* Contribution Summary */}
        <Animated.View 
          style={[
            styles.contributionCard,
            {
              transform: [{ scale: bounceAnim }]
            }
          ]}
        >
          <Text style={styles.contributionTitle}>Your Contribution</Text>
          <View style={styles.contributionItem}>
            <Text style={styles.contributionLabel}>Waste Recycled:</Text>
            <Text style={styles.contributionValue}>{weight}</Text>
          </View>
          <View style={styles.contributionItem}>
            <Text style={styles.contributionLabel}>Waste Type:</Text>
            <Text style={styles.contributionValue}>{wasteType}</Text>
          </View>
          <View style={styles.contributionItem}>
            <Text style={styles.contributionLabel}>Recycler:</Text>
            <Text style={styles.contributionValue}>{recyclerName}</Text>
          </View>
          <View style={styles.contributionItem}>
            <Text style={styles.contributionLabel}>Total Amount:</Text>
            <Text style={styles.contributionValue}>GHS {totalAmount}</Text>
          </View>
        </Animated.View>

        {/* Environmental Impact Card */}
        <Animated.View 
          style={[
            styles.impactCard,
            {
              transform: [{ scale: bounceAnim }]
            }
          ]}
        >
          <Text style={styles.impactTitle}>🌍 Environmental Impact</Text>
          <Text style={styles.impactText}>
            By recycling {weight}, you&apos;ve contributed to:
          </Text>
          <View style={styles.impactList}>
            <Text style={styles.impactItem}>• {environmentalImpact.co2Saved.toFixed(1)} kg CO₂ saved</Text>
            <Text style={styles.impactItem}>• {environmentalImpact.treesEquivalent} tree equivalent</Text>
            <Text style={styles.impactItem}>• {environmentalImpact.landfillSpaceSaved} m³ landfill space saved</Text>
            <Text style={styles.impactItem}>• {environmentalImpact.energySaved} kWh energy saved</Text>
          </View>
        </Animated.View>

        {/* Thank You Message */}
        <Animated.View 
          style={[
            styles.thankYouCard,
            {
              transform: [{ scale: bounceAnim }]
            }
          ]}
        >
          <Text style={styles.thankYouTitle}>🌍 Together We Make a Difference</Text>
          <Text style={styles.thankYouMessage}>
            By choosing EcoWasteGo, you&apos;re helping to create a cleaner, greener future for Ghana. 
            Every pickup counts towards our shared goal of environmental protection.
          </Text>
          <Text style={styles.thankYouQuote}>
            &quot;One Tap to a Greener Planet&quot;
          </Text>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View 
          style={[
            styles.actionButtons,
            {
              transform: [{ scale: bounceAnim }]
            }
          ]}
        >
          <TouchableOpacity style={styles.historyButton} onPress={handleViewHistory}>
            <Text style={styles.historyButtonText}>View History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rewardsButton} onPress={handleViewRewards}>
            <Text style={styles.rewardsButtonText}>View Rewards</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.continueButton} onPress={handleReturnHome}>
            <Text style={styles.continueButtonText}>Return Home</Text>
          </TouchableOpacity>
        </Animated.View>
        
        {/* Extra spacing to ensure buttons are visible */}
        <View style={{ height: 50 }} />
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8F0',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(28, 51, 1, 0.1)',
  },
  gradientCircle2: {
    position: 'absolute',
    bottom: 100,
    left: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(28, 51, 1, 0.08)',
  },
  gradientCircle3: {
    position: 'absolute',
    top: 200,
    left: 50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(28, 51, 1, 0.06)',
  },
  content: {
    flex: 1,
    padding: DIMENSIONS.padding,
    paddingBottom: 100, // Add extra padding to ensure buttons are visible
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  celebrationTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1C3301',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  celebrationSubtitle: {
    fontSize: 20,
    color: '#2E5A02',
    textAlign: 'center',
    fontWeight: '600',
  },
  celebrationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 28,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#1C3301',
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(28, 51, 1, 0.1)',
    position: 'relative',
  },
  decorationRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 8,
  },
  decoration: {
    fontSize: 28,
  },
  celebrationCardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C3301',
    textAlign: 'center',
    marginVertical: 16,
  },
  celebrationMessage: {
    fontSize: 18,
    color: '#2E5A02',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 8,
    fontWeight: '500',
  },
  sparkleEffect: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  sparkle: {
    fontSize: 24,
  },
  contributionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#1C3301',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(28, 51, 1, 0.08)',
  },
  contributionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C3301',
    textAlign: 'center',
    marginBottom: 20,
  },
  contributionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8FFF0',
    borderRadius: 12,
  },
  contributionLabel: {
    fontSize: 16,
    color: '#4A6B2A',
    fontWeight: '500',
  },
  contributionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C3301',
  },
  impactCard: {
    backgroundColor: '#CFDFBF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  impactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C3301',
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
  thankYouCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#1C3301',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(28, 51, 1, 0.08)',
  },
  thankYouTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C3301',
    textAlign: 'center',
    marginBottom: 16,
  },
  thankYouMessage: {
    fontSize: 16,
    color: '#2E5A02',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
    fontWeight: '500',
  },
  thankYouQuote: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C3301',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  historyButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#1C3301',
    alignItems: 'center',
    shadowColor: '#1C3301',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 120,
  },
  historyButtonText: {
    color: '#1C3301',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rewardsButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFA500',
    alignItems: 'center',
    shadowColor: '#1C3301',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 120,
  },
  rewardsButtonText: {
    color: '#1C3301',
    fontSize: 14,
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: '#1C3301',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#1C3301',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 120,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
}); 