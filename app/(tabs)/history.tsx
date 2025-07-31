import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
import DrawerMenu from '../../components/DrawerMenu';
// import BottomNav from '../../components/BottomNav';

export default function HistoryScreen() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(1); // Mock notification count
  const user = { 
    name: 'Williams Boampong',
    type: 'user' as const,
    status: 'user'
  };
  const router = useRouter();

  const handleNotificationPress = () => {
    // Navigate to notifications screen or show notification panel
    router.push('/NotificationScreen');
    // Clear notification count when opened
    setNotificationCount(0);
  };

  return (
    <View style={styles.container}>
      <AppHeader 
        onMenuPress={() => setDrawerOpen(true)} 
        onNotificationPress={handleNotificationPress}
        notificationCount={notificationCount}
      />
      <DrawerMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} user={user} />
      <View style={styles.greenSectionWrapper}>
        <ImageBackground
          source={require('../../assets/images/blend.jpg')}
          style={styles.historySection}
          imageStyle={{ borderRadius: 20, opacity: 0.28 }}
          resizeMode="cover"
        >
          <View style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
            <View style={styles.historyLabelContainer}>
              <Text style={styles.historyLabel}>History</Text>
            </View>
          </View>
        </ImageBackground>
      </View>
      <View style={styles.trashImageWrapper}>
        <Image source={require('../../assets/images/history-trash.png')} style={styles.trashImage} />
      </View>
      <TouchableOpacity style={styles.pickupButton}>
        <Text style={styles.pickupButtonText}>Schedule a Pickup</Text>
      </TouchableOpacity>
      <Text style={styles.description}>
        You can schedule for a pickup and your waste will be pickup up every 3 days interval for a environment
      </Text>
      {/* BottomNav removed, default tab bar will show */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  greenSectionWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 28,
  },
  historySection: {
    width: '100%',
    height: 100,
    borderRadius: 20,
    backgroundColor: '#D0D4CC',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    alignSelf: 'center',
  },
  historyLabelContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 44,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    width: '70%',
  },
  historyLabel: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#263A13',
    fontFamily: 'Montserrat-Bold',
  },
  trashImageWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  trashImage: {
    width: 180,
    height: 160,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginTop: 0,
    marginBottom: 0,
  },
  pickupButton: {
    backgroundColor: '#4B830D',
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 18,
    width: '85%',
    alignSelf: 'center',
  },
  pickupButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  description: {
    color: '#444',
    fontSize: 15,
    textAlign: 'center',
    marginHorizontal: 32,
    marginBottom: 16,
    marginTop: 0,
    alignSelf: 'center',
  },
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.18)',
    zIndex: 99,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#C7CCC1',
    zIndex: 101,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 2,
    marginBottom: 2,
  },
  menuItemText: {
    color: '#22330B',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 18,
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    width: 230,
  },
}); 