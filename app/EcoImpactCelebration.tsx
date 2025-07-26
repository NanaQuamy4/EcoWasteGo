import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Animated, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, DIMENSIONS, USER_STATS } from './utils/constants';
import { calculateEnvironmentalImpact, parseWeight } from './utils/helpers';

export default function EcoImpactCelebrationScreen() {
  const params = useLocalSearchParams();
  
  // Extract parameters from navigation

  const weight = params.weight as string || '8.5 kg';

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  // Use memoized environmental impact calculations
  const environmentalImpact = useMemo(() => {
    return calculateEnvironmentalImpact(weight);
  }, [weight]);

  useEffect(() => {
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
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const handleContinue = () => {
    // Navigate to home screen
    router.push('/');
  };

  const handleViewHistory = () => {
    // Navigate to history screen
    router.push('/history');
  };

  // Calculate weight in kg for calculations
  const weightInKg = parseWeight(weight);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.celebrationTitle}>🎉 Congratulations!</Text>
          <Text style={styles.celebrationSubtitle}>You&apos;ve made a difference!</Text>
        </View>

        {/* Impact Card */}
        <View style={styles.impactCard}>
          <Text style={styles.impactTitle}>This Pickup&apos;s Impact</Text>
          <View style={styles.impactStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{weight}</Text>
              <Text style={styles.statLabel}>Waste Recycled</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{environmentalImpact.co2Saved} kg</Text>
              <Text style={styles.statLabel}>CO₂ Saved</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{environmentalImpact.treesEquivalent}</Text>
              <Text style={styles.statLabel}>Trees Equivalent</Text>
            </View>
          </View>
        </View>

        {/* Total Impact Card */}
        <View style={styles.totalImpactCard}>
          <Text style={styles.totalImpactTitle}>Your Total Environmental Impact</Text>
          <View style={styles.totalStats}>
            <View style={styles.totalStatRow}>
              <Text style={styles.totalStatLabel}>Total Pickups:</Text>
              <Text style={styles.totalStatValue}>{USER_STATS.totalPickups}</Text>
            </View>
            <View style={styles.totalStatRow}>
              <Text style={styles.totalStatLabel}>Total Waste Recycled:</Text>
              <Text style={styles.totalStatValue}>{USER_STATS.totalWeight}</Text>
            </View>
            <View style={styles.totalStatRow}>
              <Text style={styles.totalStatLabel}>Total CO₂ Saved:</Text>
              <Text style={styles.totalStatValue}>{USER_STATS.co2Saved}</Text>
            </View>
            <View style={styles.totalStatRow}>
              <Text style={styles.totalStatLabel}>Trees Equivalent:</Text>
              <Text style={styles.totalStatValue}>{USER_STATS.treesEquivalent}</Text>
            </View>
            <View style={styles.totalStatRow}>
              <Text style={styles.totalStatLabel}>Current Streak:</Text>
              <Text style={styles.totalStatValue}>{USER_STATS.currentStreak} days</Text>
            </View>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.achievementsCard}>
          <Text style={styles.achievementsTitle}>Your Achievements</Text>
          <View style={styles.badgesContainer}>
            {USER_STATS.badges.map((badge) => (
              <View 
                key={badge.id} 
                style={[
                  styles.badge,
                  { opacity: badge.earned ? 1 : 0.3 }
                ]}
              >
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
                <Text style={[
                  styles.badgeName,
                  { color: badge.earned ? COLORS.primary : COLORS.lightGray }
                ]}>
                  {badge.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Environmental Fact */}
        <View style={styles.factCard}>
          <Text style={styles.factTitle}>🌍 Did You Know?</Text>
          <Text style={styles.factText}>
            Recycling {weight} of waste saves enough energy to power a light bulb for {Math.round(weightInKg * 2.5)} hours and reduces greenhouse gas emissions equivalent to driving a car for {Math.round(weightInKg * 0.3)} kilometers.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.historyButton} onPress={handleViewHistory}>
            <Text style={styles.historyButtonText}>View History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: DIMENSIONS.padding,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  celebrationTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  celebrationSubtitle: {
    fontSize: 16,
    color: COLORS.darkGreen,
    textAlign: 'center',
  },
  impactCard: {
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.cardBorderRadius,
    padding: 20,
    marginBottom: DIMENSIONS.margin,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  impactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  impactStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
  },
  totalImpactCard: {
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.cardBorderRadius,
    padding: 20,
    marginBottom: DIMENSIONS.margin,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  totalImpactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 16,
  },
  totalStats: {
    gap: 8,
  },
  totalStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalStatLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  totalStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  achievementsCard: {
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.cardBorderRadius,
    padding: 20,
    marginBottom: DIMENSIONS.margin,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  achievementsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 16,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 12,
  },
  badge: {
    alignItems: 'center',
    padding: 12,
    borderRadius: DIMENSIONS.borderRadius,
    backgroundColor: '#F0F8F0',
    minWidth: 80,
  },
  badgeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  badgeName: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  factCard: {
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.cardBorderRadius,
    padding: 20,
    marginBottom: 24,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  factTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  factText: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  historyButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    borderRadius: DIMENSIONS.borderRadius,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
  },
  historyButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  continueButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: DIMENSIONS.borderRadius,
    alignItems: 'center',
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 