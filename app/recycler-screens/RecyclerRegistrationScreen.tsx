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
  businessLocation: string;
  areasOfOperation: string;
  availableResources: string;
  passportPhoto: ImagePicker.ImagePickerAsset | null;
  businessDocument: ImagePicker.ImagePickerAsset | null;
}

export default function RecyclerRegistrationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    businessLocation: '',
    areasOfOperation: '',
    availableResources: '',
    passportPhoto: null,
    businessDocument: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill company name from user data
  useEffect(() => {
    console.log('RecyclerRegistrationScreen: User data:', user);
    console.log('RecyclerRegistrationScreen: Company name:', user?.company_name);
    if (user?.company_name) {
      setFormData(prev => ({ ...prev, companyName: user.company_name }));
    }
  }, [user]);

  const pickImage = async (type: 'photo' | 'document') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        if (type === 'photo') {
          setFormData(prev => ({ ...prev, passportPhoto: result.assets[0] }));
        } else {
          setFormData(prev => ({ ...prev, businessDocument: result.assets[0] }));
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
    if (!formData.businessLocation.trim()) {
      Alert.alert('Error', 'Business location is required');
      return false;
    }
    if (!formData.areasOfOperation.trim()) {
      Alert.alert('Error', 'Areas of operation is required');
      return false;
    }
    if (!formData.availableResources.trim()) {
      Alert.alert('Error', 'Available resources is required');
      return false;
    }
    if (!formData.passportPhoto) {
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
        businessLocation: formData.businessLocation,
        areasOfOperation: formData.areasOfOperation,
        availableResources: formData.availableResources,
        passportPhotoUrl: formData.passportPhoto?.uri,
        businessDocumentUrl: formData.businessDocument?.uri,
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
            Please provide the following information to verify your business
          </Text>
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

          {/* Business Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Location *</Text>
            <TextInput
              style={styles.input}
              value={formData.businessLocation}
              onChangeText={(text) => setFormData(prev => ({ ...prev, businessLocation: text }))}
              placeholder="Region, City (e.g., Kumasi, Ashanti)"
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

          {/* Available Resources */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Available Resources *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.availableResources}
              onChangeText={(text) => setFormData(prev => ({ ...prev, availableResources: text }))}
              placeholder="Describe your pickup resources (e.g., 2 trucks, 1 van, 5 staff)"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Profile Photo */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Profile/Passport Photo *</Text>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => pickImage('photo')}
            >
              {formData.passportPhoto ? (
                <Image source={{ uri: formData.passportPhoto.uri }} style={styles.uploadedImage} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <MaterialIcons name="add-a-photo" size={32} color={COLORS.gray} />
                  <Text style={styles.uploadText}>Upload Photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Business Document */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Registration Document (Optional)</Text>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => pickImage('document')}
            >
              {formData.businessDocument ? (
                <Image source={{ uri: formData.businessDocument.uri }} style={styles.uploadedImage} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <MaterialIcons name="description" size={32} color={COLORS.gray} />
                  <Text style={styles.uploadText}>Upload Document</Text>
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
}); 