import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { supabase } from '../lib/supabase';

export default function RegisterScreen() {
  const router = useRouter();
  const { selectedRole } = useLocalSearchParams<{ 
    selectedRole?: string;
  }>();
  
  // ===== LOCAL STATE MANAGEMENT =====
  // These state variables manage the form inputs and validation
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    companyName: '', // For recyclers
  });
  const [countryCode, setCountryCode] = useState('+233'); // Default to Ghana
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  
  // Privacy policy agreement states
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [disagreeToTerms, setDisagreeToTerms] = useState(true);

  // Debug logging for role parameter
  console.log('RegisterScreen: selectedRole from params:', selectedRole);
  
  const isRecycler = selectedRole === 'recycler';
  
  // Set default role if none provided (fallback to customer)
  const userRole = selectedRole || 'customer';

  // ===== NAVIGATION EFFECT =====
  // This effect automatically navigates users to the correct screen after registration
  // TEMPORARILY DISABLED - Let the app follow the intended flow
  useEffect(() => {
    // The user object is no longer managed by AuthContext, so this effect is no longer relevant
    // if (user) {
    //   const userRole = user.role || 'customer';
    //   console.log('RegisterScreen: User registered with role:', userRole);
    //   console.log('RegisterScreen: Auto-navigation DISABLED - staying on registration screen');
      
    //   // TEMPORARILY DISABLED - Let the app follow the intended flow
    //   // if (userRole === 'recycler') {
    //   //   // Always go to recycler home first, verification prompt will be shown there
    //   //   router.replace('/(recycler-tabs)');
    //   // } else {
    //   //   router.replace('/(tabs)');
    //   // }
    // }
  }, [router]);

  // ===== VALIDATION FUNCTIONS =====
  // These functions handle form validation
  
  // Validate password strength
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

  // Handle password input changes
  const handlePasswordChange = (password: string) => {
    setFormData(prev => ({ ...prev, password }));
    
    // Clear previous password errors
    setPasswordError('');
    
    // Validate password strength
    const validation = validatePassword(password);
    if (!validation.isValid) {
      setPasswordError(validation.errors.join(', '));
    }
  };
  
  // Add missing handler functions
  const handleCompanyNameChange = (companyName: string) => {
    setFormData(prev => ({ ...prev, companyName }));
  };
  
  const handleFullNameChange = (fullName: string) => {
    setFormData(prev => ({ ...prev, fullName }));
  };
  
  const handleEmailChange = (email: string) => {
    setFormData(prev => ({ ...prev, email }));
    
    // Clear previous email errors
    setEmailError('');
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.trim() !== '' && !emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
    }
  };
  
  const handlePhoneChange = (phone: string) => {
    setFormData(prev => ({ ...prev, phone }));
    
    // Clear phone validation when user starts typing
    if (phone.trim() !== '') {
      setIsPhoneValid(false);
    }
  };
  
  const handlePhoneValidation = (isValid: boolean) => {
    setIsPhoneValid(isValid);
  };
  
  const handleConfirmPasswordChange = (confirmPassword: string) => {
    setFormData(prev => ({ ...prev, confirmPassword }));
  };
  
  const handleAgreeToTerms = () => {
    setAgreeToTerms(true);
    setDisagreeToTerms(false);
  };
  
  const handleDisagreeToTerms = () => {
    setDisagreeToTerms(true);
    setAgreeToTerms(false);
  };



  // ===== MAIN REGISTRATION HANDLER =====
  // This function handles the complete registration process
  const handleRegister = async () => {
    // Validate all required fields
    if (!canRegister) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly');
      return;
    }

    try {
      setIsLoading(true);
      console.log('RegisterScreen: Starting registration process...');
      console.log('RegisterScreen: Form data:', {
        email: formData.email,
        fullName: formData.fullName,
        phone: formData.phone,
        countryCode: countryCode,
        fullPhoneNumber: `${countryCode}${formData.phone}`,
        role: userRole,
        companyName: formData.companyName
      });
      
      console.log('RegisterScreen: isRecycler:', isRecycler);
      console.log('RegisterScreen: selectedRole from params:', selectedRole);
      
      // Check if email already exists in the opposite role table
      console.log('RegisterScreen: Checking for existing email in opposite role...');
      const { data: existingUsers, error: checkError } = await supabase
        .from(isRecycler ? 'customers' : 'recyclers')
        .select('email')
        .eq('email', formData.email);

      if (checkError) {
        console.error('RegisterScreen: Error checking existing email:', checkError);
        Alert.alert('Error', 'Failed to validate email. Please try again.');
        return;
      }

      if (existingUsers && existingUsers.length > 0) {
        const oppositeRole = isRecycler ? 'customer' : 'recycler';
        Alert.alert(
          'Email Already Registered', 
          `This email is already registered as a ${oppositeRole}. Please use a different email or sign in with your existing account.`
        );
        return;
      }
      
      // Combine country code with phone number for full international format
      const fullPhoneNumber = `${countryCode}${formData.phone}`;
      
      console.log('RegisterScreen: Full phone number:', fullPhoneNumber);
      
      // Prepare the Supabase signUp payload
      const signUpPayload = {
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: fullPhoneNumber,
            role: userRole,
            company_name: formData.companyName,
          },
        },
      };
      
      console.log('RegisterScreen: Supabase signUp payload:', JSON.stringify(signUpPayload, null, 2));
      
      // Call Supabase auth signUp
      const { data, error } = await supabase.auth.signUp(signUpPayload);

      if (error) {
        console.error('RegisterScreen: Registration failed:', error);
        console.error('RegisterScreen: Full error object:', JSON.stringify(error, null, 2));
        console.error('RegisterScreen: Error details:', {
          message: error.message,
          status: error.status,
          name: error.name,
          details: (error as any).details,
          hint: (error as any).hint,
        });
        
        // Handle specific error cases
        let errorMessage = 'An unexpected error occurred';
        if (error.message.includes('User already registered')) {
          errorMessage = 'An account with this email already exists. Please sign in instead.';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (error.message.includes('Password')) {
          errorMessage = 'Password must be at least 6 characters long.';
        } else if (error.message.includes('Database error saving new user')) {
          errorMessage = 'Database error during registration. Please try again or contact support.';
        } else {
          errorMessage = error.message;
        }
        
        Alert.alert('Registration Failed', errorMessage);
      } else if (data.user) {
        console.log('RegisterScreen: Registration successful for user:', data.user.id);
        console.log('RegisterScreen: User object:', JSON.stringify(data.user, null, 2));
        console.log('RegisterScreen: User metadata:', JSON.stringify(data.user.user_metadata, null, 2));
        
        Alert.alert(
          'Registration Successful!', 
          'Please check your inbox for email verification before signing in.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back to login screen
                router.push('/LoginScreen');
              }
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('RegisterScreen: Registration error:', error);
      Alert.alert('Registration Failed', 'An unexpected error occurred. Please try again.');
    } finally {
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
                    color={formData.companyName.trim() !== '' ? COLORS.green : COLORS.gray} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[
                      styles.input, 
                      formData.companyName.trim() === '' && styles.inputError,
                      formData.companyName.trim() !== '' && { borderColor: COLORS.green }
                    ]}
                    value={formData.companyName}
                    onChangeText={handleCompanyNameChange}
                    placeholder="Enter your company name (e.g., Green Waste Solutions Ltd.)"
                    autoCapitalize="words"
                  />
                </View>

              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons 
                  name="person" 
                  size={20} 
                  color={formData.fullName.trim() !== '' ? COLORS.green : COLORS.gray} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={[
                    styles.input, 
                    formData.fullName.trim() === '' && styles.inputError,
                    formData.fullName.trim() !== '' && { borderColor: COLORS.green }
                  ]}
                  value={formData.fullName}
                  onChangeText={handleFullNameChange}
                  placeholder="Enter your full name (e.g., John Doe)"
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
                    (formData.email.trim() === '' || emailError) && styles.inputError,
                    formData.email.trim() !== '' && !emailError && { borderColor: COLORS.green }
                  ]}
                  value={formData.email}
                  onChangeText={handleEmailChange}
                  placeholder="Enter your email address (e.g., john.doe@example.com)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                />
              </View>
              {emailError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{emailError}</Text>
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
                placeholder="Enter your phone number (e.g., 0241234567)"
                error={formData.phone.trim() === '' ? 'Phone number is required' : undefined}
                onValidationChange={handlePhoneValidation}
              />
              {formData.phone.trim() !== '' && isPhoneValid && (
                <View style={styles.successContainer}>
                  <MaterialIcons name="check-circle" size={16} color={COLORS.green} />
                  <Text style={styles.successText}>Valid phone number</Text>
                </View>
              )}
            </View>





            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password *</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="lock" size={20} color={COLORS.gray} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: COLORS.darkGreen }, (formData.password.trim() === '' || passwordError) && styles.inputError]}
                  value={formData.password}
                  onChangeText={handlePasswordChange}
                  placeholder="Create a strong password (min. 8 characters)"
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
                  style={[styles.input, { color: COLORS.darkGreen }, (formData.confirmPassword.trim() === '' || formData.password !== formData.confirmPassword) && styles.inputError]}
                  value={formData.confirmPassword}
                  onChangeText={handleConfirmPasswordChange}
                  placeholder="Confirm your password (must match above)"
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
    color: COLORS.darkGreen,
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
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  successText: {
    color: COLORS.green,
    fontSize: 12,
    marginLeft: 4,
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
});