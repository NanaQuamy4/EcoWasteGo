# Google Maps API Setup Guide

## 🗺️ Overview

This guide will help you set up Google Maps API for your EcoWasteGo application. The integration provides:

- **Location Search** - Find addresses and coordinates
- **Directions** - Get routes between pickup points
- **Nearby Places** - Find recycling centers and waste facilities
- **Geocoding** - Convert addresses to coordinates and vice versa

## 🔑 Step 1: Get Google Maps API Key

### 1.1 Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable billing (required for API usage)

### 1.2 Enable Required APIs
Enable these APIs in your Google Cloud Console:
- **Geocoding API** - Convert addresses to coordinates
- **Directions API** - Get routes between points
- **Places API** - Find nearby places
- **Maps JavaScript API** - For frontend maps

### 1.3 Create API Key
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Copy your API key

## ⚙️ Step 2: Configure Environment Variables

Update your `.env` file with your Google Maps API key:

```env
# Google Maps API Configuration
GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key_here
```

## 🚀 Step 3: Test the Integration

### 3.1 Test Location Search
```bash
curl -X GET "http://localhost:3000/api/locations/search?query=Accra%20Ghana"
```

### 3.2 Test Directions
```bash
curl -X POST "http://localhost:3000/api/locations/directions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "origin": {"lat": 5.5600, "lng": -0.2057},
    "destination": {"lat": 5.5600, "lng": -0.2058}
  }'
```

### 3.3 Test Nearby Pickup Points
```bash
curl -X GET "http://localhost:3000/api/locations/nearby-pickup-points?lat=5.5600&lng=-0.2057&radius=5000"
```

## 📍 Available Endpoints

### Location Search
- **GET** `/api/locations/search?query=address`
- Returns coordinates and nearby places

### Location Suggestions
- **GET** `/api/locations/suggestions?input=partial_address`
- Returns location suggestions for autocomplete

### Directions
- **POST** `/api/locations/directions`
- Requires: `origin` and `destination` coordinates
- Returns: distance, duration, route polyline

### Nearby Pickup Points
- **GET** `/api/locations/nearby-pickup-points?lat=X&lng=Y&radius=Z`
- Returns nearby recycling centers and waste facilities

### Location Validation
- **POST** `/api/locations/validate`
- Requires: `lat` and `lng`
- Returns: validation result and formatted address

## 🔧 Features Included

### 1. Geocoding Service
- Convert addresses to coordinates
- Reverse geocoding (coordinates to address)
- Handle partial addresses

### 2. Directions Service
- Calculate routes between points
- Get distance and duration
- Route polyline for map display

### 3. Places Service
- Find nearby recycling centers
- Search for waste management facilities
- Get place details and ratings

### 4. Distance Calculations
- Calculate distances between points
- Find nearest recycler to customer
- Validate coordinate ranges

## 💡 Usage Examples

### Frontend Integration
```javascript
// Search for pickup location
const response = await fetch('/api/locations/search?query=Accra');
const data = await response.json();

// Get directions
const directions = await fetch('/api/locations/directions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    origin: { lat: 5.5600, lng: -0.2057 },
    destination: { lat: 5.5600, lng: -0.2058 }
  })
});
```

### Backend Usage
```typescript
import googleMapsService from '../services/googleMapsService';

// Geocode address
const coordinates = await googleMapsService.geocodeAddress('Accra, Ghana');

// Get directions
const directions = await googleMapsService.getDirections(origin, destination);

// Find nearest recycler
const nearest = await googleMapsService.findNearestRecycler(customerLocation, recyclers);
```

## 🔒 Security Considerations

1. **API Key Security**
   - Restrict API key to your domain
   - Set up API key restrictions in Google Cloud Console
   - Monitor usage to prevent abuse

2. **Rate Limiting**
   - Google Maps API has usage limits
   - Implement caching for frequently requested data
   - Monitor API usage costs

3. **Error Handling**
   - Handle API failures gracefully
   - Provide fallback options when API is unavailable
   - Log errors for debugging

## 📊 Cost Optimization

### Free Tier Limits
- **Geocoding API**: 2,500 requests/day
- **Directions API**: 2,500 requests/day
- **Places API**: 1,000 requests/day

### Optimization Tips
1. **Cache Results** - Store frequently requested data
2. **Batch Requests** - Combine multiple API calls
3. **Use Appropriate APIs** - Choose the most efficient API for your needs
4. **Monitor Usage** - Track API usage to optimize costs

## 🚀 Next Steps

1. **Get your Google Maps API key**
2. **Update your .env file**
3. **Test the endpoints**
4. **Integrate with your frontend**
5. **Monitor usage and costs**

## 📞 Support

- **Google Maps API Documentation**: https://developers.google.com/maps
- **Google Cloud Console**: https://console.cloud.google.com/
- **API Usage Dashboard**: Monitor your usage in Google Cloud Console 