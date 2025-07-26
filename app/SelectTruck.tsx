import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const MOCKED_TRUCKS = [
  { id: 1, type: 'Big Truck', image: require('../assets/images/truck.png'), eta: '5mins from your location' },
  { id: 2, type: 'Small Truck', image: require('../assets/images/small truck.png'), eta: '10mins from your location' },
  { id: 3, type: 'Small Truck', image: require('../assets/images/small truck.png'), eta: '2mins from your location' },
  { id: 4, type: 'Big Truck', image: require('../assets/images/truck.png'), eta: '5mins from your location' },
];

export default function SelectTruckScreen() {
  const params = useLocalSearchParams();
  const pickup = params.pickup as string;
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'Big Truck' | 'Small Truck'>('all');

  // Filter trucks based on selected filter
  const filteredTrucks = MOCKED_TRUCKS.filter(truck => {
    if (selectedFilter === 'all') return true;
    return truck.type === selectedFilter;
  });

  const handleFilterPress = (filter: 'all' | 'Big Truck' | 'Small Truck') => {
    setSelectedFilter(filter);
  };

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
      
      {/* Filter Buttons */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 18, marginTop: 18 }}>
        {/* All Trucks Button */}
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            selectedFilter === 'all' && styles.filterButtonActive
          ]}
          onPress={() => handleFilterPress('all')}
        >
          <Text style={[
            styles.filterButtonText,
            selectedFilter === 'all' && styles.filterButtonTextActive
          ]}>All</Text>
        </TouchableOpacity>
        
        {/* Big Truck Button */}
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            selectedFilter === 'Big Truck' && styles.filterButtonActive
          ]}
          onPress={() => handleFilterPress('Big Truck')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image source={require('../assets/images/truck.png')} style={{ width: 38, height: 38, marginRight: 8, resizeMode: 'contain' }} />
            <Text style={[
              styles.filterButtonText,
              selectedFilter === 'Big Truck' && styles.filterButtonTextActive
            ]}>Big Truck</Text>
          </View>
        </TouchableOpacity>
        
        {/* Small Truck Button */}
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            selectedFilter === 'Small Truck' && styles.filterButtonActive
          ]}
          onPress={() => handleFilterPress('Small Truck')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image source={require('../assets/images/small truck.png')} style={{ width: 38, height: 38, marginRight: 8, resizeMode: 'contain' }} />
            <Text style={[
              styles.filterButtonText,
              selectedFilter === 'Small Truck' && styles.filterButtonTextActive
            ]}>Small Truck</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Filtered Truck List */}
      {filteredTrucks.map(truck => (
        <View key={truck.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <Image source={truck.image} style={{ width: 54, height: 38, resizeMode: 'contain', marginRight: 12 }} />
          <Text style={{ color: '#22330B', fontSize: 16 }}>{truck.eta}</Text>
        </View>
      ))}
      
      {/* No trucks message when filtered list is empty */}
      {filteredTrucks.length === 0 && (
        <View style={styles.noTrucksContainer}>
          <Text style={styles.noTrucksText}>No {selectedFilter === 'all' ? '' : selectedFilter.toLowerCase()} available at the moment</Text>
        </View>
      )}
      
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
  filterButton: {
    backgroundColor: '#E3F0D5',
    borderRadius: 18,
    marginRight: 12,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
  },
  filterButtonText: {
    color: '#22330B',
    fontWeight: 'bold',
    fontSize: 16,
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  noTrucksContainer: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  noTrucksText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 