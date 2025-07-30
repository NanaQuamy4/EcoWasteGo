import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants';
import CommonHeader from './components/CommonHeader';

export default function RecyclerWeightEntry() {
  const params = useLocalSearchParams();
  const userName = params.userName as string;
  const pickup = params.pickup as string;
  
  const [weight, setWeight] = useState('');
  const [wasteType, setWasteType] = useState('Plastic');
  const [rate] = useState('1.20');

  const calculateBill = () => {
    if (!weight || parseFloat(weight) <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight.');
      return;
    }

    const weightValue = parseFloat(weight);
    const rateValue = parseFloat(rate);
    const subtotal = weightValue * rateValue;
    const environmentalTax = subtotal * 0.05; // 5% tax
    const totalAmount = subtotal + environmentalTax;

    // Navigate to payment summary with calculated values
    router.push({
      pathname: '/RecyclerPaymentSummary',
      params: {
        userName: userName,
        pickup: pickup,
        weight: weight,
        wasteType: wasteType,
        rate: rate,
        subtotal: subtotal.toFixed(2),
        environmentalTax: environmentalTax.toFixed(2),
        totalAmount: totalAmount.toFixed(2)
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <CommonHeader />

      {/* Header Section */}
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>Waste Collection</Text>
        <Text style={styles.headerSubtitle}>Enter waste details for {userName}</Text>
      </View>

      {/* Form Section */}
      <View style={styles.formContainer}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Waste Details</Text>
          
          {/* Weight Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Weight (kg)</Text>
            <TextInput
              style={styles.textInput}
              value={weight}
              onChangeText={setWeight}
              placeholder="Enter weight in kg"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
          </View>

          {/* Waste Type Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Waste Type</Text>
            <View style={styles.wasteTypeContainer}>
              {['Plastic', 'Paper', 'Electronic', 'Metal', 'General Waste'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.wasteTypeButton,
                    wasteType === type && styles.wasteTypeButtonActive
                  ]}
                  onPress={() => setWasteType(type)}
                >
                  <Text style={[
                    styles.wasteTypeText,
                    wasteType === type && styles.wasteTypeTextActive
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Rate Display */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Rate per kg</Text>
            <View style={styles.rateDisplay}>
              <Text style={styles.rateText}>GHS {rate}/kg</Text>
            </View>
          </View>

          {/* Calculate Button */}
          <TouchableOpacity 
            style={styles.calculateButton} 
            onPress={calculateBill}
            disabled={!weight || parseFloat(weight) <= 0}
          >
            <Text style={styles.calculateButtonText}>Calculate Bill</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Instructions:</Text>
          <Text style={styles.instructionsText}>• Weigh the collected waste accurately</Text>
          <Text style={styles.instructionsText}>• Select the appropriate waste type</Text>
          <Text style={styles.instructionsText}>• Review the calculated bill before sending</Text>
          <Text style={styles.instructionsText}>• The user will receive a payment summary</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FFF0',
  },
  headerSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGreen,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.darkGreen,
    backgroundColor: '#F8F8F8',
  },
  wasteTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wasteTypeButton: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F8F8F8',
  },
  wasteTypeButtonActive: {
    borderColor: COLORS.darkGreen,
    backgroundColor: COLORS.darkGreen,
  },
  wasteTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  wasteTypeTextActive: {
    color: '#fff',
  },
  rateDisplay: {
    backgroundColor: '#F2FFE5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: COLORS.darkGreen,
  },
  rateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    textAlign: 'center',
  },
  calculateButton: {
    backgroundColor: COLORS.darkGreen,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  instructionsCard: {
    backgroundColor: '#CFDFBF',
    borderRadius: 16,
    padding: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#192E01',
    marginBottom: 6,
    lineHeight: 20,
  },
}); 