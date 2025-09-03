import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../constants';

// ===== MOCK DATA FOR PAYMENT MADE SCREEN =====
// This replaces the backend API calls with local mock data
// In a real app, this would come from a database or payment service

// Mock payment data
const mockPaymentData = {
  id: "pay_001",
  requestId: "req_001",
  amount: 250,
  currency: "₵",
  wasteType: "Mixed Waste",
  weight: "8 kg",
  recyclerName: "Green Team",
  recyclerRating: 4.8,
  paymentMethod: "Mobile Money",
  transactionId: "TXN123456789",
  status: "completed",
  completedAt: "2024-01-15T14:30:00Z",
  pickupAddress: "123 Main Street, Accra Central"
};

// Mock recycler review data
const mockReviewData = {
  rating: 0,
  comment: "",
  submitted: false
};

export default function PaymentMade() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    requestId?: string;
    amount?: string;
    recyclerName?: string;
    wasteType?: string;
    weight?: string;
  }>();

  // ===== LOCAL STATE MANAGEMENT =====
  // These state variables manage the UI state and data
  const [paymentData, setPaymentData] = useState<any>(null);
  const [reviewData, setReviewData] = useState(mockReviewData);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // ===== INITIALIZATION EFFECT =====
  // This effect runs when the component first loads
  useEffect(() => {
    loadMockData();
  }, []);

  // ===== MOCK DATA LOADING FUNCTION =====
  // This replaces the backend API call to fetch payment data
  // It loads data from our mock data arrays
  const loadMockData = async () => {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create payment data from params or use mock data
      const payment = {
        ...mockPaymentData,
        amount: parseFloat(params.amount || mockPaymentData.amount.toString()),
        recyclerName: params.recyclerName || mockPaymentData.recyclerName,
        wasteType: params.wasteType || mockPaymentData.wasteType,
        weight: params.weight || mockPaymentData.weight,
        requestId: params.requestId || mockPaymentData.requestId
      };
      
      setPaymentData(payment);
      console.log('PaymentMade: Mock data loaded successfully');
    } catch (error) {
      console.error('PaymentMade: Error loading mock data:', error);
      // Fallback to default mock data
      setPaymentData(mockPaymentData);
    }
  };

  // ===== MOCK ACTION HANDLERS =====
  // These functions handle user actions
  
  // Submit recycler review
  const handleSubmitReview = async () => {
    if (reviewData.rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    if (!reviewData.comment.trim()) {
      Alert.alert('Comment Required', 'Please add a comment to your review.');
      return;
    }

    setIsSubmittingReview(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update mock review data
      const updatedReview = {
        ...reviewData,
        submitted: true
      };
      
      setReviewData(updatedReview);
      setShowSuccessMessage(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      
      console.log('PaymentMade: Review submitted successfully');
      
      Alert.alert(
        'Review Submitted!',
        'Thank you for your feedback. Your review helps other customers choose the best recyclers.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Handle rating selection
  const handleRatingSelect = (rating: number) => {
    setReviewData(prev => ({ ...prev, rating }));
  };

  // Handle comment change
  const handleCommentChange = (comment: string) => {
    setReviewData(prev => ({ ...prev, comment }));
  };

  // Navigate to home
  const handleGoHome = () => {
    // TEMPORARILY DISABLED - Let the app follow the intended flow
    console.log('PaymentMade: Auto-navigation DISABLED');
    // router.replace('/(tabs)');
  };

  // Schedule another pickup
  const handleSchedulePickup = () => {
    router.push('/customer-screens/SelectTruck');
  };

  if (!paymentData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading payment details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoHome} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.darkGreen} />
        </TouchableOpacity>
        
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/images/logo landscape.png')} 
            style={styles.logoLandscape}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.headerRight} />
      </View>

      {/* Payment Made Banner */}
      <View style={styles.bannerSection}>
        <View style={styles.imageRectangle}>
          <Image
            source={require('../../assets/images/blend.jpg')}
            style={styles.blendImage}
            resizeMode="cover"
          />
          <View style={styles.paymentPill}>
            <Text style={styles.paymentText}>Payment Made</Text>
          </View>
        </View>
      </View>

      {/* Simple Payment Confirmation */}
      <View style={styles.confirmationCard}>
        <Text style={styles.greetingText}>
          Thank you for choosing <Text style={styles.brandText}>EcoWasteGo.</Text>
        </Text>
        <Text style={styles.instructionText}>
          You can make your payment through{'\n'}
          <Text style={styles.boldText}>Momo</Text> or <Text style={styles.boldText}>Cash</Text> to your <Text style={styles.boldText}>Recycler</Text>.
        </Text>
      </View>

      {/* Payment Made Button */}
      <TouchableOpacity style={styles.paymentButton} onPress={() => router.push('/customer-screens/EcoImpactCelebration')}>
        <Text style={styles.paymentButtonText}>PAYMENT MADE</Text>
      </TouchableOpacity>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/customer-screens/HomeScreen')}>
          <MaterialIcons name="home" size={28} color="#22330B" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/customer-screens/history')}>
          <MaterialIcons name="history" size={28} color="#22330B" />
          <Text style={styles.navLabel}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/user')}>
          <MaterialIcons name="person" size={28} color="#22330B" />
          <Text style={styles.navLabel}>User</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    textAlign: 'center',
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    flex: 1,
  },
  logoLandscape: {
    width: 180,
    height: 60,
  },
  headerRight: {
    width: 40,
  },
  bannerSection: {
    height: 100,
    backgroundColor: COLORS.background,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 20,
    margin: 16,
  },
  imageRectangle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 0,
    overflow: 'hidden',
  },
  blendImage: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
    opacity: 0.8,
  },
  paymentPill: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -50 }],
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    paddingHorizontal: 20,
    marginTop: 20,
    paddingVertical: 10,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignSelf: 'center',
  },
  paymentText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
  },
  confirmationCard: {
    backgroundColor: '#CFDFBF',
    margin: 16,
    borderRadius: 16,
    padding: 24,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 16,
    color: COLORS.darkGreen,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  brandText: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  instructionText: {
    fontSize: 14,
    color: COLORS.darkGreen,
    textAlign: 'center',
    lineHeight: 20,
  },
  boldText: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  paymentButton: {
    backgroundColor: COLORS.primary,
    margin: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 80, // Space for bottom navigation
  },
  paymentButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navLabel: {
    fontSize: 12,
    color: '#22330B',
    marginTop: 4,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.darkGreen,
  },
});
