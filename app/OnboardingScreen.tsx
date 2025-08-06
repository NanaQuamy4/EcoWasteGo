import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

const slides = [
  {
    key: 'slide1',
    image: require('../assets/images/locate.png'),
    title: 'Request a Recycler',
    description: '',
  },
  {
    key: 'slide2',
    image: require('../assets/images/Onboard2.jpg'),
    title: 'Track Your Pickup',
    description: 'Know where your agent is. Real-time tracking keeps you in the loop',
  },
  {
    key: 'slide3',
    image: require('../assets/images/Onboard4.jpg'),
    title: 'WASTE FREE ECOSYSTEM',
    description: '',
    button: true,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(slideIndex);
  };

  const handleSkip = () => {
    scrollRef.current?.scrollTo({ x: width * (slides.length - 1), animated: true });
  };

  const handleGetStarted = () => {
    router.push('/RegisterScreen');
  };

  return (
    <View style={styles.container}>
      {currentIndex !== slides.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {slides.map((slide, idx) => (
          <View style={styles.slide} key={slide.key}>
            {idx === 0 ? (
              <View style={styles.pinImageContainer}>
                <Image source={slide.image} style={styles.pinImage} />
              </View>
            ) : (
              <View style={styles.cardImageContainer}>
                <Image source={slide.image} style={styles.cardImage} />
              </View>
            )}
            <Text style={[styles.title, idx === 2 && styles.ecoTitle]}>{slide.title}</Text>
            {slide.description ? <Text style={styles.description}>{slide.description}</Text> : null}
            {slide.button && (
              <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
                <Text style={styles.getStartedText}>Get Started</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
      <View style={styles.pagination}>
        {slides.map((_, idx) => (
          <View
            key={idx}
            style={[styles.dot, currentIndex === idx && styles.activeDot]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative',
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 24,
    zIndex: 2,
  },
  skipText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  pinImage: {
    width: 500,
    height: 260,
    resizeMode: 'contain',
    marginBottom: 40,
  },
  slideImage: {
    width: width - 80,
    height: 220,
    resizeMode: 'contain',
    borderRadius: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  ecoTitle: {
    fontSize: 25,
    color: '#207E06',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#444',
    textAlign: 'center',
    marginHorizontal: 32,
    marginBottom: 24,
  },
  getStartedButton: {
    backgroundColor: '#223E01',
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingVertical: 12,
    marginTop: 16,
  },
  getStartedText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 40,
    width: '100%',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ccc',
    marginHorizontal: 6,
  },
  activeDot: {
    backgroundColor: '#22330B',
  },
  pinImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  cardImageContainer: {
    width: width - 48,
    height: 260,
    backgroundColor: '#fff',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  cardImage: {
    width: width - 40,
    height: 320,
    resizeMode: 'cover',
    borderRadius: 40,
    marginBottom: 40,
  },
}); 