import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function ForgotPasswordScreen() {
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { forgotPassword } = useAuth();

  useEffect(() => {
    console.log('ForgotPasswordScreen rendered');
  }, []);

  function validatePhone(phone: string) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 9 && cleaned.length <= 15;
  }

  const handleSendVerificationCode = async () => {
    if (!phone.trim()) {
      setPhoneError('Please enter your phone number.');
      return;
    }

    if (!validatePhone(phone)) {
      setPhoneError('Please enter a valid phone number.');
      return;
    }

    setIsLoading(true);
    setPhoneError('');

    try {
      await forgotPassword(phone);
      
      Alert.alert(
        'Verification Code Sent',
        'We\'ve sent a 6-digit verification code to your phone number. Please check your SMS and enter the code.',
        [
          {
            text: 'OK',
            onPress: () => router.push({
              pathname: '/VerificationScreen',
              params: { phone: phone }
            })
          }
        ]
      );
    } catch (error: any) {
      console.error('Forgot password error:', error);
      
      let message = 'Failed to send verification code. Please try again.';
      if (error.message === 'PHONE_NOT_FOUND') {
        message = 'No account found with this phone number.';
      } else if (error.message?.includes('Network') || error.message?.includes('fetch')) {
        message = 'Network error. Please check your internet connection and try again.';
      }
      
      Alert.alert('Error', message, [{ text: 'OK' }]);
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
        <Text style={styles.title}>Forgotten Password?</Text>
        <Text style={styles.subtitle}>Please Enter Your Phone Number To Receive a 6-Digit Verification Code</Text>

        <View style={styles.inputContainer}>
          <Feather name="phone" size={20} color="#263A13" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your phone number"
            value={phone}
            onChangeText={text => { setPhone(text); setPhoneError(''); }}
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        
        {phoneError ? (
          <Text style={styles.errorText}>{phoneError}</Text>
        ) : null}

        <TouchableOpacity 
          style={[styles.sendButton, isLoading && styles.sendButtonDisabled]} 
          onPress={handleSendVerificationCode}
          disabled={isLoading}
        >
          <Text style={styles.sendButtonText}>
            {isLoading ? 'Sending...' : 'Send Code'}
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
    fontSize: 16,
    color: '#263A13',
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
    fontSize: 14,
    textAlign: 'center',
  },
  sendButton: {
    backgroundColor: '#1C3301',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#A3C47C',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 