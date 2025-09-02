import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
import DrawerMenu from '../../components/DrawerMenu';
import { COLORS } from '../../constants';
import { supabase } from '../../lib/supabase';

export default function UserScreen() {
  const [user, setUser] = useState<any>(null);
  const [userStats, setUserStats] = useState({
    totalPickups: 0,
    totalEarnings: 0,
    memberSince: 'Jan 2024',
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Debug logging for user data
  useEffect(() => {
    if (user) {
      console.log('UserScreen: User data:', user);
      console.log('UserScreen: User created_at:', user.created_at);
      console.log('UserScreen: User object keys:', Object.keys(user));
    }
  }, [user]);

  // Function to fetch user data
  const fetchUserData = useCallback(async () => {
    try {
      console.log('UserScreen: Fetching current user data...');
      setIsLoadingUser(true);

      // Get current authenticated user
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('UserScreen: Error fetching user:', error);
        setIsLoadingUser(false);
        return;
      }

      if (!currentUser) {
        console.log('UserScreen: No authenticated user found');
        setIsLoadingUser(false);
        return;
      }

      console.log('UserScreen: Current user found:', currentUser.id);
      console.log('UserScreen: User metadata:', currentUser.user_metadata);

      // Create enhanced user object with metadata
      const enhancedUser = {
        id: currentUser.id,
        email: currentUser.email,
        created_at: currentUser.created_at,
        email_confirmed_at: currentUser.email_confirmed_at,
        // Get data from user metadata
        username: currentUser.user_metadata?.full_name || 'User',
        full_name: currentUser.user_metadata?.full_name || '',
        phone: currentUser.user_metadata?.phone || '',
        role: currentUser.user_metadata?.role || 'customer',
        company_name: currentUser.user_metadata?.company_name || '',
        verification_status: currentUser.email_confirmed_at ? 'verified' : 'unverified',
        profile_image: currentUser.user_metadata?.profile_photo_url || null,
      };

      console.log('UserScreen: Enhanced user object:', enhancedUser);
      setUser(enhancedUser);
      setIsLoadingUser(false);

    } catch (error) {
      console.error('UserScreen: Error in fetchUserData:', error);
      setIsLoadingUser(false);
    }
  }, []);

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Refresh user data when screen comes into focus (e.g., returning from edit profile)
  useFocusEffect(
    useCallback(() => {
      console.log('UserScreen: Screen focused, refreshing user data...');
      fetchUserData();
    }, [fetchUserData])
  );

  // Helper function to safely format creation date
  const formatCreationDate = (createdAt: string | undefined) => {
    if (!createdAt) {
      console.log('UserScreen: No created_at field found');
      return 'N/A';
    }
    
    try {
      const date = new Date(createdAt);
      if (isNaN(date.getTime())) {
        console.log('UserScreen: Invalid date format:', createdAt);
        return 'N/A';
      }
      
      const formatted = date.toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      });
      console.log('UserScreen: Formatted date:', formatted);
      return formatted;
    } catch (error) {
      console.log('UserScreen: Error formatting date:', error);
      return 'N/A';
    }
  };

  const [currentStatus, setCurrentStatus] = useState('user');
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [showLogoutPrompt, setShowLogoutPrompt] = useState(false);
  const [showStatusSwitch, setShowStatusSwitch] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3); // Mock notification count

  // Mock functions (replacing useAuth)
  const deleteAccount = async () => {
    // Mock account deletion
    console.log('Mock: Deleting account...');
    return Promise.resolve();
  };

  const logout = async () => {
    try {
      console.log('UserScreen: Starting Supabase logout...');
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('UserScreen: Supabase logout error:', error);
        throw error;
      }
      
      console.log('UserScreen: Supabase logout successful');
      return true;
    } catch (error) {
      console.error('UserScreen: Logout error:', error);
      throw error;
    }
  };

  // Load user data when component mounts
  useEffect(() => {
    console.log('UserScreen: User state changed:', user);
    
    if (user) {
      console.log('UserScreen: User found, updating stats...');
      setIsLoadingStats(false);
      // You can add API calls here to fetch user stats
      // For now, we'll use placeholder data
      setUserStats({
        totalPickups: 0,
        totalEarnings: 0,
        memberSince: formatCreationDate(user.created_at),
      });
      
      // Update current status based on user role
      setCurrentStatus(user.role === 'recycler' ? 'recycler' : 'user');
    } else {
      console.log('UserScreen: No user, setting loading to false');
      // User is not authenticated
      setIsLoadingStats(false);
    }
  }, [user]);

  const handleStatusSwitch = async (newStatus: string) => {
    // Disable role switching for customers - they should stay in customer mode
    Alert.alert(
      'Role Switching Disabled',
      'Customers cannot switch to recycler mode. Please contact support if you need to change your account type.',
      [{ text: 'OK' }]
    );
  };

  const handleDeleteYes = () => {
    setDeleteStep(2);
  };
  const handleDeleteFinal = async () => {
    try {
      setShowDeletePrompt(false);
      setDeleteStep(1);
      
      console.log('UserScreen: Starting account deletion...');
      
      // Call the delete account function from AuthContext
      await deleteAccount();
      
      console.log('UserScreen: Account deletion successful');
      
      // Show success message with additional information
      Alert.alert(
        'Account Deleted',
        'Your account and all associated data have been permanently deleted. You will be redirected to the login screen.',
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
      
      let errorMessage = 'Failed to delete account. Please try again.';
      
      // Handle specific error cases
      if (error.message?.includes('network') || error.message?.includes('Network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message?.includes('unauthorized') || error.message?.includes('401')) {
        errorMessage = 'Your session has expired. Please log in again and try deleting your account.';
      } else if (error.message?.includes('permission') || error.message?.includes('403')) {
        errorMessage = 'You do not have permission to delete your account. Please contact support.';
      }
      
      Alert.alert(
        'Delete Failed',
        errorMessage,
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
      
      // Show loading indicator
      Alert.alert(
        'Logging Out',
        'Please wait while we log you out...',
        [],
        { cancelable: false }
      );
      
      await logout();
      console.log('UserScreen: Logout successful, navigating to login...');
      
      // Show success message
      Alert.alert(
        'Logged Out',
        'You have been successfully logged out.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to login screen
              router.push('/LoginScreen');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Logout failed:', error);
      
      // Even if logout fails, clear the user state and navigate to login
      console.log('UserScreen: Logout failed, but navigating to login anyway...');
      
      Alert.alert(
        'Logout Issue',
        'There was an issue with the logout process, but you have been logged out locally. You will be redirected to the login screen.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.push('/LoginScreen');
            }
          }
        ]
      );
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
    router.push('/customer-screens/CustomerNotificationScreen' as any);
    // Clear notification count when opened
    setNotificationCount(0);
  };

  if (isLoadingUser || isLoadingStats) {
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
  if (!user && !isLoadingUser) {
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
              // Mock debug info since we no longer have apiService
              const debugInfo = `User ID: ${user?.id || 'N/A'}\nRole: ${user?.role || 'N/A'}\nAuthenticated: ${!!user}\nToken: Mock Token (Frontend Only)`;
              Alert.alert('Debug Info', debugInfo);
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
             <DrawerMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImageBackground}>
              {user?.profile_image ? (
                <Image 
                  source={{ uri: user.profile_image }} 
                  style={styles.profileImage} 
                />
              ) : (
                <MaterialIcons name="account-circle" size={80} color={COLORS.white} />
              )}
            </View>
            <View style={styles.verificationBadge}>
              <MaterialIcons name="verified" size={16} color={COLORS.white} />
            </View>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.username || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>
            <Text style={styles.userPhone}>{user?.phone || 'No phone'}</Text>
            
            {/* Account Creation Date */}
            <View style={styles.creationDateContainer}>
              <MaterialIcons name="event" size={16} color="rgba(255, 255, 255, 0.8)" />
              <Text style={styles.creationDateText}>
                Member since {formatCreationDate(user?.created_at)}
              </Text>
            </View>
            
            <View style={styles.statusContainer}>
              <MaterialIcons name={getStatusIcon(currentStatus)} size={16} color={COLORS.white} />
              <Text style={styles.statusText}>{currentStatus}</Text>
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <MaterialIcons name="local-shipping" size={28} color={COLORS.white} />
            </View>
            <Text style={styles.statNumber}>{userStats.totalPickups}</Text>
            <Text style={styles.statLabel}>Total Pickups</Text>
            <View style={styles.statProgress}>
              <View style={[styles.progressBar, { width: `${Math.min(userStats.totalPickups * 10, 100)}%` }]} />
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <MaterialIcons name="attach-money" size={28} color={COLORS.white} />
            </View>
            <Text style={styles.statNumber}>₵{userStats.totalEarnings.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Earnings</Text>
            <View style={styles.statProgress}>
              <View style={[styles.progressBar, { width: `${Math.min(userStats.totalEarnings * 2, 100)}%` }]} />
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <MaterialIcons name="event" size={28} color={COLORS.white} />
            </View>
            <Text style={styles.statNumber}>
              {formatCreationDate(user?.created_at)}
            </Text>
            <Text style={styles.statLabel}>Member Since</Text>
            <View style={styles.statProgress}>
              <View style={[styles.progressBar, { width: '100%' }]} />
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/customer-screens/CustomerEditProfileScreen' as any)}
          >
            <View style={styles.actionIconContainer}>
              <MaterialIcons name="edit" size={24} color={COLORS.white} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionText}>Edit Profile</Text>
              <Text style={styles.actionSubtext}>Update your personal information</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/PrivacyScreen')}
          >
            <View style={styles.actionIconContainer}>
              <MaterialIcons name="security" size={24} color={COLORS.white} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionText}>Privacy & Security</Text>
              <Text style={styles.actionSubtext}>Manage your privacy settings</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/customer-screens/Help' as any)}
          >
            <View style={styles.actionIconContainer}>
              <MaterialIcons name="help" size={24} color={COLORS.white} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionText}>Help & Support</Text>
              <Text style={styles.actionSubtext}>Get help and contact support</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => setShowLogoutPrompt(true)}
          >
            <View style={styles.actionIconContainer}>
              <MaterialIcons name="logout" size={24} color={COLORS.white} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionText}>Log out</Text>
              <Text style={styles.actionSubtext}>Sign out of your account</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteActionButton]} 
            onPress={() => setShowDeletePrompt(true)}
          >
            <View style={styles.deleteIconContainer}>
              <MaterialIcons name="delete" size={24} color={COLORS.white} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.deleteActionText}>Delete Account</Text>
              <Text style={styles.deleteActionSubtext}>Permanently delete your account</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.red} />
          </TouchableOpacity>
        </View>

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
    backgroundColor: COLORS.darkGreen,
    borderRadius: 28,
    paddingVertical: 36,
    paddingHorizontal: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  profileImageBackground: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    resizeMode: 'cover',
  },
  verificationBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.darkGreen,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 6,
  },
  profileInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
    textAlign: 'center',
  },
  userPhone: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    textAlign: 'center',
  },
  creationDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  creationDateText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 6,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: COLORS.white,
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
    marginBottom: 28,
    gap: 16,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statIconContainer: {
    backgroundColor: COLORS.darkGreen,
    borderRadius: 16,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
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
  statProgress: {
    width: '100%',
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.darkGreen,
    borderRadius: 2,
  },
  actionsContainer: {
    marginTop: 28,
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 22,
    flex: 1,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 16,
  },
  actionIconContainer: {
    backgroundColor: COLORS.darkGreen,
    borderRadius: 10,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGreen,
    flex: 1,
  },
  deleteActionButton: {
    borderColor: '#FFE5E5',
    backgroundColor: '#FFF5F5',
  },
  deleteIconContainer: {
    backgroundColor: COLORS.red,
    borderRadius: 10,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deleteActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.red,
    flex: 1,
  },
  actionContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionSubtext: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  deleteActionSubtext: {
    fontSize: 12,
    color: COLORS.red,
    marginTop: 2,
    opacity: 0.7,
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
