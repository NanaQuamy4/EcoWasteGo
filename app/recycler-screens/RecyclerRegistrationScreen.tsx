import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
// Mock user data (replacing useAuth)

// ===== MOCK DATA FOR RECYCLER REGISTRATION =====
// This replaces the backend API call with local mock data
// In a real app, this would come from a database or real-time service

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
  const user = { id: "user_001", username: "User", email: "user@example.com", phone: "+233 24 123 4567", role: "customer", verification_status: "verified", created_at: "2024-01-15T10:30:00Z", profile_image: null, company_name: "Green Team Recycling" };
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

  // Mock function (replacing useAuth)
  const refreshUser = async () => {
    console.log('Mock: Refreshing user data...');
    return Promise.resolve();
  };

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
        setFormData(prev => ({ ...prev, profilePhoto: result.assets[0] }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
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
            // TEMPORARILY DISABLED - Let the app follow the intended flow
            console.log('RecyclerRegistrationScreen: Auto-navigation DISABLED');
            // Navigate to recycler home screen
            // router.replace('/(recycler-tabs)');
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    // Validate form data
    if (!formData.companyName.trim()) {
      Alert.alert('Error', 'Please enter your company name.');
      return;
    }
    if (!formData.residentialAddress.trim()) {
      Alert.alert('Error', 'Please enter your residential address.');
      return;
    }
    if (!formData.areasOfOperation.trim()) {
      Alert.alert('Error', 'Please enter your areas of operation.');
      return;
    }
    if (!formData.truckNumberPlate.trim()) {
      Alert.alert('Error', 'Please enter your truck number plate.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // ===== MOCK API CALL =====
      // This replaces the backend API call with local mock data
      // In a real app, this would send data to a server
      console.log('Submitting recycler registration with data:', formData);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful response
      const mockResponse = {
        success: true,
        message: 'Registration submitted successfully!',
        data: {
          id: 'mock_registration_id',
          status: 'pending',
          submitted_at: new Date().toISOString()
        }
      };
      
      if (mockResponse.success) {
        Alert.alert(
          'Registration Submitted!',
          'Your recycler registration has been submitted successfully. Our team will review your application and get back to you within 24-48 hours.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back to recycler home or show success screen
                router.back();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to submit registration. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting registration:', error);
      Alert.alert('Error', 'Failed to submit registration. Please check your connection and try again.');
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


        </View>

        <View style={styles.form}>
          {/* Company Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Company Name *</Text>
            <View style={[styles.inputContainer, styles.readOnlyInput]}>
              <MaterialIcons 
                name="business" 
                size={20} 
                color={COLORS.green} 
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, styles.readOnlyText]}
                value={formData.companyName}
                editable={false}
                placeholder="Company name from registration"
                autoCapitalize="words"
              />
              <View style={styles.readOnlyBadge}>
                <Text style={styles.readOnlyBadgeText}>✓</Text>
              </View>
            </View>
            <Text style={styles.helperText}>
              Company name from your initial registration
            </Text>
          </View>

          {/* Residential Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Residential Address *</Text>
            <TextInput
              style={styles.input}
              value={formData.residentialAddress}
              onChangeText={(text) => setFormData(prev => ({ ...prev, residentialAddress: text }))}
              placeholder="Enter your complete residential address (e.g., 123 Main Street, Accra, Ghana)"
            />
          </View>

          {/* Areas of Operation */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Areas of Operation *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.areasOfOperation}
              onChangeText={(text) => setFormData(prev => ({ ...prev, areasOfOperation: text }))}
              placeholder="List all areas where you operate (e.g., Accra, Kumasi, Tema, Cape Coast)"
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
              placeholder="Enter your truck's license plate number (e.g., GT-1234-20)"
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    backgroundColor: COLORS.white,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  readOnlyInput: {
    borderColor: COLORS.lightGray,
  },
  readOnlyText: {
    flex: 1,
    paddingRight: 10,
    fontSize: 16,
    color: COLORS.gray,
  },
  inputIcon: {
    marginRight: 10,
  },
  readOnlyBadge: {
    backgroundColor: COLORS.green,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  readOnlyBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  helperText: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
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
