import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../constants';

// ===== MOCK DATA FOR CONNECTION DIAGNOSTIC SCREEN =====
// This replaces the backend API calls with local mock data
// In a real app, this would come from actual network diagnostics

// Mock connection status data
const mockConnectionStatus = {
  isConnected: true,
  connectionType: "WiFi",
  signalStrength: "Strong",
  ipAddress: "192.168.1.100",
  gateway: "192.168.1.1",
  dns: "8.8.8.8",
  latency: 15,
  downloadSpeed: "25 Mbps",
  uploadSpeed: "10 Mbps"
};

// Mock API endpoints for testing
const mockApiEndpoints = [
  {
    name: "Authentication Service",
    url: "https://api.ecowastego.com/auth",
    status: "healthy",
    responseTime: 120,
    lastChecked: new Date().toISOString()
  },
  {
    name: "Waste Collection Service",
    url: "https://api.ecowastego.com/collections",
    status: "healthy",
    responseTime: 85,
    lastChecked: new Date().toISOString()
  },
  {
    name: "User Management Service",
    url: "https://api.ecowastego.com/users",
    status: "healthy",
    responseTime: 95,
    lastChecked: new Date().toISOString()
  },
  {
    name: "Payment Service",
    url: "https://api.ecowastego.com/payments",
    status: "healthy",
    responseTime: 150,
    lastChecked: new Date().toISOString()
  }
];

// Mock diagnostic results
const mockDiagnosticResults = {
  networkConnectivity: "✅ Connected",
  internetAccess: "✅ Available",
  apiConnectivity: "✅ All services responding",
  databaseConnection: "✅ Connected",
  overallHealth: "✅ Excellent"
};

export default function ConnectionDiagnostic() {
  const router = useRouter();

  // ===== LOCAL STATE MANAGEMENT =====
  // These state variables manage the UI state and diagnostic data
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [apiEndpoints, setApiEndpoints] = useState<any[]>([]);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [lastDiagnosticTime, setLastDiagnosticTime] = useState<string>('');

  // ===== INITIALIZATION EFFECT =====
  // This effect runs when the component first loads
  useEffect(() => {
    loadMockData();
  }, []);

  // ===== MOCK DATA LOADING FUNCTION =====
  // This replaces the backend API call to fetch connection status
  // It loads data from our mock data arrays
  const loadMockData = async () => {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Load mock connection status
      setConnectionStatus(mockConnectionStatus);
      
      // Load mock API endpoints
      setApiEndpoints([...mockApiEndpoints]);
      
      // Load mock diagnostic results
      setDiagnosticResults(mockDiagnosticResults);
      
      console.log('ConnectionDiagnostic: Mock data loaded successfully');
    } catch (error) {
      console.error('ConnectionDiagnostic: Error loading mock data:', error);
      // Fallback to default mock data
      setConnectionStatus(mockConnectionStatus);
      setApiEndpoints(mockApiEndpoints);
      setDiagnosticResults(mockDiagnosticResults);
    }
  };

  // ===== MOCK ACTION HANDLERS =====
  // These functions handle user actions
  
  // Run connection diagnostics
  const runDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    
    try {
      // Simulate diagnostic process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Update diagnostic results with simulated variations
      const updatedResults = {
        ...mockDiagnosticResults,
        networkConnectivity: Math.random() > 0.1 ? "✅ Connected" : "❌ Disconnected",
        internetAccess: Math.random() > 0.1 ? "✅ Available" : "❌ Unavailable",
        apiConnectivity: Math.random() > 0.1 ? "✅ All services responding" : "⚠️ Some services slow",
        databaseConnection: Math.random() > 0.1 ? "✅ Connected" : "❌ Connection failed",
        overallHealth: Math.random() > 0.1 ? "✅ Excellent" : "⚠️ Needs attention"
      };
      
      setDiagnosticResults(updatedResults);
      setLastDiagnosticTime(new Date().toLocaleString());
      
      // Update API endpoint response times
      const updatedEndpoints = apiEndpoints.map(endpoint => ({
        ...endpoint,
        responseTime: Math.floor(Math.random() * 200) + 50,
        lastChecked: new Date().toISOString()
      }));
      
      setApiEndpoints(updatedEndpoints);
      
      console.log('ConnectionDiagnostic: Diagnostics completed successfully');
      
      Alert.alert(
        'Diagnostics Complete',
        'Connection diagnostics have been completed. Check the results below.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error running diagnostics:', error);
      Alert.alert('Error', 'Failed to run diagnostics. Please try again.');
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  // Test specific API endpoint
  const testEndpoint = async (endpoint: any) => {
    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update endpoint status
      const updatedEndpoints = apiEndpoints.map(ep => 
        ep.name === endpoint.name 
          ? { ...ep, status: 'testing', responseTime: Math.floor(Math.random() * 200) + 50 }
          : ep
      );
      
      setApiEndpoints(updatedEndpoints);
      
      // Simulate test completion
      setTimeout(() => {
        const finalEndpoints = apiEndpoints.map(ep => 
          ep.name === endpoint.name 
            ? { ...ep, status: 'healthy', lastChecked: new Date().toISOString() }
            : ep
        );
        setApiEndpoints(finalEndpoints);
      }, 1000);
      
      Alert.alert(
        'Endpoint Test',
        `Testing ${endpoint.name}...`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error testing endpoint:', error);
      Alert.alert('Error', 'Failed to test endpoint. Please try again.');
    }
  };

  // Reset diagnostics
  const resetDiagnostics = () => {
    setDiagnosticResults(mockDiagnosticResults);
    setApiEndpoints(mockApiEndpoints);
    setLastDiagnosticTime('');
    
    Alert.alert(
      'Reset Complete',
      'Diagnostic results have been reset to default values.',
      [{ text: 'OK' }]
    );
  };

  // ===== UTILITY FUNCTIONS =====
  // Get status color for display
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return COLORS.green;
      case 'warning':
        return '#FFD700';
      case 'error':
        return COLORS.red;
      case 'testing':
        return COLORS.blue;
      default:
        return COLORS.gray;
    }
  };

  // Get status icon for display
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'check-circle';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      case 'testing':
        return 'hourglass-empty';
      default:
        return 'help';
    }
  };

  if (!connectionStatus || !apiEndpoints || !diagnosticResults) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading diagnostic information...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Connection Diagnostic</Text>
        <Text style={styles.subtitle}>Debug API connection issues</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={runDiagnostics}
          disabled={isRunningDiagnostics}
        >
          {isRunningDiagnostics ? (
            <Text style={styles.buttonText}>Running Diagnostics...</Text>
          ) : (
            <Text style={styles.buttonText}>Run Connection Diagnostic</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={resetDiagnostics}
          disabled={isRunningDiagnostics}
        >
          <Text style={styles.buttonText}>Reset Diagnostics</Text>
        </TouchableOpacity>
      </View>

      {/* Connection Status Section */}
      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>Connection Status</Text>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Is Connected:</Text>
          <Text style={[styles.resultValue, { color: connectionStatus.isConnected ? COLORS.darkGreen : COLORS.red }]}>
            {connectionStatus.isConnected ? 'Yes' : 'No'}
          </Text>
        </View>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>IP Address:</Text>
          <Text style={styles.resultValue}>{connectionStatus.ipAddress}</Text>
        </View>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Connection Type:</Text>
          <Text style={styles.resultValue}>{connectionStatus.connectionType}</Text>
        </View>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Signal Strength:</Text>
          <Text style={styles.resultValue}>{connectionStatus.signalStrength}</Text>
        </View>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Latency:</Text>
          <Text style={styles.resultValue}>{connectionStatus.latency} ms</Text>
        </View>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Download Speed:</Text>
          <Text style={styles.resultValue}>{connectionStatus.downloadSpeed}</Text>
        </View>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Upload Speed:</Text>
          <Text style={styles.resultValue}>{connectionStatus.uploadSpeed}</Text>
        </View>
      </View>

      {/* API Endpoints Section */}
      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>API Endpoints</Text>
        {apiEndpoints.map((endpoint, index) => (
          <View key={index} style={styles.resultRow}>
            <Text style={styles.resultLabel}>{endpoint.name}:</Text>
            <View style={styles.endpointStatus}>
              <MaterialIcons
                name={getStatusIcon(endpoint.status)}
                size={20}
                color={getStatusColor(endpoint.status)}
              />
              <Text style={[styles.resultValue, { marginLeft: 8 }]}>{endpoint.status}</Text>
              <Text style={styles.resultValue}>({endpoint.responseTime}ms)</Text>
            </View>
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => testEndpoint(endpoint)}
              disabled={endpoint.status === 'testing'}
            >
              <MaterialIcons
                name="refresh"
                size={20}
                color={COLORS.white}
              />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Diagnostic Results Section */}
      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>Diagnostic Results</Text>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Network Connectivity:</Text>
          <Text style={styles.resultValue}>{diagnosticResults.networkConnectivity}</Text>
        </View>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Internet Access:</Text>
          <Text style={styles.resultValue}>{diagnosticResults.internetAccess}</Text>
        </View>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>API Connectivity:</Text>
          <Text style={styles.resultValue}>{diagnosticResults.apiConnectivity}</Text>
        </View>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Database Connection:</Text>
          <Text style={styles.resultValue}>{diagnosticResults.databaseConnection}</Text>
        </View>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Overall Health:</Text>
          <Text style={styles.resultValue}>{diagnosticResults.overallHealth}</Text>
        </View>
        {lastDiagnosticTime && (
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Last Run:</Text>
            <Text style={styles.resultValue}>{lastDiagnosticTime}</Text>
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>What This Does:</Text>
        <Text style={styles.infoText}>
          • Connection Status: Displays your current network connection details.
        </Text>
        <Text style={styles.infoText}>
          • API Endpoints: Tests the availability and response time of key backend services.
        </Text>
        <Text style={styles.infoText}>
          • Diagnostic Results: Runs a comprehensive check of your API infrastructure.
        </Text>
      </View>

      <View style={styles.troubleshootingContainer}>
        <Text style={styles.troubleshootingTitle}>Common Issues:</Text>
        <Text style={styles.troubleshootingText}>
          • Network connectivity issues (e.g., WiFi not connected, signal weak)
        </Text>
        <Text style={styles.troubleshootingText}>
          • Backend server not running or unreachable
        </Text>
        <Text style={styles.troubleshootingText}>
          • API configuration errors (wrong port, IP)
        </Text>
        <Text style={styles.troubleshootingText}>
          • DNS resolution problems
        </Text>
        <Text style={styles.troubleshootingText}>
          • Firewall blocking connections
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 24,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8, // Changed from DIMENSIONS.borderRadius
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 8, // Changed from DIMENSIONS.borderRadius
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 16,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    width: 150, // Adjusted width for better alignment
  },
  resultValue: {
    fontSize: 14,
    color: COLORS.primary,
    flex: 1,
  },
  endpointStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  testButton: {
    padding: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 5,
    marginLeft: 10,
  },
  infoContainer: {
    backgroundColor: COLORS.lightGreen,
    padding: 16,
    borderRadius: 8, // Changed from DIMENSIONS.borderRadius
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.darkGreen,
    marginBottom: 6,
    lineHeight: 20,
  },
  troubleshootingContainer: {
    backgroundColor: COLORS.lightGray,
    padding: 16,
    borderRadius: 8, // Changed from DIMENSIONS.borderRadius
    marginBottom: 24,
  },
  troubleshootingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gray,
    marginBottom: 12,
  },
  troubleshootingText: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 6,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.gray,
  },
});


