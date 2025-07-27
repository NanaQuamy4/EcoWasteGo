import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, DIMENSIONS, PAYMENT_DATA } from '../constants';
import CommonHeader from './components/CommonHeader';

interface PaymentData {
  recycler: string;
  pickupDate: string;
  weight: string;
  rate: string;
  environmentalTax: string;
  totalDue: string;
}

export default function PaymentSummary() {
  const params = useLocalSearchParams();
  const recyclerName = params.recyclerName as string;
  const pickup = params.pickup as string;

  // Use centralized payment data
  const paymentData: PaymentData = {
    recycler: recyclerName || 'GreenFleet GH',
    pickupDate: 'June 26, 2025',
    weight: PAYMENT_DATA.weight,
    rate: PAYMENT_DATA.rate,
    environmentalTax: PAYMENT_DATA.environmentalTax,
    totalDue: PAYMENT_DATA.totalAmount,
  };

  const handleAccept = () => {
    Alert.alert(
      'Payment Accepted',
      'Your payment has been processed successfully. Thank you for supporting environmental protection!',
      [
        {
          text: 'OK',
          onPress: () => {
            // Navigate to PaymentMade screen
            router.push({
              pathname: '/PaymentMade',
              params: { recyclerName: recyclerName, pickup: pickup }
            });
          }
        }
      ]
    );
  };

  const handleReject = () => {
    Alert.alert(
      'Payment Rejected',
      'Are you sure you want to reject this payment? A notification will be sent to the recycler to review their payment inputs (e.g., weight calculations) for potential errors.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Notification Sent',
              'A notification has been sent to the recycler to review the payment details. They will check for any input errors (like weight calculations) and send you a corrected payment summary.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    // Navigate back to RecyclerHasArrived screen to wait for corrected payment
                    router.push({
                      pathname: '/RecyclerHasArrived',
                      params: { recyclerName: recyclerName, pickup: pickup }
                    });
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <CommonHeader onBackPress={handleBack} />

      {/* Background with Abstract Lines */}
      <View style={styles.backgroundSection}>
        <View style={styles.abstractLines} />
        
        {/* Payment Due Pill in Image Rectangle */}
        <View style={styles.imageRectangle}>
          <Image
            source={require('../assets/images/blend.jpg')}
            style={styles.blendImage}
            resizeMode="cover"
          />
          <View style={styles.paymentDuePill}>
            <Text style={styles.paymentDueText}>Payment Due</Text>
          </View>
        </View>
      </View>

      {/* Summary Card with Note Section */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Summary</Text>
       
        <View style={styles.paymentDetailsContainer}>
          <View style={styles.paymentDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Recycler</Text>
              <View style={styles.detailValue}>
                <Text style={styles.valueText}>{paymentData.recycler}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pickup Date:</Text>
              <View style={styles.detailValue}>
                <Text style={styles.valueText}>{paymentData.pickupDate}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Weight</Text>
              <View style={styles.detailValue}>
                <Text style={styles.valueText}>{paymentData.weight}</Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Rate</Text>
              <View style={styles.detailValue}>
                <Text style={styles.valueText}>{paymentData.rate}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Environmental Excise Tax (5%)</Text>
              <View style={styles.detailValue}>
                <Text style={styles.valueText}>{paymentData.environmentalTax}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Due</Text>
              <View style={styles.detailValue}>
                <Text style={styles.valueText}>{paymentData.totalDue}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Note Section */}
        <View style={styles.noteSection}>
          <Text style={styles.noteTitle}>Note:</Text>
          <Text style={styles.noteText}>This receipt includes a 5% Environmental Excise Tax.</Text>
          <Text style={styles.noteText}>Your payment supports Ghana&apos;s environmental protection and recycling efforts.</Text>
          <Text style={styles.noteText}>Together, we&apos;re reducing pollution and creating a cleaner future</Text>
          <Text style={styles.noteText}>&quot;One Tap to a Greener Planet.&quot;</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
          <Text style={styles.rejectButtonText}>REJECT</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
          <Text style={styles.acceptButtonText}>ACCEPT</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  backgroundSection: {
    height: 100,
    backgroundColor: COLORS.background,
    position: 'relative',
  },
  abstractLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  imageRectangle: {
    position: 'absolute',
    top: 20,
    left: '50%',
    transform: [{ translateX: -50 }],
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  blendImage: {
    width: 200,
    height: 50,
    borderRadius: 20,
  },
  paymentDuePill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  paymentDueText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    textAlign: 'center',
  },
  summaryContainer: {
    backgroundColor: COLORS.background,
    margin: DIMENSIONS.margin,
    borderRadius: DIMENSIONS.cardBorderRadius,
    marginTop: -30,
    padding: 20,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 16,
    textAlign: 'center',
  },
  paymentDetailsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.borderRadius,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentDetails: {
    backgroundColor: 'transparent',
    borderRadius: DIMENSIONS.borderRadius,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.darkGreen,
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 100,
  },
  valueText: {
    fontSize: 14,
    color: COLORS.darkGreen,
    flex: 1,
    textAlign: 'right',
  },
  dropdownArrow: {
    fontSize: 12,
    color: COLORS.black,
    marginLeft: 4,
  },
  noteSection: {
    padding: 16,
    marginTop: 8,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#192E01',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 12,
    color: '#192E01',
    lineHeight: 16,
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: DIMENSIONS.margin,
    marginBottom: 20,
  },
  rejectButton: {
    backgroundColor: COLORS.red,
    borderRadius: DIMENSIONS.borderRadius,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  acceptButton: {
    backgroundColor: COLORS.primary,
    borderRadius: DIMENSIONS.borderRadius,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 