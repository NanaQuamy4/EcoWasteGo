import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
// Mock user data (replacing useAuth)

interface RoleBasedNavigatorProps {
  children?: React.ReactNode;
}

export default function RoleBasedNavigator({ children }: RoleBasedNavigatorProps) {
  const user = { id: "user_001", username: "User", email: "user@example.com", phone: "+233 24 123 4567", role: "customer", verification_status: "verified", created_at: "2024-01-15T10:30:00Z", profile_image: null, company_name: "Green Team Recycling" };
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const navigationAttempted = useRef(false);

  useEffect(() => {
    // Add a small delay to ensure Root Layout is fully mounted
    const timer = setTimeout(() => {
      console.log('RoleBasedNavigator: Setting ready state to true');
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    console.log('RoleBasedNavigator: useEffect triggered - isReady:', isReady, 'user:', user);
    
    if (!isReady) {
      console.log('RoleBasedNavigator: Not ready yet, skipping navigation');
      return;
    }
    
    // Only navigate if user is authenticated AND we're not on the splash/onboarding screens
    if (!user) {
      console.log('RoleBasedNavigator: No user, allowing splash/onboarding flow');
      return;
    }

    if (navigationAttempted.current) {
      console.log('RoleBasedNavigator: Navigation already attempted, skipping');
      return;
    }

    // Check if router is ready
    if (!router || typeof router.push !== 'function') {
      console.log('RoleBasedNavigator: Router not ready, waiting...');
      return;
    }

    console.log('RoleBasedNavigator: User authenticated, handling navigation for role:', user.role);
    console.log('RoleBasedNavigator: User details:', {
      id: user.id,
      username: user.username,
      role: user.role,
      verification_status: user.verification_status
    });
    
    // Mark that we've attempted navigation
    navigationAttempted.current = true;
    
    // Add a longer delay to ensure navigation is fully ready
    const navigationTimer = setTimeout(() => {
      try {
        // Handle navigation for authenticated users
        const userRole = user.role || 'customer';
        
        if (userRole === 'recycler') {
          // Check if recycler is verified
          if (user.verification_status === 'verified') {
            console.log('RoleBasedNavigator: Navigating verified recycler to recycler tabs');
            // Use push instead of replace for more reliable navigation
            router.push('/(recycler-tabs)');
          } else {
            // Recycler is not verified, show registration screen
            console.log('RoleBasedNavigator: Navigating unverified recycler to registration');
            router.push('/recycler-screens/RecyclerRegistrationScreen' as any);
          }
        } else {
          // Customer, go to customer tabs
          console.log('RoleBasedNavigator: Navigating customer to customer tabs');
          router.push('/(tabs)');
        }
      } catch (error) {
        console.error('RoleBasedNavigator: Navigation error:', error);
        // Reset the flag if navigation fails
        navigationAttempted.current = false;
      }
    }, 500); // Increased delay for more reliable navigation

    return () => clearTimeout(navigationTimer);
  }, [user, router, isReady]);

  // Don't render children until ready to prevent premature navigation
  if (!isReady) {
    console.log('RoleBasedNavigator: Rendering loading state');
    return null;
  }

  console.log('RoleBasedNavigator: Rendering children');
  return <>{children}</>;
}

const styles = StyleSheet.create({}); 
