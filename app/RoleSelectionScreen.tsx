import { useRouter } from 'expo-router';
import React from 'react';
import {
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS } from '../constants';

export default function RoleSelectionScreen() {
  const router = useRouter();

  const handleRoleSelection = (role: 'customer' | 'recycler') => {
    // Store the selected role in context or local storage
    // For now, we'll pass it as a parameter to the auth screen
    router.push({
      pathname: '/LoginScreen',
      params: { selectedRole: role }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../assets/images/logo landscape.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Welcome to EcoWasteGo</Text>
        </View>
        <Text style={styles.subtitle}>Choose how you&apos;d like to use the app</Text>
      </View>

      <View style={styles.optionsContainer}>
        {/* Customer Option */}
        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => handleRoleSelection('customer')}
          activeOpacity={0.8}
        >
          <Image
            source={require('../assets/images/cutomers.jpg')}
            style={styles.roleImage}
            resizeMode="cover"
          />
          <View style={styles.overlay}>
          </View>
        </TouchableOpacity>

        {/* Recycler Option */}
        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => handleRoleSelection('recycler')}
          activeOpacity={0.8}
        >
          <Image
            source={require('../assets/images/recycler.jpg')}
            style={styles.roleImage}
            resizeMode="cover"
          />
          <View style={styles.overlay}>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },
  logo: {
    width: 250,
    height: 150,
    marginBottom: 10,
  },
  titleContainer: {
    backgroundColor: COLORS.primary,
    width: '100%',
    paddingVertical: 20,
    marginBottom: 8,
    marginTop: -20,
    borderRadius: 10,
    height: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gray,
    textAlign: 'center',
    paddingTop: 10,
  },
  optionsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 20,
  },
  roleCard: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 16,
  },
  roleImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
  },
}); 