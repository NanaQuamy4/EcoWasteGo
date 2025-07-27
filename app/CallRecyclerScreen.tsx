import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, DIMENSIONS, RECYCLER_DATA } from '../constants';
import CommonHeader from './components/CommonHeader';

interface RecyclerData {
  name: string;
  phone: string;
  rating: number;
  truckType: string;
  recyclerId: string;
  color: string;
  rate: string;
  pastPickups: number;
}

export default function CallRecyclerScreen() {
  const params = useLocalSearchParams();
  const recyclerName = params.recyclerName as string;


  // Use centralized recycler data
  const recyclerData: RecyclerData = {
    name: recyclerName || RECYCLER_DATA.name,
    phone: RECYCLER_DATA.phone,
    rating: RECYCLER_DATA.rating,
    truckType: RECYCLER_DATA.truckType,
    recyclerId: RECYCLER_DATA.recyclerId,
    color: RECYCLER_DATA.color,
    rate: RECYCLER_DATA.rate,
    pastPickups: RECYCLER_DATA.pastPickups,
  };

  const handleCall = () => {
    Alert.alert(
      'Call Recycler',
      `Call ${recyclerData.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Call',
          onPress: () => {
            // Make actual phone call
            Linking.openURL(`tel:${recyclerData.phone}`);
          },
        },
      ]
    );
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <CommonHeader title="Call Your Recycler" />

      {/* Main Content */}
      <View style={styles.content}>
        {/* Recycler Profile Card */}
        <View style={styles.profileCard}>
          {/* Profile Image */}
          <View style={styles.profileImageContainer}>
            <Image
              source={require('../assets/images/_MG_2771.jpg')}
              style={styles.profileImage}
            />
          </View>

          {/* Recycler Info */}
          <View style={styles.recyclerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.recyclerName}>{recyclerData.name}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>⭐ {recyclerData.rating}</Text>
              </View>
            </View>
            
            <Text style={styles.truckType}>{recyclerData.truckType}</Text>
            <Text style={styles.recyclerId}>ID: {recyclerData.recyclerId}</Text>
            <Text style={styles.color}>Color: {recyclerData.color}</Text>
            <Text style={styles.rate}>Rate: {recyclerData.rate}</Text>
            <Text style={styles.pastPickups}>Past Pickups: {recyclerData.pastPickups}</Text>
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.contactSection}>
          <Text style={styles.contactLabel}>Contact Information</Text>
          
          <TouchableOpacity style={styles.contactRow} onPress={handleCall}>
            <View style={styles.contactIcon}>
              <Text style={styles.phoneIcon}>📞</Text>
            </View>
            <View style={styles.contactDetails}>
              <Text style={styles.contactName}>{recyclerData.name}</Text>
              <Text style={styles.contactPhone}>{recyclerData.phone}</Text>
            </View>
            <View style={styles.callButton}>
              <Text style={styles.callButtonText}>Call</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Back</Text>
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

  content: {
    flex: 1,
    paddingHorizontal: DIMENSIONS.margin,
  },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.cardBorderRadius,
    padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: COLORS.secondary,
  },
  recyclerInfo: {
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recyclerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginRight: 8,
  },
  badge: {
    backgroundColor: COLORS.lightGreen,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: DIMENSIONS.borderRadius,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  truckType: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 4,
  },
  recyclerId: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  color: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  rate: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  pastPickups: {
    fontSize: 14,
    color: COLORS.gray,
  },
  contactSection: {
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.cardBorderRadius,
    padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  contactLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 16,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: DIMENSIONS.borderRadius,
    padding: 16,
  },
  contactIcon: {
    marginRight: 12,
  },
  phoneIcon: {
    fontSize: 24,
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: COLORS.gray,
  },
  callButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  callButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  backButton: {
    backgroundColor: '#E3E3E3',
    borderRadius: DIMENSIONS.borderRadius,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
}); 