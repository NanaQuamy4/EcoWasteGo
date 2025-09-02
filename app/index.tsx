import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    console.log('Index: Component mounted - forcing navigation to SplashScreen');
    
    // Force navigation to splash screen immediately
    const timer = setTimeout(() => {
      console.log('Index: Navigating to SplashScreen');
      router.replace('/SplashScreen');
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#207E06' }}>
      <Text style={{ color: 'white', fontSize: 18 }}>Starting EcoWasteGo...</Text>
    </View>
  );
}
