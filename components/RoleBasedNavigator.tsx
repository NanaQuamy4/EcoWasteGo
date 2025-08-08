import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants';
import { useAuth } from '../contexts/AuthContext';

interface RoleBasedNavigatorProps {
  children?: React.ReactNode;
}

export default function RoleBasedNavigator({ children }: RoleBasedNavigatorProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // Handle navigation for authenticated users
        const userRole = user.role || 'customer';
        
        if (userRole === 'recycler') {
          // Check if recycler is verified
          if (user.verification_status === 'verified') {
            router.replace('/(recycler-tabs)');
          } else {
            // Recycler is not verified, show registration screen
            router.replace('/recycler-screens/RecyclerRegistrationScreen' as any);
          }
        } else {
          // Customer, go to customer tabs
          router.replace('/(tabs)');
        }
      } else {
        // Handle navigation for unauthenticated users
        // Navigate to splash screen which will then go to onboarding/login
        router.replace('/SplashScreen');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.darkGreen} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray,
  },
}); 