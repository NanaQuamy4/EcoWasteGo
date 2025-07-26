import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

const MOCKED_TRUCKS = [
  { id: 1, type: 'Big Truck', image: require('../assets/images/truck.png'), eta: '5mins from your location' },
  { id: 2, type: 'Small Truck', image: require('../assets/images/small truck.png'), eta: '10mins from your location' },
  { id: 3, type: 'Small Truck', image: require('../assets/images/small truck.png'), eta: '2mins from your location' },
  { id: 4, type: 'Big Truck', image: require('../assets/images/truck.png'), eta: '5mins from your location' },
];

export default function SelectTruckScreen() {
  const params = useLocalSearchParams();
  const pickup = params.pickup as string;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.bannerBg}>
        <Image
          source={require('../assets/images/blend.jpg')}
          style={styles.bannerImage}
          resizeMode="cover"
        />
        <View style={styles.headerCard}>
          <Text style={styles.header}>Select a Truck</Text>
        </View>
      </View>
      <Text style={styles.pickupText}>Pickup Point: <Text style={{ fontWeight: 'bold' }}>{pickup}</Text></Text>
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 18, marginTop: 18 }}>
        <View style={{ backgroundColor: '#E3F0D5', borderRadius: 18, marginRight: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 8 }}>
            <Image source={require('../assets/images/truck.png')} style={{ width: 38, height: 38, marginRight: 8, resizeMode: 'contain' }} />
            <Text style={{ color: '#22330B', fontWeight: 'bold', fontSize: 16 }}>Big Truck</Text>
          </View>
        </View>
        <View style={{ backgroundColor: '#E3F0D5', borderRadius: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 8 }}>
            <Image source={require('../assets/images/small truck.png')} style={{ width: 38, height: 38, marginRight: 8, resizeMode: 'contain' }} />
            <Text style={{ color: '#22330B', fontWeight: 'bold', fontSize: 16 }}>Smaller Truck</Text>
          </View>
        </View>
      </View>
      {MOCKED_TRUCKS.map(truck => (
        <View key={truck.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <Image source={truck.image} style={{ width: 54, height: 38, resizeMode: 'contain', marginRight: 12 }} />
          <Text style={{ color: '#22330B', fontSize: 16 }}>{truck.eta}</Text>
        </View>
      ))}
      <Text style={{ color: '#22330B', fontSize: 15, marginTop: 18, textAlign: 'center' }}>
        You can select your preferred truck.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  bannerBg: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 0,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: 70,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  headerCard: {
    backgroundColor: 'transparent',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    position: 'absolute',
    left: 18,
    right: 18,
    top: 30,
    zIndex: 2,
    alignItems: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#22330B',
    textAlign: 'center',
    marginBottom: 8,
  },
  pickupText: {
    color: '#263A13',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
}); 