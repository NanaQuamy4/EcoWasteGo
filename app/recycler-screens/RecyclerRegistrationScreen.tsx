import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';

interface FormData {
  companyName: string;
  residentialAddress: string;
  areasOfOperation: string;
  truckNumberPlate: string;
  truckSize: 'small' | 'big';
  profilePhoto: ImagePicker.ImagePickerAsset | null;
}

export default function RecyclerRegistrationScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    residentialAddress: '',
    areasOfOperation: '',
    truckNumberPlate: '',
    truckSize: 'small',
    profilePhoto: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Function to refresh user data
  const handleRefreshUserData = async () => {
    try {
      setIsRefreshing(true);
      console.log('RecyclerRegistrationScreen: Refreshing user data...');
      await refreshUser();
      console.log('RecyclerRegistrationScreen: User data refreshed');
    } catch (error) {
      console.error('RecyclerRegistrationScreen: Failed to refresh user data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Function to manually set company name for debugging
  const handleSetCompanyName = () => {
    const testCompanyName = 'Test Company Name';
    console.log('RecyclerRegistrationScreen: Manually setting company name to:', testCompanyName);
    setFormData(prev => ({ ...prev, companyName: testCompanyName }));
  };

  // Pre-fill company name from user data
  useEffect(() => {
    console.log('RecyclerRegistrationScreen: User data:', user);
    console.log('RecyclerRegistrationScreen: Company name:', user?.company_name);
    console.log('RecyclerRegistrationScreen: All user fields:', user ? Object.keys(user) : 'No user data');
    console.log('RecyclerRegistrationScreen: User role:', user?.role);
    console.log('RecyclerRegistrationScreen: Verification status:', user?.verification_status);
    
    if (user?.company_name) {
      console.log('RecyclerRegistrationScreen: Setting company name from user data:', user.company_name);
      setFormData(prev => ({ ...prev, companyName: user.company_name || '' }));
    } else {
      console.log('RecyclerRegistrationScreen: No company name found in user data');
      // Try to get company name from other possible fields
      if (user?.company_name) {
        console.log('RecyclerRegistrationScreen: Found company_name, using that:', user.company_name);
        setFormData(prev => ({ ...prev, companyName: user.company_name || '' }));
      }
    }
  }, [user]);

  // Refresh user data when component mounts to ensure we have latest data
  useEffect(() => {
    if (!user?.company_name) {
      console.log('RecyclerRegistrationScreen: No company name found, refreshing user data...');
      handleRefreshUserData();
    }
  }, []);

  const pickImage = async (type: 'photo') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        if (type === 'photo') {
          setFormData(prev => ({ ...prev, profilePhoto: result.assets[0] }));
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const validateForm = () => {
    if (!formData.companyName.trim()) {
      Alert.alert('Error', 'Company name is required');
      return false;
    }
    if (!formData.residentialAddress.trim()) {
      Alert.alert('Error', 'Residential address is required');
      return false;
    }
    if (!formData.areasOfOperation.trim()) {
      Alert.alert('Error', 'Areas of operation is required');
      return false;
    }
    if (!formData.truckNumberPlate.trim()) {
      Alert.alert('Error', 'Truck number plate is required');
      return false;
    }
    if (!formData.truckSize) {
      Alert.alert('Error', 'Truck size is required');
      return false;
    }
    if (!formData.profilePhoto) {
      Alert.alert('Error', 'Profile photo is required');
      return false;
    }
    return true;
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Registration',
      'You can complete your registration later. You will remain unverified until you provide the required information.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Skip for Now',
          onPress: () => {
            // Navigate to recycler home screen
            router.replace('/(recycler-tabs)');
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Call API to complete registration
      const response = await apiService.completeRecyclerRegistration({
        companyName: formData.companyName,
        residentialAddress: formData.residentialAddress,
        areasOfOperation: formData.areasOfOperation,
        truckNumberPlate: formData.truckNumberPlate,
        truckSize: formData.truckSize,
        profilePhotoUrl: formData.profilePhoto?.uri,
      });
      
      Alert.alert(
        'Registration Completed!',
        'Your registration has been completed successfully. You are now verified and can receive pickup requests.',
        [
          {
            text: 'OK',
            onPress: () => router.push('/(recycler-tabs)'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Registration completion error:', error);
      Alert.alert(
        'Error', 
        error.message || 'Failed to complete registration. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <MaterialIcons name="business" size={48} color={COLORS.orange} />
          <Text style={styles.title}>Complete Your Registration</Text>
          <Text style={styles.subtitle}>
            Please provide the following information to verify your business and vehicle details
          </Text>
          
          {/* Debug Button */}
          <TouchableOpacity 
            style={[styles.debugButton, { marginTop: 16 }]} 
            onPress={handleRefreshUserData}
            disabled={isRefreshing}
          >
            <Text style={styles.debugButtonText}>
              {isRefreshing ? 'Refreshing...' : 'Debug: Refresh User Data'}
            </Text>
          </TouchableOpacity>

          {/* Debug Button to set company name */}
          <TouchableOpacity 
            style={[styles.debugButton, { marginTop: 10 }]} 
            onPress={handleSetCompanyName}
          >
            <Text style={styles.debugButtonText}>
              Debug: Set Company Name
            </Text>
          </TouchableOpacity>
          
          {/* Debug Info */}
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>User ID: {user?.id || 'None'}</Text>
            <Text style={styles.debugText}>Role: {user?.role || 'None'}</Text>
            <Text style={styles.debugText}>Company Name: {user?.company_name || 'None'}</Text>
            <Text style={styles.debugText}>Form Company Name: {formData.companyName || 'Empty'}</Text>
            <Text style={styles.debugText}>Form Residential Address: {formData.residentialAddress || 'Empty'}</Text>
            <Text style={styles.debugText}>Form Areas of Operation: {formData.areasOfOperation || 'Empty'}</Text>
            <Text style={styles.debugText}>Form Truck Number Plate: {formData.truckNumberPlate || 'Empty'}</Text>
            <Text style={styles.debugText}>Form Truck Size: {formData.truckSize || 'Not Set'}</Text>
            <Text style={styles.debugText}>Form Profile Photo: {formData.profilePhoto ? 'Selected' : 'Not Selected'}</Text>
          </View>
        </View>

        <View style={styles.form}>
          {/* Company Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Company Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.companyName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, companyName: text }))}
              placeholder="Enter your company name"
            />
          </View>

          {/* Residential Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Residential Address *</Text>
            <TextInput
              style={styles.input}
              value={formData.residentialAddress}
              onChangeText={(text) => setFormData(prev => ({ ...prev, residentialAddress: text }))}
              placeholder="Enter your residential address"
            />
          </View>

          {/* Areas of Operation */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Areas of Operation *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.areasOfOperation}
              onChangeText={(text) => setFormData(prev => ({ ...prev, areasOfOperation: text }))}
              placeholder="List the areas you operate in (e.g., Kumasi Central, Adum, KNUST)"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Truck Number Plate */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Truck Number Plate *</Text>
            <TextInput
              style={styles.input}
              value={formData.truckNumberPlate}
              onChangeText={(text) => setFormData(prev => ({ ...prev, truckNumberPlate: text }))}
              placeholder="Enter your truck number plate (e.g., GT-1234-21)"
            />
          </View>

          {/* Truck Size */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Truck Size *</Text>
            <TouchableOpacity
              style={styles.truckSizeButton}
              onPress={() => setFormData(prev => ({ ...prev, truckSize: prev.truckSize === 'small' ? 'big' : 'small' }))}
            >
              <Text style={styles.truckSizeText}>
                {formData.truckSize === 'small' ? 'Small Truck' : 'Big Truck'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Profile Photo */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Profile/Passport Photo *</Text>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => pickImage('photo')}
            >
              {formData.profilePhoto ? (
                <Image source={{ uri: formData.profilePhoto.uri }} style={styles.uploadedImage} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <MaterialIcons name="person" size={32} color={COLORS.gray} />
                  <Text style={styles.uploadText}>Upload Profile Photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Registration'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={styles.skipButtonText}>Skip for Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGreen,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: COLORS.white,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.gray,
  },
  uploadedImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  truckSizeButton: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  truckSizeText: {
    fontSize: 16,
    color: COLORS.darkGreen,
    fontWeight: '600',
  },
  footer: {
    marginTop: 30,
    paddingBottom: 20,
  },
  submitButton: {
    backgroundColor: COLORS.orange,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.orange,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  skipButtonText: {
    color: COLORS.orange,
    fontSize: 16,
    fontWeight: '600',
  },
  debugButton: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  debugButtonText: {
    color: COLORS.darkGreen,
    fontSize: 14,
    fontWeight: '600',
  },
  debugInfo: {
    marginTop: 10,
    padding: 10,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  debugText: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 2,
  },
}); 