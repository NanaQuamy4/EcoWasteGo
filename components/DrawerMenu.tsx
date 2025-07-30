import { Feather, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Animated, Dimensions, Linking, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DEFAULT_MENU_ITEMS = [
  { label: 'Education', icon: <MaterialIcons name="chat-bubble-outline" size={22} color="#22330B" />, key: 'education' },
  { label: 'History', icon: <Feather name="rotate-ccw" size={22} color="#22330B" />, key: 'history' },
  { label: 'Earnings', icon: <FontAwesome5 name="dollar-sign" size={22} color="#22330B" />, key: 'earnings' },
  { label: 'Subscription', icon: <MaterialIcons name="check-circle-outline" size={22} color="#22330B" />, key: 'subscription' },
  { label: 'Analytics', icon: <MaterialIcons name="show-chart" size={22} color="#22330B" />, key: 'analytics' },
  { label: 'Rewards', icon: <Feather name="gift" size={22} color="#22330B" />, key: 'rewards' },
  { label: 'Notification', icon: <Ionicons name="notifications-outline" size={22} color="#22330B" />, key: 'notification' },
  { label: 'Help', icon: <MaterialIcons name="computer" size={22} color="#22330B" />, key: 'help' },
  { label: 'Contact Us', icon: <MaterialIcons name="person-outline" size={22} color="#22330B" />, key: 'contact' },
  { label: 'About', icon: <MaterialIcons name="info-outline" size={22} color="#22330B" />, key: 'about' },
];

type DrawerMenuProps = {
  open: boolean;
  onClose: () => void;
  user: { name: string; email?: string; phone?: string; status?: string };
  menuItems?: typeof DEFAULT_MENU_ITEMS;
};

export default function DrawerMenu({ open, onClose, user, menuItems = DEFAULT_MENU_ITEMS }: DrawerMenuProps) {
  const [showContactCard, setShowContactCard] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const drawerWidth = screenWidth * 0.78;
  const router = useRouter();

  // Drawer overlay
  const DrawerOverlay = open ? (
    <Pressable style={styles.drawerOverlay} onPress={() => { onClose(); setShowContactCard(false); }} />
  ) : null;

  // Drawer content
  const Drawer = (
    <Animated.View style={[styles.drawer, { width: drawerWidth, left: open ? 0 : -drawerWidth }] }>
      <View style={{ paddingHorizontal: 24, paddingTop: 36, paddingBottom: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
          <View style={{ backgroundColor: '#22330B', borderRadius: 24, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Feather name="user" size={28} color="#fff" />
          </View>
          <TouchableOpacity onPress={() => { onClose(); router.push('/user'); }}>
            <Text style={{ color: '#22330B', fontWeight: 'bold', fontSize: 19 }}>GreenFleet GH</Text>
            <Text style={{ color: '#22330B', fontSize: 13, marginTop: 0 }}>Recycler</Text>
          </TouchableOpacity>
        </View>
        {menuItems.map(item => (
          <TouchableOpacity
            key={item.key}
            style={styles.menuItem}
            onPress={() => {
              if (item.key === 'contact') {
                setShowContactCard(!showContactCard);
              } else if (item.key === 'about') {
                setShowContactCard(false);
                onClose();
                router.push('/AboutScreen');
              } else if (item.key === 'education') {
                setShowContactCard(false);
                onClose();
                router.push('/EducationScreen');
              } else if (item.key === 'history') {
                setShowContactCard(false);
                onClose();
                router.push('/history');
              } else if (item.key === 'earnings') {
                setShowContactCard(false);
                onClose();
                router.push('/(recycler-tabs)/history');
              } else if (item.key === 'subscription') {
                setShowContactCard(false);
                onClose();
                router.push('/SubscriptionScreen');
              } else if (item.key === 'analytics') {
                setShowContactCard(false);
                onClose();
                router.push('/AnalyticsScreen');
              } else if (item.key === 'rewards') {
                setShowContactCard(false);
                onClose();
                router.push('/Rewards');
              } else if (item.key === 'notification') {
                setShowContactCard(false);
                onClose();
                router.push('/NotificationScreen');
              } else if (item.key === 'help') {
                setShowContactCard(false);
                onClose();
                router.push('/Help');
              } else {
                setShowContactCard(false);
                onClose();
                // Optionally: handle navigation or callback here
              }
            }}
          >
            {item.icon}
            <Text style={styles.menuItemText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
        {showContactCard && (
          <View style={styles.contactCard}>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }} onPress={() => Linking.openURL('mailto:ecowastego@gmail.com')}>
              <MaterialIcons name="email" size={20} color="#22330B" style={{ marginRight: 8 }} />
              <Text style={{ fontWeight: 'bold', color: '#222', fontSize: 15 }}>ecowastego@gmail.com</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="phone" size={18} color="#22330B" style={{ marginRight: 8 }} />
              <Text style={{ color: '#222', fontSize: 15 }}>+233 54 673 2719</Text>
            </View>
          </View>
        )}
      </View>
    </Animated.View>
  );

  return (
    <>
      {DrawerOverlay}
      {Drawer}
    </>
  );
}

const styles = StyleSheet.create({
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