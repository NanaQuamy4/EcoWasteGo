import { Stack } from 'expo-router/stack';
import RoleBasedNavigator from '../components/RoleBasedNavigator';
import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <RoleBasedNavigator>
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
        </Stack>
      </RoleBasedNavigator>
    </AuthProvider>
  );
} 