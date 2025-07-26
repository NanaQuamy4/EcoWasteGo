import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const options = {
  headerShown: false,
};

export default function AboutScreen() {
  const router = useRouter();
  
  return (
    <View style={styles.container}>
      {/* Header with app branding */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.backButton}>
          <Feather name="arrow-left" size={28} color="#263A13" />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/images/logo landscape.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={{ width: 28 }} />
      </View>

      {/* Background image section with About pill inside */}
      <ImageBackground 
        source={require('../assets/images/blend.jpg')} 
        style={styles.backgroundImageSection}
        imageStyle={styles.headerBackgroundImage}
      >
        <View style={styles.aboutButton}>
          <Text style={styles.aboutButtonText}>About</Text>
        </View>
      </ImageBackground>

      {/* Main content area */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.textSection}>
          <Text style={styles.paragraph}>
            EcoWasteGo is a smart and eco-friendly mobile platform designed to make waste management easy, convenient, and impactful. With just one tap, users can schedule pickups for electronic and household waste, connect with certified recyclers, and track their contributions toward a cleaner planet.
          </Text>
          
          <Text style={styles.paragraph}>
            Our mission is to promote responsible waste disposal, reduce pollution, and support a circular economy by linking communities to reliable recycling services. Whether you're decluttering your home or managing e-waste, EcoWasteGo helps you do it responsibly while earning rewards for your efforts.
          </Text>
          
          <View style={styles.taglineContainer}>
            <MaterialIcons name="public" size={16} color="#007AFF" style={styles.globeIcon} />
            <Text style={styles.tagline}>One tap to a greener planet.</Text>
          </View>
        </View>

        {/* Bin icon */}
        <View style={styles.iconContainer}>
          <Image 
            source={require('../assets/images/bin.png')} 
            style={styles.binImage}
            resizeMode="cover"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 48,
    paddingBottom: 0,
    paddingHorizontal: 16,
    position: 'relative',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 0,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
  },
  backButton: {
    marginRight: 12,
  },
  logo: {
    width: 200,
    height: 60,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  backgroundImageSection: {
    height: 100,
    marginTop: 16,
    marginHorizontal: -16,
    borderRadius: 40,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#D0D4CC',
  },
  headerBackgroundImage: {
    opacity: 0.2,
  },
  menuButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 10,
    padding: 4,
  },
  logoSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  aboutButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 80,
    paddingVertical: 8,
  },
  aboutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#263A13',
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  textSection: {
    marginBottom: 40,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 20,
    textAlign: 'left',
  },
  taglineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  globeIcon: {
    marginRight: 8,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 5,
  },
  recyclingIcon: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  binImage: {
    width: 120,
    height: 120,
  },
  recyclingSymbol: {
    position: 'absolute',
    backgroundColor: '#4A4A4A',
    borderRadius: 20,
    padding: 4,
  },
}); 