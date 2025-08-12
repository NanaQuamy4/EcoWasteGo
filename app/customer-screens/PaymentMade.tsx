import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, Modal, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS, DIMENSIONS } from '../../constants';
import apiService from '../../services/apiService';
import CommonHeader from '../components/CommonHeader';

export default function PaymentMadeScreen() {
  const params = useLocalSearchParams();
  
  // Extract parameters from navigation
  const recyclerName = params.recyclerName as string;
  const pickup = params.pickup as string;
  const requestId = params.requestId as string;
  const weight = params.weight as string;
  const wasteType = params.wasteType as string;
  const amount = params.amount as string;
  const environmentalTax = params.environmentalTax as string;
  const totalAmount = params.totalAmount as string;
  const recyclerId = params.recyclerId as string;

  // Rating state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePaymentMade = () => {
    // Show rating modal instead of directly navigating
    setShowRatingModal(true);
  };

  const handleRatingSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before proceeding.');
      return;
    }

    if (!recyclerId) {
      Alert.alert('Error', 'Recycler information not available. Please try again.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit the review
      await apiService.addRecyclerReview({
        recycler_id: recyclerId,
        collection_id: requestId,
        rating: rating,
        comment: comment.trim() || undefined
      });

      // Close modal and navigate to celebration
      setShowRatingModal(false);
      navigateToCelebration();
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateToCelebration = () => {
    // Navigate to eco impact celebration screen after rating submission
    router.push({
      pathname: '/customer-screens/EcoImpactCelebration' as any,
      params: { 
        recyclerName: recyclerName, 
        pickup: pickup,
        requestId: requestId,
        weight: weight,
        wasteType: wasteType,
        amount: amount,
        environmentalTax: environmentalTax,
        totalAmount: totalAmount
      }
    });
  };

  const handleSkipRating = () => {
    setShowRatingModal(false);
    navigateToCelebration();
  };

  const handleBack = () => {
    router.back();
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setRating(i)}
          style={styles.starButton}
        >
          <Text style={[
            styles.star,
            rating >= i ? styles.starFilled : styles.starEmpty
          ]}>
            ★
          </Text>
        </TouchableOpacity>
      );
    }
    return stars;
  };

  // Show error if recyclerId is missing
  if (!recyclerId) {
    return (
      <SafeAreaView style={styles.container}>
        <CommonHeader onBackPress={handleBack} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Missing Information</Text>
          <Text style={styles.errorText}>
            Recycler information is not available. Please go back and try again.
          </Text>
          <TouchableOpacity style={styles.errorButton} onPress={handleBack}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CommonHeader onBackPress={handleBack} />

      {/* Payment Confirmation Banner */}
      <View style={styles.bannerSection}>
        {/* Payment Made Pill in Image Rectangle */}
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

      {/* Pickup Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Pickup Summary</Text>
        <View style={styles.summaryDetails}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Recycler:</Text>
            <Text style={styles.summaryValue}>{recyclerName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Location:</Text>
            <Text style={styles.summaryValue}>{pickup}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Waste Type:</Text>
            <Text style={styles.summaryValue}>{wasteType}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Weight:</Text>
            <Text style={styles.summaryValue}>{weight}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount:</Text>
            <Text style={styles.summaryValue}>GHS {amount}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Environmental Tax:</Text>
            <Text style={styles.summaryValue}>GHS {environmentalTax}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalValue}>GHS {totalAmount}</Text>
          </View>
        </View>
      </View>

      {/* Payment Instruction Card */}
      <View style={styles.instructionCard}>
        <Text style={styles.instructionText}>
          Thank you for choosing{'\n'}
          <Text style={styles.brandHighlight}>EcoWasteGo.</Text>
        </Text>
        <Text style={styles.paymentInstruction}>
          You can make your payment through{'\n'}
          <Text style={styles.boldText}>Momo</Text> or <Text style={styles.boldText}>Cash</Text> to your <Text style={styles.boldText}>Recycler</Text>.
        </Text>
      </View>

      {/* Confirmation Button */}
      <TouchableOpacity style={styles.confirmButton} onPress={handlePaymentMade}>
        <Text style={styles.confirmButtonText}>PAYMENT MADE</Text>
      </TouchableOpacity>

      {/* Rating Modal */}
      <Modal
        visible={showRatingModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRatingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.ratingModal}>
            <Text style={styles.ratingTitle}>Rate Your Recycler</Text>
            <Text style={styles.ratingSubtitle}>
              How was your experience with {recyclerName}?
            </Text>

            {/* Star Rating */}
            <View style={styles.starsContainer}>
              {renderStars()}
            </View>
            <Text style={styles.ratingText}>
              {rating > 0 ? `${rating} star${rating > 1 ? 's' : ''}` : 'Select rating'}
            </Text>

            {/* Comment Input */}
            <Text style={styles.commentLabel}>Add a comment (optional):</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Share your experience..."
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={3}
              maxLength={200}
            />

            {/* Action Buttons */}
            <View style={styles.ratingActions}>
              <TouchableOpacity
                style={[styles.ratingButton, styles.skipButton]}
                onPress={handleSkipRating}
                disabled={isSubmitting}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.ratingButton, styles.submitButton, rating === 0 && styles.submitButtonDisabled]}
                onPress={handleRatingSubmit}
                disabled={rating === 0 || isSubmitting}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Submitting...' : 'Submit & Continue'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  bannerSection: {
    height:100,
    backgroundColor: COLORS.background,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 20,
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
    top: '80%',
    left: '40%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    paddingHorizontal: 20,
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
  summaryCard: {
    backgroundColor: COLORS.background,
    margin: DIMENSIONS.margin,
    borderRadius: DIMENSIONS.cardBorderRadius,
    padding: 20,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    textAlign: 'center',
    marginBottom: 16,
  },
  summaryDetails: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.darkGreen,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  instructionCard: {
    backgroundColor: COLORS.background,
    margin: DIMENSIONS.margin,
    borderRadius: DIMENSIONS.cardBorderRadius,
    padding: 24,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 16,
    color: COLORS.darkGreen,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  brandHighlight: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  paymentInstruction: {
    fontSize: 14,
    color: COLORS.darkGreen,
    textAlign: 'center',
    lineHeight: 20,
  },
  boldText: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    margin: DIMENSIONS.margin,
    paddingVertical: 16,
    borderRadius: DIMENSIONS.borderRadius,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '50%',
    alignSelf: 'center',
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  ratingModal: {
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.cardBorderRadius,
    padding: 24,
    width: '90%',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  ratingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 8,
    textAlign: 'center',
  },
  ratingSubtitle: {
    fontSize: 16,
    color: COLORS.darkGreen,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  starButton: {
    padding: 10,
  },
  star: {
    fontSize: 30,
  },
  starFilled: {
    color: COLORS.primary,
  },
  starEmpty: {
    color: '#E0E0E0',
  },
  ratingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 15,
  },
  commentLabel: {
    fontSize: 16,
    color: COLORS.darkGreen,
    fontWeight: '500',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: DIMENSIONS.borderRadius,
    padding: 12,
    fontSize: 14,
    color: COLORS.darkGreen,
    minHeight: 80,
    width: '100%',
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  ratingActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  ratingButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: DIMENSIONS.borderRadius,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  skipButton: {
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  skipButtonText: {
    color: COLORS.gray,
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.white,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.red,
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  errorButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: DIMENSIONS.borderRadius,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 
