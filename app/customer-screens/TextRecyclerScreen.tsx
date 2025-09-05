import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, ImageBackground, Linking, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

// ===== REAL-TIME MESSAGING SYSTEM =====
// This implements real-time messaging between customers and recyclers

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

  // ===== STATE MANAGEMENT =====
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [faqSetIndex, setFaqSetIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [recyclerData, setRecyclerData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // ===== INITIALIZATION EFFECT =====
  useEffect(() => {
    initializeChat();
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

  // Real-time message subscription
  useEffect(() => {
    if (!params.requestId || !user?.id) return;

    console.log('TextRecyclerScreen: Setting up real-time subscription for request:', params.requestId);

    const channel = supabase
      .channel(`customer-messages-${params.requestId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `request_id=eq.${params.requestId}`
        }, 
        (payload) => {
          console.log('TextRecyclerScreen: New message received:', payload);
          
          const newMessage = payload.new;
          
          // Only process messages from the recycler (not from current user)
          if (newMessage.sender_id === user.id) {
            console.log('TextRecyclerScreen: Ignoring own message');
            return;
          }

          const formattedMessage = {
            id: newMessage.id,
            text: newMessage.message,
            sender: newMessage.sender_type === 'customer' ? 'customer' : 'recycler',
            timestamp: new Date(newMessage.created_at),
            formattedTime: new Date(newMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isRead: newMessage.is_read,
            senderName: 'Recycler' // Real-time messages from recycler
          };

          setMessages(prev => {
            // Check if message already exists to avoid duplicates
            const exists = prev.some(msg => msg.id === newMessage.id);
            if (exists) {
              console.log('TextRecyclerScreen: Message already exists, skipping');
              return prev;
            }
            console.log('TextRecyclerScreen: Adding new message to UI');
            return [...prev, formattedMessage];
          });
          
          // Mark as read
          supabase.rpc('mark_messages_read', {
            p_request_id: params.requestId,
            p_user_id: user.id,
            p_user_type: 'customer'
          }).then(({ error }) => {
            if (error) {
              console.error('TextRecyclerScreen: Error marking message as read:', error);
            }
          });
        }
      )
      .subscribe((status) => {
        console.log('TextRecyclerScreen: Subscription status:', status);
      });

    return () => {
      console.log('TextRecyclerScreen: Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [params.requestId, user?.id]);

  // ===== REAL-TIME MESSAGING FUNCTIONS =====
  const fetchUserData = useCallback(async () => {
    try {
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('TextRecyclerScreen: Error fetching user:', error);
        return null;
      }

      if (currentUser) {
        const userData = {
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.user_metadata?.full_name || 'User',
          role: currentUser.user_metadata?.role || 'customer'
        };
        console.log('TextRecyclerScreen: User data fetched:', userData);
        return userData;
      }
      return null;
    } catch (error) {
      console.error('TextRecyclerScreen: Unexpected error:', error);
      return null;
    }
  }, []);

  const loadRecyclerData = useCallback(async () => {
    if (!params.requestId) return null;
    
    try {
      const { data: requestData, error } = await supabase
        .from('pickup_requests')
        .select(`
          id,
          recyclers!inner(
            id,
            full_name,
            phone,
            rating,
            verification_status
          )
        `)
        .eq('id', params.requestId)
        .single();

      if (error) {
        console.error('TextRecyclerScreen: Error loading recycler data:', error);
        return null;
      }

      const recycler = (requestData.recyclers as any);
      return {
        id: recycler.id,
        name: recycler.full_name,
        phone: recycler.phone,
        rating: recycler.rating,
        verification_status: recycler.verification_status
      };
    } catch (error) {
      console.error('TextRecyclerScreen: Error loading recycler data:', error);
      return null;
    }
  }, [params.requestId]);

  const loadMessages = useCallback(async () => {
    if (!user?.id || !params.requestId) return;
    
    try {
      console.log('TextRecyclerScreen: Loading messages for request:', params.requestId, 'user:', user.id);
      
      const { data, error } = await supabase.rpc('get_messages_for_request', {
        p_request_id: params.requestId,
        p_user_id: user.id,
        p_user_type: 'customer'
      });

      if (error) {
        console.error('TextRecyclerScreen: Error loading messages:', error);
        return;
      }

      console.log('TextRecyclerScreen: Raw messages from database:', data);

      const formattedMessages = data?.map((msg: any) => ({
        id: msg.id,
        text: msg.message,
        sender: msg.sender_type === 'customer' ? 'customer' : 'recycler',
        timestamp: new Date(msg.created_at),
        formattedTime: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: msg.is_read,
        senderName: msg.sender_name
      })) || [];

      console.log('TextRecyclerScreen: Formatted messages:', formattedMessages);
      setMessages(formattedMessages);
    } catch (error) {
      console.error('TextRecyclerScreen: Error loading messages:', error);
    }
  }, [user?.id, params.requestId]);

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      
      // Fetch user data
      const userData = await fetchUserData();
      if (!userData) {
        Alert.alert('Error', 'Please log in to use messaging');
        router.back();
        return;
      }
      setUser(userData);

      // Load recycler data
      const recyclerData = await loadRecyclerData();
      if (!recyclerData) {
        Alert.alert('Error', 'Unable to load recycler information');
        router.back();
        return;
      }
      setRecyclerData(recyclerData);

      // Load messages
      await loadMessages();

      // Mark messages as read
      if (userData.id && params.requestId) {
        await supabase.rpc('mark_messages_read', {
          p_request_id: params.requestId,
          p_user_id: userData.id,
          p_user_type: 'customer'
        });
      }

      console.log('TextRecyclerScreen: Chat initialized successfully');
    } catch (error) {
      console.error('TextRecyclerScreen: Error initializing chat:', error);
      Alert.alert('Error', 'Failed to initialize chat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ===== MESSAGE HANDLING =====
  const sendMessage = async (text?: string) => {
    const messageText = text !== undefined ? text : input;
    if (!messageText.trim() || !user?.id || !params.requestId || isSending) return;
    
    setIsSending(true);
    
    // Add message to UI immediately
    const tempMessage = { 
      id: `temp_${Date.now()}`, 
      text: messageText, 
      sender: "customer",
      timestamp: new Date(),
      formattedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
      senderName: user?.user_metadata?.full_name || 'You'
    };
    setMessages(prev => [...prev, tempMessage]);
    setInput("");
    
    try {
      // Send message to database
      const { data: messageId, error } = await supabase.rpc('send_message', {
        p_request_id: params.requestId,
        p_sender_id: user.id,
        p_sender_type: 'customer',
        p_message: messageText
      });

      if (error) {
        console.error('TextRecyclerScreen: Error sending message:', error);
        Alert.alert('Error', 'Failed to send message. Please try again.');
        // Remove the temporary message
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        return;
      }

      // Update the temporary message with real ID
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id 
          ? { ...msg, id: messageId }
          : msg
      ));

      console.log('TextRecyclerScreen: Message sent successfully:', messageId);
    } catch (error) {
      console.error('TextRecyclerScreen: Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      // Remove the temporary message
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    } finally {
      setIsSending(false);
    }
  };

  // ===== ACTION HANDLERS =====
  const handleCallRecycler = () => {
    if (recyclerData?.phone) {
      const phoneNumber = recyclerData.phone.startsWith('+') 
        ? recyclerData.phone 
        : `+${recyclerData.phone}`;
      
      Alert.alert(
        'Call Recycler',
        `Call ${recyclerData.name} at ${phoneNumber}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Call', 
            onPress: () => {
              console.log('Calling recycler:', phoneNumber);
              Linking.openURL(`tel:${phoneNumber}`).catch(err => {
                console.error('Error opening phone dialer:', err);
                Alert.alert('Error', 'Unable to open phone dialer. Please try calling manually.');
              });
            }
          }
        ]
      );
    } else {
      Alert.alert('No Contact', 'Recycler contact number not available');
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

  if (!recyclerData || !user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: '#22330B', fontSize: 18, textAlign: 'center', marginBottom: 20 }}>
            Failed to load chat information
          </Text>
          <TouchableOpacity 
            style={{ backgroundColor: '#E3F0D5', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 }}
            onPress={initializeChat}
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
              <Text style={[styles.messageTime, { 
                color: msg.sender === 'customer' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(34, 51, 11, 0.6)',
                textAlign: msg.sender === 'customer' ? 'right' : 'left'
              }]}>
                {msg.formattedTime || new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
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
          editable={!isSending}
        />
        <TouchableOpacity 
          style={[styles.inputSendBtn, isSending && styles.inputSendBtnDisabled]} 
          onPress={() => sendMessage()}
          disabled={isSending}
        >
          <Feather 
            name={isSending ? "clock" : "send"} 
            size={22} 
            color={isSending ? "#999" : "#263A13"} 
          />
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
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '400',
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
  inputSendBtnDisabled: {
    backgroundColor: '#F0F0F0',
    opacity: 0.6,
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