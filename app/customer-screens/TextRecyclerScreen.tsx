import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, ImageBackground, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS, DIMENSIONS, MESSAGE_SUGGESTION_SETS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';
import { messageAnalysisService, ResponseSuggestion } from '../../services/messageAnalysisService';
import CommonHeader from '../components/CommonHeader';

interface Message {
  id: string;
  message: string;
  sender_type: 'customer' | 'recycler';
  sender_id: string;
  created_at: string;
  is_read: boolean;
}

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
  const requestId = params.requestId as string;
  const recyclerName = params.recyclerName as string;
  const pickup = params.pickup as string;
  const { user } = useAuth();

  // Mock data for the recycler (in real app, this would come from API)
  const recyclerData: RecyclerData = {
    name: recyclerName || 'Recycler',
    phone: '+233 XX XXX XXXX',
    rating: 4.8,
    truckType: 'Pickup Truck',
    recyclerId: 'R001',
    color: 'Green',
    rate: '₵2.50/kg',
    pastPickups: 156,
  };

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [suggestionSetIndex, setSuggestionSetIndex] = useState(0);
  const [pollingInterval, setPollingInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const [currentPickupStage, setCurrentPickupStage] = useState('in_progress'); // Default stage
  const [intelligentSuggestions, setIntelligentSuggestions] = useState<ResponseSuggestion[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  // Load messages when component mounts
  useEffect(() => {
    if (requestId) {
      loadMessages();
      startMessagePolling();
      loadPickupStatus();
    }
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [requestId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Generate intelligent suggestions when messages change
  useEffect(() => {
    if (messages.length > 0) {
      generateIntelligentSuggestions();
    }
  }, [messages, currentPickupStage]);

  // Rotate message suggestions every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setSuggestionSetIndex(prev => (prev + 1) % MESSAGE_SUGGESTION_SETS.length);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const messages = await apiService.getChatMessages(requestId);
      setMessages(messages);
    } catch (error) {
      console.error('Error loading messages:', error);
      // Show fallback message
      setMessages([{
        id: '1',
        message: `Hi! I'm ${recyclerData.name}, your recycler. How can I help you with your waste pickup?`,
        sender_type: 'recycler',
        sender_id: 'recycler',
        created_at: new Date().toISOString(),
        is_read: false
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPickupStatus = async () => {
    try {
      // In a real app, you'd fetch the current pickup status
      // For now, we'll use a default stage
      setCurrentPickupStage('in_progress');
    } catch (error) {
      console.error('Error loading pickup status:', error);
      setCurrentPickupStage('in_progress');
    }
  };

  const generateIntelligentSuggestions = () => {
    if (messages.length === 0) return;

    // Get the last recycler message to analyze
    const lastRecyclerMessage = messages
      .filter(msg => msg.sender_type === 'recycler')
      .pop();

    if (lastRecyclerMessage) {
      const suggestions = messageAnalysisService.generateResponseSuggestions(
        lastRecyclerMessage.message,
        'recycler', // The recycler sent the message
        currentPickupStage,
        messages.map(msg => msg.message)
      );
      setIntelligentSuggestions(suggestions);
    } else {
      // If no recycler messages, show default suggestions
      const defaultSuggestions = messageAnalysisService.getQuickResponses('customer', currentPickupStage);
      setIntelligentSuggestions(defaultSuggestions.map(text => ({
        text,
        relevance: 0.7,
        context: 'Default suggestions',
        category: 'helpful'
      })));
    }
  };

  const startMessagePolling = () => {
    // Poll for new messages every 3 seconds
    const interval = setInterval(async () => {
      try {
        const newMessages = await apiService.getChatMessages(requestId);
        if (newMessages.length !== messages.length) {
          setMessages(newMessages);
        }
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    }, 3000);
    
    setPollingInterval(interval);
  };

  const sendMessage = async (text?: string) => {
    const messageText = text !== undefined ? text : input;
    if (!messageText.trim() || !requestId) return;

    try {
      // Optimistically add message to UI
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        message: messageText,
        sender_type: 'customer',
        sender_id: user?.id || 'customer',
        created_at: new Date().toISOString(),
        is_read: false
      };

      setMessages(prev => [...prev, tempMessage]);
      setInput("");

      // Send message to backend
      await apiService.sendChatMessage(requestId, messageText);
      
      // Reload messages to get the real message from backend
      await loadMessages();
      
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      
      // Remove temporary message if sending failed
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const isOwnMessage = (message: Message) => {
    return message.sender_type === 'customer';
  };

  const getSuggestionColor = (category: string) => {
    switch (category) {
      case 'immediate':
        return COLORS.darkGreen;
      case 'helpful':
        return COLORS.primary;
      case 'alternative':
        return COLORS.gray;
      default:
        return COLORS.lightGreen;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <CommonHeader />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CommonHeader />

      {/* Recycler Info Banner */}
      <View style={styles.bannerBg}>
        <ImageBackground
          source={require('../../assets/images/blend.jpg')}
          style={styles.bannerImage}
          imageStyle={{ borderRadius: 18, opacity: 0.28 }}
          resizeMode="cover"
        >
          <View style={styles.bannerPill}>
            <Text style={styles.bannerText}>Text with Recycler</Text>
          </View>
        </ImageBackground>
      </View>

      {/* Main Chat Area */}
      <View style={styles.chatContainer}>
        <View style={[styles.chatBackground, { backgroundColor: '#F8FFF0' }]}>
          <Image
            source={require('../../assets/images/bin.png')}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.4,
              resizeMode: "contain"
            }}
          />
          
          {/* Intelligent Message Suggestions */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ paddingHorizontal: 12, marginVertical: 8 }}
            contentContainerStyle={{ alignItems: 'center' }}
          >
            {intelligentSuggestions.map((suggestion, idx) => (
              <TouchableOpacity
                key={`${suggestion.text}-${idx}`}
                style={[
                  styles.suggestionButton,
                  { 
                    marginRight: idx === intelligentSuggestions.length - 1 ? 0 : 10,
                    backgroundColor: getSuggestionColor(suggestion.category)
                  }
                ]}
                onPress={() => sendMessage(suggestion.text)}
              >
                <Text style={styles.suggestionText}>{suggestion.text}</Text>
                <View style={styles.suggestionBadge}>
                  <Text style={styles.suggestionBadgeText}>
                    {suggestion.category.charAt(0).toUpperCase()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <View style={styles.recycleIconContainer}>
                <FontAwesome5 name="recycle" size={120} color={COLORS.lightGreen} style={{ opacity: 0.25 }} />
                <Text style={styles.noMessagesText}>No messages yet. Start the conversation!</Text>
              </View>
            ) : (
              messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    isOwnMessage(msg) ? styles.customerBubble : styles.recyclerBubble,
                    isOwnMessage(msg) ? styles.customerBubblePosition : styles.recyclerBubblePosition
                  ]}
                >
                  <Text style={isOwnMessage(msg) ? styles.customerText : styles.recyclerText}>
                    {msg.message}
                  </Text>
                  <Text style={styles.messageTime}>
                    {formatMessageTime(msg.created_at)}
                  </Text>
                  {!isOwnMessage(msg) && !msg.is_read && (
                    <View style={styles.unreadIndicator} />
                  )}
                </View>
              ))
            )}
          </ScrollView>
        </View>
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
          multiline
        />
        <TouchableOpacity 
          style={[styles.inputSendBtn, !input.trim() && styles.inputSendBtnDisabled]} 
          onPress={() => sendMessage()}
          disabled={!input.trim()}
        >
          <Feather name="send" size={22} color={input.trim() ? COLORS.darkGreen : COLORS.gray} />
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)') }>
          <Feather name="home" size={28} color={COLORS.darkGreen} />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/history') }>
          <Feather name="rotate-ccw" size={28} color={COLORS.darkGreen} />
          <Text style={styles.navLabel}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/user') }>
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
  inputSendBtnDisabled: {
    backgroundColor: COLORS.gray,
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
  chatBackground: {
    flex: 1,
    paddingTop: 8,
    paddingBottom: 90,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    color: COLORS.darkGreen,
    fontSize: 18,
    fontWeight: 'bold',
  },
  noMessagesText: {
    color: COLORS.darkGreen,
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  customerBubble: {
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
  customerBubblePosition: {
    alignSelf: 'flex-end',
    marginRight: 18,
  },
  customerText: {
    color: COLORS.white,
    fontSize: 15,
  },
  messageTime: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
    textAlign: 'right',
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.red,
    position: 'absolute',
    top: 0,
    right: 0,
  },
  suggestionBadge: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginTop: 5,
    alignSelf: 'center',
  },
  suggestionBadgeText: {
    color: COLORS.darkGreen,
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 