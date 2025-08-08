import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, DIMENSIONS, RECYCLER_DATA } from '../../constants';
import CommonHeader from '../components/CommonHeader';

interface RecyclerData {
  id: string;
  name: string;
  truckType: string;
  truckId: string;
  color: string;
  rate: string;
  pastPickups: number;
  rating: number;
  image: any;
}

export default function RecyclerProfileDetailsScreen() {
  const params = useLocalSearchParams();
  const recyclerId = params.recyclerId as string;
  const pickup = params.pickup as string;

  // Use centralized recycler data
  const recyclerData: RecyclerData = {
    id: recyclerId,
    name: RECYCLER_DATA.name,
    truckType: RECYCLER_DATA.truckType,
    truckId: RECYCLER_DATA.recyclerId,
    color: RECYCLER_DATA.color,
    rate: RECYCLER_DATA.rate,
    pastPickups: RECYCLER_DATA.pastPickups,
    rating: RECYCLER_DATA.rating,
                image: require('../../assets/images/truck.png')
  };

  const handleConfirm = () => {
    // Navigate to waiting screen
    router.push({
      pathname: '/customer-screens/WaitingForRecycler' as any,
      params: { 
        recyclerName: recyclerData.name,
        pickup: pickup
      }
    });
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <CommonHeader title="Recycler Profile Details" />

      {/* Pickup Location */}
      <Text style={styles.pickupText}>
        Pickup Point: <Text style={{ fontWeight: 'bold' }}>{pickup}</Text>
      </Text>

      {/* Recycler Details Card */}
      <View style={styles.detailsCard}>
        {/* Recycler Name with Rating */}
        <View style={styles.nameRow}>
          <View style={styles.nameContainer}>
            <View style={styles.profileImageContainer}>
              <Image 
                source={require('../../assets/images/_MG_2771.jpg')} 
                style={styles.profileImage} 
              />
            </View>
            <Text style={styles.recyclerName}>{recyclerData.name}</Text>
          </View>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>⭐ {recyclerData.rating}</Text>
          </View>
        </View>

        {/* Truck Type */}
        <View style={styles.detailRow}>
          <Image source={recyclerData.image} style={styles.truckIcon} />
          <Text style={styles.detailText}>{recyclerData.truckType}</Text>
        </View>

        {/* Truck ID */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>ID:</Text>
          <Text style={styles.detailText}>{recyclerData.truckId}</Text>
        </View>

        {/* Color */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Color:</Text>
          <Text style={styles.detailText}>{recyclerData.color}</Text>
        </View>

        {/* Rate */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Rate:</Text>
          <Text style={styles.detailText}>{recyclerData.rate}</Text>
        </View>

        {/* Past Pickups */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Past Pickups:</Text>
          <Text style={styles.detailText}>{recyclerData.pastPickups} Pickups</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>CANCEL</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>CONFIRM</Text>
        </TouchableOpacity>
      </View>
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

  pickupText: {
    color: COLORS.darkGreen,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 18,
    marginTop: 8,
  },
  detailsCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 18,
    marginBottom: 24,
    padding: 20,
    borderRadius: DIMENSIONS.borderRadius,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recyclerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  ratingContainer: {
    backgroundColor: COLORS.lightGreen,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  truckIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
    resizeMode: 'contain',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    width: 80,
  },
  detailText: {
    fontSize: 16,
    color: COLORS.darkGreen,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 18,
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: COLORS.secondary,
    paddingVertical: 16,
    borderRadius: DIMENSIONS.borderRadius,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.red,
    paddingVertical: 16,
    borderRadius: DIMENSIONS.borderRadius,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
}); 