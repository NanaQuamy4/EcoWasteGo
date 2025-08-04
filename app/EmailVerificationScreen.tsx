import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function EmailVerificationScreen() {
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleVerifyEmail = async () => {
    if (!verificationCode.trim()) {
      setError('Please enter the verification code.');
      return;
    }

    if (verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Simulate API call for email verification
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Email Verified',
        'Your email has been successfully verified. You can now login to your account.',
        [
          {
            text: 'OK',
            onPress: () => router.push('/LoginScreen')
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Verification Failed',
        'Invalid verification code. Please check your email and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      // Simulate API call to resend verification code
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert(
        'Code Resent',
        'A new verification code has been sent to your email address.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to resend verification code. Please try again.',
        [{ text: 'OK' }]
      );
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
        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>Please Enter The 6 Digit Code Sent To</Text>
        <Text style={styles.emailText}>nanaquamy4@gmail.com</Text>

        <View style={styles.codeContainer}>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <View key={index} style={styles.codeBox}>
              <TextInput
                style={styles.codeInput}
                value={verificationCode[index] || ''}
                onChangeText={(text) => {
                  const newCode = verificationCode.split('');
                  newCode[index] = text;
                  setVerificationCode(newCode.join(''));
                  setError('');
                }}
                maxLength={1}
                keyboardType="numeric"
                textAlign="center"
                placeholderTextColor="#999"
              />
            </View>
          ))}
        </View>
        
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        <TouchableOpacity 
          style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]} 
          onPress={handleVerifyEmail}
          disabled={isLoading}
        >
          <Text style={styles.verifyButtonText}>
            {isLoading ? 'Verifying...' : 'Verify'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.resendButton} 
          onPress={handleResendCode}
          disabled={isLoading}
        >
          <Text style={styles.resendButtonText}>Resend Code</Text>
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
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    color: '#263A13',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: 'bold',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  codeBox: {
    width: 45,
    height: 50,
    borderWidth: 1,
    borderColor: '#263A13',
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeInput: {
    width: '100%',
    height: '100%',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#263A13',
    textAlign: 'center',
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
    marginBottom: 20,
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
    alignItems: 'center',
  },
  resendButtonText: {
    color: '#1C3301',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
}); 