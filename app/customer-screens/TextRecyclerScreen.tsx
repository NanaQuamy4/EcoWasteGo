import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Image, ImageBackground, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// ===== MOCK DATA FOR TEXT RECYCLER SCREEN =====
// This replaces the backend API calls with local mock data
// In a real app, this would come from a database or messaging service

// Mock chat messages
const mockChatMessages = [
  {
    id: 1,
    text: "Hi! I'm ready for pickup. What's your location?",
    sender: "customer"
  },
  {
    id: 2,
    text: "Great! I'll be there in 10 minutes. Please have your waste ready.",
    sender: "recycler"
  },
  {
    id: 3,
    text: "Perfect, I'll be waiting at the gate. I have mixed waste.",
    sender: "customer"
  },
  {
    id: 4,
    text: "I'm at the gate now. Can you come out with your waste?",
    sender: "recycler"
  }
];

// Mock recycler data
const mockRecyclerData = {
  id: "recycler_001",
  name: "Green Team",
  phone: "+233241234568",
  rating: 4.8,
  completedPickups: 150,
  vehicle: "Recycling Truck",
  photo: null
};

// FAQ suggestion sets for customers
const FAQ_SUGGESTION_SETS = [
  [
    "I'm ready for pickup",
    "What time will you arrive?",
    "I have mixed waste",
    "Please call when you arrive",
    "I'll be waiting at the gate",
  ],
  [
    "How much do you pay per kg?",
    "Do you accept all types of waste?",
    "Can you help carry the waste?",
    "I'm not home right now",
    "Can we reschedule?",
  ],
  [
    "What's your exact location?",
    "Do you provide bags?",
    "How long will pickup take?",
    "I have special instructions",
    "Please confirm my address",
  ],
];

// Dummy responses for recycler
const DUMMY_RESPONSES = [
  "Got it! I'll be there in 10 minutes.",
  "Thanks for letting me know.",
  "I'll call when I arrive.",
  "Perfect, see you soon.",
  "Noted, thank you.",
  "What type of waste do you have?",
  "How much waste do you have?",
  "I'll be there shortly."
];

export default function TextRecyclerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    requestId?: string;
    recyclerName?: string;
    recyclerPhone?: string;
    pickup?: string;
  }>();

  // ===== LOCAL STATE MANAGEMENT =====
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(mockChatMessages);
  const [faqSetIndex, setFaqSetIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [recyclerData, setRecyclerData] = useState<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // ===== INITIALIZATION EFFECT =====
  useEffect(() => {
    loadMockData();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Rotate FAQ suggestions every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setFaqSetIndex(prev => (prev + 1) % FAQ_SUGGESTION_SETS.length);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // ===== MOCK DATA LOADING FUNCTION =====
  const loadMockData = async () => {
    try {
      setIsLoading(true);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Load mock recycler data
      const recycler = {
        ...mockRecyclerData,
        name: params.recyclerName || mockRecyclerData.name,
        phone: params.recyclerPhone || mockRecyclerData.phone
      };
      
      setRecyclerData(recycler);
      console.log('TextRecyclerScreen: Mock data loaded successfully');
    } catch (error) {
      console.error('TextRecyclerScreen: Error loading mock data:', error);
      // Fallback to default mock data
      setRecyclerData(mockRecyclerData);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== MESSAGE HANDLING =====
  const sendMessage = (text?: string) => {
    const messageText = text !== undefined ? text : input;
    if (!messageText.trim()) return;
    
    const customerMsg = { id: Date.now(), text: messageText, sender: "customer" };
    setMessages(prev => [...prev, customerMsg]);
    setInput("");
    
    // Simulate recycler response after 1-3 seconds
    setTimeout(() => {
      const dummy = DUMMY_RESPONSES[Math.floor(Math.random() * DUMMY_RESPONSES.length)];
      setMessages(prev => [...prev, { id: Date.now() + 1, text: dummy, sender: "recycler" }]);
    }, Math.random() * 2000 + 1000);
  };

  // ===== ACTION HANDLERS =====
  const handleCallRecycler = () => {
    if (recyclerData?.phone) {
      Alert.alert(
        'Call Recycler',
        `Call ${recyclerData.name} at ${recyclerData.phone}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Call', 
            onPress: () => {
              console.log('Calling recycler:', recyclerData.phone);
              Alert.alert('Call Recycler', 'Phone call functionality would be implemented here.');
            }
          }
        ]
      );
    }
  };

  const handleViewRecyclerProfile = () => {
    if (recyclerData?.id) {
      Alert.alert('Recycler Profile', 'Recycler profile view would be implemented here.');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, color: '#22330B', fontWeight: 'bold' }}>Loading chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!recyclerData) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: '#22330B', fontSize: 18, textAlign: 'center', marginBottom: 20 }}>
            Failed to load recycler information
          </Text>
          <TouchableOpacity 
            style={{ backgroundColor: '#E3F0D5', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 }}
            onPress={loadMockData}
          >
            <Text style={{ color: '#22330B', fontSize: 16, fontWeight: 'bold' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Logo Header with Back Arrow */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 18, paddingBottom: 8, backgroundColor: '#fff', marginTop: 32, position: 'relative' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, justifyContent: 'center', paddingLeft: 12, zIndex: 2 }}>
          <Feather name="arrow-left" size={28} color="#263A13" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Image
            source={require('../../assets/images/logo landscape.png')}
            style={{ width: 220, height: 52, resizeMode: 'contain', marginBottom: 12 }}
          />
        </View>
      </View>

      {/* Banner */}
      <View style={styles.bannerBg}>
        <ImageBackground
          source={require('../../assets/images/blend.jpg')}
          style={styles.bannerImage}
          imageStyle={{ borderRadius: 18, opacity: 0.28 }}
          resizeMode="cover"
        >
          <View style={styles.bannerPill}>
            <Text style={styles.bannerText}>Text With Recycler</Text>
          </View>
        </ImageBackground>
      </View>

      {/* Main Chat Area with Background */}
      <View style={{ flex: 1, backgroundColor: '#F8FFF0' }}>
        <Image
          source={require('../../assets/images/bin.png')}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.4,
            resizeMode: 'contain'
          }}
        />
        
        {/* FAQ Suggestions - Horizontal scrollable */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ paddingHorizontal: 12, marginVertical: 8 }}
          contentContainerStyle={{ alignItems: 'center' }}
        >
          {FAQ_SUGGESTION_SETS[faqSetIndex].map((faq, idx) => (
            <TouchableOpacity
              key={faq}
              style={{
                backgroundColor: '#E3F0D5',
                borderRadius: 12,
                paddingVertical: 4,
                paddingHorizontal: 12,
                marginRight: idx === FAQ_SUGGESTION_SETS[faqSetIndex].length - 1 ? 0 : 8,
                marginLeft: idx === 0 ? 0 : 0,
                borderWidth: 1,
                borderColor: '#B6CDBD',
              }}
              onPress={() => sendMessage(faq)}
            >
              <Text style={{ color: '#22330B', fontWeight: 'bold', fontSize: 12 }}>{faq}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Chat Messages */}
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
                msg.sender === 'customer'
                  ? [styles.customerBubble, { alignSelf: 'flex-end', marginRight: 18 }]
                  : [styles.recyclerBubble, { alignSelf: 'flex-start', marginLeft: 18 }]
              }
            >
              <Text style={msg.sender === 'customer' ? styles.customerText : styles.recyclerText}>{msg.text}</Text>
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
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)') }>
          <Feather name="home" size={28} color="#22330B" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/history') }>
          <Feather name="rotate-ccw" size={28} color="#22330B" />
          <Text style={styles.navLabel}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/user') }>
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
  customerBubble: {
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
  customerText: {
    color: '#fff',
    fontSize: 15,
  },
  recyclerBubble: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#B6CDBD',
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
    color: '#22330B',
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