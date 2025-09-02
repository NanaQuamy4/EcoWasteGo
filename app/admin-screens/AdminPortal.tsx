import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { isAdminUser } from '../../lib/adminConfig';
import { supabase } from '../../lib/supabase';

export default function AdminPortal() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

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

  const handleLogout = async () => {
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
      default:
        Alert.alert('Coming Soon', 'This section is under development.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <MaterialIcons name="admin-panel-settings" size={48} color="#207E06" />
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
            <MaterialIcons name="admin-panel-settings" size={32} color="#FFFFFF" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Admin Portal</Text>
            <Text style={styles.headerSubtitle}>EcoWasteGo Management</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <MaterialIcons name="logout" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeText}>Welcome back, Admin! 👋</Text>
          <Text style={styles.subtitleText}>Manage your EcoWasteGo platform efficiently</Text>
        </View>
        <View style={styles.welcomeIcon}>
          <MaterialIcons name="dashboard" size={32} color="#207E06" />
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
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="people" size={24} color="#207E06" />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="trending-up" size={24} color="#207E06" />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>This Week</Text>
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
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
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
