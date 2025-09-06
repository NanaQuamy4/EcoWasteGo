import { Stack } from 'expo-router/stack';

export default function AdminLayout() {
  return (
    <Stack>
      {/* Admin-specific screens */}
      <Stack.Screen name="AdminPortal" options={{ headerShown: false }} />
      <Stack.Screen name="AdminVerificationsScreen" options={{ headerShown: false }} />
      <Stack.Screen name="AdminUsersScreen" options={{ headerShown: false }} />
      <Stack.Screen name="AdminAnalyticsScreen" options={{ headerShown: false }} />
      <Stack.Screen name="AdminSubscriptionScreen" options={{ headerShown: false }} />
      <Stack.Screen name="AdminHelpScreen" options={{ headerShown: false }} />
      <Stack.Screen name="AdminNotificationsScreen" options={{ headerShown: false }} />
      <Stack.Screen name="OnlineRecyclersScreen" options={{ headerShown: false }} />
    </Stack>
  );
}
