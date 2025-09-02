import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

export default function TabLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ensure tabs are ready before rendering
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading tabs...</Text>
      </View>
    );
  }

  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => <Ionicons name="time" color={color} size={size} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="user"
        options={{
          title: 'User',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
          headerShown: false,
        }}
      />
    </Tabs>
  );
} 