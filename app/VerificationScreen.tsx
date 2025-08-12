import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function VerificationScreen() {
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [codeError, setCodeError] = useState('');
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email as string;
  const { verifyEmail, forgotPassword } = useAuth();

  useEffect(() => {
    console.log('VerificationScreen rendered');
    console.log('Email:', email);
  }, [email]);

  const handleVerifyCode = async () => {
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
      await verifyEmail(email, verificationCode);
      
      Alert.alert(
        'Email Verified',
        'Your email has been verified successfully. You can now reset your password.',
        [
          {
            text: 'OK',
            onPress: () => router.push({
              pathname: '/ResetPasswordScreen',
              params: { email: email, verified: 'true' }
            })
          }
        ]
      );
    } catch (error: any) {
      console.error('Verification error:', error);
      
      let message = 'Failed to verify code. Please try again.';
      if (error.message === 'INVALID_CODE') {
        message = 'Invalid verification code. Please check and try again.';
      } else if (error.message === 'CODE_EXPIRED') {
        message = 'Verification code has expired. Please request a new code.';
      } else if (error.message?.includes('Network') || error.message?.includes('fetch')) {
        message = 'Network error. Please check your internet connection and try again.';
      }
      
      Alert.alert('Error', message, [{ text: 'OK' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setIsLoading(true);
      await forgotPassword(email);
      Alert.alert('Code Resent', 'A new verification code has been sent to your email.');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <Image source={require('../assets/images/logo landscape.png')} style={styles.logo} />
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>We&apos;ve sent a 6-digit code to {email}</Text>

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
          />
        </View>
        
        {codeError ? (
          <Text style={styles.errorText}>{codeError}</Text>
        ) : null}

        <TouchableOpacity 
          style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]} 
          onPress={handleVerifyCode}
          disabled={isLoading}
        >
          <Text style={styles.verifyButtonText}>
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.resendButton} 
          onPress={handleResendCode}
          disabled={isLoading}
        >
          <Text style={styles.resendButtonText}>
            Didn&apos;t receive code? Resend
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF6',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  logoRow: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 180,
    height: 70,
    resizeMode: 'contain',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#263A13',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#263A13',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#263A13',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    height: 50,
    width: '100%',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 18,
    color: '#263A13',
    textAlign: 'center',
    letterSpacing: 2,
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
    fontSize: 14,
    textAlign: 'center',
  },
  verifyButton: {
    backgroundColor: '#1C3301',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  verifyButtonDisabled: {
    backgroundColor: '#A3C47C',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendButton: {
    marginTop: 20,
    paddingVertical: 10,
  },
  resendButtonText: {
    color: '#1C3301',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
