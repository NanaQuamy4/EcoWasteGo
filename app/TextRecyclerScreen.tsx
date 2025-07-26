import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ImageBackground, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CommonHeader from './components/CommonHeader';
import { COLORS, DIMENSIONS, DUMMY_RESPONSES, MESSAGE_SUGGESTION_SETS, RECYCLER_DATA } from './utils/constants';

interface RecyclerData {
  name: string;
  phone: string;
  rating: number;
  truckType: string;
  recyclerId: string;
  color: string;
  rate: string;
  pastPickups: number;
}

export default function TextRecyclerScreen() {
  const params = useLocalSearchParams();
  const recyclerName = params.recyclerName as string;


  // Mock data for the recycler (in real app, this would come from API)
  const recyclerData: RecyclerData = {
    name: recyclerName || RECYCLER_DATA.name,
    phone: RECYCLER_DATA.phone,
    rating: RECYCLER_DATA.rating,
    truckType: RECYCLER_DATA.truckType,
    recyclerId: RECYCLER_DATA.recyclerId,
    color: RECYCLER_DATA.color,
    rate: RECYCLER_DATA.rate,
    pastPickups: RECYCLER_DATA.pastPickups,
  };

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, text: `Hi! I'm ${recyclerData.name}, your recycler. How can I help you?`, sender: "recycler" },
  ]);
  const [suggestionSetIndex, setSuggestionSetIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const sendMessage = (text?: string) => {
    const messageText = text !== undefined ? text : input;
    if (!messageText.trim()) return;
    const userMsg = { id: Date.now(), text: messageText, sender: "user" };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTimeout(() => {
      const dummy = DUMMY_RESPONSES[Math.floor(Math.random() * DUMMY_RESPONSES.length)];
      setMessages(prev => [...prev, { id: Date.now() + 1, text: dummy, sender: "recycler" }]);
    }, 1200);
  };

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Rotate message suggestions every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setSuggestionSetIndex(prev => (prev + 1) % MESSAGE_SUGGESTION_SETS.length);
    }, 15000);
    return () => clearInterval(interval);
  }, []);



  return (
    <SafeAreaView style={styles.container}>
      <CommonHeader title="Text Your Recycler" />

      {/* Recycler Info Banner */}
      <View style={styles.bannerBg}>
        <ImageBackground
          source={require('../assets/images/blend.jpg')}
          style={styles.bannerImage}
          imageStyle={{ borderRadius: 18, opacity: 0.28 }}
          resizeMode="cover"
        >
          <View style={styles.bannerPill}>
            <Text style={styles.bannerText}>Text with {recyclerData.name}</Text>
          </View>
        </ImageBackground>
      </View>

      {/* Message Suggestions */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.suggestionsContainer}
        contentContainerStyle={styles.suggestionsContent}
      >
        {MESSAGE_SUGGESTION_SETS[suggestionSetIndex].map((suggestion, idx) => (
          <TouchableOpacity
            key={suggestion}
            style={[
              styles.suggestionButton,
              { marginRight: idx === MESSAGE_SUGGESTION_SETS[suggestionSetIndex].length - 1 ? 0 : 10 }
            ]}
            onPress={() => sendMessage(suggestion)}
          >
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Main Chat Area */}
      <View style={styles.chatContainer}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.recycleIconContainer}>
            <FontAwesome5 name="recycle" size={120} color={COLORS.lightGreen} style={{ opacity: 0.25 }} />
          </View>
          {messages.map((msg, idx) => (
            <View
              key={msg.id}
              style={[
                msg.sender === 'user' ? styles.userBubble : styles.recyclerBubble,
                msg.sender === 'user' ? styles.userBubblePosition : styles.recyclerBubblePosition
              ]}
            >
              <Text style={msg.sender === 'user' ? styles.userText : styles.recyclerText}>{msg.text}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          placeholderTextColor={COLORS.darkGreen}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => sendMessage()}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.inputSendBtn} onPress={() => sendMessage()}>
          <Feather name="send" size={22} color={COLORS.darkGreen} />
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/') }>
          <Feather name="home" size={28} color={COLORS.darkGreen} />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/history') }>
          <Feather name="rotate-ccw" size={28} color={COLORS.darkGreen} />
          <Text style={styles.navLabel}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/user') }>
          <Feather name="user" size={28} color={COLORS.darkGreen} />
          <Text style={styles.navLabel}>User</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  bannerBg: {
    backgroundColor: COLORS.lightGreen,
    borderRadius: 18,
    marginHorizontal: 0,
    marginTop: 8,
    marginBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
  },
  bannerPill: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingVertical: 7,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 180,
    maxWidth: '90%',
    shadowColor: COLORS.black,
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  bannerText: {
    color: COLORS.darkGreen,
    fontWeight: 'bold',
    fontSize: 18,
  },
  suggestionsContainer: {
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  suggestionsContent: {
    alignItems: 'center',
  },
  suggestionButton: {
    backgroundColor: COLORS.lightGreen,
    borderRadius: 16,
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.lightGreen,
  },
  suggestionText: {
    color: COLORS.darkGreen,
    fontWeight: 'bold',
    fontSize: 14,
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 0,
    paddingTop: 8,
    paddingBottom: 90,
  },
  recycleIconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  recyclerBubble: {
    backgroundColor: COLORS.secondary,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
    maxWidth: '80%',
    shadowColor: COLORS.black,
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  recyclerBubblePosition: {
    alignSelf: 'flex-start',
    marginLeft: 18,
  },
  recyclerText: {
    color: COLORS.white,
    fontSize: 15,
  },
  userBubble: {
    backgroundColor: '#2196F3',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
    maxWidth: '80%',
    shadowColor: COLORS.black,
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  userBubblePosition: {
    alignSelf: 'flex-end',
    marginRight: 18,
  },
  userText: {
    color: COLORS.white,
    fontSize: 15,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    marginHorizontal: DIMENSIONS.margin,
    marginBottom: 18,
    paddingHorizontal: 12,
    paddingVertical: 4,
    shadowColor: COLORS.black,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.darkGreen,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: COLORS.white,
    borderRadius: 18,
  },
  inputSendBtn: {
    marginLeft: 6,
    backgroundColor: COLORS.lightGreen,
    borderRadius: 16,
    padding: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: COLORS.lightGreen,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    color: COLORS.darkGreen,
    fontSize: 13,
    marginTop: 2,
    fontWeight: 'bold',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 