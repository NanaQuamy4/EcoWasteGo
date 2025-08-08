import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapComponent from '../components/MapComponent';
import { COLORS } from '../constants';

export default function MapTestScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Map Test Screen</Text>
      <Text style={styles.subtitle}>Testing Google Maps Integration</Text>
      
      <View style={styles.mapContainer}>
        <MapComponent
          markers={[
            {
              id: 'test1',
              coordinate: { latitude: 6.6734, longitude: -1.5714 },
              title: 'Test Location 1',
              description: 'Test marker 1',
              type: 'recycler',
            },
            {
              id: 'test2',
              coordinate: { latitude: 6.6834, longitude: -1.5814 },
              title: 'Test Location 2',
              description: 'Test marker 2',
              type: 'destination',
            },
          ]}
          style={styles.map}
        />
      </View>
      
      <Text style={styles.info}>
        If you can see a map above, Google Maps is working correctly.
        If you see an error message, there might be an issue with the API key or network connection.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  mapContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.darkGreen,
  },
  map: {
    flex: 1,
  },
  info: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
}); 