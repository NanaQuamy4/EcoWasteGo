import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import RoleBasedNavigator from '../components/RoleBasedNavigator';
import { useAuth } from '../contexts/AuthContext';

export default function SplashScreen() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      // After splash delay, navigate based on auth state
      if (!isLoading) {
        if (user) {
          // User is authenticated, let RoleBasedNavigator handle navigation
          // No need to navigate here as RoleBasedNavigator will handle it
        } else {
          // User is not authenticated, navigate to onboarding
          router.replace('/OnboardingScreen');
        }
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [user, isLoading, router]);

  // If user is authenticated, show role-based navigation
  if (!isLoading && user) {
    return <RoleBasedNavigator />;
  }

  return (
    <View style={styles.container}>
      <Image source={require('../assets/images/logo.png')} style={styles.logo} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#207E06',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
}); 