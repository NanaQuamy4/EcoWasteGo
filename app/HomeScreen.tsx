import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  ImageBackground,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AppHeader from '../components/AppHeader';

const SUGGESTIONS = ['Gold Hostel, Komfo Anokye', 'Atonsu Unity Oil'];

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

      <View style={styles.mapPlaceholder}>
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
                style={styles.recyclingBtn}
                disabled={search.length === 0}
                onPress={() => {
                  if (search.length > 0) {
                    router.push({
                      pathname: '/SelectTruck',
                      params: { pickup: search },
                    });
                  }
                }}
              >
                <Text style={styles.recycleText}>Recycle</Text>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
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
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    height: 50,
    width: '90%',
    alignSelf: 'center',
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -27 }],
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#263A13',
    marginLeft: 10,
  },
  recyclingBtn: {
    backgroundColor: '#E3F0D5',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginRight: 10,
    marginLeft: 10,
    opacity: 1,
  },
  recycleText: {
    color: '#22330B',
    fontWeight: 'bold',
    fontSize: 16,
  },
  suggestionsBox: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 4,
    paddingVertical: 8,
    width: '90%',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  suggestionText: { fontSize: 16, color: '#263A13' },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#F2FFE5',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
});
