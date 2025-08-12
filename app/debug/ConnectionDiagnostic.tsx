import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS, DIMENSIONS } from '../../constants';
import { apiService } from '../../services/apiService';

export default function ConnectionDiagnosticScreen() {
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDiagnostic = async () => {
    setIsLoading(true);
    try {
      const result = await apiService.diagnoseConnection();
      setDiagnosticResult(result);
      console.log('Diagnostic result:', result);
    } catch (error) {
      console.error('Diagnostic failed:', error);
      Alert.alert('Diagnostic Failed', 'Failed to run connection diagnostic');
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    setIsLoading(true);
    try {
      const result = await apiService.getConnectionStatus();
      setDiagnosticResult(result);
      console.log('Connection status:', result);
    } catch (error) {
      console.error('Connection test failed:', error);
      Alert.alert('Connection Test Failed', 'Failed to test connection');
    } finally {
      setIsLoading(false);
    }
  };

  const renderDiagnosticResult = () => {
    if (!diagnosticResult) return null;

    if ('responseType' in diagnosticResult) {
      // diagnoseConnection result
      return (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Connection Diagnostic Result</Text>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Base URL:</Text>
            <Text style={styles.resultValue}>{diagnosticResult.baseURL}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Can Reach Server:</Text>
            <Text style={[styles.resultValue, { color: diagnosticResult.canReachServer ? COLORS.darkGreen : COLORS.red }]}>
              {diagnosticResult.canReachServer ? 'Yes' : 'No'}
            </Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Response Type:</Text>
            <Text style={styles.resultValue}>{diagnosticResult.responseType}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Status Code:</Text>
            <Text style={styles.resultValue}>{diagnosticResult.statusCode || 'N/A'}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Response Preview:</Text>
            <Text style={styles.resultValue}>{diagnosticResult.responsePreview}</Text>
          </View>
          {diagnosticResult.error && (
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Error:</Text>
              <Text style={[styles.resultValue, { color: COLORS.red }]}>{diagnosticResult.error}</Text>
            </View>
          )}
        </View>
      );
    } else {
      // getConnectionStatus result
      return (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Connection Status Result</Text>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Current IP:</Text>
            <Text style={styles.resultValue}>{diagnosticResult.currentIP}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Is Connected:</Text>
            <Text style={[styles.resultValue, { color: diagnosticResult.isConnected ? COLORS.darkGreen : COLORS.red }]}>
              {diagnosticResult.isConnected ? 'Yes' : 'No'}
            </Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Working IPs:</Text>
            <Text style={styles.resultValue}>
              {diagnosticResult.workingIPs.length > 0 ? diagnosticResult.workingIPs.join(', ') : 'None'}
            </Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Failed IPs:</Text>
            <Text style={styles.resultValue}>
              {diagnosticResult.failedIPs.length > 0 ? diagnosticResult.failedIPs.join(', ') : 'None'}
            </Text>
          </View>
          {diagnosticResult.error && (
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Error:</Text>
              <Text style={[styles.resultValue, { color: COLORS.red }]}>{diagnosticResult.error}</Text>
            </View>
          )}
        </View>
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Connection Diagnostic</Text>
        <Text style={styles.subtitle}>Debug API connection issues</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={runDiagnostic}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.buttonText}>Run Connection Diagnostic</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={testConnection}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Connection Status</Text>
        </TouchableOpacity>
      </View>

      {renderDiagnosticResult()}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>What This Does:</Text>
        <Text style={styles.infoText}>
          • Connection Diagnostic: Tests the specific endpoint and shows what type of response you're getting
        </Text>
        <Text style={styles.infoText}>
          • Connection Status: Tests multiple IP addresses to find working connections
        </Text>
        <Text style={styles.infoText}>
          • Use this to debug why you're getting "JSON Parse error: Unexpected character: T"
        </Text>
      </View>

      <View style={styles.troubleshootingContainer}>
        <Text style={styles.troubleshootingTitle}>Common Issues:</Text>
        <Text style={styles.troubleshootingText}>
          • Backend server not running on port 3000
        </Text>
        <Text style={styles.troubleshootingText}>
          • Wrong IP address in API configuration
        </Text>
        <Text style={styles.troubleshootingText}>
          • Network firewall blocking the connection
        </Text>
        <Text style={styles.troubleshootingText}>
          • Server returning HTML error page instead of JSON
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
    borderRadius: DIMENSIONS.borderRadius,
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
    borderRadius: DIMENSIONS.borderRadius,
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
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    width: 120,
  },
  resultValue: {
    fontSize: 14,
    color: COLORS.primary,
    flex: 1,
  },
  infoContainer: {
    backgroundColor: COLORS.lightGreen,
    padding: 16,
    borderRadius: DIMENSIONS.borderRadius,
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
    borderRadius: DIMENSIONS.borderRadius,
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
});


