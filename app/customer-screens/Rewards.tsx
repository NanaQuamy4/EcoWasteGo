import { Feather, FontAwesome5, FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react'; // Ensures JSX namespace is available
import { Alert, Animated, Easing, Image, Linking, Modal as RNModal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon'; // Uncomment when implementing confetti
import Modal from 'react-native-modal';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

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

const BADGES: Badge[] = [
  { key: 'star', icon: <Feather name="star" size={28} color="#FFD700" />, title: 'Star Collector', desc: 'Earned for collecting 10 stars.', earned: true, earnedDate: '2024-06-01', points: 100 },
  { key: 'leaf', icon: <FontAwesome5 name="leaf" size={28} color="#4CAF50" />, title: 'Eco Hero', desc: 'Awarded for 5 eco-friendly actions.', earned: true, earnedDate: '2024-06-02', points: 50 },
  { key: 'eco', icon: <MaterialIcons name="eco" size={28} color="#2196F3" />, title: 'Eco Master', desc: 'Unlocked for 20 green actions.', earned: false, lockedDesc: 'Complete 20 green actions to unlock.', points: 200, current: 8, required: 20 },
  { key: 'award', icon: <Feather name="award" size={28} color="#9C27B0" />, title: 'Award Winner', desc: 'Received for winning a challenge.', earned: true, earnedDate: '2024-06-03', points: 150 },
  { key: 'medal', icon: <FontAwesome5 name="medal" size={28} color="#FF9800" />, title: 'Medalist', desc: 'Earned for 1000 points.', earned: false, lockedDesc: 'Earn 1000 points to unlock.', points: 100, current: 700, required: 1000 },
  { key: 'trophy', icon: <MaterialIcons name="emoji-events" size={28} color="#00BCD4" />, title: 'Trophy Holder', desc: 'Awarded for 3 trophies.', earned: true, earnedDate: '2024-06-04', points: 300 },
  { key: 'activity', icon: <Feather name="activity" size={28} color="#8BC34A" />, title: 'Active User', desc: 'Given for daily activity.', earned: false, lockedDesc: 'Be active daily to unlock.', points: 75, current: 3, required: 7 },
];

// Helper to try opening app or fallback
const tryOpenApp = async (url: string, fallbackUrl?: string) => {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else if (fallbackUrl) {
      await Linking.openURL(fallbackUrl);
    } else {
      Alert.alert('App not installed', 'The app is not installed on your device.');
    }
  } catch {
    Alert.alert('Error', 'Unable to open the app.');
  }
};

export default function RewardsScreen() {
  const router = useRouter();
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



  // Mock leaderboard data
  const leaderboard = [
    { name: 'Williams', points: 2500 },
    { name: 'Ama', points: 2200 },
    { name: 'Kwame', points: 2100 },
  ];
  // Mock daily challenge
  const dailyChallenge = {
    title: 'Recycle 3 plastic bottles today!',
    reward: '+50 points',
    completed: false,
  };

  useEffect(() => {
    progress.value = withTiming(progressPercent, { duration: 1200 });
  }, [progress, progressPercent]);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${Math.round(progress.value * 100)}%`,
  }));

  const handleBadgePress = (badge: Badge) => {
    setModalBadge(badge);
    setBadgeModalVisible(true);
  };

  const handleBadgePressIn = (key: string) => {
    setPressedBadgeKey(key);
    scale.value = withTiming(1.15, { duration: 100 });
  };
  const handleBadgePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
    setPressedBadgeKey(null);
  };

  const animatedBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressedBadgeKey ? scale.value : 1 }],
    borderWidth: pressedBadgeKey ? 2 : 0,
    borderColor: '#4CAF50',
  }));

  // Share handler
  const handleShare = () => {
    setShareSheetVisible(true);
  };

  // In the handleShare function, add a handler for each share type
  const handleShareOption = async (type: string) => {
    if (!modalBadge) return;
    const shareText = `I just earned the "${modalBadge.title}" badge in EcoWasteGo! 🏅\n${modalBadge.desc}\nJoin me and start earning rewards!`;
    switch (type) {
      case 'copy':
        await Clipboard.setStringAsync(shareText);
        break;
      case 'whatsapp':
        tryOpenApp(`whatsapp://send?text=${encodeURIComponent(shareText)}`, `https://wa.me/?text=${encodeURIComponent(shareText)}`);
        break;
      case 'facebook':
        tryOpenApp('fb://facewebmodal/f?href=https://www.facebook.com/sharer/sharer.php?u=https://ecowastego.com', `https://www.facebook.com/sharer/sharer.php?u=https://ecowastego.com&quote=${encodeURIComponent(shareText)}`);
        break;
      case 'x':
        tryOpenApp('twitter://post?message=' + encodeURIComponent(shareText), `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`);
        break;
      case 'snapchat':
        tryOpenApp('snapchat://', 'https://www.snapchat.com/scan?attachmentUrl=https://ecowastego.com');
        break;
      case 'tiktok':
        tryOpenApp('snssdk1128://', 'https://www.tiktok.com/upload?text=' + encodeURIComponent(shareText));
        break;
      case 'email':
        tryOpenApp(`mailto:?subject=I earned a badge in EcoWasteGo!&body=${encodeURIComponent(shareText)}`);
        break;
      case 'message':
        tryOpenApp(`sms:&body=${encodeURIComponent(shareText)}`);
        break;
      default:
        break;
    }
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Personalized Message */}
        <Text style={styles.personalMessage}>Great job, {userName}! You’re close to your next badge!</Text>
        {/* Header Banner Image with Title Overlay */}
        <View style={styles.headerImageWrapper}>
                      <Image source={require('../../assets/images/blend.jpg')} style={styles.headerImage} />
          <View style={styles.headerImageOverlay}>
            <View style={styles.headerPill}>
              <Text style={styles.headerPillText}>Your Achievements</Text>
            </View>
          </View>
        </View>
        {/* Points Section */}
        <View style={styles.cardRow}>
          <View style={styles.card}>
            <FontAwesome5 name="medal" size={36} color="#4CAF50" />
            <Text style={styles.cardValue}>2,500</Text>
            <Text style={styles.cardLabel}>Points</Text>
          </View>
          <View style={styles.card}>
            <Feather name="award" size={36} color="#2196F3" />
            <Text style={styles.cardValue}>7</Text>
            <Text style={styles.cardLabel}>Badges</Text>
          </View>
          <View style={styles.card}>
            <MaterialIcons name="emoji-events" size={36} color="#9C27B0" />
            <Text style={styles.cardValue}>3</Text>
            <Text style={styles.cardLabel}>Trophies</Text>
          </View>
        </View>
        {/* Animated Progress Bar Section */}
        <View style={styles.progressSection}>
          <Text style={styles.progressTitle}>Level Progress</Text>
          <View style={styles.progressBarBg}>
            <Animated.View style={[styles.progressBarFill, animatedProgressStyle]} />
          </View>
          <Text style={styles.progressText}>Level 4 ({Math.round(progressPercent * 100)}% to next level)</Text>
        </View>
        {/* Badges Section */}
        <Text style={styles.sectionTitle}>Your Badges</Text>
        <View style={styles.badgesRow}>
          {BADGES.map(badge => {
            const isSelected = badge.earned; // Only show selected for earned badges
            const isLocked = !badge.earned;
            return (
              <TouchableOpacity
                key={badge.key}
                style={[styles.badgeCircle, isSelected && styles.selectedBadge, isLocked && styles.lockedBadge]}
                onPress={() => handleBadgePress(badge)}
                onPressIn={() => handleBadgePressIn(badge.key)}
                onPressOut={handleBadgePressOut}
                activeOpacity={0.8}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={badge.title + (isLocked ? ' (locked)' : '')}
                accessibilityHint={isLocked ? badge.lockedDesc : badge.desc}
              >
                <Animated.View style={isSelected || pressedBadgeKey === badge.key ? animatedBadgeStyle : {}}>
                  {React.isValidElement(badge.icon)
                    ? React.cloneElement(badge.icon as React.ReactElement<any>, { color: isLocked ? '#BDBDBD' : (badge.icon as React.ReactElement<any>).props.color })
                    : badge.icon}
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </View>
        {/* Daily Challenge Section */}
        <View style={styles.challengeSection}>
          <Text style={styles.challengeTitle}>Daily Challenge</Text>
          <Text style={styles.challengeDesc}>{dailyChallenge.title}</Text>
          <Text style={styles.challengeReward}>{dailyChallenge.reward}</Text>
          <TouchableOpacity
            style={[styles.challengeButton, dailyChallenge.completed && { backgroundColor: '#B6CDBD' }]}
            disabled={dailyChallenge.completed}
            onPress={() => {
              // Mark as completed
              // ...update challenge state in real app
            }}
          >
            <Text style={styles.challengeButtonText}>{dailyChallenge.completed ? 'Completed' : 'Complete Now'}</Text>
          </TouchableOpacity>
        </View>

        {/* Leaderboard Preview */}
        <View style={styles.leaderboardSection}>
          <Text style={styles.leaderboardTitle}>Leaderboard</Text>
          {leaderboard.map((entry, idx) => (
            <View key={entry.name} style={styles.leaderboardRow}>
              <Text style={styles.leaderboardRank}>{idx + 1}.</Text>
              <Text style={styles.leaderboardName}>{entry.name}</Text>
              <Text style={styles.leaderboardPoints}>{entry.points} pts</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.leaderboardButton}>
            <Text style={styles.leaderboardButtonText}>View Full Leaderboard</Text>
          </TouchableOpacity>
        </View>

        {/* ConfettiCannon will be triggered here on challenge complete or level up */}
        {/* {showConfetti && <ConfettiCannon count={100} origin={{x: -10, y: 0}} fadeOut={true} onAnimationEnd={() => setShowConfetti(false)} />} */}
        {/* Call to Action */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to Earn More?</Text>
          <Text style={styles.ctaText}>Complete more recycling actions and challenges to unlock new rewards and climb the leaderboard!</Text>
          <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/(tabs)') }>
            <Text style={styles.ctaButtonText}>Start a Challenge</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {/* Modals rendered outside ScrollView for proper overlay */}
      <RNModal
        visible={badgeModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setBadgeModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(10,20,30,0.92)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          {/* Confetti for earned badge */}
          {modalBadge?.earned && (
            <ConfettiCannon
              count={80}
              origin={{ x: 160, y: 0 }}
              fadeOut={true}
              explosionSpeed={350}
              fallSpeed={2500}
              autoStart={true}
              onAnimationEnd={() => {}}
            />
          )}
          {modalBadge && (
            <View style={{ backgroundColor: '#fff', borderRadius: 32, padding: 32, alignItems: 'center', width: 320, maxWidth: '90%', position: 'relative' }}>
              {/* Close X icon */}
              <TouchableOpacity
                onPress={() => setBadgeModalVisible(false)}
                style={{ position: 'absolute', top: 18, right: 18, zIndex: 10 }}
                accessibilityLabel="Close"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={28} color="#888" />
              </TouchableOpacity>
              <Animated.View
                style={modalBadge.earned ? {
                  marginBottom: 18,
                  marginTop: 6,
                  transform: [
                    { scale: glitterAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) },
                    { rotate: glitterAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '10deg'] }) },
                  ],
                  shadowColor: '#FFD700',
                  shadowOpacity: 0.7,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 0 },
                } : { marginBottom: 18, marginTop: 6 }}
              >
                {React.cloneElement(modalBadge.icon as React.ReactElement<any>, { size: 64, color: '#FFD700' })}
              </Animated.View>
              {/* Sparkle effect for earned badge */}
              {modalBadge.earned && (
                <Animated.View
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 32,
                    opacity: sparkleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }),
                    transform: [
                      { scale: sparkleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.3] }) },
                      { rotate: sparkleAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) },
                    ],
                  }}
                >
                  <Feather name="star" size={32} color="#FFD700" />
                </Animated.View>
              )}
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#22330B', marginBottom: 8, textAlign: 'center' }}>{modalBadge.title}</Text>
              {modalBadge.earned ? (
                <Text style={{ fontSize: 15, color: '#444', marginBottom: 8, textAlign: 'center' }}>
                  You earned this badge on {modalBadge.earnedDate} for: {modalBadge.desc}
                </Text>
              ) : (
                <Text style={{ fontSize: 15, color: '#444', marginBottom: 8, textAlign: 'center' }}>
                  {modalBadge.lockedDesc}
                </Text>
              )}
              <TouchableOpacity style={{ backgroundColor: '#2196F3', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 32, marginTop: 12 }} onPress={handleShare}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Share</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </RNModal>
      <Modal isVisible={lockedModal.visible} onBackdropPress={() => { setLockedModal({visible: false, badge: null}); }} backdropOpacity={0.7}>
        <View style={styles.modalContentBetter}>
          {lockedModal.badge && (
            <>
              <View style={styles.modalIconBetter}>{lockedModal.badge.icon}</View>
              <Text style={styles.modalTitleBetter}>{lockedModal.badge.title}</Text>
              <Text style={styles.modalDescBetter}>{lockedModal.badge.lockedDesc}</Text>
              <Text style={styles.modalMotivation}>Complete the requirements to unlock this badge!</Text>
              <TouchableOpacity style={styles.modalCloseBtnBetter} onPress={() => { setLockedModal({visible: false, badge: null}); }}>
                <Text style={styles.modalCloseTextBetter}>Close</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
      {/* Add the bottom sheet share modal at the end of the component */}
      <Modal
        isVisible={shareSheetVisible}
        onBackdropPress={() => setShareSheetVisible(false)}
        style={{ justifyContent: 'flex-end', margin: 0 }}
        backdropOpacity={0.7}
      >
        <View style={{
          backgroundColor: '#222',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingTop: 16,
          paddingBottom: 32,
          paddingHorizontal: 24,
          alignItems: 'center',
        }}>
          <View style={{ width: 40, height: 4, backgroundColor: '#888', borderRadius: 2, marginBottom: 12 }} />
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18, marginBottom: 18 }}>Share</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 24 }}>
            <TouchableOpacity onPress={() => { handleShareOption('copy'); setShareSheetVisible(false); }} style={{ alignItems: 'center', margin: 8 }}>
              <Feather name="copy" size={32} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>Copy Link</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { handleShareOption('whatsapp'); setShareSheetVisible(false); }} style={{ alignItems: 'center', margin: 8 }}>
              <FontAwesome5 name="whatsapp" size={32} color="#25D366" />
              <Text style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { handleShareOption('instagram'); setShareSheetVisible(false); }} style={{ alignItems: 'center', margin: 8 }}>
              <FontAwesome5 name="instagram" size={32} color="#E1306C" />
              <Text style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>Instagram</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { handleShareOption('facebook'); setShareSheetVisible(false); }} style={{ alignItems: 'center', margin: 8 }}>
              <FontAwesome5 name="facebook" size={32} color="#1877F3" />
              <Text style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>Facebook</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { handleShareOption('x'); setShareSheetVisible(false); }} style={{ alignItems: 'center', margin: 8 }}>
              <FontAwesome5 name="twitter" size={32} color="#1DA1F2" />
              <Text style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>X (Twitter)</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { handleShareOption('snapchat'); setShareSheetVisible(false); }} style={{ alignItems: 'center', margin: 8 }}>
              <FontAwesome5 name="snapchat-ghost" size={32} color="#FFFC00" />
              <Text style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>Snapchat</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { handleShareOption('tiktok'); setShareSheetVisible(false); }} style={{ alignItems: 'center', margin: 8 }}>
              <FontAwesome6 name="tiktok" size={32} color="#000" />
              <Text style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>TikTok</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { handleShareOption('email'); setShareSheetVisible(false); }} style={{ alignItems: 'center', margin: 8 }}>
              <Feather name="mail" size={32} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { handleShareOption('message'); setShareSheetVisible(false); }} style={{ alignItems: 'center', margin: 8 }}>
              <Feather name="message-square" size={32} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>Messenger</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => setShareSheetVisible(false)} style={{ marginTop: 18 }}>
            <Text style={{ color: '#fff', fontSize: 16 }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FFF7',
  },
  content: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 12,
  },
  personalMessage: {
    fontSize: 17,
    color: '#22330B',
    fontWeight: 'bold',
    marginBottom: 8,
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#22330B',
    marginBottom: 24,
    textAlign: 'center',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 32,
    marginTop: 0, // ensure no extra gap at the top
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#22330B',
    marginTop: 8,
  },
  cardLabel: {
    fontSize: 15,
    color: '#22330B',
    marginTop: 2,
  },
  progressSection: {
    width: '100%',
    marginBottom: 32,
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22330B',
    marginBottom: 8,
  },
  progressBarBg: {
    width: '90%',
    height: 18,
    backgroundColor: '#E3F0D5',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#192E01', // match Start a Challenge button
    borderRadius: 12,
  },
  progressText: {
    fontSize: 14,
    color: '#22330B',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22330B',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap', // allow wrapping to multiple lines
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
    rowGap: 12, // add vertical gap between rows
  },
  badgeIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginHorizontal: 8,
    marginVertical: 6, // add vertical margin for spacing
    borderWidth: 2,
    borderColor: '#B6CDBD',
  },
  badgeCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#B6CDBD',
    marginHorizontal: 8,
    marginVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedBadge: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  lockedBadge: {
    opacity: 0.5,
  },
  ctaSection: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 32,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#22330B',
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaText: {
    fontSize: 15,
    color: '#22330B',
    marginBottom: 16,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: '#192E01', // updated color
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  ctaButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerImage: {
    width: '100%',
    height: 90,
    borderRadius: 20,
    marginBottom: 12,
    marginTop: 4,
    resizeMode: 'cover',
    opacity: 0.3, // further reduced opacity
  },
  headerPill: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 7, // reduced from 14
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 0,
    minWidth: 220,
    maxWidth: '90%',
  },
  headerPillText: {
    color: '#22330B',
    fontWeight: 'bold',
    fontSize: 18,
  },
  headerImageWrapper: {
    width: '100%',
    height: 90,
    borderRadius: 20,
    marginBottom: 12, // restored spacing below image rectangle
    marginTop: 4,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#D0D4CC',
  },
  headerImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center', // vertical center
    alignItems: 'center',     // horizontal center
    backgroundColor: 'rgba(0,0,0,0.18)',
    display: 'flex',
  },
  headerImagePill: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    maxWidth: '100%',
  },
  headerImageTitle: {
    color: '#22330B',
    fontWeight: 'bold',
    fontSize: 22,
    textAlign: 'center',
  },
  rewardPill: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    minWidth: 120,
    maxWidth: '80%',
  },
  rewardPillText: {
    color: '#22330B',
    fontWeight: 'bold',
    fontSize: 17,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIcon: {
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#22330B',
    marginBottom: 6,
  },
  modalDesc: {
    fontSize: 15,
    color: '#444',
    marginBottom: 18,
    textAlign: 'center',
  },
  modalCloseBtn: {
    backgroundColor: '#192E01',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  modalCloseText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  modalContentBetter: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  modalIconBetter: {
    marginBottom: 18,
    marginTop: 6,
    transform: [{ scale: 1.5 }],
  },
  modalTitleBetter: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22330B',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescBetter: {
    fontSize: 17,
    color: '#444',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMotivation: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: 18,
    textAlign: 'center',
  },
  modalCloseBtnBetter: {
    backgroundColor: '#192E01',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 36,
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  modalCloseTextBetter: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    letterSpacing: 1,
  },
  challengeSection: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22330B',
    marginBottom: 6,
  },
  challengeDesc: {
    fontSize: 15,
    color: '#444',
    marginBottom: 4,
    textAlign: 'center',
  },
  challengeReward: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 10,
  },
  challengeButton: {
    backgroundColor: '#192E01',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  challengeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  leaderboardSection: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    width: '100%',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22330B',
    marginBottom: 8,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  leaderboardRank: {
    fontWeight: 'bold',
    color: '#4CAF50',
    width: 22,
    fontSize: 15,
  },
  leaderboardName: {
    flex: 1,
    fontSize: 15,
    color: '#22330B',
  },
  leaderboardPoints: {
    fontSize: 15,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  leaderboardButton: {
    marginTop: 8,
    backgroundColor: '#192E01',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 24,
    alignSelf: 'center',
  },
  leaderboardButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  shareButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginTop: 12,
    marginBottom: 8,
    alignSelf: 'center',
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalDate: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
    marginBottom: 2,
    textAlign: 'center',
  },
  modalPoints: {
    fontSize: 15,
    color: '#4CAF50',
    marginBottom: 4,
    textAlign: 'center',
  },
}); 