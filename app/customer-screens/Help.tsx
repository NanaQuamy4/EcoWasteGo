import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, ImageBackground, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';



const FAQ_SUGGESTION_SETS = [
  [
    "How do I earn rewards?",
    "How do I reset my password?",
    "How do I contact support?",
    "How do I redeem points?",
    "How do I report an issue?",
  ],
  [
    "How do I change my profile picture?",
    "How do I delete my account?",
    "How do I invite friends?",
    "How do I check my points?",
    "How do I update my email?",
  ],
  [
    "How do I turn on notifications?",
    "How do I find recycling centers?",
    "How do I submit feedback?",
    "How do I view my history?",
    "How do I log out?",
  ],
];

export const config = {
  headerShown: false,
};

export default function HelpScreen() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! How can we help you today?", sender: "support", timestamp: new Date() },
  ]);
  const [faqSetIndex, setFaqSetIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Fetch user data
  const fetchUserData = useCallback(async () => {
    try {
      console.log('HelpScreen: Fetching user data...');
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('HelpScreen: Error fetching user:', error);
        return;
      }

      if (currentUser) {
        const userData = {
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.user_metadata?.full_name || 'User',
          role: currentUser.user_metadata?.role || 'customer'
        };
        console.log('HelpScreen: User data fetched:', userData);
        setUser(userData);
      } else {
        console.log('HelpScreen: No current user found');
      }
    } catch (error) {
      console.error('HelpScreen: Unexpected error:', error);
    }
  }, []);

  // Format message time
  const formatMessageTime = (messageId: number) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || !message.timestamp) return '';
    
    try {
      const date = new Date(message.timestamp);
      const now = new Date();
      const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      // If less than 24 hours, show relative time
      if (diffInHours < 24) {
        const diffInMinutes = Math.abs(now.getTime() - date.getTime()) / (1000 * 60);
        if (diffInMinutes < 1) {
          return 'Just now';
        } else if (diffInMinutes < 60) {
          return `${Math.floor(diffInMinutes)}m ago`;
        } else {
          return `${Math.floor(diffInHours)}h ago`;
        }
      }
      
      // If more than 24 hours, show date and time
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return '';
    }
  };

  const sendMessage = async (text?: string) => {
    const messageText = text !== undefined ? text : input;
    if (!messageText.trim()) return;

    const userMsg = { id: Date.now(), text: messageText, sender: "user", timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Check if user data is available
      if (!user?.id) {
        console.error('HelpScreen: User data not available:', user);
        Alert.alert('Error', 'User information not available. Please try logging in again.');
        return;
      }

      console.log('HelpScreen: Sending message with user data:', {
        user_id: user.id,
        user_email: user.email,
        user_name: user.name,
        user_role: user.role,
        message: messageText
      });

      // First, let's test if the table exists by trying to query it
      const { data: testData, error: testError } = await supabase
        .from('help_messages')
        .select('id')
        .limit(1);

      if (testError) {
        console.error('HelpScreen: Table test failed:', testError);
        Alert.alert('Error', `Database table not found: ${testError.message}. Please run the database setup script first.`);
        return;
      }

      console.log('HelpScreen: Table exists, proceeding with insert...');

      // Send message to admin
      const { error } = await supabase
        .from('help_messages')
        .insert({
          user_id: user.id,
          user_email: user.email || '',
          user_name: user.name || 'User',
          user_role: user.role || 'customer',
          message: messageText,
          status: 'pending',
          priority: 'medium'
        });

      if (error) {
        console.error('HelpScreen: Error sending message:', error);
        Alert.alert('Error', `Failed to send message: ${error.message}`);
        return;
      }

      console.log('HelpScreen: Message sent successfully to database');

      // Show confirmation message
      const confirmationMsg = { 
        id: Date.now() + 1, 
        text: "Your message has been sent to our support team. We'll get back to you soon!", 
        sender: "support",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, confirmationMsg]);

    } catch (error) {
      console.error('HelpScreen: Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Fetch existing help messages
  const fetchHelpMessages = useCallback(async () => {
    if (!user) return;
    
    try {
      console.log('HelpScreen: Fetching help messages for user:', user.id);
      const { data, error } = await supabase
        .from('help_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('HelpScreen: Error fetching help messages:', error);
        return;
      }

      console.log('HelpScreen: Fetched help messages:', data?.length || 0);

      // Start with welcome message
      const allMessages = [{ 
        id: 1, 
        text: "Hi! How can we help you today?", 
        sender: "support", 
        timestamp: new Date() 
      }];

      // Add existing messages from database
      if (data && data.length > 0) {
        data.forEach(msg => {
          // Add user message
          allMessages.push({
            id: msg.id,
            text: msg.message,
            sender: 'user',
            timestamp: new Date(msg.created_at)
          });

          // Add admin response if it exists
          if (msg.admin_response) {
            allMessages.push({
              id: `${msg.id}_response`,
              text: msg.admin_response,
              sender: 'support',
              timestamp: new Date(msg.admin_responded_at)
            });
          }
        });
      }

      console.log('HelpScreen: Setting messages:', allMessages.length);
      setMessages(allMessages);
    } catch (error) {
      console.error('HelpScreen: Error fetching help messages:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchHelpMessages();
    }
  }, [user, fetchHelpMessages]);

  // Set up real-time subscription for help messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('help_messages_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'help_messages',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New help message received:', payload);
          // Add new user message
          const newMessage = {
            id: payload.new.id,
            text: payload.new.message,
            sender: 'user',
            timestamp: new Date(payload.new.created_at)
          };
          setMessages(prev => {
            // Check if message already exists to avoid duplicates
            const exists = prev.some(msg => msg.id === payload.new.id);
            if (exists) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'help_messages',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Help message updated:', payload);
          // Check if admin responded
          if (payload.new.admin_response && !payload.old.admin_response) {
            const adminResponse = {
              id: `${payload.new.id}_response`,
              text: payload.new.admin_response,
              sender: 'support',
              timestamp: new Date(payload.new.admin_responded_at)
            };
            setMessages(prev => {
              // Check if response already exists to avoid duplicates
              const exists = prev.some(msg => msg.id === `${payload.new.id}_response`);
              if (exists) return prev;
              return [...prev, adminResponse];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Rotate FAQ suggestions every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setFaqSetIndex(prev => (prev + 1) % FAQ_SUGGESTION_SETS.length);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

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
            <Text style={styles.bannerText}>Help Desk</Text>
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
        {/* FAQ Suggestions - Now inside the chat area */}
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
                msg.sender === 'user'
                  ? [styles.userBubble, { alignSelf: 'flex-end', marginRight: 18 }]
                  : [styles.supportBubble, { alignSelf: 'flex-start', marginLeft: 18 }]
              }
            >
              <View style={styles.messageHeader}>
                <Text style={[styles.messageSender, msg.sender === 'user' && styles.userMessageSender]}>
                  {msg.sender === 'user' ? 'You' : 'Support'}
                </Text>
                <Text style={[styles.messageTime, msg.sender === 'user' && styles.userMessageTime]}>
                  {formatMessageTime(msg.id)}
                </Text>
              </View>
              <Text style={msg.sender === 'user' ? styles.userText : styles.supportText}>{msg.text}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="How may we help you?"
          placeholderTextColor="#263A13"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => sendMessage()}
          returnKeyType="send"
        />
        <TouchableOpacity 
          style={[styles.inputSendBtn, isLoading && styles.inputSendBtnDisabled]} 
          onPress={() => sendMessage()}
          disabled={isLoading}
        >
          <Feather name={isLoading ? "loader" : "send"} size={22} color="#263A13" />
        </TouchableOpacity>
      </View>
      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.back() }>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  menuBtn: {
    marginRight: 10,
    marginTop: 2,
  },
  logoLandscape: {
    height: 44,
    resizeMode: 'contain',
    flex: 1,
    marginLeft: 8,
  },
  headerCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 18,
    paddingBottom: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 18,
    paddingBottom: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#E3F0D5',
    position: 'relative',
  },
  helpBackBtn: {
    position: 'absolute',
    left: 0,
    top: 18,
    padding: 4,
    zIndex: 2,
  },
  helpHeaderText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#22330B',
    textAlign: 'center',
    flex: 1,
  },
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
  supportBubble: {
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
  supportText: {
    color: '#22330B',
    fontSize: 15,
    marginTop: 4,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageSender: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#22330B',
  },
  messageTime: {
    fontSize: 10,
    color: '#666666',
    fontWeight: '500',
  },
  userMessageSender: {
    color: '#fff',
  },
  userMessageTime: {
    color: '#B3D9FF',
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
    marginTop: 4,
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
  headerWithBack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 18,
    paddingBottom: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    left: 0,
    top: 18,
    padding: 4,
    zIndex: 2,
  },
  logoContainerCentered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLandscapeCentered: {
    height: 44,
    resizeMode: 'contain',
    width: 180,
  },
}); 