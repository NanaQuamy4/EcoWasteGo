import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';

// Define the navigation type for the stack
// If you have a RootStackParamList, import it; otherwise, use 'any' for now

type RootStackParamList = {
  Splash: undefined;
  OnboardingScreen: undefined;
};

export default function SplashScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('OnboardingScreen');
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image source={require('../assets/images/logo.png')} style={styles.logo} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#207E06',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
}); 