import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, DIMENSIONS, MOCKED_TRUCKS } from '../constants';

export default function SelectTruckScreen() {
  const params = useLocalSearchParams();
  const pickup = params.pickup as string;
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'Big Truck' | 'Small Truck'>('all');

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
      
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 18, marginTop: 18 }}>
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
          onPress={() => handleFilterPress('all')}
        >
          <Text style={[styles.filterButtonText, selectedFilter === 'all' && styles.filterButtonTextActive]}>All</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === 'Big Truck' && styles.filterButtonActive]}
          onPress={() => handleFilterPress('Big Truck')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image source={require('../assets/images/truck.png')} style={{ width: 38, height: 38, marginRight: 8, resizeMode: 'contain' }} />
            <Text style={[styles.filterButtonText, selectedFilter === 'Big Truck' && styles.filterButtonTextActive]}>Big Truck</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === 'Small Truck' && styles.filterButtonActive]}
          onPress={() => handleFilterPress('Small Truck')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image source={require('../assets/images/small truck.png')} style={{ width: 38, height: 38, marginRight: 8, resizeMode: 'contain' }} />
            <Text style={[styles.filterButtonText, selectedFilter === 'Small Truck' && styles.filterButtonTextActive]}>Small Truck</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      {filteredTrucks.map(truck => (
        <TouchableOpacity key={truck.id} style={styles.truckCard}>
          <View style={styles.truckInfo}>
            <Image source={truck.image} style={styles.truckImage} />
            <View style={styles.truckDetails}>
              <Text style={styles.truckName}>{truck.name}</Text>
              <Text style={styles.truckType}>{truck.type}</Text>
              <Text style={styles.truckCapacity}>Rate: {truck.rate}</Text>
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingText}>Rating: {truck.rating}</Text>
                <Text style={styles.ratingStars}>{'★'.repeat(Math.floor(truck.rating))}</Text>
              </View>
            </View>
          </View>
          <View style={styles.truckActions}>
            <Text style={styles.priceText}>{truck.rate}</Text>
            <TouchableOpacity 
              style={styles.selectButton} 
              onPress={(e) => {
                e.stopPropagation();
                handleTruckPress(truck);
              }}
            >
              <Text style={styles.selectButtonText}>Select</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  bannerBg: {
    position: 'relative',
    height: 120,
    marginBottom: 20,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  headerCard: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.borderRadius,
    paddingHorizontal: 24,
    paddingVertical: 12,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  pickupText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 20,
  },
  filterButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: DIMENSIONS.borderRadius,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    color: COLORS.gray,
    fontWeight: 'bold',
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  truckCard: {
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.cardBorderRadius,
    padding: 16,
    marginHorizontal: DIMENSIONS.padding,
    marginBottom: 12,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  truckInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  truckImage: {
    width: 80,
    height: 80,
    borderRadius: DIMENSIONS.borderRadius,
    marginRight: 12,
  },
  truckDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  truckName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  truckType: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  truckCapacity: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: COLORS.gray,
    marginRight: 8,
  },
  ratingStars: {
    color: COLORS.secondary,
    fontSize: 14,
  },
  truckActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  selectButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: DIMENSIONS.borderRadius,
  },
  selectButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
}); 