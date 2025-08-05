import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import apiService from '../services/apiService';

export default function ConnectionTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>('');

  const testConnection = async () => {
    try {
      setIsLoading(true);
      setStatus('Testing connection...');
      
      // Test the health endpoint using computer's IP address
      const response = await fetch('http://10.132.144.9:3000/health');
      const data = await response.json();
      
      if (response.ok) {
        setStatus('✅ Backend connected successfully!');
        Alert.alert('Success', 'Backend connection is working!');
      } else {
        setStatus('❌ Backend connection failed');
        Alert.alert('Error', 'Backend connection failed');
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setStatus('❌ Connection error');
      Alert.alert('Error', 'Failed to connect to backend. Make sure the server is running on port 3000.');
    } finally {
      setIsLoading(false);
    }
  };

  const testApiService = async () => {
    try {
      setIsLoading(true);
      setStatus('Testing API service...');
      
      // Test the API service
      const response = await apiService.request('/health');
      
      if (response.success) {
        setStatus('✅ API service working!');
        Alert.alert('Success', 'API service is working correctly!');
      } else {
        setStatus('❌ API service failed');
        Alert.alert('Error', 'API service test failed');
      }
    } catch (error) {
      console.error('API service test error:', error);
      setStatus('❌ API service error');
      Alert.alert('Error', 'API service test failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Backend Connection Test</Text>
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={testConnection}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test Backend Connection'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={testApiService}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test API Service'}
        </Text>
      </TouchableOpacity>

      {status ? (
        <Text style={styles.status}>{status}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1C3301',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  status: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 