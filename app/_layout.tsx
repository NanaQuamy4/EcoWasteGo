import { Stack } from 'expo-router/stack';

export default function RootLayout() {
  return (
    <Stack initialRouteName="SplashScreen">
      <Stack.Screen name="SplashScreen" options={{ headerShown: false }} />
      <Stack.Screen name="OnboardingScreen" options={{ headerShown: false }} />
      <Stack.Screen name="LoginScreen" options={{ headerShown: false }} />
      <Stack.Screen name="RegisterScreen" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="PrivacyScreen" options={{ headerShown: false }} />
      <Stack.Screen name="AboutScreen" options={{ headerShown: false }} />
      <Stack.Screen name="EducationScreen" options={{ headerShown: false }} />
      <Stack.Screen name="NotificationScreen" options={{ headerShown: false }} />
      <Stack.Screen name="Help" options={{ headerShown: false }} />
    </Stack>
  );
} 