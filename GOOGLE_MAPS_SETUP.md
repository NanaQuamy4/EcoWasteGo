# 🗺️ Google Maps API Setup Guide for EcoWasteGo

## Overview

This guide will help you set up Google Maps API for your EcoWasteGo React Native app. The app is currently configured to use Google Maps on both Android and iOS platforms.

## 🔑 Step 1: Get Google Maps API Key

### 1.1 Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable billing (required for API usage)

### 1.2 Enable Required APIs
Enable these APIs in your Google Cloud Console:
- **Maps SDK for Android** - For Android map functionality
- **Maps SDK for iOS** - For iOS map functionality
- **Geocoding API** - Convert addresses to coordinates
- **Directions API** - Get routes between points
- **Places API** - Find nearby places
- **Distance Matrix API** - Calculate ETAs

### 1.3 Create API Key
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Copy your API key

## ⚙️ Step 2: Configure API Key

### 2.1 Update app.json
Replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` in your `app.json` file:

```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "your_actual_google_maps_api_key_here"
        }
      }
    }
  }
}
```

### 2.2 For iOS (Optional)
If you want to use Google Maps on iOS instead of Apple Maps, add:

```json
{
  "expo": {
    "ios": {
      "config": {
        "googleMapsApiKey": "your_actual_google_maps_api_key_here"
      }
    }
  }
}
```

## 🔒 Step 3: Secure Your API Key

### 3.1 Restrict API Key
1. In Google Cloud Console, go to **Credentials**
2. Click on your API key
3. Under **Application restrictions**, select **Android apps** and **iOS apps**
4. Add your app's package name and SHA-1 fingerprint

### 3.2 Package Names
- **Android**: `com.ecowastego.app` (or your actual package name)
- **iOS**: `com.ecowastego.app` (or your actual bundle identifier)

### 3.3 Get SHA-1 Fingerprint (Android)
```bash
# For debug builds
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# For release builds
keytool -list -v -keystore your-release-key.keystore -alias your-key-alias
```

## 🚀 Step 4: Test the Integration

### 4.1 Development Testing
1. Start your development server: `npm start`
2. Run on Android: `npm run android`
3. Run on iOS: `npm run ios`

### 4.2 Verify Map Loading
- Maps should load with Google Maps tiles
- Location services should work
- Markers should display correctly

## 🔧 Current Implementation

### Map Component Features
- ✅ **Google Maps integration** via react-native-maps
- ✅ **Custom markers** for recyclers, pickup points, destinations
- ✅ **Route visualization** with polylines
- ✅ **Location permission handling**
- ✅ **Real-time location tracking**

### Location Services
- ✅ **Current location** retrieval
- ✅ **Geocoding** (address to coordinates)
- ✅ **Reverse geocoding** (coordinates to address)
- ✅ **Nearby recycler search**
- ✅ **Distance calculations**

## 📱 Platform-Specific Notes

### Android
- **Provider**: Google Maps (default)
- **API Key**: Required in app.json
- **Permissions**: Location access configured

### iOS
- **Provider**: Apple Maps (default) or Google Maps (if configured)
- **API Key**: Optional for Google Maps
- **Permissions**: Location access configured

## 🐛 Troubleshooting

### Common Issues

1. **"Google Maps API key not found"**
   - Check app.json configuration
   - Verify API key is correct
   - Ensure API key has proper restrictions

2. **"Maps not loading"**
   - Check internet connection
   - Verify API key is valid
   - Check API quotas in Google Cloud Console

3. **"Location permission denied"**
   - Check app permissions in device settings
   - Verify location services are enabled
   - Test with location permission granted

### Debug Steps
1. **Check API Key**: Verify in Google Cloud Console
2. **Test API**: Use Google Maps API testing tools
3. **Check Logs**: Look for API key errors in console
4. **Verify Permissions**: Ensure location permissions are granted

## 💰 Cost Considerations

### Free Tier Limits
- **Maps SDK for Android**: 25,000 map loads/month
- **Maps SDK for iOS**: 25,000 map loads/month
- **Geocoding API**: 2,500 requests/day
- **Directions API**: 2,500 requests/day

### Optimization Tips
1. **Cache Results** - Store frequently requested data
2. **Batch Requests** - Combine multiple API calls
3. **Monitor Usage** - Track API usage in Google Cloud Console
4. **Set Quotas** - Configure usage limits to prevent overages

## 🔮 Next Steps

### Immediate Actions
1. **Get your Google Maps API key**
2. **Update app.json** with your API key
3. **Test the integration** on both platforms
4. **Set up API restrictions** for security

### Future Enhancements
- [ ] **Offline maps** support
- [ ] **Custom map styles**
- [ ] **Advanced routing** algorithms
- [ ] **Real-time traffic** integration
- [ ] **Geofencing** capabilities

## 📚 Resources

### Documentation
- [Google Maps Platform](https://developers.google.com/maps)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)
- [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)

### Support
- [Google Cloud Support](https://cloud.google.com/support)
- [React Native Maps Issues](https://github.com/react-native-maps/react-native-maps/issues)

---

**🎉 Once you've added your Google Maps API key, your EcoWasteGo app will have full map functionality!** 