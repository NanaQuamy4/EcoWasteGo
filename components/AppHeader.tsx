import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AppHeaderProps {
  onMenuPress?: () => void;
  onNotificationPress?: () => void;
  onClearNotifications?: () => void;
  notificationCount?: number;
  leftIcon?: 'menu' | 'arrow-left';
  rightIcon?: 'bell' | 'list' | 'truck';
  onLeftPress?: () => void;
  onRightPress?: () => void;
  hideLeftIcon?: boolean;
  hideRightIcon?: boolean;
  showClearButton?: boolean;
}

export default function AppHeader({ 
  onMenuPress, 
  onNotificationPress, 
  onClearNotifications,
  notificationCount = 0,
  leftIcon = 'menu',
  rightIcon = 'bell',
  onLeftPress,
  onRightPress,
  hideLeftIcon = false,
  hideRightIcon = false,
  showClearButton = false
}: AppHeaderProps) {
  return (
    <View style={styles.header}>
      {!hideLeftIcon && (
        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={onLeftPress || onMenuPress}
        >
          <Feather name={leftIcon} size={28} color="#263A13" />
        </TouchableOpacity>
      )}
      
      <View style={[
        styles.logoContainer,
        hideLeftIcon && hideRightIcon && styles.logoContainerCentered
      ]}>
        <Image source={require('../assets/images/logo landscape.png')} style={styles.logo} />
      </View>
      
      {!hideRightIcon && (
        <View style={styles.rightContainer}>
          {showClearButton && notificationCount > 0 && (
            <TouchableOpacity 
              style={styles.clearButton} 
              onPress={onClearNotifications}
            >
              <Text style={styles.clearButtonText}>CLEAR</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.notificationButton} 
            onPress={onRightPress || onNotificationPress}
          >
            {rightIcon === 'truck' ? (
              <FontAwesome5 name="truck" size={24} color="#263A13" />
            ) : (
              <Feather name={rightIcon} size={26} color="#263A13" />
            )}
            {notificationCount > 0 && rightIcon === 'bell' && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {notificationCount > 99 ? '99+' : notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 36,
    paddingBottom: 12,
    backgroundColor: '#fff',
    minHeight: 80,
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 24,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainerCentered: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 80,
    resizeMode: 'contain',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 4,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notificationButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 12,
  },
}); 