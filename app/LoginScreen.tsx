import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const router = useRouter();

  function validateEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <Image source={require('../assets/images/logo landscape.png')} style={styles.logo} />
      </View>
      <View style={styles.formCard}>
        <Text style={styles.loginTitle}>Login</Text>
        <Text style={styles.loginSubtitle}>Sign in with your password to continue</Text>
      </View>
      <View style={styles.inputRow}>
        <Image source={require('../assets/images/email.png')} style={styles.inputIconImg} />
        <TextInput
          style={styles.input}
          placeholder="Enter your Email"
          value={email}
          onChangeText={text => { setEmail(text); setEmailError(''); }}
          placeholderTextColor="#263A13"
        />
      </View>
      {emailError ? <Text style={{ color: 'red', marginBottom: 4, alignSelf: 'flex-start', marginLeft: 32 }}>{emailError}</Text> : null}
      <View style={styles.inputRow}>
        <Image source={require('../assets/images/password.png')} style={styles.inputIconImg} />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          placeholderTextColor="#263A13"
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Feather name={showPassword ? 'eye' : 'eye-off'} size={22} color="#263A13" style={styles.eyeIcon} />
        </TouchableOpacity>
      </View>
      <View style={styles.optionsRow}>
        <TouchableOpacity style={styles.rememberMeRow} onPress={() => setRememberMe(!rememberMe)}>
          <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
            {rememberMe && <Text style={styles.checkboxTick}>✓</Text>}
          </View>
          <Text style={styles.rememberMeText}>Remember me</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.forgotText}>Forgotten password?</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.signInButton} onPress={() => {
        if (!validateEmail(email)) {
          setEmailError('Please enter a valid email address.');
          return;
        }
        router.push('/')
      }}>
        <Text style={styles.signInButtonText}>Sign in</Text>
      </TouchableOpacity>
      <Text style={styles.orText}>or continue with google</Text>
      <TouchableOpacity style={styles.socialButton}>
        <Image source={require('../assets/images/google.png')} style={styles.socialIconImg} />
        <Text style={styles.socialText}>continue with Google</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.socialButton}>
        <Image source={require('../assets/images/apple.png')} style={styles.socialIconImg} />
        <Text style={styles.socialText}>continue with Apple</Text>
      </TouchableOpacity>
      <View style={styles.bottomRow}>
        <Text style={styles.bottomText}>Don’t have an account? </Text>
        <TouchableOpacity onPress={() => router.push('/RegisterScreen')}>
          <Text style={styles.signUpText}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF6',
    paddingHorizontal: 0,
    paddingTop: 40,
  },
  logoRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    width: 200,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  formCard: {
    backgroundColor: '#D9DED8',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 0,
    marginBottom: 16,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#263A13',
    marginBottom: 2,
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#263A13',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#A3C47C',
    borderRadius: 24,
    paddingHorizontal: 12,
    marginHorizontal: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
    height: 48,
  },
  inputIconImg: {
    width: 24,
    height: 24,
    marginRight: 8,
    resizeMode: 'contain',
    color:'#fff',
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#263A13',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 8,
    marginBottom: 16,
  },
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: '#263A13',
    borderRadius: 4,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#A3C47C',
    borderColor: '#A3C47C',
  },
  checkboxTick: {
    color: '#263A13',
    fontWeight: 'bold',
    fontSize: 14,
  },
  rememberMeText: {
    marginLeft: 4,
    color: '#263A13',
  },
  forgotText: {
    color: '#263A13',
    fontSize: 14,
  },
  signInButton: {
    backgroundColor: '#223E01',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 60,
    marginBottom: 16,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  orText: {
    textAlign: 'center',
    color: '#263A13',
    marginBottom: 8,
    fontSize: 16,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#A3C47C',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  socialIconImg: {
    width: 24,
    height: 24,
    marginRight: 12,
    resizeMode: 'contain',
  },
  socialText: {
    fontSize: 16,
    color: '#263A13',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  bottomText: {
    color: '#263A13',
    fontSize: 15,
  },
  signUpText: {
    color: '#263A13',
    fontWeight: 'bold',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  eyeIcon: {
    marginLeft: 8,
  },
}); 