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
          source={require('../../assets/images/logo landscape.png')} 
          style={styles.logo} 
        />
      </View>
      {showBackButton && (
        <View style={styles.spacer} />
      )}
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
    marginTop: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E3E3E3',
  },
  backButton: {
    marginRight: 16,
  },
  backArrow: {
    fontSize: 40,
    color: '#000',
    fontWeight: 'bold',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logo: {
    width: 200,
    height: 70,
    resizeMode: 'contain',
  },
  spacer: {
    width: 40,
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