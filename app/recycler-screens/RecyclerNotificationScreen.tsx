import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const notifications = [
  { id: '1', title: 'New Pickup Request', message: 'You have a new pickup request from Customer #1234.' },
  { id: '2', title: 'Payment Received', message: 'Payment of GHS 45.00 received for pickup #5678.' },
  { id: '3', title: 'Route Updated', message: 'Your pickup route has been optimized for today.' },
  { id: '4', title: 'Pickup Completed', message: 'Pickup #5678 completed successfully. Customer rated 5 stars!' },
];

export const config = {
  headerShown: false,
};

export default function RecyclerNotificationScreen() {
  const router = useRouter();

  const renderItem = ({ item }: { item: typeof notifications[0] }) => (
    <View style={styles.notificationCard}>
      <Ionicons name="notifications" size={28} color="#22330B" style={{ marginRight: 16 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#22330B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAF2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 18,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E3F0D5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#22330B',
  },
  listContent: {
    padding: 20,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22330B',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#444',
  },
  separator: {
    height: 10,
  },
}); 