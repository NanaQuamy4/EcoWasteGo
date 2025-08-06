import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
import DrawerMenu from '../../components/DrawerMenu';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';

export default function UserScreen() {
  const { user, logout, switchRole, deleteAccount, isLoading } = useAuth();
  const [userStats, setUserStats] = useState({
    totalPickups: 0,
    totalEarnings: 0,
    memberSince: 'Jan 2024',
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const [currentStatus, setCurrentStatus] = useState(user?.role === 'recycler' ? 'recycler' : 'user');
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [showLogoutPrompt, setShowLogoutPrompt] = useState(false);
  const [showStatusSwitch, setShowStatusSwitch] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3); // Mock notification count

  // Load user data when component mounts
  useEffect(() => {
    console.log('UserScreen: User state changed:', user);
    console.log('UserScreen: Loading state:', isLoading);
    
    if (user) {
      console.log('UserScreen: User found, updating stats...');
      setIsLoadingStats(false);
      // You can add API calls here to fetch user stats
      // For now, we'll use placeholder data
      setUserStats({
        totalPickups: 0,
        totalEarnings: 0,
        memberSince: new Date(user.created_at).toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        }),
      });
      
      // Update current status based on user role
      setCurrentStatus(user.role === 'recycler' ? 'recycler' : 'user');
    } else if (!isLoading) {
      console.log('UserScreen: No user and not loading, setting loading to false');
      // User is not authenticated and loading is complete
      setIsLoadingStats(false);
    }
  }, [user, isLoading]);

  const handleStatusSwitch = async (newStatus: string) => {
    try {
      // Map the UI status to the API role
      const newRole = newStatus === 'user' ? 'customer' : 'recycler';
      
      // Call the switchRole function from AuthContext
      await switchRole(newRole);
      
      setCurrentStatus(newStatus);
      setShowStatusSwitch(false);
      
      // Show success message
      Alert.alert(
        'Role Switched',
        `You are now in ${newStatus} mode.`,
        [{ text: 'OK' }]
      );
      
      // Navigate based on the new role
      if (newRole === 'recycler') {
        router.replace('/(recycler-tabs)');
      } else {
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Role switch failed:', error);
      Alert.alert(
        'Error',
        'Failed to switch role. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleDeleteYes = () => {
    setDeleteStep(2);
  };
  const handleDeleteFinal = async () => {
    try {
      setShowDeletePrompt(false);
      setDeleteStep(1);
      
      // Call the delete account function from AuthContext
      await deleteAccount();
      
      // Show success message and navigate
      Alert.alert(
        'Account Deleted',
        'Your account has been permanently deleted.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to login screen
              router.replace('/LoginScreen');
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Delete account failed:', error);
      Alert.alert(
        'Delete Failed',
        error.message || 'Failed to delete account. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };
  const handleDeleteNo = () => {
    setShowDeletePrompt(false);
    setDeleteStep(1);
  };
  const handleLogoutYes = async () => {
    setShowLogoutPrompt(false);
    try {
      console.log('UserScreen: Starting logout...');
      await logout();
      console.log('UserScreen: Logout successful, navigating to login...');
      router.push('/LoginScreen');
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, clear the user state and navigate to login
      console.log('UserScreen: Logout failed, but navigating to login anyway...');
      router.push('/LoginScreen');
    }
  };
  const handleLogoutNo = () => {
    setShowLogoutPrompt(false);
  };

  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const getStatusColor = (status: string) => {
    return status === 'recycler' ? COLORS.darkGreen : COLORS.primary;
  };

  const getStatusIcon = (status: string) => {
    return status === 'recycler' ? 'recycling' : 'verified-user';
  };

  const handleNotificationPress = () => {
    // Navigate to notifications screen or show notification panel
    router.push('/NotificationScreen');
    // Clear notification count when opened
    setNotificationCount(0);
  };

  if (isLoadingStats) {
    return (
      <View style={styles.container}>
        <AppHeader 
          onMenuPress={() => setDrawerOpen(true)} 
          onNotificationPress={handleNotificationPress}
          notificationCount={notificationCount}
        />
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.loadingText}>Loading user data...</Text>
        </View>
      </View>
    );
  }

  // Show login prompt if user is not authenticated
  if (!user && !isLoading) {
    return (
      <View style={styles.container}>
        <AppHeader 
          onMenuPress={() => setDrawerOpen(true)} 
          onNotificationPress={handleNotificationPress}
          notificationCount={notificationCount}
        />
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <MaterialIcons name="account-circle" size={80} color={COLORS.darkGreen} />
          <Text style={styles.userName}>Not Logged In</Text>
          <Text style={styles.userEmail}>Please log in to view your profile</Text>
          <TouchableOpacity 
            style={[styles.actionButton, { marginTop: 20 }]}
            onPress={() => router.push('/LoginScreen')}
          >
            <MaterialIcons name="login" size={20} color="white" />
            <Text style={[styles.actionText, { color: 'white' }]}>Login</Text>
          </TouchableOpacity>
          
          {/* Debug button */}
          <TouchableOpacity 
            style={[styles.actionButton, { marginTop: 10, backgroundColor: 'orange' }]}
            onPress={() => {
              console.log('Debug: Current token:', apiService.getToken());
              console.log('Debug: Is authenticated:', apiService.isAuthenticated());
              Alert.alert('Debug Info', `Token: ${apiService.getToken()}\nAuthenticated: ${apiService.isAuthenticated()}`);
            }}
          >
            <Text style={[styles.actionText, { color: 'white' }]}>Debug Auth</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader 
        onMenuPress={() => setDrawerOpen(true)} 
        onNotificationPress={handleNotificationPress}
        notificationCount={notificationCount}
      />
      <DrawerMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} user={{
        name: user?.username || 'User',
        email: user?.email,
        phone: user?.phone,
        status: user?.role,
        type: user?.role === 'recycler' ? 'recycler' : 'user'
      }} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <MaterialIcons name="account-circle" size={80} color={COLORS.darkGreen} />
          </View>
          <Text style={styles.userName}>{user?.username || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>
          <Text style={styles.userPhone}>{user?.phone || 'No phone'}</Text>
          
          <View style={styles.statusContainer}>
            <MaterialIcons name={getStatusIcon(currentStatus)} size={16} color={getStatusColor(currentStatus)} />
            <Text style={[styles.statusText, { color: getStatusColor(currentStatus) }]}>{currentStatus}</Text>
          </View>
        </View>

        {/* Status Switch Section */}
        <View style={styles.statusSection}>
          <View style={styles.statusRow}>
            <MaterialIcons name="swap-horiz" size={16} color={COLORS.darkGreen} />
            <Text style={styles.statusLabel}>Switch Mode</Text>
            <TouchableOpacity 
              style={styles.switchButton}
              onPress={() => setShowStatusSwitch(true)}
            >
              <Text style={styles.switchButtonText}>Switch</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialIcons name="local-shipping" size={24} color={COLORS.darkGreen} />
            <Text style={styles.statNumber}>{userStats.totalPickups}</Text>
            <Text style={styles.statLabel}>Total Pickups</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="attach-money" size={24} color={COLORS.darkGreen} />
            <Text style={styles.statNumber}>₵{userStats.totalEarnings.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Earnings</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="event" size={24} color={COLORS.darkGreen} />
            <Text style={styles.statNumber}>{userStats.memberSince}</Text>
            <Text style={styles.statLabel}>Member Since</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/EditProfileScreen')}
          >
            <MaterialIcons name="edit" size={20} color={COLORS.darkGreen} />
            <Text style={styles.actionText}>Edit Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/PrivacyScreen')}
          >
            <MaterialIcons name="security" size={20} color={COLORS.darkGreen} />
            <Text style={styles.actionText}>Privacy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/Help')}
          >
            <MaterialIcons name="help" size={20} color={COLORS.darkGreen} />
            <Text style={styles.actionText}>Help & Support</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/RecyclerRegistrationScreen')}
          >
            <MaterialIcons name="recycling" size={20} color={COLORS.darkGreen} />
            <Text style={styles.actionText}>Join as a Recycler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => setShowLogoutPrompt(true)}
          >
            <MaterialIcons name="logout" size={20} color={COLORS.darkGreen} />
            <Text style={styles.actionText}>Log out</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => setShowDeletePrompt(true)}
          >
            <MaterialIcons name="delete" size={20} color={COLORS.red} />
            <Text style={[styles.actionText, { color: COLORS.red }]}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* Status Switch Modal */}
        {showStatusSwitch && (
          <View style={styles.statusSwitchContainer} pointerEvents="box-none">
            <View style={styles.statusSwitchModal}>
              <Text style={styles.statusSwitchTitle}>Switch Status</Text>
              <TouchableOpacity 
                style={[styles.statusOption, currentStatus === 'user' && styles.statusOptionActive]} 
                onPress={() => handleStatusSwitch('user')}
              >
                <MaterialIcons name="verified-user" size={20} color={currentStatus === 'user' ? '#fff' : COLORS.darkGreen} />
                <Text style={[styles.statusOptionText, currentStatus === 'user' && styles.statusOptionTextActive]}>User</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.statusOption, currentStatus === 'recycler' && styles.statusOptionActive]} 
                onPress={() => handleStatusSwitch('recycler')}
              >
                <MaterialIcons name="recycling" size={20} color={currentStatus === 'recycler' ? '#fff' : COLORS.darkGreen} />
                <Text style={[styles.statusOptionText, currentStatus === 'recycler' && styles.statusOptionTextActive]}>Recycler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowStatusSwitch(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Prompts */}
        {showLogoutPrompt && (
          <View style={styles.promptContainer}>
            <Text style={styles.promptText}>Do you want to log out?</Text>
            <View style={styles.promptActions}>
              <TouchableOpacity onPress={handleLogoutYes} style={styles.promptYes}>
                <Text style={styles.promptYesText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogoutNo} style={styles.promptNo}>
                <Text style={styles.promptNoText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {showDeletePrompt && (
          <View style={styles.promptContainer}>
            {deleteStep === 1 ? (
              <>
                <Text style={styles.promptText}>
                  Are you sure you want to{"\n"}permanently delete the account?
                </Text>
                <View style={styles.promptActions}>
                  <TouchableOpacity onPress={handleDeleteYes} style={styles.promptYes}>
                    <Text style={styles.promptYesText}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleDeleteNo} style={styles.promptNo}>
                    <Text style={styles.promptNoText}>No</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteFinal}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
                <Text style={styles.promptText}>
                  Are you sure you want to{"\n"}permanently delete the account?
                </Text>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FFF0',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F2FFE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 4,
    borderColor: COLORS.darkGreen,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 6,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  userPhone: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2FFE5',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 0,
    borderWidth: 2,
    borderColor: COLORS.darkGreen,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statusSection: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginBottom: 0,
  },
  statusLabel: {
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    fontSize: 16,
  },
  switchButton: {
    backgroundColor: COLORS.darkGreen,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    elevation: 4,
    minWidth: 60,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  switchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 12,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statNumber: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  actionsContainer: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGreen,
    marginLeft: 12,
  },
  statusSwitchContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  statusSwitchModal: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    width: '85%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  statusSwitchTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 24,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  statusOptionActive: {
    backgroundColor: COLORS.darkGreen,
    borderColor: COLORS.darkGreen,
  },
  statusOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginLeft: 12,
    flex: 1,
  },
  statusOptionTextActive: {
    color: '#fff',
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  promptContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    alignSelf: 'center',
    width: '80%',
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 10,
  },
  promptText: {
    color: '#333',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  promptActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  promptYes: {
    backgroundColor: COLORS.darkGreen,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  promptYesText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  promptNo: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  promptNoText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#FF4444',
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.darkGreen,
    fontWeight: 'bold',
  },
}); 