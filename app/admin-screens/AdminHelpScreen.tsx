import { Feather, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

interface HelpMessage {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  user_role: 'customer' | 'recycler';
  subject?: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  admin_response?: string;
  admin_responded_by?: string;
  admin_responded_at?: string;
  created_at: string;
  updated_at: string;
}

export default function AdminHelpScreen() {
  const router = useRouter();
  const [helpMessages, setHelpMessages] = useState<HelpMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<HelpMessage | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isResponding, setIsResponding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Fetch help messages from database
  const fetchHelpMessages = useCallback(async () => {
    try {
      console.log('AdminHelpScreen: Fetching help messages...');
      const { data, error } = await supabase.rpc('get_help_messages_for_admin');
      
      if (error) {
        console.error('AdminHelpScreen: Error fetching help messages:', error);
        Alert.alert('Error', 'Failed to fetch help messages. Please try again.');
        return;
      }

      console.log('AdminHelpScreen: Help messages fetched:', data?.length || 0);
      setHelpMessages(data || []);
    } catch (error) {
      console.error('AdminHelpScreen: Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Respond to a help message
  const respondToMessage = async () => {
    if (!selectedMessage || !responseText.trim()) {
      Alert.alert('Error', 'Please enter a response message.');
      return;
    }

    setIsResponding(true);
    try {
      console.log('AdminHelpScreen: Responding to message:', selectedMessage.id);
      const { data, error } = await supabase.rpc('respond_to_help_message', {
        message_id: selectedMessage.id,
        response_text: responseText.trim()
      });

      if (error) {
        console.error('AdminHelpScreen: Error responding to message:', error);
        Alert.alert('Error', 'Failed to send response. Please try again.');
        return;
      }

      Alert.alert('Success', 'Response sent successfully!');
      setResponseText('');
      setSelectedMessage(null);
      fetchHelpMessages(); // Refresh the list
    } catch (error) {
      console.error('AdminHelpScreen: Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsResponding(false);
    }
  };

  // Update message status
  const updateMessageStatus = async (messageId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('help_messages')
        .update({ status })
        .eq('id', messageId);

      if (error) {
        console.error('AdminHelpScreen: Error updating status:', error);
        Alert.alert('Error', 'Failed to update status. Please try again.');
        return;
      }

      fetchHelpMessages(); // Refresh the list
    } catch (error) {
      console.error('AdminHelpScreen: Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#FF4444';
      case 'high': return '#FF8800';
      case 'medium': return '#FFBB33';
      case 'low': return '#99CC00';
      default: return '#666666';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF8800';
      case 'in_progress': return '#2196F3';
      case 'resolved': return '#4CAF50';
      case 'closed': return '#666666';
      default: return '#666666';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchHelpMessages();
  }, [fetchHelpMessages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollViewRef.current && selectedMessage) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [selectedMessage]);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, color: '#22330B', fontWeight: 'bold' }}>Loading help messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={28} color="#263A13" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Image
            source={require('../../assets/images/logo landscape.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <TouchableOpacity onPress={fetchHelpMessages} style={styles.refreshButton}>
          <Feather name="refresh-cw" size={24} color="#263A13" />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{helpMessages.length}</Text>
          <Text style={styles.statLabel}>Total Messages</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{helpMessages.filter(m => m.status === 'pending').length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{helpMessages.filter(m => m.priority === 'urgent').length}</Text>
          <Text style={styles.statLabel}>Urgent</Text>
        </View>
      </View>

      <View style={styles.container}>
        {!selectedMessage ? (
          // Message List View
          <ScrollView
            style={styles.messageList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={fetchHelpMessages} />
            }
          >
            {helpMessages.length === 0 ? (
              <View style={styles.emptyState}>
                <FontAwesome5 name="inbox" size={80} color="#B6CDBD" style={{ opacity: 0.5 }} />
                <Text style={styles.emptyStateText}>No help messages yet</Text>
                <Text style={styles.emptyStateSubtext}>Messages from users will appear here</Text>
              </View>
            ) : (
              helpMessages.map((message) => (
                <TouchableOpacity
                  key={message.id}
                  style={[
                    styles.messageCard,
                    { borderLeftColor: getPriorityColor(message.priority) }
                  ]}
                  onPress={() => setSelectedMessage(message)}
                >
                  <View style={styles.messageHeader}>
                    <View style={styles.messageInfo}>
                      <Text style={styles.userName}>{message.user_name}</Text>
                      <Text style={styles.userEmail}>{message.user_email}</Text>
                      <Text style={styles.userRole}>
                        {message.user_role === 'recycler' ? '🚛 Recycler' : '🏠 Customer'}
                      </Text>
                    </View>
                    <View style={styles.messageMeta}>
                      <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(message.priority) }]}>
                        <Text style={styles.priorityText}>{message.priority.toUpperCase()}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(message.status) }]}>
                        <Text style={styles.statusText}>{message.status.toUpperCase()}</Text>
                      </View>
                    </View>
                  </View>
                  
                  {message.subject && (
                    <Text style={styles.messageSubject}>{message.subject}</Text>
                  )}
                  
                  <Text style={styles.messagePreview} numberOfLines={2}>
                    {message.message}
                  </Text>
                  
                  <Text style={styles.messageDate}>{formatDate(message.created_at)}</Text>
                  
                  {message.admin_response && (
                    <View style={styles.responseIndicator}>
                      <MaterialIcons name="reply" size={16} color="#4CAF50" />
                      <Text style={styles.responseText}>Responded</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        ) : (
          // Message Detail View
          <View style={styles.messageDetail}>
            {/* Message Header */}
            <View style={styles.detailHeader}>
              <TouchableOpacity onPress={() => setSelectedMessage(null)} style={styles.backToListButton}>
                <Feather name="arrow-left" size={20} color="#263A13" />
                <Text style={styles.backToListText}>Back to Messages</Text>
              </TouchableOpacity>
              
              <View style={styles.detailMeta}>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(selectedMessage.priority) }]}>
                  <Text style={styles.priorityText}>{selectedMessage.priority.toUpperCase()}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedMessage.status) }]}>
                  <Text style={styles.statusText}>{selectedMessage.status.toUpperCase()}</Text>
                </View>
              </View>
            </View>

            {/* User Info */}
            <View style={styles.userInfoCard}>
              <View style={styles.userAvatar}>
                <Feather name="user" size={24} color="#263A13" />
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.detailUserName}>{selectedMessage.user_name}</Text>
                <Text style={styles.detailUserEmail}>{selectedMessage.user_email}</Text>
                <Text style={styles.detailUserRole}>
                  {selectedMessage.user_role === 'recycler' ? '🚛 Recycler' : '🏠 Customer'}
                </Text>
              </View>
            </View>

            {/* Message Content */}
            <ScrollView style={styles.messageContent} ref={scrollViewRef}>
              <View style={styles.messageBubble}>
                <Text style={styles.messageText}>{selectedMessage.message}</Text>
                <Text style={styles.messageTime}>{formatDate(selectedMessage.created_at)}</Text>
              </View>

              {/* Admin Response */}
              {selectedMessage.admin_response && (
                <View style={styles.adminResponseBubble}>
                  <Text style={styles.adminResponseText}>{selectedMessage.admin_response}</Text>
                  <Text style={styles.adminResponseTime}>
                    Admin response - {formatDate(selectedMessage.admin_responded_at || '')}
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Response Input */}
            {!selectedMessage.admin_response && (
              <View style={styles.responseInput}>
                <TextInput
                  style={styles.responseTextInput}
                  placeholder="Type your response..."
                  placeholderTextColor="#666666"
                  value={responseText}
                  onChangeText={setResponseText}
                  multiline
                  maxLength={1000}
                />
                <TouchableOpacity
                  style={[styles.sendButton, isResponding && styles.sendButtonDisabled]}
                  onPress={respondToMessage}
                  disabled={isResponding}
                >
                  <Feather name="send" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {selectedMessage.status === 'pending' && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => updateMessageStatus(selectedMessage.id, 'in_progress')}
                >
                  <MaterialIcons name="play-arrow" size={20} color="#2196F3" />
                  <Text style={styles.actionButtonText}>Mark In Progress</Text>
                </TouchableOpacity>
              )}
              
              {selectedMessage.status === 'in_progress' && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => updateMessageStatus(selectedMessage.id, 'pending')}
                >
                  <MaterialIcons name="pause" size={20} color="#FF8800" />
                  <Text style={styles.actionButtonText}>Mark Pending</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => updateMessageStatus(selectedMessage.id, 'closed')}
              >
                <MaterialIcons name="close" size={20} color="#666666" />
                <Text style={styles.actionButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 40,
  },
  refreshButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#F8F9FA',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 5,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22330B',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 5,
  },
  container: {
    flex: 1,
  },
  messageList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22330B',
    marginTop: 20,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666666',
    marginTop: 5,
    textAlign: 'center',
  },
  messageCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  messageInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22330B',
  },
  userEmail: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#22330B',
    marginTop: 2,
  },
  messageMeta: {
    alignItems: 'flex-end',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 5,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  messageSubject: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#22330B',
    marginBottom: 5,
  },
  messagePreview: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 10,
  },
  messageDate: {
    fontSize: 12,
    color: '#999999',
  },
  responseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  responseText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  messageDetail: {
    flex: 1,
    paddingHorizontal: 20,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backToListButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backToListText: {
    fontSize: 16,
    color: '#263A13',
    marginLeft: 8,
  },
  detailMeta: {
    flexDirection: 'row',
    gap: 10,
  },
  userInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 10,
    marginVertical: 15,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F0D5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userDetails: {
    flex: 1,
  },
  detailUserName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22330B',
  },
  detailUserEmail: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  detailUserRole: {
    fontSize: 14,
    color: '#22330B',
    marginTop: 2,
  },
  messageContent: {
    flex: 1,
    paddingVertical: 15,
  },
  messageBubble: {
    backgroundColor: '#E3F0D5',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  messageText: {
    fontSize: 16,
    color: '#22330B',
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 12,
    color: '#666666',
    marginTop: 8,
  },
  adminResponseBubble: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  adminResponseText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
  },
  adminResponseTime: {
    fontSize: 12,
    color: '#B3D9FF',
    marginTop: 8,
  },
  responseInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  responseTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 16,
    color: '#22330B',
  },
  sendButton: {
    backgroundColor: '#22330B',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#999999',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#22330B',
    marginLeft: 5,
  },
});
