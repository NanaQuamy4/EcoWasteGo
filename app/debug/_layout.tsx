import { Stack } from 'expo-router/stack';

export default function DebugLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="ConnectionDiagnostic" 
        options={{ 
          headerShown: true,
          title: 'Connection Diagnostic',
          headerStyle: {
            backgroundColor: '#22330B',
          },
          headerTintColor: '#fff',
        }} 
      />
    </Stack>
  );
}


