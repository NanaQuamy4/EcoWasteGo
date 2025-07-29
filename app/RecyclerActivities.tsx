import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppHeader from '../components/AppHeader';
import { COLORS } from '../constants';

export default function RecyclerActivities() {
  return (
    <View style={styles.container}>
      <AppHeader onMenuPress={() => router.back()} />
      
      <View style={styles.content}>
        <Text style={styles.title}>Activities</Text>
        <Text style={styles.subtitle}>View your recent activities and notifications</Text>
        
        <View style={styles.placeholder}>
          <MaterialIcons name="notifications-active" size={64} color={COLORS.gray} />
          <Text style={styles.placeholderText}>Activities Screen</Text>
          <Text style={styles.placeholderSubtext}>Coming soon...</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 32,
  },
  placeholder: {
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginTop: 16,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 8,
  },
});