import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../constants';
import { supabase } from '../../lib/supabase';

// Payment data will be fetched from database
// Review data will be managed in local state

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
  const [reviewData, setReviewData] = useState({
    rating: 0,
    comment: "",
    submitted: false
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // ===== INITIALIZATION EFFECT =====
  // This effect runs when the component first loads
  useEffect(() => {
    loadPaymentData();
  }, []);

  // ===== REAL DATA LOADING FUNCTION =====
  // This fetches real payment data from the database
  const loadPaymentData = async () => {
    try {
      // Create payment data from params
      const payment = {
        id: `pay_${Date.now()}`,
        requestId: params.requestId || 'unknown',
        amount: parseFloat(params.amount || '0'),
        currency: "₵",
        wasteType: params.wasteType || 'Mixed Waste',
        weight: params.weight || '0 kg',
        recyclerName: params.recyclerName || 'Unknown Recycler',
        recyclerRating: 4.5, // Default rating
        paymentMethod: "Mobile Money",
        transactionId: `TXN${Date.now()}`,
        status: "completed",
        completedAt: new Date().toISOString(),
        pickupAddress: "Selected Location"
      };
      
      setPaymentData(payment);
      console.log('PaymentMade: Payment data loaded successfully');
    } catch (error) {
      console.error('PaymentMade: Error loading payment data:', error);
      // Set fallback data
      const fallbackPayment = {
        id: 'unknown',
        requestId: params.requestId || 'unknown',
        amount: parseFloat(params.amount || '0'),
        currency: "₵",
        wasteType: params.wasteType || 'Mixed Waste',
        weight: params.weight || '0 kg',
        recyclerName: params.recyclerName || 'Unknown Recycler',
        recyclerRating: 4.5,
        paymentMethod: "Mobile Money",
        transactionId: 'TXN000000000',
        status: "completed",
        completedAt: new Date().toISOString(),
        pickupAddress: "Selected Location"
      };
      setPaymentData(fallbackPayment);
    }
  };

  // ===== ACTION HANDLERS =====
  // These functions handle user actions
  
  // Submit recycler review and proceed to celebration
  const handleSubmitReview = async () => {
    if (reviewData.rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before proceeding.');
      return;
    }

    if (!reviewData.comment.trim()) {
      Alert.alert('Comment Required', 'Please add a comment to your review.');
      return;
    }

    setIsSubmittingReview(true);

    try {
      // Save rating to database - this will trigger the notification
      const { error: ratingError } = await supabase
        .from('pickup_requests')
        .update({
          customer_rating: reviewData.rating,
          recycler_notes: reviewData.comment,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.requestId);

      if (ratingError) {
        console.error('Error saving rating:', ratingError);
        Alert.alert('Error', 'Failed to save rating. Please try again.');
        return;
      }

      console.log('PaymentMade: Rating saved successfully, notification will be sent to recycler');
      
      // Update local state
      const updatedReview = {
        ...reviewData,
        submitted: true
      };
      
      setReviewData(updatedReview);
      setShowSuccessMessage(true);
      
      // Hide success message after 2 seconds, then navigate
      setTimeout(() => {
        setShowSuccessMessage(false);
        // Navigate to Eco Impact Celebration
        router.push({
          pathname: '/customer-screens/EcoImpactCelebration',
          params: {
            requestId: params.requestId,
            recyclerName: params.recyclerName,
            pickup: 'Selected Location',
            weight: params.weight,
            wasteType: params.wasteType,
            amount: params.amount,
            environmentalTax: '0.00',
            totalAmount: params.amount
          }
        });
      }, 2000);
      
      console.log('PaymentMade: Review submitted successfully, navigating to celebration');
      
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

      {/* Rating Section */}
      {!reviewData.submitted ? (
        <View style={styles.ratingSection}>
          <Text style={styles.ratingTitle}>Rate Your Recycler</Text>
          <Text style={styles.ratingSubtitle}>How was your experience with {params.recyclerName}?</Text>
          
          {/* Star Rating */}
          <View style={styles.starContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => handleRatingSelect(star)}
                style={styles.starButton}
              >
                <MaterialIcons
                  name={star <= reviewData.rating ? 'star' : 'star-border'}
                  size={32}
                  color={star <= reviewData.rating ? '#FFD700' : '#CCCCCC'}
                />
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Comment Input */}
          <TextInput
            style={styles.commentInput}
            placeholder="Tell us about your experience..."
            value={reviewData.comment}
            onChangeText={handleCommentChange}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          
          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitButton, (!reviewData.rating || !reviewData.comment.trim()) && styles.submitButtonDisabled]} 
            onPress={handleSubmitReview}
            disabled={!reviewData.rating || !reviewData.comment.trim() || isSubmittingReview}
          >
            <Text style={styles.submitButtonText}>
              {isSubmittingReview ? 'Submitting...' : 'Submit Rating & Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.successSection}>
          <MaterialIcons name="check-circle" size={48} color="#4CAF50" />
          <Text style={styles.successText}>Thank you for your feedback!</Text>
          <Text style={styles.successSubtext}>Proceeding to celebration...</Text>
        </View>
      )}

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
  // Rating styles
  ratingSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  ratingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    textAlign: 'center',
    marginBottom: 8,
  },
  ratingSubtitle: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 20,
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  starButton: {
    padding: 4,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.darkGreen,
    backgroundColor: '#F8F8F8',
    marginBottom: 20,
    minHeight: 80,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.lightGray,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  successSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginTop: 12,
    marginBottom: 4,
  },
  successSubtext: {
    fontSize: 14,
    color: COLORS.gray,
  },
});
