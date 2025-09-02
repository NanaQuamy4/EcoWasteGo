import { Stack } from 'expo-router/stack';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function RootLayout() {
  console.log('RootLayout: Component mounted - Starting fresh flow');
  console.log('RootLayout: About to render Stack with initialRouteName: SplashScreen');

  useEffect(() => {
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('RootLayout: Auth state changed:', event, session?.user?.id);
        
        // Handle password reset flow
        if (event === 'PASSWORD_RECOVERY') {
          console.log('RootLayout: Password recovery event detected');
          // The user will be redirected to ResetPasswordScreen via deep link
        }
        
        // Handle other auth events
        if (event === 'SIGNED_IN' && session) {
          console.log('RootLayout: User signed in:', session.user.id);
        }
        
        if (event === 'SIGNED_OUT') {
          console.log('RootLayout: User signed out');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // No initialization delay - go straight to splash screen
  console.log('RootLayout: Rendering main layout immediately');

  return (
    <Stack initialRouteName="SplashScreen">
      {/* Authentication and Onboarding Screens */}
      <Stack.Screen name="SplashScreen" options={{ headerShown: false }} />
      <Stack.Screen name="OnboardingScreen" options={{ headerShown: false }} />
      <Stack.Screen name="RoleSelectionScreen" options={{ headerShown: false }} />
      <Stack.Screen name="LoginScreen" options={{ headerShown: false }} />
      <Stack.Screen name="RegisterScreen" options={{ headerShown: false }} />
      
      {/* Main Tab Navigators */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(recycler-tabs)" options={{ headerShown: false }} />
      
      {/* Role-Specific Screen Groups */}
      <Stack.Screen name="customer-screens" options={{ headerShown: false }} />
      <Stack.Screen name="recycler-screens" options={{ headerShown: false }} />
      
      {/* Shared Screens (accessible by both roles) */}
      <Stack.Screen name="PrivacyScreen" options={{ headerShown: false }} />
      <Stack.Screen name="ForgotPasswordScreen" options={{ headerShown: false }} />
      <Stack.Screen name="VerificationScreen" options={{ headerShown: false }} />
      <Stack.Screen name="ResetPasswordScreen" options={{ headerShown: false }} />
      <Stack.Screen name="EmailVerificationScreen" options={{ headerShown: false }} />
      
      {/* Debug and Development Screens */}
      <Stack.Screen name="debug" options={{ headerShown: false }} />
    </Stack>
  );
} 