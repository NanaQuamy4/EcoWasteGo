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
import { COLORS } from '../constants';
import { isAdminUser } from '../lib/adminConfig';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const { selectedRole } = useLocalSearchParams<{ selectedRole?: string }>();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Debug: Log user state changes
  useEffect(() => {
    console.log('LoginScreen: Current user state:', user);
    if (user) {
      console.log('LoginScreen: User is logged in, role:', user.role);
    } else {
      console.log('LoginScreen: No user logged in');
    }
  }, [user]);
  
  // ===== LOCAL STATE MANAGEMENT =====
  // These state variables manage the form inputs and UI state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);

  // ===== NAVIGATION EFFECT =====
  // This effect automatically navigates users to the correct screen after login
  // It watches for changes in the user state and routes accordingly
  useEffect(() => {
    if (user) {
      const userRole = user.role || 'customer';
      console.log('LoginScreen: User logged in with role:', userRole);
      console.log('LoginScreen: Full user object:', user);
      
      // Check if user is admin first (this should override everything else)
      if (isAdminUser(user.email)) {
        console.log('LoginScreen: ADMIN USER DETECTED - Navigating to admin portal');
        router.replace('/admin-screens/AdminPortal');
        return;
      }
      
      // Navigate based on user role (only for non-admin users)
      if (userRole === 'recycler') {
        console.log('LoginScreen: Navigating to recycler screens');
        router.replace('/(recycler-tabs)');
      } else {
        console.log('LoginScreen: Navigating to customer screens');
        router.replace('/(tabs)');
      }
    }
  }, [user, router]);

  // ===== EMAIL VALIDATION =====
  // Basic email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (emailText: string) => {
    setEmail(emailText);
    const isValid = validateEmail(emailText);
    setIsEmailValid(isValid);
    setEmailError(isValid ? '' : 'Please enter a valid email address');
  };

  // ===== USER ROLE DETECTION =====
  // This function gets the user's role from Supabase user metadata (no database query needed!)
  const getUserRoleFromMetadata = (user: any) => {
    return user?.user_metadata?.role || 'customer';
  };

  // ===== MAIN LOGIN HANDLER =====
  // This is the main function that handles the login process
  // It validates inputs, calls Supabase login, and handles errors
  const handleLogin = async () => {
    // Basic validation - check if fields are not empty and email is valid
    if (!email.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Please fill in both email and password');
      return;
    }

    if (!isEmailValid) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      console.log('LoginScreen: Attempting login with email:', email);
      
      const result = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });
      
      if (result.error) {
        console.error('LoginScreen: Login failed:', result.error);
        
        // Handle specific error cases
        let errorMessage = 'An unexpected error occurred';
        if (result.error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else if (result.error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and confirm your account before signing in.';
        } else if (result.error.message.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please wait a moment and try again.';
        } else {
          errorMessage = result.error.message;
        }
        
        Alert.alert('Login Failed', errorMessage);
      } else if (result.data.user) {
        console.log('LoginScreen: Login successful');
        
        // Get user role from metadata (no database query needed!)
        const userRole = result.data.user.user_metadata?.role || 'customer';
        const userProfile = {
          id: result.data.user.id,
          email: result.data.user.email,
          full_name: result.data.user.user_metadata?.full_name || '',
          phone: result.data.user.user_metadata?.phone || '',
          company_name: result.data.user.user_metadata?.company_name || '',
          email_verified: result.data.user.email_confirmed_at ? true : false,
          profile_completed: true, // Assume completed since they registered
        };
        
        console.log('LoginScreen: User role from metadata:', userRole);
        console.log('LoginScreen: User profile from metadata:', userProfile);
        
        // Create enhanced user object
        const enhancedUser = {
          ...result.data.user,
          role: userRole,
          profile: userProfile
        };
        
        setUser(enhancedUser);
        
        // Show success message
        Alert.alert('Success', `Login successful! Welcome back, ${userProfile.full_name || 'User'}!`);
        setIsLoading(false);
        
        return;
      }
    } catch (error: any) {
      console.error('LoginScreen: Login error:', error);
      Alert.alert('Login Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ===== NAVIGATION HANDLERS =====
  const handleBackToRoleSelection = () => {

    
    router.push('/RoleSelectionScreen');
  };

  const handleForgotPassword = () => {
    router.push('/ForgotPasswordScreen');
  };

  const handleRegister = () => {
    router.push({
      pathname: '/RegisterScreen',
      params: { selectedRole: selectedRole || 'customer' }
    });
  };

  // Check if user can login (all validations must pass)
  const canLogin = 
    email.trim() !== '' &&
    password.trim() !== '' &&
    isEmailValid &&
    !isLoading;

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
            
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to your account to continue
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputWrapper, emailError ? styles.inputError : isEmailValid ? styles.inputSuccess : null]}>
                                 <MaterialIcons 
                   name="email" 
                   size={20} 
                   color={emailError ? COLORS.red : isEmailValid ? COLORS.green : COLORS.gray} 
                 />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email (e.g., john.doe@example.com)"
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons 
                  name="lock" 
                  size={20} 
                  color={COLORS.gray} 
                />
                <TextInput
                  style={[styles.input, { color: COLORS.darkGreen }]}
                  placeholder="Enter your password (min. 8 characters)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
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

            {/* Forgot Password Link */}
            <TouchableOpacity 
              style={styles.forgotPasswordContainer}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, !canLogin && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={!canLogin || isLoading}
            >
              {isLoading ? (
                <Text style={styles.loginButtonText}>Signing In...</Text>
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleRegister}>
                <Text style={styles.registerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
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
  inputError: {
    borderColor: COLORS.red,
  },
  inputSuccess: {
    borderColor: COLORS.green,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: COLORS.darkGreen,
  },
  eyeIcon: {
    padding: 12,
  },
  errorText: {
    color: COLORS.red,
    fontSize: 12,
    marginTop: 4,
  },
  forgotPasswordContainer: {
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.lightGray,
  },
  dividerText: {
    marginHorizontal: 10,
    color: COLORS.gray,
    fontSize: 16,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registerText: {
    color: COLORS.gray,
    fontSize: 16,
  },
  registerLink: {
    color: COLORS.orange,
    fontSize: 16,
    fontWeight: '600',
  },
}); 