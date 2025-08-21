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
import { LoginValidationData, validateLogin } from '../utils/validation';

export default function LoginScreen() {
  const router = useRouter();
  const { selectedRole } = useLocalSearchParams<{ selectedRole?: string }>();
  const { login, user } = useAuth();
  
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [countryCode, setCountryCode] = useState('+233'); // Default to Ghana
  const [phoneError, setPhoneError] = useState('');
  const [isPhoneValid, setIsPhoneValid] = useState(false);

  // Navigate based on user role after login
  useEffect(() => {
    if (user) {
      const userRole = user.role || 'customer';
      console.log('LoginScreen: User logged in with role:', userRole);
      console.log('LoginScreen: Full user object:', user);
      
      if (userRole === 'recycler') {
        console.log('LoginScreen: Navigating to recycler screens');
        router.replace('/(recycler-tabs)');
      } else {
        console.log('LoginScreen: Navigating to customer screens');
        router.replace('/(tabs)');
      }
    }
  }, [user, router]);

  const handlePhoneChange = (phoneNumber: string) => {
    setPhone(phoneNumber);
  };

  const handlePhoneValidation = (isValid: boolean, error?: string) => {
    setIsPhoneValid(isValid);
    setPhoneError(error || '');
  };

  const handleLogin = async () => {
    // Prepare validation data
    const validationData: LoginValidationData = {
      phone: phone,
      password: password,
    };

    // Validate all fields
    const validation = validateLogin(validationData);
    
    if (!validation.isValid) {
      Alert.alert('Validation Error', validation.errors.join('\n'));
      return;
    }

    console.log('LoginScreen: Starting login process...');
    setIsLoading(true);
    
    try {
      console.log('LoginScreen: Calling login function...');
      await login(phone, password, selectedRole as 'customer' | 'recycler' | undefined);
      console.log('LoginScreen: Login function completed successfully');
      // Navigation will be handled by useEffect when user state updates
    } catch (error: any) {
      console.error('LoginScreen: Login error occurred:', error);
      
      let message = 'Login failed. Please try again.';
      let title = 'Login Error';
      
      if (error.message === 'ACCOUNT_NOT_FOUND') {
        message = 'No account found with this phone number. Please check your phone number or create a new account.';
      } else if (error.message === 'INVALID_PASSWORD') {
        message = 'Incorrect password. Please try again.';
      } else if (error.message === 'INVALID_CREDENTIALS') {
        message = 'Invalid phone number or password. Please check your credentials.';
      } else if (error.message?.includes('Authentication failed')) {
        message = 'Session expired. Please log in again.';
      } else if (error.message?.includes('Network')) {
        message = 'Network error. Please check your internet connection.';
      } else if (error.message?.includes('Access denied') || error.message?.includes('ROLE_MISMATCH')) {
        title = 'Role Mismatch';
        if (error.message?.includes('customer')) {
          message = 'This account is registered as a customer. Please select "Customer Login" instead of "Recycler Login".';
        } else if (error.message?.includes('recycler')) {
          message = 'This account is registered as a recycler. Please select "Recycler Login" instead of "Customer Login".';
        } else {
          message = 'This account is registered with a different role. Please log in using the correct role.';
        }
      } else if (error.message?.includes('Request timed out')) {
        message = 'Request timed out. Please check your internet connection and try again.';
      } else if (error.message?.includes('Unable to connect to the server')) {
        message = 'Unable to connect to the server. Please check your internet connection and ensure the backend is running.';
      } else if (error.message?.includes('Backend server is not accessible')) {
        message = 'Backend server is not accessible. Please check your internet connection and ensure the backend is running on port 3000.';
      }
      
      console.log('LoginScreen: Showing error alert with message:', message);
      Alert.alert(title, message);
    } finally {
      console.log('LoginScreen: Setting loading to false');
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    // Pass the selected role to registration
    router.push({
      pathname: '/RegisterScreen',
      params: { selectedRole }
    });
  };

  const handleBackToRoleSelection = () => {
    router.push('/RoleSelectionScreen');
  };

  const handleForgotPassword = () => {
    console.log('Forgot Password button clicked');
    console.log('Navigating to ForgotPasswordScreen');
    router.replace('/ForgotPasswordScreen');
  };

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
              {selectedRole === 'recycler' ? 'Recycler Login' : 'Customer Login'}
            </Text>
            <Text style={styles.subtitle}>
              Welcome back! Please sign in to continue
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <PhoneNumberInput
                value={phone}
                onChangeText={handlePhoneChange}
                onCountryChange={setCountryCode}
                selectedCountryCode={countryCode.replace('+', '')}
                placeholder="Enter your phone number"
                error={phoneError || (phone.trim() === '' ? 'Phone number is required' : undefined)}
                onValidationChange={handlePhoneValidation}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="lock" size={20} color={COLORS.gray} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
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
            </View>

            <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Logging in...' : 'LOGIN'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don&apos;t have an account? </Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={styles.registerText}>Sign Up</Text>
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
  eyeButton: {
    padding: 12,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    color: COLORS.orange,
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: COLORS.darkGreen,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
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
  registerText: {
    color: COLORS.orange,
    fontSize: 16,
    fontWeight: '600',
  },
}); 