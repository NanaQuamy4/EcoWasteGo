import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const notifications = [
  { id: '1', title: 'Pickup Confirmed', message: 'Your waste pickup is scheduled for tomorrow at 10:00 AM.' },
  { id: '2', title: 'Points Earned', message: 'You earned 50 points for your last pickup!' },
  { id: '3', title: 'Challenge Unlocked', message: 'A new recycling challenge is available. Join now!' },
  { id: '4', title: 'Pickup Completed', message: 'Your waste was successfully picked up. Thank you!' },
];

export const config = {
  headerShown: false,
};

export default function CustomerNotificationScreen() {
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