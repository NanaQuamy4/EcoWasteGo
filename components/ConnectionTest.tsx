import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import apiService from '../services/apiService';

export default function ConnectionTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [connectionDetails, setConnectionDetails] = useState<string>('');

  const testConnection = async () => {
    try {
      setIsLoading(true);
      setStatus('Testing connection...');
      setConnectionDetails('');
      
      // Test the health endpoint using computer's IP address
      const response = await fetch('http://10.132.144.9:3000/health');
      const data = await response.json();
      
      if (response.ok) {
        setStatus('✅ Backend connected successfully!');
        setConnectionDetails(`Response: ${JSON.stringify(data, null, 2)}`);
        Alert.alert('Success', 'Backend connection is working!');
      } else {
        setStatus('❌ Backend connection failed');
        setConnectionDetails(`Status: ${response.status}, Response: ${JSON.stringify(data, null, 2)}`);
        Alert.alert('Error', 'Backend connection failed');
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setStatus('❌ Connection error');
      setConnectionDetails(`Error: ${error instanceof Error ? error.message : String(error)}`);
      Alert.alert('Error', 'Failed to connect to backend. Make sure the server is running on port 3000.');
    } finally {
      setIsLoading(false);
    }
  };

  const testApiService = async () => {
    try {
      setIsLoading(true);
      setStatus('Testing API service...');
      setConnectionDetails('');
      
      // Test the API service by calling a public method
      const isAuthenticated = apiService.isAuthenticated();
      
      if (typeof isAuthenticated === 'boolean') {
        setStatus('✅ API service working!');
        setConnectionDetails(`Authentication status: ${isAuthenticated}`);
        Alert.alert('Success', 'API service is working correctly!');
      } else {
        setStatus('❌ API service failed');
        setConnectionDetails('Authentication check returned invalid type');
        Alert.alert('Error', 'API service test failed');
      }
    } catch (error) {
      console.error('API service test error:', error);
      setStatus('❌ API service error');
      setConnectionDetails(`Error: ${error instanceof Error ? error.message : String(error)}`);
      Alert.alert('Error', 'API service test failed');
    } finally {
      setIsLoading(false);
    }
  };

  const testDetailedConnection = async () => {
    try {
      setIsLoading(true);
      setStatus('Testing detailed connection...');
      setConnectionDetails('');
      
      const connectionStatus = await apiService.getConnectionStatus();
      
      if (connectionStatus.isConnected) {
        setStatus('✅ Connection test successful!');
        setConnectionDetails(
          `Current IP: ${connectionStatus.currentIP}\n` +
          `Working IPs: ${connectionStatus.workingIPs.join(', ')}\n` +
          `Failed IPs: ${connectionStatus.failedIPs.join(', ')}`
        );
        Alert.alert('Success', 'Connection test completed successfully!');
      } else {
        setStatus('❌ Connection test failed');
        setConnectionDetails(
          `Current IP: ${connectionStatus.currentIP}\n` +
          `Working IPs: ${connectionStatus.workingIPs.join(', ')}\n` +
          `Failed IPs: ${connectionStatus.failedIPs.join(', ')}\n` +
          `Error: ${connectionStatus.error || 'Unknown error'}`
        );
        Alert.alert('Error', 'Connection test failed. Check the details below.');
      }
    } catch (error) {
      console.error('Detailed connection test error:', error);
      setStatus('❌ Detailed connection test error');
      setConnectionDetails(`Error: ${error instanceof Error ? error.message : String(error)}`);
      Alert.alert('Error', 'Detailed connection test failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connection Test</Text>
      
      <TouchableOpacity style={styles.button} onPress={testConnection} disabled={isLoading}>
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test Basic Connection'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={testApiService} disabled={isLoading}>
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test API Service'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={testDetailedConnection} disabled={isLoading}>
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test Detailed Connection'}
        </Text>
      </TouchableOpacity>

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{status}</Text>
        {connectionDetails ? (
          <Text style={styles.detailsText}>{connectionDetails}</Text>
        ) : null}
      </View>
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
  statusContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  detailsText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'left',
  },
}); 