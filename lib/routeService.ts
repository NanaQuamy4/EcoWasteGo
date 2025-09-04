// Route calculation service using Google Maps Directions API
import { GOOGLE_MAPS_API_KEY } from '../constants';

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
  maneuver?: string;
}

export interface RouteInfo {
  distance: string;
  duration: string;
  steps: RouteStep[];
  polyline: string;
  coordinates: RoutePoint[];
}

export interface DirectionsResponse {
  routes: Array<{
    legs: Array<{
      distance: { text: string; value: number };
      duration: { text: string; value: number };
      steps: Array<{
        html_instructions: string;
        distance: { text: string; value: number };
        duration: { text: string; value: number };
        maneuver?: string;
        polyline: { points: string };
      }>;
    }>;
    overview_polyline: { points: string };
  }>;
  status: string;
}

// Decode polyline string to coordinates
function decodePolyline(encoded: string): RoutePoint[] {
  const poly = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    poly.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return poly;
}

// Get route from Google Maps Directions API
export async function getRoute(
  origin: RoutePoint,
  destination: RoutePoint,
  mode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving'
): Promise<RouteInfo | null> {
  try {
    const originStr = `${origin.latitude},${origin.longitude}`;
    const destinationStr = `${destination.latitude},${destination.longitude}`;
    
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&mode=${mode}&key=${GOOGLE_MAPS_API_KEY}`;
    
    console.log('🚗 Fetching route from Google Maps API...');
    console.log('Origin:', originStr);
    console.log('Destination:', destinationStr);
    console.log('Mode:', mode);
    
    const response = await fetch(url);
    const data: DirectionsResponse = await response.json();
    
    if (data.status !== 'OK' || !data.routes.length) {
      console.error('❌ Google Maps API error:', data.status);
      return null;
    }
    
    const route = data.routes[0];
    const leg = route.legs[0];
    
    // Decode polyline to get coordinates
    const coordinates = decodePolyline(route.overview_polyline.points);
    
    // Process steps for turn-by-turn directions
    const steps: RouteStep[] = leg.steps.map(step => ({
      instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Remove HTML tags
      distance: step.distance.text,
      duration: step.duration.text,
      maneuver: step.maneuver,
    }));
    
    const routeInfo: RouteInfo = {
      distance: leg.distance.text,
      duration: leg.duration.text,
      steps,
      polyline: route.overview_polyline.points,
      coordinates,
    };
    
    console.log('✅ Route calculated successfully:');
    console.log('Distance:', routeInfo.distance);
    console.log('Duration:', routeInfo.duration);
    console.log('Steps:', routeInfo.steps.length);
    console.log('Coordinates:', routeInfo.coordinates.length);
    
    return routeInfo;
  } catch (error) {
    console.error('❌ Error fetching route:', error);
    return null;
  }
}

// Calculate distance and duration between two points
export async function getDistanceAndDuration(
  origin: RoutePoint,
  destination: RoutePoint,
  mode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving'
): Promise<{ distance: string; duration: string } | null> {
  try {
    const route = await getRoute(origin, destination, mode);
    if (!route) return null;
    
    return {
      distance: route.distance,
      duration: route.duration,
    };
  } catch (error) {
    console.error('❌ Error calculating distance and duration:', error);
    return null;
  }
}

// Get alternative routes
export async function getAlternativeRoutes(
  origin: RoutePoint,
  destination: RoutePoint,
  mode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving'
): Promise<RouteInfo[]> {
  try {
    const originStr = `${origin.latitude},${origin.longitude}`;
    const destinationStr = `${destination.latitude},${destination.longitude}`;
    
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&mode=${mode}&alternatives=true&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data: DirectionsResponse = await response.json();
    
    if (data.status !== 'OK' || !data.routes.length) {
      console.error('❌ Google Maps API error:', data.status);
      return [];
    }
    
    return data.routes.map(route => {
      const leg = route.legs[0];
      const coordinates = decodePolyline(route.overview_polyline.points);
      
      const steps: RouteStep[] = leg.steps.map(step => ({
        instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
        distance: step.distance.text,
        duration: step.duration.text,
        maneuver: step.maneuver,
      }));
      
      return {
        distance: leg.distance.text,
        duration: leg.duration.text,
        steps,
        polyline: route.overview_polyline.points,
        coordinates,
      };
    });
  } catch (error) {
    console.error('❌ Error fetching alternative routes:', error);
    return [];
  }
}
