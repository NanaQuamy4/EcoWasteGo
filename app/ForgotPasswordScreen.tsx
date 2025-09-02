import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants';
import { supabase } from '../lib/supabase';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);

  // Real Supabase forgot password function
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!isEmailValid) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('ForgotPasswordScreen: Sending password reset email to:', email);
      
      // Send password reset email using Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'ecowastego://reset-password', // Deep link for password reset
      });

      if (error) {
        console.error('ForgotPasswordScreen: Password reset error:', error);
        Alert.alert('Error', error.message || 'Failed to send reset email. Please try again.');
        return;
      }

      console.log('ForgotPasswordScreen: Password reset email sent successfully');
      
      Alert.alert(
        'Email Sent',
        'If an account exists with this email, you will receive password reset instructions. Please check your email and follow the link to reset your password.',
        [
          {
            text: 'OK',
            onPress: () => router.push('/LoginScreen')
          }
        ]
      );
    } catch (error) {
      console.error('ForgotPasswordScreen: Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  function validateEmail(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

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
              onPress={() => router.back()}
            >
              <MaterialIcons name="arrow-back" size={24} color={COLORS.darkGreen} />
            </TouchableOpacity>
            
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>
              Enter your email address to reset your password
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons 
                  name="email" 
                  size={20} 
                  color={COLORS.gray} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email address"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setEmailError('');
                    setIsEmailValid(validateEmail(text));
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, (!email.trim() || !isEmailValid || isLoading) && styles.submitButtonDisabled]}
              onPress={handleForgotPassword}
              disabled={!email.trim() || !isEmailValid || isLoading}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? 'Sending...' : 'Send Reset Email'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.backToLogin}
              onPress={() => router.push('/LoginScreen')}
            >
              <Text style={styles.backToLoginText}>Back to Login</Text>
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
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGreen,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  errorText: {
    color: COLORS.red,
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: COLORS.darkGreen,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  backToLogin: {
    alignItems: 'center',
    marginTop: 20,
  },
  backToLoginText: {
    color: COLORS.orange,
    fontSize: 16,
    fontWeight: '600',
  },
}); 