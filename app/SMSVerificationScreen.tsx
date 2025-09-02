import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants';

// ===== MOCK DATA FOR SMS VERIFICATION =====
// This replaces the backend API calls with local mock data
// In a real app, this would come from a database or SMS service
const mockSMSCodes: { [key: string]: string } = {
  "+233241234567": "123456",
  "+233241234568": "654321", 
  "+233241234569": "789012",
  "+233546732719": "456789" // For Michael Afia
};

// Mock users for registration
const mockUsers = [
  {
    id: "user_001",
    email: "john@example.com",
    password: "123456",
    username: "john_doe",
    phone: "+233241234567",
    role: "customer",
    name: "John Doe"
  },
  {
    id: "user_002",
    email: "green@example.com",
    password: "123456", 
    username: "green_team",
    phone: "+233241234568",
    role: "recycler",
    name: "Green Team",
    companyName: "EcoWaste Solutions Ltd"
  }
];

interface VerificationData {
  phoneNumber: string;
  userType: 'customer' | 'recycler';
  formData: any;
  isRegistration?: boolean;
}

export default function SMSVerificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    phoneNumber?: string;
    userType?: string;
    formData?: string;
    isRegistration?: string;
  }>();
  
  // ===== LOCAL STATE MANAGEMENT =====
  // These state variables manage the verification form and UI state
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes countdown
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60); // 1 minute resend cooldown
  
  // Parse the verification data from navigation params
  const verificationData: VerificationData = {
    phoneNumber: params.phoneNumber || '',
    userType: (params.userType as 'customer' | 'recycler') || 'customer',
    formData: params.formData ? JSON.parse(params.formData) : {},
    isRegistration: params.isRegistration === 'true'
  };

  // ===== TIMER EFFECTS =====
  // These effects manage the countdown timers for code expiration and resend cooldown
  
  // Timer for code expiration (10 minutes)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Resend cooldown timer (1 minute)
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // ===== UTILITY FUNCTIONS =====
  // Format time display for countdown timers
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // ===== MOCK SMS VERIFICATION FUNCTION =====
  // This replaces the backend SMS verification API call
  // It checks if the entered code matches the mock code for the phone number
  const mockVerifySMSCode = (phone: string, code: string, userType: string) => {
    const expectedCode = mockSMSCodes[phone];
    
    if (!expectedCode) {
      return { success: false, message: 'Phone number not found' };
    }
    
    if (expectedCode === code) {
      return { success: true, message: 'Code verified successfully' };
    } else {
      return { success: false, message: 'Invalid verification code' };
    }
  };

  // ===== MOCK REGISTRATION FUNCTION =====
  // This replaces the backend user registration API call
  // It creates a new user and adds them to the mock users array
  const mockRegisterUser = (userData: any) => {
    const newUser = {
      id: `user_${Date.now()}`,
      ...userData,
      smsVerified: true,
      created_at: new Date().toISOString()
    };
    
    // Add to mock users array
    mockUsers.push(newUser);
    
    return { success: true, data: { user: newUser } };
  };

  // ===== MAIN VERIFICATION HANDLER =====
  // This is the main function that handles SMS code verification
  const handleVerifyCode = async () => {
    // Validate the verification code input
    if (!verificationCode.trim()) {
      setCodeError('Please enter the verification code.');
      return;
    }

    if (verificationCode.length !== 6) {
      setCodeError('Please enter a 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setCodeError('');

    try {
      console.log('Verifying SMS code:', {
        phoneNumber: verificationData.phoneNumber,
        code: verificationCode,
        userType: verificationData.userType,
        isRegistration: verificationData.isRegistration
      });

      // Call our mock verification function instead of backend API
      const response = mockVerifySMSCode(
        verificationData.phoneNumber,
        verificationCode,
        verificationData.userType
      );

      if (response.success) {
        if (verificationData.isRegistration) {
          // This is for registration - create account automatically
          await handleRegistration();
        } else {
          // This is for regular verification - show success and navigate back
          Alert.alert(
            'Phone Verified!',
            'Your phone number has been verified successfully.',
            [
              {
                text: 'Continue',
                onPress: () => {
                  // Navigate back to registration with verified status
                  router.replace({
                    pathname: '/RegisterScreen',
                    params: {
                      ...verificationData.formData,
                      smsVerified: 'true',
                      verifiedPhone: verificationData.phoneNumber
                    }
                  });
                }
              }
            ]
          );
        }
      } else {
        Alert.alert('Verification Failed', response.message || 'Invalid verification code');
      }
    } catch (error: any) {
      console.error('SMS verification error:', error);
      let message = 'Failed to verify code. Please try again.';
      
      if (error.message === 'INVALID_CODE') {
        message = 'Invalid verification code. Please check and try again.';
      } else if (error.message === 'CODE_EXPIRED') {
        message = 'Verification code has expired. Please request a new one.';
      }
      
      Alert.alert('Verification Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== REGISTRATION HANDLER =====
  // This function handles user registration after successful SMS verification
  const handleRegistration = async () => {
    try {
      console.log('Creating account with verified phone...');
      
      // Call our mock registration function instead of backend API
      const response = mockRegisterUser({
        email: verificationData.formData.email,
        password: verificationData.formData.password,
        username: verificationData.formData.username,
        phone: verificationData.formData.phone,
        role: verificationData.formData.role,
        companyName: verificationData.formData.companyName,
        smsVerified: true
      });

      if (response.success && response.data && response.data.user) {
        console.log('Registration successful!');
        Alert.alert(
          'Registration Successful!',
          'Your account has been created successfully! You will be redirected to the home screen.',
          [
            {
              text: 'Continue',
              onPress: () => {
                // Navigate to appropriate home screen based on role
                if (verificationData.formData.role === 'recycler') {
                  console.log('SMSVerificationScreen: Navigating to recycler app');
                  router.replace('/(recycler-tabs)');
                } else {
                  console.log('SMSVerificationScreen: Navigating to customer app');
                  router.replace('/(tabs)');
                }
              }
            }
          ]
        );
      } else {
        throw new Error('Registration failed - no user data received');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      let message = 'Registration failed. Please try again.';
      
      if (error.message === 'EMAIL_EXISTS' || error.message?.includes('already exists')) {
        message = 'An account with this email already exists. Please try logging in instead.';
      } else if (error.message?.includes('Network') || error.message?.includes('fetch')) {
        message = 'Network error. Please check your internet connection and try again.';
      }
      
      Alert.alert('Registration Failed', message);
    }
  };

  // ===== RESEND CODE HANDLER =====
  // This function handles resending verification codes
  const handleResendCode = async () => {
    if (!canResend) return;

    setIsLoading(true);
    try {
      // Generate a new mock code for the phone number
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      mockSMSCodes[verificationData.phoneNumber] = newCode;
      
      // Simulate successful resend
      const response = { success: true, message: 'New code sent successfully' };

      if (response.success) {
        Alert.alert('Code Resent', 'A new verification code has been sent to your phone.');
        setTimeLeft(600); // Reset timer
        setCanResend(false);
        setResendCooldown(60); // Reset resend cooldown
        setVerificationCode(''); // Clear current code
      } else {
        Alert.alert('Resend Failed', response.message || 'Failed to resend code');
      }
    } catch (error: any) {
      console.error('SMS resend error:', error);
      let message = 'Failed to resend code. Please try again.';
      
      if (error.message === 'RATE_LIMIT_EXCEEDED') {
        message = 'Too many attempts. Please try again later.';
      } else if (error.message === 'RESEND_TOO_SOON') {
        message = 'Please wait before requesting another code.';
      }
      
      Alert.alert('Resend Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== NAVIGATION HANDLER =====
  const handleBackToRegistration = () => {
    router.back();
  };

  // ===== UI RENDERING =====
  // Mask the phone number for privacy (shows only first 3 and last 2 digits)
  const maskedPhoneNumber = verificationData.phoneNumber.replace(/(\+233\d{2})\d{5}(\d{2})/, '$1*****$2');

  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <Image source={require('../assets/images/logo landscape.png')} style={styles.logo} />
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.title}>
          {verificationData.isRegistration ? 'Verify & Create Account' : 'Verify Your Phone'}
        </Text>
        <Text style={styles.subtitle}>
          {verificationData.isRegistration 
            ? `We've sent a 6-digit verification code to complete your registration{'\n'}`
            : `We've sent a 6-digit verification code to{'\n'}`
          }
          <Text style={styles.phoneNumber}>{maskedPhoneNumber}</Text>
        </Text>

        {/* Timer */}
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>
            Code expires in: <Text style={styles.timerValue}>{formatTime(timeLeft)}</Text>
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Feather name="key" size={20} color="#263A13" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter 6-digit code"
            value={verificationCode}
            onChangeText={text => { 
              setVerificationCode(text.replace(/[^0-9]/g, '').slice(0, 6)); 
              setCodeError(''); 
            }}
            placeholderTextColor="#999"
            keyboardType="numeric"
            maxLength={6}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            textAlign="center"
          />
        </View>
        
        {codeError ? (
          <Text style={styles.errorText}>{codeError}</Text>
        ) : null}

        <TouchableOpacity 
          style={[styles.verifyButton, (isLoading || timeLeft === 0) && styles.verifyButtonDisabled]} 
          onPress={handleVerifyCode}
          disabled={isLoading || timeLeft === 0}
        >
          <Text style={styles.verifyButtonText}>
            {isLoading ? 'Verifying...' : verificationData.isRegistration ? 'Verify & Create Account' : 'Verify Code'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.resendButton} 
          onPress={handleResendCode}
          disabled={!canResend || isLoading}
        >
          <Text style={[
            styles.resendButtonText,
            (!canResend || isLoading) && styles.resendButtonTextDisabled
          ]}>
            {canResend ? 'Didn\'t receive code? Resend' : `Resend in ${resendCooldown}s`}
          </Text>
        </TouchableOpacity>

        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBackToRegistration}
        >
          <Text style={styles.backButtonText}>← Back to Registration</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  logoRow: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  logo: {
    width: 150,
    height: 50,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 22,
  },
  phoneNumber: {
    fontWeight: '600',
    color: COLORS.darkGreen,
  },
  timerContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  timerText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  timerValue: {
    fontWeight: 'bold',
    color: COLORS.orange,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginTop: 20,
    marginBottom: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: COLORS.darkGreen,
    paddingVertical: 12,
  },
  errorText: {
    color: COLORS.red,
    textAlign: 'center',
    marginBottom: 15,
  },
  verifyButton: {
    backgroundColor: COLORS.darkGreen,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendButton: {
    alignSelf: 'center',
    marginTop: 10,
  },
  resendButtonText: {
    color: COLORS.orange,
    fontSize: 14,
    fontWeight: '600',
  },
  resendButtonTextDisabled: {
    color: COLORS.gray,
  },
  backButton: {
    alignSelf: 'center',
    marginTop: 20,
  },
  backButtonText: {
    color: COLORS.darkGreen,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
