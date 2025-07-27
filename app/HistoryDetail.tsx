import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, Image, Linking, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, DIMENSIONS } from '../constants';
import { getStatusColor, getStatusText, parseWeight } from '../constants/helpers';
import CommonHeader from './components/CommonHeader';

export default function HistoryDetailScreen() {
  const params = useLocalSearchParams();
  
  // Extract parameters from navigation
  const id = params.id as string;
  const date = params.date as string;
  const recyclerName = params.recyclerName as string;
  const pickupLocation = params.pickupLocation as string;
  const weight = params.weight as string;
  const amount = params.amount as string;
  const status = params.status as string;
  const rating = params.rating as string;
  const recyclerPhone = params.recyclerPhone as string;
  const pickupTime = params.pickupTime as string;
  const environmentalTax = params.environmentalTax as string;
  const notes = params.notes as string;



  const handleCallRecycler = () => {
    if (recyclerPhone) {
      Alert.alert(
        'Call Recycler',
        `Would you like to call ${recyclerName}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Call',
            onPress: () => {
              Linking.openURL(`tel:${recyclerPhone}`);
            },
          },
        ]
      );
    }
  };

  const renderStars = (rating: string) => {
    const ratingNum = parseInt(rating) || 0;
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Text key={star} style={[styles.star, star <= ratingNum ? styles.starFilled : styles.starEmpty]}>
            ★
          </Text>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <CommonHeader title="Pickup Details" subtitle={`#${id}`} />

      {/* Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: getStatusColor(status) }]}>
        <Text style={styles.statusText}>{getStatusText(status)}</Text>
      </View>

      {/* Recycler Info Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Recycler Information</Text>
        </View>
        <View style={styles.recyclerInfo}>
          <Image 
            source={require('../assets/images/_MG_2771.jpg')} 
            style={styles.recyclerImage} 
          />
          <View style={styles.recyclerDetails}>
            <Text style={styles.recyclerName}>{recyclerName}</Text>
            <Text style={styles.recyclerLocation}>{pickupLocation}</Text>
            {rating && (
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingLabel}>Rating:</Text>
                {renderStars(rating)}
              </View>
            )}
          </View>
        </View>
        {recyclerPhone && (
          <TouchableOpacity style={styles.callButton} onPress={handleCallRecycler}>
            <Text style={styles.callButtonText}>📞 Call Recycler</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Pickup Details Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Pickup Details</Text>
        </View>
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{date}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>{pickupTime}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Weight</Text>
            <Text style={styles.detailValue}>{weight}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Rate</Text>
            <Text style={styles.detailValue}>GHS 1.20/kg</Text>
          </View>
        </View>
      </View>

      {/* Payment Details Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Payment Details</Text>
        </View>
        <View style={styles.paymentDetails}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Base Amount:</Text>
            <Text style={styles.paymentValue}>
              GHS {(parseWeight(weight) * 1.20).toFixed(2)}
            </Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Environmental Tax (5%):</Text>
            <Text style={styles.paymentValue}>{environmentalTax}</Text>
          </View>
          <View style={[styles.paymentRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalValue}>{amount}</Text>
          </View>
        </View>
      </View>

      {/* Notes Card */}
      {notes && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Notes</Text>
          </View>
          <Text style={styles.notesText}>{notes}</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.shareButton}>
          <Text style={styles.shareButtonText}>📤 Share Receipt</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.repeatButton}>
          <Text style={styles.repeatButtonText}>🔄 Repeat Pickup</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statusBanner: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  card: {
    backgroundColor: COLORS.white,
    margin: DIMENSIONS.margin,
    borderRadius: DIMENSIONS.cardBorderRadius,
    padding: 16,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  recyclerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recyclerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  recyclerDetails: {
    flex: 1,
  },
  recyclerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 4,
  },
  recyclerLocation: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginRight: 8,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 16,
    marginRight: 2,
  },
  starFilled: {
    color: '#FFD700',
  },
  starEmpty: {
    color: '#E3E3E3',
  },
  callButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  callButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '48%',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  paymentDetails: {
    marginTop: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.darkGreen,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E3E3E3',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  notesText: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: DIMENSIONS.margin,
    marginBottom: 20,
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: DIMENSIONS.borderRadius,
    alignItems: 'center',
    marginRight: 8,
  },
  shareButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  repeatButton: {
    flex: 1,
    backgroundColor: '#FF9800',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: DIMENSIONS.borderRadius,
    alignItems: 'center',
    marginLeft: 8,
  },
  repeatButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 