import { Feather, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react'; // Ensures JSX namespace is available
import { Alert, Animated, Easing, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon'; // Uncomment when implementing confetti
import Modal from 'react-native-modal';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import customerStats from '../utils/customerStats';

export const config = {
  headerShown: false,
};

type Badge = {
  key: string;
  icon: React.ReactElement;
  title: string;
  desc: string;
  earned?: boolean;
  earnedDate?: string;
  points?: number;
  lockedDesc?: string;
  current?: number; // progress so far
  required?: number; // required to unlock
};

export default function RewardsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [lockedModal, setLockedModal] = useState<{visible: boolean, badge: Badge | null}>({visible: false, badge: null});
  const [pressedBadgeKey, setPressedBadgeKey] = useState<string | null>(null);
  const scale = useSharedValue(1);
  const progress = useSharedValue(0);
  const progressPercent = 0.7; // 70% progress
  const userName = 'Williams'; // Replace with dynamic user name if available

  const [badgeModalVisible, setBadgeModalVisible] = useState(false);
  const [modalBadge, setModalBadge] = useState<Badge | null>(null);
  const glitterAnim = React.useRef(new Animated.Value(0)).current;
  // Sparkle animation state
  const sparkleAnim = React.useRef(new Animated.Value(0)).current;
  // Add state for share sheet visibility
  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [showNewAchievementConfetti, setShowNewAchievementConfetti] = useState(false);

  // Initialize badges from customerStats
  useEffect(() => {
    customerStats.initializeMockData();
    
    // Get achievements from customerStats
    const achievements = customerStats.getAchievements();
    const stats = customerStats.getStats();
    
    // Map achievements to badges
    const badgesFromStats: Badge[] = [
      { 
        key: 'first_pickup', 
        icon: <Feather name="star" size={28} color="#FFD700" />, 
        title: 'First Pickup', 
        desc: 'Earned for your first waste pickup.', 
        earned: achievements.get('first_pickup')?.earned || false, 
        earnedDate: achievements.get('first_pickup')?.date || '', 
        points: achievements.get('first_pickup')?.points || 50 
      },
      { 
        key: 'eco_warrior', 
        icon: <FontAwesome5 name="leaf" size={28} color="#4CAF50" />, 
        title: 'Eco Warrior', 
        desc: 'Awarded for 5 eco-friendly pickups.', 
        earned: achievements.get('eco_warrior')?.earned || false, 
        earnedDate: achievements.get('eco_warrior')?.date || '', 
        points: achievements.get('eco_warrior')?.points || 100,
        current: stats.totalPickups,
        required: 5
      },
      { 
        key: 'waste_reducer', 
        icon: <MaterialIcons name="eco" size={28} color="#2196F3" />, 
        title: 'Waste Reducer', 
        desc: 'Unlocked for recycling 20kg of waste.', 
        earned: achievements.get('waste_reducer')?.earned || false, 
        lockedDesc: 'Recycle 20kg of waste to unlock.', 
        points: achievements.get('waste_reducer')?.points || 75,
        current: Math.round(stats.totalWasteRecycled),
        required: 20
      },
      { 
        key: 'environmental_champion', 
        icon: <Feather name="award" size={28} color="#9C27B0" />, 
        title: 'Environmental Champion', 
        desc: 'Earned for recycling 50kg of waste.', 
        earned: achievements.get('environmental_champion')?.earned || false, 
        lockedDesc: 'Recycle 50kg of waste to unlock.', 
        points: achievements.get('environmental_champion')?.points || 150,
        current: Math.round(stats.totalWasteRecycled),
        required: 50
      },
      { 
        key: 'recycling_master', 
        icon: <FontAwesome5 name="medal" size={28} color="#FF9800" />, 
        title: 'Recycling Master', 
        desc: 'Awarded for recycling 100kg of waste.', 
        earned: achievements.get('recycling_master')?.earned || false, 
        lockedDesc: 'Recycle 100kg of waste to unlock.', 
        points: achievements.get('recycling_master')?.points || 200,
        current: Math.round(stats.totalWasteRecycled),
        required: 100
      },
      { 
        key: 'planet_protector', 
        icon: <MaterialIcons name="emoji-events" size={28} color="#00BCD4" />, 
        title: 'Planet Protector', 
        desc: 'Awarded for recycling 200kg of waste.', 
        earned: achievements.get('planet_protector')?.earned || false, 
        lockedDesc: 'Recycle 200kg of waste to unlock.', 
        points: achievements.get('planet_protector')?.points || 300,
        current: Math.round(stats.totalWasteRecycled),
        required: 200
      },
    ];
    
    setBadges(badgesFromStats);
  }, []);

  // Handle new achievements from EcoImpactCelebration
  useEffect(() => {
    if (params.newAchievements === 'true' && params.achievementsEarned) {
      const newAchievements = params.achievementsEarned.split(',');
      
      // Show confetti for new achievements
      setShowNewAchievementConfetti(true);
      setTimeout(() => setShowNewAchievementConfetti(false), 3000);
      
      // Update badges to show new achievements
      setBadges(prev => prev.map(badge => ({
        ...badge,
        earned: newAchievements.includes(badge.key) ? true : badge.earned
      })));
    }
  }, [params.newAchievements, params.achievementsEarned]);

  // Glittering animation for earned badges
  React.useEffect(() => {
    if (badgeModalVisible && modalBadge?.earned) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glitterAnim, { toValue: 1, duration: 600, useNativeDriver: true, easing: Easing.linear }),
          Animated.timing(glitterAnim, { toValue: 0, duration: 600, useNativeDriver: true, easing: Easing.linear }),
        ])
      ).start();
    } else {
      glitterAnim.stopAnimation();
      glitterAnim.setValue(0);
    }
  }, [badgeModalVisible, modalBadge, glitterAnim]);

  // Sparkle animation for earned badge
  React.useEffect(() => {
    if (badgeModalVisible && modalBadge?.earned) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(sparkleAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    } else {
      sparkleAnim.stopAnimation();
      sparkleAnim.setValue(0);
    }
  }, [badgeModalVisible, modalBadge, sparkleAnim]);

  const handleBadgePress = (badge: Badge) => {
    setModalBadge(badge);
    setBadgeModalVisible(true);
  };

  const handleBadgePressIn = (key: string) => {
    setPressedBadgeKey(key);
    scale.value = withTiming(0.95, { duration: 100 });
  };

  const handleBadgePressOut = () => {
    setPressedBadgeKey(null);
    scale.value = withTiming(1, { duration: 100 });
  };

  const handleCloseModal = () => {
    setBadgeModalVisible(false);
    setModalBadge(null);
  };

  const handleShare = () => {
    setShareSheetVisible(true);
  };

  const handleShareOption = async (type: string) => {
    setShareSheetVisible(false);
    
    const stats = customerStats.getStats();
    const shareText = `I've earned ${stats.totalPoints} points on EcoWasteGo by recycling ${stats.totalWasteRecycled}kg of waste! 🌱♻️`;
    
    if (type === 'copy') {
      await Clipboard.setStringAsync(shareText);
      Alert.alert('Copied!', 'Achievement shared to clipboard');
    } else if (type === 'whatsapp') {
      const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(shareText)}`;
      try {
        await Linking.openURL(whatsappUrl);
      } catch {
        Alert.alert('Error', 'Could not open WhatsApp');
      }
    }
  };

  // Get current stats
  const stats = customerStats.getStats();
  const environmentalImpact = customerStats.getEnvironmentalImpact();

  return (
    <View style={styles.container}>
      {/* Confetti for new achievements */}
      {showNewAchievementConfetti && (
        <ConfettiCannon
          count={50}
          origin={{ x: 200, y: 0 }}
          fadeOut={true}
          explosionSpeed={400}
          fallSpeed={3000}
          autoStart={true}
          onAnimationEnd={() => setShowNewAchievementConfetti(false)}
        />
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rewards & Achievements</Text>
        <Text style={styles.headerSubtitle}>Track your eco-friendly progress</Text>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalPoints}</Text>
          <Text style={styles.statLabel}>Total Points</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalPickups}</Text>
          <Text style={styles.statLabel}>Pickups</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalWasteRecycled}kg</Text>
          <Text style={styles.statLabel}>Waste Recycled</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{environmentalImpact.co2Saved.toFixed(1)}kg</Text>
          <Text style={styles.statLabel}>CO₂ Saved</Text>
        </View>
      </View>

      {/* Environmental Impact Summary */}
      <View style={styles.impactSummary}>
        <Text style={styles.impactTitle}>🌍 Your Environmental Impact</Text>
        <View style={styles.impactGrid}>
          <View style={styles.impactItem}>
            <Text style={styles.impactIcon}>🌳</Text>
            <Text style={styles.impactValue}>{environmentalImpact.treesEquivalent}</Text>
            <Text style={styles.impactLabel}>Trees Equivalent</Text>
          </View>
          <View style={styles.impactItem}>
            <Text style={styles.impactIcon}>⚡</Text>
            <Text style={styles.impactValue}>{environmentalImpact.energySaved}</Text>
            <Text style={styles.impactLabel}>kWh Saved</Text>
          </View>
          <View style={styles.impactItem}>
            <Text style={styles.impactIcon}>🗑️</Text>
            <Text style={styles.impactValue}>{environmentalImpact.landfillSpaceSaved}m³</Text>
            <Text style={styles.impactLabel}>Landfill Saved</Text>
          </View>
        </View>
      </View>

      {/* Badges Grid */}
      <View style={styles.badgesSection}>
        <Text style={styles.badgesTitle}>Achievement Badges</Text>
        <View style={styles.badgesGrid}>
          {badges.map((badge) => (
            <TouchableOpacity
              key={badge.key}
              style={[
                styles.badgeItem,
                badge.earned && styles.badgeEarned,
                pressedBadgeKey === badge.key && styles.badgePressed
              ]}
              onPress={() => handleBadgePress(badge)}
              onPressIn={() => handleBadgePressIn(badge.key)}
              onPressOut={handleBadgePressOut}
            >
              <View style={styles.badgeIcon}>
                {badge.icon}
              </View>
              <Text style={[styles.badgeTitle, badge.earned && styles.badgeTitleEarned]}>
                {badge.title}
              </Text>
              <Text style={[styles.badgeDesc, badge.earned && styles.badgeDescEarned]}>
                {badge.earned ? badge.desc : (badge.lockedDesc || badge.desc)}
              </Text>
              {badge.earned && (
                <View style={styles.earnedBadge}>
                  <Text style={styles.earnedText}>✓ Earned</Text>
                  <Text style={styles.earnedDate}>{badge.earnedDate}</Text>
                </View>
              )}
              {!badge.earned && badge.current !== undefined && badge.required && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${Math.min((badge.current / badge.required) * 100, 100)}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {badge.current}/{badge.required}
                  </Text>
                </View>
              )}
              <Text style={[styles.badgePoints, badge.earned && styles.badgePointsEarned]}>
                {badge.points} pts
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Share Button */}
      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Text style={styles.shareButtonText}>Share Your Achievements</Text>
      </TouchableOpacity>

      {/* Badge Detail Modal */}
      <Modal
        isVisible={badgeModalVisible}
        onBackdropPress={handleCloseModal}
        onBackButtonPress={handleCloseModal}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          {modalBadge && (
            <>
              <View style={styles.modalHeader}>
                <View style={[styles.modalIcon, modalBadge.earned && styles.modalIconEarned]}>
                  {modalBadge.icon}
                </View>
                <Text style={styles.modalTitle}>{modalBadge.title}</Text>
                <Text style={styles.modalPoints}>{modalBadge.points} points</Text>
              </View>
              
              <Text style={styles.modalDescription}>
                {modalBadge.earned ? modalBadge.desc : (modalBadge.lockedDesc || modalBadge.desc)}
              </Text>
              
              {modalBadge.earned && (
                <View style={styles.modalEarnedInfo}>
                  <Text style={styles.modalEarnedText}>🎉 Achievement Unlocked!</Text>
                  <Text style={styles.modalEarnedDate}>Earned on {modalBadge.earnedDate}</Text>
                </View>
              )}
              
              {!modalBadge.earned && modalBadge.current !== undefined && modalBadge.required && (
                <View style={styles.modalProgress}>
                  <Text style={styles.modalProgressText}>Progress: {modalBadge.current}/{modalBadge.required}</Text>
                  <View style={styles.modalProgressBar}>
                    <View 
                      style={[
                        styles.modalProgressFill, 
                        { width: `${Math.min((modalBadge.current / modalBadge.required) * 100, 100)}%` }
                      ]} 
                    />
                  </View>
                </View>
              )}
              
              <TouchableOpacity style={styles.modalCloseButton} onPress={handleCloseModal}>
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>

      {/* Share Options Modal */}
      <Modal
        isVisible={shareSheetVisible}
        onBackdropPress={() => setShareSheetVisible(false)}
        style={styles.shareModal}
      >
        <View style={styles.shareModalContent}>
          <Text style={styles.shareModalTitle}>Share Your Achievements</Text>
          <TouchableOpacity 
            style={styles.shareOption} 
            onPress={() => handleShareOption('copy')}
          >
            <Text style={styles.shareOptionText}>📋 Copy to Clipboard</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.shareOption} 
            onPress={() => handleShareOption('whatsapp')}
          >
            <Text style={styles.shareOptionText}>📱 Share on WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.shareModalClose} 
            onPress={() => setShareSheetVisible(false)}
          >
            <Text style={styles.shareModalCloseText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FFF0',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C3301',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C3301',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  impactSummary: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  impactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C3301',
    textAlign: 'center',
    marginBottom: 16,
  },
  impactGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  impactItem: {
    alignItems: 'center',
    flex: 1,
  },
  impactIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  impactValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C3301',
    marginBottom: 4,
  },
  impactLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  badgesSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  badgesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C3301',
    marginBottom: 16,
    textAlign: 'center',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  badgeItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  badgeEarned: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8E9',
  },
  badgePressed: {
    transform: [{ scale: 0.95 }],
  },
  badgeIcon: {
    marginBottom: 12,
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  badgeTitleEarned: {
    color: '#1C3301',
  },
  badgeDesc: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 16,
  },
  badgeDescEarned: {
    color: '#4A6B2A',
  },
  earnedBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  earnedText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  earnedDate: {
    color: '#FFFFFF',
    fontSize: 8,
    textAlign: 'center',
    marginTop: 2,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  badgePoints: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  badgePointsEarned: {
    color: '#4CAF50',
  },
  shareButton: {
    backgroundColor: '#1C3301',
    margin: 20,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modal: {
    margin: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  modalIconEarned: {
    opacity: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C3301',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalPoints: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  modalEarnedInfo: {
    backgroundColor: '#F1F8E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  modalEarnedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  modalEarnedDate: {
    fontSize: 14,
    color: '#4A6B2A',
  },
  modalProgress: {
    width: '100%',
    marginBottom: 20,
  },
  modalProgressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalProgressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  modalProgressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  modalCloseButton: {
    backgroundColor: '#1C3301',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 20,
  },
  modalCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  shareModal: {
    margin: 20,
  },
  shareModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
  },
  shareModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C3301',
    textAlign: 'center',
    marginBottom: 20,
  },
  shareOption: {
    backgroundColor: '#F8FFF0',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  shareOptionText: {
    fontSize: 16,
    color: '#1C3301',
    textAlign: 'center',
  },
  shareModalClose: {
    backgroundColor: '#FF4444',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  shareModalCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 