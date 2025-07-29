import { Feather, FontAwesome5 } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AppHeaderProps {
  onMenuPress?: () => void;
  onNotificationPress?: () => void;
  notificationCount?: number;
  leftIcon?: 'menu' | 'arrow-left';
  rightIcon?: 'bell' | 'list' | 'truck';
  onLeftPress?: () => void;
  onRightPress?: () => void;
}

export default function AppHeader({ 
  onMenuPress, 
  onNotificationPress, 
  notificationCount = 0,
  leftIcon = 'menu',
  rightIcon = 'bell',
  onLeftPress,
  onRightPress
}: AppHeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.menuButton} 
        onPress={onLeftPress || onMenuPress}
      >
        <Feather name={leftIcon} size={28} color="#263A13" />
      </TouchableOpacity>
      <Image source={require('../assets/images/logo landscape.png')} style={styles.logo} />
      <View style={{ flex: 1 }} />
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
            <Text style={styles.badgeText}>{notificationCount}</Text>
          </View>
        )}
      </TouchableOpacity>
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
  logo: {
    width: 200,
    height: 80,
    resizeMode: 'contain',
  },
  notificationButton: {
    marginLeft: 16,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#E74C3C',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    zIndex: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
}); 