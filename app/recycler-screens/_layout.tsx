import { Stack } from 'expo-router/stack';

export default function RecyclerLayout() {
  return (
    <Stack>
      {/* Recycler-specific screens only */}
      <Stack.Screen name="RecyclerRegistrationScreen" options={{ headerShown: false }} />
      <Stack.Screen name="RecyclerRequests" options={{ headerShown: false }} />
      <Stack.Screen name="RecyclerNavigation" options={{ headerShown: false }} />
      <Stack.Screen name="RecyclerPrivacyScreen" options={{ headerShown: false }} />
      <Stack.Screen name="RecyclerWeightEntry" options={{ headerShown: false }} />
      <Stack.Screen name="RecyclerPaymentSummary" options={{ headerShown: false }} />
      <Stack.Screen name="RecyclerCelebration" options={{ headerShown: false }} />
      <Stack.Screen name="AnalyticsScreen" options={{ headerShown: false }} />
      <Stack.Screen name="EarningsScreen" options={{ headerShown: false }} />
      <Stack.Screen name="SubscriptionScreen" options={{ headerShown: false }} />
      <Stack.Screen name="RecyclerNotificationScreen" options={{ headerShown: false }} />
      <Stack.Screen name="RecyclerEditProfileScreen" options={{ headerShown: false }} />
      <Stack.Screen name="RecyclerTextUserScreen" options={{ headerShown: false }} />
    </Stack>
  );
}
