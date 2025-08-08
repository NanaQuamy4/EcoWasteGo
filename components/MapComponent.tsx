import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { COLORS } from '../constants';

interface MapComponentProps {
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  markers?: Array<{
    id: string;
    coordinate: {
      latitude: number;
      longitude: number;
    };
    title?: string;
    description?: string;
    type?: 'pickup' | 'recycler' | 'destination';
  }>;
  route?: {
    coordinates: Array<{ latitude: number; longitude: number }>;
    color?: string;
  };
  showUserLocation?: boolean;
  onMarkerPress?: (markerId: string) => void;
  onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;
  style?: any;
  height?: number;
}

const { width, height } = Dimensions.get('window');

export default function MapComponent({
  initialRegion,
  markers = [],
  route,
  showUserLocation = true,
  onMarkerPress,
  onMapPress,
  style,
  height: customHeight,
}: MapComponentProps) {
  console.log('MapComponent: Received markers:', markers);
  console.log('MapComponent: Markers count:', markers.length);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const mapRef = useRef<MapView>(null);

  // Default region (will be updated to user location)
  const defaultRegion = {
    latitude: 6.6734, // Ghana coordinates as fallback
    longitude: -1.5714,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const mapRegion = initialRegion || defaultRegion;

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setHasLocationPermission(true);
        getCurrentLocation();
      } else {
        Alert.alert(
          'Location Permission',
          'Please enable location services to use the map features.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setUserLocation(location);
      console.log('Current location:', location.coords);
      
      // Always animate to user location for better UX
      if (mapRef.current) {
        const newRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        console.log('Animating to region:', newRegion);
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  const getMarkerIcon = (type?: string) => {
    switch (type) {
      case 'pickup':
        return 'location-on';
      case 'recycler':
        return 'local-shipping';
      case 'destination':
        return 'flag';
      default:
        return 'location-on';
    }
  };

  const getMarkerColor = (type?: string) => {
    switch (type) {
      case 'pickup':
        return COLORS.darkGreen;
      case 'recycler':
        return COLORS.orange;
      case 'destination':
        return COLORS.red;
      default:
        return COLORS.darkGreen;
    }
  };

  const handleMapPress = (event: any) => {
    if (onMapPress) {
      onMapPress(event.nativeEvent.coordinate);
    }
  };

  return (
    <View style={[styles.container, style, { height: customHeight || height * 0.6 }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={mapRegion}
        showsUserLocation={showUserLocation && hasLocationPermission}
        showsMyLocationButton={showUserLocation && hasLocationPermission}
        showsCompass={true}
        showsScale={true}
        onPress={handleMapPress}
        mapType="standard"
        loadingEnabled={true}
        loadingIndicatorColor={COLORS.darkGreen}
        loadingBackgroundColor={COLORS.white}
        toolbarEnabled={false}
        zoomEnabled={true}
        rotateEnabled={true}
        scrollEnabled={true}
        pitchEnabled={true}



      >
        {/* User Location Marker */}
        {userLocation && showUserLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.coords.latitude,
              longitude: userLocation.coords.longitude,
            }}
            title="Your Location"
            description="You are here"
          >
            <View style={styles.userLocationMarker}>
              <MaterialIcons name="my-location" size={20} color={COLORS.blue} />
            </View>
          </Marker>
        )}

        {/* Custom Markers */}
        {markers.map((marker) => {
          console.log('Rendering marker:', marker.id, marker.coordinate);
          return (
            <Marker
              key={marker.id}
              coordinate={marker.coordinate}
              title={marker.title}
              description={marker.description}
              onPress={() => onMarkerPress?.(marker.id)}
            >
              <View style={[styles.marker, { backgroundColor: getMarkerColor(marker.type) }]}>
                               <MaterialIcons 
                 name={getMarkerIcon(marker.type) as any} 
                 size={20} 
                 color={COLORS.white} 
               />
              </View>
            </Marker>
          );
        })}

        {/* Route Polyline */}
        {route && route.coordinates.length > 1 && (
          <Polyline
            coordinates={route.coordinates}
            strokeColor={route.color || COLORS.darkGreen}
            strokeWidth={4}
            lineDashPattern={[10, 5]}
          />
        )}
      </MapView>

      {/* Location Permission Button */}
      {!hasLocationPermission && (
        <TouchableOpacity
          style={styles.locationButton}
          onPress={requestLocationPermission}
        >
          <MaterialIcons name="my-location" size={24} color={COLORS.white} />
        </TouchableOpacity>
      )}

      {/* Map Controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={getCurrentLocation}
        >
          <MaterialIcons name="my-location" size={20} color={COLORS.darkGreen} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  userLocationMarker: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: COLORS.blue,
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  locationButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: COLORS.darkGreen,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mapControls: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  controlButton: {
    backgroundColor: COLORS.white,
    borderRadius: 25,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
}); 