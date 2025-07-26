import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Image, ImageBackground, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const DUMMY_RESPONSES = [
  "I'm on my way, will be there in 10 minutes.",
  "I'm running a bit late due to traffic. Sorry for the delay.",
  "I've arrived at your location. Where should I meet you?",
  "I can see your building. I'll be there shortly.",
  "Thanks for the message. I'm heading to your pickup point now.",
  "I'm about 5 minutes away. Please have your waste ready.",
  "I'm here! Please come outside to meet me.",
  "I'm having trouble finding your exact location. Can you help?",
  "I'll be there in 15 minutes. Is that okay?",
  "I'm at the main entrance. Where are you located?"
];

const MESSAGE_SUGGESTION_SETS = [
  [
    "Where are you now?",
    "How long until you arrive?",
    "I'm ready for pickup",
    "Can you come earlier?",
    "I'm running late, please wait",
  ],
  [
    "I'm at the main gate",
    "I'm in the lobby",
    "I'm outside the building",
    "I'm at the parking lot",
    "I'm at the entrance",
  ],
  [
    "I have a lot of waste",
    "I have small waste bags",
    "I have recyclable items",
    "I have mixed waste",
    "I have electronic waste",
  ],
  [
    "Can you help me carry?",
    "I need assistance",
    "I'm elderly, please help",
    "I have heavy items",
    "I'm disabled, need help",
  ],
  [
    "What's your truck color?",
    "What's your vehicle number?",
    "How do I identify you?",
    "What should I look for?",
    "Are you wearing a uniform?",
  ],
];

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
  const pickup = params.pickup as string;

  // Mock data for the recycler (in real app, this would come from API)
  const recyclerData: RecyclerData = {
    name: recyclerName || 'GreenFleet GH',
    phone: '+233 59 197 8093',
    rating: 4.8,
    truckType: 'Small Truck',
    recyclerId: 'REC001',
    color: 'Green',
    rate: '₵50',
    pastPickups: 127,
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

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Logo Header with Back Arrow */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 18, paddingBottom: 8, backgroundColor: '#fff', marginTop: 32, position: 'relative' }}>
        <TouchableOpacity onPress={handleBack} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, justifyContent: 'center', paddingLeft: 12, zIndex: 2 }}>
          <Feather name="arrow-left" size={28} color="#263A13" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Image
            source={require('../assets/images/logo landscape.png')}
            style={{ width: 220, height: 52, resizeMode: 'contain', marginBottom: 12 }}
          />
        </View>
      </View>

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
        style={{ paddingHorizontal: 12, marginBottom: 6 }}
        contentContainerStyle={{ alignItems: 'center' }}
      >
        {MESSAGE_SUGGESTION_SETS[suggestionSetIndex].map((suggestion, idx) => (
          <TouchableOpacity
            key={suggestion}
            style={{
              backgroundColor: '#E3F0D5',
              borderRadius: 16,
              paddingVertical: 7,
              paddingHorizontal: 16,
              marginRight: idx === MESSAGE_SUGGESTION_SETS[suggestionSetIndex].length - 1 ? 0 : 10,
              marginLeft: idx === 0 ? 0 : 0,
              borderWidth: 1,
              borderColor: '#B6CDBD',
            }}
            onPress={() => sendMessage(suggestion)}
          >
            <Text style={{ color: '#22330B', fontWeight: 'bold', fontSize: 14 }}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Main Chat Area */}
      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ paddingHorizontal: 0, paddingTop: 8, paddingBottom: 90 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            <FontAwesome5 name="recycle" size={120} color="#B6CDBD" style={{ opacity: 0.25 }} />
          </View>
          {messages.map((msg, idx) => (
            <View
              key={msg.id}
              style={
                msg.sender === 'user'
                  ? [styles.userBubble, { alignSelf: 'flex-end', marginRight: 18 }]
                  : [styles.recyclerBubble, { alignSelf: 'flex-start', marginLeft: 18 }]
              }
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
          placeholderTextColor="#263A13"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => sendMessage()}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.inputSendBtn} onPress={() => sendMessage()}>
          <Feather name="send" size={22} color="#263A13" />
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/') }>
          <Feather name="home" size={28} color="#22330B" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/history') }>
          <Feather name="rotate-ccw" size={28} color="#22330B" />
          <Text style={styles.navLabel}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/user') }>
          <Feather name="user" size={28} color="#22330B" />
          <Text style={styles.navLabel}>User</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bannerBg: {
    backgroundColor: '#B6CDBD',
    borderRadius: 18,
    marginHorizontal: 0,
    marginTop: 8,
    marginBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
  },
  bannerPill: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 7,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 180,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  bannerText: {
    color: '#22330B',
    fontWeight: 'bold',
    fontSize: 18,
  },
  recyclerBubble: {
    backgroundColor: '#4CAF50',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  recyclerText: {
    color: '#fff',
    fontSize: 15,
  },
  userBubble: {
    backgroundColor: '#2196F3',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  userText: {
    color: '#fff',
    fontSize: 15,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 18,
    paddingHorizontal: 12,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#22330B',
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 18,
  },
  inputSendBtn: {
    marginLeft: 6,
    backgroundColor: '#E3F0D5',
    borderRadius: 16,
    padding: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: '#E3F0D5',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    color: '#22330B',
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