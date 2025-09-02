import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// ===== MOCK DATA FOR CONNECTION TEST =====
// This replaces all backend API calls with local mock data
// In a real app, this would test actual backend connections

export default function ConnectionTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [connectionDetails, setConnectionDetails] = useState<string>('');

  const testConnection = async () => {
    try {
      setIsLoading(true);
      setStatus('Testing connection...');
      setConnectionDetails('');
      
      // ===== MOCK CONNECTION TEST =====
      // This replaces the actual backend connection test with mock data
      // In a real app, this would test actual network connectivity
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock successful connection
      setStatus('✅ Mock backend connected successfully!');
      setConnectionDetails(`Response: {"status": "ok", "message": "Mock backend is running", "timestamp": "${new Date().toISOString()}"}`);
      Alert.alert('Success', 'Mock backend connection is working! (Frontend Only)');
    } catch (error) {
      console.error('Connection test error:', error);
      setStatus('❌ Connection error');
      setConnectionDetails(`Error: ${error instanceof Error ? error.message : String(error)}`);
      Alert.alert('Error', 'Failed to connect to mock backend.');
    } finally {
      setIsLoading(false);
    }
  };

  const testApiService = async () => {
    try {
      setIsLoading(true);
      setStatus('Testing API service...');
      setConnectionDetails('');
      
      // ===== MOCK API SERVICE TEST =====
      // This replaces the actual API service test with mock data
      // In a real app, this would test actual API functionality
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful API service test
      setStatus('✅ Mock API service working!');
      setConnectionDetails(`Authentication status: false (Frontend Only)\nAPI Service: Mock Implementation\nBackend: Not Available`);
      Alert.alert('Success', 'Mock API service is working correctly! (Frontend Only)');
    } catch (error) {
      console.error('API service test error:', error);
      setStatus('❌ API service error');
      setConnectionDetails(`Error: ${error instanceof Error ? error.message : String(error)}`);
      Alert.alert('Error', 'Mock API service test failed');
    } finally {
      setIsLoading(false);
    }
  };

  const testDetailedConnection = async () => {
    try {
      setIsLoading(true);
      setStatus('Testing detailed connection...');
      setConnectionDetails('');
      
      // ===== MOCK DETAILED CONNECTION TEST =====
      // This replaces the actual detailed connection test with mock data
      // In a real app, this would test actual network connectivity and endpoints
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock connection status
      const mockConnectionStatus = {
        isConnected: true,
        currentIP: '192.168.1.100',
        workingIPs: ['192.168.1.100', '10.0.0.1'],
        failedIPs: ['192.168.1.200'],
        error: null
      };
      
      if (mockConnectionStatus.isConnected) {
        setStatus('✅ Mock connection test successful!');
        setConnectionDetails(
          `Current IP: ${mockConnectionStatus.currentIP}\n` +
          `Working IPs: ${mockConnectionStatus.workingIPs.join(', ')}\n` +
          `Failed IPs: ${mockConnectionStatus.failedIPs.join(', ')}\n` +
          `Note: This is mock data (Frontend Only)`
        );
        Alert.alert('Success', 'Mock connection test completed successfully! (Frontend Only)');
      } else {
        setStatus('❌ Mock connection test failed');
        setConnectionDetails(
          `Current IP: ${mockConnectionStatus.currentIP}\n` +
          `Working IPs: ${mockConnectionStatus.workingIPs.join(', ')}\n` +
          `Failed IPs: ${mockConnectionStatus.failedIPs.join(', ')}\n` +
          `Error: ${mockConnectionStatus.error || 'Unknown error'}\n` +
          `Note: This is mock data (Frontend Only)`
        );
        Alert.alert('Error', 'Mock connection test failed. Check the details below.');
      }
    } catch (error) {
      console.error('Detailed connection test error:', error);
      setStatus('❌ Detailed connection test error');
      setConnectionDetails(`Error: ${error instanceof Error ? error.message : String(error)}`);
      Alert.alert('Error', 'Mock detailed connection test failed');
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