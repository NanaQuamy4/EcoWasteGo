import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { isAdminUser } from '../../lib/adminConfig';
import { supabase } from '../../lib/supabase';

interface NotificationCounts {
  helpMessages: number;
  verifications: number;
  total: number;
  totalUsers: number;
  onlineRecyclers: number;
}

export default function AdminPortal() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notificationCounts, setNotificationCounts] = useState<NotificationCounts>({
    helpMessages: 0,
    verifications: 0,
    total: 0,
    totalUsers: 0,
    onlineRecyclers: 0
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchNotificationCounts();
      }
    }, [user])
  );

  const checkAdminAccess = async () => {
    try {
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();
      
      if (error || !currentUser) {
        Alert.alert('Access Denied', 'You must be logged in to access the admin portal.');
        router.replace('/LoginScreen');
        return;
      }

      if (!isAdminUser(currentUser.email)) {
        Alert.alert('Access Denied', 'You do not have permission to access the admin portal.');
        router.replace('/LoginScreen');
        return;
      }

      setUser(currentUser);
    } catch (error) {
      console.error('Admin access check error:', error);
      Alert.alert('Error', 'Failed to verify admin access.');
      router.replace('/LoginScreen');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationCounts = async () => {
    if (!user) return;

    try {
      // Get unread notification count
      const { data: unreadCount, error: countError } = await supabase
        .rpc('get_admin_unread_count', { p_admin_id: user.id });

      if (countError) {
        console.error('Error fetching notification count:', countError);
        return;
      }

      // Get specific counts for help messages and verifications
      const { data: notifications, error: notificationsError } = await supabase
        .rpc('get_admin_notifications', { p_admin_id: user.id });

      if (notificationsError) {
        console.error('Error fetching notifications:', notificationsError);
        return;
      }

      // Count actual help messages that need responses (from help_messages table)
      const { data: helpMessagesData, error: helpMessagesError } = await supabase
        .from('help_messages')
        .select('id, status')
        .in('status', ['pending', 'in_progress']);

      if (helpMessagesError) {
        console.error('Error fetching help messages count:', helpMessagesError);
        return;
      }

      const helpMessages = helpMessagesData?.length || 0;
      const verifications = notifications?.filter((n: any) => n.type === 'verification_request' && !n.is_read).length || 0;

      // Get total users count (both customers and recyclers, excluding admin users)
      const [recyclersResult, customersResult] = await Promise.all([
        supabase.from('recyclers').select('id, email'),
        supabase.from('customers').select('id, email')
      ]);
      
      // Filter out admin users from both tables
      const nonAdminRecyclers = recyclersResult.data?.filter(r => !isAdminUser(r.email)) || [];
      const nonAdminCustomers = customersResult.data?.filter(c => !isAdminUser(c.email)) || [];
      
      // Remove duplicates (in case user exists in both tables)
      const allEmails = new Set();
      const uniqueUsers = [];
      
      // Add all recyclers first
      nonAdminRecyclers.forEach(recycler => {
        if (!allEmails.has(recycler.email)) {
          allEmails.add(recycler.email);
          uniqueUsers.push(recycler);
        }
      });
      
      // Add customers only if they don't already exist
      nonAdminCustomers.forEach(customer => {
        if (!allEmails.has(customer.email)) {
          allEmails.add(customer.email);
          uniqueUsers.push(customer);
        }
      });
      
      const totalUsersCount = uniqueUsers.length;

      // Get online recyclers count using our admin function
      const { data: onlineSummary } = await supabase
        .rpc('admin_get_online_recyclers_summary');

      setNotificationCounts({
        helpMessages,
        verifications,
        total: unreadCount || 0,
        totalUsers: totalUsersCount || 0,
        onlineRecyclers: onlineSummary?.[0]?.online_recyclers || 0
      });
    } catch (error) {
      console.error('Error fetching notification counts:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout from the admin portal?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes, Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.auth.signOut();
              if (error) {
                Alert.alert('Error', 'Failed to logout. Please try again.');
              } else {
                router.replace('/LoginScreen');
              }
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const navigateToSection = (section: string) => {
    switch (section) {
      case 'verifications':
        router.push('/admin-screens/AdminVerificationsScreen');
        break;
      case 'users':
        router.push('/admin-screens/AdminUsersScreen');
        break;
      case 'analytics':
        router.push('/admin-screens/AdminAnalyticsScreen');
        break;
      case 'subscriptions':
        router.push('/admin-screens/AdminSubscriptionScreen');
        break;
      case 'help':
        router.push('/admin-screens/AdminHelpScreen');
        break;
      case 'notifications':
        router.push('/admin-screens/AdminNotificationsScreen');
        break;
      case 'online-recyclers':
        router.push('/admin-screens/OnlineRecyclersScreen');
        break;
      default:
        Alert.alert('Coming Soon', 'This section is under development.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <MaterialIcons name="admin-panel-settings" size={64} color="#207E06" />
          <Text style={styles.loadingText}>Loading Admin Portal...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <MaterialIcons name="admin-panel-settings" size={40} color="#FFFFFF" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Admin Portal</Text>
            <Text style={styles.headerSubtitle}>EcoWasteGo Management</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          {notificationCounts.total > 0 && (
            <View style={styles.headerNotificationBadge}>
              <Text style={styles.headerNotificationText}>{notificationCounts.total}</Text>
            </View>
          )}
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <MaterialIcons name="logout" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeText}>Welcome back, Admin! 👋</Text>
          <Text style={styles.subtitleText}>Manage your EcoWasteGo platform efficiently</Text>
        </View>
        <View style={styles.welcomeIcon}>
          <MaterialIcons name="dashboard" size={40} color="#207E06" />
        </View>
      </View>

      {/* Admin Menu */}
      <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
        {/* Verifications Section */}
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => navigateToSection('verifications')}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemIcon}>
            <MaterialIcons name="verified-user" size={28} color="#207E06" />
            {notificationCounts.verifications > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{notificationCounts.verifications}</Text>
              </View>
            )}
          </View>
          <View style={styles.menuItemText}>
            <Text style={styles.menuItemTitle}>Recycler Verifications</Text>
            <Text style={styles.menuItemSubtitle}>Review and approve recycler applications</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#207E06" />
        </TouchableOpacity>

        {/* Users Management */}
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => navigateToSection('users')}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemIcon}>
            <MaterialIcons name="people" size={28} color="#207E06" />
          </View>
          <View style={styles.menuItemText}>
            <Text style={styles.menuItemTitle}>User Management</Text>
            <Text style={styles.menuItemSubtitle}>View and manage all users</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#207E06" />
        </TouchableOpacity>

        {/* Online Recyclers */}
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => navigateToSection('online-recyclers')}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemIcon}>
            <MaterialIcons name="recycling" size={28} color="#207E06" />
          </View>
          <View style={styles.menuItemText}>
            <Text style={styles.menuItemTitle}>Online Recyclers</Text>
            <Text style={styles.menuItemSubtitle}>Monitor recycler online status and activity</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#207E06" />
        </TouchableOpacity>

        {/* Analytics */}
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => navigateToSection('analytics')}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemIcon}>
            <MaterialIcons name="analytics" size={28} color="#207E06" />
          </View>
          <View style={styles.menuItemText}>
            <Text style={styles.menuItemTitle}>Analytics</Text>
            <Text style={styles.menuItemSubtitle}>View platform statistics and reports</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#207E06" />
        </TouchableOpacity>

        {/* Subscription Management */}
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => navigateToSection('subscriptions')}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemIcon}>
            <MaterialIcons name="account-balance-wallet" size={28} color="#207E06" />
          </View>
          <View style={styles.menuItemText}>
            <Text style={styles.menuItemTitle}>Subscription Management</Text>
            <Text style={styles.menuItemSubtitle}>Track recycler subscription fees and payments</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#207E06" />
        </TouchableOpacity>

        {/* Notifications */}
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => navigateToSection('notifications')}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemIcon}>
            <MaterialIcons name="notifications" size={28} color="#207E06" />
            {notificationCounts.total > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{notificationCounts.total}</Text>
              </View>
            )}
          </View>
          <View style={styles.menuItemText}>
            <Text style={styles.menuItemTitle}>Notifications</Text>
            <Text style={styles.menuItemSubtitle}>View all admin notifications</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#207E06" />
        </TouchableOpacity>

        {/* Help & Support */}
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => navigateToSection('help')}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemIcon}>
            <MaterialIcons name="support-agent" size={28} color="#207E06" />
            {notificationCounts.helpMessages > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{notificationCounts.helpMessages}</Text>
              </View>
            )}
          </View>
          <View style={styles.menuItemText}>
            <Text style={styles.menuItemTitle}>Help & Support</Text>
            <Text style={styles.menuItemSubtitle}>Respond to user help messages</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#207E06" />
        </TouchableOpacity>

        {/* Settings */}
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => Alert.alert('Coming Soon', 'Settings section is under development.')}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemIcon}>
            <MaterialIcons name="settings" size={28} color="#207E06" />
          </View>
          <View style={styles.menuItemText}>
            <Text style={styles.menuItemTitle}>Settings</Text>
            <Text style={styles.menuItemSubtitle}>Platform configuration and preferences</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#207E06" />
        </TouchableOpacity>

        {/* Quick Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>Quick Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <MaterialIcons name="verified-user" size={24} color="#207E06" />
              <Text style={styles.statNumber}>{notificationCounts.verifications}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="people" size={24} color="#207E06" />
              <Text style={styles.statNumber}>{notificationCounts.totalUsers}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="recycling" size={24} color="#207E06" />
              <Text style={styles.statNumber}>{notificationCounts.onlineRecyclers}</Text>
              <Text style={styles.statLabel}>Online</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="support-agent" size={24} color="#207E06" />
              <Text style={styles.statNumber}>{notificationCounts.helpMessages}</Text>
              <Text style={styles.statLabel}>Help Messages</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingText: {
    fontSize: 18,
    color: '#207E06',
    fontWeight: '600',
    marginTop: 16,
  },
  header: {
    backgroundColor: '#207E06',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 8,
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerNotificationBadge: {
    backgroundColor: '#FF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    paddingHorizontal: 8,
  },
  headerNotificationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 8,
  },
  welcomeSection: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: -12,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  welcomeIcon: {
    backgroundColor: '#F0F8F0',
    borderRadius: 12,
    padding: 12,
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItemIcon: {
    backgroundColor: '#F0F8F0',
    borderRadius: 12,
    padding: 12,
    marginRight: 16,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  statsSection: {
    marginTop: 8,
    marginBottom: 40,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#207E06',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
});
