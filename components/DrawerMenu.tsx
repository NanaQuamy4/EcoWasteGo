import { Feather, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Animated, Dimensions, Linking, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

// Menu items for recyclers
const RECYCLER_MENU_ITEMS = [
  { label: 'Education', icon: <MaterialIcons name="add-circle-outline" size={22} color="#22330B" />, key: 'education' },
  { label: 'History', icon: <Feather name="rotate-ccw" size={22} color="#22330B" />, key: 'history' },
  { label: 'Earnings', icon: <FontAwesome5 name="dollar-sign" size={22} color="#22330B" />, key: 'earnings' },
  { label: 'My Ratings', icon: <MaterialIcons name="star" size={22} color="#22330B" />, key: 'ratings' },
  { label: 'Subscription', icon: <MaterialIcons name="check-circle-outline" size={22} color="#22330B" />, key: 'subscription' },
  { label: 'Analytics', icon: <MaterialIcons name="show-chart" size={22} color="#22330B" />, key: 'analytics' },
  { label: 'Rewards', icon: <Feather name="gift" size={22} color="#22330B" />, key: 'rewards' },
  { label: 'Notification', icon: <Ionicons name="notifications-outline" size={22} color="#22330B" />, key: 'notification' },
  { label: 'Help', icon: <MaterialIcons name="computer" size={22} color="#22330B" />, key: 'help' },
  { label: 'Contact Us', icon: <MaterialIcons name="person-outline" size={22} color="#22330B" />, key: 'contact' },
  { label: 'About', icon: <MaterialIcons name="info-outline" size={22} color="#22330B" />, key: 'about' },
  { label: 'Privacy Policy', icon: <MaterialIcons name="security" size={22} color="#22330B" />, key: 'privacy' },
];

// Menu items for regular users
const USER_MENU_ITEMS = [
  { label: 'Education', icon: <MaterialIcons name="chat-bubble-outline" size={22} color="#22330B" />, key: 'education' },
  { label: 'History', icon: <Feather name="rotate-ccw" size={22} color="#22330B" />, key: 'history' },
  { label: 'Rewards', icon: <Feather name="gift" size={22} color="#22330B" />, key: 'rewards' },
  { label: 'Notification', icon: <Ionicons name="notifications-outline" size={22} color="#22330B" />, key: 'notification' },
  { label: 'Help', icon: <MaterialIcons name="computer" size={22} color="#22330B" />, key: 'help' },
  { label: 'Contact Us', icon: <MaterialIcons name="person-outline" size={22} color="#22330B" />, key: 'contact' },
  { label: 'About', icon: <MaterialIcons name="info-outline" size={22} color="#22330B" />, key: 'about' },
  { label: 'Privacy Policy', icon: <MaterialIcons name="security" size={22} color="#22330B" />, key: 'privacy' },
];

type DrawerMenuProps = {
  open: boolean;
  onClose: () => void;
  menuItems?: typeof RECYCLER_MENU_ITEMS;
};

export default function DrawerMenu({ open, onClose, menuItems }: DrawerMenuProps) {
  const [showContactCard, setShowContactCard] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const screenWidth = Dimensions.get('window').width;
  const drawerWidth = screenWidth * 0.78;
  const router = useRouter();

  // Function to fetch user data from Supabase
  const fetchUserData = useCallback(async () => {
    try {
      console.log('DrawerMenu: Fetching current user data...');
      setIsLoadingUser(true);

      // Get current authenticated user
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('DrawerMenu: Error fetching user:', error);
        setIsLoadingUser(false);
        return;
      }

      if (!currentUser) {
        console.log('DrawerMenu: No authenticated user found');
        setIsLoadingUser(false);
        return;
      }

      console.log('DrawerMenu: Current user found:', currentUser.id);
      console.log('DrawerMenu: User metadata:', currentUser.user_metadata);

      // Check if user is a recycler by querying the recyclers table
      const { data: recyclerData, error: recyclerError } = await supabase
        .from('recyclers')
        .select('id, company_name, verification_status')
        .eq('id', currentUser.id)
        .single();

      // Determine user role based on database check
      const isRecycler = !recyclerError && recyclerData;
      const userRole = isRecycler ? 'recycler' : 'customer';

      console.log('DrawerMenu: Recycler check result:', { isRecycler, recyclerError, recyclerData });

      // Create enhanced user object with metadata
      const enhancedUser = {
        id: currentUser.id,
        email: currentUser.email,
        created_at: currentUser.created_at,
        email_confirmed_at: currentUser.email_confirmed_at,
        // Get data from user metadata
        name: currentUser.user_metadata?.full_name || 'User',
        full_name: currentUser.user_metadata?.full_name || '',
        phone: currentUser.user_metadata?.phone || '',
        role: userRole, // Use database-determined role
        company_name: isRecycler ? recyclerData?.company_name || '' : currentUser.user_metadata?.company_name || '',
        verification_status: isRecycler ? recyclerData?.verification_status || 'incomplete' : currentUser.user_metadata?.verification_status || 'incomplete',
        profile_image: null,
      };

      console.log('DrawerMenu: Enhanced user object:', enhancedUser);
      setUser(enhancedUser);
      setIsLoadingUser(false);

    } catch (error) {
      console.error('DrawerMenu: Error in fetchUserData:', error);
      setIsLoadingUser(false);
    }
  }, []);

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Refresh user data when drawer opens
  useEffect(() => {
    if (open) {
      console.log('DrawerMenu: Drawer opened, refreshing user data...');
      fetchUserData();
    }
  }, [open]); // Remove fetchUserData dependency to prevent infinite loop

  // Determine user type and menu items
  const isRecycler = user?.role === 'recycler';
  const currentMenuItems = menuItems || (isRecycler ? RECYCLER_MENU_ITEMS : USER_MENU_ITEMS);
  const userTitle = isRecycler ? 'Recycler' : 'User';
  const userName = user?.name || (isRecycler ? 'GreenFleet GH' : 'User');

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
          <TouchableOpacity onPress={() => { 
            onClose(); 
            // Navigate to correct user profile based on user type
            if (isRecycler) {
              router.push('/(recycler-tabs)/user');
            } else {
              router.push('/(tabs)/user');
            }
          }}>
            <Text style={{ color: '#22330B', fontWeight: 'bold', fontSize: 19 }}>{userName}</Text>
            <Text style={{ color: '#22330B', fontSize: 13, marginTop: 0 }}>{userTitle}</Text>
            {user?.email && (
              <Text style={{ color: '#22330B', fontSize: 11, marginTop: 2, opacity: 0.7 }}>{user.email}</Text>
            )}
          </TouchableOpacity>
        </View>
        {currentMenuItems.map(item => (
          <TouchableOpacity
            key={item.key}
            style={styles.menuItem}
            onPress={() => {
              if (item.key === 'contact') {
                setShowContactCard(!showContactCard);
              } else if (item.key === 'about') {
                setShowContactCard(false);
                onClose();
                router.push('/customer-screens/AboutScreen');
              } else if (item.key === 'education') {
                setShowContactCard(false);
                onClose();
                router.push('/customer-screens/EducationScreen');
              } else if (item.key === 'history') {
                setShowContactCard(false);
                onClose();
                // Navigate to user history for users, recycler history for recyclers
                if (isRecycler) {
                  router.push('/(recycler-tabs)/history');
                } else {
                  router.push('/(tabs)/history');
                }
              } else if (item.key === 'earnings' && isRecycler) {
                setShowContactCard(false);
                onClose();
                router.push('/recycler-screens/EarningsScreen');
              } else if (item.key === 'subscription' && isRecycler) {
                setShowContactCard(false);
                onClose();
                router.push('/recycler-screens/SubscriptionScreen');
              } else if (item.key === 'analytics' && isRecycler) {
                setShowContactCard(false);
                onClose();
                router.push('/recycler-screens/AnalyticsScreen');
              } else if (item.key === 'rewards') {
                setShowContactCard(false);
                onClose();
                if (isRecycler) {
                  console.log('DrawerMenu: Navigating to RecyclerRewardsScreen');
                  try {
                    router.push('/recycler-screens/RecyclerRewardsScreen' as any);
                  } catch (error) {
                    console.error('DrawerMenu: Navigation error:', error);
                    Alert.alert('Navigation Error', 'Could not navigate to rewards screen');
                  }
                } else {
                  console.log('DrawerMenu: Navigating to customer Rewards');
                  try {
                    router.push('/customer-screens/Rewards' as any);
                  } catch (error) {
                    console.error('DrawerMenu: Navigation error:', error);
                    Alert.alert('Navigation Error', 'Could not navigate to rewards screen');
                  }
                }
              } else if (item.key === 'ratings') {
                setShowContactCard(false);
                onClose();
                if (isRecycler) {
                  console.log('DrawerMenu: Navigating to RecyclerRatingScreen');
                  try {
                    router.push('/recycler-screens/RecyclerRatingScreen' as any);
                  } catch (error) {
                    console.error('DrawerMenu: Navigation error:', error);
                    Alert.alert('Navigation Error', 'Could not navigate to ratings screen');
                  }
                }
              } else if (item.key === 'notification') {
                setShowContactCard(false);
                onClose();
                if (isRecycler) {
                  router.push('/recycler-screens/RecyclerNotificationScreen');
                } else {
                  router.push('/customer-screens/CustomerNotificationScreen');
                }
              } else if (item.key === 'help') {
                setShowContactCard(false);
                onClose();
                router.push('/customer-screens/Help');
              } else if (item.key === 'privacy') {
                setShowContactCard(false);
                onClose();
                if (isRecycler) {
                  router.push('/recycler-screens/RecyclerPrivacyScreen');
                } else {
                  router.push('/customer-screens/CustomerPrivacyScreen');
                }
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