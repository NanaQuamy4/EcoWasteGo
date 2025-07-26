import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, ImageBackground, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AppHeader from '../components/AppHeader';

const SUGGESTIONS = [
  'Gold Hostel, komfo anokye',
  'Atonsu unity oil',
];

export default function HomeScreen() {
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
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
      <AppHeader />
      {/* Map section left blank for now */}
      <View style={styles.mapPlaceholder}>
        {/* Overlayed Search Bar */}
        <View style={styles.searchOverlayContainer}>
          <View style={styles.searchBarBg}>
            <ImageBackground
              source={require('../assets/images/blend.jpg')}
              style={StyleSheet.absoluteFill}
              imageStyle={{ borderRadius: 18 }}
              resizeMode="cover"
            />
            <View style={styles.searchBar}>
              <Feather name="search" size={20} color="#263A13" style={{ marginLeft: 10 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="What your pickup point?"
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
        </View>
        {/* Truck List Section removed. Now handled in SelectTruck screen. */}
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
  searchOverlayContainer: {
    position: 'absolute',
    top: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  searchBarBg: {
    backgroundColor: '#D9DED8',
    borderRadius: 24,
    width: '94%',
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
    left: '2%',
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
    borderRadius: 16,
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
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 0,
    marginBottom: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    position: 'relative',
  },
}); 