import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { COLORS, DIMENSIONS } from '../../constants';
import { apiService } from '../../services/apiService';

interface RecyclerData {
  id: string;
  business_name?: string;
  vehicle_type?: string;
  rating: number;
  total_collections: number;
  is_available: boolean;
  service_areas?: string[];
  city?: string;
  state?: string;
  address?: string;
  profile_image?: string;
  distance?: number;
  eta?: string;
  rate?: string;
  phone?: string;
  email?: string;
  experience_years?: number;
  specialties?: string[];
}

export default function RecyclerProfileDetailsScreen() {
  const params = useLocalSearchParams();
  const recyclerId = params.recyclerId as string;
  const pickup = params.pickup as string;
  const distance = params.distance as string;
  const eta = params.eta as string;
  const rate = params.rate as string;

  const [recycler, setRecycler] = useState<RecyclerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  // Fetch recycler details
  useEffect(() => {
    const fetchRecyclerDetails = async () => {
      try {
        setLoading(true);
        const recyclers = await apiService.getRecyclers();
        const foundRecycler = recyclers.find(r => r.id === recyclerId);
        
        if (foundRecycler) {
          // Enhance with additional data from SelectTruck screen
          const enhancedRecycler: RecyclerData = {
            ...foundRecycler,
            distance: distance ? parseFloat(distance) : undefined,
            eta: eta || undefined,
            rate: rate || 'GHS 1.00/kg', // Use rate from params, fallback to default
            // Add mock data for missing fields (in real app, these would come from API)
            phone: '+233 50 123 4567',
            email: 'recycler@ecowastego.com',
            experience_years: Math.floor(Math.random() * 10) + 2,
            specialties: ['Plastic', 'Paper', 'Metal', 'Glass'],
          };
          setRecycler(enhancedRecycler);
        } else {
          Alert.alert('Error', 'Recycler not found');
          router.back();
        }
      } catch (error) {
        console.error('Error fetching recycler details:', error);
        Alert.alert('Error', 'Failed to load recycler details');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchRecyclerDetails();
  }, [recyclerId]);

  const handleConfirm = async () => {
    if (!recycler) return;
    
    setConfirming(true);
    
    try {
      // Create waste collection request
      const wasteCollectionData = {
        waste_type: 'mixed' as const, // Default waste type
        weight: 10, // Default weight in kg
        description: `Pickup request from ${pickup}`,
        pickup_date: new Date().toISOString().split('T')[0], // Today's date
        pickup_time: new Date().toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        address: pickup,
        special_instructions: `Customer confirmed pickup. Distance: ${distance}, ETA: ${eta}, Rate: ${rate}`
      };

      const collection = await apiService.createWasteCollection(wasteCollectionData);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Navigate to waiting screen with additional data
      router.push({
        pathname: '/customer-screens/WaitingForRecycler' as any,
        params: {
          recyclerName: recycler.business_name || 'Recycler',
          pickup: pickup,
          recyclerId: recyclerId,
          distance: distance,
          eta: eta,
          collectionId: collection.id
        }
      });
    } catch (error) {
      console.error('Error creating pickup request:', error);
      Alert.alert(
        'Error',
        'Failed to create pickup request. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setConfirming(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Pickup',
      'Are you sure you want to cancel this pickup?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: () => router.back() }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading recycler details...</Text>
      </View>
    );
  }

  if (!recycler) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Recycler not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recycler Profile</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Pickup Location Card */}
      <View style={styles.pickupCard}>
        <Text style={styles.pickupLabel}>📍 Pickup Location</Text>
        <Text style={styles.pickupLocation}>{pickup}</Text>
      </View>

      {/* Recycler Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <Image 
            source={require('../../assets/images/_MG_2771.jpg')} 
            style={styles.profileImage} 
          />
          <View style={styles.profileInfo}>
            <Text style={styles.recyclerName}>
              {recycler.business_name || 'Professional Recycler'}
            </Text>
            <View style={styles.ratingRow}>
              <Text style={styles.ratingText}>⭐ {recycler.rating.toFixed(1)}</Text>
              <Text style={styles.ratingCount}>({recycler.total_collections} collections)</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{recycler.experience_years}+</Text>
            <Text style={styles.statLabel}>Years</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{recycler.total_collections}</Text>
            <Text style={styles.statLabel}>Collections</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{recycler.rating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>
      </View>

      {/* Vehicle Information Card */}
      <View style={styles.vehicleCard}>
        <Text style={styles.cardTitle}>🚛 Vehicle Information</Text>
        
        <View style={styles.vehicleRow}>
          <Image 
            source={
              recycler.vehicle_type === 'Small Truck' 
                ? require('../../assets/images/small truck.png')
                : require('../../assets/images/truck.png')
            } 
            style={styles.vehicleIcon} 
          />
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleType}>{recycler.vehicle_type || 'Recycling Truck'}</Text>
            <Text style={styles.vehicleCapacity}>
              {recycler.vehicle_type === 'Big Truck' ? 'Large capacity' : 'Compact & agile'}
            </Text>
          </View>
        </View>

        {/* Distance and ETA */}
        {recycler.distance && (
          <View style={styles.distanceSection}>
            <View style={styles.distanceRow}>
              <Text style={styles.distanceLabel}>📍 Distance:</Text>
              <Text style={styles.distanceValue}>{recycler.distance} km</Text>
            </View>
            <View style={styles.etaRow}>
              <Text style={styles.etaLabel}>⏱️ Estimated Arrival:</Text>
              <Text style={styles.etaValue}>{recycler.eta}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Service Details Card */}
      <View style={styles.serviceCard}>
        <Text style={styles.cardTitle}>💰 Service Details</Text>
        
        <View style={styles.serviceRow}>
          <Text style={styles.serviceLabel}>Rate per kg:</Text>
          <Text style={styles.serviceValue}>{recycler.rate}</Text>
        </View>

        <View style={styles.serviceRow}>
          <Text style={styles.serviceLabel}>Service Areas:</Text>
          <Text style={styles.serviceValue}>
            {recycler.service_areas?.join(', ') || recycler.city || 'City-wide service'}
          </Text>
        </View>

        <View style={styles.serviceRow}>
          <Text style={styles.serviceLabel}>Specialties:</Text>
          <Text style={styles.serviceValue}>
            {recycler.specialties?.join(', ') || 'All waste types'}
          </Text>
        </View>
      </View>

      {/* Contact Information Card */}
      <View style={styles.contactCard}>
        <Text style={styles.cardTitle}>📞 Contact Information</Text>
        
        <View style={styles.contactRow}>
          <Text style={styles.contactLabel}>Phone:</Text>
          <Text style={styles.contactValue}>{recycler.phone}</Text>
        </View>

        <View style={styles.contactRow}>
          <Text style={styles.contactLabel}>Email:</Text>
          <Text style={styles.contactValue}>{recycler.email}</Text>
        </View>

        <View style={styles.contactRow}>
          <Text style={styles.contactLabel}>Location:</Text>
          <Text style={styles.contactValue}>
            {[recycler.city, recycler.state].filter(Boolean).join(', ') || 'City area'}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={handleCancel}
          disabled={confirming}
        >
          <Text style={styles.cancelButtonText}>CANCEL</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.confirmButton, confirming && styles.confirmButtonDisabled]} 
          onPress={handleConfirm}
          disabled={confirming}
        >
          {confirming ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.confirmButtonText}>CONFIRM PICKUP</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Confirmation Note */}
      <View style={styles.noteContainer}>
        <Text style={styles.noteText}>
          💡 By confirming, you agree to the pickup service. The recycler will contact you shortly.
        </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  pickupCard: {
    backgroundColor: COLORS.lightGray,
    padding: 18,
    marginHorizontal: 18,
    marginBottom: 24,
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
  pickupLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  pickupLocation: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  profileCard: {
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  recyclerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  ratingCount: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  vehicleCard: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 15,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  vehicleIcon: {
    width: 30,
    height: 30,
    marginRight: 10,
    resizeMode: 'contain',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  vehicleCapacity: {
    fontSize: 14,
    color: COLORS.gray,
  },
  distanceSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  distanceLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    width: 100,
  },
  distanceValue: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  etaLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    width: 100,
  },
  etaValue: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  serviceCard: {
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
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  serviceLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  serviceValue: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  contactCard: {
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
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  contactValue: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: 'bold',
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
  confirmButtonDisabled: {
    backgroundColor: COLORS.gray,
    opacity: 0.7,
  },
  noteContainer: {
    backgroundColor: COLORS.lightGray,
    padding: 18,
    marginHorizontal: 18,
    marginBottom: 24,
    borderRadius: DIMENSIONS.borderRadius,
    alignItems: 'center',
  },
  noteText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.darkGreen,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.red,
    textAlign: 'center',
    marginBottom: 20,
  },
}); 