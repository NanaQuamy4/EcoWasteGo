import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, DIMENSIONS } from '../constants';
import CommonHeader from './components/CommonHeader';

export default function RecyclerHasArrived() {
  const params = useLocalSearchParams();
  const recyclerName = params.recyclerName as string;
  const pickup = params.pickup as string;

  const handleCall = () => {
    // Navigate to CallRecyclerScreen
    router.push({
      pathname: '/CallRecyclerScreen',
      params: { 
        recyclerName: recyclerName,
        pickup: pickup 
      }
    });
  };
  
  const handleText = () => {
    // Navigate to TextRecyclerScreen
    router.push({
      pathname: '/TextRecyclerScreen',
      params: { 
        recyclerName: recyclerName,
        pickup: pickup 
      }
    });
  };
  
  const handleCheckPayment = () => {
    // Navigate to PaymentSummary screen
    router.push({
      pathname: '/PaymentSummary',
      params: { 
        recyclerName: recyclerName,
        pickup: pickup 
      }
    });
  };

  const handleComplete = () => {
    Alert.alert(
      'Complete Pickup',
      'Are you sure you want to complete this pickup?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Complete',
          style: 'default',
          onPress: () => {
            // Navigate back to home screen
            router.push('/');
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <CommonHeader title="Recycler Has Arrived!" />

      {/* Banner/Header */}
      <View style={styles.bannerBg}>
        <Image
          source={require('../assets/images/blend.jpg')}
          style={styles.bannerImage}
          resizeMode="cover"
        />
        <View style={styles.headerCard}>
          <Text style={styles.header}>Recycler Has Arrived!</Text>
        </View>
      </View>

      {/* Pickup Location */}
      <Text style={styles.pickupText}>
        Pickup Point: <Text style={{ fontWeight: 'bold' }}>{pickup}</Text>
      </Text>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <View style={styles.arrivalCard}>
          <Image
            source={require('../assets/images/truck.png')}
            style={styles.truckImage}
          />
          <Text style={styles.arrivalText}>Your recycler is here!</Text>
          <Text style={styles.recyclerName}>{recyclerName}</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.pillButton} onPress={handleCall}>
            <Text style={styles.pillButtonText}>📞 Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pillButton} onPress={handleText}>
            <Text style={styles.pillButtonText}>💬 Text</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pillButton, styles.paymentButton]} onPress={handleCheckPayment}>
            <Text style={[styles.pillButtonText, styles.paymentButtonText]}>💰 Check Payment Due</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pillButton, styles.completeButton]} onPress={handleComplete}>
            <Text style={[styles.pillButtonText, styles.completeButtonText]}>✅ Complete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
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
    color: COLORS.darkGreen,
    textAlign: 'center',
    marginBottom: 8,
  },
  pickupText: {
    fontSize: 16,
    color: COLORS.darkGreen,
    marginHorizontal: DIMENSIONS.margin,
    marginBottom: 20,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  arrivalCard: {
    backgroundColor: COLORS.lightGreen,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  truckImage: {
    width: 120,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  arrivalText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    textAlign: 'center',
    marginBottom: 10,
  },
  recyclerName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  pillButton: {
    backgroundColor: '#E3E3E3',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
  },
  pillButtonText: {
    color: COLORS.darkGreen,
    fontWeight: 'bold',
    fontSize: 15,
  },
  paymentButton: {
    backgroundColor: '#FF9800',
  },
  paymentButtonText: {
    color: COLORS.white,
  },
  completeButton: {
    backgroundColor: COLORS.secondary,
  },
  completeButtonText: {
    color: COLORS.white,
  },
}); 