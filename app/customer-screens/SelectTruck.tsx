import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { COLORS, DIMENSIONS, MOCKED_TRUCKS } from '../../constants';

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
      pathname: '/customer-screens/RecyclerProfileDetails' as any,
      params: {
        recyclerId: truck.recyclerId,
        pickup: pickup
      }
    });
  };

  return (
    <View style={styles.container}>
      {/* Header and Logo */}
      <View>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Image
              source={require('../../assets/images/logo landscape.png')}
              style={styles.headerLogo}
            />
          </View>
        </View>

        {/* Banner with Filter Buttons */}
        <View style={styles.bannerBg}>
          <Image
            source={require('../../assets/images/blend.jpg')}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.filterContainerOverlay}>
            {['all', 'Big Truck', 'Small Truck'].map(filter => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  selectedFilter === filter && styles.filterButtonActive
                ]}
                onPress={() => handleFilterPress(filter as any)}
              >
                {filter !== 'all' && (
                  <Image
                    source={
                      filter === 'Big Truck'
                                      ? require('../../assets/images/truck.png')
              : require('../../assets/images/small truck.png')
                    }
                    style={styles.filterIcon}
                  />
                )}
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedFilter === filter && styles.filterButtonTextActive
                  ]}
                >
                  {filter === 'all' ? 'All' : filter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Pickup Point */}
        <Text style={styles.pickupText}>
          Pickup Point: <Text style={{ fontWeight: 'bold' }}>{pickup}</Text>
        </Text>
      </View>

      {/* Scrollable Trucks */}
      <ScrollView style={styles.scrollArea} contentContainerStyle={{ paddingBottom: 32 }}>
        {filteredTrucks.map(truck => (
          <View key={truck.id} style={styles.truckCard}>
            <View style={styles.truckRow}>
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
                onPress={() => handleTruckPress(truck)}
              >
                <Text style={styles.selectButtonText}>Select</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollArea: {
    flex: 1,
  },
  header: {
    backgroundColor: '#E3F0D5',
    paddingTop: 5, // Reduced even further to push header up more
    marginTop: 35, // Increased margin top even more
    marginBottom: 35, // Increased margin bottom even more
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 32, // Increased from 24
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center', // Center the logo horizontally
    width: '100%', // Take full width for proper centering
  },
  headerLogo: {
    width: 200, // Increased to 200 as requested
    height: 80, // Set to 80 as requested
    resizeMode: 'contain',
  },
  bannerBg: {
    position: 'relative',
    height: 120,
    marginBottom: 10,
    marginTop: -10, // Reduced further to prevent covering the logo
    borderRadius: 15, // Added rounded corners
    overflow: 'hidden', // Ensures the image respects the rounded corners
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  filterContainerOverlay: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    transform: [{ translateY: -20 }],
  },
  pickupText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: 'bold',
    color: COLORS.gray,
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  filterIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    resizeMode: 'contain',
  },
  truckCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: DIMENSIONS.padding,
    marginBottom: 12,
    padding: 16,
    borderRadius: DIMENSIONS.cardBorderRadius,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  truckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  truckImage: {
    width: 100,
    height: 100,
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
    fontSize: 14,
    color: COLORS.primary,
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
