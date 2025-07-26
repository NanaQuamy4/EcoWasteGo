import { router } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CommonHeaderProps {
  showBackButton?: boolean;
  title?: string;
  subtitle?: string;
  onBackPress?: () => void;
}

export default function CommonHeader({ 
  showBackButton = true, 
  title = 'EcoWasteGo', 
  subtitle = 'One Tap to a Greener Planet',
  onBackPress 
}: CommonHeaderProps) {
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.header}>
      {showBackButton && (
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
      )}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/images/logo.png')} 
          style={styles.logo} 
        />
        <View style={styles.brandText}>
          <Text style={styles.appName}>{title}</Text>
          <Text style={styles.tagline}>{subtitle}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E3E3E3',
  },
  backButton: {
    marginRight: 16,
  },
  backArrow: {
    fontSize: 24,
    color: '#000',
    fontWeight: 'bold',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  brandText: {
    flex: 1,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22330B',
  },
  tagline: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
}); 