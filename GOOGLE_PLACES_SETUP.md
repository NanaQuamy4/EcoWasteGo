# Google Places API Setup Guide

This guide explains how to set up Google Places API integration for real-time location search and geocoding.

## 🚀 **What's Included**

### **New Features:**
- ✅ **Real-time location suggestions** from Google Places API
- ✅ **Accurate geocoding** for any address worldwide
- ✅ **Location-biased search** based on user's current location
- ✅ **Place details** with precise coordinates
- ✅ **Ghana-focused results** with country restriction

## 📋 **Setup Instructions**

### **Step 1: Get Google Places API Key**

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/

2. **Create or Select Project:**
   - Create a new project or select existing one
   - Name it "EcoWasteGo" or similar

3. **Enable Required APIs:**
   - Go to "APIs & Services" > "Library"
   - Enable these APIs:
     - **Places API**
     - **Geocoding API**
     - **Maps JavaScript API**

4. **Create API Key:**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key

### **Step 2: Configure API Key Restrictions (Recommended)**

1. **Restrict API Key:**
   - Click on your API key in the credentials list
   - Under "Application restrictions":
     - Select "Android apps" or "iOS apps" (for mobile)
     - Or "HTTP referrers" (for web)
   - Under "API restrictions":
     - Select "Restrict key"
     - Choose only the APIs you enabled above

2. **Set Usage Quotas:**
   - Go to "APIs & Services" > "Quotas"
   - Set reasonable daily limits to control costs

### **Step 3: Add API Key to Your Project**

1. **Create Environment File:**
   ```bash
   # Copy the example file
   cp .env.example .env
   ```

2. **Add Your API Key:**
   ```env
   # In your .env file
   EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_actual_api_key_here
   ```

3. **Restart Your Development Server:**
   ```bash
   npx expo start --clear
   ```

## 🎯 **How It Works**

### **Location Search Flow:**
1. **User types** in search bar (3+ characters)
2. **Google Places API** returns real-time suggestions
3. **Suggestions appear** in dropdown with location icons
4. **User selects** a suggestion
5. **Place details** are fetched for precise coordinates
6. **Map updates** to show the selected location
7. **Search marker** appears on the map

### **Geocoding Flow:**
1. **Address input** → Google Geocoding API
2. **Coordinates returned** → Map centers on location
3. **Marker placed** → Visual feedback for user

## 🔧 **API Features**

### **Places Autocomplete:**
- **Real-time suggestions** as you type
- **Location-biased results** (prioritizes nearby places)
- **Ghana-focused** (restricted to Ghana locations)
- **Multiple place types** (establishments, addresses, etc.)

### **Place Details:**
- **Precise coordinates** for selected places
- **Formatted addresses** and place names
- **Place types** (restaurant, hospital, etc.)

### **Geocoding:**
- **Address to coordinates** conversion
- **Reverse geocoding** (coordinates to address)
- **Country restriction** to Ghana

## 💰 **Pricing Information**

### **Google Places API Pricing (as of 2024):**
- **Places Autocomplete:** $2.83 per 1,000 requests
- **Place Details:** $3.00 per 1,000 requests
- **Geocoding:** $5.00 per 1,000 requests

### **Cost Optimization:**
- **Debounced search** (500ms delay) reduces API calls
- **Country restriction** improves relevance and may reduce costs
- **Location bias** improves accuracy and user experience
- **Set daily quotas** to control spending

## 🚨 **Important Notes**

### **Security:**
- **Never commit** your API key to version control
- **Use environment variables** for API keys
- **Restrict API key** to your app/domain
- **Monitor usage** regularly

### **Rate Limits:**
- **Places API:** 1,000 requests per 100 seconds
- **Geocoding API:** 2,500 requests per day (free tier)
- **Implement proper error handling** for rate limits

### **Fallback Behavior:**
- If API key is missing, the app falls back to basic functionality
- Error handling ensures the app doesn't crash
- Console warnings indicate when API is unavailable

## 🧪 **Testing**

### **Test the Integration:**
1. **Start typing** in the search bar
2. **Verify suggestions** appear from Google Places
3. **Select a suggestion** and check map updates
4. **Check console** for any API errors
5. **Test with different locations** in Ghana

### **Common Issues:**
- **No suggestions:** Check API key and enabled APIs
- **Rate limit errors:** Implement proper error handling
- **Wrong location:** Verify country restriction is working
- **Slow responses:** Check network connection

## 📱 **Mobile Considerations**

### **Expo Configuration:**
- API key is prefixed with `EXPO_PUBLIC_` for client-side access
- Works with both development and production builds
- No additional native configuration required

### **Network Requests:**
- All requests are made over HTTPS
- CORS is handled by Google's servers
- Works on both iOS and Android

## 🔄 **Migration from Hardcoded**

### **What Changed:**
- ❌ **Removed:** Static location suggestions
- ✅ **Added:** Real-time Google Places suggestions
- ✅ **Added:** Accurate geocoding for any address
- ✅ **Added:** Location-biased search results
- ✅ **Added:** Place details with precise coordinates

### **Benefits:**
- **Real locations** instead of hardcoded ones
- **Global coverage** with Ghana focus
- **Accurate coordinates** for better map positioning
- **Better user experience** with relevant suggestions

The Google Places API integration is now ready! Users will see real location suggestions from Google's database instead of hardcoded ones. 🎉
