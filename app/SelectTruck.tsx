import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, DIMENSIONS, MOCKED_TRUCKS } from './utils/constants';



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

  const handleTruckPress = (truck: any) => {
    router.push({
      pathname: '/RecyclerProfileDetails',
      params: { 
        recyclerId: truck.recyclerId,
        pickup: pickup
      }
    });
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
        <TouchableOpacity 
          key={truck.id} 
          style={styles.truckItem}
          onPress={() => handleTruckPress(truck)}
        >
          <View style={styles.truckContent}>
            <Image source={truck.image} style={styles.truckImage} />
            <View style={styles.truckInfo}>
              <Text style={styles.truckEta}>{truck.eta}</Text>
              <Text style={styles.truckType}>{truck.type}</Text>
              <Text style={styles.truckRate}>{truck.rate}</Text>
            </View>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>⭐ {truck.rating}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
      
      {/* No trucks message when filtered list is empty */}
      {filteredTrucks.length === 0 && (
        <View style={styles.noTrucksContainer}>
          <Text style={styles.noTrucksText}>No {selectedFilter === 'all' ? '' : selectedFilter.toLowerCase()} available at the moment</Text>
        </View>
      )}
      
      <Text style={{ color: COLORS.darkGreen, fontSize: 15, marginTop: 18, textAlign: 'center' }}>
        Tap on a truck to view recycler details and confirm pickup.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
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
    color: COLORS.darkGreen,
    textAlign: 'center',
    marginBottom: 8,
  },
  pickupText: {
    color: COLORS.darkGreen,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  filterButton: {
    backgroundColor: COLORS.lightGreen,
    borderRadius: 18,
    marginRight: 12,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  filterButtonActive: {
    backgroundColor: COLORS.secondary,
  },
  filterButtonText: {
    color: COLORS.darkGreen,
    fontWeight: 'bold',
    fontSize: 16,
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  truckItem: {
    backgroundColor: COLORS.white,
    marginHorizontal: 18,
    marginBottom: 12,
    padding: 16,
    borderRadius: DIMENSIONS.borderRadius,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  truckContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  truckImage: {
    width: 54,
    height: 38,
    resizeMode: 'contain',
    marginRight: 12,
  },
  truckInfo: {
    flex: 1,
  },
  truckEta: {
    color: COLORS.darkGreen,
    fontSize: 16,
    fontWeight: 'bold',
  },
  truckType: {
    color: COLORS.gray,
    fontSize: 14,
    marginTop: 2,
  },
  truckRate: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  ratingContainer: {
    backgroundColor: COLORS.lightGreen,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  noTrucksContainer: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  noTrucksText: {
    color: COLORS.gray,
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 