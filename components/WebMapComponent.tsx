import { Dimensions, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

interface WebMapComponentProps {
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
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  style?: any;
  height?: number;
}

export default function WebMapComponent({
  markers = [],
  initialRegion = {
    latitude: 6.6734, // Ghana coordinates
    longitude: -1.5714,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  },
  style,
  height: customHeight,
}: WebMapComponentProps) {
  // Create Google Maps HTML with markers
  const createMapHTML = () => {
    const markersHTML = markers.map(marker => `
      new google.maps.Marker({
        position: { lat: ${marker.coordinate.latitude}, lng: ${marker.coordinate.longitude} },
        map: map,
        title: '${marker.title || 'Location'}',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="${marker.type === 'recycler' ? '#FF9500' : '#007AFF'}" stroke="white" stroke-width="2"/>
              <text x="20" y="25" text-anchor="middle" fill="white" font-size="16" font-weight="bold">
                ${marker.type === 'recycler' ? '🚛' : '📍'}
              </text>
            </svg>
          `)}',
          scaledSize: new google.maps.Size(40, 40)
        }
      });
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; }
            #map { width: 100%; height: 100vh; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            function initMap() {
              const map = new google.maps.Map(document.getElementById('map'), {
                center: { lat: ${initialRegion.latitude}, lng: ${initialRegion.longitude} },
                zoom: 15,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                styles: [
                  {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }]
                  }
                ]
              });

              // Add markers
              ${markersHTML}

              // Add user location button
              const userLocationButton = document.createElement('div');
              userLocationButton.style.cssText = \`
                background-color: white;
                border: 2px solid #ccc;
                border-radius: 3px;
                box-shadow: 0 2px 6px rgba(0,0,0,.3);
                cursor: pointer;
                margin-bottom: 22px;
                text-align: center;
                height: 40px;
                width: 40px;
                position: absolute;
                top: 10px;
                right: 10px;
                z-index: 1000;
              \`;
              userLocationButton.innerHTML = '📍';
              userLocationButton.title = 'Your Location';
              
              userLocationButton.addEventListener('click', () => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                      };
                      map.setCenter(pos);
                      new google.maps.Marker({
                        position: pos,
                        map: map,
                        title: 'Your Location',
                        icon: {
                          url: 'data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                            <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="15" cy="15" r="12" fill="#007AFF" stroke="white" stroke-width="2"/>
                              <text x="15" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">📍</text>
                            </svg>
                          `)}',
                          scaledSize: new google.maps.Size(30, 30)
                        }
                      });
                    },
                    () => {
                      console.log('Error: The Geolocation service failed.');
                    }
                  );
                }
              });

              map.controls[google.maps.ControlPosition.TOP_RIGHT].push(userLocationButton);
            }
          </script>
          <script async defer
            src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&callback=initMap">
          </script>
        </body>
      </html>
    `;
  };

  return (
    <View style={[styles.container, style, { height: customHeight || height * 0.6 }]}>
      <WebView
        source={{ html: createMapHTML() }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
  },
});


