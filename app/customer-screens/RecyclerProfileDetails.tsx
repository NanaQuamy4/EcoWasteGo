import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { COLORS } from '../../constants';

interface RecyclerData {
  id: string;
  name: string;
  vehicleType: string;
  vehicleId: string;
  vehicleColor: string;
  rate: string;
  pastPickups: number;
  rating: number;
}

export default function RecyclerProfileDetailsScreen() {
  const params = useLocalSearchParams();
  const recyclerId = params.recyclerId as string;
  const recyclerName = params.recyclerName as string;
  const recyclerRating = params.recyclerRating as string;
  const recyclerDistance = params.recyclerDistance as string;
  const vehicleType = params.vehicleType as string;
  const rate = params.rate as string;
  const requestId = params.requestId as string;

  const [recycler, setRecycler] = useState<RecyclerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  // ===== MOCK DATA LOADING FUNCTION =====
  const loadMockData = async () => {
    try {
      setLoading(true);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Create recycler data from params
      const recyclerData: RecyclerData = {
        id: recyclerId || 'recycler_001',
        name: recyclerName || 'GreenFleet GH',
        vehicleType: vehicleType || 'Big Truck',
        vehicleId: 'EWG-ASH-TK-0823',
        vehicleColor: 'Green and yellow',
        rate: rate || 'GHS 1.20/kg',
        pastPickups: 314,
        rating: parseFloat(recyclerRating) || 4.8
      };
      
      setRecycler(recyclerData);
    } catch (error) {
      console.error('Error loading mock data:', error);
      Alert.alert('Error', 'Failed to load recycler details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  // ===== INITIALIZATION EFFECT =====
  useEffect(() => {
    loadMockData();
  }, [recyclerId]);

  const handleConfirm = async () => {
    if (!recycler) return;
    
    setConfirming(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Navigate to waiting screen
      router.push({
        pathname: '/customer-screens/WaitingForRecycler',
        params: {
          requestId: requestId,
          recyclerId: recycler.id,
          recyclerName: recycler.name,
          recyclerRating: recycler.rating.toString(),
          recyclerDistance: recyclerDistance
        }
      });
    } catch (error) {
      console.error('Error confirming pickup:', error);
      Alert.alert(
        'Error',
        'Failed to confirm pickup. Please try again.',
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
        <TouchableOpacity style={styles.errorBackButton} onPress={() => router.back()}>
          <Text style={styles.errorBackButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Logo */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/images/logo landscape.png')} 
            style={styles.logo} 
          />
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Background Image Rectangle */}
      <View style={styles.backgroundImageContainer}>
        <Image
          source={require('../../assets/images/blend.jpg')}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        
        {/* Screen Title Banner Overlay */}
        <View style={styles.titleBanner}>
          <Text style={styles.titleText}>Recycler Profile Details</Text>
        </View>
      </View>

      {/* Recycler Information Section */}
      <View style={styles.infoSection}>
        {/* Recycler Name */}
        <View style={styles.infoRow}>
          <View style={styles.imageContainer}>
            <Image 
              source={require('../../assets/images/_MG_2771.jpg')} 
              style={styles.recyclerImage} 
            />
          </View>
          <Text style={styles.infoLabel}>{recycler.name}</Text>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeIcon}>🏆</Text>
          </View>
        </View>

        {/* Vehicle Type */}
        <View style={styles.infoRow}>
          <View style={styles.imageContainer}>
            <Image 
              source={
                recycler.vehicleType === 'Small Truck'
                  ? require('../../assets/images/small truck.png')
                  : require('../../assets/images/truck.png')
              } 
              style={styles.truckImage} 
            />
          </View>
          <Text style={styles.infoLabel}>{recycler.vehicleType}</Text>
        </View>

        {/* ID */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>ID:</Text>
          <Text style={styles.infoValue}>{recycler.vehicleId}</Text>
        </View>

        {/* Color */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Color:</Text>
          <Text style={styles.infoValue}>{recycler.vehicleColor}</Text>
        </View>

        {/* Rate */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Rate:</Text>
          <Text style={styles.infoValue}>{recycler.rate}</Text>
        </View>

        {/* Past Pickups */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Past Pickups:</Text>
          <Text style={styles.infoValue}>{recycler.pastPickups} Pickups</Text>
        </View>

        {/* Rating */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Rating:</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingValue}>{recycler.rating}</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Text key={star} style={[
                  styles.starIcon,
                  star <= Math.floor(recycler.rating) ? styles.starFilled : styles.starEmpty
                ]}>
                  ★
                </Text>
              ))}
            </View>
          </View>
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
            <Text style={styles.confirmButtonText}>CONFIRM</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Light gray background like in the image
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#ffffff', // Light green background
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 80,
    resizeMode: 'contain',
  },
  placeholder: {
    width: 40,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  backgroundImageContainer: {
    position: 'relative',
    height: 120,
    marginBottom: 30,
    marginHorizontal: 0,
    borderRadius: 10,
    overflow: 'hidden',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  titleBanner: {
    position: 'absolute',
    top: '50%',
    width: '70%',
    left: '15%',
    right: 0,
    backgroundColor: '#ffffff', // Light gray banner
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
    transform: [{ translateY: -20 }],
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  infoSection: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 20,
    borderRadius: 15,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    justifyContent: 'space-between',
  },
  imageContainer: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recyclerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  truckImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  infoLabel: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
    flex: 1,
    marginLeft: 10,
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.black,
    fontWeight: '500',
  },
  badgeContainer: {
    marginLeft: 10,
    backgroundColor: COLORS.primary, // Green background
    borderRadius: 15,
    padding: 0,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  badgeIcon: {
    fontSize: 16,
    color: '#000000', // Black trophy
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 30,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingValue: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  starIcon: {
    fontSize: 16,
  },
  starFilled: {
    color: COLORS.primary, // Green color for filled stars
  },
  starEmpty: {
    color: '#E0E0E0', // Light gray for empty stars
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonDisabled: {
    backgroundColor: COLORS.gray,
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.primary,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.red,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorBackButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  errorBackButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
}); 