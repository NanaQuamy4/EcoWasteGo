import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function RoleBasedNavigator() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      // Navigate based on user role
      if (user.role === 'recycler') {
        // Navigate to recycler mode
        router.replace('/(recycler-tabs)');
      } else {
        // Navigate to customer mode (default)
        router.replace('/(tabs)');
      }
    }
    // Note: Unauthenticated users are handled in SplashScreen
  }, [user, isLoading, router]);

  // Show loading while determining navigation
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#207E06" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // This component doesn't render anything visible
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAF6',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#207E06',
    fontFamily: 'Montserrat-Medium',
  },
}); 