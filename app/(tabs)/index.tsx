import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, ImageBackground, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
import DrawerMenu from '../../components/DrawerMenu';
import { COLORS } from '../../constants';

const SUGGESTIONS = [
  'Gold Hostel, komfo anokye',
  'Atonsu unity oil',
];



export default function HomeScreen() {
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const user = { name: 'Williams Boampong' };
  const router = useRouter();


  const filteredSuggestions = SUGGESTIONS.filter(s =>
    s.toLowerCase().includes(search.toLowerCase())
  );

  const handleSuggestionPress = (suggestion: string) => {
    setSearch(suggestion);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      <AppHeader
        onMenuPress={() => setDrawerOpen(true)}
        onNotificationPress={() => router.push('/NotificationScreen')}
        notificationCount={3}
      />
      <DrawerMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} user={user} />
      
      {/* Map Container */}
      <View style={styles.mapContainer}>
        {/* Blank placeholder for Google Maps API integration */}
        <View style={styles.mapPlaceholder}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>User Dashboard</Text>
            <Text style={styles.mapSubtitle}>Find recyclers and schedule pickups</Text>
          </View>
          
          {/* Search Bar Overlay */}
          <View style={styles.searchOverlayContainer}>
            <ImageBackground
              source={require('../../assets/images/blend.jpg')}
              style={styles.searchBarBg}
              imageStyle={{ borderRadius: 24, opacity: 0.28 }}
              resizeMode="cover"
            >
              <View style={styles.searchBar}>
                <Feather name="search" size={20} color="#263A13" style={{ marginLeft: 10 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="What's your pickup point?"
                  value={search}
                  onChangeText={text => {
                    setSearch(text);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholderTextColor="#263A13"
                />
                <TouchableOpacity
                  style={{
                    backgroundColor: '#E3F0D5',
                    borderRadius: 14,
                    paddingHorizontal: 18,
                    paddingVertical: 8,
                    marginRight: 10,
                    marginLeft: 10,
                    opacity: search.length > 0 ? 1 : 0.5,
                  }}
                  disabled={search.length === 0}
                  onPress={() => {
                    if (search.length > 0) {
                      router.push({ pathname: '/SelectTruck', params: { pickup: search } });
                    }
                  }}
                >
                  <Text style={{ color: '#22330B', fontWeight: 'bold', fontSize: 16 }}>Recycle</Text>
                </TouchableOpacity>
              </View>
              {showSuggestions && search.length > 0 && (
                <View style={styles.suggestionsBox}>
                  <FlatList
                    data={filteredSuggestions}
                    keyExtractor={item => item}
                    renderItem={({ item }) => (
                      <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSuggestionPress(item)}>
                        <Feather name="search" size={16} color="#263A13" style={{ marginRight: 8 }} />
                        <Text style={styles.suggestionText}>{item}</Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
            </ImageBackground>
          </View>
          
          {/* Blank map area for future Google Maps integration */}
          <View style={styles.mapContent}>
            <View style={styles.blankMapArea}>
              <Text style={styles.blankMapText}>Map Area</Text>
              <Text style={styles.blankMapSubtext}>Google Maps integration coming soon</Text>
            </View>
          </View>
        </View>
      </View>
      {/* BottomNav removed, default tab bar will show */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  hamburger: {
    position: 'absolute',
    top: 36,
    left: 18,
    zIndex: 100,
    backgroundColor: 'transparent',
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.18)',
    zIndex: 99,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#C7CCC1',
    zIndex: 101,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 2,
    marginBottom: 2,
  },
  menuItemText: {
    color: '#22330B',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 18,
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    width: 230,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#263A13',
    textAlign: 'center',
    marginTop: 8,
  },
  tagline: {
    fontSize: 13,
    color: '#263A13',
    textAlign: 'center',
    marginBottom: 8,
  },
  searchOverlayContainer: {
    position: 'absolute',
    top: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
    alignSelf: 'center',
  },
  searchBarBg: {
    backgroundColor: '#D9DED8',
    borderRadius: 24,
    width: '100%',
    height: 100,
    minHeight: 100,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    height: 50,
    width: '90%',
    position: 'absolute',
    top: '50%',
    left: '5%',
    transform: [{ translateY: -27 }],
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#263A13',
    marginLeft: 10,
    backgroundColor: 'transparent',
  },
  suggestionsBox: {
    position: 'absolute',
    top: 56,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
    paddingVertical: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  suggestionText: {
    fontSize: 16,
    color: '#263A13',
  },
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapHeader: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 1,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    textAlign: 'center',
  },
  mapSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 4,
  },
  mapContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blankMapArea: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  blankMapText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    textAlign: 'center',
  },
  blankMapSubtext: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
  },
});
