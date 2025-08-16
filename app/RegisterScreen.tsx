import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import PhoneNumberInput from '../components/PhoneNumberInput';
import { COLORS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { SignupValidationData, validateSignup } from '../utils/validation';

export default function RegisterScreen() {
  const router = useRouter();
  const { selectedRole, smsVerified, verifiedPhone } = useLocalSearchParams<{ 
    selectedRole?: string;
    smsVerified?: string;
    verifiedPhone?: string;
  }>();
  const { register, user } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: verifiedPhone || '',
    password: '',
    confirmPassword: '',
    companyName: '', // For recyclers
  });
  const [countryCode, setCountryCode] = useState('+233'); // Default to Ghana
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');
  
  // Privacy policy agreement states
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [disagreeToTerms, setDisagreeToTerms] = useState(true);

  // SMS verification states
  const [phoneVerified, setPhoneVerified] = useState(smsVerified === 'true');
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);

  const isRecycler = selectedRole === 'recycler';

  // Navigate based on user role after registration
  useEffect(() => {
    if (user) {
      const userRole = user.role || 'customer';
      
      if (userRole === 'recycler') {
        // Always go to recycler home first, verification prompt will be shown there
        router.replace('/(recycler-tabs)');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [user, router]);

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    if (password.length < minLength) errors.push(`At least ${minLength} characters`);
    if (!hasUpperCase) errors.push('One uppercase letter');
    if (!hasLowerCase) errors.push('One lowercase letter');
    if (!hasNumbers) errors.push('One number');
    if (!hasSpecialChar) errors.push('One special character');

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handlePasswordChange = (password: string) => {
    setFormData(prev => ({ ...prev, password }));
    const validation = validatePassword(password);
    setPasswordError(validation.errors.join(', '));
  };

  const handleConfirmPasswordChange = (confirmPassword: string) => {
    setFormData(prev => ({ ...prev, confirmPassword }));
  };

  const handleFullNameChange = (fullName: string) => {
    setFormData(prev => ({ ...prev, fullName }));
  };

  const handleCompanyNameChange = (companyName: string) => {
    setFormData(prev => ({ ...prev, companyName }));
  };

  const [phoneError, setPhoneError] = useState('');
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [emailExistsError, setEmailExistsError] = useState(false);

  // Helper function to suggest email corrections
  const suggestEmailCorrection = (email: string): string | null => {
    const commonMistakes = [
      { pattern: /@gmail\.comn$/, suggestion: email.replace(/@gmail\.comn$/, '@gmail.com'), message: 'Remove the extra "n"' },
      { pattern: /@gmail\.con$/, suggestion: email.replace(/@gmail\.con$/, '@gmail.com'), message: 'Change "con" to "com"' },
      { pattern: /@gmail\.co$/, suggestion: email + 'm', message: 'Add "m" to complete ".com"' },
      { pattern: /@gmail\.c$/, suggestion: email + 'om', message: 'Add "om" to complete ".com"' },
      { pattern: /@gmail\.$/, suggestion: email + 'com', message: 'Add "com" to complete the domain' },
      { pattern: /@gmai\.com$/, suggestion: email.replace(/@gmai\.com$/, '@gmail.com'), message: 'Add "l" to "gmai"' },
      { pattern: /@gmal\.com$/, suggestion: email.replace(/@gmal\.com$/, '@gmail.com'), message: 'Add "i" to "gmal"' },
      { pattern: /@gmil\.com$/, suggestion: email.replace(/@gmil\.com$/, '@gmail.com'), message: 'Add "a" to "gmil"' },
      { pattern: /@hotmai\.com$/, suggestion: email.replace(/@hotmai\.com$/, '@hotmail.com'), message: 'Add "l" to "hotmai"' },
      { pattern: /@yahoo\.co$/, suggestion: email + 'm', message: 'Add "m" to complete ".com"' },
    ];

    for (const mistake of commonMistakes) {
      if (mistake.pattern.test(email)) {
        return `Did you mean "${mistake.suggestion}"? (${mistake.message})`;
      }
    }
    return null;
  };

  const handlePhoneChange = (phone: string) => {
    setFormData(prev => ({ ...prev, phone }));
  };

  const handlePhoneValidation = (isValid: boolean, error?: string) => {
    setIsPhoneValid(isValid);
    setPhoneError(error || '');
  };

  const handleAgreeToTerms = () => {
    setAgreeToTerms(true);
    setDisagreeToTerms(false);
  };

  const handleDisagreeToTerms = () => {
    setDisagreeToTerms(true);
    setAgreeToTerms(false);
  };

  const handleVerifyPhone = async () => {
    // Validate phone number first
    if (!isPhoneValid || !formData.phone.trim()) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number before verification.');
      return;
    }

    setIsVerifyingPhone(true);
    try {
      const response = await apiService.sendSMSVerificationCode(
        formData.phone, 
        selectedRole as 'customer' | 'recycler'
      );

      if (response.success) {
        // Navigate to SMS verification screen
        router.push({
          pathname: '/SMSVerificationScreen',
          params: {
            phoneNumber: formData.phone,
            userType: selectedRole,
            formData: JSON.stringify(formData)
          }
        });
      } else {
        Alert.alert('Verification Failed', response.message || 'Failed to send verification code');
      }
    } catch (error: any) {
      console.error('SMS verification error:', error);
      Alert.alert('Verification Failed', 'Failed to send SMS verification code. Please try again.');
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  const handleRegister = async () => {
    // Clear previous validation errors
    setValidationErrors([]);

    // Check if phone is verified
    if (!phoneVerified) {
      Alert.alert(
        'Phone Verification Required', 
        'Please verify your phone number before registering.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Verify Now', onPress: handleVerifyPhone }
        ]
      );
      return;
    }

    // Check terms agreement
    if (!agreeToTerms) {
      Alert.alert('Required', 'You must agree to the Terms and Conditions to continue.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    // Prepare validation data
    const validationData: SignupValidationData = {
      email: formData.email,
      phoneNumber: formData.phone,
      countryCode: countryCode,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      fullName: formData.fullName,
      companyName: isRecycler ? formData.companyName : undefined,
    };

    // Validate all fields
    const validation = validateSignup(validationData);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      Alert.alert('Validation Error', validation.errors.join('\n'));
      return;
    }

    // Additional validation for recyclers
    if (isRecycler && !formData.companyName.trim()) {
      Alert.alert('Error', 'Company name is required for recyclers');
      return;
    }

    setIsLoading(true);
    console.log('Starting SMS-verified registration process...');
    
    try {
      // Use SMS-verified registration endpoint
      const response = await apiService.registerWithSMSVerification({
        email: formData.email,
        password: formData.password,
        username: formData.fullName,
        phone: validation.formattedPhone || formData.phone,
        role: selectedRole as 'customer' | 'recycler',
        companyName: isRecycler ? formData.companyName : undefined,
        smsVerified: phoneVerified
      });

      if (response.success) {
        console.log('SMS-verified registration successful!');
        Alert.alert(
          'Registration Successful!',
          'Your account has been created with verified phone number. You can now login.',
          [
            {
              text: 'Login Now',
              onPress: () => router.push('/LoginScreen')
            }
          ]
        );
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      let message = 'Registration failed. Please try again.';
      if (error.message === 'EMAIL_EXISTS' || error.message?.includes('already exists')) {
        message = 'An account with this email already exists. Please try logging in instead.';
      } else if (error.message === 'INVALID_EMAIL') {
        message = 'Please enter a valid email address.';
      } else if (error.message?.includes('Network') || error.message?.includes('fetch')) {
        message = 'Network error. Please check your internet connection and try again.';
      } else if (error.message?.includes('invalid')) {
        message = 'Please check your email format and try again.';
      }
      
      if (error.message === 'EMAIL_EXISTS' || error.message?.includes('already exists')) {
        setEmailExistsError(true);
        Alert.alert(
          'Account Already Exists',
          'An account with this email already exists. What would you like to do?',
          [
            {
              text: 'Try Different Email',
              style: 'cancel',
            },
            {
              text: 'Forgot Password?',
              onPress: () => router.push('/ForgotPasswordScreen'),
            },
            {
              text: 'Go to Login',
              onPress: () => router.push('/LoginScreen'),
            },
          ]
        );
      } else {
        Alert.alert('Registration Failed', message);
      }
    } finally {
      console.log('Registration process completed');
      setIsLoading(false);
    }
  };

  const handleBackToRoleSelection = () => {
    router.push('/RoleSelectionScreen');
  };

  const handleViewTerms = () => {
    // For now, we'll use the same privacy policy screen for terms
    // In the future, you might want to create a separate Terms screen
    const privacyScreen = isRecycler ? '/recycler-screens/RecyclerPrivacyScreen' : '/customer-screens/CustomerPrivacyScreen';
    router.push(privacyScreen as any);
  };

  // Check if user can register (all validations must pass)
  const canRegister = 
    agreeToTerms && 
    formData.email.trim() !== '' &&
    formData.fullName.trim() !== '' &&
    formData.phone.trim() !== '' &&
    formData.password.trim() !== '' &&
    formData.confirmPassword.trim() !== '' &&
    formData.password === formData.confirmPassword &&
    !emailError &&
    !passwordError &&
    isPhoneValid &&
    phoneVerified && // Must verify phone number
    (isRecycler ? formData.companyName.trim() !== '' : true);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackToRoleSelection}
            >
              <MaterialIcons name="arrow-back" size={24} color={COLORS.darkGreen} />
            </TouchableOpacity>
            
            <Text style={styles.title}>
              {isRecycler ? 'Recycler Registration' : 'Customer Registration'}
            </Text>
            <Text style={styles.subtitle}>
              Create your account to get started
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {isRecycler && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Company Name *</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons 
                    name="business" 
                    size={20} 
                    color={COLORS.gray} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, formData.companyName.trim() === '' && styles.inputError]}
                    value={formData.companyName}
                    onChangeText={handleCompanyNameChange}
                    placeholder="Enter company name"
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {isRecycler ? 'Your Full Name' : 'Full Name'} *
              </Text>
              <View style={styles.inputContainer}>
                <MaterialIcons 
                  name="person" 
                  size={20} 
                  color={COLORS.gray} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, formData.fullName.trim() === '' && styles.inputError]}
                  value={formData.fullName}
                  onChangeText={handleFullNameChange}
                  placeholder={isRecycler ? "Enter your full name" : "Enter your full name"}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address *</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons 
                  name="email" 
                  size={20} 
                  color={formData.email.trim() !== '' && !emailError ? COLORS.green : COLORS.gray} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={[
                    styles.input, 
                    (formData.email.trim() === '' || emailError || emailExistsError) && styles.inputError,
                    formData.email.trim() !== '' && !emailError && !emailExistsError && { borderColor: COLORS.green }
                  ]}
                  value={formData.email}
                  onChangeText={(text) => {
                    // Trim whitespace and remove any extra characters
                    const cleanEmail = text.trim().toLowerCase();
                    setFormData(prev => ({ ...prev, email: cleanEmail }));
                    
                    // Clear email error when user types
                    setEmailError('');
                    setEmailExistsError(false);
                    
                    // Enhanced email validation
                    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                    
                    if (cleanEmail) {
                      // Check for common email mistakes
                      if (cleanEmail.includes(' ')) {
                        setEmailError('Email address cannot contain spaces');
                      } else if (!cleanEmail.includes('@')) {
                        setEmailError('Email address must contain @ symbol');
                      } else if (!cleanEmail.includes('.')) {
                        setEmailError('Email address must contain a domain (e.g., .com, .org)');
                      } else if (cleanEmail.startsWith('@') || cleanEmail.endsWith('@')) {
                        setEmailError('Email address cannot start or end with @');
                      } else if (!emailRegex.test(cleanEmail)) {
                        // Check for common email mistakes and suggest corrections
                        const suggestion = suggestEmailCorrection(cleanEmail);
                        if (suggestion) {
                          setEmailError(suggestion);
                        } else {
                          setEmailError('Please enter a valid email address (e.g., user@example.com)');
                        }
                      }
                    }
                  }}
                  placeholder="Enter your email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                />
              </View>
              {emailError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{emailError}</Text>
                  {emailError.includes('Did you mean') && (
                    <TouchableOpacity
                      style={styles.quickFixButton}
                      onPress={() => {
                        const suggestion = suggestEmailCorrection(formData.email);
                        if (suggestion) {
                          // Extract the suggested email from the error message
                          const match = suggestion.match(/Did you mean "([^"]+)"/);
                          if (match) {
                            setFormData(prev => ({ ...prev, email: match[1] }));
                            setEmailError('');
                          }
                        }
                      }}
                    >
                      <Text style={styles.quickFixText}>Quick Fix</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : null}
              {emailExistsError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>This email is already registered. Try a different email or log in.</Text>
                  <TouchableOpacity
                    style={styles.quickFixButton}
                    onPress={() => router.push('/LoginScreen')}
                  >
                    <Text style={styles.quickFixText}>Login</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <PhoneNumberInput
                value={formData.phone}
                onChangeText={handlePhoneChange}
                onCountryChange={setCountryCode}
                selectedCountryCode={countryCode.replace('+', '')}
                placeholder="Enter your phone number"
                error={phoneError || (formData.phone.trim() === '' ? 'Phone number is required' : undefined)}
                onValidationChange={handlePhoneValidation}
              />
              
              {/* Phone Verification Section */}
              <View style={styles.phoneVerificationSection}>
                {phoneVerified ? (
                  <View style={styles.verifiedContainer}>
                    <MaterialIcons name="verified" size={20} color={COLORS.green} />
                    <Text style={styles.verifiedText}>Phone number verified ✓</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.verifyPhoneButton,
                      (!isPhoneValid || isVerifyingPhone) && styles.verifyPhoneButtonDisabled
                    ]}
                    onPress={handleVerifyPhone}
                    disabled={!isPhoneValid || isVerifyingPhone}
                  >
                    <MaterialIcons 
                      name="sms" 
                      size={16} 
                      color={isPhoneValid && !isVerifyingPhone ? COLORS.white : COLORS.gray} 
                    />
                    <Text style={[
                      styles.verifyPhoneButtonText,
                      (!isPhoneValid || isVerifyingPhone) && styles.verifyPhoneButtonTextDisabled
                    ]}>
                      {isVerifyingPhone ? 'Sending...' : 'Verify via SMS'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password *</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="lock" size={20} color={COLORS.gray} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, (formData.password.trim() === '' || passwordError) && styles.inputError]}
                  value={formData.password}
                  onChangeText={handlePasswordChange}
                  placeholder="Create a password"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <MaterialIcons 
                    name={showPassword ? "visibility" : "visibility-off"} 
                    size={20} 
                    color={COLORS.gray} 
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password *</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="lock" size={20} color={COLORS.gray} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, (formData.confirmPassword.trim() === '' || formData.password !== formData.confirmPassword) && styles.inputError]}
                  value={formData.confirmPassword}
                  onChangeText={handleConfirmPasswordChange}
                  placeholder="Confirm your password"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <MaterialIcons 
                    name={showConfirmPassword ? "visibility" : "visibility-off"} 
                    size={20} 
                    color={COLORS.gray} 
                  />
                </TouchableOpacity>
              </View>
              {formData.confirmPassword.trim() !== '' && formData.password !== formData.confirmPassword ? (
                <Text style={styles.errorText}>Passwords do not match</Text>
              ) : null}
            </View>

            {/* Privacy Policy Agreements */}
            <View style={styles.agreementSection}>
              <Text style={styles.agreementTitle}>Agreements</Text>
              
              <View style={styles.checkboxRow}>
                <TouchableOpacity 
                  style={styles.checkbox} 
                  onPress={handleDisagreeToTerms}
                >
                  <View style={[styles.checkboxBox, disagreeToTerms && styles.checkboxChecked]}>
                    {disagreeToTerms && <Text style={styles.checkboxTick}>✓</Text>}
                  </View>
                  <View style={styles.checkboxTextContainer}>
                    <Text style={styles.checkboxLabel}>
                      <Text style={{fontWeight:'bold'}}>I Disagree</Text> to the Terms and Conditions
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.checkboxRow}>
                <TouchableOpacity 
                  style={styles.checkbox} 
                  onPress={handleAgreeToTerms}
                >
                  <View style={[styles.checkboxBox, agreeToTerms && styles.checkboxChecked]}>
                    {agreeToTerms && <Text style={styles.checkboxTick}>✓</Text>}
                  </View>
                  <View style={styles.checkboxTextContainer}>
                    <Text style={styles.checkboxLabel}>
                      <Text style={{fontWeight:'bold'}}>I Agree</Text> to the{' '}
                      <Text style={styles.linkText} onPress={handleViewTerms}>
                        Terms and Conditions
                      </Text>
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.registerButton, 
                (!canRegister || isLoading) && styles.registerButtonDisabled
              ]}
              onPress={handleRegister}
              disabled={!canRegister || isLoading}
            >
              <Text style={styles.registerButtonText}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/LoginScreen')}>
              <Text style={styles.loginText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
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
    backgroundColor: COLORS.white,
  },
  inputIcon: {
    marginLeft: 12,
    marginRight: 8,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#FF6B6B',
    borderWidth: 1,
  },
  eyeButton: {
    padding: 12,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  quickFixButton: {
    backgroundColor: COLORS.orange,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  quickFixText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  agreementSection: {
    marginTop: 10,
  },
  agreementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGreen,
    marginBottom: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: COLORS.darkGreen,
    borderRadius: 4,
    marginRight: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: COLORS.darkGreen,
    borderColor: COLORS.darkGreen,
  },
  checkboxTick: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  checkboxTextContainer: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 14,
    color: COLORS.darkGreen,
    lineHeight: 20,
  },
  linkText: {
    color: COLORS.orange,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: COLORS.darkGreen,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  footerText: {
    color: COLORS.gray,
    fontSize: 16,
  },
  loginText: {
    color: COLORS.orange,
    fontSize: 16,
    fontWeight: '600',
  },
  phoneVerificationSection: {
    marginTop: 12,
  },
  verifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green + '20',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  verifiedText: {
    color: COLORS.green,
    fontSize: 14,
    fontWeight: '600',
  },
  verifyPhoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.orange,
    padding: 12,
    borderRadius: 8,
    gap: 8,
    justifyContent: 'center',
  },
  verifyPhoneButtonDisabled: {
    backgroundColor: COLORS.lightGray,
  },
  verifyPhoneButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  verifyPhoneButtonTextDisabled: {
    color: COLORS.gray,
  },
}); 