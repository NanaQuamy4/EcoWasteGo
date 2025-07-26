import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

  // Mock data - in a real app, this would come from an API
  const recyclerData: RecyclerData = {
    id: recyclerId,
    name: "GreenFleet GH",
    truckType: "Big Truck",
    truckId: "EWG-ASH-TK-0823",
    color: "Green and yellow",
    rate: "GHS 1.20/kg",
    pastPickups: 314,
    rating: 4.8,
    image: require('../assets/images/truck.png')
  };

  const handleConfirm = () => {
    // Navigate to waiting screen
    router.push({
      pathname: '/WaitingForRecycler',
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
      {/* Header Banner */}
      <View style={styles.bannerBg}>
        <Image
          source={require('../assets/images/blend.jpg')}
          style={styles.bannerImage}
          resizeMode="cover"
        />
        <View style={styles.headerCard}>
          <Text style={styles.header}>Recycler Profile Details</Text>
        </View>
      </View>

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
                source={require('../assets/images/_MG_2771.jpg')} 
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
    marginBottom: 18,
    marginTop: 8,
  },
  detailsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 18,
    marginBottom: 24,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
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
    color: '#22330B',
  },
  ratingContainer: {
    backgroundColor: '#E3F0D5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#22330B',
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
    color: '#22330B',
    width: 80,
  },
  detailText: {
    fontSize: 16,
    color: '#22330B',
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
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f44336',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#4CAF50',
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