import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../constants';
import { supabase } from '../../lib/supabase';
import CommonHeader from '../components/CommonHeader';

export default function RecyclerWeightEntry() {
  const params = useLocalSearchParams();
  const requestId = params.requestId as string;
  const userName = params.userName as string;
  const pickup = params.pickup as string;
  const currentWeight = params.currentWeight as string;
  const currentWasteType = params.currentWasteType as string;
  const isEdit = params.isEdit === 'true';
  const paymentSummaryId = params.paymentSummaryId as string;
  const rejectionReason = params.rejectionReason as string;
  const selectedReason = params.selectedReason as string;
  
  const [weight, setWeight] = useState(currentWeight || '');
  const [wasteType, setWasteType] = useState(currentWasteType || 'plastic');
  const [wasteQuality, setWasteQuality] = useState('good');
  const [contaminationLevel, setContaminationLevel] = useState('0');
  const [collectionNotes, setCollectionNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pricingData, setPricingData] = useState<any>(null);
  const [recyclerId, setRecyclerId] = useState<string | null>(null);

  // Get current recycler ID
  useEffect(() => {
    const getCurrentRecycler = async () => {
      try {
        console.log('Getting current user...');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('Auth error:', authError);
          Alert.alert('Authentication Error', 'Please log in again.');
          return;
        }
        
        if (user) {
          console.log('User found:', user.id);
          
          // Check if user exists in recyclers table
          const { data: recycler, error: recyclerError } = await supabase
            .from('recyclers')
            .select('id')
            .eq('id', user.id)
            .single();
          
          if (recyclerError) {
            console.error('Recycler not found in database:', recyclerError);
            Alert.alert('Access Denied', 'You are not registered as a recycler.');
            return;
          }
          
          console.log('Recycler found:', recycler.id);
          setRecyclerId(user.id);
        } else {
          console.log('No user found');
          Alert.alert('Not Logged In', 'Please log in to continue.');
        }
      } catch (error) {
        console.error('Error getting current recycler:', error);
        Alert.alert('Error', 'Failed to verify recycler status.');
      }
    };
    getCurrentRecycler();
  }, []);

  // Remove automatic pricing calculation - let user click button manually

  const calculatePricing = async () => {
    try {
      console.log('Calculating pricing for:', { wasteType, wasteQuality, weight });
      
      const { data, error } = await supabase.rpc('calculate_collection_pricing', {
        p_waste_type: wasteType,
        p_quality_level: wasteQuality,
        p_weight: parseFloat(weight)
      });

      if (error) {
        console.error('Error calculating pricing:', error);
        Alert.alert('Pricing Error', `Failed to calculate pricing: ${error.message}`);
        return;
      }

      console.log('Pricing calculated successfully:', data);
      setPricingData(data);
      
      // Automatically save collection data after pricing is calculated
      if (recyclerId) {
        await saveCollectionData();
      } else {
        Alert.alert('Authentication Required', 'Please log in as a recycler to continue.');
      }
    } catch (error) {
      console.error('Error calculating pricing:', error);
      Alert.alert('Pricing Error', `Failed to calculate pricing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const validateInputs = () => {
    if (!weight || parseFloat(weight) <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight greater than 0 kg.');
      return false;
    }

    if (parseFloat(weight) > 1000) {
      Alert.alert('Weight Too High', 'Weight cannot exceed 1000 kg. Please contact support for large collections.');
      return false;
    }

    if (!wasteType) {
      Alert.alert('Missing Waste Type', 'Please select a waste type.');
      return false;
    }

    if (!wasteQuality) {
      Alert.alert('Missing Quality', 'Please select waste quality.');
      return false;
    }

    const contamination = parseFloat(contaminationLevel);
    if (contamination < 0 || contamination > 100) {
      Alert.alert('Invalid Contamination', 'Contamination level must be between 0% and 100%.');
      return false;
    }

    return true;
  };

  const saveCollectionData = async () => {
    if (!validateInputs() || !pricingData) {
      return;
    }
    
    if (!recyclerId) {
      Alert.alert('Authentication Required', 'Please log in as a recycler to continue.');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('create_waste_collection', {
        p_pickup_request_id: requestId,
        p_recycler_id: recyclerId,
        p_actual_weight: parseFloat(weight),
        p_waste_type: wasteType,
        p_waste_quality: wasteQuality,
        p_contamination_level: parseFloat(contaminationLevel) / 100, // Convert percentage to decimal
        p_collection_notes: collectionNotes || null
      });

      if (error) {
        console.error('Error saving collection data:', error);
        Alert.alert('Error', 'Failed to save collection data. Please try again.');
        return;
      }

      // Navigate to payment summary with calculated values
      router.push({
        pathname: '/recycler-screens/RecyclerPaymentSummary' as any,
        params: {
          requestId: requestId,
          userName: userName,
          pickup: pickup,
          weight: weight,
          wasteType: wasteType,
          wasteQuality: wasteQuality,
          contaminationLevel: contaminationLevel,
          collectionNotes: collectionNotes,
          baseRate: pricingData.base_rate.toString(),
          qualityMultiplier: pricingData.quality_multiplier.toString(),
          subtotal: pricingData.subtotal.toString(),
          environmentalTax: pricingData.environmental_tax.toString(),
          totalAmount: pricingData.total_amount.toString(),
          collectionId: data
        }
      });
    } catch (error) {
      console.error('Error saving collection data:', error);
      Alert.alert('Error', 'Failed to save collection data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CommonHeader />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>
            {isEdit ? 'Edit Waste Collection' : 'Waste Collection'}
          </Text>
          <Text style={styles.headerSubtitle}>Enter waste details for {userName}</Text>
          <Text style={styles.locationText}>📍 {pickup}</Text>
        </View>

        {/* Rejection Reason Display */}
        {isEdit && rejectionReason && (
          <View style={styles.rejectionContainer}>
            <View style={styles.rejectionHeader}>
              <Text style={styles.rejectionTitle}>⚠️ Payment Rejected</Text>
              <Text style={styles.rejectionSubtitle}>Customer feedback:</Text>
            </View>
            <View style={styles.rejectionContent}>
              <Text style={styles.rejectionReasonLabel}>Reason:</Text>
              <Text style={styles.rejectionReasonText}>{selectedReason}</Text>
              <Text style={styles.rejectionDetailsLabel}>Details:</Text>
              <Text style={styles.rejectionDetailsText}>{rejectionReason}</Text>
            </View>
            <Text style={styles.rejectionNote}>
              Please review and adjust the waste details below based on the customer's feedback.
            </Text>
          </View>
        )}

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
                {['plastic', 'paper', 'electronic', 'metal', 'glass', 'organic', 'general'].map((type) => (
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
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Waste Quality Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Waste Quality</Text>
              <View style={styles.qualityContainer}>
                {['excellent', 'good', 'fair', 'poor'].map((quality) => (
                  <TouchableOpacity
                    key={quality}
                    style={[
                      styles.qualityButton,
                      wasteQuality === quality && styles.qualityButtonActive
                    ]}
                    onPress={() => setWasteQuality(quality)}
                  >
                    <Text style={[
                      styles.qualityText,
                      wasteQuality === quality && styles.qualityTextActive
                    ]}>
                      {quality.charAt(0).toUpperCase() + quality.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Contamination Level */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contamination Level (%)</Text>
              <TextInput
                style={styles.textInput}
                value={contaminationLevel}
                onChangeText={setContaminationLevel}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
              <Text style={styles.helpText}>Enter contamination percentage (0-100%)</Text>
            </View>

            {/* Collection Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Collection Notes (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={collectionNotes}
                onChangeText={setCollectionNotes}
                placeholder="Add any notes about the collection..."
                multiline
                numberOfLines={3}
                placeholderTextColor="#999"
              />
            </View>

            {/* Calculate Pricing Button */}
            <TouchableOpacity 
              style={styles.calculateButton} 
              onPress={calculatePricing}
              disabled={!weight || parseFloat(weight) <= 0 || !wasteType}
            >
              <Text style={styles.calculateButtonText}>Calculate Pricing</Text>
            </TouchableOpacity>

          </View>

          {/* Instructions */}
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>Instructions</Text>
            <Text style={styles.instructionsText}>• Weigh the waste accurately using a scale</Text>
            <Text style={styles.instructionsText}>• Select the correct waste type and quality</Text>
            <Text style={styles.instructionsText}>• Enter contamination level if applicable</Text>
            <Text style={styles.instructionsText}>• Add notes about the collection if needed</Text>
            <Text style={styles.instructionsText}>• The customer will receive a payment summary</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FFF0',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
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
  locationText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
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
  qualityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  qualityButton: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F8F8F8',
  },
  qualityButtonActive: {
    borderColor: COLORS.orange,
    backgroundColor: '#FFF3E0',
  },
  qualityText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  qualityTextActive: {
    color: COLORS.orange,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pricingCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  pricingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 12,
    textAlign: 'center',
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pricingLabel: {
    fontSize: 14,
    color: '#666',
  },
  pricingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGreen,
  },
  pricingDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },
  totalRow: {
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
    color: COLORS.darkGreen,
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  actionButton: {
    backgroundColor: COLORS.darkGreen,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
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
  rejectionContainer: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  rejectionHeader: {
    marginBottom: 12,
  },
  rejectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 4,
  },
  rejectionSubtitle: {
    fontSize: 14,
    color: '#856404',
  },
  rejectionContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  rejectionReasonLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  rejectionReasonText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  rejectionDetailsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  rejectionDetailsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  rejectionNote: {
    fontSize: 12,
    color: '#856404',
    fontStyle: 'italic',
    textAlign: 'center',
  },
}); 