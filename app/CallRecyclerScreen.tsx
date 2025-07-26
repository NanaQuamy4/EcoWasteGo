import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  const pickup = params.pickup as string;

  // Mock data for the recycler (in real app, this would come from API)
  const recyclerData: RecyclerData = {
    name: recyclerName || 'GreenFleet GH',
    phone: '+233 59 197 8093',
    rating: 4.8,
    truckType: 'Small Truck',
    recyclerId: 'REC001',
    color: 'Green',
    rate: '₵50',
    pastPickups: 127,
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
      {/* Banner/Header */}
      <View style={styles.bannerBg}>
        <Image
          source={require('../assets/images/blend.jpg')}
          style={styles.bannerImage}
          resizeMode="cover"
        />
        <View style={styles.headerCard}>
          <Text style={styles.header}>Call Your Recycler</Text>
        </View>
      </View>

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
    backgroundColor: '#fff',
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
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
    borderColor: '#4CAF50',
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
    color: '#22330B',
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#E3F0D5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#22330B',
  },
  truckType: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  recyclerId: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  color: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  rate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  pastPickups: {
    fontSize: 14,
    color: '#666',
  },
  contactSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  contactLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22330B',
    marginBottom: 16,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
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
    color: '#22330B',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
  },
  callButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  callButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  backButton: {
    backgroundColor: '#E3E3E3',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22330B',
  },
}); 