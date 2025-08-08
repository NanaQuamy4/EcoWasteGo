import { Stack } from 'expo-router/stack';

export default function CustomerLayout() {
  return (
    <Stack>
      {/* Customer-specific screens only */}
      <Stack.Screen name="AboutScreen" options={{ headerShown: false }} />
      <Stack.Screen name="EducationScreen" options={{ headerShown: false }} />
      <Stack.Screen name="CustomerPrivacyScreen" options={{ headerShown: false }} />
      <Stack.Screen name="SelectTruck" options={{ headerShown: false }} />
      <Stack.Screen name="WaitingForRecycler" options={{ headerShown: false }} />
      <Stack.Screen name="TrackingScreen" options={{ headerShown: false }} />
      <Stack.Screen name="CallRecyclerScreen" options={{ headerShown: false }} />
      <Stack.Screen name="TextRecyclerScreen" options={{ headerShown: false }} />
      <Stack.Screen name="PaymentSummary" options={{ headerShown: false }} />
      <Stack.Screen name="PaymentMade" options={{ headerShown: false }} />
      <Stack.Screen name="EcoImpactCelebration" options={{ headerShown: false }} />
      <Stack.Screen name="Rewards" options={{ headerShown: false }} />
      <Stack.Screen name="RecyclerProfileDetails" options={{ headerShown: false }} />
      <Stack.Screen name="HistoryDetail" options={{ headerShown: false }} />
      <Stack.Screen name="CustomerNotificationScreen" options={{ headerShown: false }} />
      <Stack.Screen name="CustomerEditProfileScreen" options={{ headerShown: false }} />
      <Stack.Screen name="Help" options={{ headerShown: false }} />
      <Stack.Screen name="history" options={{ headerShown: false }} />
    </Stack>
  );
}
