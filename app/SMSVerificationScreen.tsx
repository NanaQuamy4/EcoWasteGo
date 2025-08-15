import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS } from '../constants';
import { apiService } from '../services/apiService';

interface VerificationData {
  phoneNumber: string;
  userType: 'customer' | 'recycler';
  formData: any;
}

export default function SMSVerificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    phoneNumber?: string;
    userType?: string;
    formData?: string;
  }>();
  
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60); // 1 minute resend cooldown
  
  const verificationData: VerificationData = {
    phoneNumber: params.phoneNumber || '',
    userType: (params.userType as 'customer' | 'recycler') || 'customer',
    formData: params.formData ? JSON.parse(params.formData) : {}
  };

  // Timer for code expiration
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

  // Resend cooldown timer
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

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-digit verification code');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Verifying SMS code:', {
        phoneNumber: verificationData.phoneNumber,
        code: verificationCode,
        userType: verificationData.userType
      });

      const response = await apiService.verifySMSCode(
        verificationData.phoneNumber,
        verificationCode,
        verificationData.userType
      );

      if (response.success) {
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

  const handleResendCode = async () => {
    if (!canResend) return;

    setIsLoading(true);
    try {
      const response = await apiService.resendSMSVerificationCode(
        verificationData.phoneNumber,
        verificationData.userType
      );

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

  const handleBackToRegistration = () => {
    router.back();
  };

  const maskedPhoneNumber = verificationData.phoneNumber.replace(/(\+233\d{2})\d{5}(\d{2})/, '$1*****$2');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackToRegistration}
          >
            <MaterialIcons name="arrow-back" size={24} color={COLORS.darkGreen} />
          </TouchableOpacity>
          
          <View style={styles.iconContainer}>
            <MaterialIcons name="sms" size={64} color={COLORS.darkGreen} />
          </View>
          
          <Text style={styles.title}>Verify Your Phone</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit verification code to{'\n'}
            <Text style={styles.phoneNumber}>{maskedPhoneNumber}</Text>
          </Text>
        </View>

        {/* Verification Code Input */}
        <View style={styles.form}>
          <Text style={styles.label}>Enter Verification Code</Text>
          <View style={styles.codeInputContainer}>
            <TextInput
              style={styles.codeInput}
              value={verificationCode}
              onChangeText={setVerificationCode}
              placeholder="000000"
              keyboardType="numeric"
              maxLength={6}
              autoFocus
              textAlign="center"
            />
          </View>
          
          {/* Timer */}
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>
              Code expires in: <Text style={styles.timerValue}>{formatTime(timeLeft)}</Text>
            </Text>
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={[
              styles.verifyButton,
              (verificationCode.length !== 6 || isLoading || timeLeft === 0) && styles.verifyButtonDisabled
            ]}
            onPress={handleVerifyCode}
            disabled={verificationCode.length !== 6 || isLoading || timeLeft === 0}
          >
            <Text style={styles.verifyButtonText}>
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </Text>
          </TouchableOpacity>

          {/* Resend Code */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            <TouchableOpacity
              onPress={handleResendCode}
              disabled={!canResend || isLoading}
              style={styles.resendButton}
            >
              <Text style={[
                styles.resendButtonText,
                (!canResend || isLoading) && styles.resendButtonTextDisabled
              ]}>
                {canResend ? 'Resend Code' : `Resend in ${resendCooldown}s`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <MaterialIcons name="security" size={20} color={COLORS.gray} />
          <Text style={styles.securityText}>
            We use SMS verification to secure your account and prevent unauthorized access.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
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
  iconContainer: {
    marginBottom: 20,
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
  form: {
    gap: 20,
    marginBottom: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGreen,
    textAlign: 'center',
  },
  codeInputContainer: {
    alignItems: 'center',
  },
  codeInput: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.lightGray,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 200,
    letterSpacing: 8,
  },
  timerContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  timerText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  timerValue: {
    fontWeight: 'bold',
    color: COLORS.orange,
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
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  resendText: {
    color: COLORS.gray,
    fontSize: 14,
  },
  resendButton: {
    padding: 4,
  },
  resendButtonText: {
    color: COLORS.orange,
    fontSize: 14,
    fontWeight: '600',
  },
  resendButtonTextDisabled: {
    color: COLORS.gray,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.lightGray + '40',
    padding: 16,
    borderRadius: 8,
    gap: 12,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.gray,
    lineHeight: 16,
  },
});
