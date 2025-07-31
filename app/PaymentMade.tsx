import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, DIMENSIONS } from '../constants';
import CommonHeader from './components/CommonHeader';

export default function PaymentMadeScreen() {
  const params = useLocalSearchParams();
  
  // Extract parameters from navigation
  const recyclerName = params.recyclerName as string;
  const pickup = params.pickup as string;

  const handlePaymentMade = () => {
    // Navigate to eco impact celebration screen after payment confirmation
    router.push({
      pathname: '/EcoImpactCelebration',
      params: { 
        recyclerName: recyclerName, 
        pickup: pickup,
        weight: '8.5 kg' // This would come from the payment summary in real app
      }
    });
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <CommonHeader onBackPress={handleBack} />

      {/* Payment Confirmation Banner */}
      <View style={styles.bannerSection}>
        {/* Payment Made Pill in Image Rectangle */}
        <View style={styles.imageRectangle}>
          <Image
            source={require('../assets/images/blend.jpg')}
            style={styles.blendImage}
            resizeMode="cover"
          />
          <View style={styles.paymentPill}>
            <Text style={styles.paymentText}>Payment Made</Text>
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
  instructionCard: {
    backgroundColor: COLORS.background,
    margin: DIMENSIONS.margin,
    borderRadius: DIMENSIONS.cardBorderRadius,
    padding: 24,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
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
}); 
